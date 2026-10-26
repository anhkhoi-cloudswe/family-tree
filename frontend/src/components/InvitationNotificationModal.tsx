import React, { useState } from 'react';
import {
  X,
  Bell,
  Check,
  Ban,
  TreePine,
  UserCheck,
  Phone,
  MessageSquare,
  Shield,
  Eye,
  Edit3,
  Clock,
  Trash2,
} from 'lucide-react';
import { TreeInvitation, Person } from '../types';
import { apiAcceptInvitation, apiDeclineInvitation } from '../services/api';
import { useToast } from './Toast';

interface InvitationNotificationModalProps {
  isOpen: boolean;
  invitations: TreeInvitation[];
  onClose: () => void;
  onRefresh: () => void;
  onAcceptedTree: (treeId: string) => void;
}

export const InvitationNotificationModal: React.FC<InvitationNotificationModalProps> = ({
  isOpen,
  invitations,
  onClose,
  onRefresh,
  onAcceptedTree,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const toast = useToast();

  if (!isOpen) return null;

  const handleAccept = async (invitation: TreeInvitation) => {
    try {
      setProcessingId(invitation.id);
      const res = await apiAcceptInvitation(invitation.id);
      toast.success(res.message || `Đã tham gia cây gia phả "${invitation.tree.name}"!`);
      onRefresh();
      onAcceptedTree(invitation.treeId);
      if (invitations.length <= 1) {
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || 'Không thể chấp nhận lời mời');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (invitation: TreeInvitation) => {
    if (!window.confirm(`Bạn có chắc chắn muốn từ chối lời mời vào cây gia phả "${invitation.tree.name}"?`)) {
      return;
    }

    try {
      setProcessingId(invitation.id);
      const res = await apiDeclineInvitation(invitation.id);
      toast.info(res.message || 'Đã từ chối lời mời');
      onRefresh();
      if (invitations.length <= 1) {
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi từ chối lời mời');
    } finally {
      setProcessingId(null);
    }
  };

  const handleLater = () => {
    toast.info('Lời mời đã được lưu lại trong mục "Chi Nhánh > Chờ Duyệt (Pending)". Bạn có thể xem lại bất cứ lúc nào.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-emerald-500/20 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Bell size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                Lời Mời Tham Gia Cây Gia Phả
              </h3>
              <p className="text-xs text-slate-400">
                Bạn có {invitations.length} lời mời đang chờ phản hồi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {invitations.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <TreePine size={40} className="mx-auto mb-2 text-slate-600" />
              Bạn hiện không có lời mời nào đang chờ.
            </div>
          ) : (
            invitations.map((inv) => (
              <div
                key={inv.id}
                className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 shadow-md space-y-3"
              >
                {/* Inviter Info & Tree Name */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-300 flex-shrink-0 mt-0.5">
                      {inv.inviter?.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-100">
                        {inv.inviter?.fullName || 'Người thân'}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Phone size={12} className="text-emerald-400" />
                        <span>{inv.inviter?.phone || inv.inviter?.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1 ${
                      inv.role === 'EDITOR'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-500/20 text-slate-300 border-slate-500/40'
                    }`}
                  >
                    {inv.role === 'EDITOR' ? (
                      <>
                        <Edit3 size={12} />
                        Biên tập viên
                      </>
                    ) : (
                      <>
                        <Eye size={12} />
                        Người xem
                      </>
                    )}
                  </span>
                </div>

                {/* Tree details box */}
                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs space-y-1">
                  <div className="text-slate-400">Được mời tham gia cây gia phả:</div>
                  <div className="font-bold text-emerald-300 text-sm">
                    {inv.tree?.name}
                  </div>
                  {inv.tree?.branchName && (
                    <div className="text-slate-400">
                      Chi họ: {inv.tree.branchName}
                    </div>
                  )}
                  {inv.message && (
                    <div className="mt-2 pt-2 border-t border-slate-800 text-slate-300 italic flex items-start gap-1.5">
                      <MessageSquare size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>"{inv.message}"</span>
                    </div>
                  )}
                </div>

                {/* Perspective Notice */}
                <div className="text-[11px] text-slate-400 bg-emerald-950/20 border border-emerald-500/20 rounded-lg p-2 flex items-center gap-2">
                  <UserCheck size={14} className="text-emerald-400 flex-shrink-0" />
                  <span>
                    Hệ thống sẽ giữ góc nhìn xưng hô ("Tôi") độc lập của riêng bạn mà không ảnh hưởng đến người tạo cây.
                  </span>
                </div>

                {/* Actions: Accept Now, Later, or Delete */}
                <div className="flex items-center gap-2 pt-1 flex-wrap sm:flex-nowrap">
                  <button
                    type="button"
                    disabled={processingId === inv.id}
                    onClick={() => handleAccept(inv)}
                    className="flex-1 min-w-[125px] py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/40 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Check size={14} />
                    <span>{processingId === inv.id ? 'Đang xử lý...' : 'Chấp Nhận Ngay'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={processingId === inv.id}
                    onClick={handleLater}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition"
                    title="Lưu lại trong mục Chờ Duyệt (Pending) để quyết định sau"
                  >
                    <Clock size={14} />
                    <span>Để Sau</span>
                  </button>

                  <button
                    type="button"
                    disabled={processingId === inv.id}
                    onClick={() => handleDecline(inv)}
                    className="py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 font-semibold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                    title="Xóa lời mời này"
                  >
                    <Trash2 size={14} />
                    <span>Xóa Lời Mời</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default InvitationNotificationModal;
