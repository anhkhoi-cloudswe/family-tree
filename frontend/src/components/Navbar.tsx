import React, { useState, useEffect, useRef } from 'react';
import {
  TreePine,
  Users,
  ChevronDown,
  Check,
  Search,
  FileSpreadsheet,
  Download,
  Layers,
} from 'lucide-react';
import { User, FamilyTree, Person, TreeRole } from '../types';
import { downloadTreeExcel } from '../services/api';
import { useToast } from './Toast';

interface NavbarProps {
  user: User | null;
  tree: FamilyTree | null;
  mePerson?: Person | null;
  userRole?: TreeRole;
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
  adminActiveTab?: 'USERS' | 'SUBSCRIPTIONS' | 'REPORTS' | 'AUDIT' | 'SETTINGS';
  onAdminTabChange?: (tab: 'USERS' | 'SUBSCRIPTIONS' | 'REPORTS' | 'AUDIT' | 'SETTINGS') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  tree,
  mainView,
  onMainViewChange,
  branchFilter,
  onBranchFilterChange,
  onOpenPersonPicker,
  onExportImage,
  isExportingImage,
  onBackToBranches,
}) => {
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsBranchDropdownOpen(false);
      }
    };
    if (isBranchDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isBranchDropdownOpen]);

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

  if (user?.role === 'ADMIN' || !tree) {
    return null;
  }

  const getBranchLabel = () => {
    switch (branchFilter) {
      case 'PATERNAL':
        return 'Bên Nội';
      case 'MATERNAL':
        return 'Bên Ngoại';
      default:
        return 'Cả Hai Bên';
    }
  };

  return (
    <div className="navbar-tier-2-outer hidden md:flex" role="toolbar" aria-label="Thanh công cụ phả hệ">
      <div className="navbar-tier-2">
        {/* 1. LEFT GROUP: Dropdown Lọc Nhánh Phả Hệ (Bên Nội / Bên Ngoại) */}
        <div className="navbar-left-group">

          {/* Branch Filter Dropdown (Đồng bộ gọn gàng cho cả Desktop & Mobile) */}
          <div className="branch-dropdown-wrapper" ref={dropdownRef}>
            <button
              type="button"
              className={`branch-trigger-btn ${isBranchDropdownOpen ? 'open' : ''}`}
              onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
              aria-haspopup="listbox"
              aria-expanded={isBranchDropdownOpen}
              aria-label="Lọc theo nhánh phả hệ"
              title="Lọc hiển thị theo nhánh dòng họ"
            >
              <span className="branch-trigger-text">{getBranchLabel()}</span>
              <ChevronDown size={14} className={`branch-chevron ${isBranchDropdownOpen ? 'rotate' : ''}`} />
            </button>

            {isBranchDropdownOpen && (
              <div className="branch-menu-popover" role="listbox">
                <button
                  type="button"
                  role="option"
                  aria-selected={branchFilter === 'ALL'}
                  className={`branch-menu-item ${branchFilter === 'ALL' ? 'selected' : ''}`}
                  onClick={() => {
                    onBranchFilterChange('ALL');
                    setIsBranchDropdownOpen(false);
                  }}
                >
                  <span>Cả Hai Bên</span>
                  {branchFilter === 'ALL' && <Check size={14} className="text-emerald-400" />}
                </button>
                <button
                  type="button"
                  role="option"
                  aria-selected={branchFilter === 'PATERNAL'}
                  className={`branch-menu-item ${branchFilter === 'PATERNAL' ? 'selected' : ''}`}
                  onClick={() => {
                    onBranchFilterChange('PATERNAL');
                    setIsBranchDropdownOpen(false);
                  }}
                >
                  <span>Bên Nội</span>
                  {branchFilter === 'PATERNAL' && <Check size={14} className="text-emerald-400" />}
                </button>
                <button
                  type="button"
                  role="option"
                  aria-selected={branchFilter === 'MATERNAL'}
                  className={`branch-menu-item ${branchFilter === 'MATERNAL' ? 'selected' : ''}`}
                  onClick={() => {
                    onBranchFilterChange('MATERNAL');
                    setIsBranchDropdownOpen(false);
                  }}
                >
                  <span>Bên Ngoại</span>
                  {branchFilter === 'MATERNAL' && <Check size={14} className="text-emerald-400" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2. CENTER GROUP: Thanh Tìm Kiếm ở chính giữa */}
        <div className="navbar-center-group">
          <button
            type="button"
            className="navbar-search-btn-center"
            onClick={onOpenPersonPicker}
            aria-label="Tìm kiếm người thân trong dòng họ (Ctrl + K)"
            title="Tìm kiếm người thân trong dòng họ (Ctrl + K)"
          >
            <Search size={14} className="search-icon" />
            <span className="search-label hidden sm:inline">Tìm thành viên trong gia đình...</span>
            <span className="search-label sm:hidden">Tìm kiếm...</span>
            <kbd className="search-kbd hidden sm:inline-block">Ctrl K</kbd>
          </button>
        </div>

        {/* 3. RIGHT GROUP: Xuất Excel & Tải Ảnh sát góc phải */}
        <div className="navbar-right-group">
          <button
            type="button"
            className="navbar-action-btn"
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            title="Xuất bảng Excel danh bạ gia đình, ngày sinh, SĐT, quê quán"
          >
            <FileSpreadsheet size={15} className="text-emerald-400" />
            <span className="action-btn-text hidden sm:inline">{isExportingExcel ? 'Đang xuất...' : 'Xuất Excel'}</span>
          </button>

          <button
            type="button"
            className="navbar-action-btn"
            onClick={onExportImage}
            disabled={isExportingImage}
            title="Tải toàn bộ hình ảnh cây gia phả HD về máy để in ấn hoặc chia sẻ"
          >
            <Download size={15} className="text-sky-400" />
            <span className="action-btn-text hidden sm:inline">{isExportingImage ? 'Đang tạo...' : 'Tải Ảnh'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
