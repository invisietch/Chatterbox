from app.image_utils import get_image_path, save_image, validate_image
from app.count_tokens import count_tokens
from fastapi import Body, APIRouter, HTTPException, Depends, UploadFile, File, Query
from typing import Annotated, Optional, List
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import SessionLocal
from app.models import Character, Conversation, Message, Persona, Prompt, Tag, ConversationTag
from fastapi.responses import StreamingResponse, FileResponse
from io import StringIO
import json

router = APIRouter()

class CharacterCreate(BaseModel):
    name: str
    scenario: Optional[str] = None
    personality: Optional[str] = None
    description: str
    first_message: str
    example_messages: Optional[str] = None
    post_history_instructions: Optional[str] = None

class CharacterUpdate(BaseModel):
    name: Optional[str] = None
    scenario: Optional[str] = None
    personality: Optional[str] = None
    description: Optional[str] = None
    first_message: Optional[str] = None
    example_messages: Optional[str] = None
    post_history_instructions: Optional[str] = None

# Dependency for database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Add a conversation
@router.post("/conversations")
def add_conversation(
    name: Annotated[str, Body()], 
    description: Annotated[str, Body()], 
    character_id: Annotated[int, Body()] = None, 
    persona_id: Annotated[int, Body()] = None, 
    prompt_id: Annotated[int, Body()] = None, 
    db: Session = Depends(get_db)
):
    conversation = Conversation(name=name, description=description)

    if character_id:
        character = db.query(Character).filter_by(id=character_id).first()
        if not character:
            raise HTTPException(status_code=404, detail="Character not found")
        conversation.character_id = character_id
    if persona_id:
        persona = db.query(Persona).filter_by(id=persona_id).first()
        if not character:
            raise HTTPException(status_code=404, detail="Persona not found")
        conversation.persona_id = persona_id
    if prompt_id:
        persona = db.query(Prompt).filter_by(id=prompt_id).first()
        if not character:
            raise HTTPException(status_code=404, detail="Prompt not found")
        conversation.prompt_id = prompt_id

    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation

# Add a message to a conversation
@router.post("/conversations/{conversation_id}/messages")
def add_message(
    conversation_id: int, 
    author: Annotated[str, Body()], 
    content: Annotated[str, Body()], 
    rejected: Annotated[str, Body()] = None, 
    db: Session = Depends(get_db)
):
    conversation = db.query(Conversation).filter_by(id=conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    highest_order = db.query(Message.order).filter_by(conversation_id=conversation_id).order_by(Message.order.desc()).first()
    order = (highest_order[0] + 1) if highest_order else 1

    if author == 'assistant':
        message = Message(conversation_id=conversation_id, author=author, content=content, order=order, rejected=rejected)
    else:
        message = Message(conversation_id=conversation_id, author=author, content=content, order=order)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message

# Add a tag to a conversation
@router.post("/conversations/{conversation_id}/tags/{tag_name}")
def add_tag(conversation_id: int, tag_name: str, db: Session = Depends(get_db)):
    tag = db.query(Tag).filter_by(name=tag_name).first()
    if not tag:
        tag = Tag(name=tag_name)
        db.add(tag)
        db.commit()

    conversation_tag = db.query(ConversationTag).filter_by(conversation_id=conversation_id, tag_name=tag_name).first()
    if not conversation_tag:
        conversation_tag = ConversationTag(conversation_id=conversation_id, tag_name=tag_name)
        db.add(conversation_tag)

    db.commit()
    return {"message": "Tag added to conversation"}

# Remove a tag from a conversation
@router.delete("/conversations/{conversation_id}/tags/{tag_name}")
def remove_tag(conversation_id: int, tag_name: str, db: Session = Depends(get_db)):
    conversation_tag = db.query(ConversationTag).filter_by(conversation_id=conversation_id, tag_name=tag_name).first()
    if not conversation_tag:
        raise HTTPException(status_code=404, detail="Tag not found on conversation")

    db.delete(conversation_tag)
    db.commit()
    return {"message": "Tag removed from conversation"}

# Delete a tag from all conversations
@router.delete("/tags/{tag_name}")
def delete_tag(tag_name: str, db: Session = Depends(get_db)):
    tag = db.query(Tag).filter_by(name=tag_name).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    db.query(ConversationTag).filter_by(tag_name=tag_name).delete()
    db.delete(tag)
    db.commit()
    return {"message": "Tag deleted from all conversations"}

# Remove character link from conversation
@router.delete("/conversations/{conversation_id}/character")
def delete_character(conversation_id: int, db: Session = Depends(get_db)):
    conversation = db.query(Conversation).filter_by(id=conversation_id).first()
    conversation.character_id = None

    db.commit()
    return {"message": "Character removed from conversation"}

# Remove persona link from conversation
@router.delete("/conversations/{conversation_id}/persona")
def delete_persona(conversation_id: int, db: Session = Depends(get_db)):
    conversation = db.query(Conversation).filter_by(id=conversation_id).first()
    conversation.persona_id = None

    db.commit()
    return {"message": "Persona removed from conversation"}

# Remove prompt link from conversation
@router.delete("/conversations/{conversation_id}/prompt")
def delete_prompt(conversation_id: int, db: Session = Depends(get_db)):
    conversation = db.query(Conversation).filter_by(id=conversation_id).first()
    conversation.prompt_id = None

    db.commit()
    return {"message": "Prompt removed from conversation"}

# Edit a message
@router.put("/messages/{message_id}")
def edit_message(
    message_id: int, 
    content: Annotated[str, Body(embed=True)] = None, 
    rejected: Annotated[str, Body(embed=True)] = None, 
    db: Session = Depends(get_db)
):
    message = db.query(Message).filter_by(id=message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if content:
        message.content = content
    if rejected and message.author == 'assistant':
        message.rejected = rejected

    db.commit()
    return {"message": "Message updated"}

# Edit a conversation
@router.put("/conversations/{conversation_id}")
def edit_conversation(
    conversation_id: int, 
    name: Annotated[str, Body()] = None, 
    description: Annotated[str, Body()] = None, 
    character_id: Annotated[int, Body()] = None, 
    persona_id: Annotated[int, Body()] = None, 
    prompt_id: Annotated[int, Body()] = None,
    db: Session = Depends(get_db)
):
    conversation = db.query(Conversation).filter_by(id=conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if name:
        conversation.name = name
    if description:
        conversation.description = description
    if character_id:
        character = db.query(Character).filter_by(id=character_id).first()
        if not character:
            raise HTTPException(status_code=404, detail="Character not found")
        conversation.character_id = character_id
    if persona_id:
        persona = db.query(Persona).filter_by(id=persona_id).first()
        if not character:
            raise HTTPException(status_code=404, detail="Persona not found")
        conversation.persona_id = persona_id
    if prompt_id:
        persona = db.query(Prompt).filter_by(id=prompt_id).first()
        if not character:
            raise HTTPException(status_code=404, detail="Prompt not found")
        conversation.prompt_id = prompt_id

    db.commit()
    return {"message": "Conversation updated"}

# Get a list of conversations
@router.get("/conversations")
def get_conversations(db: Session = Depends(get_db)):
    conversations = db.query(Conversation).all()
    return conversations

# Get a list of messages for a conversation
@router.get("/conversations/{conversation_id}/messages")
def get_messages(conversation_id: int, db: Session = Depends(get_db)):
    messages = db.query(Message).filter_by(conversation_id=conversation_id).order_by(Message.order).all()
    return messages

# Get a list of tags for a conversation
@router.get("/conversations/{conversation_id}/tags")
def get_tags(conversation_id: int, db: Session = Depends(get_db)):
    tags = db.query(ConversationTag).filter_by(conversation_id=conversation_id).all()
    return [tag.tag_name for tag in tags]

# Get a list of conversations for a tag
@router.get("/tags/{tag_name}/conversations")
def get_conversations_for_tag(tag_name: str, db: Session = Depends(get_db)):
    conversations = db.query(Conversation).join(ConversationTag).filter(ConversationTag.tag_name == tag_name).all()
    return conversations

# Get a count of messages for a conversation
@router.get("/conversations/{conversation_id}/message_count")
def get_message_count(conversation_id: int, db: Session = Depends(get_db)):
    count = db.query(Message).filter_by(conversation_id=conversation_id).count()
    return {"message_count": count}

@router.get("/conversations/{conversation_id}/token_count")
def get_token_count(conversation_id: int, model_identifier: str, db: Session = Depends(get_db)):
    # Query messages for the conversation
    messages = db.query(Message).filter_by(conversation_id=conversation_id).order_by(Message.order).all()
    if not messages:
        return {"token_count": 0}

    # Convert messages to the required format
    formatted_messages = [
        {"role": "user" if msg.author.lower() == "user" else "assistant" if msg.author.lower() == "assistant" else "system", "content": msg.content}
        for msg in messages
    ]

    # Count tokens using the utility function
    token_count = count_tokens(formatted_messages, model_identifier)
    return {"token_count": token_count}


# Get a count of tokens in a message using tiktoken
@router.get("/messages/{message_id}/token_count")
def get_message_token_count(message_id: int, model_identifier: str, db: Session = Depends(get_db)):
    # Query the message
    message = db.query(Message).filter_by(id=message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    # Format the message as a list
    formatted_message = [
        {"role": "user" if message.author.lower() == "user" else "assistant" if message.author.lower() == "assistant" else "system", "content": message.content}
    ]

    # Count tokens using the utility function
    token_count = count_tokens(formatted_message, model_identifier, False)

    rejected_count = 0

    if message.rejected:
        formatted_rejected = [
          {"role": "user" if message.author.lower() == "user" else "assistant" if message.author.lower() == "assistant" else "system", "content": message.rejected}
        ]
        rejected_count = count_tokens(formatted_rejected, model_identifier, False)

    return {"token_count": token_count, "rejected_token_count": rejected_count}

@router.delete("/messages/{message_id}")
def delete_message(message_id: int, db: Session = Depends(get_db)):
    message = db.query(Message).filter_by(id=message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    db.delete(message)
    db.commit()
    return {"message": "Message deleted"}


@router.get("/tags")
def search_tags(
    search: str = Query(None, min_length=1),  # Search query parameter
    limit: int = Query(10, gt=0),  # Optional limit on the number of results
    db: Session = Depends(get_db),
):
    if not search:
        return []  # Return an empty list if no search term is provided

    # Perform case-insensitive search
    tags = db.query(Tag).filter(Tag.name.ilike(f"%{search}%")).limit(limit).all()
    return [{"name": tag.name} for tag in tags]

# Add a character
@router.post("/characters", response_model=dict)
def create_character(character: CharacterCreate, db: Session = Depends(get_db)):
    db_character = Character(
        name=character.name,
        scenario=character.scenario,
        personality=character.personality,
        description=character.description,
        first_message=character.first_message,
        example_messages=character.example_messages,
        post_history_instructions=character.post_history_instructions,
    )
    db.add(db_character)
    db.commit()
    db.refresh(db_character)
    return {"message": "Character created successfully", "id": db_character.id}

# List all characters
@router.get("/characters")
def list_characters(db: Session = Depends(get_db)):
    characters = db.query(Character).all()
    return characters

# Get character by ID
@router.get("/characters/{character_id}")
def get_character(character_id: int, db: Session = Depends(get_db)):
    character = db.query(Character).filter(Character.id == character_id).first()

    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    return character

# Edit a character
@router.put("/characters/{character_id}", response_model=dict)
def update_character(character_id: int, character_update: CharacterUpdate, db: Session = Depends(get_db)):
    character = db.query(Character).filter(Character.id == character_id).first()

    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    # Update only provided fields
    for field, value in character_update.dict(exclude_unset=True).items():
        setattr(character, field, value)

    db.commit()
    db.refresh(character)
    return {"message": "Character updated successfully", "id": character.id}

# Add a persona
@router.post("/personas")
def add_personas(
    name: Annotated[str, Body()], 
    content: Annotated[str, Body()],
    db: Session = Depends(get_db)
):
    persona = Persona(name=name, content=content)

    db.add(persona)
    db.commit()
    db.refresh(persona)
    return persona

# Get personas
@router.get("/personas")
def get_personas(db: Session = Depends(get_db)):
    personas = db.query(Persona).all()
    return personas

# Get persona by ID
@router.get("/personas/{persona_id}")
def get_persona(persona_id: int, db: Session = Depends(get_db)):
    persona = db.query(Persona).filter(Persona.id == persona_id).first()

    if not persona:
        raise HTTPException(status_code=404, detail="Character not found")

    return persona

# Edit a persona
@router.put("/personas/{persona_id}")
def edit_persona(
    persona_id: int,
    name: Annotated[str, Body()], 
    content: Annotated[str, Body()],
    db: Session = Depends(get_db)
):
    persona = db.query(Persona).filter_by(id=persona_id).first()

    if name:
        persona.name = name
    if content:
        persona.content = content

    db.add(persona)
    db.commit()
    db.refresh(persona)
    return persona

# Add a prompt
@router.post("/prompts")
def add_prompt(
    name: Annotated[str, Body()], 
    content: Annotated[str, Body()],
    db: Session = Depends(get_db)
):
    prompt = Prompt(name=name, content=content)

    db.add(prompt)
    db.commit()
    db.refresh(prompt)
    return prompt

# Get prompts
@router.get("/prompts")
def get_prompts(db: Session = Depends(get_db)):
    prompts = db.query(Prompt).all()
    return prompts

# Get prompt by ID
@router.get("/prompts/{prompt_id}")
def get_prompt(prompt_id: int, db: Session = Depends(get_db)):
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()

    if not prompt:
        raise HTTPException(status_code=404, detail="Character not found")

    return prompt

# Edit a prompt
@router.put("/prompts/{prompt_id}")
def edit_prompt(
    prompt_id: int,
    name: Annotated[str, Body()], 
    content: Annotated[str, Body()],
    db: Session = Depends(get_db)
):
    prompt = db.query(Prompt).filter_by(id=prompt_id).first()

    if name:
        prompt.name = name
    if content:
        prompt.content = content

    db.add(prompt)
    db.commit()
    db.refresh(prompt)
    return prompt

@router.post("/conversations_jsonl", response_class=StreamingResponse)
async def get_conversations_jsonl(request: dict = Body(...), db: Session = Depends(get_db)):
    buffer = StringIO()

    conversation_ids = request.get("conversation_ids", [])
    conversations = db.query(Conversation).filter(Conversation.id.in_(conversation_ids)).all()

    if not conversations:
        raise HTTPException(status_code=404, detail="No conversations found")

    for conversation in conversations:
        tags = db.query(Tag).join(ConversationTag).filter(ConversationTag.conversation_id == conversation.id).all()
        tag_names = [tag.name for tag in tags]
        messages = db.query(Message).filter(Message.conversation_id == conversation.id).order_by(Message.order).all()

        persona_name = conversation.persona.name if conversation.persona else None
        character_name = conversation.character.name if conversation.character else None

        conversation_data = {
            "id": conversation.id,
            "name": conversation.name,
            "tags": tag_names,
            "length": len(messages),
            "conversation": []
        }

        for message in messages:
            content = message.content
            if persona_name:
                content = content.replace("{{user}}", persona_name)
            if character_name:
                content = content.replace("{{char}}", character_name)

            conversation_data["conversation"].append({
                "from": message.author,
                "value": content
            })

        buffer.write(json.dumps(conversation_data) + "\n")

    buffer.seek(0)

    return StreamingResponse(buffer, media_type="application/jsonlines")

# POST /characters/{character_id}/image
@router.post("/characters/{character_id}/image")
async def upload_character_image(character_id: int, image: UploadFile = File(...), db: Session = Depends(get_db)):
    validate_image(image)
    filename = save_image(image)

    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    character.image = filename
    db.commit()
    return character


# GET /characters/{character_id}/image
@router.get("/characters/{character_id}/image")
async def get_character_image(character_id: int, db: Session = Depends(get_db)):
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character or not character.image:
        raise HTTPException(status_code=404, detail="Image not found for the character")

    return FileResponse(get_image_path(character.image))


# POST /personas/{persona_id}/image
@router.post("/personas/{persona_id}/image")
async def upload_persona_image(persona_id: int, image: UploadFile = File(...), db: Session = Depends(get_db)):
    validate_image(image)
    filename = save_image(image)

    persona = db.query(Persona).filter(Persona.id == persona_id).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")

    persona.image = filename
    db.commit()
    return persona


# GET /personas/{persona_id}/image
@router.get("/personas/{persona_id}/image")
async def get_persona_image(persona_id: int, db: Session = Depends(get_db)):
    persona = db.query(Persona).filter(Persona.id == persona_id).first()
    if not persona or not persona.image:
        raise HTTPException(status_code=404, detail="Image not found for the persona")

    return FileResponse(get_image_path(persona.image))

# Delete a character
@router.delete("/characters/{character_id}")
def delete_character(character_id: int, db: Session = Depends(get_db)):
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    # Check for related conversations and handle as necessary
    conversations = db.query(Conversation).filter(Conversation.character_id == character_id).all()
    for conversation in conversations:
        conversation.character_id = None  # Unlink character from conversations

    db.delete(character)
    db.commit()
    return {"message": "Character deleted successfully"}

# Delete a persona
@router.delete("/personas/{persona_id}")
def delete_persona(persona_id: int, db: Session = Depends(get_db)):
    persona = db.query(Persona).filter(Persona.id == persona_id).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")

    # Check for related conversations and handle as necessary
    conversations = db.query(Conversation).filter(Conversation.persona_id == persona_id).all()
    for conversation in conversations:
        conversation.persona_id = None  # Unlink persona from conversations

    db.delete(persona)
    db.commit()
    return {"message": "Persona deleted successfully"}

# Delete a prompt
@router.delete("/prompts/{prompt_id}")
def delete_prompt(prompt_id: int, db: Session = Depends(get_db)):
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    # Check for related conversations and handle as necessary
    conversations = db.query(Conversation).filter(Conversation.prompt_id == prompt_id).all()
    for conversation in conversations:
        conversation.prompt_id = None  # Unlink prompt from conversations

    db.delete(prompt)
    db.commit()
    return {"message": "Prompt deleted successfully"}

# Delete a conversation
@router.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: int, db: Session = Depends(get_db)):
    # Fetch the conversation
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Delete all messages related to the conversation
    db.query(Message).filter(Message.conversation_id == conversation_id).delete()

    # Delete all ConversationTag entries related to the conversation
    db.query(ConversationTag).filter(ConversationTag.conversation_id == conversation_id).delete()

    # Delete the conversation itself
    db.delete(conversation)
    db.commit()
    return {"message": "Conversation and its related data deleted successfully"}
