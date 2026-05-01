"""add username to users

Revision ID: 20260501_add_username
Revises: 4477b1cab840
Create Date: 2026-05-01
"""
from alembic import op
import sqlalchemy as sa
from typing import Sequence, Union

revision: str = "20260501_add_username"
down_revision: Union[str, None] = "4477b1cab840"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1) Colonne nullable
    op.add_column(
        "users",
        sa.Column("username", sa.String(length=20), nullable=True),
    )
    # 2) Unicité stricte (case-sensitive au niveau SQL).
    #    La couche applicative bloque déjà les collisions case-insensitive
    #    avant insertion (lookup LOWER(username) côté Python).
    op.create_unique_constraint("uq_users_username", "users", ["username"])


def downgrade() -> None:
    op.drop_constraint("uq_users_username", "users", type_="unique")
    op.drop_column("users", "username")
