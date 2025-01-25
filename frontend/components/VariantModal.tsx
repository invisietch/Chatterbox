import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import Avatar from './Avatar';

const VariantModal = ({
  vs,
  isAssistant,
  avatarData,
  onClose,
  onSave,
}: {
  vs: string[];
  isAssistant: boolean;
  avatarData: any;
  onClose: () => void;
  onSave: (ci: number, ri: number) => void;
}) => {
  const [variants, setVariants] = useState<string[]>([]);
  const [selectedContentIdx, setSelectedContentIdx] = useState(null);
  const [selectedRejectedIdx, setSelectedRejectedIdx] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [selectedRejected, setSelectedRejected] = useState(null);

  useEffect(() => {
    setVariants(vs);
  }, [vs]);

  const handleSelect = (idx, variant) => {
    if (!selectedContent) {
      setSelectedContentIdx(idx);
      setSelectedContent(variant);
    } else if (isAssistant && !selectedRejected && variant !== selectedContent) {
      setSelectedRejectedIdx(idx);
      setSelectedRejected(variant);
    } else {
      setSelectedContentIdx(idx);
      setSelectedContent(variant);
      setSelectedRejectedIdx(null);
      setSelectedRejected(null);
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-50">
      <div className="bg-dark2 p-6 rounded-lg max-w-3xl w-full h-3/4 overflow-y-auto">
        <h3 className="text-lg font-bold text-white mb-4 text-center">
          {isAssistant
            ? selectedRejected
              ? 'Which message should be chosen?'
              : selectedContent
                ? 'Which message should be rejected?'
                : 'Which message should be chosen?'
            : 'Which message should be chosen?'}
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {isAssistant && selectedContent && (
            <div
              className={`border-2 p-4 rounded-md cursor-pointer ${selectedRejected === null ? 'border-fadedRed' : 'border-white'}`}
              onClick={() => handleSelect(-2, null)}
            >
              <div className="text-center text-gray-400">None</div>
            </div>
          )}

          {variants.map((variant, idx) => (
            <div
              key={idx}
              className={`border-2 p-4 rounded-md cursor-pointer ${variant === selectedContent ? 'border-fadedGreen' : variant === selectedRejected ? 'border-fadedRed' : 'border-white'}`}
              onClick={() => {
                handleSelect(idx, variant);
              }}
            >
              <div className="flex items-center mb-2">
                {avatarData && (
                  <Avatar
                    id={avatarData.id}
                    name={avatarData.name}
                    type={avatarData.type}
                    size={40}
                  />
                )}
              </div>
              <div dangerouslySetInnerHTML={{ __html: variant.replaceAll('\n', '<br />') }} />
            </div>
          ))}
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-dark1 text-white rounded hover:bg-dark2"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(selectedContentIdx, selectedRejectedIdx)}
            disabled={!selectedContent}
            className={`px-4 py-2 bg-fadedGreen text-white rounded ${
              selectedContent ? 'hover:bg-brightGreen' : 'opacity-50 cursor-not-allowed'
            }`}
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default VariantModal;
