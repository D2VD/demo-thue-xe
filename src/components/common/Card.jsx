// src/components/common/Card.jsx
import React from 'react';

export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white shadow-lg rounded-lg overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}