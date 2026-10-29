import React, { useState } from 'react';
import {
  Layers,
  Crown,
  Plus,
  Share2,
  Edit3,
  Trash2,
  Users,
  Eye,
  Lock,
  Sparkles,
  ArrowRight,
  LogOut,
  Search,
  CheckCircle,
  Clock,
  Bell,
  Phone,
  Check,
  Ban,
  MessageSquare,
  UserCheck,
} from 'lucide-react';
import { FamilyTree, TreeRole, User, SubscriptionStatus, TreeInvitation } from '../types';
import { ConfirmDialogModal } from './ConfirmDialogModal';

interface BranchesHubViewProps {
  trees: FamilyTree[];
  pendingInvitations?: TreeInvitation[];
  currentTreeId: string | null;
  currentUser: User | null;
  subscriptionStatus: SubscriptionStatus | null;
  onSelectTree: (treeId: string) => void;
  onOpenCreateTree: () => void;
  onOpenRenameTree: (tree: FamilyTree) => void;
  onOpenShareTree: (tree: FamilyTree) => void;
  onDeleteTree: (treeId: string, treeName: string) => void;
  onLeaveTree?: (treeId: string, treeName: string) => void;
  onAcceptInvitation?: (invitation: TreeInvitation) => void;
  onDeclineInvitation?: (invitation: TreeInvitation) => void;
  onOpenSubscriptionModal: () => void;
}

export const BranchesHubView: React.FC<BranchesHubViewProps> = ({
  trees,
  pendingInvitations = [],
  currentTreeId,
  currentUser,
  subscriptionStatus,
  onSelectTree,
  onOpenCreateTree,
  onOpenRenameTree,
  onOpenShareTree,
  onDeleteTree,
  onLeaveTree,
  onAcceptInvitation,
  onDeclineInvitation,
  onOpenSubscriptionModal,
}) => {
  const [filterTab, setFilterTab] = useState<'ALL' | 'OWNED' | 'JOINED' | 'PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'DELETE' | 'LEAVE';
    treeId: string;
    treeName: string;
  } | null>(null);

  const isPro = subscriptionStatus?.tier === 'PRO';
  const totalBranches = trees.length;
  const maxFree = subscriptionStatus?.maxFreeBranches || 5;

  // Phân loại cây
  const ownedTrees = trees.filter(
    (t) => t.ownerId === currentUser?.id || t.userRole === 'OWNER'
  );
  const joinedTrees = trees.filter(
    (t) => t.ownerId !== currentUser?.id && t.userRole !== 'OWNER'
  );

  const displayedTrees = (
    filterTab === 'OWNED' ? ownedTrees : filterTab === 'JOINED' ? joinedTrees : trees
  ).filter((t) =>
    searchQuery.trim() === ''
      ? true
      : t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.branchName && t.branchName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const displayedInvitations = pendingInvitations.filter((inv) =>
    searchQuery.trim() === ''
      ? true
      : (inv.tree?.name && inv.tree.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (inv.inviter?.fullName && inv.inviter.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderRoleBadge = (role: TreeRole) => {
    switch (role) {
      case 'OWNER':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <Crown size={10} />
            <span>Chủ nhánh</span>
          </span>
        );
      case 'EDITOR':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
            <Edit3 size={10} />
            <span>Chỉnh sửa</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center gap-1">
            <Eye size={10} />
            <span>Chỉ xem</span>
          </span>
        );
    }
  };

  const handleConfirmAction = () => {
    if (!confirmDialog) return;
    if (confirmDialog.type === 'DELETE') {
      onDeleteTree(confirmDialog.treeId, confirmDialog.treeName);
    } else if (confirmDialog.type === 'LEAVE' && onLeaveTree) {
      onLeaveTree(confirmDialog.treeId, confirmDialog.treeName);
    }
    setConfirmDialog(null);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-950/40 backdrop-blur-xs p-4 sm:p-6 lg:p-8 flex flex-col">
      <div className="max-w-6xl w-full mx-auto space-y-5">
        {/* Top Header - Tinh gọn, nhất quán, không lan man */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/20 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Layers size={22} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Chi Nhánh Gia Phả
              </h1>
              <p className="text-xs text-slate-400">
                Chọn nhánh để vào xem sơ đồ, hoặc tạo thêm chi nhánh độc lập
              </p>
            </div>
          </div>

          {/* Right Actions: Subscription Pill & Create Branch */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div
              onClick={onOpenSubscriptionModal}
              className="cursor-pointer px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 transition flex items-center gap-2"
              title="Nhấn để xem thông tin gói hội viên"
            >
              <Crown size={14} className={isPro ? 'text-amber-400' : 'text-slate-400'} />
              <div className="text-xs font-semibold text-slate-200">
                {isPro ? (
                  <span className="text-amber-300 font-bold">Gói PRO</span>
                ) : (
                  <span>
                    Gói Miễn Phí{' '}
                    <strong className="text-emerald-400">
                      ({totalBranches}/{maxFree})
                    </strong>
                  </span>
                )}
              </div>
              {!isPro && (
                <span className="text-[10px] text-amber-400 font-bold bg-amber-500/15 px-1.5 py-0.5 rounded">
                  Nâng cấp
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onOpenCreateTree}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus size={15} />
              <span>Tạo Nhánh Mới</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-medium overflow-x-auto flex-nowrap scrollbar-none max-w-full">
            <button
              type="button"
              onClick={() => setFilterTab('ALL')}
              className={`whitespace-nowrap flex-shrink-0 px-3 py-1.5 rounded-lg transition ${
                filterTab === 'ALL'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất Cả ({trees.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('OWNED')}
              className={`whitespace-nowrap flex-shrink-0 px-3 py-1.5 rounded-lg transition ${
                filterTab === 'OWNED'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Của Tôi ({ownedTrees.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('JOINED')}
              className={`whitespace-nowrap flex-shrink-0 px-3 py-1.5 rounded-lg transition ${
                filterTab === 'JOINED'
                  ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Được Mời ({joinedTrees.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('PENDING')}
              className={`whitespace-nowrap flex-shrink-0 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                filterTab === 'PENDING'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Chờ Duyệt ({pendingInvitations.length})</span>
              {pendingInvitations.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder={filterTab === 'PENDING' ? 'Tìm lời mời...' : 'Tìm nhánh theo tên...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition"
            />
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
          </div>
        </div>

        {/* Branch Cards Grid or Pending Invitations Grid */}
        {filterTab === 'PENDING' ? (
          displayedInvitations.length === 0 ? (
            <div className="py-14 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-slate-800/60 text-slate-500 flex items-center justify-center mx-auto">
                <Bell size={20} />
              </div>
              <div className="text-sm font-semibold text-slate-300">
                Không có lời mời nào đang chờ duyệt
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? 'Không tìm thấy lời mời khớp với từ khóa tìm kiếm.'
                  : 'Nhận lời mời tham gia cây gia phả tại đây.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="rounded-2xl bg-slate-900/90 border border-amber-500/30 hover:border-amber-500/50 shadow-xl p-4 flex flex-col justify-between space-y-3.5 transition group"
                >
                  <div className="space-y-3">
                    {/* Header: Inviter info & Role badge */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-300 flex-shrink-0">
                          {inv.inviter?.fullName?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-white truncate">
                            {inv.inviter?.fullName || 'Người thân'}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Phone size={10} className="text-emerald-400 flex-shrink-0" />
                            <span className="truncate">{inv.inviter?.phone || inv.inviter?.email}</span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 flex-shrink-0 ${
                          inv.role === 'EDITOR'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                        }`}
                      >
                        {inv.role === 'EDITOR' ? (
                          <>
                            <Edit3 size={10} />
                            <span>Chỉnh sửa</span>
                          </>
                        ) : (
                          <>
                            <Eye size={10} />
                            <span>Chỉ xem</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Tree info */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="text-[11px] text-slate-400">Lời mời tham gia nhánh:</div>
                      <h4 className="font-bold text-sm text-emerald-300 group-hover:text-emerald-200 transition">
                        {inv.tree?.name}
                      </h4>
                      {inv.tree?.branchName && (
                        <div className="text-[11px] text-slate-400">
                          Chi họ: {inv.tree.branchName}
                        </div>
                      )}
                      {inv.message && (
                        <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-300 italic flex items-start gap-1.5">
                          <MessageSquare size={12} className="text-amber-400 mt-0.5 flex-shrink-0" />
                          <span>"{inv.message}"</span>
                        </div>
                      )}
                    </div>

                    {/* Independent perspective notice */}
                    <div className="text-[10px] text-slate-400 bg-emerald-950/20 border border-emerald-500/20 rounded-lg p-2 flex items-center gap-1.5">
                      <UserCheck size={12} className="text-emerald-400 flex-shrink-0" />
                      <span>Góc nhìn "Tôi" độc lập của riêng bạn khi tham gia.</span>
                    </div>
                  </div>

                  {/* Actions: Accept or Delete */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onAcceptInvitation?.(inv)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <Check size={13} />
                      <span>Chấp Nhận</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeclineInvitation?.(inv)}
                      className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 font-semibold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                      title="Xóa lời mời này"
                    >
                      <Trash2 size={13} />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : displayedTrees.length === 0 ? (
          <div className="py-14 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-800/60 text-slate-500 flex items-center justify-center mx-auto">
              <Layers size={20} />
            </div>
            <div className="text-sm font-semibold text-slate-300">
              Không tìm thấy nhánh gia phả nào
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? 'Không có kết quả khớp với từ khóa tìm kiếm.'
                : 'Chưa có nhánh nào trong mục này.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedTrees.map((tree) => {
              const isOwner = tree.ownerId === currentUser?.id || tree.userRole === 'OWNER';
              const isCurrentActive = tree.id === currentTreeId;
              const isLocked = Boolean(tree.isLocked);

              return (
                <div
                  key={tree.id}
                  className={`group relative rounded-2xl transition-all duration-200 flex flex-col justify-between overflow-hidden border ${
                    isLocked
                      ? 'bg-slate-950/40 border-slate-800/80 opacity-70'
                      : isCurrentActive
                      ? 'bg-gradient-to-b from-slate-900/90 to-slate-950 border-emerald-500/60 ring-1 ring-emerald-500/30 shadow-xl shadow-emerald-950/40'
                      : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-emerald-500/40 shadow-lg'
                  }`}
                >
                  {/* Lock Overlay for 6th+ branch on Free tier */}
                  {isLocked && (
                    <div
                      onClick={onOpenSubscriptionModal}
                      className="absolute inset-0 z-20 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center cursor-pointer space-y-2 hover:bg-slate-950/75 transition"
                    >
                      <div className="w-9 h-9 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center">
                        <Lock size={16} />
                      </div>
                      <div className="font-bold text-xs text-white">
                        Khóa do vượt 5 nhánh miễn phí
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSubscriptionModal();
                        }}
                        className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-1"
                      >
                        <Crown size={12} />
                        <span>Mở Khóa PRO</span>
                      </button>
                    </div>
                  )}

                  {/* Card Main Info */}
                  <div
                    onClick={() => !isLocked && onSelectTree(tree.id)}
                    className={`p-4 space-y-2.5 cursor-pointer ${
                      isLocked ? 'pointer-events-none' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold text-xs flex-shrink-0">
                          {tree.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3
                            className="font-bold text-sm text-white truncate group-hover:text-emerald-300 transition"
                            title={tree.name}
                          >
                            {tree.name}
                          </h3>
                          <div className="text-[11px] text-slate-400 truncate">
                            {isOwner
                              ? 'Nhánh của bạn'
                              : tree.owner
                              ? `Chủ nhánh: ${tree.owner.fullName}`
                              : 'Được mời tham gia'}
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {renderRoleBadge(tree.userRole || 'OWNER')}
                      </div>
                    </div>

                    {/* Member Count Pill */}
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300">
                        <Users size={12} className="text-emerald-400" />
                        <span>{tree.membersCount || 0} thành viên</span>
                      </span>
                      {tree.branchName && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-400 truncate max-w-[140px]">
                          {tree.branchName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="px-4 py-2.5 border-t border-slate-800/80 bg-slate-950/50 flex items-center justify-between gap-2">
                    {/* View Button */}
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => !isLocked && onSelectTree(tree.id)}
                      className={`text-xs font-semibold flex items-center gap-1 transition ${
                        isCurrentActive
                          ? 'text-emerald-400 font-bold'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <span>{isCurrentActive ? 'Đang mở' : 'Xem sơ đồ cây'}</span>
                      <ArrowRight size={13} />
                    </button>

                    {/* Action Tool Buttons */}
                    <div className="flex items-center gap-1">
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => onOpenRenameTree(tree)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Đổi tên nhánh"
                        >
                          <Edit3 size={13} />
                        </button>
                      )}

                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => onOpenShareTree(tree)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition"
                          title="Mời người thân"
                        >
                          <Share2 size={13} />
                        </button>
                      )}

                      {isOwner ? (
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmDialog({
                              type: 'DELETE',
                              treeId: tree.id,
                              treeName: tree.name,
                            })
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Xóa nhánh cây"
                        >
                          <Trash2 size={13} />
                        </button>
                      ) : (
                        onLeaveTree && (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmDialog({
                                type: 'LEAVE',
                                treeId: tree.id,
                                treeName: tree.name,
                              })
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition flex items-center gap-1 text-[11px]"
                            title="Rời khỏi nhánh gia phả này"
                          >
                            <LogOut size={13} />
                            <span className="hidden sm:inline">Rời</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Branded Custom Confirmation Dialog (Replaces native window.confirm) */}
      <ConfirmDialogModal
        isOpen={Boolean(confirmDialog)}
        type="DANGER"
        title={
          confirmDialog?.type === 'DELETE'
            ? 'Xác Nhận Xóa Nhánh Gia Phả'
            : 'Xác Nhận Rời Khỏi Nhánh'
        }
        message={
          confirmDialog?.type === 'DELETE'
            ? `Bạn có chắc chắn muốn xóa nhánh "${confirmDialog?.treeName}"?\nToàn bộ dữ liệu thành viên và sơ đồ của nhánh này sẽ bị xóa vĩnh viễn.`
            : `Bạn có chắc chắn muốn rời khỏi nhánh "${confirmDialog?.treeName}"?\nBạn sẽ không còn quyền truy cập vào nhánh này trừ khi được mời lại.`
        }
        confirmText={confirmDialog?.type === 'DELETE' ? 'Xóa Vĩnh Viễn' : 'Rời Khỏi Nhánh'}
        cancelText="Hủy bỏ"
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmDialog(null)}
      />
    </div>
  );
};

export default BranchesHubView;
