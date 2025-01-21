from transformers import AutoTokenizer
from fastapi import HTTPException
from redis import asyncio as aioredis

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

async def cache_message(redis, message, result, model_identifier):
    message_cache_key = f"prompt:message:{message['id']}:{model_identifier}"
    await redis.set(message_cache_key, result)

async def apply_template_with_context_limit(
    messages: list,
    model_identifier: str,
    max_context: int,
    max_length: int,
    postfix: str,
    redis: aioredis,
    example_messages: list = []
):
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_identifier)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error loading tokenizer: {str(e)}")
    
    if not hasattr(tokenizer, "apply_chat_template"):
        raise HTTPException(status_code=400, detail="Tokenizer does not support apply_chat_template")

    # Tokenize system message and postfix
    system_message = messages[0]
    templated_system_message = tokenizer.apply_chat_template([system_message], tokenize=True, add_generation_prompt=False)
    system_tokens = len(templated_system_message)
    current_context_tokens = system_tokens

    # Take off 50 toks for generation prompt & postfix.
    context_budget_remaining = max_context - current_context_tokens - max_length - 50 

    included_messages = []

    # Include example messages if they fit in the context
    if example_messages:
        example_tokens = sum(
            len(tokenizer(example["content"])["input_ids"]) for example in example_messages
        )
        if context_budget_remaining >= example_tokens:
            included_messages.extend(example_messages)
            context_budget_remaining -= example_tokens

    # Process chat messages backward
    shifted_messages = []
    for message in reversed(messages[1:]):
        message_cache_key = f"prompt:message:{message['id']}:{model_identifier}"
        cached_message = await redis.get(message_cache_key)

        if cached_message:
            message_tokens = int(cached_message)
        else:
            message_text = tokenizer.apply_chat_template([message], tokenize=True, add_generation_prompt=False)
            message_tokens = len(message_text)
            await cache_message(redis, message, message_tokens, model_identifier)

        if context_budget_remaining >= message_tokens:
            included_messages.append(message)
            context_budget_remaining -= message_tokens
        else:
            shifted_messages.append(message)
            context_budget_remaining = 0

    included_messages.reverse()

    if len(example_messages) > 0:
        example_tokens = len(tokenizer.apply_chat_template(example_messages, tokenize=True, add_generation_prompt=False))

        if context_budget_remaining >= example_tokens:
            included_messages = example_messages + included_messages
            context_budget_remaining -= example_tokens

    included_messages.insert(0, system_message)

    chat_history = tokenizer.apply_chat_template(included_messages, tokenize=False, add_generation_prompt=True)
    chat_history_with_postfix = f"{chat_history}{postfix}"

    return {
        "history": chat_history_with_postfix,
        "eos_token": tokenizer.eos_token,
        "shifted_messages": shifted_messages
    }

