import React, { useState } from 'react';
import { TreePine, Crown, Users, Check, X, Sparkles } from 'lucide-react';
import { apiJoinTreeViaLink } from '../services/api';
import { useToast } from './Toast';

export interface InviteLinkInfo {
  treeId: string;
  treeName: string;
  description?: string;
  branchName?: string;
  ownerName: string;
  membersCount: number;
}

interface InviteLinkJoinModalProps {
  isOpen: boolean;
  inviteInfo: InviteLinkInfo | null;
  onClose: () => void;
  onJoined: (treeId: string) => void;
  onOpenSubscriptionModal?: () => void;
}

export const InviteLinkJoinModal: React.FC<InviteLinkJoinModalProps> = ({
  isOpen,
  inviteInfo,
  onClose,
  onJoined,
  onOpenSubscriptionModal,
}) => {
  const [isJoining, setIsJoining] = useState(false);
  const toast = useToast();

  if (!isOpen || !inviteInfo) return null;

  const handleJoin = async () => {
    try {
      setIsJoining(true);
      const res = await apiJoinTreeViaLink(inviteInfo.treeId);
      toast.success(res.message || `Đã tham gia cây gia phả "${inviteInfo.treeName}"!`);
      onJoined(inviteInfo.treeId);
      onClose();
    } catch (err: any) {
      if (err.message && err.message.includes('FREE_LIMIT_REACHED')) {
        toast.error('Bạn đã đạt giới hạn 5 nhánh của gói Miễn Phí. Vui lòng nâng cấp PRO để tham gia thêm nhánh này!');
        if (onOpenSubscriptionModal) {
          onClose();
          onOpenSubscriptionModal();
        }
      } else {
        toast.error(err.message || 'Không thể tham gia cây gia phả');
      }
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-[460px] bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl shadow-emerald-950/50 overflow-hidden flex flex-col p-6 text-center animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isJoining}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X size={18} />
        </button>

        {/* Big Icon */}
        <div className="w-16 h-16 rounded-3xl mx-auto mb-4 bg-gradient-to-tr from-emerald-500/30 to-teal-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/40">
          <TreePine size={32} />
        </div>

        {/* Title */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold mx-auto mb-2">
          <Sparkles size={13} />
          <span>Lời Mời Gia Phả</span>
        </div>

        <h3 className="text-xl font-extrabold text-white mb-2 leading-tight">
          Tham Gia Cây Gia Phả
        </h3>

        <p className="text-xs text-slate-300 leading-relaxed mb-5">
          Bạn nhận được liên kết mời tham gia xem và đóng góp thông tin cho dòng họ:
        </p>

        {/* Tree Card Summary */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left mb-6 space-y-2">
          <div className="font-bold text-sm text-emerald-300">
            {inviteInfo.treeName}
          </div>
          {inviteInfo.branchName && (
            <div className="text-[11px] text-slate-400">
              Chi nhánh: <span className="text-slate-200 font-semibold">{inviteInfo.branchName}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
            <div className="flex items-center gap-1">
              <Crown size={12} className="text-amber-400" />
              <span>Chủ nhánh: <strong className="text-white">{inviteInfo.ownerName}</strong></span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={12} className="text-teal-400" />
              <span>{inviteInfo.membersCount} thành viên</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isJoining}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            Để Sau
          </button>
          <button
            type="button"
            onClick={handleJoin}
            disabled={isJoining}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
          >
            <Check size={15} />
            <span>{isJoining ? 'Đang tham gia...' : 'Chấp Nhận Tham Gia'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
