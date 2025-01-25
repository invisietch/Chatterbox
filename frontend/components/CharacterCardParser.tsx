import React, { useState, useRef, useEffect } from "react";
import ExifReader from "exifreader";
import apiClient from "../lib/api";
import FormattedText from "./FormattedText";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../lib/imageUtils";
import { toast } from "react-toastify";

interface Character {
  name: string;
  age?: number;
  description: string;
  version: "v2" | "v3";
  assets?: Record<string, string>;
  personality?: string;
  firstMessage?: string;
  scenario?: string;
  mes_example?: string;
  post_history_instructions?: string;
  [key: string]: any; // Include all additional metadata
}

const CharacterCardParser = ({ onSave }: { onSave: () => void }) => {
  const [character, setCharacter] = useState<Character | null>(null);
  const [characterId, setCharacterId] = useState<number | null>(null); // ID for API uploads
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setCharacter(null);

    const file = event.target.files?.[0];
    if (!file) {
      setError("No file selected.");
      return;
    }

    function decodeBase64(base64) {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const decoder = new TextDecoder("utf-8");
      return decoder.decode(bytes);
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const tags = ExifReader.load(arrayBuffer, { expanded: true });

      if (tags["png"]["chara"]?.description || tags["png"]["chara"]?.value) {
        const characterData = tags["png"]["chara"].description || tags["png"]["chara"].value;
        const decodedData = decodeBase64(characterData as string);
        const parsedCharacter: Character = {
          ...JSON.parse(decodedData),
          version: "v2",
        };
        setCharacter(parsedCharacter.data);
      } else {
        setError("No compatible character card metadata found. Ensure the file contains valid CCv2 or CCv3 data.");
        return;
      }

      // Handle image cropping
      const objectUrl = URL.createObjectURL(file);
      setUploadedImage(file);
      setPreviewUrl(objectUrl);
      setIsCropperOpen(true); // Open cropper modal
    } catch (e) {
      setError("Failed to parse character card. Ensure the file is a valid CCv2 or CCv3 image.");
    }
  };

  const handleCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleSaveCroppedImage = async () => {
    setIsCropperOpen(false); // Close cropper modal
  };

  const handleSave = async () => {
    if (!character) return;

    try {
      const response = await apiClient.post("/characters", {
        name: character.name,
        creator: character.creator || null,
        creator_notes: character.creator_notes || null,
        character_version: character.character_version || null,
        age: character.age || null,
        scenario: character.scenario || "",
        personality: character.personality || "",
        description: character.description || "",
        first_message: character.first_mes || "",
        example_messages: character.mes_example || "",
        alternate_greetings: character.alternate_greetings || null,
        system_prompt: character.system_prompt || null,
        post_history_instructions: character.post_history_instructions || "",
      });

      if (response.status !== 200) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const characterId = response.data.id;

      if (character.tags) {
        for (const tag of character.tags) {
          const tagResponse = await apiClient.post(`/characters/${characterId}/tags/${tag}`);

          if (tagResponse.status !== 200) {
            throw new Error(`API error: ${tagResponse.statusText}`)
          }
        }
      }

      setCharacterId(characterId); // Save character ID for image upload
      toast.success('Successfully saved character.');
    } catch (error) {
      toast.error("Failed to save character and/or assign tags.");
    }
  };

  useEffect(() => {
    const uploadImage = async () => {
      if (!uploadedImage || !croppedAreaPixels) return;

      const croppedImage = await getCroppedImg(previewUrl!, croppedAreaPixels, 200);

      const blob = await fetch(croppedImage).then((res) => res.blob());
      const file = new File([blob], `${character?.name}.png`, { type: "image/png" });

      const formData = new FormData();
      formData.append("image", file);

      if (characterId) {
        await apiClient.post(`/characters/${characterId}/image`, formData);
        console.log("Avatar uploaded successfully.");
      }
    }

    if (characterId) {
      uploadImage();
      onSave();
    }
  }, [characterId])

  const handleCancel = () => {
    setCharacter(null);
    setError(null);
    setUploadedImage(null);
    setPreviewUrl(null);
    setIsCropperOpen(false);
    onSave();
  };

  return (
    <div className="p-4 w-full mx-auto">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="mb-4 block w-full text-sm bg-dark text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      {error && <p className="text-red-500">{error}</p>}
      {character && (
        <div className="mt-4 p-4 border rounded bg-dark">
          <h2 className="text-xl font-semibold">Character Details</h2>
          <div>
            <h3 className="text-lg font-semibold">Name:</h3>
            <p><FormattedText t={character.name} /></p>
          </div>
          {character.creator && (
            <div>
              <h3 className="text-lg font-semibold">Creator:</h3>
              <p>{character.creator}</p>
            </div>
          )}
          {character.creator_notes && (
            <div>
              <h3 className="text-lg font-semibold">Creator Notes:</h3>
              <p>{character.creator_notes}</p>
            </div>
          )}
          {character.character_version && (
            <div>
              <h3 className="text-lg font-semibold">Character Version:</h3>
              <p>{character.character_version}</p>
            </div>
          )}
          {character.age && (
            <div>
              <h3 className="text-lg font-semibold">Age:</h3>
              <p>{character.age}</p>
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold">Description:</h3>
            <p><FormattedText t={character.description} /></p>
          </div>
          {character.personality && (
            <div>
              <h3 className="text-lg font-semibold">Personality:</h3>
              <p><FormattedText t={character.personality} /></p>
            </div>
          )}
          {character.first_mes && (
            <div>
              <h3 className="text-lg font-semibold">First Message:</h3>
              <p><FormattedText t={character.first_mes} /></p>
            </div>
          )}
          {character.scenario && (
            <div>
              <h3 className="text-lg font-semibold">Scenario:</h3>
              <p><FormattedText t={character.scenario} /></p>
            </div>
          )}
          {character.mes_example && (
            <div>
              <h3 className="text-lg font-semibold">Example Messages:</h3>
              <p><FormattedText t={character.mes_example} /></p>
            </div>
          )}
          {character.system_prompt && (
            <div>
              <h3 className="text-lg font-semibold">System Prompt:</h3>
              <p><FormattedText t={character.system_prompt} /></p>
            </div>
          )}
          {character.post_history_instructions && (
            <div>
              <h3 className="text-lg font-semibold">Post History Instructions:</h3>
              <p><FormattedText t={character.post_history_instructions} /></p>
            </div>
          )}
          {character.alternate_greetings && (
            <div>
              <h3 className="text-lg font-semibold">Alternate Greetings:</h3>
              {character.alternate_greetings.map((greeting: string) =>
                <p><FormattedText t={greeting} /></p>
              )}
            </div>
          )}
          {character.tags && (
            <div>
              <h3 className="text-lg font-semibold">Tags:</h3>
              {character.tags.map((tag: string) =>
                <p><FormattedText t={`- ${tag}`} /></p>
              )}
            </div>
          )}
          {character.assets && (
            <div>
              <h3 className="text-lg font-semibold">Assets:</h3>
              <ul className="list-disc list-inside">
                {Object.entries(character.assets).map(([key, value]) => (
                  <li key={key}>
                    <strong>{key}:</strong> <FormattedText t={String(value)} />
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4 flex space-x-4">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-dark1 text-white rounded hover:bg-dark2"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-fadedGreen text-white rounded hover:bg-brightGreen"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Cropper Modal */}
      {isCropperOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">Crop Image</h3>
            <div className="relative w-full h-64 bg-gray-900 rounded">
              <Cropper
                image={previewUrl!}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />
            </div>
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => setIsCropperOpen(false)}
                className="px-4 py-2 bg-dark1 text-white rounded hover:bg-dark2"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCroppedImage}
                className="px-4 py-2 bg-fadedGreen text-white rounded hover:bg-brightGreen"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterCardParser;
