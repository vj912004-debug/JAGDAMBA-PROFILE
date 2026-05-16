import React from 'react';

export default function StarRating({ value = 0, onChange, readonly = false, size = 14 }) {
  const labels = ['', 'Poor', 'Average', 'Good', 'Very Good', 'Excellent'];
  return (
    <div className="stars" title={labels[value] || ''}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          className={`star${n <= value ? ' filled' : ''}${readonly ? ' readonly' : ''}`}
          style={{ fontSize: size }}
          onClick={() => !readonly && onChange && onChange(n)}
        >★</span>
      ))}
      {!readonly && value > 0 && (
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>{labels[value]}</span>
      )}
    </div>
  );
}
