// src/components/common/Input.jsx
import React from 'react'; // Import React

// Bọc component bằng React.forwardRef
const Input = React.forwardRef(({
  type = 'text',
  placeholder,
  // value, // react-hook-form sẽ quản lý value thông qua register
  // onChange, // react-hook-form sẽ quản lý onChange thông qua register
  name, // Vẫn cần name cho register
  id,
  label,
  labelClassName = "text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
  error,
  className = '',
  icon,
  // required = false, // react-hook-form sẽ xử lý required thông qua schema Zod
  wrapperClassName = '',
  ...props // Các props khác (bao gồm cả props từ register)
}, ref) => { // 'ref' là tham số thứ hai được cung cấp bởi forwardRef

  const baseInputStyle = "appearance-none rounded-md relative block w-full px-3 py-2 border placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-primary-green focus:border-primary-green sm:text-sm";
  const errorInputStyle = error ? "border-red-500 ring-1 ring-red-500" : "border-gray-300 dark:border-gray-600";
  const iconPadding = icon ? "pl-10" : "";

  return (
    <div className={wrapperClassName}>
      {label && <label htmlFor={id || name} className={`block ${labelClassName}`}>{label}</label>}
      <div className="relative mt-1 rounded-md shadow-sm">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          id={id || name}
          name={name} // name vẫn cần thiết cho register
          placeholder={placeholder}
          ref={ref} // *** GÁN REF VÀO THẺ INPUT THỰC SỰ ***
          className={`${baseInputStyle} ${errorInputStyle} ${iconPadding} ${className}`}
          {...props} // Truyền tất cả các props còn lại (bao gồm onBlur, onChange từ register)
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
});

// Thêm displayName cho component để dễ debug (tùy chọn nhưng hữu ích)
Input.displayName = 'Input';

export default Input;