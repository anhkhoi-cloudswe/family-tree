import React, { useState, useEffect } from 'react';
import {
  Download,
  FileSpreadsheet,
  Calendar,
  UserPlus,
  LogOut,
  TreePine,
  UserCheck,
  Menu,
  X,
  Scan,
  HelpCircle,
  Layers,
  ChevronDown,
  Users,
  Crown,
  ShieldCheck,
  Check,
  Sparkles,
  Search,
} from 'lucide-react';
import { User, FamilyTree, Person } from '../types';
import { downloadTreeExcel } from '../services/api';
import { useToast } from './Toast';
import { FamilyTreeLogo } from './FamilyTreeLogo';

interface NavbarProps {
  user: User | null;
  tree: FamilyTree | null;
  mePerson: Person | null;
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
  mePerson,
  mainView,
  onMainViewChange,
  branchFilter,
  onBranchFilterChange,
  viewMode,
  onViewModeChange,
  onOpenPersonPicker,
  onOpenAddMember,
  onOpenLunar,
  onOpenReminder,
  onOpenFlashcard,
  onExportImage,
  isExportingImage,
  onLogout,
  onFitToScreen,
  onPanToMe,
  onPanToGen1,
  onOpenHelp,
  adminActiveTab = 'USERS',
  onAdminTabChange,
}) => {
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);
  const toast = useToast();

  // Lock canvas and body scroll when drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Handle Escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

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

  // Animated close: play slide-out for 220ms then unmount
  const closeDrawer = () => {
    setIsDrawerClosing(true);
    setTimeout(() => {
      setIsMobileMenuOpen(false);
      setIsDrawerClosing(false);
    }, 220);
  };

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

  const toRoman = (num: number) => {
    const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return romans[num - 1] || `${num}`;
  };

  return (
    <>
      <header className="two-tier-navbar" role="banner">
        {/* =========================================================
            TIER 1: Framer-Style Capsule Topbar (Logo | Links | Actions)
            ========================================================= */}
        <div className="navbar-tier-1 framer-navbar-wrapper">
          {/* 1. Left: Brand & Logo */}
          <div className="framer-brand-group">
            <div className="brand-icon-box" aria-hidden="true">
              <FamilyTreeLogo size={38} />
            </div>
            <div className="brand-text-box">
              <div className="brand-title-row">
                <h1 className="brand-title">Famlykin</h1>
                {user?.role === 'ADMIN' && (
                  <span className="brand-admin-badge">Admin</span>
                )}
              </div>
            </div>
          </div>

          {/* 2. Center: Admin Tabs Capsule (for ADMIN) or User Tools Capsule (for regular users) */}
          {user?.role === 'ADMIN' ? (
            <nav className="framer-admin-tabs-capsule" aria-label="Điều hướng quản trị">
              <button
                type="button"
                className={`framer-admin-tab-pill ${adminActiveTab === 'USERS' ? 'active' : ''}`}
                onClick={() => onAdminTabChange?.('USERS')}
                title="Quản lý danh sách tài khoản & phân quyền người dùng"
              >
                <Users size={15} color="#34d399" />
                <span>Tài Khoản</span>
              </button>

              <button
                type="button"
                className={`framer-admin-tab-pill ${adminActiveTab === 'REPORTS' ? 'active' : ''}`}
                onClick={() => onAdminTabChange?.('REPORTS')}
                title="Báo cáo số liệu & thống kê hệ thống"
              >
                <Crown size={15} color="#38bdf8" />
                <span>Báo Cáo</span>
              </button>

              <button
                type="button"
                className={`framer-admin-tab-pill ${adminActiveTab === 'AUDIT' ? 'active' : ''}`}
                onClick={() => onAdminTabChange?.('AUDIT')}
                title="Nhật ký truy vết & kiểm tra bảo mật"
              >
                <ShieldCheck size={15} color="#fbbf24" />
                <span>Bảo Mật</span>
              </button>

              <button
                type="button"
                className={`framer-admin-tab-pill ${adminActiveTab === 'SETTINGS' ? 'active' : ''}`}
                onClick={() => onAdminTabChange?.('SETTINGS')}
                title="Cấu hình kết nối Supabase Storage S3"
              >
                <Layers size={15} color="#a78bfa" />
                <span>Hạ Tầng S3</span>
              </button>
            </nav>
          ) : (
            <nav className="framer-links-capsule" aria-label="Công cụ chính">
              {/* Lịch Giỗ */}
              <button
                type="button"
                className="framer-nav-pill"
                onClick={onOpenLunar}
                title="Tra cứu ngày giỗ âm lịch & phần mộ tổ tiên"
              >
                <Calendar size={15} color="#34d399" />
                <span>Lịch Giỗ</span>
              </button>

              {/* Nhắc Sự Kiện (Sinh Nhật & Ngày Giỗ) */}
              {onOpenReminder && (
                <button
                  type="button"
                  className="framer-nav-pill"
                  onClick={onOpenReminder}
                  title="Cài đặt gợi nhớ nhắc ngày sinh nhật và ngày giỗ (Mặc định: trước 1 ngày)"
                >
                  <Calendar size={15} color="#f472b6" />
                  <span>Nhắc Lịch</span>
                </button>
              )}

              {/* 🎮 Đố Vui Gia Phả (Flashcard Game) */}
              {onOpenFlashcard && (
                <button
                  type="button"
                  className="framer-nav-pill flashcard-nav-pill"
                  onClick={onOpenFlashcard}
                  title="Trò chơi Flashcard: Đoán người thân và vai vế gia đình"
                >
                  <Sparkles size={15} color="#c084fc" />
                  <span>Đố Vui</span>
                </button>
              )}

              {/* Xuất Excel */}
              <button
                type="button"
                className="framer-nav-pill"
                onClick={handleExportExcel}
                disabled={isExportingExcel}
                title="Tải bảng Excel danh bạ gia đình, ngày sinh, SĐT, quê quán"
              >
                <FileSpreadsheet size={15} color="#10b981" />
                <span>{isExportingExcel ? 'Đang xuất...' : 'Xuất Excel'}</span>
              </button>

              {/* Tải Ảnh HD */}
              <button
                type="button"
                className="framer-nav-pill"
                onClick={onExportImage}
                disabled={isExportingImage}
                title="Tải toàn bộ hình ảnh cây gia phả HD về máy để in ấn hoặc chia sẻ"
              >
                <Download size={15} color="#2dd4bf" />
                <span>{isExportingImage ? 'Đang tạo...' : 'Tải Ảnh'}</span>
              </button>

              {/* Hướng Dẫn */}
              {onOpenHelp && (
                <button
                  type="button"
                  className="framer-nav-pill"
                  onClick={onOpenHelp}
                  title="Xem hướng dẫn sử dụng và điều hướng cây gia phả"
                >
                  <HelpCircle size={15} color="#94a3b8" />
                  <span>Hướng Dẫn</span>
                </button>
              )}
            </nav>
          )}

          {/* 3. Right: Action CTA & User */}
          {/* 3. Right: Action CTA & User */}
          <div className="framer-action-group">
            {/* Desktop Search Trigger Button (Replaces + Thêm, matching mobile search) */}
            {user?.role !== 'ADMIN' && (
              <button
                type="button"
                className="navbar-search-btn-desktop"
                onClick={onOpenPersonPicker}
                aria-label="Tìm kiếm người thân trong dòng họ (Ctrl + K)"
                title="Tìm kiếm người thân trong dòng họ (Ctrl + K)"
              >
                <Search size={15} className="search-icon" />
                <span className="search-label">Tìm thành viên...</span>
                <kbd className="search-kbd">Ctrl K</kbd>
              </button>
            )}

            {/* User Profile & Prominent Logout */}
            {user && (
              <div className="framer-user-pill">
                <div
                  className="user-avatar-badge"
                  title={`Đang đăng nhập: ${user.fullName} (${user.role})`}
                  aria-label={`Tài khoản: ${user.fullName}`}
                  style={user.role === 'ADMIN' ? { border: '1.5px solid #fbbf24', color: '#fbbf24' } : undefined}
                >
                  {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </div>
                <span className="framer-user-name-display" title={user.fullName}>
                  {user.fullName}
                </span>
                <button
                  type="button"
                  className="framer-logout-btn-labeled"
                  onClick={onLogout}
                  title="Đăng xuất tài khoản"
                  aria-label="Đăng xuất tài khoản"
                >
                  <LogOut size={14} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Right Controls: Quick Search (User only) + Hamburger Button */}
          <div className="mobile-header-actions">
            {user?.role !== 'ADMIN' && (
              <button
                type="button"
                className="mobile-quick-search-btn"
                onClick={onOpenPersonPicker}
                aria-label="Tìm kiếm người thân trong dòng họ"
                title="Tìm kiếm người thân"
              >
                <Search size={17} />
                <span>Tìm kiếm</span>
              </button>
            )}

            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label={user?.role === 'ADMIN' ? 'Mở menu quản trị' : 'Mở menu tính năng dòng họ'}
              aria-expanded={isMobileMenuOpen}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>

        {/* =========================================================
            TIER 2: Sub-bar Controls (Only shown for non-admin)
            ========================================================= */}
        {user?.role === 'ADMIN' ? null : (
          <div className="navbar-tier-2-outer">
            <div className="navbar-tier-2 framer-subbar">
            {/* Main View Mode Segmented Tabs: [Sơ đồ Cây] / [Danh Sách] */}
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

            {/* 3. View Mode Toggle: Desktop only */}
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
      )}
      </header>

      {/* =========================================================
          SLIDE-OVER MENU DRAWER (Elderly-Friendly & Mobile Touch UX)
          ========================================================= */}
      {isMobileMenuOpen && (
        <div
          className={`mobile-drawer-overlay${isDrawerClosing ? ' closing' : ''}`}
          onClick={closeDrawer}
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-menu-title"
        >
          <div
            className={`mobile-drawer-panel${isDrawerClosing ? ' closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="mobile-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div className="brand-icon-box">
                  <FamilyTreeLogo size={38} />
                </div>
                <div>
                  <h3 id="drawer-menu-title" className="drawer-header-title">
                    {user?.role === 'ADMIN' ? 'Famlykin Admin' : 'Chức Năng Dòng Họ'}
                  </h3>
                  <span className="drawer-header-subtitle">
                    {user?.role === 'ADMIN' ? 'Bảng Điều Khiển Quản Trị' : (tree ? tree.name : 'Cây Gia Phả Số')}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="mobile-drawer-close-btn"
                onClick={closeDrawer}
                aria-label="Đóng menu"
              >
                <X size={22} />
              </button>
            </div>

            {/* Mobile Actions List */}
            <div className="mobile-drawer-body">
              {user?.role === 'ADMIN' ? (
                <>
                  <button
                    type="button"
                    className={`mobile-action-card ${adminActiveTab === 'USERS' ? 'primary' : ''}`}
                    onClick={() => {
                      onAdminTabChange?.('USERS');
                      closeDrawer();
                    }}
                  >
                    <div className="mobile-action-icon-box">
                      <Users size={20} color="#34d399" />
                    </div>
                    <div className="mobile-action-content">
                      <div className="mobile-action-title">Quản Lý Tài Khoản</div>
                      <div className="mobile-action-desc">
                        Phân quyền Admin & tạo tài khoản mới
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`mobile-action-card ${adminActiveTab === 'REPORTS' ? 'primary' : ''}`}
                    onClick={() => {
                      onAdminTabChange?.('REPORTS');
                      closeDrawer();
                    }}
                  >
                    <div className="mobile-action-icon-box">
                      <Crown size={20} color="#38bdf8" />
                    </div>
                    <div className="mobile-action-content">
                      <div className="mobile-action-title">Báo Cáo & Thống Kê</div>
                      <div className="mobile-action-desc">
                        Chỉ số người dùng & xuất báo cáo CSV
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`mobile-action-card ${adminActiveTab === 'AUDIT' ? 'primary' : ''}`}
                    onClick={() => {
                      onAdminTabChange?.('AUDIT');
                      closeDrawer();
                    }}
                  >
                    <div className="mobile-action-icon-box">
                      <ShieldCheck size={20} color="#fbbf24" />
                    </div>
                    <div className="mobile-action-content">
                      <div className="mobile-action-title">Nhật Ký & Bảo Mật</div>
                      <div className="mobile-action-desc">
                        Giám sát phiên làm việc & an toàn hệ thống
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`mobile-action-card ${adminActiveTab === 'SETTINGS' ? 'primary' : ''}`}
                    onClick={() => {
                      onAdminTabChange?.('SETTINGS');
                      closeDrawer();
                    }}
                  >
                    <div className="mobile-action-icon-box">
                      <Layers size={20} color="#a78bfa" />
                    </div>
                    <div className="mobile-action-content">
                      <div className="mobile-action-title">Hạ Tầng & S3 Storage</div>
                      <div className="mobile-action-desc">
                        Cấu hình lưu trữ ảnh Cloud Supabase
                      </div>
                    </div>
                  </button>
                </>
              ) : (
                <>
                  {/* Chế độ xem: [Sơ đồ Cây] / [Danh Sách Thành Viên] */}
                  <div className="mobile-viewmode-toggle-group" role="tablist" aria-label="Chọn chế độ hiển thị">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mainView === 'TREE'}
                      className={`mobile-viewmode-btn ${mainView === 'TREE' ? 'active' : ''}`}
                      onClick={() => {
                        onMainViewChange('TREE');
                        closeDrawer();
                      }}
                    >
                      <TreePine size={17} />
                      <span>Sơ đồ Cây</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mainView === 'LIST'}
                      className={`mobile-viewmode-btn ${mainView === 'LIST' ? 'active' : ''}`}
                      onClick={() => {
                        onMainViewChange('LIST');
                        closeDrawer();
                      }}
                    >
                      <Users size={17} />
                      <span>Danh Sách</span>
                    </button>
                  </div>

                  {/* 0. Đố Vui Gia Phả (Flashcard Quiz) */}
                  {onOpenFlashcard && (
                    <button
                      type="button"
                      className="mobile-action-card"
                      onClick={() => {
                        closeDrawer();
                        onOpenFlashcard();
                      }}
                      style={{
                        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(126, 34, 206, 0.2) 100%)',
                        borderColor: 'rgba(168, 85, 247, 0.45)',
                      }}
                    >
                      <div className="mobile-action-icon-box" style={{ background: '#f3e8ff' }}>
                        <Sparkles size={22} color="#9333ea" />
                      </div>
                      <div className="mobile-action-content">
                        <div className="mobile-action-title" style={{ color: '#d8b4fe' }}>
                          🎮 Đố Vui Gia Phả (Flashcard)
                        </div>
                        <div className="mobile-action-desc">
                          Trò chơi tương tác đoán người thân và vai vế gia đình 4 đáp án
                        </div>
                      </div>
                    </button>
                  )}

                  {/* 1. Thêm Người Thân Mới */}
                  <button
                    type="button"
                    className="mobile-action-card primary"
                    onClick={() => {
                      closeDrawer();
                      onOpenAddMember();
                    }}
                  >
                    <div className="mobile-action-icon-box" style={{ background: '#14532d' }}>
                      <UserPlus size={20} color="#ffffff" />
                    </div>
                    <div className="mobile-action-content">
                      <div className="mobile-action-title">+ Thêm Người Thân Mới</div>
                      <div className="mobile-action-desc">
                        Thêm con cháu, cha mẹ hoặc dâu rể
                      </div>
                    </div>
                  </button>

                  {/* 2. Xuất Excel */}
                  <button
                    type="button"
                    className="mobile-action-card"
                    onClick={() => {
                      closeDrawer();
                      handleExportExcel();
                    }}
                    disabled={isExportingExcel}
                  >
                    <div className="mobile-action-icon-box" style={{ background: '#d1fae5' }}>
                      <FileSpreadsheet size={20} color="#059669" />
                    </div>
                    <div className="mobile-action-content">
                      <div className="mobile-action-title">
                        {isExportingExcel ? 'Đang xuất Excel...' : 'Xuất Danh Sách Excel'}
                      </div>
                      <div className="mobile-action-desc">
                        Tải bảng danh bạ kèm ngày sinh, SĐT
                      </div>
                    </div>
                  </button>

                  {/* 3. Lịch Giỗ & Mộ Phần */}
                  <button
                    type="button"
                    className="mobile-action-card"
                    onClick={() => {
                      closeDrawer();
                      onOpenLunar();
                    }}
                  >
                    <div className="mobile-action-icon-box" style={{ background: '#ffedd5' }}>
                      <Calendar size={20} color="#ea580c" />
                    </div>
                    <div className="mobile-action-content">
                      <div className="mobile-action-title">Lịch Giỗ Âm Lịch & Dương Lịch</div>
                      <div className="mobile-action-desc">
                        Tra cứu ngày giỗ âm dương & phần mộ
                      </div>
                    </div>
                  </button>

                  {/* 4. Nhắc Lịch Sinh Nhật & Giỗ */}
                  {onOpenReminder && (
                    <button
                      type="button"
                      className="mobile-action-card"
                      onClick={() => {
                        closeDrawer();
                        onOpenReminder();
                      }}
                    >
                      <div className="mobile-action-icon-box" style={{ background: '#fdf2f8' }}>
                        <Calendar size={20} color="#db2777" />
                      </div>
                      <div className="mobile-action-content">
                        <div className="mobile-action-title">Gợi Nhớ Sinh Nhật & Giỗ</div>
                        <div className="mobile-action-desc">
                          Cài đặt nhắc nhở trước 1 ngày
                        </div>
                      </div>
                    </button>
                  )}

                  {/* 5. Tải Ảnh Cây Gia Phả HD */}
                  <button
                    type="button"
                    className="mobile-action-card"
                    onClick={() => {
                      closeDrawer();
                      onExportImage();
                    }}
                    disabled={isExportingImage}
                  >
                    <div className="mobile-action-icon-box" style={{ background: '#ccfbf1' }}>
                      <Download size={20} color="#0d9488" />
                    </div>
                    <div className="mobile-action-content">
                      <div className="mobile-action-title">
                        {isExportingImage ? 'Đang tạo ảnh...' : 'Tải Ảnh Cây Gia Phả (HD)'}
                      </div>
                      <div className="mobile-action-desc">
                        Lưu hình ảnh phả hệ sắc nét về máy
                      </div>
                    </div>
                  </button>

                  {/* 6. Đổi Góc Nhìn Xưng Hô */}
                  <button
                    type="button"
                    className="mobile-action-card"
                    onClick={() => {
                      closeDrawer();
                      onOpenPersonPicker();
                    }}
                  >
                    <div className="mobile-action-icon-box" style={{ background: '#eff6ff' }}>
                      <UserCheck size={20} color="#2563eb" />
                    </div>
                    <div className="mobile-action-content">
                      <div className="mobile-action-title">Đổi Góc Nhìn Xưng Hô</div>
                      <div className="mobile-action-desc">
                        Đang xem theo: <strong>{mePerson?.fullName || 'Bản thân'}</strong>
                      </div>
                    </div>
                  </button>

                  {/* 7. Đố Vui Gia Phả */}
                  {onOpenFlashcard && (
                    <button
                      type="button"
                      className="mobile-action-card"
                      onClick={() => {
                        closeDrawer();
                        onOpenFlashcard();
                      }}
                    >
                      <div className="mobile-action-icon-box" style={{ background: '#f3e8ff' }}>
                        <Sparkles size={20} color="#9333ea" />
                      </div>
                      <div className="mobile-action-content">
                        <div className="mobile-action-title">Đố Vui Gia Phả (Flashcard)</div>
                        <div className="mobile-action-desc">
                          Trò chơi đoán vai vế & người thân
                        </div>
                      </div>
                    </button>
                  )}

                  {/* 8. Căn Vừa Màn Hình */}
                  {onFitToScreen && (
                    <button
                      type="button"
                      className="mobile-action-card"
                      onClick={() => {
                        closeDrawer();
                        onFitToScreen();
                      }}
                    >
                      <div className="mobile-action-icon-box" style={{ background: '#eff6ff' }}>
                        <Scan size={20} color="#2563eb" />
                      </div>
                      <div className="mobile-action-content">
                        <div className="mobile-action-title">Căn Vừa Màn Hình</div>
                        <div className="mobile-action-desc">
                          Tự động căn chỉnh toàn bộ sơ đồ
                        </div>
                      </div>
                    </button>
                  )}

                  {/* 9. Hướng Dẫn Sử Dụng */}
                  {onOpenHelp && (
                    <button
                      type="button"
                      className="mobile-action-card"
                      onClick={() => {
                        closeDrawer();
                        onOpenHelp();
                      }}
                    >
                      <div className="mobile-action-icon-box" style={{ background: '#f8fafc' }}>
                        <HelpCircle size={20} color="#475569" />
                      </div>
                      <div className="mobile-action-content">
                        <div className="mobile-action-title">Hướng Dẫn Sử Dụng</div>
                        <div className="mobile-action-desc">
                          Cách kéo thả, phóng to & điều hướng
                        </div>
                      </div>
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Mobile User Profile & Prominent Logout Footer */}
            {user && (
              <div className="mobile-drawer-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
                  <div className="user-avatar-badge" style={{ width: 42, height: 42, fontSize: '1.05rem', flexShrink: 0 }}>
                    {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                  </div>
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <span className="drawer-user-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.fullName}
                    </span>
                    <span className="drawer-user-email" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.email}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="drawer-logout-prominent-btn"
                  onClick={() => {
                    closeDrawer();
                    onLogout();
                  }}
                  title="Đăng xuất khỏi tài khoản này"
                  aria-label="Đăng xuất tài khoản"
                >
                  <LogOut size={16} />
                  <span>Đăng Xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
