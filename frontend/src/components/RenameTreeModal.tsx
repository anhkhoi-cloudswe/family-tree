import React, { useState, useEffect } from 'react';
import { X, Edit3, Save } from 'lucide-react';
import { FamilyTree } from '../types';
import { apiUpdateTree } from '../services/api';
import { useToast } from './Toast';

interface RenameTreeModalProps {
  isOpen: boolean;
  tree: FamilyTree | null;
  onClose: () => void;
  onSuccess: (updated: FamilyTree) => void;
}

export const RenameTreeModal: React.FC<RenameTreeModalProps> = ({
  isOpen,
  tree,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (tree) {
      setName(tree.name || '');
      setDescription(tree.description || '');
    }
  }, [tree, isOpen]);

  if (!isOpen || !tree) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên nhánh cây gia phả');
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await apiUpdateTree(tree.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });

      toast.success('Đã cập nhật tên nhánh cây gia phả thành công!');
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi cập nhật tên cây gia phả');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-[440px] bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-14 px-5 border-b border-emerald-500/20 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Edit3 size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white leading-tight">
                Đổi Tên Nhánh Cây Gia Phả
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[240px]">
                {tree.name}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Tên cây / nhánh gia phả <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ví dụ: Gia phả Dòng họ Nguyễn (Chi Trưởng)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Mô tả ngắn gọn (Tùy chọn)
            </label>
            <textarea
              rows={3}
              placeholder="Ghi chú về nguồn gốc, chi nhánh của gia đình..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/50 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Save size={14} />
              <span>{isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameTreeModal;
