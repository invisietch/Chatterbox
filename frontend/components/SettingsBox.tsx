import { useEffect, useRef, useState } from 'react';
import { CogIcon } from '@heroicons/react/outline'; // Import the cog icon
import ModelSearch from './ModelSearch';

const SettingsBox = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <div className="relative">
      {/* Button to toggle dropdown */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="p-2 rounded-full hover:bg-dark2 focus:outline-none"
        aria-label="Settings"
      >
        <CogIcon className="h-6 w-6 text-gray-200" />
      </button>

      {/* Dropdown menu */}
      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-dark border border-dark1 rounded shadow-lg z-50 p-4" ref={dropdownRef}>
          <ul className="space-y-2">
            <li>
              <h3 className="font-bold mb-2">Token Count Model</h3>
              <ModelSearch />
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default SettingsBox;
