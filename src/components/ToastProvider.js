'use client';

import { Toaster } from 'react-hot-toast';
// import { useTheme } from '@/context/ThemeContext';

export function ToastProvider({ children }) {
  // const { theme } = useTheme();

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          // Default options
          duration: 3000,
          style: {
            background: '#ffffff', // Forced light theme
            color: '#09090b', // Forced light theme
            border: '1px solid #e4e4e7', // Forced light theme
            borderRadius: '0.75rem',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          // Success
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
            style: {
              background: '#ffffff',
              color: '#047857',
              border: '1px solid #a7f3d0',
            },
          },
          // Error
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
            style: {
              background: '#ffffff',
              color: '#b91c1c',
              border: '1px solid #fecaca',
            },
          },
          // Loading
          loading: {
            iconTheme: {
              primary: '#f59e0b',
              secondary: '#ffffff',
            },
            style: {
              background: '#ffffff',
              color: '#d97706',
              border: '1px solid #fde68a',
            },
          },
        }}
      />
    </>
  );
}
