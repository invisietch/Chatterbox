from typing import Optional
from transformers import AutoTokenizer
from fastapi import HTTPException
from redis import asyncio as aioredis

CHATML_TEMPLATE= """{% for message in messages %}
        {{'<|im_start|>' + message['role'] + '\n' + message['content']}}
        {% if (loop.last and add_generation_prompt) or not loop.last %}
            {{ '<|im_end|>' + '\n'}}
        {% endif %}
    {% endfor %}
    {% if add_generation_prompt and messages[-1]['role'] != 'assistant' %}
        {{ '<|im_start|>assistant\n' }}
    {% endif %}"""

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
        tokens = attempt_difficult_chat_template(tokenizer, messages)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

    return len(tokens)

async def cache_message(redis, message, result, model_identifier):
    message_cache_key = f"prompt:message:{message['id']}:{model_identifier}"
    await redis.set(message_cache_key, result)

def attempt_difficult_chat_template(tokenizer: AutoTokenizer, messages, tokenize=True, add_generation_prompt=False):
    # Fallback to chatml if no template found.
    try:
        if tokenizer.chat_template: 
            return_toks = tokenizer.apply_chat_template(
                messages, 
                tokenize=tokenize,
                add_generation_prompt=add_generation_prompt
            )
        else:
            return_toks = tokenizer.apply_chat_template(
                messages, 
                tokenize=tokenize,
                add_generation_prompt=add_generation_prompt,
                chat_template=CHATML_TEMPLATE
            )
    except Exception as e:
        new_messages = []
        for msg in messages:
            if msg["role"] == "system":
                msg["role"] = "user"
            
            if new_messages and new_messages[-1]["role"] == msg["role"]:
                new_messages[-1]["content"] += f"\n\n{msg['content']}"
            else:
                new_messages.append(msg)
        
        if len(new_messages) == 1:
            new_messages[0]["role"] = "user"
        
        try:
            if tokenizer.chat_template:
                return_toks = tokenizer.apply_chat_template(
                    new_messages, 
                    tokenize=tokenize,
                    add_generation_prompt=add_generation_prompt
                )
            else:
                return_toks = tokenizer.apply_chat_template(
                    new_messages, 
                    tokenize=tokenize,
                    add_generation_prompt=add_generation_prompt,
                    chat_template=CHATML_TEMPLATE
                )
        except Exception as ei:
            raise HTTPException(status_code=400, detail=f"Error tokenizing messages: {str(ei)} {tokenizer.chat_template}")
    
    return return_toks

async def apply_template_with_context_limit(
    messages: list,
    model_identifier: str,
    max_context: int,
    max_length: int,
    postfix: str,
    redis: aioredis,
    example_messages: list = [],
    authors_note: Optional[str] = None,
    authors_note_loc: Optional[int] = None
):
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_identifier)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error loading tokenizer: {str(e)}")
    
    if not hasattr(tokenizer, "apply_chat_template"):
        raise HTTPException(status_code=400, detail="Tokenizer does not support apply_chat_template")

    # Tokenize system message and postfix
    system_message = messages[0]
    templated_system_message = attempt_difficult_chat_template(tokenizer, [system_message], tokenize=True, add_generation_prompt=False)
    system_tokens = len(templated_system_message)
    current_context_tokens = system_tokens

    if authors_note and authors_note_loc:
        authors_note_message = {
            "role": "system",
            "content": authors_note
        }
        templated_an_message = attempt_difficult_chat_template(tokenizer, [authors_note_message], tokenize=True, add_generation_prompt=False)
        authors_note_tokens = len(templated_an_message)
        current_context_tokens = current_context_tokens + authors_note_tokens

    # Take off 50 toks for generation prompt & postfix.
    context_budget_remaining = max_context - current_context_tokens - max_length - 50 

    included_messages = []

    # Process chat messages backward
    shifted_messages = []
    for message in reversed(messages[1:]):
        if "id" in message:
            message_cache_key = f"prompt:message:{message['id']}:{model_identifier}"
            cached_message = await redis.get(message_cache_key)

            if cached_message:
                message_tokens = int(cached_message)
            else:
                message_text = attempt_difficult_chat_template(tokenizer, [message], tokenize=True, add_generation_prompt=False)
                message_tokens = len(message_text)
                await cache_message(redis, message, message_tokens, model_identifier)
        else:
            message_text = attempt_difficult_chat_template(tokenizer, [message], tokenize=True, add_generation_prompt=False)
            message_tokens = len(message_text)

        if context_budget_remaining >= message_tokens:
            included_messages.append(message)
            context_budget_remaining -= message_tokens
        else:
            shifted_messages.append(message)
            context_budget_remaining = 0

    included_messages.reverse()

    if len(example_messages) > 0:
        example_tokens = attempt_difficult_chat_template(tokenizer, example_messages, tokenize=True, add_generation_prompt=False)
        example_tokens = len(example_tokens)

        if context_budget_remaining >= example_tokens:
            included_messages = example_messages + included_messages
            context_budget_remaining -= example_tokens

    included_messages.insert(0, system_message)

    if authors_note and authors_note_loc:
        authors_note_message = {
            "role": "system",
            "content": authors_note
        }
        included_messages.insert(authors_note_loc, authors_note_message)

    chat_history = attempt_difficult_chat_template(tokenizer, included_messages, tokenize=False, add_generation_prompt=True)
    chat_history_with_postfix = f"{chat_history}{postfix}"

    eos_token = '<|im_end|>'
    if tokenizer.chat_template:
        eos_token = tokenizer.eos_token

    return {
        "history": chat_history_with_postfix,
        "eos_token": eos_token,
        "shifted_messages": shifted_messages
    }