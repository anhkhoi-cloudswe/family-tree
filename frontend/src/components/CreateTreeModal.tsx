import React, { useState } from 'react';
import { X, Plus, Crown, Sparkles, Layers } from 'lucide-react';
import { FamilyTree } from '../types';
import { apiCreateTree } from '../services/api';
import { useToast } from './Toast';

interface CreateTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTree: FamilyTree) => void;
  onOpenSubscriptionModal?: () => void;
  canCreateMore: boolean;
  currentCount: number;
  maxFree: number;
  isPro: boolean;
}

export const CreateTreeModal: React.FC<CreateTreeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenSubscriptionModal,
  canCreateMore,
  currentCount,
  maxFree,
  isPro,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [branchName, setBranchName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên nhánh cây gia phả');
      return;
    }

    if (!canCreateMore && !isPro) {
      toast.error(`Bạn đã đạt giới hạn ${maxFree} nhánh của gói Miễn Phí. Vui lòng nâng cấp PRO để tạo thêm.`);
      if (onOpenSubscriptionModal) {
        onClose();
        onOpenSubscriptionModal();
      }
      return;
    }

    try {
      setIsSubmitting(true);
      const newTree = await apiCreateTree({
        name: name.trim(),
        description: description.trim() || undefined,
        branchName: branchName.trim() || undefined,
      });

      toast.success('Đã tạo thành công chi nhánh cây gia phả mới!');
      setName('');
      setDescription('');
      setBranchName('');
      onSuccess(newTree);
      onClose();
    } catch (err: any) {
      if (err.message && err.message.includes('FREE_LIMIT_REACHED')) {
        toast.error(`Bạn đã đạt giới hạn ${maxFree} nhánh của gói Miễn Phí. Vui lòng nâng cấp PRO!`);
        if (onOpenSubscriptionModal) {
          onClose();
          onOpenSubscriptionModal();
        }
      } else {
        toast.error(err.message || 'Lỗi khi tạo cây gia phả mới');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-[460px] bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-14 px-5 border-b border-emerald-500/20 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Plus size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white leading-tight">
                Tạo Nhánh Cây Gia Phả Mới
              </h3>
              <p className="text-[11px] text-slate-400">
                Thêm một chi nhánh dòng họ độc lập
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Free limit warning banner if approaching or reached */}
        {!isPro && (
          <div className={`px-5 py-2.5 border-b text-[11px] flex items-center justify-between ${
            !canCreateMore
              ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              : 'bg-amber-950/30 border-amber-500/20 text-amber-300'
          }`}>
            <div className="flex items-center gap-1.5">
              <Crown size={13} />
              <span>
                Gói Miễn Phí: <strong>{currentCount}/{maxFree}</strong> nhánh
              </span>
            </div>
            {onOpenSubscriptionModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSubscriptionModal();
                }}
                className="underline hover:text-white font-semibold flex items-center gap-1"
              >
                <span>Nâng cấp PRO</span>
                <Sparkles size={11} />
              </button>
            )}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Tên cây gia phả / Dòng họ <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ví dụ: Gia phả Dòng họ Nguyễn Đình"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Tên Chi / Nhánh (Tùy chọn)
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Chi Trưởng, Nhánh Miền Nam..."
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Mô tả ngắn (Tùy chọn)
            </label>
            <textarea
              rows={2}
              placeholder="Ghi chú thêm về nguồn gốc, quê quán dòng họ..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!canCreateMore && !isPro)}
              className="px-5 py-2 rounded-xl text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-950/40 flex items-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={14} />
              <span>{isSubmitting ? 'Đang tạo...' : 'Tạo Nhánh Mới'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
