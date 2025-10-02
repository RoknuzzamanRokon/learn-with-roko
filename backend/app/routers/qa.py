"""
API routes for Q&A and discussion management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from ..database import get_db
from ..dependencies import get_current_user
from ..models import User
from ..schemas.qa import (
    QAQuestionCreate, QAQuestionUpdate, QAQuestionResponse, QAQuestionListResponse,
    QAAnswerCreate, QAAnswerUpdate, QAAnswerResponse,
    QASearchFilters, QAModerationAction, QAAnswerModerationAction
)
from ..services.qa_service import QAService
import math

router = APIRouter(prefix="/qa", tags=["qa"])


@router.post("/questions", response_model=QAQuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(
    question_data: QAQuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new Q&A question for a lecture."""
    question = QAService.create_question(db, current_user.id, question_data)
    
    # Format response with user name
    response = QAQuestionResponse(
        id=question.id,
        user_id=question.user_id,
        lecture_id=question.lecture_id,
        title=question.title,
        content=question.content,
        timestamp=question.timestamp,
        is_answered=question.is_answered,
        is_featured=question.is_featured,
        created_at=question.created_at,
        updated_at=question.updated_at,
        user_name=question.user.full_name,
        answers=[]
    )
    
    return response


@router.get("/questions", response_model=QAQuestionListResponse)
async def get_questions(
    lecture_id: Optional[int] = Query(None, description="Filter by lecture ID"),
    course_id: Optional[int] = Query(None, description="Filter by course ID"),
    is_answered: Optional[bool] = Query(None, description="Filter by answered status"),
    is_featured: Optional[bool] = Query(None, description="Filter by featured status"),
    search: Optional[str] = Query(None, max_length=200, description="Search in question title and content"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get paginated list of Q&A questions with optional filtering."""
    filters = QASearchFilters(
        lecture_id=lecture_id,
        course_id=course_id,
        is_answered=is_answered,
        is_featured=is_featured,
        search=search,
        page=page,
        per_page=per_page
    )
    
    questions, total = QAService.get_questions(db, current_user.id, filters)
    
    # Format response with user names
    formatted_questions = []
    for question in questions:
        formatted_answers = [
            QAAnswerResponse(
                id=answer.id,
                user_id=answer.user_id,
                question_id=answer.question_id,
                content=answer.content,
                is_instructor_answer=answer.is_instructor_answer,
                is_accepted=answer.is_accepted,
                created_at=answer.created_at,
                updated_at=answer.updated_at,
                user_name=answer.user.full_name
            )
            for answer in question.answers
        ]
        
        formatted_question = QAQuestionResponse(
            id=question.id,
            user_id=question.user_id,
            lecture_id=question.lecture_id,
            title=question.title,
            content=question.content,
            timestamp=question.timestamp,
            is_answered=question.is_answered,
            is_featured=question.is_featured,
            created_at=question.created_at,
            updated_at=question.updated_at,
            user_name=question.user.full_name,
            answers=formatted_answers
        )
        formatted_questions.append(formatted_question)
    
    total_pages = math.ceil(total / per_page)
    
    return QAQuestionListResponse(
        questions=formatted_questions,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1
    )


@router.get("/questions/lecture/{lecture_id}", response_model=List[QAQuestionResponse])
async def get_lecture_questions(
    lecture_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all questions for a specific lecture."""
    questions = QAService.get_lecture_questions(db, current_user.id, lecture_id)
    
    # Format response with user names
    formatted_questions = []
    for question in questions:
        formatted_answers = [
            QAAnswerResponse(
                id=answer.id,
                user_id=answer.user_id,
                question_id=answer.question_id,
                content=answer.content,
                is_instructor_answer=answer.is_instructor_answer,
                is_accepted=answer.is_accepted,
                created_at=answer.created_at,
                updated_at=answer.updated_at,
                user_name=answer.user.full_name
            )
            for answer in question.answers
        ]
        
        formatted_question = QAQuestionResponse(
            id=question.id,
            user_id=question.user_id,
            lecture_id=question.lecture_id,
            title=question.title,
            content=question.content,
            timestamp=question.timestamp,
            is_answered=question.is_answered,
            is_featured=question.is_featured,
            created_at=question.created_at,
            updated_at=question.updated_at,
            user_name=question.user.full_name,
            answers=formatted_answers
        )
        formatted_questions.append(formatted_question)
    
    return formatted_questions


@router.get("/questions/{question_id}", response_model=QAQuestionResponse)
async def get_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific Q&A question by ID."""
    question = QAService.get_question(db, current_user.id, question_id)
    
    # Format response with user names
    formatted_answers = [
        QAAnswerResponse(
            id=answer.id,
            user_id=answer.user_id,
            question_id=answer.question_id,
            content=answer.content,
            is_instructor_answer=answer.is_instructor_answer,
            is_accepted=answer.is_accepted,
            created_at=answer.created_at,
            updated_at=answer.updated_at,
            user_name=answer.user.full_name
        )
        for answer in question.answers
    ]
    
    return QAQuestionResponse(
        id=question.id,
        user_id=question.user_id,
        lecture_id=question.lecture_id,
        title=question.title,
        content=question.content,
        timestamp=question.timestamp,
        is_answered=question.is_answered,
        is_featured=question.is_featured,
        created_at=question.created_at,
        updated_at=question.updated_at,
        user_name=question.user.full_name,
        answers=formatted_answers
    )


@router.put("/questions/{question_id}", response_model=QAQuestionResponse)
async def update_question(
    question_id: int,
    question_data: QAQuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing Q&A question."""
    question = QAService.update_question(db, current_user.id, question_id, question_data)
    
    return QAQuestionResponse(
        id=question.id,
        user_id=question.user_id,
        lecture_id=question.lecture_id,
        title=question.title,
        content=question.content,
        timestamp=question.timestamp,
        is_answered=question.is_answered,
        is_featured=question.is_featured,
        created_at=question.created_at,
        updated_at=question.updated_at,
        user_name=question.user.full_name,
        answers=[]
    )


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a Q&A question."""
    QAService.delete_question(db, current_user.id, question_id)
    return None


@router.post("/answers", response_model=QAAnswerResponse, status_code=status.HTTP_201_CREATED)
async def create_answer(
    answer_data: QAAnswerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new answer to a Q&A question."""
    answer = QAService.create_answer(db, current_user.id, answer_data)
    
    return QAAnswerResponse(
        id=answer.id,
        user_id=answer.user_id,
        question_id=answer.question_id,
        content=answer.content,
        is_instructor_answer=answer.is_instructor_answer,
        is_accepted=answer.is_accepted,
        created_at=answer.created_at,
        updated_at=answer.updated_at,
        user_name=answer.user.full_name
    )


@router.put("/answers/{answer_id}", response_model=QAAnswerResponse)
async def update_answer(
    answer_id: int,
    answer_data: QAAnswerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing Q&A answer."""
    answer = QAService.update_answer(db, current_user.id, answer_id, answer_data)
    
    return QAAnswerResponse(
        id=answer.id,
        user_id=answer.user_id,
        question_id=answer.question_id,
        content=answer.content,
        is_instructor_answer=answer.is_instructor_answer,
        is_accepted=answer.is_accepted,
        created_at=answer.created_at,
        updated_at=answer.updated_at,
        user_name=answer.user.full_name
    )


@router.delete("/answers/{answer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_answer(
    answer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a Q&A answer."""
    QAService.delete_answer(db, current_user.id, answer_id)
    return None


# Moderation endpoints
@router.put("/questions/{question_id}/moderate", response_model=QAQuestionResponse)
async def moderate_question(
    question_id: int,
    moderation_data: QAModerationAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Moderate a Q&A question (instructor only)."""
    question = QAService.moderate_question(db, current_user.id, question_id, moderation_data)
    
    return QAQuestionResponse(
        id=question.id,
        user_id=question.user_id,
        lecture_id=question.lecture_id,
        title=question.title,
        content=question.content,
        timestamp=question.timestamp,
        is_answered=question.is_answered,
        is_featured=question.is_featured,
        created_at=question.created_at,
        updated_at=question.updated_at,
        user_name=question.user.full_name,
        answers=[]
    )


@router.put("/answers/{answer_id}/moderate", response_model=QAAnswerResponse)
async def moderate_answer(
    answer_id: int,
    moderation_data: QAAnswerModerationAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Moderate a Q&A answer (instructor only)."""
    answer = QAService.moderate_answer(db, current_user.id, answer_id, moderation_data)
    
    return QAAnswerResponse(
        id=answer.id,
        user_id=answer.user_id,
        question_id=answer.question_id,
        content=answer.content,
        is_instructor_answer=answer.is_instructor_answer,
        is_accepted=answer.is_accepted,
        created_at=answer.created_at,
        updated_at=answer.updated_at,
        user_name=answer.user.full_name
    )