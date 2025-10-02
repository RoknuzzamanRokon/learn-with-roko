"""
Service layer for note management operations.
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from typing import Optional, Tuple
from ..models import Note, Lecture, Course, Enrollment
from ..schemas.note import NoteCreate, NoteUpdate, NoteSearchFilters
from fastapi import HTTPException, status
import math


class NoteService:
    """Service class for note operations."""

    @staticmethod
    def create_note(db: Session, user_id: int, note_data: NoteCreate) -> Note:
        """
        Create a new note for a lecture.
        
        Args:
            db: Database session
            user_id: ID of the user creating the note
            note_data: Note creation data
            
        Returns:
            Created note object
            
        Raises:
            HTTPException: If lecture not found or user not enrolled
        """
        # Verify lecture exists and user is enrolled in the course
        lecture = db.query(Lecture).filter(Lecture.id == note_data.lecture_id).first()
        if not lecture:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lecture not found"
            )
        
        # Check if user is enrolled in the course
        enrollment = db.query(Enrollment).filter(
            and_(
                Enrollment.user_id == user_id,
                Enrollment.course_id == lecture.section.course_id
            )
        ).first()
        
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be enrolled in this course to create notes"
            )
        
        # Create the note
        note = Note(
            user_id=user_id,
            lecture_id=note_data.lecture_id,
            content=note_data.content,
            timestamp=note_data.timestamp
        )
        
        db.add(note)
        db.commit()
        db.refresh(note)
        
        return note

    @staticmethod
    def get_note(db: Session, user_id: int, note_id: int) -> Note:
        """
        Get a specific note by ID.
        
        Args:
            db: Database session
            user_id: ID of the user requesting the note
            note_id: ID of the note to retrieve
            
        Returns:
            Note object
            
        Raises:
            HTTPException: If note not found or access denied
        """
        note = db.query(Note).filter(
            and_(Note.id == note_id, Note.user_id == user_id)
        ).first()
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )
        
        return note

    @staticmethod
    def update_note(db: Session, user_id: int, note_id: int, note_data: NoteUpdate) -> Note:
        """
        Update an existing note.
        
        Args:
            db: Database session
            user_id: ID of the user updating the note
            note_id: ID of the note to update
            note_data: Note update data
            
        Returns:
            Updated note object
            
        Raises:
            HTTPException: If note not found or access denied
        """
        note = NoteService.get_note(db, user_id, note_id)
        
        # Update fields if provided
        if note_data.content is not None:
            note.content = note_data.content
        if note_data.timestamp is not None:
            note.timestamp = note_data.timestamp
        
        db.commit()
        db.refresh(note)
        
        return note

    @staticmethod
    def delete_note(db: Session, user_id: int, note_id: int) -> bool:
        """
        Delete a note.
        
        Args:
            db: Database session
            user_id: ID of the user deleting the note
            note_id: ID of the note to delete
            
        Returns:
            True if deleted successfully
            
        Raises:
            HTTPException: If note not found or access denied
        """
        note = NoteService.get_note(db, user_id, note_id)
        
        db.delete(note)
        db.commit()
        
        return True

    @staticmethod
    def get_user_notes(
        db: Session, 
        user_id: int, 
        filters: NoteSearchFilters
    ) -> Tuple[list[Note], int]:
        """
        Get paginated list of user's notes with optional filtering.
        
        Args:
            db: Database session
            user_id: ID of the user
            filters: Search and filter criteria
            
        Returns:
            Tuple of (notes list, total count)
        """
        query = db.query(Note).filter(Note.user_id == user_id)
        
        # Apply filters
        if filters.lecture_id:
            query = query.filter(Note.lecture_id == filters.lecture_id)
        
        if filters.course_id:
            # Join with lecture and section to filter by course
            query = query.join(Lecture).join(Lecture.section).filter(
                Lecture.section.has(course_id=filters.course_id)
            )
        
        if filters.search:
            query = query.filter(Note.content.ilike(f"%{filters.search}%"))
        
        # Get total count
        total = query.count()
        
        # Apply pagination and ordering
        notes = query.order_by(desc(Note.created_at)).offset(
            (filters.page - 1) * filters.per_page
        ).limit(filters.per_page).all()
        
        return notes, total

    @staticmethod
    def get_lecture_notes(db: Session, user_id: int, lecture_id: int) -> list[Note]:
        """
        Get all notes for a specific lecture by the user.
        
        Args:
            db: Database session
            user_id: ID of the user
            lecture_id: ID of the lecture
            
        Returns:
            List of notes for the lecture
        """
        # Verify user is enrolled in the course
        lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
        if not lecture:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lecture not found"
            )
        
        enrollment = db.query(Enrollment).filter(
            and_(
                Enrollment.user_id == user_id,
                Enrollment.course_id == lecture.section.course_id
            )
        ).first()
        
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be enrolled in this course to view notes"
            )
        
        return db.query(Note).filter(
            and_(Note.user_id == user_id, Note.lecture_id == lecture_id)
        ).order_by(Note.timestamp.asc().nulls_last(), Note.created_at.asc()).all()