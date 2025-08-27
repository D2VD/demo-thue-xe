// src/components/common/Alert.jsx
import React from 'react';

const alertStyles = {
  success: 'bg-green-100 border-green-400 text-green-700',
  error: 'bg-red-100 border-red-400 text-red-700',
  warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
  info: 'bg-blue-100 border-blue-400 text-blue-700',
};

export default function Alert({ type = 'info', message, onClose, children }) {
  if (!message && !children) return null;

  return (
    <div
      className={`border-l-4 p-4 my-4 ${alertStyles[type] || alertStyles.info}`}
      role="alert"
    >
      <div className="flex">
        <div className="py-1">
          {/* Icon có thể thêm ở đây tùy theo type */}
        </div>
        <div className="ml-3">
          {message && <p className="font-bold">{message}</p>}
          {children && <div className="text-sm">{children}</div>}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto -mx-1.5 -my-1.5 bg-transparent rounded-lg focus:ring-2 p-1.5 inline-flex h-8 w-8"
            aria-label="Dismiss"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}