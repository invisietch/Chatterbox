let abortController;

self.onmessage = async (e) => {
  const { type, prompt, eosTokens, samplers, samplerOrder, llmUrl, maxContext } = e.data;

  if (type === 'abort') {
    if (abortController) {
      abortController.abort();
      abortController = null; // Reset the controller
    }
    self.postMessage({ type: 'done', text: localResponse, finishReason: 'abort' });
  }

  if (type === 'generate') {
    try {
      if (abortController) {
        abortController.abort(); // Abort any ongoing request
      }
      abortController = new AbortController(); // Create a new AbortController
      const signal = abortController.signal;

      let lastTime = 0;
      let localResponse = '';
      let lastFinishReason = '';
      let model = '';

      const modelResponse = await fetch(`${llmUrl}/v1/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!modelResponse.ok) {
        self.postMessage({ type: 'error', message: err.message });
      }

      const { data } = await modelResponse.json();

      if (data.length > 0) {
        model = data[0].id;
        console.log(`Selected model: ${model}`);
      } else {
        self.postMessage({ type: 'error', message: err.message });
      }

      const promptData = {
        prompt,
        model,
        temperature: samplers['temperature'],
        min_p: samplers['min_p'],
        top_p: samplers['top_p'],
        top_k: samplers['top_k'] || -1,
        max_tokens: samplers['max_tokens'],
        max_context_length: maxContext,
        xtc_probability: samplers['xtc_probability'],
        xtc_threshold: samplers['xtc_threshold'],
        repetition_penalty: samplers['repetition_penalty'],
        repetition_penalty_range: samplers['repetition_penalty_range'],
        stop: eosTokens,
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
};
