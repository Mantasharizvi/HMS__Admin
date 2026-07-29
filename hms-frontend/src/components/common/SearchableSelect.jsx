import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

// A searchable <select> replacement: click to open, type to filter options,
// click an option to select it. Built to match Input.jsx's visual style so it
// drops into forms alongside the regular Input/Select components.
const SearchableSelect = ({
  label,
  value,
  onChange, // (selectedValue) => void
  options = [], // [{ value, label }]
  placeholder = 'Search…',
  required = false,
  disabled = false,
  error = '',
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);

  const selectedOption = options.find((o) => o.value === value);

  // Close the dropdown when clicking anywhere outside it. Uses 'click'
  // (not 'mousedown') so it never races with an option button's own click -
  // mousedown fires first and was closing the dropdown before the option's
  // click could register, making selections silently fail.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredOptions = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const handleSelect = (option) => {
    onChange(option.value);
    setQuery('');
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
  };

  return (
    <div className="w-full flex flex-col gap-1.5" ref={wrapperRef}>
      {label && (
        <label className="text-sm font-medium text-ink-900">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
        <input
          type="text"
          disabled={disabled}
          value={open ? query : (selectedOption?.label || '')}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery('');
          }}
          placeholder={selectedOption ? selectedOption.label : placeholder}
          className={`w-full rounded-lg border bg-white text-ink-900 text-sm
            px-3.5 py-2.5 pl-10 pr-9
            placeholder:text-ink-400
            focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500
            transition-colors duration-150
            ${error ? 'border-danger-600' : 'border-line'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
        {value && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {open && !disabled && (
          <div className="absolute z-[100] mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-line bg-white shadow-lg">
            {filteredOptions.length === 0 ? (
              <p className="px-3.5 py-2.5 text-sm text-ink-400">No medicine found</p>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  // Stops the input from blurring before the click lands -
                  // without this, some browsers cancel the click entirely
                  // once the input loses focus mid-gesture, so the option
                  // never actually gets selected.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(option)}
                  className={`w-full text-left px-3.5 py-2 text-sm hover:bg-teal-50 ${
                    option.value === value ? 'bg-teal-50 text-teal-700 font-medium' : 'text-ink-900'
                  }`}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-danger-600">{error}</p>}
    </div>
  );
};

export default SearchableSelect;