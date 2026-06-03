import { Toaster } from 'react-hot-toast';

const Toast = () => (
  <Toaster
    position="top-right"
    gutter={8}
    containerStyle={{ top: 72 }}
    toastOptions={{
      duration: 3500,
      style: {
        background: '#ffffff',
        color: '#0f172a',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: 500,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        padding: '12px 16px',
      },
      success: {
        iconTheme: { primary: '#10B981', secondary: '#ffffff' },
      },
      error: {
        iconTheme: { primary: '#EF4444', secondary: '#ffffff' },
      },
    }}
  />
);

export default Toast;
