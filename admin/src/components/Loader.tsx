import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Loader: React.FC<LoaderProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  };

  return (
    <div
      className={`inline-block ${sizeClasses[size]} border-black border-t-transparent rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};

export const PageLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader size="lg" />
    </div>
  );
};

export const ButtonLoader: React.FC = () => {
  return <Loader size="sm" className="border-white border-t-transparent" />;
};
