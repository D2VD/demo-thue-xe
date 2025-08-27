// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // Đảm bảo đường dẫn file CSS global đúng
import { AuthProvider } from './contexts/AuthContext.jsx';
import { HelmetProvider } from 'react-helmet-async'; // Đã import
import 'react-quill/dist/quill.snow.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <HelmetProvider> {/* HelmetProvider phải bao bọc ở đây */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </HelmetProvider>
  </React.StrictMode>,
);