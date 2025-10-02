"""
Assessment and quiz models for the Learning Management System.
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float, Enum, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..database import Base


class QuestionType(enum.Enum):
    """Types of quiz questions."""
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    SHORT_ANSWER = "short_answer"
    ESSAY = "essay"


class Quiz(Base):
    """
    Quizzes associated with courses.
    """
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Foreign key
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    
    # Quiz settings
    time_limit = Column(Integer, nullable=True)  # in minutes, null means no time limit
    max_attempts = Column(Integer, default=1, nullable=False)
    passing_score = Column(Float, default=70.0, nullable=False)  # percentage
    show_correct_answers = Column(Boolean, default=True, nullable=False)
    randomize_questions = Column(Boolean, default=False, nullable=False)
    
    # Quiz status
    is_published = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    course = relationship("Course", back_populates="quizzes")
    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan", order_by="Question.order_index")
    quiz_attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Quiz(id={self.id}, title='{self.title}', course_id={self.course_id})>"


class Question(Base):
    """
    Individual questions within quizzes.
    """
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign key
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    
    # Question details
    question_text = Column(Text, nullable=False)
    question_type = Column(Enum(QuestionType), nullable=False)
    order_index = Column(Integer, nullable=False, default=0)
    points = Column(Float, default=1.0, nullable=False)
    
    # Question options and answers (stored as JSON)
    options = Column(JSON, nullable=True)  # For multiple choice questions
    correct_answer = Column(Text, nullable=False)  # Correct answer or answer key
    explanation = Column(Text, nullable=True)  # Explanation for the correct answer
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    quiz = relationship("Quiz", back_populates="questions")

    def __repr__(self):
        return f"<Question(id={self.id}, quiz_id={self.quiz_id}, type='{self.question_type.value}')>"


class QuizAttempt(Base):
    """
    User attempts at quizzes.
    """
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    
    # Attempt details
    attempt_number = Column(Integer, nullable=False)
    score = Column(Float, nullable=True)  # percentage score
    total_points = Column(Float, nullable=False, default=0.0)
    earned_points = Column(Float, nullable=False, default=0.0)
    
    # Attempt status
    is_completed = Column(Boolean, default=False, nullable=False)
    is_passed = Column(Boolean, default=False, nullable=False)
    
    # User answers (stored as JSON)
    answers = Column(JSON, nullable=True)
    
    # Timestamps
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    time_taken = Column(Integer, nullable=True)  # in minutes

    # Relationships
    user = relationship("User", back_populates="quiz_attempts")
    quiz = relationship("Quiz", back_populates="quiz_attempts")

    def __repr__(self):
        return f"<QuizAttempt(id={self.id}, user_id={self.user_id}, quiz_id={self.quiz_id}, score={self.score})>"