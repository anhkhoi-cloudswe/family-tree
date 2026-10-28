import React, { useState, useEffect } from 'react';
import {
  Search,
  FileSpreadsheet,
  Download,
  Share2,
} from 'lucide-react';
import { User, FamilyTree, Person, TreeRole } from '../types';
import { downloadTreeExcel } from '../services/api';
import { useToast } from './Toast';

interface NavbarProps {
  user: User | null;
  tree: FamilyTree | null;
  mePerson?: Person | null;
  userRole?: TreeRole;
  isPro?: boolean;
  onOpenSubscription?: () => void;
  pendingInvitationsCount?: number;
  onOpenInvitations?: () => void;
  onOpenShareModal?: () => void;
  onBackToBranches?: () => void;
  mainView: 'TREE' | 'LIST';
  onMainViewChange: (mode: 'TREE' | 'LIST') => void;
  branchFilter: 'ALL' | 'PATERNAL' | 'MATERNAL';
  onBranchFilterChange: (filter: 'ALL' | 'PATERNAL' | 'MATERNAL') => void;
  viewMode?: 'COMPACT' | 'DETAILED';
  onViewModeChange?: (mode: 'COMPACT' | 'DETAILED') => void;
  onOpenPersonPicker: () => void;
  onOpenAddMember?: () => void;
  onOpenLunar?: () => void;
  onOpenReminder?: () => void;
  onOpenFlashcard?: () => void;
  onExportImage: () => void;
  isExportingImage: boolean;
  onLogout?: () => void;
  onFitToScreen?: () => void;
  onPanToMe?: () => void;
  onPanToGen1?: () => void;
  onOpenHelp?: () => void;
  adminActiveTab?: 'USERS' | 'SUBSCRIPTIONS' | 'REPORTS';
  onAdminTabChange?: (tab: 'USERS' | 'SUBSCRIPTIONS' | 'REPORTS') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  tree,
  isPro = false,
  onOpenSubscription,
  onOpenPersonPicker,
  onOpenShareModal,
  onExportImage,
  isExportingImage,
}) => {
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const toast = useToast();

  // Global shortcut: Ctrl + K (or Cmd + K) opens person search
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenPersonPicker();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [onOpenPersonPicker]);

  const handleExportExcel = async () => {
    if (!tree) return;
    if (!isPro) {
      toast.info(
        'Tính năng Xuất báo cáo & file Excel danh bạ gia đình dành riêng cho Gói PRO. Nâng cấp ngay để mở khóa!'
      );
      onOpenSubscription?.();
      return;
    }
    try {
      setIsExportingExcel(true);
      await downloadTreeExcel(tree.id, tree.name);
      toast.success('Đã xuất file Excel danh bạ dòng họ thành công!');
    } catch (err: any) {
      toast.error(err.message || 'Không thể xuất file Excel, vui lòng thử lại');
    } finally {
      setIsExportingExcel(false);
    }
  };

  if (user?.role === 'ADMIN' || !tree) {
    return null;
  }

  return (
    <div className="navbar-tier-2-outer hidden md:flex" role="toolbar" aria-label="Thanh công cụ phả hệ">
      <div className="navbar-tier-2">
        {/* 1. Expanded Search Bar taking up the left and center space */}
        <div className="navbar-search-expanded-group">
          <button
            type="button"
            className="navbar-search-btn-center navbar-search-wide"
            onClick={onOpenPersonPicker}
            aria-label="Tìm kiếm người thân trong dòng họ (Ctrl + K)"
            title="Tìm kiếm người thân trong dòng họ (Ctrl + K)"
          >
            <Search size={15} className="search-icon text-emerald-400" />
            <span className="search-label flex-1 text-left">
              Tìm thành viên trong gia đình (họ tên, vai vế, số điện thoại, quê quán)...
            </span>
            <kbd className="search-kbd">Ctrl K</kbd>
          </button>
        </div>

        {/* 2. Right Group: Mời, Xuất Excel & Tải Ảnh */}
        <div className="navbar-right-group flex items-center gap-2">
          {onOpenShareModal && (
            <button
              type="button"
              className="navbar-action-btn"
              onClick={onOpenShareModal}
              title="Mời người thân vào xem hoặc chỉnh sửa cây gia phả"
            >
              <Share2 size={15} className="text-emerald-400" />
              <span className="action-btn-text">Mời</span>
            </button>
          )}

          <button
            type="button"
            className="navbar-action-btn"
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            title={
              isPro
                ? 'Xuất bảng Excel danh bạ gia đình, ngày sinh, SĐT, quê quán'
                : 'Tính năng Gói PRO: Xuất bảng Excel danh bạ toàn diện'
            }
          >
            <FileSpreadsheet size={15} className="text-emerald-400" />
            <span className="action-btn-text">{isExportingExcel ? 'Đang xuất...' : 'Xuất Excel'}</span>
            {!isPro && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 ml-1 leading-none shadow-sm">
                PRO
              </span>
            )}
          </button>

          <button
            type="button"
            className="navbar-action-btn"
            onClick={onExportImage}
            disabled={isExportingImage}
            title={
              isPro
                ? 'Tải toàn bộ hình ảnh cây gia phả Ultra-HD siêu nét về máy'
                : 'Tải toàn bộ hình ảnh cây gia phả HD tiêu chuẩn về máy'
            }
          >
            <Download size={15} className="text-sky-400" />
            <span className="action-btn-text">{isExportingImage ? 'Đang tạo...' : 'Tải Ảnh'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
