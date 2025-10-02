#!/usr/bin/env python3
"""
Database management script for the Learning Management System.
This script provides various database operations including initialization, migration, and seeding.
"""

import os
import sys
import argparse
import subprocess
from pathlib import Path

def run_command(command, description):
    """
    Run a shell command and return success status.
    """
    print(f"\n{description}...")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ {description} completed successfully!")
            if result.stdout.strip():
                print(result.stdout)
            return True
        else:
            print(f"❌ {description} failed!")
            if result.stdout.strip():
                print("STDOUT:", result.stdout)
            if result.stderr.strip():
                print("STDERR:", result.stderr)
            return False
            
    except Exception as e:
        print(f"Error running command: {e}")
        return False

def init_database():
    """
    Initialize the database with tables and seed data.
    """
    print("Initializing database...")
    return run_command("pipenv run python app/init_db.py", "Database initialization")

def run_migrations():
    """
    Run Alembic migrations.
    """
    return run_command("pipenv run alembic upgrade head", "Database migration")

def create_migration(message):
    """
    Create a new migration.
    """
    command = f'pipenv run alembic revision --autogenerate -m "{message}"'
    return run_command(command, f"Creating migration: {message}")

def reset_database():
    """
    Reset the database by dropping and recreating all tables.
    """
    print("\n⚠️  WARNING: This will delete all data in the database!")
    confirm = input("Are you sure you want to continue? (yes/no): ")
    
    if confirm.lower() != 'yes':
        print("Operation cancelled.")
        return False
    
    # Drop all tables and recreate
    success = run_command("pipenv run python -c \"from app.database import Base, engine; Base.metadata.drop_all(bind=engine); Base.metadata.create_all(bind=engine)\"", "Resetting database")
    
    if success:
        # Seed initial data
        return run_command("pipenv run python app/init_db.py", "Seeding initial data")
    
    return False

def check_database():
    """
    Check database connection and show current migration status.
    """
    print("Checking database connection...")
    
    # Check connection
    success = run_command("pipenv run python -c \"from app.database import engine; engine.connect(); print('Database connection successful!')\"", "Database connection test")
    
    if success:
        # Show migration status
        run_command("pipenv run alembic current", "Current migration status")
        run_command("pipenv run alembic history", "Migration history")
    
    return success

def main():
    """
    Main function with command line argument parsing.
    """
    parser = argparse.ArgumentParser(description="Learning Management System Database Management")
    parser.add_argument("command", choices=["init", "migrate", "create-migration", "reset", "check"], 
                       help="Database operation to perform")
    parser.add_argument("-m", "--message", help="Migration message (for create-migration)")
    
    args = parser.parse_args()
    
    # Change to the backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    print("Learning Management System - Database Management")
    print("=" * 50)
    
    success = False
    
    if args.command == "init":
        success = init_database()
    elif args.command == "migrate":
        success = run_migrations()
    elif args.command == "create-migration":
        if not args.message:
            print("Error: Migration message is required. Use -m 'Your message here'")
            return False
        success = create_migration(args.message)
    elif args.command == "reset":
        success = reset_database()
    elif args.command == "check":
        success = check_database()
    
    if success:
        print(f"\n✅ {args.command.title()} operation completed successfully!")
    else:
        print(f"\n❌ {args.command.title()} operation failed!")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)