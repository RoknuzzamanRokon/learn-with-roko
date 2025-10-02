"""add_taxonomy_models

Revision ID: add_taxonomy_models
Revises: 45e8b1bb9b5e
Create Date: 2025-01-02 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'c1d2e3f4g5h6'
down_revision = '45e8b1bb9b5e'
branch_labels = None
depends_on = None


def upgrade():
    # Create tags table
    op.create_table('tags',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('color', sa.String(length=7), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tags_id'), 'tags', ['id'], unique=False)
    op.create_index(op.f('ix_tags_name'), 'tags', ['name'], unique=True)

    # Create difficulty_configurations table
    op.create_table('difficulty_configurations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('level_key', sa.String(length=50), nullable=False),
        sa.Column('display_name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False),
        sa.Column('color', sa.String(length=7), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_difficulty_configurations_id'), 'difficulty_configurations', ['id'], unique=False)
    op.create_index(op.f('ix_difficulty_configurations_level_key'), 'difficulty_configurations', ['level_key'], unique=True)

    # Create course_tags association table
    op.create_table('course_tags',
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ),
        sa.PrimaryKeyConstraint('course_id', 'tag_id')
    )

    # Insert default difficulty configurations
    op.execute("""
        INSERT INTO difficulty_configurations (level_key, display_name, description, order_index, color, is_active)
        VALUES 
        ('beginner', 'Beginner', 'Perfect for those new to the subject', 1, '#22C55E', true),
        ('intermediate', 'Intermediate', 'For those with some basic knowledge', 2, '#F59E0B', true),
        ('advanced', 'Advanced', 'For experienced learners looking to deepen their knowledge', 3, '#EF4444', true)
    """)


def downgrade():
    # Drop tables in reverse order
    op.drop_table('course_tags')
    op.drop_index(op.f('ix_difficulty_configurations_level_key'), table_name='difficulty_configurations')
    op.drop_index(op.f('ix_difficulty_configurations_id'), table_name='difficulty_configurations')
    op.drop_table('difficulty_configurations')
    op.drop_index(op.f('ix_tags_name'), table_name='tags')
    op.drop_index(op.f('ix_tags_id'), table_name='tags')
    op.drop_table('tags')