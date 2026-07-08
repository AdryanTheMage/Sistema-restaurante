import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirmar', cancelText = 'Cancelar' }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" style={{ zIndex: 1050 }}>
      <div className="modal-content animate-scale-in" style={{ border: '2px solid hsl(var(--destructive))', maxWidth: '400px' }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--destructive))' }}>
            <AlertTriangle size={20} /> {title}
          </h3>
          <button type="button" className="toast-close" onClick={onCancel}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '0.95rem', marginBottom: '1rem', lineHeight: '1.4' }}>
            {message}
          </p>
        </div>
        <div className="card-footer">
          <button type="button" className="btn btn-outline" onClick={onCancel}>{cancelText}</button>
          <button type="button" className="btn btn-destructive" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
