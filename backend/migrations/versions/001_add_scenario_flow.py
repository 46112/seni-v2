"""Add scenario_flow column

Revision ID: 001
Revises: 
Create Date: 2025-01-18 10:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add scenario_flow column as JSON
    op.add_column('agents', sa.Column('scenario_flow', postgresql.JSON(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    # Remove scenario_flow column
    op.drop_column('agents', 'scenario_flow')