import React, { useState, useEffect } from 'react';
import { List } from 'lucide-react';

interface EditableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  displayTransform?: (option: string) => string;
}

export const EditableSelect: React.FC<EditableSelectProps> = ({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  className = "", 
  displayTransform 
}) => {
  const [isManual, setIsManual] = useState(false);

  // Check if initial value is manual (not in options and not empty)
  useEffect(() => {
    if (value && !options.includes(value) && value !== 'OTHER_MANUAL') {
      setIsManual(true);
    }
  }, [value, options]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'OTHER_MANUAL') {
      setIsManual(true);
      onChange('');
    } else {
      onChange(e.target.value);
    }
  };

  const handleBackToList = () => {
    setIsManual(false);
    // If current manual value is empty, pick the first option or empty
    if (!value || !options.includes(value)) {
      onChange(options[0] || '');
    }
  };

  const datalistId = React.useId();

  if (isManual) {
    return (
      <div className="relative flex items-center group">
        <input
          type="text"
          list={datalistId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Type manually..."}
          className={`${className} pr-8 focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
          autoFocus
        />
        <datalist id={datalistId}>
          {options.map(opt => (
            <option key={opt} value={opt} />
          ))}
        </datalist>
        <button
          type="button"
          onClick={handleBackToList}
          className="absolute right-2 text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-slate-100"
          title="Switch back to list"
        >
          <List className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={handleSelectChange}
      className={`${className} focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => (
        <option key={opt} value={opt}>
          {displayTransform ? displayTransform(opt) : opt}
        </option>
      ))}
      <option value="OTHER_MANUAL" className="font-bold text-blue-600">+ Other (Type Manually)</option>
    </select>
  );
};
