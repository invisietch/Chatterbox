import { useState, useEffect, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../lib/imageUtils'; // Utility for cropping and resizing
import apiClient from '../lib/api';
import { toast } from 'react-toastify';

interface AvatarProps {
  id?: number;
  name?: string;
  type?: 'character' | 'persona';
  seed?: string;
  size?: number; // Display size of the avatar
}

const Avatar: React.FC<AvatarProps> = ({ id, name, type, seed, size = 120 }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // URL for displaying the image

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch the avatar image from the API
  const fetchImage = async () => {
    if (type && id && name) {
      try {
        const response = await apiClient.get(`/${type}s/${id}/image`, { responseType: 'blob' });
        if (response.status === 200) {
          const blob = response.data;
          const objectUrl = URL.createObjectURL(blob);
          setPreviewUrl(objectUrl);
        }
      } catch (error) {
        setPreviewUrl(null); // Fallback to placeholder if no image found
      }
    }
  };

  // Fetch the image when the component mounts
  useEffect(() => {
    fetchImage();
  }, [id, type]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setIsModalOpen(true);
    }
  };

  const handleCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleUpload = async () => {
    if (!uploadedImage || !croppedAreaPixels) return;

    try {
      const croppedImage = await getCroppedImg(previewUrl!, croppedAreaPixels, 200);

      const blob = await fetch(croppedImage).then((res) => res.blob());
      const file = new File([blob], `${name}.png`, { type: 'image/png' });

      const formData = new FormData();
      formData.append('image', file);

      await apiClient.post(`/${type}s/${id}/image`, formData);

      fetchImage();
      toast.success('Successfully uploaded avatar.');
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Failed to upload avatar.');
    }
  };

  const avatarName = seed || name;

  return (
    <div
      className="relative group"
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      {/* Avatar */}
      <img
        src={previewUrl || `https://api.multiavatar.com/${encodeURIComponent(avatarName)}.svg`}
        alt={`${type} avatar`}
        className="object-cover rounded-full border-2 border-gray-300 cursor-pointer group-hover:opacity-80"
        style={{
          width: `${size}px`,
          height: `${size}px`,
        }}
        onClick={() => fileInputRef.current?.click()}
      />

      {/* Hidden File Input */}
      <input
        type="file"
        accept="image/png, image/jpeg"
        ref={fileInputRef}
        className="hidden"
        onChange={handleImageChange}
      />

      {/* Crop Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black bg-opacity-50" />
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg shadow-lg p-4 w-full max-w-md">
            <Dialog.Title className="text-xl font-bold text-white mb-4">Crop Image</Dialog.Title>

            <div className="relative w-full h-64 bg-gray-900 rounded">
              <Cropper
                image={previewUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />
            </div>

            <div className="flex justify-between items-center mt-4">
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={handleUpload}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Avatar;
