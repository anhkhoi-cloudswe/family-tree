import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Phone,
  Shield,
  Eye,
  Edit3,
  Crown,
  Trash2,
  Send,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { FamilyTree, TreeRole, TreeCollaborator, TreeInvitation } from '../types';
import {
  apiSendInvitation,
  apiGetTreeCollaborators,
  apiRemoveCollaborator,
} from '../services/api';
import { useToast } from './Toast';

interface ShareTreeModalProps {
  isOpen: boolean;
  tree: FamilyTree;
  currentUserRole?: TreeRole;
  onClose: () => void;
  onNeedUpdatePhone?: () => void;
}

export const ShareTreeModal: React.FC<ShareTreeModalProps> = ({
  isOpen,
  tree,
  currentUserRole = 'OWNER',
  onClose,
  onNeedUpdatePhone,
}) => {
  const [activeTab, setActiveTab] = useState<'INVITE' | 'COLLABORATORS'>('INVITE');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'VIEWER' | 'EDITOR'>('VIEWER');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [collaborators, setCollaborators] = useState<TreeCollaborator[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<TreeInvitation[]>([]);

  const toast = useToast();

  const loadCollaborators = async () => {
    try {
      setIsLoadingList(true);
      const res = await apiGetTreeCollaborators(tree.id);
      setCollaborators(res.collaborators || []);
      setPendingInvitations(res.pendingInvitations || []);
    } catch (err: any) {
      console.error('Lỗi tải danh sách người cộng tác:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCollaborators();
    }
  }, [isOpen, tree.id]);

  if (!isOpen) return null;

  const isOwner = currentUserRole === 'OWNER';

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone) {
      toast.error('Vui lòng nhập số điện thoại người nhận');
      return;
    }

    // Phone format check
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(cleanPhone)) {
      toast.error('Số điện thoại không hợp lệ (cần 10 chữ số theo chuẩn Việt Nam)');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await apiSendInvitation({
        treeId: tree.id,
        phone: cleanPhone,
        role,
        message: message.trim() || undefined,
      });

      toast.success(res.message || 'Đã gửi lời mời tham gia cây gia phả!');
      setPhone('');
      setMessage('');
      // Reload collaborators & pending
      await loadCollaborators();
      setActiveTab('COLLABORATORS');
    } catch (err: any) {
      toast.error(err.message || 'Không thể gửi lời mời. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorUserId: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn thu hồi quyền truy cập của "${name}"?`)) {
      return;
    }

    try {
      await apiRemoveCollaborator(tree.id, collaboratorUserId);
      toast.success('Đã thu hồi quyền thành công');
      setCollaborators((prev) => prev.filter((c) => c.userId !== collaboratorUserId));
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi thu hồi quyền');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-emerald-500/20 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Share2 size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                Chia Sẻ Cây Gia Phả
              </h3>
              <p className="text-xs text-slate-400">
                {tree.name} {tree.branchName ? `(${tree.branchName})` : ''}
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

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-4">
          <button
            type="button"
            onClick={() => setActiveTab('INVITE')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'INVITE'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send size={15} />
            Mời Người Thân Mới
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('COLLABORATORS')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'COLLABORATORS'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users size={15} />
            Thành Viên Đã Chia Sẻ ({collaborators.length + pendingInvitations.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'INVITE' ? (
            <form onSubmit={handleSendInvite} className="space-y-4">
              {!isOwner && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>
                    Chỉ Chủ cây (Owner) mới có quyền mời thành viên mới hoặc điều chỉnh quyền truy cập.
                  </span>
                </div>
              )}

              {/* Phone Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Số điện thoại người thân <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone size={17} />
                  </div>
                  <input
                    type="tel"
                    required
                    disabled={!isOwner}
                    placeholder="Ví dụ: 0987654321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition disabled:opacity-50"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Người nhận cần có tài khoản đã cập nhật số điện thoại này trong hệ thống Gia Phả Số.
                </p>
              </div>

              {/* Role Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Phân quyền truy cập <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option: VIEWER */}
                  <div
                    onClick={() => isOwner && setRole('VIEWER')}
                    className={`cursor-pointer p-3 rounded-xl border transition flex flex-col gap-1 ${
                      role === 'VIEWER'
                        ? 'bg-emerald-500/15 border-emerald-400 shadow-md ring-1 ring-emerald-500/30'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    } ${!isOwner ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-semibold text-sm text-slate-100">
                        <Eye size={16} className="text-teal-400" />
                        Chỉ Xem (Viewer)
                      </div>
                      {role === 'VIEWER' && <CheckCircle size={16} className="text-emerald-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Xem toàn bộ cây phả hệ, tra cứu quan hệ họ hàng & ngày giỗ. Không được sửa đổi dữ liệu.
                    </p>
                  </div>

                  {/* Option: EDITOR */}
                  <div
                    onClick={() => isOwner && setRole('EDITOR')}
                    className={`cursor-pointer p-3 rounded-xl border transition flex flex-col gap-1 ${
                      role === 'EDITOR'
                        ? 'bg-emerald-500/15 border-emerald-400 shadow-md ring-1 ring-emerald-500/30'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    } ${!isOwner ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-semibold text-sm text-slate-100">
                        <Edit3 size={16} className="text-emerald-400" />
                        Chỉnh Sửa (Editor)
                      </div>
                      {role === 'EDITOR' && <CheckCircle size={16} className="text-emerald-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Được phép thêm thành viên nhánh, cập nhật thông tin ngày sinh/mất, chỉnh sửa tiểu sử.
                    </p>
                  </div>
                </div>
              </div>

              {/* Invitation Message */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tin nhắn đính kèm (Tùy chọn)
                </label>
                <div className="relative">
                  <textarea
                    rows={2}
                    disabled={!isOwner}
                    placeholder="Ví dụ: Cháu mời bác vào cùng xem và bổ sung chi nhánh của gia đình mình ạ..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Submit button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!isOwner || isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                  <span>{isSubmitting ? 'Đang gửi lời mời...' : 'Gửi Lời Mời Ngay'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {isLoadingList ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  Đang tải danh sách cộng tác viên...
                </div>
              ) : (
                <>
                  {/* Current Active Collaborators */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <Users size={14} className="text-emerald-400" />
                      Đang Cộng Tác ({collaborators.length})
                    </h4>

                    {collaborators.length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-3 bg-slate-950/40 rounded-xl border border-slate-800">
                        Chưa có người thân nào tham gia cộng tác trong cây gia phả này.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {collaborators.map((c) => (
                          <div
                            key={c.id}
                            className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center font-bold text-xs text-emerald-300 flex-shrink-0">
                                {c.user.fullName?.charAt(0) || 'U'}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-sm text-slate-200 truncate">
                                  {c.user.fullName}
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-2 truncate">
                                  <span>{c.user.phone || c.user.email}</span>
                                  {c.person && (
                                    <span className="text-emerald-400">
                                      • Liên kết: {c.person.fullName}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  c.role === 'EDITOR'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-slate-500/20 text-slate-300 border-slate-500/40'
                                }`}
                              >
                                {c.role === 'EDITOR' ? 'Chỉnh sửa' : 'Chỉ xem'}
                              </span>

                              {isOwner && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCollaborator(c.userId, c.user.fullName)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                                  title="Thu hồi quyền"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pending Invitations */}
                  {pendingInvitations.length > 0 && (
                    <div className="pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400/90 mb-2 flex items-center gap-1.5">
                        <Clock size={14} className="text-amber-400" />
                        Lời Mời Đang Chờ Phản Hồi ({pendingInvitations.length})
                      </h4>

                      <div className="space-y-2">
                        {pendingInvitations.map((inv) => (
                          <div
                            key={inv.id}
                            className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-200 truncate">
                                Người nhận: {inv.inviter?.fullName || 'Người dùng'}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                Quyền: {inv.role === 'EDITOR' ? 'Chỉnh sửa' : 'Chỉ xem'} • Đang chờ chấp nhận
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              Chờ duyệt
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareTreeModal;
