import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

function ToastItem({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`px-4 py-3 rounded-lg text-sm font-medium shadow-lg animate-slide-in ${
        type === 'success'
          ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-700'
          : 'bg-red-900/80 text-red-200 border border-red-700'
      }`}
    >
      {message}
    </div>
  );
}

let toastId = 0;
const toastListeners: Array<(t: { id: number; message: string; type: 'success' | 'error' }) => void> = [];

export function toast(message: string, type: 'success' | 'error' = 'success') {
  toastListeners.forEach((fn) => fn({ id: ++toastId, message, type }));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'success' | 'error' }>>([]);

  useEffect(() => {
    const handler = (t: { id: number; message: string; type: 'success' | 'error' }) => {
      setToasts((prev) => [...prev, t]);
    };
    toastListeners.push(handler);
    return () => {
      const idx = toastListeners.indexOf(handler);
      if (idx >= 0) toastListeners.splice(idx, 1);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem
          key={t.id}
          message={t.message}
          type={t.type}
          onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
        />
      ))}
    </div>
  );
}
