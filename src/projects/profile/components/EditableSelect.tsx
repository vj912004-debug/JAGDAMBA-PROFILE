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

  // Automatically increase size and padding to ensure dropdowns are clear, easy-to-read, and professional
  const enhancedClassName = className
    .replace(/\bp-1\.5\b/g, 'px-2.5 py-2')
    .replace(/\bp-1\b/g, 'px-2.5 py-2')
    .replace(/\bp-2\b/g, 'px-3 py-2.5')
    .replace(/\bpy-1\b/g, 'py-2')
    .replace(/\bpy-0\.5\b/g, 'py-1.5')
    .replace(/\bpx-1\.5\b/g, 'px-2.5')
    .replace(/\btext-xs\b/g, 'text-sm font-semibold')
    .replace(/\btext-\[10px\]\b/g, 'text-xs font-bold')
    .replace(/\bw-28\b/g, 'w-36')
    .replace(/\bw-20\b/g, 'w-24')
    .replace(/\bw-32\b/g, 'w-40')
    .replace(/\bw-18\b/g, 'w-24')
    .replace(/\bw-22\b/g, 'w-28');

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
          className={`${enhancedClassName} pr-8 focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
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
          className="absolute right-2 text-slate-400 hover:text-blue-600 dark:text-blue-400 transition-colors p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800"
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
      className={`${enhancedClassName} focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
    >
      {placeholder && <option value="" className="bg-white dark:bg-slate-800">{placeholder}</option>}
      {options.map(opt => (
        <option key={opt} value={opt} className="bg-white dark:bg-slate-800">
          {displayTransform ? displayTransform(opt) : opt}
        </option>
      ))}
      <option value="OTHER_MANUAL" className="font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800">+ Other (Type Manually)</option>
    </select>
  );
};
