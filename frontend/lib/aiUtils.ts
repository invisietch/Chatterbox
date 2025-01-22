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
  eosTokens: string[],
  samplers: Record<string, any>,
  samplerOrder: number[],
  llmUrl: string,
  maxContext: number,
  setResponse: (text: string) => void,
  setError: (text: string) => void,
  setLoading: (t: boolean) => void
) => {
  setLoading(true);
  let localResponse = '';
  let lastFinishReason = '';

  const promptData = {
    prompt,
    temperature: samplers["temperature"],
    min_p: samplers["min_p"],
    top_p: samplers["top_p"],
    top_k: samplers["top_k"],
    xtc_probability: samplers["xtc_probability"],
    xtc_threshold: samplers["xtc_threshold"],
    max_length: samplers["max_tokens"],
    max_context_length: maxContext,
    rep_pen: samplers["repetition_penalty"],
    rep_pen_range: samplers["repetition_penalty_range"],
    stopping_strings: eosTokens,
    sampler_order: samplerOrder,
    skip_special_tokens: true,
    ignore_eos: false,
    typical: samplers["typical_p"],
    tfs: samplers["tfs"],
    sampler_seed: -1,
    stream: true,
  };

  try {
    const response = await fetch(`${llmUrl}/api/extra/generate/stream`, {
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
          try {
            const parsed = JSON.parse(jsonString);
            const text = parsed.token;
            localResponse += text;
            lastFinishReason = parsed.finish_reason;
            setResponse(localResponse);
          } catch (e) {
            console.error('Failed to parse chunk:', e);
          }
        }
      }
    }
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }

  return { localResponse, lastFinishReason };
};