# Importing models to ensure they are registered for migrations
from .models import Base, Conversation, Message, Tag, ConversationTag, Character, Persona, Prompt

# Importing the database setup
from .api import get_db
from .database import init_db
