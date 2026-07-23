import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { List, ChevronDown } from 'lucide-react';
import { upper } from '../utils/textCase';

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
  className = '',
  displayTransform,
}) => {
  const [isManual, setIsManual] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const datalistId = React.useId();

  // Keep the size-enhancement transform from the original
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

  // If value is not in options, switch to manual mode
  useEffect(() => {
    if (value && !options.includes(value) && value !== 'OTHER_MANUAL') {
      setIsManual(true);
    }
  }, [value, options]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Close on scroll/resize so dropdown doesn't drift
  useEffect(() => {
    if (!isOpen) return;
    const close = (e: Event) => {
      if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) return;
      setIsOpen(false);
    };
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen && triggerRef.current) {
      setDropdownRect(triggerRef.current.getBoundingClientRect());
      setSearchTerm('');
    }
    setIsOpen(v => !v);
  };

  const handleSelect = (opt: string) => {
    if (opt === '__MANUAL__') {
      setIsManual(true);
      onChange('');
    } else {
      onChange(opt);
    }
    setIsOpen(false);
  };

  const handleBackToList = () => {
    setIsManual(false);
    if (!value || !options.includes(value)) {
      onChange(options[0] || '');
    }
  };

  // ── Manual input mode ────────────────────────────────────────
  if (isManual) {
    return (
      <div className="relative flex items-center group">
        <input
          type="text"
          list={datalistId}
          value={value}
          onChange={(e) => onChange(upper(e.target.value))}
          placeholder={placeholder || 'Type manually...'}
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
          className="absolute right-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Switch back to list"
        >
          <List className="w-3 h-3" />
        </button>
      </div>
    );
  }

  // ── Custom dropdown (replaces native <select> for dark mode compat) ──
  const displayLabel = displayTransform && value ? displayTransform(value) : value;

  // Portal dropdown — rendered at document.body, positioned via fixed coords
  // so it escapes any overflow:hidden/auto parent (e.g. table's overflow-x-auto).
  // Dark mode works because document.documentElement carries the .dark class.
  const dropdown =
    isOpen && dropdownRect
      ? createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: dropdownRect.bottom + 2,
              left: dropdownRect.left,
              width: dropdownRect.width,
              minWidth: Math.max(dropdownRect.width, 160),
              zIndex: 9999,
            }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl overflow-hidden"
            onMouseDown={e => e.stopPropagation()}
          >
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onClick={e => e.stopPropagation()}
                onKeyDown={e => { e.stopPropagation(); if (e.key === 'Escape') setIsOpen(false); }}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="max-h-56 overflow-y-auto">
              {placeholder && !searchTerm && (
                <button
                  type="button"
                  onClick={() => { onChange(''); setIsOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-sm font-semibold text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {placeholder}
                </button>
              )}
              {options.filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase())).map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left px-3 py-1.5 text-sm font-semibold transition-colors ${
                    value === opt
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {displayTransform ? displayTransform(opt) : opt}
                </button>
              ))}
            </div>
            <div className="border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleSelect('__MANUAL__')}
                className="w-full text-left px-3 py-1.5 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
              >
                + Other (Type Manually)
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={`${enhancedClassName} relative flex items-center justify-between w-full text-left pr-6 focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
      >
        <span
          className={`truncate ${
            displayLabel
              ? 'text-slate-800 dark:text-slate-100'
              : 'text-slate-400 dark:text-slate-500 font-normal'
          }`}
        >
          {displayLabel || placeholder || ''}
        </span>
        <ChevronDown
          className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {dropdown}
    </div>
  );
};
