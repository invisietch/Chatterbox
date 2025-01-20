from transformers import AutoTokenizer
from fastapi import HTTPException

def count_tokens(messages: list, model_identifier: str, with_chat_template: bool = True) -> int:
    """
    Counts tokens for a list of messages using the model's tokenizer.
    Applies the chat template if supported by the tokenizer.

    Args:
        messages (list): A list of message dictionaries, each with 'role' and 'content'.
        model_identifier (str): The identifier of the model.

    Returns:
        int: The total token count.
    """
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_identifier)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error loading tokenizer: {str(e)}")

    try:
        if (with_chat_template):
            # Check if the tokenizer has an `apply_chat_template` method
            if hasattr(tokenizer, "apply_chat_template"):
                tokens = tokenizer.apply_chat_template(messages, tokenize=True)
            else:
                # Fallback: Manually concatenate messages into a single string
                chat_history = "\n".join([f"{msg['role']}: {msg['content']}" for msg in messages])
                tokens = tokenizer.encode(chat_history, truncation=False, add_special_tokens=False)
        else:
            tokens = tokenizer.encode("\n".join([f"{msg['content']}" for msg in messages]), truncation=False, add_special_tokens=False)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

    return len(tokens)

def apply_template(messages: list, model_identifier: str):
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_identifier)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error loading tokenizer: {str(e)}")
    
    if hasattr(tokenizer, "apply_chat_template"):
        chat_history = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    else:
        # Fallback: Manually concatenate messages into a single string
        chat_history = "\n".join([f"{msg['role']}: {msg['content']}" for msg in messages])
    
    return {
        "history": chat_history,
        "eos_token": tokenizer.eos_token
    }