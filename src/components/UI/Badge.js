import React from 'react';

function Badge({ text, color, size = 'md' }) {
  const sizes = { sm: { fontSize: 10, padding: '1px 7px' }, md: { fontSize: 12, padding: '3px 10px' }, lg: { fontSize: 13, padding: '4px 12px' } };
  const s = sizes[size] || sizes.md;
  return (
    <span style={{
      background: color + '22',
      color,
      borderRadius: 6,
      padding: s.padding,
      fontSize: s.fontSize,
      fontWeight: 700,
      letterSpacing: 0.3,
      whiteSpace: 'nowrap',
      display: 'inline-block',
    }}>
      {text}
    </span>
  );
}

export default Badge;
