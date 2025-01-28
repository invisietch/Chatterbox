let abortController;

self.onmessage = async (e) => {
  const { type, prompt, eosTokens, samplers, samplerOrder, llmUrl, maxContext, apiKey } = e.data;

  if (type === 'generate') {
    if (!apiKey) {
      self.postMessage({ type: 'error', message: 'API Key Required for Tabby' });
    } else {
      try {
        if (abortController) {
          abortController.abort(); // Abort any ongoing request
        }
        abortController = new AbortController(); // Create a new AbortController
        const signal = abortController.signal;

        let lastTime = 0;
        let localResponse = '';
        let lastFinishReason = '';

        const promptData = {
          prompt,
          temperature: samplers['temperature'],
          min_p: samplers['min_p'],
          top_p: samplers['top_p'],
          top_k: samplers['top_k'],
          xtc_probability: samplers['xtc_probability'],
          xtc_threshold: samplers['xtc_threshold'],
          max_tokens: samplers['max_tokens'],
          max_context_length: maxContext,
          rep_pen: samplers['repetition_penalty'],
          rep_pen_range: samplers['repetition_penalty_range'],
          stopping_strings: eosTokens,
          sampler_order: samplerOrder,
          skip_special_tokens: true,
          ignore_eos: false,
          typical: samplers['typical_p'],
          tfs: samplers['tfs'],
          sampler_seed: -1,
          stream: true,
        };

        const response = await fetch(`${llmUrl}/v1/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify(promptData),
          signal, // Pass the signal to fetch
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
              if (jsonString === '[DONE]') {
                break;
              }
              const parsed = JSON.parse(jsonString);
              const text = parsed.choices[0].text;
              localResponse += text;
              lastFinishReason = parsed.choices[0].finish_reason;
              const time = new Date().getTime();
              // Sending too many partials crashes Chrome tab.
              if (time - lastTime >= 100) {
                lastTime = time;
                self.postMessage({ type: 'partial', text: localResponse });
              }
            }
          }
        }

        self.postMessage({ type: 'partial', text: localResponse });
        self.postMessage({ type: 'done', text: localResponse, finishReason: lastFinishReason });
      } catch (err) {
        if (err.name === 'AbortError') {
          self.postMessage({ type: 'done', text: localResponse, finishReason: 'abort' });
        } else {
          self.postMessage({ type: 'error', message: err.message });
        }
      }
    }
  } else if (type === 'abort') {
    if (abortController) {
      abortController.abort();
      abortController = null; // Reset the controller
    }
    self.postMessage({ type: 'done', text: localResponse, finishReason: 'abort' });
  }
};
