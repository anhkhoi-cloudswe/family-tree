import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy bỏ',
  isDanger = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="minimal-modal-overlay"
      onClick={onCancel}
      style={{ zIndex: 11000 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="minimal-modal-box"
        style={{ maxWidth: '420px', padding: '1.6rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.9rem', marginBottom: '1.2rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: isDanger ? '#fee2e2' : '#eff6ff',
              color: isDanger ? '#dc2626' : '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <h3
              id="confirm-modal-title"
              style={{ fontSize: '1.08rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.35rem 0' }}
            >
              {title}
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
              {message}
            </p>
          </div>
          <button
            type="button"
            className="btn-ghost-sm"
            onClick={onCancel}
            aria-label="Đóng hộp thoại"
            style={{ margin: '-0.3rem -0.3rem 0 0' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end', marginTop: '1.4rem' }}>
          <button type="button" className="btn-secondary" onClick={onCancel} style={{ minHeight: '40px' }}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={isDanger ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
            style={{
              minHeight: '40px',
              background: isDanger ? '#dc2626' : undefined,
              borderColor: isDanger ? '#dc2626' : undefined,
              color: '#ffffff',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
