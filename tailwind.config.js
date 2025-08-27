// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-green': '#2ecc71',
        'primary-green-dark': '#27ae60',
        'secondary-blue': '#3498db',
        'secondary-blue-dark': '#2980b9',
        'accent-yellow': '#f1c40f',
        'neutral-dark': '#333333', // Hoặc một màu xám đậm hơn như text-gray-800
        'neutral-light': '#f8f9fa', // Hoặc một màu xám nhạt như bg-gray-100
      },
      // ...
    },
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/forms'),       
    require('@tailwindcss/line-clamp'),  
    require('@tailwindcss/typography'),
    
  ],
}