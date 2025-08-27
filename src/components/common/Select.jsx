// src/components/common/Select.jsx
import React from 'react'; // Thêm forwardRef

// Bọc component bằng React.forwardRef
const Select = React.forwardRef(({
  label,
  labelClassName = "text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
  name,
  id,
  value,
  onChange,
  onBlur, // Thêm onBlur từ Controller
  options = [],
  error,
  required = false,
  className = '',
  wrapperClassName = '',
  ...props
}, ref) => { // Nhận ref làm tham số thứ hai
  const baseSelectStyle = "appearance-none rounded-md relative block w-full px-3 py-2 border placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-primary-green focus:border-primary-green sm:text-sm";
  const errorSelectStyle = error ? "border-red-500 ring-1 ring-red-500" : "border-gray-300 dark:border-gray-600";

  return (
    <div className={wrapperClassName}>
      {label && <label htmlFor={id || name} className={`block ${labelClassName}`}>{label}</label>}
      <select
        id={id || name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur} // Truyền onBlur vào select
        required={required}
        className={`${baseSelectStyle} ${errorSelectStyle} ${className} mt-1`}
        ref={ref} // Gán ref cho thẻ select
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select'; // Thêm displayName để debug dễ hơn

export default Select;