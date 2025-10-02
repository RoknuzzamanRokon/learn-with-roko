"""
Service layer for Q&A and discussion operations.
"""

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, func
from typing import Optional, Tuple, List
from ..models import QAQuestion, QAAnswer, Lecture, Course, Enrollment, User
from ..schemas.qa import (
    QAQuestionCreate, QAQuestionUpdate, QAAnswerCreate, QAAnswerUpdate,
    QASearchFilters, QAModerationAction, QAAnswerModerationAction
)
from fastapi import HTTPException, status
import math


class QAService:
    """Service class for Q&A operations."""

    @staticmethod
    def create_question(db: Session, user_id: int, question_data: QAQuestionCreate) -> QAQuestion:
        """
        Create a new Q&A question for a lecture.
        
        Args:
            db: Database session
            user_id: ID of the user creating the question
            question_data: Question creation data
            
        Returns:
            Created question object
            
        Raises:
            HTTPException: If lecture not found or user not enrolled
        """
        # Verify lecture exists and user is enrolled in the course
        lecture = db.query(Lecture).filter(Lecture.id == question_data.lecture_id).first()
        if not lecture:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lecture not found"
            )
        
        # Check if user is enrolled in the course or is the instructor
        course_id = lecture.section.course_id
        enrollment = db.query(Enrollment).filter(
            and_(
                Enrollment.user_id == user_id,
                Enrollment.course_id == course_id
            )
        ).first()
        
        is_instructor = lecture.section.course.instructor_id == user_id
        
        if not enrollment and not is_instructor:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be enrolled in this course to ask questions"
            )
        
        # Create the question
        question = QAQuestion(
            user_id=user_id,
            lecture_id=question_data.lecture_id,
            title=question_data.title,
            content=question_data.content,
            timestamp=question_data.timestamp
        )
        
        db.add(question)
        db.commit()
        db.refresh(question)
        
        return question

    @staticmethod
    def get_question(db: Session, user_id: int, question_id: int) -> QAQuestion:
        """
        Get a specific Q&A question by ID.
        
        Args:
            db: Database session
            user_id: ID of the user requesting the question
            question_id: ID of the question to retrieve
            
        Returns:
            Question object with answers
            
        Raises:
            HTTPException: If question not found or access denied
        """
        question = db.query(QAQuestion).options(
            joinedload(QAQuestion.answers).joinedload(QAAnswer.user),
            joinedload(QAQuestion.user)
        ).filter(QAQuestion.id == question_id).first()
        
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found"
            )
        
        # Check if user has access to this question (enrolled in course or instructor)
        course_id = question.lecture.section.course_id
        enrollment = db.query(Enrollment).filter(
            and_(
                Enrollment.user_id == user_id,
                Enrollment.course_id == course_id
            )
        ).first()
        
        is_instructor = question.lecture.section.course.instructor_id == user_id
        
        if not enrollment and not is_instructor:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be enrolled in this course to view questions"
            )
        
        return question

    @staticmethod
    def update_question(db: Session, user_id: int, question_id: int, question_data: QAQuestionUpdate) -> QAQuestion:
        """
        Update an existing Q&A question.
        
        Args:
            db: Database session
            user_id: ID of the user updating the question
            question_id: ID of the question to update
            question_data: Question update data
            
        Returns:
            Updated question object
            
        Raises:
            HTTPException: If question not found or access denied
        """
        question = db.query(QAQuestion).filter(QAQuestion.id == question_id).first()
        
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found"
            )
        
        # Only the question author can update the question
        if question.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own questions"
            )
        
        # Update fields if provided
        if question_data.title is not None:
            question.title = question_data.title
        if question_data.content is not None:
            question.content = question_data.content
        if question_data.timestamp is not None:
            question.timestamp = question_data.timestamp
        
        db.commit()
        db.refresh(question)
        
        return question

    @staticmethod
    def delete_question(db: Session, user_id: int, question_id: int) -> bool:
        """
        Delete a Q&A question.
        
        Args:
            db: Database session
            user_id: ID of the user deleting the question
            question_id: ID of the question to delete
            
        Returns:
            True if deleted successfully
            
        Raises:
            HTTPException: If question not found or access denied
        """
        question = db.query(QAQuestion).filter(QAQuestion.id == question_id).first()
        
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found"
            )
        
        # Only the question author or course instructor can delete the question
        is_instructor = question.lecture.section.course.instructor_id == user_id
        is_author = question.user_id == user_id
        
        if not is_author and not is_instructor:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own questions or questions in your courses"
            )
        
        db.delete(question)
        db.commit()
        
        return True

    @staticmethod
    def create_answer(db: Session, user_id: int, answer_data: QAAnswerCreate) -> QAAnswer:
        """
        Create a new answer to a Q&A question.
        
        Args:
            db: Database session
            user_id: ID of the user creating the answer
            answer_data: Answer creation data
            
        Returns:
            Created answer object
            
        Raises:
            HTTPException: If question not found or user not authorized
        """
        # Verify question exists and user has access
        question = db.query(QAQuestion).filter(QAQuestion.id == answer_data.question_id).first()
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found"
            )
        
        # Check if user is enrolled in the course or is the instructor
        course_id = question.lecture.section.course_id
        enrollment = db.query(Enrollment).filter(
            and_(
                Enrollment.user_id == user_id,
                Enrollment.course_id == course_id
            )
        ).first()
        
        is_instructor = question.lecture.section.course.instructor_id == user_id
        
        if not enrollment and not is_instructor:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be enrolled in this course to answer questions"
            )
        
        # Create the answer
        answer = QAAnswer(
            user_id=user_id,
            question_id=answer_data.question_id,
            content=answer_data.content,
            is_instructor_answer=is_instructor
        )
        
        db.add(answer)
        
        # Mark question as answered if this is an instructor answer
        if is_instructor:
            question.is_answered = True
        
        db.commit()
        db.refresh(answer)
        
        return answer

    @staticmethod
    def update_answer(db: Session, user_id: int, answer_id: int, answer_data: QAAnswerUpdate) -> QAAnswer:
        """
        Update an existing Q&A answer.
        
        Args:
            db: Database session
            user_id: ID of the user updating the answer
            answer_id: ID of the answer to update
            answer_data: Answer update data
            
        Returns:
            Updated answer object
            
        Raises:
            HTTPException: If answer not found or access denied
        """
        answer = db.query(QAAnswer).filter(QAAnswer.id == answer_id).first()
        
        if not answer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Answer not found"
            )
        
        # Only the answer author can update the answer
        if answer.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own answers"
            )
        
        # Update fields if provided
        if answer_data.content is not None:
            answer.content = answer_data.content
        
        db.commit()
        db.refresh(answer)
        
        return answer

    @staticmethod
    def delete_answer(db: Session, user_id: int, answer_id: int) -> bool:
        """
        Delete a Q&A answer.
        
        Args:
            db: Database session
            user_id: ID of the user deleting the answer
            answer_id: ID of the answer to delete
            
        Returns:
            True if deleted successfully
            
        Raises:
            HTTPException: If answer not found or access denied
        """
        answer = db.query(QAAnswer).filter(QAAnswer.id == answer_id).first()
        
        if not answer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Answer not found"
            )
        
        # Only the answer author or course instructor can delete the answer
        is_instructor = answer.question.lecture.section.course.instructor_id == user_id
        is_author = answer.user_id == user_id
        
        if not is_author and not is_instructor:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own answers or answers in your courses"
            )
        
        db.delete(answer)
        db.commit()
        
        return True

    @staticmethod
    def get_questions(
        db: Session, 
        user_id: int, 
        filters: QASearchFilters
    ) -> Tuple[List[QAQuestion], int]:
        """
        Get paginated list of Q&A questions with optional filtering.
        
        Args:
            db: Database session
            user_id: ID of the user
            filters: Search and filter criteria
            
        Returns:
            Tuple of (questions list, total count)
        """
        query = db.query(QAQuestion).options(
            joinedload(QAQuestion.answers).joinedload(QAAnswer.user),
            joinedload(QAQuestion.user)
        )
        
        # Apply filters
        if filters.lecture_id:
            query = query.filter(QAQuestion.lecture_id == filters.lecture_id)
        
        if filters.course_id:
            # Join with lecture and section to filter by course
            query = query.join(Lecture).join(Lecture.section).filter(
                Lecture.section.has(course_id=filters.course_id)
            )
        
        if filters.is_answered is not None:
            query = query.filter(QAQuestion.is_answered == filters.is_answered)
        
        if filters.is_featured is not None:
            query = query.filter(QAQuestion.is_featured == filters.is_featured)
        
        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.filter(
                or_(
                    QAQuestion.title.ilike(search_term),
                    QAQuestion.content.ilike(search_term)
                )
            )
        
        # Check access permissions - only show questions from courses user is enrolled in or instructs
        user_courses = db.query(Course.id).filter(
            or_(
                Course.instructor_id == user_id,
                Course.id.in_(
                    db.query(Enrollment.course_id).filter(Enrollment.user_id == user_id)
                )
            )
        ).subquery()
        
        query = query.join(Lecture).join(Lecture.section).filter(
            Lecture.section.has(course_id=user_courses.c.id)
        )
        
        # Get total count
        total = query.count()
        
        # Apply pagination and ordering
        questions = query.order_by(desc(QAQuestion.created_at)).offset(
            (filters.page - 1) * filters.per_page
        ).limit(filters.per_page).all()
        
        return questions, total

    @staticmethod
    def get_lecture_questions(db: Session, user_id: int, lecture_id: int) -> List[QAQuestion]:
        """
        Get all questions for a specific lecture.
        
        Args:
            db: Database session
            user_id: ID of the user
            lecture_id: ID of the lecture
            
        Returns:
            List of questions for the lecture
        """
        # Verify user has access to the lecture
        lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
        if not lecture:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lecture not found"
            )
        
        course_id = lecture.section.course_id
        enrollment = db.query(Enrollment).filter(
            and_(
                Enrollment.user_id == user_id,
                Enrollment.course_id == course_id
            )
        ).first()
        
        is_instructor = lecture.section.course.instructor_id == user_id
        
        if not enrollment and not is_instructor:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be enrolled in this course to view questions"
            )
        
        return db.query(QAQuestion).options(
            joinedload(QAQuestion.answers).joinedload(QAAnswer.user),
            joinedload(QAQuestion.user)
        ).filter(QAQuestion.lecture_id == lecture_id).order_by(
            desc(QAQuestion.is_featured),
            desc(QAQuestion.created_at)
        ).all()

    @staticmethod
    def moderate_question(
        db: Session, 
        user_id: int, 
        question_id: int, 
        moderation_data: QAModerationAction
    ) -> QAQuestion:
        """
        Moderate a Q&A question (instructor only).
        
        Args:
            db: Database session
            user_id: ID of the user performing moderation
            question_id: ID of the question to moderate
            moderation_data: Moderation actions
            
        Returns:
            Updated question object
            
        Raises:
            HTTPException: If question not found or user not authorized
        """
        question = db.query(QAQuestion).filter(QAQuestion.id == question_id).first()
        
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found"
            )
        
        # Only course instructor can moderate
        if question.lecture.section.course.instructor_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the course instructor can moderate questions"
            )
        
        # Apply moderation actions
        if moderation_data.is_featured is not None:
            question.is_featured = moderation_data.is_featured
        if moderation_data.is_answered is not None:
            question.is_answered = moderation_data.is_answered
        
        db.commit()
        db.refresh(question)
        
        return question

    @staticmethod
    def moderate_answer(
        db: Session, 
        user_id: int, 
        answer_id: int, 
        moderation_data: QAAnswerModerationAction
    ) -> QAAnswer:
        """
        Moderate a Q&A answer (instructor only).
        
        Args:
            db: Database session
            user_id: ID of the user performing moderation
            answer_id: ID of the answer to moderate
            moderation_data: Moderation actions
            
        Returns:
            Updated answer object
            
        Raises:
            HTTPException: If answer not found or user not authorized
        """
        answer = db.query(QAAnswer).filter(QAAnswer.id == answer_id).first()
        
        if not answer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Answer not found"
            )
        
        # Only course instructor can moderate
        if answer.question.lecture.section.course.instructor_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the course instructor can moderate answers"
            )
        
        # Apply moderation actions
        if moderation_data.is_accepted is not None:
            answer.is_accepted = moderation_data.is_accepted
        
        db.commit()
        db.refresh(answer)
        
        return answer