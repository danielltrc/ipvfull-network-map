import React from 'react';

interface BreadcrumbItem {
  label: string;
  onClick: () => void;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbNav({ items }: BreadcrumbNavProps) {
  if (items.length <= 1) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 56,
        left: 12,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        background: 'rgba(8, 12, 24, 0.85)',
        border: '1px solid #2a3a5a',
        borderRadius: 6,
        padding: '4px 10px',
        backdropFilter: 'blur(6px)',
        fontFamily: 'monospace',
        fontSize: 11,
      }}
    >
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && (
            <span style={{ color: '#444', margin: '0 2px' }}>›</span>
          )}
          <button
            onClick={item.onClick}
            style={{
              background: 'transparent',
              border: 'none',
              color: idx === items.length - 1 ? '#e0e0e0' : '#4488ff',
              cursor: idx === items.length - 1 ? 'default' : 'pointer',
              padding: 0,
              fontSize: 11,
              fontFamily: 'monospace',
              textDecoration: idx < items.length - 1 ? 'underline' : 'none',
            }}
          >
            {item.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
