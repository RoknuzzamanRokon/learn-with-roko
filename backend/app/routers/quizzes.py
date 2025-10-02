"""
API routes for quiz and assessment management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from ..database import get_db
from ..dependencies import get_current_user
from ..models import User
from ..schemas.quiz import (
    QuizCreate, QuizUpdate, QuizResponse, QuizSummaryResponse,
    QuestionCreate, QuestionUpdate, QuestionResponse,
    QuizAttemptSubmission, QuizAttemptResponse, QuizAttemptDetailResponse,
    QuizResultResponse
)
from ..services.quiz_service import QuizService

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


@router.post("/", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
async def create_quiz(
    quiz_data: QuizCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new quiz for a course."""
    quiz = QuizService.create_quiz(db, current_user.id, quiz_data)
    return quiz


@router.get("/course/{course_id}", response_model=List[QuizSummaryResponse])
async def get_course_quizzes(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all quizzes for a specific course."""
    quizzes = QuizService.get_course_quizzes(db, current_user.id, course_id)
    
    # Convert to summary response format
    quiz_summaries = []
    for quiz in quizzes:
        quiz_summary = QuizSummaryResponse(
            id=quiz.id,
            title=quiz.title,
            description=quiz.description,
            course_id=quiz.course_id,
            time_limit=quiz.time_limit,
            max_attempts=quiz.max_attempts,
            passing_score=quiz.passing_score,
            show_correct_answers=quiz.show_correct_answers,
            randomize_questions=quiz.randomize_questions,
            is_published=quiz.is_published,
            question_count=len(quiz.questions),
            total_points=sum(q.points for q in quiz.questions),
            created_at=quiz.created_at,
            updated_at=quiz.updated_at
        )
        quiz_summaries.append(quiz_summary)
    
    return quiz_summaries


@router.get("/{quiz_id}", response_model=QuizResponse)
async def get_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific quiz by ID."""
    quiz = QuizService.get_quiz(db, quiz_id, include_questions=True)
    
    # Check if user has access to this quiz
    is_instructor = quiz.course.instructor_id == current_user.id
    
    if not is_instructor and not quiz.is_published:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Quiz is not published"
        )
    
    return quiz


@router.put("/{quiz_id}", response_model=QuizResponse)
async def update_quiz(
    quiz_id: int,
    quiz_data: QuizUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing quiz."""
    quiz = QuizService.update_quiz(db, current_user.id, quiz_id, quiz_data)
    return quiz


@router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a quiz."""
    QuizService.delete_quiz(db, current_user.id, quiz_id)
    return None


# Question management endpoints
@router.post("/{quiz_id}/questions", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def add_question(
    quiz_id: int,
    question_data: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a question to a quiz."""
    question = QuizService.add_question(db, current_user.id, quiz_id, question_data)
    return question


@router.put("/questions/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: int,
    question_data: QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a quiz question."""
    question = QuizService.update_question(db, current_user.id, question_id, question_data)
    return question


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a quiz question."""
    QuizService.delete_question(db, current_user.id, question_id)
    return None


# Quiz attempt endpoints
@router.post("/{quiz_id}/attempts", response_model=QuizAttemptResponse, status_code=status.HTTP_201_CREATED)
async def start_quiz_attempt(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start a new quiz attempt."""
    attempt = QuizService.start_quiz_attempt(db, current_user.id, quiz_id)
    return attempt


@router.post("/attempts/{attempt_id}/submit", response_model=QuizResultResponse)
async def submit_quiz_attempt(
    attempt_id: int,
    submission: QuizAttemptSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit a quiz attempt with answers."""
    attempt = QuizService.submit_quiz_attempt(db, current_user.id, attempt_id, submission)
    
    # Get quiz with questions for result
    quiz = QuizService.get_quiz(db, attempt.quiz_id, include_questions=True)
    
    # Prepare result with feedback
    questions_with_feedback = []
    for question in quiz.questions:
        user_answer = attempt.answers.get(str(question.id), "") if attempt.answers else ""
        is_correct = QuizService._is_answer_correct(question, user_answer)
        
        question_feedback = {
            "id": question.id,
            "question_text": question.question_text,
            "question_type": question.question_type.value,
            "points": question.points,
            "user_answer": user_answer,
            "is_correct": is_correct,
            "correct_answer": question.correct_answer if quiz.show_correct_answers else None,
            "explanation": question.explanation if quiz.show_correct_answers and question.explanation else None,
            "options": question.options if question.options else None
        }
        questions_with_feedback.append(question_feedback)
    
    # Check if user can retake
    user_attempts = QuizService.get_user_quiz_attempts(db, current_user.id, quiz.id)
    can_retake = len(user_attempts) < quiz.max_attempts
    next_attempt_number = len(user_attempts) + 1 if can_retake else None
    
    quiz_summary = QuizSummaryResponse(
        id=quiz.id,
        title=quiz.title,
        description=quiz.description,
        course_id=quiz.course_id,
        time_limit=quiz.time_limit,
        max_attempts=quiz.max_attempts,
        passing_score=quiz.passing_score,
        show_correct_answers=quiz.show_correct_answers,
        randomize_questions=quiz.randomize_questions,
        is_published=quiz.is_published,
        question_count=len(quiz.questions),
        total_points=sum(q.points for q in quiz.questions),
        created_at=quiz.created_at,
        updated_at=quiz.updated_at
    )
    
    return QuizResultResponse(
        attempt=attempt,
        questions=questions_with_feedback,
        can_retake=can_retake,
        next_attempt_number=next_attempt_number
    )


@router.get("/attempts/{attempt_id}", response_model=QuizAttemptDetailResponse)
async def get_quiz_attempt(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific quiz attempt."""
    attempt = QuizService.get_quiz_attempt(db, current_user.id, attempt_id)
    
    # Get quiz summary
    quiz = QuizService.get_quiz(db, attempt.quiz_id, include_questions=False)
    quiz_summary = QuizSummaryResponse(
        id=quiz.id,
        title=quiz.title,
        description=quiz.description,
        course_id=quiz.course_id,
        time_limit=quiz.time_limit,
        max_attempts=quiz.max_attempts,
        passing_score=quiz.passing_score,
        show_correct_answers=quiz.show_correct_answers,
        randomize_questions=quiz.randomize_questions,
        is_published=quiz.is_published,
        question_count=len(quiz.questions),
        total_points=sum(q.points for q in quiz.questions),
        created_at=quiz.created_at,
        updated_at=quiz.updated_at
    )
    
    return QuizAttemptDetailResponse(
        id=attempt.id,
        user_id=attempt.user_id,
        quiz_id=attempt.quiz_id,
        attempt_number=attempt.attempt_number,
        score=attempt.score,
        total_points=attempt.total_points,
        earned_points=attempt.earned_points,
        is_completed=attempt.is_completed,
        is_passed=attempt.is_passed,
        started_at=attempt.started_at,
        completed_at=attempt.completed_at,
        time_taken=attempt.time_taken,
        answers=attempt.answers,
        quiz=quiz_summary
    )


@router.get("/{quiz_id}/attempts", response_model=List[QuizAttemptResponse])
async def get_user_quiz_attempts(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all attempts by the current user for a specific quiz."""
    attempts = QuizService.get_user_quiz_attempts(db, current_user.id, quiz_id)
    return attempts