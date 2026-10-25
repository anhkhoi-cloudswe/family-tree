import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Phone,
  Eye,
  Edit3,
  Crown,
  Trash2,
  Send,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  Copy,
  Check,
  Link,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';
import { FamilyTree, TreeRole, TreeCollaborator, TreeInvitation, User } from '../types';
import {
  apiSendInvitation,
  apiGetTreeCollaborators,
  apiRemoveCollaborator,
  apiUpdateCollaboratorRole,
  apiCancelInvitation,
} from '../services/api';
import { validateVietnamesePhone } from '../services/firebase';
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
}) => {
  const [activeTab, setActiveTab] = useState<'INVITE' | 'COLLABORATORS'>('INVITE');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'VIEWER' | 'EDITOR' | 'OWNER'>('VIEWER');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [treeOwner, setTreeOwner] = useState<User | null>(null);
  const [collaborators, setCollaborators] = useState<TreeCollaborator[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<TreeInvitation[]>([]);
  const [totalOwnersCount, setTotalOwnersCount] = useState<number>(1);
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const toast = useToast();

  const isOwner = currentUserRole === 'OWNER';
  const inviteLink = `${window.location.origin}/?inviteTree=${tree.id}`;

  const loadCollaborators = async () => {
    try {
      setIsLoadingList(true);
      const res = await apiGetTreeCollaborators(tree.id);
      setCollaborators(res.collaborators || []);
      setPendingInvitations(res.pendingInvitations || []);
      if (res.treeOwner) setTreeOwner(res.treeOwner);
      if (res.totalOwnersCount !== undefined) setTotalOwnersCount(res.totalOwnersCount);
    } catch (err: any) {
      console.error('Lỗi tải danh sách người cộng tác:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCollaborators();
      setPhone('');
      setMessage('');
      setRole('VIEWER');
      setIsCopied(false);
      // Nếu là người xem bên ngoài, vẫn có thể để tab INVITE để copy link
    }
  }, [isOpen, tree.id]);

  if (!isOpen) return null;

  const phoneValidation = phone ? validateVietnamesePhone(phone) : null;
  const isMaxOwnersReached = totalOwnersCount >= 2;

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(inviteLink);
      setIsCopied(true);
      toast.success('Đã sao chép liên kết mời tham gia cây gia phả!');
      setTimeout(() => setIsCopied(false), 3000);
    } catch {
      toast.error('Không thể tự động sao chép. Vui lòng chọn và copy thủ công.');
    }
  };

  const handleCopyMessage = () => {
    try {
      const text = `Kính mời bạn tham gia xem và đóng góp thông tin cho Cây Gia Phả "${tree.name}": ${inviteLink}`;
      navigator.clipboard.writeText(text);
      toast.success('Đã sao chép tin nhắn mời kèm liên kết!');
    } catch {
      toast.error('Không thể tự động sao chép tin nhắn.');
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/[\s\-\.]/g, '');
    if (!cleanPhone) {
      toast.error('Vui lòng nhập số điện thoại người nhận');
      return;
    }

    const check = validateVietnamesePhone(cleanPhone);
    if (!check.isValid) {
      toast.error(check.error || 'Số điện thoại không hợp lệ chuẩn Việt Nam');
      return;
    }

    if (role === 'OWNER' && isMaxOwnersReached) {
      toast.error('Cây gia phả này đã có tối đa 2 Chủ nhánh. Vui lòng chọn vai trò khác hoặc hạ quyền trước.');
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
      await loadCollaborators();
      setActiveTab('COLLABORATORS');
    } catch (err: any) {
      toast.error(err.message || 'Không thể gửi lời mời. Vui lòng kiểm tra lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (collaboratorUserId: string, newRole: TreeRole) => {
    try {
      setIsUpdatingRole(collaboratorUserId);
      const res = await apiUpdateCollaboratorRole(tree.id, collaboratorUserId, newRole);
      toast.success(res.message || 'Đã cập nhật vai trò thành công!');
      await loadCollaborators();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi cập nhật vai trò');
    } finally {
      setIsUpdatingRole(null);
    }
  };

  const handleRemoveCollaborator = async (collaboratorUserId: string, name: string) => {
    if (!window.confirm(`Xác nhận xóa thành viên "${name}" khỏi cây gia phả này?`)) {
      return;
    }

    try {
      setIsDeleting(collaboratorUserId);
      await apiRemoveCollaborator(tree.id, collaboratorUserId);
      toast.success(`Đã xóa "${name}" khỏi cây`);
      await loadCollaborators();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xóa thành viên');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await apiCancelInvitation(invitationId);
      toast.success('Đã hủy lời mời!');
      setPendingInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi hủy lời mời');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Cố định chiều cao đồng nhất h-[520px] giúp 2 tab không bị co giãn chênh lệch làm giật layout */}
      <div className="relative w-full max-w-[500px] h-[520px] max-h-[92vh] bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="h-14 px-4 sm:px-5 border-b border-emerald-500/20 bg-slate-950/70 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Share2 size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white leading-tight">
                Chia Sẻ Cây Gia Phả
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[280px]">
                {tree.name} {tree.branchName ? `(${tree.branchName})` : ''}
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

        {/* Modal Navigation Tabs */}
        <div className="h-11 flex border-b border-slate-800 bg-slate-950/40 px-3 text-xs font-semibold flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('INVITE')}
            className={`flex-1 border-b-2 transition flex items-center justify-center gap-1.5 ${
              activeTab === 'INVITE'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send size={13} />
            <span>Mời Người Thân</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('COLLABORATORS')}
            className={`flex-1 border-b-2 transition flex items-center justify-center gap-1.5 ${
              activeTab === 'COLLABORATORS'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users size={13} />
            <span>Thành Viên Đã Chia Sẻ ({collaborators.length + pendingInvitations.length})</span>
          </button>
        </div>

        {/* Modal Tab Content - Chiều cao co dãn flex-1 đồng bộ và thanh cuộn mượt */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 text-xs">
          {activeTab === 'INVITE' ? (
            isOwner ? (
              /* TAB 1: DÀNH CHO CHỦ NHÁNH (OWNER) */
              <div className="space-y-3.5">
                {/* 1. Hộp Sao Chép Liên Kết Nhanh */}
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mb-0.5">
                      <Link size={11} className="text-emerald-400" />
                      <span>Liên kết mời nhanh (Zalo, Messenger, SMS):</span>
                    </div>
                    <div className="text-[11px] text-emerald-300 font-mono truncate select-all">
                      {inviteLink}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold flex items-center gap-1 transition"
                      title="Sao chép link"
                    >
                      {isCopied ? <Check size={12} /> : <Copy size={12} />}
                      <span>{isCopied ? 'Đã chép' : 'Sao chép'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                      title="Chép tin nhắn mời kèm link"
                    >
                      <MessageSquare size={13} />
                    </button>
                  </div>
                </div>

                {/* Phân cách */}
                <div className="relative flex items-center justify-center">
                  <div className="w-full border-t border-slate-800" />
                  <span className="absolute px-2.5 bg-slate-900 text-[10px] text-slate-500 uppercase tracking-wider">
                    Hoặc mời trực tiếp qua Số Điện Thoại
                  </span>
                </div>

                {/* Form mời đích danh qua SĐT */}
                <form onSubmit={handleSendInvite} className="space-y-3">
                  {/* Phone Input with validation badge */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-300">
                        Số điện thoại người thân <span className="text-rose-400">*</span>
                      </label>
                      {phone && phoneValidation?.isValid && (
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <CheckCircle size={10} /> Chuẩn số VN
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                        <Phone size={14} />
                      </div>
                      <input
                        type="tel"
                        required
                        placeholder="Ví dụ: 0912345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                      />
                    </div>
                    {phone && !phoneValidation?.isValid && phone.length >= 10 && (
                      <p className="text-[10px] text-rose-400 mt-1">
                        * Cần 10 số đúng chuẩn đầu mạng VN (03, 05, 07, 08, 09)
                      </p>
                    )}
                  </div>

                  {/* Phân quyền truy cập: Các thẻ ghi chú ngắn gọn đúng 1 dòng không xuống hàng */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-semibold text-slate-300">
                        Phân quyền truy cập <span className="text-rose-400">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400">
                        Chủ nhánh: {totalOwnersCount}/2
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* VIEWER */}
                      <div
                        onClick={() => setRole('VIEWER')}
                        className={`cursor-pointer p-2.5 rounded-xl border transition flex flex-col gap-1 overflow-hidden ${
                          role === 'VIEWER'
                            ? 'bg-emerald-500/15 border-emerald-400 ring-1 ring-emerald-500/40 text-emerald-300'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-xs truncate">
                            <Eye size={13} className="text-teal-400 flex-shrink-0" />
                            <span>Chỉ Xem (Viewer)</span>
                          </div>
                          {role === 'VIEWER' && <CheckCircle size={13} className="text-emerald-400 flex-shrink-0" />}
                        </div>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis block">
                          Xem phả hệ & tra cứu họ hàng
                        </span>
                      </div>

                      {/* EDITOR */}
                      <div
                        onClick={() => setRole('EDITOR')}
                        className={`cursor-pointer p-2.5 rounded-xl border transition flex flex-col gap-1 overflow-hidden ${
                          role === 'EDITOR'
                            ? 'bg-emerald-500/15 border-emerald-400 ring-1 ring-emerald-500/40 text-emerald-300'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-xs truncate">
                            <Edit3 size={13} className="text-emerald-400 flex-shrink-0" />
                            <span>Chỉnh Sửa (Editor)</span>
                          </div>
                          {role === 'EDITOR' && <CheckCircle size={13} className="text-emerald-400 flex-shrink-0" />}
                        </div>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis block">
                          Thêm & sửa thông tin thành viên
                        </span>
                      </div>

                      {/* OWNER */}
                      <div
                        onClick={() => {
                          if (isMaxOwnersReached) {
                            toast.info('Cây đã có tối đa 2 Chủ nhánh.');
                            return;
                          }
                          setRole('OWNER');
                        }}
                        className={`cursor-pointer p-2.5 rounded-xl border transition flex flex-col gap-1 overflow-hidden ${
                          role === 'OWNER'
                            ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-500/40 text-amber-300'
                            : isMaxOwnersReached
                            ? 'bg-slate-950/30 border-slate-800/60 text-slate-500 opacity-60 cursor-not-allowed'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                        title={isMaxOwnersReached ? 'Đã đủ 2 Chủ nhánh' : 'Đồng chủ nhánh cây gia phả'}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-xs truncate">
                            <Crown size={13} className="text-amber-400 flex-shrink-0" />
                            <span>Chủ Nhánh (Owner)</span>
                          </div>
                          {role === 'OWNER' && <CheckCircle size={13} className="text-amber-400 flex-shrink-0" />}
                        </div>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis block">
                          Toàn quyền & phân vai trò
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Note (Optional) */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Tin nhắn đính kèm (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Cháu mời bác vào xem và cùng bổ sung thông tin gia phả ạ..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                    />
                  </div>

                  {/* Submit button */}
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/50 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={14} />
                      <span>{isSubmitting ? 'Đang gửi lời mời...' : 'Gửi Lời Mời Ngay'}</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* TAB 1: DÀNH CHO THÀNH VIÊN ĐƯỢC MỜI (VIEWER / EDITOR) - Không hiện thông báo lỗi từ chối, hiển thị rõ vai trò & liên kết chia sẻ */
              <div className="space-y-4 py-2">
                {/* 1. Hiển thị vai trò của người đang xem */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300 flex-shrink-0">
                      {currentUserRole === 'EDITOR' ? <Edit3 size={18} /> : <Eye size={18} />}
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Vai trò của bạn trong cây gia phả:</div>
                      <div className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
                        <span>{currentUserRole === 'EDITOR' ? 'Chỉnh Sửa (Editor)' : 'Chỉ Xem (Viewer)'}</span>
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {currentUserRole === 'EDITOR' ? 'Được phép cập nhật' : 'Quyền xem phả hệ'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ShieldCheck size={18} className="text-teal-400 flex-shrink-0 mr-1" />
                </div>

                {/* 2. Lời giải thích nhẹ nhàng, thân thiện (không báo lỗi hay cấm đoán) */}
                <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                  Bạn đang tham gia xem cây gia phả này. Bạn có thể sao chép liên kết chia sẻ bên dưới để gửi tin nhắn cho người thân trong dòng họ, hoặc xem danh sách tất cả các thành viên đã tham gia.
                </p>

                {/* 3. Khung Sao chép liên kết chia sẻ */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                      <Link size={13} className="text-emerald-400" />
                      <span>Liên kết chia sẻ cây gia phả</span>
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-emerald-300 font-mono truncate select-all">
                    {inviteLink}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      {isCopied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{isCopied ? 'Đã sao chép' : 'Sao chép link'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition"
                    >
                      <MessageSquare size={14} />
                      <span>Chép tin nhắn mời</span>
                    </button>
                  </div>
                </div>

                {/* 4. Nút chuyển sang xem danh sách thành viên */}
                <button
                  type="button"
                  onClick={() => setActiveTab('COLLABORATORS')}
                  className="w-full py-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Users size={14} className="text-emerald-400" />
                  <span>Xem Danh Sách Thành Viên Đã Chia Sẻ ({collaborators.length})</span>
                </button>
              </div>
            )
          ) : (
            /* TAB 2: DANH SÁCH THÀNH VIÊN ĐÃ CHIA SẺ */
            <div className="space-y-3.5">
              {isLoadingList ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Đang tải danh sách thành viên...
                </div>
              ) : (
                <>
                  {/* Status Bar */}
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">
                      Chủ nhánh phụ trách: <strong className="text-amber-300">{totalOwnersCount}/2</strong> người
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Chủ nhánh có quyền điều chỉnh vai trò
                    </span>
                  </div>

                  {/* Original Creator */}
                  {treeOwner && (
                    <div className="p-2.5 bg-slate-950/80 border border-amber-500/30 rounded-xl flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-xs text-amber-300 flex-shrink-0">
                          {treeOwner.fullName?.charAt(0) || 'O'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-white truncate flex items-center gap-1.5">
                            <span>{treeOwner.fullName}</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              Chủ Sáng Lập
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {treeOwner.phone || treeOwner.email}
                          </div>
                        </div>
                      </div>
                      <Crown size={15} className="text-amber-400 flex-shrink-0 mr-1" />
                    </div>
                  )}

                  {/* Active Collaborators */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users size={12} className="text-emerald-400" />
                      <span>Thành Viên Đang Cộng Tác ({collaborators.length})</span>
                    </div>

                    {collaborators.length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-4 bg-slate-950/30 rounded-xl border border-slate-800 text-center">
                        Chưa có người thân nào tham gia cộng tác trong cây này.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {collaborators.map((c) => (
                          <div
                            key={c.id}
                            className="p-2.5 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between gap-2 transition"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center font-bold text-xs text-emerald-300 flex-shrink-0">
                                {c.user.fullName?.charAt(0) || 'U'}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-xs text-slate-200 truncate">
                                  {c.user.fullName}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {c.user.phone || c.user.email}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {/* Role Selector Dropdown (CRUD) */}
                              {isOwner ? (
                                <select
                                  disabled={isUpdatingRole === c.userId}
                                  value={c.role}
                                  onChange={(e) => handleRoleChange(c.userId, e.target.value as TreeRole)}
                                  className="py-1 px-2 bg-slate-900 border border-slate-700 rounded-lg text-[10px] font-semibold text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                                >
                                  <option value="VIEWER">Chỉ Xem</option>
                                  <option value="EDITOR">Chỉnh Sửa</option>
                                  <option
                                    value="OWNER"
                                    disabled={isMaxOwnersReached && c.role !== 'OWNER'}
                                  >
                                    Chủ Nhánh {isMaxOwnersReached && c.role !== 'OWNER' ? '(Đủ 2)' : ''}
                                  </option>
                                </select>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                  {c.role === 'OWNER' ? 'Chủ nhánh' : c.role === 'EDITOR' ? 'Chỉnh sửa' : 'Chỉ xem'}
                                </span>
                              )}

                              {/* Kick out button */}
                              {isOwner && (
                                <button
                                  type="button"
                                  disabled={isDeleting === c.userId}
                                  onClick={() => handleRemoveCollaborator(c.userId, c.user.fullName)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                                  title="Đuổi khỏi cây"
                                >
                                  <Trash2 size={13} />
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
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <div className="text-[11px] font-semibold text-amber-400/90 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock size={12} className="text-amber-400" />
                        <span>Lời Mời Đang Chờ ({pendingInvitations.length})</span>
                      </div>

                      <div className="space-y-1.5">
                        {pendingInvitations.map((inv) => (
                          <div
                            key={inv.id}
                            className="p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-xs text-slate-200 truncate">
                                {inv.receiver?.fullName || 'Người nhận'} ({inv.receiver?.phone || 'Chờ xác nhận'})
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                Vai trò: {inv.role === 'OWNER' ? 'Chủ nhánh' : inv.role === 'EDITOR' ? 'Chỉnh sửa' : 'Chỉ xem'}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Chờ duyệt
                              </span>
                              {isOwner && (
                                <button
                                  type="button"
                                  onClick={() => handleCancelInvitation(inv.id)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-400 transition"
                                  title="Hủy lời mời"
                                >
                                  <X size={13} />
                                </button>
                              )}
                            </div>
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
