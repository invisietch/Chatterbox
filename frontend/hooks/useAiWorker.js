import { useRef } from 'react';

const useAiWorker = () => {
  const workerRef = useRef(null);

  const getWorker = (engine) => {
    switch (engine) {
      case 'tabby':
        return new Worker(new URL('../workers/tabbyWorker.js', import.meta.url));
      case 'kobold':
      default:
        return new Worker(new URL('../workers/koboldWorker.js', import.meta.url));
    }
  };

  const initializeWorker = (engine) => {
    if (!workerRef.current) {
      workerRef.current = getWorker(engine || 'kobold');
    }
  };

  const terminateWorker = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  };

  const generateWithWorker = ({
    prompt,
    eosTokens,
    samplers,
    samplerOrder,
    llmUrl,
    maxContext,
    onPartial,
    onComplete,
    onError,
    engine,
    apiKey,
  }) => {
    initializeWorker(engine);

    workerRef.current.onmessage = (e) => {
      const { type, text, finishReason, message } = e.data;

      if (type === 'partial' && onPartial) {
        onPartial(text.trim());
      } else if (type === 'done' && onComplete) {
        onComplete({ text: text.trim(), finishReason });
      } else if (type === 'error' && onError) {
        onError(message);
      }
    };

    workerRef.current.postMessage({
      type: 'generate',
      prompt,
      eosTokens,
      samplers,
      samplerOrder,
      llmUrl,
      maxContext,
      apiKey,
    });
  };

  const abortGenerationWithWorker = () => {
    if (workerRef) {
      workerRef.current.postMessage({
        type: 'abort'
      });
    }
  };

  return { generateWithWorker, terminateWorker, abortGenerationWithWorker };
};

export default useAiWorker;
