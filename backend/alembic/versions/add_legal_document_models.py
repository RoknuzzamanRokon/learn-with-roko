"""add_legal_document_models

Revision ID: add_legal_document_models
Revises: add_system_settings_models
Create Date: 2025-01-02 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'e3f4g5h6i7j8'
down_revision = 'd2e3f4g5h6i7'
branch_labels = None
depends_on = None


def upgrade():
    # Create legal_documents table
    op.create_table('legal_documents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('document_type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('slug', sa.String(length=100), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('version', sa.String(length=20), nullable=False),
        sa.Column('is_current', sa.Boolean(), nullable=False),
        sa.Column('previous_version_id', sa.Integer(), nullable=True),
        sa.Column('effective_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('is_published', sa.Boolean(), nullable=False),
        sa.Column('requires_acceptance', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['previous_version_id'], ['legal_documents.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_legal_documents_id'), 'legal_documents', ['id'], unique=False)
    op.create_index(op.f('ix_legal_documents_document_type'), 'legal_documents', ['document_type'], unique=False)
    op.create_index(op.f('ix_legal_documents_slug'), 'legal_documents', ['slug'], unique=False)

    # Create user_policy_acceptances table
    op.create_table('user_policy_acceptances',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('document_id', sa.Integer(), nullable=False),
        sa.Column('accepted_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('document_version', sa.String(length=20), nullable=False),
        sa.Column('document_type', sa.String(length=50), nullable=False),
        sa.ForeignKeyConstraint(['document_id'], ['legal_documents.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_policy_acceptances_id'), 'user_policy_acceptances', ['id'], unique=False)

    # Create policy_update_notifications table
    op.create_table('policy_update_notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('document_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('notification_type', sa.String(length=50), nullable=False),
        sa.Column('sent_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('viewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('acknowledged_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['document_id'], ['legal_documents.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_policy_update_notifications_id'), 'policy_update_notifications', ['id'], unique=False)


def downgrade():
    # Drop tables in reverse order
    op.drop_index(op.f('ix_policy_update_notifications_id'), table_name='policy_update_notifications')
    op.drop_table('policy_update_notifications')
    op.drop_index(op.f('ix_user_policy_acceptances_id'), table_name='user_policy_acceptances')
    op.drop_table('user_policy_acceptances')
    op.drop_index(op.f('ix_legal_documents_slug'), table_name='legal_documents')
    op.drop_index(op.f('ix_legal_documents_document_type'), table_name='legal_documents')
    op.drop_index(op.f('ix_legal_documents_id'), table_name='legal_documents')
    op.drop_table('legal_documents')