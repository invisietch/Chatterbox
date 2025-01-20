import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "./SortableItem"; // Custom component for sortable items
import { ModelSearch } from "./ModelSearch";

const AddPresetForm = ({ onSave, onCancel, initialValues }: {
  onSave: (presetName: string, samplers: Record<string, any>, samplerOrder: number[], model: string, llmUrl: string) => void;
  onCancel: () => void;
  initialValues?: Record<string, any>;
}) => {
  const [presetName, setPresetName] = useState("");
  const [samplers, setSamplers] = useState({
    max_tokens: 300,
    temperature: 1,
    top_p: 1,
    top_k: 0,
    min_p: 1.08,
    repetition_penalty: 1.04,
    repetition_penalty_range: 1536,
  });
  const [model, setModel] = useState("");
  const [llmUrl, setLlmUrl] = useState("");

  const [samplerOrder, setSamplerOrder] = useState([
    { id: "6", label: "Repetition Penalty", value: 6 },
    { id: "0", label: "Top K", value: 0 },
    { id: "1", label: "Top A", value: 1 },
    { id: "3", label: "Tail Free Sampling", value: 3 },
    { id: "4", label: "Typical P", value: 4 },
    { id: "2", label: "Top P & Min P", value: 2 },
    { id: "5", label: "Temperature", value: 5 },
  ]);

  const samplerOrderLookup: Record<number, string> = {
    0: "Top K",
    1: "Top A",
    2: "Top P & Min P",
    3: "Tail Free Sampling",
    4: "Typical P",
    5: "Temperature",
    6: "Repetition Penalty",
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setSamplerOrder((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = () => {
    if (presetName) {
      const orderValues = samplerOrder.map((item) => item.value);
      onSave(presetName, samplers, orderValues, model, llmUrl);
    } else {
      toast.error("Please provide a name for the preset.");
    }
  };

  useEffect(() => {
    if (initialValues) {
      setPresetName(initialValues.name);
      setSamplers(initialValues.samplers);
      setSamplerOrder(initialValues.samplerOrder.map(samplerId => {
        const sampler = samplerOrderLookup[samplerId];

        return {
          id: `${samplerId}`,
          value: samplerId,
          label: sampler,
        }
      }));
      setModel(initialValues.modelName);
      setLlmUrl(initialValues.llmUrl);
    }
  }, [initialValues]);

  return (
    <form className="mt-4 space-y-4 mb-4">
      <div className="space-y-6">
        <label className="text-gray-300 text-lg">Preset Name</label>
        <input
          value={presetName}
          onChange={(e) => setPresetName(e.target.value)}
          className="w-full p-2 border rounded bg-dark text-gray-200 mb-2 pl-4"
        />
      </div>

      <div className="space-y-6">
        <label className="text-gray-300 text-lg">Select Model (choose the same model you're running locally)</label>
        <ModelSearch model={model} onModelSelect={setModel} />
      </div>

      <div className="space-y-6">
        <label className="text-gray-300 text-lg">Koboldcpp URL (do not add the trailing slash)</label>
        <input
          value={llmUrl}
          onChange={(e) => setLlmUrl(e.target.value)}
          className="w-full p-2 border rounded bg-dark text-gray-200 mb-2 pl-4"
          placeholder="http://127.0.0.1:5001"
        />
      </div>

      {/* Sliders for sampler values */}
      <div className="space-y-6">
        <div className="pb-1 relative">
          <h3>Sampler Values</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.keys(samplers).map((key) => (
            <div key={key} className="flex flex-col space-y-2">
              <label className="text-gray-200 text-sm font-medium">{key}</label>
              <input
                type="range"
                min={key === "max_tokens" ? 0 : key === "top_k" ? 0 : key === "top_p" ? 0 : key === "temperature" ? 0 : 1}
                max={
                  key === "max_tokens"
                    ? 2048
                    : key === "top_k"
                      ? 200
                      : key === "repetition_penalty_range"
                        ? 8192
                        : key === "temperature"
                          ? 5
                          : key === "top_p"
                            ? 1
                            : 2
                }
                step={key === "max_tokens" ? 1 : key === "repetition_penalty_range" ? 1 : key === "top_k" ? 1 : 0.01}
                value={samplers[key]}
                onChange={(e) =>
                  setSamplers((prev) => ({
                    ...prev,
                    [key]: parseFloat(e.target.value),
                  }))
                }
                className="w-full"
              />
              <div className="text-gray-400 text-sm">Value: {samplers[key]}</div>
            </div>
          ))}
        </div>
      </div>


      {/* Sampler Order */}
      <div className="mt-4">
        <div className="pb-1 relative">
          <h3>SamplerOrder</h3>
        </div>
        <p className="text-gray-400 text-sm mb-2">Reorder the samplers by dragging.</p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={samplerOrder.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {samplerOrder.map((item) => (
              <SortableItem key={item.id} id={item.id} label={item.label} />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-dark1 text-white rounded hover:bg-dark2"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 bg-fadedGreen text-white rounded hover:bg-brightGreen"
        >
          Save
        </button>
      </div>
    </form>
  );
};

export default AddPresetForm;
