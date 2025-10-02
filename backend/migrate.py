#!/usr/bin/env python3
"""
Database migration script for the Learning Management System.
This script runs Alembic migrations to update the database schema.
"""

import os
import sys
import subprocess
from pathlib import Path

def run_migrations():
    """
    Run Alembic migrations to update the database schema.
    """
    try:
        # Change to the backend directory
        backend_dir = Path(__file__).parent
        os.chdir(backend_dir)
        
        print("Running database migrations...")
        
        # Run the migration
        result = subprocess.run(
            ["pipenv", "run", "alembic", "upgrade", "head"],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✅ Database migrations completed successfully!")
            print(result.stdout)
            return True
        else:
            print("❌ Database migration failed!")
            print("STDOUT:", result.stdout)
            print("STDERR:", result.stderr)
            return False
            
    except Exception as e:
        print(f"Error running migrations: {e}")
        return False

def main():
    """
    Main function to run migrations.
    """
    print("Learning Management System - Database Migration")
    print("=" * 50)
    
    success = run_migrations()
    
    if success:
        print("\nDatabase is now up to date!")
    else:
        print("\nMigration failed. Please check the error messages above.")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)