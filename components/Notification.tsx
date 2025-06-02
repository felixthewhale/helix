import React, { useEffect } from 'react';
import { AppNotification } from '../types';

interface NotificationProps {
  notification: AppNotification;
  onDismiss: (id: string) => void;
}

const Notification: React.FC<NotificationProps> = ({ notification, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(notification.id);
    }, 5000); 

    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  // Use text-on-accent for text within notifications for consistent contrast
  const textBaseColor = "text-text-on-accent"; 

  const baseClasses = `p-4 mb-4 rounded-md shadow-lg text-sm flex items-start ${textBaseColor}`;
  const typeClasses = {
    success: "bg-accent-green",
    error: "bg-accent-red",
    info: "bg-accent-grey", 
  };

  const Icon = () => {
    // Icons will inherit color from textBaseColor (text-on-accent)
    if (notification.type === 'success') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    }
    if (notification.type === 'error') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
    }
    // Info Icon
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <div 
      className={`${baseClasses} ${typeClasses[notification.type]}`}
      role="alert"
      aria-live={notification.type === 'error' ? "assertive" : "polite"}
    >
      <Icon />
      <span className="flex-grow">{notification.message}</span>
      <button 
        onClick={() => onDismiss(notification.id)} 
        className={`ml-4 -mr-1 p-1 rounded-md hover:bg-black/20 focus:outline-none focus:ring-2 focus:ring-text-on-accent focus:ring-opacity-50`}
        aria-label="Dismiss notification"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export const NotificationContainer: React.FC<{ notifications: AppNotification[], onDismiss: (id: string) => void }> = ({ notifications, onDismiss }) => {
  if (!notifications.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] w-full max-w-sm space-y-3">
      {notifications.map(notif => (
        <Notification key={notif.id} notification={notif} onDismiss={onDismiss} />
      ))}
    </div>
  );
};