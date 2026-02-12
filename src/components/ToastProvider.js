'use client';

import { Toaster } from 'react-hot-toast';
import { useTheme } from '@/context/ThemeContext';

export function ToastProvider({ children }) {
  const { theme } = useTheme();

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          // Default options
          duration: 3000,
          style: {
            background: theme === 'dark' ? '#18181b' : '#ffffff',
            color: theme === 'dark' ? '#fafafa' : '#09090b',
            border: `1px solid ${theme === 'dark' ? '#27272a' : '#e4e4e7'}`,
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
              background: theme === 'dark' ? '#18181b' : '#ffffff',
              color: theme === 'dark' ? '#10b981' : '#047857',
              border: `1px solid ${theme === 'dark' ? '#065f46' : '#a7f3d0'}`,
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
              background: theme === 'dark' ? '#18181b' : '#ffffff',
              color: theme === 'dark' ? '#ef4444' : '#b91c1c',
              border: `1px solid ${theme === 'dark' ? '#991b1b' : '#fecaca'}`,
            },
          },
          // Loading
          loading: {
            iconTheme: {
              primary: '#f59e0b',
              secondary: '#ffffff',
            },
            style: {
              background: theme === 'dark' ? '#18181b' : '#ffffff',
              color: theme === 'dark' ? '#fbbf24' : '#d97706',
              border: `1px solid ${theme === 'dark' ? '#92400e' : '#fde68a'}`,
            },
          },
        }}
      />
    </>
  );
}
