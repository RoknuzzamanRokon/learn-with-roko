"""add_system_settings_models

Revision ID: add_system_settings_models
Revises: add_taxonomy_models
Create Date: 2025-01-02 10:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'd2e3f4g5h6i7'
down_revision = 'c1d2e3f4g5h6'
branch_labels = None
depends_on = None


def upgrade():
    # Create system_settings table
    op.create_table('system_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('setting_key', sa.String(length=100), nullable=False),
        sa.Column('setting_type', sa.String(length=50), nullable=False),
        sa.Column('display_name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('string_value', sa.Text(), nullable=True),
        sa.Column('json_value', sa.JSON(), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False),
        sa.Column('is_editable', sa.Boolean(), nullable=False),
        sa.Column('validation_rules', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_system_settings_id'), 'system_settings', ['id'], unique=False)
    op.create_index(op.f('ix_system_settings_setting_key'), 'system_settings', ['setting_key'], unique=True)
    op.create_index(op.f('ix_system_settings_setting_type'), 'system_settings', ['setting_type'], unique=False)

    # Create email_templates table
    op.create_table('email_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('template_key', sa.String(length=100), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('subject', sa.String(length=500), nullable=False),
        sa.Column('html_content', sa.Text(), nullable=False),
        sa.Column('text_content', sa.Text(), nullable=True),
        sa.Column('variables', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_system', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_email_templates_id'), 'email_templates', ['id'], unique=False)
    op.create_index(op.f('ix_email_templates_template_key'), 'email_templates', ['template_key'], unique=True)

    # Create payment_gateway_configurations table
    op.create_table('payment_gateway_configurations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('gateway_name', sa.String(length=50), nullable=False),
        sa.Column('display_name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('configuration', sa.JSON(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_test_mode', sa.Boolean(), nullable=False),
        sa.Column('supported_currencies', sa.JSON(), nullable=True),
        sa.Column('commission_rate', sa.String(length=10), nullable=False),
        sa.Column('processing_fee', sa.String(length=10), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_payment_gateway_configurations_id'), 'payment_gateway_configurations', ['id'], unique=False)
    op.create_index(op.f('ix_payment_gateway_configurations_gateway_name'), 'payment_gateway_configurations', ['gateway_name'], unique=True)


def downgrade():
    # Drop tables in reverse order
    op.drop_index(op.f('ix_payment_gateway_configurations_gateway_name'), table_name='payment_gateway_configurations')
    op.drop_index(op.f('ix_payment_gateway_configurations_id'), table_name='payment_gateway_configurations')
    op.drop_table('payment_gateway_configurations')
    op.drop_index(op.f('ix_email_templates_template_key'), table_name='email_templates')
    op.drop_index(op.f('ix_email_templates_id'), table_name='email_templates')
    op.drop_table('email_templates')
    op.drop_index(op.f('ix_system_settings_setting_type'), table_name='system_settings')
    op.drop_index(op.f('ix_system_settings_setting_key'), table_name='system_settings')
    op.drop_index(op.f('ix_system_settings_id'), table_name='system_settings')
    op.drop_table('system_settings')