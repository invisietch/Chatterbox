import { useEffect, useRef, useState } from 'react';
import { CogIcon } from '@heroicons/react/outline';
import PresetDropdown from './PresetDropdown';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../context/store';
import { setQuickSettings } from '../context/quickSettingsSlice';
import ExpandableTextarea from './ExpandableTextarea';
import { toast } from 'react-toastify';

const SettingsBox = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Separate ref for the cog button:
  const buttonRef = useRef<HTMLButtonElement>(null);

  const rpModeInitial = useSelector((state: RootState) => state.quickSettings.rpMode);
  const authorsNoteInitial = useSelector((state: RootState) => state.quickSettings.authorsNote);
  const authorsNoteLocInitial = useSelector((state: RootState) => state.quickSettings.authorsNoteLoc);

  const dispatch = useDispatch();

  const [rpMode, setRpMode] = useState(rpModeInitial || false);
  const [authorsNote, setAuthorsNote] = useState(authorsNoteInitial || '');
  const [authorsNoteLoc, setAuthorsNoteLoc] = useState(authorsNoteLocInitial ?? undefined);

  const [customDepth, setCustomDepth] = useState(authorsNoteLocInitial < 0 ? authorsNoteLocInitial : '');
  const [isCustomDepth, setIsCustomDepth] = useState(authorsNoteLocInitial < 0);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);

  // Close dropdown when clicking outside (and sub-modal is NOT open)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If sub-modal is open, do nothing
      if (isSubModalOpen) return;

      const target = event.target as Node;
      // If click is not inside dropdown *and* not on the cog button, close the dropdown
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
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
  }, [showDropdown, isSubModalOpen]);

  // Update Redux store whenever settings change
  useEffect(() => {
    dispatch(
      setQuickSettings({
        rpMode,
        authorsNote: authorsNote && authorsNote.trim() ? authorsNote.trim() : undefined,
        authorsNoteLoc
      })
    );
  }, [rpMode, authorsNote, authorsNoteLoc]);

  const handleRadioChange = (value: string) => {
    if (value === '0') {
      setAuthorsNoteLoc(0);
      setIsCustomDepth(false);
      setCustomDepth('');
    } else if (value === '1') {
      setAuthorsNoteLoc(1);
      setIsCustomDepth(false);
      setCustomDepth('');
    } else if (value === 'custom') {
      setIsCustomDepth(true);
      if (!customDepth) setAuthorsNoteLoc(undefined);
    }
  };

  const handleCustomDepthChange = (value: string) => {
    setCustomDepth(value);
    const depth = parseInt(value, 10);
    if (isNaN(depth)) {
      toast.warn("Author's note depth must be an integer.");
      setAuthorsNoteLoc(undefined);
    } else {
      // Negative depth
      setAuthorsNoteLoc(-Math.abs(depth));
    }
  };

  return (
    <div className="relative">
      {/* Cog Button */}
      <button
        ref={buttonRef}
        onClick={() => setShowDropdown((prev) => !prev)}
        className="p-2 rounded-full hover:bg-dark2 focus:outline-none"
        aria-label="Settings"
      >
        <CogIcon className="h-6 w-6 text-gray-200" />
      </button>

      {/* Dropdown menu */}
      {showDropdown && (
        <div
          className="absolute top-full right-0 mt-2 w-[368px] bg-dark border border-dark1 rounded shadow-lg z-50 p-4"
          ref={dropdownRef}
        >
          <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-2">Select a Preset</h1>
            <PresetDropdown />
            <h1 className="text-2xl font-bold mt-4 mb-2">Quick Settings</h1>
            <h2 className="text-lg font-bold mb-2">Quick Toggles</h2>
            <label className="flex items-center space-x-2">
              <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in mb-2">
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

            <h2 className="text-lg font-bold mb-2">Author's Note</h2>
            <ExpandableTextarea
              value={authorsNote || ''}
              label="Content"
              onChange={setAuthorsNote}
              onModal={(open: boolean) => setIsSubModalOpen(open)}
            />

            <div className="mt-2">
              <div className="flex flex-col">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="authorsNoteLoc"
                    value="0"
                    checked={authorsNoteLoc === 0}
                    onChange={() => handleRadioChange('0')}
                  />
                  <span>Before System Prompt</span>
                </label>
                <label className="flex items-center space-x-2 mt-2">
                  <input
                    type="radio"
                    name="authorsNoteLoc"
                    value="1"
                    checked={authorsNoteLoc === 1}
                    onChange={() => handleRadioChange('1')}
                  />
                  <span>After System Prompt</span>
                </label>
                <div className="flex">
                  <label className="flex items-center space-x-2 mt-2">
                    <input
                      type="radio"
                      name="authorsNoteLoc"
                      value="custom"
                      checked={isCustomDepth}
                      onChange={() => handleRadioChange('custom')}
                    />
                    <span>Custom Depth</span>
                  </label>
                  {isCustomDepth && (
                    <input
                      type="number"
                      value={customDepth}
                      onChange={(e) => handleCustomDepthChange(e.target.value)}
                      className="w-full p-2 border rounded bg-dark text-gray-200 mt-2"
                      placeholder="Enter custom depth"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsBox;
