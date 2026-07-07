import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';

export default function Toast({ toasts = [], removeToast }) {
  if (toasts.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="toast-icon" size={20} />;
      case 'warning':
        return <AlertTriangle className="toast-icon" size={20} />;
      case 'destructive':
        return <AlertCircle className="toast-icon" size={20} />;
      default:
        return null;
    }
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div 
          key={toast.id} 
          className={`toast toast-${toast.type || 'info'} animate-slide-in`}
          role="alert"
        >
          <div className="toast-icon-wrapper">
            {getIcon(toast.type)}
          </div>
          <div className="toast-content">
            {toast.title && <h4 className="toast-title">{toast.title}</h4>}
            {toast.message && <p className="toast-message">{toast.message}</p>}
          </div>
          <button 
            onClick={() => removeToast(toast.id)} 
            className="toast-close"
            aria-label="Fechar notificação"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
