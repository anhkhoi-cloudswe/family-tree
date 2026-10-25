import React, { useState, useEffect } from 'react';
import {
  TreePine,
  Users,
  ChevronDown,
  Check,
  Search,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { User, FamilyTree, Person, TreeRole } from '../types';
import { downloadTreeExcel } from '../services/api';
import { useToast } from './Toast';

interface NavbarProps {
  user: User | null;
  tree: FamilyTree | null;
  mePerson: Person | null;
  userRole?: TreeRole;
  pendingInvitationsCount?: number;
  onOpenInvitations?: () => void;
  onOpenShareModal?: () => void;
  mainView: 'TREE' | 'LIST';
  onMainViewChange: (mode: 'TREE' | 'LIST') => void;
  branchFilter: 'ALL' | 'PATERNAL' | 'MATERNAL';
  onBranchFilterChange: (filter: 'ALL' | 'PATERNAL' | 'MATERNAL') => void;
  viewMode: 'COMPACT' | 'DETAILED';
  onViewModeChange: (mode: 'COMPACT' | 'DETAILED') => void;
  onOpenPersonPicker: () => void;
  onOpenAddMember: () => void;
  onOpenLunar: () => void;
  onOpenReminder?: () => void;
  onOpenFlashcard?: () => void;
  onExportImage: () => void;
  isExportingImage: boolean;
  onLogout: () => void;
  onFitToScreen?: () => void;
  onPanToMe?: () => void;
  onPanToGen1?: () => void;
  onOpenHelp?: () => void;
  adminActiveTab?: 'USERS' | 'REPORTS' | 'AUDIT' | 'SETTINGS';
  onAdminTabChange?: (tab: 'USERS' | 'REPORTS' | 'AUDIT' | 'SETTINGS') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  tree,
  mainView,
  onMainViewChange,
  branchFilter,
  onBranchFilterChange,
  viewMode,
  onViewModeChange,
  onOpenPersonPicker,
  onExportImage,
  isExportingImage,
}) => {
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
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

  // If user is ADMIN or no tree is loaded yet, toolbar does not need to show
  if (user?.role === 'ADMIN' || !tree) {
    return null;
  }

  return (
    <div className="navbar-tier-2-outer" role="toolbar" aria-label="Thanh công cụ phả hệ">
      <div className="navbar-tier-2 framer-subbar">
        {/* 1. Main View Switcher: [Sơ đồ Cây] / [Danh Sách] */}
        <div className="tier2-mainview-tabs" role="tablist" aria-label="Chế độ sơ đồ hoặc danh sách">
          <button
            type="button"
            role="tab"
            aria-selected={mainView === 'TREE'}
            className={`mainview-tab-btn ${mainView === 'TREE' ? 'active' : ''}`}
            onClick={() => onMainViewChange('TREE')}
            title="Xem Sơ đồ Cây Gia Phả"
          >
            <TreePine size={14} />
            <span>Sơ đồ Cây</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mainView === 'LIST'}
            className={`mainview-tab-btn ${mainView === 'LIST' ? 'active' : ''}`}
            onClick={() => onMainViewChange('LIST')}
            title="Xem Danh Sách Thành Viên (dễ đọc trên di động)"
          >
            <Users size={14} />
            <span>Danh Sách</span>
          </button>
        </div>

        {/* 2. Branch Filter: Segmented Control (Desktop) & Modern Right-Aligned Dropdown (Mobile) */}
        <div className="tier2-branch-filter-container">
          {/* Desktop Segmented Pill Switcher */}
          <div className="desktop-branch-segmented" role="tablist" aria-label="Lọc theo nhánh phả hệ">
            <button
              type="button"
              role="tab"
              aria-selected={branchFilter === 'ALL'}
              className={`branch-segment-pill ${branchFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => onBranchFilterChange('ALL')}
              title="Hiển thị tổng thể cả hai bên nội và ngoại"
            >
              <span>Cả Hai Bên</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={branchFilter === 'PATERNAL'}
              className={`branch-segment-pill ${branchFilter === 'PATERNAL' ? 'active' : ''}`}
              onClick={() => onBranchFilterChange('PATERNAL')}
              title="Tập trung vào dòng họ bên nội (Ông/Bà Nội, Bố, các Bác/Chú/Cô và con cháu)"
            >
              <span>Bên Nội</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={branchFilter === 'MATERNAL'}
              className={`branch-segment-pill ${branchFilter === 'MATERNAL' ? 'active' : ''}`}
              onClick={() => onBranchFilterChange('MATERNAL')}
              title="Tập trung vào dòng họ bên ngoại (Ông/Bà Ngoại, Mẹ, các Cậu/Dì và con cháu)"
            >
              <span>Bên Ngoại</span>
            </button>
          </div>

          {/* Mobile Modern Dropdown (Aligned right) */}
          <div className="mobile-branch-dropdown-wrapper">
            <button
              type="button"
              className={`mobile-branch-trigger-btn ${isBranchDropdownOpen ? 'open' : ''}`}
              onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
              aria-haspopup="listbox"
              aria-expanded={isBranchDropdownOpen}
              aria-label="Lọc nhánh phả hệ"
            >
              <span className="mobile-branch-current-text">
                {branchFilter === 'ALL' ? 'Cả Hai Bên' : branchFilter === 'PATERNAL' ? 'Bên Nội' : 'Bên Ngoại'}
              </span>
              <ChevronDown size={14} className={`mobile-branch-chevron ${isBranchDropdownOpen ? 'rotate' : ''}`} />
            </button>

            {isBranchDropdownOpen && (
              <>
                <div
                  className="mobile-branch-backdrop"
                  onClick={() => setIsBranchDropdownOpen(false)}
                />
                <div className="mobile-branch-menu-popover" role="listbox">
                  <button
                    type="button"
                    role="option"
                    aria-selected={branchFilter === 'ALL'}
                    className={`mobile-branch-item ${branchFilter === 'ALL' ? 'selected' : ''}`}
                    onClick={() => {
                      onBranchFilterChange('ALL');
                      setIsBranchDropdownOpen(false);
                    }}
                  >
                    <span>Cả Hai Bên</span>
                    {branchFilter === 'ALL' && <Check size={14} color="#34d399" />}
                  </button>
                  <button
                    type="button"
                    role="option"
                    aria-selected={branchFilter === 'PATERNAL'}
                    className={`mobile-branch-item ${branchFilter === 'PATERNAL' ? 'selected' : ''}`}
                    onClick={() => {
                      onBranchFilterChange('PATERNAL');
                      setIsBranchDropdownOpen(false);
                    }}
                  >
                    <span>Bên Nội</span>
                    {branchFilter === 'PATERNAL' && <Check size={14} color="#34d399" />}
                  </button>
                  <button
                    type="button"
                    role="option"
                    aria-selected={branchFilter === 'MATERNAL'}
                    className={`mobile-branch-item ${branchFilter === 'MATERNAL' ? 'selected' : ''}`}
                    onClick={() => {
                      onBranchFilterChange('MATERNAL');
                      setIsBranchDropdownOpen(false);
                    }}
                  >
                    <span>Bên Ngoại</span>
                    {branchFilter === 'MATERNAL' && <Check size={14} color="#34d399" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 3. Action Group: Search, Quick Exports, View Mode */}
        <div className="tier2-action-group">
          {/* Quick Member Search (Desktop) */}
          <button
            type="button"
            className="navbar-search-btn-desktop"
            onClick={onOpenPersonPicker}
            aria-label="Tìm kiếm người thân trong dòng họ (Ctrl + K)"
            title="Tìm kiếm người thân trong dòng họ (Ctrl + K)"
          >
            <Search size={14} className="search-icon" />
            <span className="search-label">Tìm thành viên...</span>
            <kbd className="search-kbd">Ctrl K</kbd>
          </button>

          {/* Quick Export Excel */}
          <button
            type="button"
            className="tier2-quick-btn hidden sm:inline-flex"
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            title="Tải bảng Excel danh bạ gia đình, ngày sinh, SĐT, quê quán"
          >
            <FileSpreadsheet size={14} color="#34d399" />
            <span>{isExportingExcel ? 'Đang xuất...' : 'Xuất Excel'}</span>
          </button>

          {/* Quick Export Image */}
          <button
            type="button"
            className="tier2-quick-btn hidden sm:inline-flex"
            onClick={onExportImage}
            disabled={isExportingImage}
            title="Tải toàn bộ hình ảnh cây gia phả HD về máy để in ấn hoặc chia sẻ"
          >
            <Download size={14} color="#38bdf8" />
            <span>{isExportingImage ? 'Đang tạo...' : 'Tải Ảnh'}</span>
          </button>

          {/* View Mode Toggle: Gọn vs Chi tiết */}
          <div className="tier2-viewmode-toggle desktop-viewmode-only" role="group" aria-label="Chế độ hiển thị thẻ">
            <button
              type="button"
              className={`viewmode-btn ${viewMode === 'COMPACT' ? 'active' : ''}`}
              onClick={() => onViewModeChange('COMPACT')}
              title="Chế độ gọn: chỉ hiển thị họ tên và vai vế"
            >
              Gọn
            </button>
            <button
              type="button"
              className={`viewmode-btn ${viewMode === 'DETAILED' ? 'active' : ''}`}
              onClick={() => onViewModeChange('DETAILED')}
              title="Chế độ chi tiết: hiển thị thêm ngày sinh, ngày giỗ, biệt danh"
            >
              Chi tiết
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
