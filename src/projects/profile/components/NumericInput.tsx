import React, { useState, useEffect } from 'react';
import { cn } from './Sidebar';

/** Allow digits and one optional decimal point while typing */
const DECIMAL_PATTERN = /^-?\d*\.?\d*$/;

export interface NumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: string | number;
  onChange: (value: string) => void;
}

function toDisplay(value: string | number | null | undefined): string {
  if (value === '' || value === null || value === undefined) return '';
  return String(value);
}

/**
 * Text input for numbers — keeps partial values while typing (e.g. "2" → "25").
 * Uses local draft while focused so parent re-renders don't reset the field.
 */
export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  className,
  onBlur,
  onFocus,
  ...rest
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  // Sync from parent when not actively editing
  useEffect(() => {
    if (!editing) setDraft(toDisplay(value));
  }, [value, editing]);

  const display = editing ? draft : toDisplay(value);

  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      data-numeric="true"
      value={display}
      onFocus={e => {
        setEditing(true);
        setDraft(toDisplay(value));
        onFocus?.(e);
      }}
      onChange={e => {
        const v = e.target.value;
        if (v !== '' && !DECIMAL_PATTERN.test(v)) return;
        setDraft(v);
        onChange(v);
      }}
      onBlur={e => {
        let v = draft;
        if (v.endsWith('.')) v = v.slice(0, -1);
        setEditing(false);
        setDraft(v);
        if (v !== toDisplay(value)) onChange(v);
        onBlur?.(e);
      }}
      className={cn(className)}
    />
  );
};

/** Parse stored string/number for calculations */
export function parseNum(value: string | number | null | undefined): number {
  if (value === '' || value === null || value === undefined) return 0;
  const n = typeof value === 'number' ? value : parseFloat(value);
  return isFinite(n) ? n : 0;
}
