import React from 'react';

interface LoaderProps {
  size?: 'small' | 'large';
  color?: string;
}

export const Loader: React.FC<LoaderProps> = ({ size = 'large', color = '#000000' }) => {
  const loaderSize = size === 'small' ? '24px' : '48px';
  return (
    <div style={{ display: 'inline-block', width: loaderSize, height: loaderSize }}>
      <div style={{
        width: '100%',
        height: '100%',
        border: `4px solid ${color}`,
        borderTop: `4px solid transparent`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export const PageLoader: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '40px 0' }}>
    <Loader size="large" color="#000000" />
  </div>
);

export const ButtonLoader: React.FC<{ color?: string }> = ({ color = '#FFFFFF' }) => (
  <Loader size="small" color={color} />
);
