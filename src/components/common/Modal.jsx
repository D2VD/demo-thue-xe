// src/components/common/Modal.jsx
import React, { useEffect, useRef } from 'react'; // Thêm useRef
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footerContent,
  size = 'md', // sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl, 7xl, full
  closeOnOverlayClick = true, // Thêm prop để kiểm soát việc đóng modal khi click overlay
  showCloseButton = true, // Thêm prop để ẩn/hiện nút X
}) {
  const modalContentRef = useRef(null); // Ref cho nội dung modal

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' || event.keyCode === 27) { // ESC key
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Ngăn scroll body khi modal mở
      window.addEventListener('keydown', handleEsc);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset'; // Đảm bảo overflow được reset khi component unmount
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'w-full h-full max-w-none max-h-none rounded-none', // Cho modal full màn hình
  };

  const handleOverlayClick = () => {
    if (closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    // Overlay
    <div
      className="fixed inset-0 bg-black bg-opacity-75 dark:bg-opacity-80 backdrop-blur-sm flex justify-center items-center z-[1000] p-4 overflow-y-auto transition-opacity duration-300 ease-in-out" // Tăng z-index, tăng opacity, thêm transition
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Modal Content */}
      <div
        ref={modalContentRef}
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full ${sizeClasses[size] || sizeClasses.md} flex flex-col max-h-[90vh] transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalShow`} // Thêm animation
        onClick={(e) => e.stopPropagation()} // Ngăn event click lan ra overlay
        role="document"
      >
        {/* Modal Header */}
        {(title || showCloseButton) && (
          <div className="flex justify-between items-center p-4 md:p-5 border-b border-gray-200 dark:border-gray-700">
            {title && (
              <h3 id="modal-title" className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                aria-label="Đóng modal"
              >
                <XMarkIcon className="h-5 w-5" />
                <span className="sr-only">Đóng</span>
              </button>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 md:p-6 overflow-y-auto flex-grow custom-scrollbar"> {/* Thêm custom-scrollbar nếu muốn */}
          {children}
        </div>

        {/* Modal Footer */}
        {footerContent && (
          <div className="flex flex-wrap justify-end items-center p-4 md:p-5 border-t border-gray-200 dark:border-gray-700 space-x-3 rtl:space-x-reverse">
            {footerContent}
          </div>
        )}
      </div>
    </div>
  );
}

// Thêm keyframes cho animation vào file CSS global của bạn (ví dụ: src/index.css)
/*
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  @keyframes modalShow {
    0% {
      opacity: 0;
      transform: scale(0.95) translateY(-10px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  .animate-modalShow {
    animation: modalShow 0.3s ease-out forwards;
  }

  // Tùy chỉnh scrollbar cho modal body (tùy chọn)
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1; // Màu xám nhạt của Tailwind (gray-300)
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #9ca3af; // Màu xám đậm hơn (gray-400)
  }
  .dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #4b5563; // Màu xám cho dark mode (gray-600)
  }
  .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #374151; // (gray-700)
  }
}
*/