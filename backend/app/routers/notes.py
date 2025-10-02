"""
API routes for note management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..dependencies import get_current_user
from ..models import User
from ..schemas.note import (
    NoteCreate, NoteUpdate, NoteResponse, NoteListResponse, NoteSearchFilters
)
from ..services.note_service import NoteService
import math

router = APIRouter(prefix="/notes", tags=["notes"])


@router.post("/", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    note_data: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new note for a lecture."""
    note = NoteService.create_note(db, current_user.id, note_data)
    return note


@router.get("/", response_model=NoteListResponse)
async def get_user_notes(
    lecture_id: Optional[int] = Query(None, description="Filter by lecture ID"),
    course_id: Optional[int] = Query(None, description="Filter by course ID"),
    search: Optional[str] = Query(None, max_length=200, description="Search in note content"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get paginated list of user's notes with optional filtering."""
    filters = NoteSearchFilters(
        lecture_id=lecture_id,
        course_id=course_id,
        search=search,
        page=page,
        per_page=per_page
    )
    
    notes, total = NoteService.get_user_notes(db, current_user.id, filters)
    
    total_pages = math.ceil(total / per_page)
    
    return NoteListResponse(
        notes=notes,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1
    )


@router.get("/lecture/{lecture_id}", response_model=list[NoteResponse])
async def get_lecture_notes(
    lecture_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all notes for a specific lecture."""
    notes = NoteService.get_lecture_notes(db, current_user.id, lecture_id)
    return notes


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific note by ID."""
    note = NoteService.get_note(db, current_user.id, note_id)
    return note


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: int,
    note_data: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing note."""
    note = NoteService.update_note(db, current_user.id, note_id, note_data)
    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a note."""
    NoteService.delete_note(db, current_user.id, note_id)
    return None