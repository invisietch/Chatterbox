import { useState } from "react";
import { ChevronUpIcon } from "@heroicons/react/solid";
import Avatar from "./Avatar";

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  id?: number;
  name?: string;
  type?: "character" | "persona";
  isOpen?: boolean; // Optional external control
  defaultOpen?: boolean; // Optional default open state
  onToggle?: (isOpen: boolean) => void; // Callback for state changes
}

const Accordion = ({
  title,
  children,
  id,
  name,
  type,
  isOpen,
  defaultOpen = false,
  onToggle,
}: AccordionProps) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  // Determine the "open" state based on external or internal control
  const open = isOpen !== undefined ? isOpen : internalOpen;

  const handleToggle = () => {
    const newState = !open;
    if (isOpen === undefined) {
      setInternalOpen(newState); // Update internal state only if not controlled externally
    }
    if (onToggle) {
      onToggle(newState); // Notify parent component of state change
    }
  };

  return (
    <div className="w-full">
      <div>
        <button
          onClick={handleToggle}
          className="flex justify-between items-center w-full px-4 py-2 text-sm font-medium text-left text-gray-200 bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75"
        >
          <div className="flex items-center space-x-3">
            {id && name && type && <Avatar id={id} name={name} type={type} size={36} />}
            <h2>{title}</h2>
          </div>
          <ChevronUpIcon
            className={`w-5 h-5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>
      {open && (
        <div className="transition duration-200 ease-out transform scale-100 opacity-100 px-4 pt-4 pb-2 text-sm text-gray-400">
          {children}
        </div>
      )}
    </div>
  );
};

export default Accordion;
