
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', message }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div
        className={`${sizeClasses[size]} border-t-transparent border-accent-green rounded-full animate-spin`}
        role="status"
        aria-live="polite"
        aria-label={message || "Loading"}
      ></div>
      {message && <p className="mt-2 text-sm text-text-secondary">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;