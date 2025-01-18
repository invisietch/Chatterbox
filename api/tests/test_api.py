import pytest
from fastapi.testclient import TestClient
from api.app.main import app
from app.api import get_db
from app.models import Base, Conversation
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Use the testing database URL
DATABASE_TEST_URL = os.getenv("DATABASE_TEST_URL", "postgresql://chatterbox:test@localhost/chatterbox_test")
engine = create_engine(DATABASE_TEST_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    """Provide the test database session."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="function")
def setup_test_data():
    db = TestingSessionLocal()
    conversation = Conversation(name="Test Conversation", description="A test conversation.")
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    yield conversation
    db.close()

client = TestClient(app)

# Test: Add a conversation
def test_add_conversation():
    response = client.post("/conversations", json={"name": "Test Conversation", "description": "This is a test."})
    assert response.status_code == 200
    assert response.json()["name"] == "Test Conversation"

# Test: Add a message to a conversation
def test_add_message(setup_test_data):
    conversation = setup_test_data
    response = client.post(f"/conversations/{conversation.id}/messages", json={"author": "Tester", "content": "Hello, World!"})
    assert response.status_code == 200
    assert response.json()["content"] == "Hello, World!"

# Test: Add a tag to a conversation
def test_add_tag(setup_test_data):
    conversation = setup_test_data
    response = client.post(f"/conversations/{conversation.id}/tags/test_tag")
    assert response.status_code == 200
    assert response.json()["message"] == "Tag added to conversation"

# Test: Remove a tag from a conversation
def test_remove_tag(setup_test_data):
    conversation = setup_test_data
    client.post(f"/conversations/{conversation.id}/tags/test_tag")
    response = client.delete(f"/conversations/{conversation.id}/tags/test_tag")
    assert response.status_code == 200
    assert response.json()["message"] == "Tag removed from conversation"

# Test: Delete a tag from all conversations
def test_delete_tag():
    response = client.post("/conversations", json={"name": "Test Conversation", "description": "A test."})
    conversation_id = response.json()["id"]
    client.post(f"/conversations/{conversation_id}/tags/test_tag")
    response = client.delete("/tags/test_tag")
    assert response.status_code == 200
    assert response.json()["message"] == "Tag deleted from all conversations"

# Test: Edit a message
def test_edit_message(setup_test_data):
    conversation = setup_test_data
    message_response = client.post(f"/conversations/{conversation.id}/messages", json={"author": "Tester", "content": "Original Content"})
    message_id = message_response.json()["id"]
    response = client.put(f"/messages/{message_id}", json={"content": "Updated Content"})
    assert response.status_code == 200
    assert response.json()["message"] == "Message updated"

# Test: Edit a conversation
def test_edit_conversation(setup_test_data):
    conversation = setup_test_data
    response = client.put(f"/conversations/{conversation.id}", json={"name": "Updated Name", "description": "Updated Description"})
    assert response.status_code == 200
    assert response.json()["message"] == "Conversation updated"

# Test: Get a list of conversations
def test_get_conversations():
    response = client.get("/conversations")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

# Test: Get a list of messages for a conversation
def test_get_messages(setup_test_data):
    conversation = setup_test_data
    client.post(f"/conversations/{conversation.id}/messages", json={"author": "Tester", "content": "Hello, World!"})
    response = client.get(f"/conversations/{conversation.id}/messages")
    assert response.status_code == 200
    assert len(response.json()) == 1

# Test: Get a list of tags for a conversation
def test_get_tags(setup_test_data):
    conversation = setup_test_data
    client.post(f"/conversations/{conversation.id}/tags/test_tag")
    response = client.get(f"/conversations/{conversation.id}/tags")
    assert response.status_code == 200
    assert "test_tag" in response.json()

# Test: Get a list of conversations for a tag
def test_get_conversations_for_tag():
    response = client.post("/conversations", json={"name": "Test Conversation", "description": "A test."})
    conversation_id = response.json()["id"]
    client.post(f"/conversations/{conversation_id}/tags/{conversation_id}")
    response = client.get(f"/tags/{conversation_id}/conversations")
    assert response.status_code == 200
    assert len(response.json()) == 1

# Test: Get a count of messages for a conversation
def test_get_message_count(setup_test_data):
    conversation = setup_test_data
    client.post(f"/conversations/{conversation.id}/messages", json={"author": "Tester", "content": "Hello, World!"})
    response = client.get(f"/conversations/{conversation.id}/message_count")
    assert response.status_code == 200
    assert response.json()["message_count"] == 1
