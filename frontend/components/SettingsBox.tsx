import { useEffect, useRef, useState } from 'react';
import { CogIcon } from '@heroicons/react/outline'; // Import the cog icon
import PresetDropdown from './PresetDropdown';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../context/store';
import { setQuickSettings } from '../context/quickSettingsSlice';

const SettingsBox = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const rpModeInitial = useSelector((state: RootState) => state.model.selectedPresetId);
  const dispatch = useDispatch();
  const [rpMode, setRpMode] = useState(rpModeInitial || false);

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

  useEffect(() => {
    dispatch(setQuickSettings({ rpMode }));
  }, [rpMode]);

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
          <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-2">Select a Preset</h1>
            <PresetDropdown />
            <h1 className="text-2xl font-bold mt-4 mb-2">Quick Settings</h1>
            <label className="flex items-center space-x-2">
              <div
                className={`relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in`}
              >
                <div className="relative inline-block w-12 h-5 mt-1">
                  <input
                    type="checkbox"
                    checked={rpMode}
                    onChange={() => setRpMode(!rpMode)}
                    className="toggle-checkbox absolute opacity-0 w-0 h-0"
                  />
                  <span
                    className={`toggle-label block w-full h-full rounded-full cursor-pointer transition-colors duration-300 ${!rpMode ? 'bg-fadedRed' : 'bg-fadedGreen'
                      }`}
                  ></span>
                  <span
                    className={`toggle-indicator absolute top-0 left-0 w-5 h-5 rounded-full bg-white border-4 transform transition-transform duration-300 ${!rpMode ? 'translate-x-8' : 'translate-x-0'
                      }`}
                  ></span>
                </div>
              </div>
              <div>RP Mode</div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsBox;
