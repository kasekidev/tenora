"""rename hash_password to password_hash

Revision ID: 2e4ab9ac4643
Revises: a306142a9dd7
Create Date: 2026-03-05 14:56:21.819949

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = '2e4ab9ac4643'
down_revision: Union[str, None] = 'a306142a9dd7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('users', 'hash_password', new_column_name='password_hash')


def downgrade() -> None:
   op.alter_column('users', 'password_hash', new_column_name='hash_password')
