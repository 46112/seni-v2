"""Add conversations table

Revision ID: 002
Revises: 001
Create Date: 2025-01-18 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create conversations table
    op.create_table('conversations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('agent_id', sa.Integer(), nullable=True),
        sa.Column('user_message', sa.Text(), nullable=False),
        sa.Column('agent_response', sa.Text(), nullable=False),
        sa.Column('emotion', sa.String(length=50), nullable=True),
        sa.Column('emotion_scores', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['agent_id'], ['agents.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_conversations_id'), 'conversations', ['id'], unique=False)


def downgrade() -> None:
    # Drop conversations table
    op.drop_index(op.f('ix_conversations_id'), table_name='conversations')
    op.drop_table('conversations')