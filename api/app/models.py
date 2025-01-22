from sqlalchemy import Column, String, Text, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Character(Base):
    __tablename__ = "character"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    scenario = Column(Text, nullable=True)
    personality = Column(Text, nullable=True)
    description = Column(Text, nullable=False)
    first_message = Column(Text, nullable=False)
    example_messages = Column(Text, nullable=True)
    post_history_instructions = Column(Text, nullable=True)
    image = Column(String, nullable=True)

    conversations = relationship("Conversation", back_populates="character")

class Conversation(Base):
    __tablename__ = 'conversation'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    character_id = Column(Integer, ForeignKey('character.id'), nullable=True)
    persona_id = Column(Integer, ForeignKey('persona.id'), nullable=True)
    prompt_id = Column(Integer, ForeignKey('prompt.id'), nullable=True)

    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    tags = relationship("ConversationTag", back_populates="conversation", cascade="all, delete-orphan")
    character = relationship("Character", back_populates="conversations")
    persona = relationship("Persona", back_populates="conversations")
    prompt = relationship("Prompt", back_populates="conversations")

class Persona(Base):
    __tablename__ = 'persona'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    image = Column(String, nullable=True)

    conversations = relationship("Conversation", back_populates="persona")

class Prompt(Base):
    __tablename__ = 'prompt'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    content = Column(Text, nullable=False)

    conversations = relationship("Conversation", back_populates="prompt")

class Message(Base):
    __tablename__ = 'message'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    conversation_id = Column(Integer, ForeignKey('conversation.id'), nullable=False)
    author = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    rejected = Column(Text, nullable=True)
    order = Column(Integer, nullable=False)

    conversation = relationship("Conversation", back_populates="messages")

class TagCategory(Base):
    __tablename__ = 'tag_category'

    name = Column(String, primary_key=True)
    color = Column(String, nullable=False)

    tags = relationship("Tag", back_populates="category", cascade="all, delete-orphan")

class Tag(Base):
    __tablename__ = 'tag'

    name = Column(String, primary_key=True)
    category_name = Column(String, ForeignKey("tag_category.name"), nullable=True)

    category = relationship("TagCategory", back_populates="tags")
    conversations = relationship("ConversationTag", back_populates="tag", cascade="all, delete-orphan")

class ConversationTag(Base):
    __tablename__ = 'conversation_tag'

    conversation_id = Column(Integer, ForeignKey('conversation.id'), primary_key=True)
    tag_name = Column(String, ForeignKey('tag.name'), primary_key=True)

    conversation = relationship("Conversation", back_populates="tags")
    tag = relationship("Tag", back_populates="conversations")

class Preset(Base):
    __tablename__ = "presets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    samplers = Column(JSON, nullable=False)
    sampler_order = Column(JSON, nullable=False)
    model_name = Column(String, nullable=False)
    llm_url = Column(String, nullable=False)
    max_context = Column(Integer, nullable=False, server_default='16384')