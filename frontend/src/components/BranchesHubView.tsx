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
  Shield,
  Clock,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { FamilyTree, TreeRole, User, SubscriptionStatus } from '../types';
import { formatDateVN } from '../utils/dateHelper';

interface BranchesHubViewProps {
  trees: FamilyTree[];
  currentTreeId: string | null;
  currentUser: User | null;
  subscriptionStatus: SubscriptionStatus | null;
  onSelectTree: (treeId: string) => void;
  onOpenCreateTree: () => void;
  onOpenRenameTree: (tree: FamilyTree) => void;
  onOpenShareTree: (tree: FamilyTree) => void;
  onDeleteTree: (treeId: string, treeName: string) => void;
  onOpenSubscriptionModal: () => void;
}

export const BranchesHubView: React.FC<BranchesHubViewProps> = ({
  trees,
  currentTreeId,
  currentUser,
  subscriptionStatus,
  onSelectTree,
  onOpenCreateTree,
  onOpenRenameTree,
  onOpenShareTree,
  onDeleteTree,
  onOpenSubscriptionModal,
}) => {
  const [filterTab, setFilterTab] = useState<'ALL' | 'OWNED' | 'JOINED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <div className="flex-1 h-full overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-8 flex flex-col">
      <div className="max-w-6xl w-full mx-auto space-y-6">
        {/* Top Banner / Header (Phong cách danh bạ / chat room của Zalo/Messenger) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-emerald-500/20 shadow-xl backdrop-blur-md">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Layers size={22} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Cây Gia Phả & Chi Nhánh Của Bạn
                </h1>
                <p className="text-xs text-slate-400">
                  Chọn nhánh để xem sơ đồ gia phả chi tiết, hoặc tạo thêm chi nhánh dòng họ
                </p>
              </div>
            </div>
          </div>

          {/* Subscription Progress & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Subscription Mini Pill */}
            <div
              onClick={onOpenSubscriptionModal}
              className="cursor-pointer p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition flex items-center gap-3"
              title="Xem thông tin và nâng cấp gói hội viên"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                <Crown size={15} />
              </div>
              <div className="text-left pr-1">
                <div className="text-[10px] text-slate-400">
                  {isPro ? 'Gói PRO VIP' : `Gói Miễn Phí (${totalBranches}/${maxFree} nhánh)`}
                </div>
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1">
                  <span>{isPro ? 'Không giới hạn nhánh' : 'Nâng cấp PRO'}</span>
                  <Sparkles size={11} />
                </div>
              </div>
            </div>

            {/* Create Branch Button */}
            <button
              type="button"
              onClick={onOpenCreateTree}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition"
            >
              <Plus size={16} />
              <span>Tạo Nhánh Mới</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 border border-slate-800 rounded-2xl max-w-fit text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilterTab('ALL')}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                filterTab === 'ALL'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tất Cả ({trees.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('OWNED')}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                filterTab === 'OWNED'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cây Của Tôi ({ownedTrees.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('JOINED')}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                filterTab === 'JOINED'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Được Mời Tham Gia ({joinedTrees.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Tìm kiếm nhánh gia phả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Branch Cards Grid */}
        {displayedTrees.length === 0 ? (
          <div className="py-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 text-slate-500 flex items-center justify-center mx-auto">
              <Layers size={24} />
            </div>
            <div className="text-sm font-semibold text-slate-300">
              Không tìm thấy cây gia phả nào
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? 'Không có kết quả khớp với từ khóa tìm kiếm.'
                : 'Bạn chưa có nhánh cây gia phả nào trong mục này.'}
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
                  className={`group relative rounded-3xl transition-all duration-200 flex flex-col justify-between overflow-hidden border ${
                    isLocked
                      ? 'bg-slate-950/40 border-slate-800/80 opacity-75'
                      : isCurrentActive
                      ? 'bg-gradient-to-b from-slate-900/90 to-slate-950 border-emerald-500/60 ring-1 ring-emerald-500/30 shadow-xl shadow-emerald-950/40'
                      : 'bg-slate-900/70 hover:bg-slate-900/90 border-slate-800 hover:border-emerald-500/30 shadow-lg'
                  }`}
                >
                  {/* Lock Overlay if branch locked due to free tier limit */}
                  {isLocked && (
                    <div
                      onClick={onOpenSubscriptionModal}
                      className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center cursor-pointer space-y-2 hover:bg-slate-950/70 transition"
                    >
                      <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center">
                        <Lock size={18} />
                      </div>
                      <div className="font-bold text-xs text-white">
                        Tạm khóa do vượt quá 5 nhánh miễn phí
                      </div>
                      <p className="text-[11px] text-slate-400 max-w-[220px]">
                        Nâng cấp gói PRO để mở khóa toàn bộ cây gia phả
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSubscriptionModal();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-1.5"
                      >
                        <Crown size={13} />
                        <span>Mở Khóa Ngay</span>
                      </button>
                    </div>
                  )}

                  {/* Top Card Info */}
                  <div
                    onClick={() => !isLocked && onSelectTree(tree.id)}
                    className={`p-5 space-y-3 cursor-pointer ${isLocked ? 'pointer-events-none' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-black text-sm flex-shrink-0">
                          {tree.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm sm:text-base text-white truncate group-hover:text-emerald-300 transition">
                            {tree.name}
                          </h3>
                          <div className="text-[11px] text-slate-400 truncate">
                            {tree.owner ? `Chủ nhánh: ${tree.owner.fullName}` : 'Chủ nhánh'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {renderRoleBadge(tree.userRole || 'OWNER')}
                      </div>
                    </div>

                    {tree.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {tree.description}
                      </p>
                    )}

                    {/* Stats pills */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                        <Users size={12} className="text-emerald-400" />
                        <span>{tree.membersCount || 0} thành viên</span>
                      </span>
                      {tree.createdAt && (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400">
                          <Calendar size={12} className="text-teal-400" />
                          <span>Tạo: {formatDateVN(tree.createdAt)}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between gap-2">
                    {/* View details button */}
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => !isLocked && onSelectTree(tree.id)}
                      className={`text-xs font-semibold flex items-center gap-1.5 transition ${
                        isCurrentActive
                          ? 'text-emerald-400'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <span>{isCurrentActive ? 'Đang mở' : 'Xem sơ đồ cây'}</span>
                      <ArrowRight size={13} />
                    </button>

                    {/* Action buttons (Rename, Share, Delete) */}
                    <div className="flex items-center gap-1">
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => onOpenRenameTree(tree)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Đổi tên nhánh cây"
                        >
                          <Edit3 size={14} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onOpenShareTree(tree)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition"
                        title="Chia sẻ / Mời người thân"
                      >
                        <Share2 size={14} />
                      </button>

                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => onDeleteTree(tree.id, tree.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Xóa nhánh cây"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchesHubView;
