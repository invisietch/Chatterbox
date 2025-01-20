import { useEffect, useState } from "react";
import Accordion from "./Accordion";
import apiClient from "../lib/api";
import { toast } from "react-toastify";
import { PencilIcon, TrashIcon } from "@heroicons/react/outline";
import ReactDOM from "react-dom";
import AddPresetForm from "./AddPresetForm";
import { useDispatch, useSelector } from "react-redux";
import { setPreset } from "../context/modelSlice";

const PresetItem = ({ preset, onSave }: { preset: any; onSave: () => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [name, setName] = useState("");
  const [samplers, setSamplers] = useState({});
  const [samplerOrder, setSamplerOrder] = useState([]);
  const [modelName, setModelName] = useState("");
  const [llmUrl, setLlmUrl] = useState("");
  const selectedPresetId = useSelector((state: any) => state.model.selectedPresetId);
  const dispatch = useDispatch();

  const handleCancel = () => setIsEditing(false);

  useEffect(() => {
    setName(preset.name);
    setSamplers(preset.samplers);
    setSamplerOrder(preset.sampler_order);
    setModelName(preset.model_name);
    setLlmUrl(preset.llm_url);
  }, [preset]);

  const handleSave = async (
    updatedName: string,
    updatedSamplers: Record<string, any>,
    updatedSamplerOrder: number[],
    updatedModelName: string,
    updatedLlmUrl: string
  ) => {
    try {
      const response = await apiClient.put(`/presets/${preset.id}`, {
        name: updatedName,
        samplers: updatedSamplers,
        sampler_order: updatedSamplerOrder,
        model_name: updatedModelName,
        llm_url: updatedLlmUrl,
      });

      if (selectedPresetId == response.data.preset.toString()) {
        dispatch(
          setPreset({
            selectedModel: updatedModelName,
            samplers: updatedSamplers,
            samplerOrder: updatedSamplerOrder,
            llmUrl: updatedLlmUrl,
            selectedPresetId: response.data.preset,
          })
        );
      }

      toast.success("Preset updated successfully.");
      setIsEditing(false);
      onSave();
    } catch (error) {
      console.error("Error saving preset:", error);
      toast.error("Failed to update preset.");
    }
  };

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/presets/${preset.id}`);

      if (selectedPresetId === preset.id.toString()) {
        dispatch(
          setPreset({
            selectedModel: '',
            samplers: {},
            samplerOrder: [],
            llmUrl: '',
            selectedPresetId: null,
          })
        );
      }

      toast.success("Preset deleted successfully.");
      setIsDeleting(false);
      onSave();
    } catch (error) {
      console.error("Error deleting preset:", error);
      toast.error("Failed to delete preset.");
    }
  };

  return isEditing ? (
    <AddPresetForm
      onSave={(updatedName, updatedSamplers, updatedOrder, updatedModel, updatedLlmUrl) => {
        handleSave(updatedName, updatedSamplers, updatedOrder, updatedModel, updatedLlmUrl);
      }}
      onCancel={handleCancel}
      initialValues={{
        name,
        samplers,
        samplerOrder,
        modelName,
        llmUrl,
      }}
    />
  ) : (
    <Accordion key={preset.id} title={name}>
      <div className="pb-4 mb-4 relative">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2 absolute top-1 right-1">
            <button
              onClick={() => setIsEditing(true)}
              className="text-grey-300 hover:text-yellow-300"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsDeleting(true)}
              className="text-grey-300 hover:text-red-300"
              aria-label="Delete preset"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="text-sm text-gray-300 w-11/12">
            <p>
              <strong>Samplers:</strong>{" "}
              {Object.entries(samplers)
                .map(([key, value]) => `${key}: ${value}`)
                .join(", ")}
            </p>
            <p>
              <strong>Sampler Order:</strong> {samplerOrder.join(", ")}
            </p>
            <p>
              <strong>Model Name:</strong> {modelName}
            </p>
            <p>
              <strong>LLM URL:</strong> {llmUrl}
            </p>
          </div>
        </div>
      </div>
      {isDeleting &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 flex items-center justify-center bg-dark1 bg-opacity-50">
            <div className="bg-dark p-6 rounded-lg max-w-sm w-full">
              <h3 className="text-lg font-bold text-white mb-4">
                Are you sure you want to delete this preset?
              </h3>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsDeleting(false)}
                  className="px-4 py-2 bg-dark1 text-white rounded hover:bg-dark2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-fadedRed text-white rounded hover:bg-brightRed"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </Accordion>
  );
};

export default PresetItem;

