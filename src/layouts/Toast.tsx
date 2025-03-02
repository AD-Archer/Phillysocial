'use client';
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { FaCheck, FaInfo, FaExclamationTriangle, FaTimes } from 'react-icons/fa';

type ToastType = 'success' | 'info' | 'warning' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType; duration: number }>>([]);

  const showToast = (message: string, type: ToastType = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const Toast: React.FC<ToastProps> = ({ message, type, duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-[#046A38] text-white border-[#A5ACAF]';
      case 'info':
        return 'bg-[#004C54] text-white border-[#A5ACAF]';
      case 'warning':
        return 'bg-[#FFD700] text-[#003940] border-[#003940]';
      case 'error':
        return 'bg-[#C41E3A] text-white border-[#A5ACAF]';
      default:
        return 'bg-[#004C54] text-white border-[#A5ACAF]';
    }
  };

  const getToastIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheck className="text-white" />;
      case 'info':
        return <FaInfo className="text-white" />;
      case 'warning':
        return <FaExclamationTriangle className="text-[#003940]" />;
      case 'error':
        return <FaTimes className="text-white" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`max-w-sm w-full shadow-lg rounded-lg pointer-events-auto border ${getToastStyles()} transition-all duration-300 transform hover:scale-105`}
      role="alert"
    >
      <div className="p-3 flex items-start">
        <div className="flex-shrink-0 pt-0.5">
          {getToastIcon()}
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">
            {message}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            className="inline-flex text-white/70 hover:text-white focus:outline-none"
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
            <FaTimes size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast; 