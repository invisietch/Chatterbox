import { useRef } from 'react';

const useAiWorker = () => {
  const workerRef = useRef(null);

  const initializeWorker = () => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../workers/aiWorker.js', import.meta.url));
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
  }) => {
    initializeWorker();

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
      prompt,
      eosTokens,
      samplers,
      samplerOrder,
      llmUrl,
      maxContext,
    });
  };

  return { generateWithWorker, terminateWorker };
};

export default useAiWorker;
