"""
Main FastAPI application for the Learning Management System.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
import logging

from .database import create_tables
from .routers import auth

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title="Learning Management System API",
    description="A comprehensive LMS API supporting multiple user roles, course management, and learning analytics",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
from .routers import auth, roles, users, instructor_applications, courses, files, enrollments

app.include_router(auth.router, prefix="/api")
app.include_router(roles.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(instructor_applications.router, prefix="/api")
app.include_router(courses.router, prefix="/api")
app.include_router(files.router, prefix="/api")
app.include_router(enrollments.router, prefix="/api")

# Custom exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with custom response format."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": exc.errors()
            }
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions."""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An internal server error occurred"
            }
        }
    )

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup."""
    logger.info("Starting up Learning Management System API...")
    create_tables()
    logger.info("Database tables created successfully")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "message": "Learning Management System API is running"}

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Welcome to the Learning Management System API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }