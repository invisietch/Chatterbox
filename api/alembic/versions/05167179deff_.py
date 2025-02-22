"""empty message

Revision ID: 05167179deff
Revises: 222beecf78d1
Create Date: 2025-01-17 22:57:43.539722

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '05167179deff'
down_revision = '222beecf78d1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('character', sa.Column('image', sa.String(), nullable=True))
    op.add_column('persona', sa.Column('image', sa.String(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('persona', 'image')
    op.drop_column('character', 'image')
    # ### end Alembic commands ###
