import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface ToastContextType {
  addToast: (type: ToastMessage['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastMessage['type'], title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-md w-full">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon =
              toast.type === 'success'
                ? CheckCircle2
                : toast.type === 'error'
                ? AlertCircle
                : toast.type === 'warning'
                ? AlertTriangle
                : Info;

            const colorClasses =
              toast.type === 'success'
                ? 'border-emerald-600/50 bg-emerald-950/90 text-emerald-100'
                : toast.type === 'error'
                ? 'border-rose-600/50 bg-rose-950/90 text-rose-100'
                : toast.type === 'warning'
                ? 'border-amber-600/50 bg-amber-950/90 text-amber-100'
                : 'border-sky-600/50 bg-sky-950/90 text-sky-100';

            const iconColors =
              toast.type === 'success'
                ? 'text-emerald-400'
                : toast.type === 'error'
                ? 'text-rose-400'
                : toast.type === 'warning'
                ? 'text-amber-400'
                : 'text-sky-400';

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className={`pointer-events-auto p-4 rounded-xl border shadow-xl backdrop-blur-md flex items-start gap-3 ${colorClasses}`}
              >
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColors}`} />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold">{toast.title}</h4>
                  <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{toast.message}</p>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="opacity-70 hover:opacity-100 transition-opacity p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
