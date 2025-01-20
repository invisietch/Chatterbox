export const cancelGeneration = async (llmUrl) => {
  try {
    const response = await fetch(`${llmUrl}/api/extra/abort`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error(error);
  }
}

export const fetchResponse = async (
  prompt: string,
  eosToken: string,
  samplers: Record<string, any>,
  samplerOrder: number[],
  llmUrl: string,
  setResponse: (text: string) => void,
  setError: (text: string) => void,
  setLoading: (t: boolean) => void
) => {
  setLoading(true);
  let localResponse = '';

  const promptData = {
    ...samplers,
    prompt,
    temp: samplers["temperature"],
    rep_pen: samplers["repetition_penalty"],
    rep_pen_range: samplers["repetition_penalty_range"],
    stopping_strings: [eosToken],
    sampler_order: samplerOrder,
    skip_special_tokens: true,
    ignore_eos: false,
    seed: -1,
    stream: true,
  };

  try {
    const response = await fetch(`${llmUrl}/api/v1/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(promptData),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonString = line.replace('data: ', '').trim();
          if (jsonString !== '[DONE]') {
            try {
              const parsed = JSON.parse(jsonString);
              const text = parsed.choices[0]?.text || '';
              localResponse += text;
              setResponse(localResponse);
            } catch (e) {
              console.error('Failed to parse chunk:', e);
            }
          }
        }
      }
    }
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};