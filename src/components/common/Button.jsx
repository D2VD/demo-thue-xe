// src/components/common/Button.jsx
import React from 'react';

// Ví dụ về các variant
// src/components/common/Button.jsx (Thêm/sửa variant)
// ...
const variants = {
  primary: 'bg-primary-green text-white hover:bg-primary-green-dark',
  secondary: 'bg-secondary-blue text-white hover:bg-secondary-blue-dark',
  outline: 'border border-primary-green text-primary-green hover:bg-primary-green hover:text-white', // Outline cho nền sáng
  'outline-light': 'border-white text-white hover:bg-white hover:text-primary-green', // Outline cho nền tối
  danger: 'bg-red-500 text-white hover:bg-red-600',
  text: 'text-primary-green hover:text-primary-green-dark',
};
// ...
// Khi sử dụng: <Button variant="outline-light" ... >

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) {
  const baseStyle = 'font-semibold rounded focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150';
  const variantStyle = variants[variant] || variants.primary;
  const sizeStyle = sizes[size] || sizes.md;
  const disabledStyle = disabled || isLoading ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variantStyle} ${sizeStyle} ${disabledStyle} ${className}`}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {leftIcon && !isLoading && <span className="mr-2 inline-flex items-center">{leftIcon}</span>}
      {children}
      {rightIcon && !isLoading && <span className="ml-2 inline-flex items-center">{rightIcon}</span>}
    </button>
  );
}