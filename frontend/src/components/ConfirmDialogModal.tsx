import React from 'react';
import { AlertTriangle, Trash2, LogOut, X } from 'lucide-react';

interface ConfirmDialogModalProps {
  isOpen: boolean;
  type?: 'DANGER' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialogModal: React.FC<ConfirmDialogModalProps> = ({
  isOpen,
  type = 'DANGER',
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  isConfirming = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const isDanger = type === 'DANGER';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-[420px] bg-slate-900 border rounded-2xl shadow-2xl overflow-hidden flex flex-col p-6 text-center ${
          isDanger
            ? 'border-rose-500/40 shadow-rose-950/40'
            : 'border-amber-500/40 shadow-amber-950/40'
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onCancel}
          disabled={isConfirming}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div
          className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center border shadow-lg ${
            isDanger
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-rose-950/50'
              : 'bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-amber-950/50'
          }`}
        >
          {isDanger ? <Trash2 size={26} /> : <AlertTriangle size={26} />}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-2 leading-snug">
          {title}
        </h3>

        {/* Message */}
        <p className="text-xs text-slate-300 leading-relaxed mb-6 whitespace-pre-line">
          {message}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-lg transition flex items-center justify-center gap-1.5 ${
              isDanger
                ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-950/50'
                : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-950/50'
            }`}
          >
            {isConfirming ? (
              <span>Đang xử lý...</span>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
