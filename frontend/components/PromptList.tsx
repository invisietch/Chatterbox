import React from "react";
import PromptItem from "./PromptItem";

interface Prompt {
  id: number;
  name: string;
  content: string;
}

const PromptList = ({
  prompts,
  error,
  fetchPrompts,
}: {
  prompts: Prompt[],
  error: string,
  fetchPrompts: () => void,
}) => {
  return (
    <>
      {error && <p className="text-red-500">{error}</p>}
      {!error && prompts.length === 0 && <p className="text-gray-500">No prompts found.</p>}
      <div className="space-y-4">
        {prompts.map((prompt) => (
          <PromptItem prompt={prompt} fetchPrompts={fetchPrompts} />
        ))}
      </div>
    </>
  );
};

export default PromptList;
