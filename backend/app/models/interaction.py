"""
User interaction models for notes, Q&A, and discussions.
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


class Note(Base):
    """
    User notes on lectures with timestamps.
    """
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lecture_id = Column(Integer, ForeignKey("lectures.id"), nullable=False)
    
    # Note content
    content = Column(Text, nullable=False)
    timestamp = Column(Integer, nullable=True)  # Video timestamp in seconds
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="notes")
    lecture = relationship("Lecture", back_populates="notes")

    def __repr__(self):
        return f"<Note(id={self.id}, user_id={self.user_id}, lecture_id={self.lecture_id})>"


class QAQuestion(Base):
    """
    Questions asked by students on lectures.
    """
    __tablename__ = "qa_questions"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lecture_id = Column(Integer, ForeignKey("lectures.id"), nullable=False)
    
    # Question content
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    timestamp = Column(Integer, nullable=True)  # Video timestamp in seconds
    
    # Question status
    is_answered = Column(Boolean, default=False, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="qa_questions")
    lecture = relationship("Lecture", back_populates="qa_questions")
    answers = relationship("QAAnswer", back_populates="question", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<QAQuestion(id={self.id}, title='{self.title}', answered={self.is_answered})>"


class QAAnswer(Base):
    """
    Answers to Q&A questions, typically from instructors.
    """
    __tablename__ = "qa_answers"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # User who answered
    question_id = Column(Integer, ForeignKey("qa_questions.id"), nullable=False)
    
    # Answer content
    content = Column(Text, nullable=False)
    
    # Answer status
    is_instructor_answer = Column(Boolean, default=False, nullable=False)
    is_accepted = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="qa_answers")
    question = relationship("QAQuestion", back_populates="answers")

    def __repr__(self):
        return f"<QAAnswer(id={self.id}, question_id={self.question_id}, instructor={self.is_instructor_answer})>"