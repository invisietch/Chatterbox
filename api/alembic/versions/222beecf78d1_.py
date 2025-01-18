"""empty message

Revision ID: 222beecf78d1
Revises: 63eb31ce1044
Create Date: 2025-01-17 00:33:30.284513

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '222beecf78d1'
down_revision = '63eb31ce1044'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('persona',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_persona_id'), 'persona', ['id'], unique=False)
    op.create_table('prompt',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_prompt_id'), 'prompt', ['id'], unique=False)
    op.add_column('conversation', sa.Column('persona_id', sa.Integer(), nullable=True))
    op.add_column('conversation', sa.Column('prompt_id', sa.Integer(), nullable=True))
    op.create_foreign_key(None, 'conversation', 'prompt', ['prompt_id'], ['id'])
    op.create_foreign_key(None, 'conversation', 'persona', ['persona_id'], ['id'])
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, 'conversation', type_='foreignkey')
    op.drop_constraint(None, 'conversation', type_='foreignkey')
    op.drop_column('conversation', 'prompt_id')
    op.drop_column('conversation', 'persona_id')
    op.drop_index(op.f('ix_prompt_id'), table_name='prompt')
    op.drop_table('prompt')
    op.drop_index(op.f('ix_persona_id'), table_name='persona')
    op.drop_table('persona')
    # ### end Alembic commands ###
