import { TrashIcon } from '@heroicons/react/outline';
import React, { RefObject, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

interface ExpandableTextareaProps {
  value: string;
  label: string;
  onChange: (value: string) => void;
  onModal?: (t: boolean) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onTrashClick?: () => void; // New optional prop for trash icon functionality
  ref?: RefObject<HTMLTextAreaElement>;
}

const ExpandableTextarea: React.FC<ExpandableTextareaProps> = ({
  value,
  label,
  onChange,
  ref,
  onKeyDown,
  onModal,
  onTrashClick, // Trash icon functionality
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    onChange(newText);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModalOpen]);

  const handleModalOpenClose = (open: boolean) => {
    setIsModalOpen(open);
    onModal && onModal(open);
  };

  return (
    <>
      <div className="border-dark2 pb-1 relative mt-1">
        <div className="flex justify-between items-center">
          <h2>{label}</h2>
          <div className="flex space-x-2 absolute top-2 right-2">
            {/* Expand Button */}
            {!isModalOpen && (
              <button
                onClick={() => handleModalOpenClose(true)}
                className="text-grey-300 hover:text-yellow-300"
                aria-label="Edit message"
              >
                ⌞ ⌝
              </button>
            )}
            {/* Trash Icon */}
            {onTrashClick && (
              <button
                onClick={onTrashClick}
                className="text-grey-300 hover:text-red-300"
                aria-label="Remove"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center p-4">
        {/* Main Textarea */}
        <textarea
          ref={ref}
          value={value}
          onChange={handleChange}
          className="w-full p-2 border rounded bg-dark text-gray-200 mb-2"
          rows={5}
          onKeyDown={onKeyDown}
          placeholder="Enter your text here..."
        />

        {/* Modal */}
        {isModalOpen &&
          ReactDOM.createPortal(
            <div className="fixed inset-0 flex items-center justify-center bg-dark1 bg-opacity-50 z-50">
              <div
                className="bg-dark2 text-gray-200 p-6 rounded-lg shadow-lg w-11/12 max-w-3xl"
                ref={modalRef}
              >
                <h2 className="text-lg font-semibold mb-4">Editing {label}</h2>

                <textarea
                  value={value}
                  onChange={handleChange}
                  onKeyDown={onKeyDown}
                  className="w-full p-2 border rounded bg-dark text-gray-200 mt-2 h-96"
                />

                <div className="flex justify-end mt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModalOpenClose(false);
                    }}
                    className="px-4 py-2 bg-fadedGreen text-gray-200 rounded-lg shadow hover:bg-brightGreen focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>
    </>
  );
};

export default ExpandableTextarea;
