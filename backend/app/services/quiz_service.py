"""
Service layer for quiz and assessment operations.
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, func
from typing import Optional, Tuple, List, Dict, Any
from ..models import Quiz, Question, QuizAttempt, Course, Enrollment, User
from ..schemas.quiz import (
    QuizCreate, QuizUpdate, QuestionCreate, QuestionUpdate, 
    QuizAttemptSubmission, QuizAttemptAnswer
)
from fastapi import HTTPException, status
import json
import math
from datetime import datetime


class QuizService:
    """Service class for quiz operations."""

    @staticmethod
    def create_quiz(db: Session, user_id: int, quiz_data: QuizCreate) -> Quiz:
        """
        Create a new quiz for a course.
        
        Args:
            db: Database session
            user_id: ID of the user creating the quiz (must be instructor)
            quiz_data: Quiz creation data
            
        Returns:
            Created quiz object
            
        Raises:
            HTTPException: If course not found or user not authorized
        """
        # Verify course exists and user is the instructor
        course = db.query(Course).filter(Course.id == quiz_data.course_id).first()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        if course.instructor_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the course instructor can create quizzes"
            )
        
        # Create the quiz
        quiz = Quiz(
            title=quiz_data.title,
            description=quiz_data.description,
            course_id=quiz_data.course_id,
            time_limit=quiz_data.time_limit,
            max_attempts=quiz_data.max_attempts,
            passing_score=quiz_data.passing_score,
            show_correct_answers=quiz_data.show_correct_answers,
            randomize_questions=quiz_data.randomize_questions
        )
        
        db.add(quiz)
        db.commit()
        db.refresh(quiz)
        
        return quiz

    @staticmethod
    def get_quiz(db: Session, quiz_id: int, include_questions: bool = True) -> Quiz:
        """
        Get a specific quiz by ID.
        
        Args:
            db: Database session
            quiz_id: ID of the quiz to retrieve
            include_questions: Whether to include questions in the response
            
        Returns:
            Quiz object
            
        Raises:
            HTTPException: If quiz not found
        """
        query = db.query(Quiz).filter(Quiz.id == quiz_id)
        
        if include_questions:
            query = query.options(db.joinedload(Quiz.questions))
        
        quiz = query.first()
        
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz not found"
            )
        
        return quiz

    @staticmethod
    def update_quiz(db: Session, user_id: int, quiz_id: int, quiz_data: QuizUpdate) -> Quiz:
        """
        Update an existing quiz.
        
        Args:
            db: Database session
            user_id: ID of the user updating the quiz
            quiz_id: ID of the quiz to update
            quiz_data: Quiz update data
            
        Returns:
            Updated quiz object
            
        Raises:
            HTTPException: If quiz not found or access denied
        """
        quiz = QuizService.get_quiz(db, quiz_id, include_questions=False)
        
        # Check if user is the instructor of the course
        if quiz.course.instructor_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the course instructor can update quizzes"
            )
        
        # Update fields if provided
        if quiz_data.title is not None:
            quiz.title = quiz_data.title
        if quiz_data.description is not None:
            quiz.description = quiz_data.description
        if quiz_data.time_limit is not None:
            quiz.time_limit = quiz_data.time_limit
        if quiz_data.max_attempts is not None:
            quiz.max_attempts = quiz_data.max_attempts
        if quiz_data.passing_score is not None:
            quiz.passing_score = quiz_data.passing_score
        if quiz_data.show_correct_answers is not None:
            quiz.show_correct_answers = quiz_data.show_correct_answers
        if quiz_data.randomize_questions is not None:
            quiz.randomize_questions = quiz_data.randomize_questions
        if quiz_data.is_published is not None:
            quiz.is_published = quiz_data.is_published
        
        db.commit()
        db.refresh(quiz)
        
        return quiz

    @staticmethod
    def delete_quiz(db: Session, user_id: int, quiz_id: int) -> bool:
        """
        Delete a quiz.
        
        Args:
            db: Database session
            user_id: ID of the user deleting the quiz
            quiz_id: ID of the quiz to delete
            
        Returns:
            True if deleted successfully
            
        Raises:
            HTTPException: If quiz not found or access denied
        """
        quiz = QuizService.get_quiz(db, quiz_id, include_questions=False)
        
        # Check if user is the instructor of the course
        if quiz.course.instructor_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the course instructor can delete quizzes"
            )
        
        db.delete(quiz)
        db.commit()
        
        return True

    @staticmethod
    def add_question(db: Session, user_id: int, quiz_id: int, question_data: QuestionCreate) -> Question:
        """
        Add a question to a quiz.
        
        Args:
            db: Database session
            user_id: ID of the user adding the question
            quiz_id: ID of the quiz
            question_data: Question creation data
            
        Returns:
            Created question object
            
        Raises:
            HTTPException: If quiz not found or access denied
        """
        quiz = QuizService.get_quiz(db, quiz_id, include_questions=False)
        
        # Check if user is the instructor of the course
        if quiz.course.instructor_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the course instructor can add questions"
            )
        
        # Create the question
        question = Question(
            quiz_id=quiz_id,
            question_text=question_data.question_text,
            question_type=question_data.question_type,
            order_index=question_data.order_index,
            points=question_data.points,
            options=question_data.options,
            correct_answer=question_data.correct_answer,
            explanation=question_data.explanation
        )
        
        db.add(question)
        db.commit()
        db.refresh(question)
        
        return question

    @staticmethod
    def update_question(db: Session, user_id: int, question_id: int, question_data: QuestionUpdate) -> Question:
        """
        Update a quiz question.
        
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
        question = db.query(Question).filter(Question.id == question_id).first()
        
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found"
            )
        
        # Check if user is the instructor of the course
        if question.quiz.course.instructor_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the course instructor can update questions"
            )
        
        # Update fields if provided
        if question_data.question_text is not None:
            question.question_text = question_data.question_text
        if question_data.question_type is not None:
            question.question_type = question_data.question_type
        if question_data.order_index is not None:
            question.order_index = question_data.order_index
        if question_data.points is not None:
            question.points = question_data.points
        if question_data.options is not None:
            question.options = question_data.options
        if question_data.correct_answer is not None:
            question.correct_answer = question_data.correct_answer
        if question_data.explanation is not None:
            question.explanation = question_data.explanation
        
        db.commit()
        db.refresh(question)
        
        return question

    @staticmethod
    def delete_question(db: Session, user_id: int, question_id: int) -> bool:
        """
        Delete a quiz question.
        
        Args:
            db: Database session
            user_id: ID of the user deleting the question
            question_id: ID of the question to delete
            
        Returns:
            True if deleted successfully
            
        Raises:
            HTTPException: If question not found or access denied
        """
        question = db.query(Question).filter(Question.id == question_id).first()
        
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found"
            )
        
        # Check if user is the instructor of the course
        if question.quiz.course.instructor_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the course instructor can delete questions"
            )
        
        db.delete(question)
        db.commit()
        
        return True

    @staticmethod
    def start_quiz_attempt(db: Session, user_id: int, quiz_id: int) -> QuizAttempt:
        """
        Start a new quiz attempt.
        
        Args:
            db: Database session
            user_id: ID of the user taking the quiz
            quiz_id: ID of the quiz
            
        Returns:
            Created quiz attempt object
            
        Raises:
            HTTPException: If quiz not found, not published, or max attempts reached
        """
        quiz = QuizService.get_quiz(db, quiz_id, include_questions=False)
        
        # Check if quiz is published
        if not quiz.is_published:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Quiz is not published"
            )
        
        # Check if user is enrolled in the course
        enrollment = db.query(Enrollment).filter(
            and_(
                Enrollment.user_id == user_id,
                Enrollment.course_id == quiz.course_id
            )
        ).first()
        
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be enrolled in this course to take the quiz"
            )
        
        # Check previous attempts
        previous_attempts = db.query(QuizAttempt).filter(
            and_(
                QuizAttempt.user_id == user_id,
                QuizAttempt.quiz_id == quiz_id
            )
        ).count()
        
        if previous_attempts >= quiz.max_attempts:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Maximum attempts reached for this quiz"
            )
        
        # Create new attempt
        attempt = QuizAttempt(
            user_id=user_id,
            quiz_id=quiz_id,
            attempt_number=previous_attempts + 1,
            total_points=sum(q.points for q in quiz.questions)
        )
        
        db.add(attempt)
        db.commit()
        db.refresh(attempt)
        
        return attempt

    @staticmethod
    def submit_quiz_attempt(
        db: Session, 
        user_id: int, 
        attempt_id: int, 
        submission: QuizAttemptSubmission
    ) -> QuizAttempt:
        """
        Submit a quiz attempt with answers.
        
        Args:
            db: Database session
            user_id: ID of the user submitting the quiz
            attempt_id: ID of the quiz attempt
            submission: Quiz submission data
            
        Returns:
            Updated quiz attempt object with score
            
        Raises:
            HTTPException: If attempt not found or already completed
        """
        attempt = db.query(QuizAttempt).filter(
            and_(
                QuizAttempt.id == attempt_id,
                QuizAttempt.user_id == user_id
            )
        ).first()
        
        if not attempt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz attempt not found"
            )
        
        if attempt.is_completed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quiz attempt already completed"
            )
        
        # Get quiz with questions
        quiz = QuizService.get_quiz(db, attempt.quiz_id, include_questions=True)
        
        # Process answers and calculate score
        answers_dict = {str(answer.question_id): answer.answer for answer in submission.answers}
        earned_points = 0.0
        
        for question in quiz.questions:
            user_answer = answers_dict.get(str(question.id), "")
            
            # Check if answer is correct (basic string comparison for now)
            if QuizService._is_answer_correct(question, user_answer):
                earned_points += question.points
        
        # Calculate score percentage
        score = (earned_points / attempt.total_points * 100) if attempt.total_points > 0 else 0
        
        # Update attempt
        attempt.answers = answers_dict
        attempt.earned_points = earned_points
        attempt.score = score
        attempt.is_completed = True
        attempt.is_passed = score >= quiz.passing_score
        attempt.completed_at = datetime.utcnow()
        
        # Calculate time taken
        time_taken = (attempt.completed_at - attempt.started_at).total_seconds() / 60
        attempt.time_taken = int(time_taken)
        
        db.commit()
        db.refresh(attempt)
        
        return attempt

    @staticmethod
    def _is_answer_correct(question: Question, user_answer: str) -> bool:
        """
        Check if a user's answer is correct.
        
        Args:
            question: Question object
            user_answer: User's answer
            
        Returns:
            True if answer is correct, False otherwise
        """
        if not user_answer.strip():
            return False
        
        correct_answer = question.correct_answer.strip().lower()
        user_answer = user_answer.strip().lower()
        
        if question.question_type.value == "multiple_choice":
            return user_answer == correct_answer
        elif question.question_type.value == "true_false":
            return user_answer == correct_answer
        elif question.question_type.value == "short_answer":
            # For short answers, we can implement fuzzy matching later
            return user_answer == correct_answer
        else:
            # For essay questions, manual grading would be needed
            return False

    @staticmethod
    def get_quiz_attempt(db: Session, user_id: int, attempt_id: int) -> QuizAttempt:
        """
        Get a specific quiz attempt.
        
        Args:
            db: Database session
            user_id: ID of the user
            attempt_id: ID of the quiz attempt
            
        Returns:
            Quiz attempt object
            
        Raises:
            HTTPException: If attempt not found
        """
        attempt = db.query(QuizAttempt).filter(
            and_(
                QuizAttempt.id == attempt_id,
                QuizAttempt.user_id == user_id
            )
        ).first()
        
        if not attempt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz attempt not found"
            )
        
        return attempt

    @staticmethod
    def get_user_quiz_attempts(db: Session, user_id: int, quiz_id: int) -> List[QuizAttempt]:
        """
        Get all attempts by a user for a specific quiz.
        
        Args:
            db: Database session
            user_id: ID of the user
            quiz_id: ID of the quiz
            
        Returns:
            List of quiz attempts
        """
        return db.query(QuizAttempt).filter(
            and_(
                QuizAttempt.user_id == user_id,
                QuizAttempt.quiz_id == quiz_id
            )
        ).order_by(desc(QuizAttempt.started_at)).all()

    @staticmethod
    def get_course_quizzes(db: Session, user_id: int, course_id: int) -> List[Quiz]:
        """
        Get all published quizzes for a course.
        
        Args:
            db: Database session
            user_id: ID of the user
            course_id: ID of the course
            
        Returns:
            List of published quizzes
            
        Raises:
            HTTPException: If course not found or user not enrolled
        """
        # Check if user is enrolled in the course or is the instructor
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        is_instructor = course.instructor_id == user_id
        
        if not is_instructor:
            enrollment = db.query(Enrollment).filter(
                and_(
                    Enrollment.user_id == user_id,
                    Enrollment.course_id == course_id
                )
            ).first()
            
            if not enrollment:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You must be enrolled in this course to view quizzes"
                )
        
        # Return published quizzes for students, all quizzes for instructors
        query = db.query(Quiz).filter(Quiz.course_id == course_id)
        
        if not is_instructor:
            query = query.filter(Quiz.is_published == True)
        
        return query.order_by(Quiz.created_at.asc()).all()