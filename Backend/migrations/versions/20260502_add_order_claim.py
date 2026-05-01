"""add claim columns to orders

Revision ID: 20260502_add_order_claim
Revises: 20260501_add_username
Create Date: 2026-05-02

Ajoute le système de "claim" / verrou sur les commandes :
  - claimed_by_id     : id de l'admin qui traite la commande (NULL = libre)
  - claimed_at        : datetime du dernier "touch" sur le claim (sert à l'expiration 30 min)

Le claim est libéré soit :
  - manuellement (l'admin clique sur "Libérer")
  - automatiquement quand claimed_at < NOW() - 30 min (vérifié à la lecture)
  - automatiquement quand la commande passe en 'completed' / 'rejected' / 'refunded'
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260502_add_order_claim"
down_revision = "20260501_add_username"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column("claimed_by_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "orders",
        sa.Column("claimed_at", sa.DateTime(), nullable=True),
    )
    op.create_foreign_key(
        "fk_orders_claimed_by_users",
        "orders",
        "users",
        ["claimed_by_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_orders_claimed_by_id",
        "orders",
        ["claimed_by_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_orders_claimed_by_id", table_name="orders")
    op.drop_constraint("fk_orders_claimed_by_users", "orders", type_="foreignkey")
    op.drop_column("orders", "claimed_at")
    op.drop_column("orders", "claimed_by_id")
