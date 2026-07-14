import React, { useState, useEffect } from 'react';

const DECIMAL_PATTERN = /^-?\d*\.?\d*$/;

function toDisplay(value) {
  if (value === '' || value === null || value === undefined) return '';
  return String(value);
}

/** Text input for numbers — keeps partial values while typing (e.g. "2" → "25"). */
export function NumericInput({ value, onChange, className, onBlur, onFocus, ...rest }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

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
      className={className}
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
    />
  );
}

export function parseNum(value) {
  if (value === '' || value === null || value === undefined) return 0;
  const n = typeof value === 'number' ? value : parseFloat(value);
  return isFinite(n) ? n : 0;
}
