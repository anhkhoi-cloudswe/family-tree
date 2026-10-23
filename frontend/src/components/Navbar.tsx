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
  Compass,
  ArrowUpCircle,
  HelpCircle,
  Layers,
  ChevronDown,
  Users,
  Crown,
  Check,
  Sparkles,
  MoreHorizontal,
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
  onOpenAdmin?: () => void;
  adminActiveTab?: 'USERS' | 'TREES' | 'OVERVIEW' | 'SETTINGS';
  onAdminTabChange?: (tab: 'USERS' | 'TREES' | 'OVERVIEW' | 'SETTINGS') => void;
  adminPreviewTreeId?: string | null;
  onAdminExitPreview?: () => void;
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
  onOpenAdmin,
  adminActiveTab = 'USERS',
  onAdminTabChange,
  adminPreviewTreeId,
  onAdminExitPreview,
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
              <FamilyTreeLogo size={24} />
            </div>
            <div className="brand-text-box">
              <div className="brand-title-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 className="brand-title">Famlykin</h1>
                {user?.role === 'ADMIN' ? (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.18rem 0.55rem',
                      borderRadius: '999px',
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.4) 100%)',
                      border: '1px solid rgba(245, 158, 11, 0.55)',
                      color: '#fbbf24',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Admin
                  </span>
                ) : (
                  <span style={{ color: '#a7f3d0', fontSize: '0.82rem', fontWeight: 600 }}>Cây Gia Phả</span>
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
                onClick={() => {
                  onAdminTabChange?.('USERS');
                  if (adminPreviewTreeId && onAdminExitPreview) onAdminExitPreview();
                }}
                title="Quản lý danh sách tài khoản & phân quyền người dùng"
              >
                <Users size={15} color="#34d399" />
                <span>Người Dùng</span>
              </button>

              <button
                type="button"
                className={`framer-admin-tab-pill ${adminActiveTab === 'TREES' ? 'active' : ''}`}
                onClick={() => {
                  onAdminTabChange?.('TREES');
                  if (adminPreviewTreeId && onAdminExitPreview) onAdminExitPreview();
                }}
                title="Quản lý và giám sát tất cả cây gia phả trong hệ thống"
              >
                <TreePine size={15} color="#38bdf8" />
                <span>Cây Gia Phả</span>
              </button>

              <button
                type="button"
                className={`framer-admin-tab-pill ${adminActiveTab === 'OVERVIEW' ? 'active' : ''}`}
                onClick={() => {
                  onAdminTabChange?.('OVERVIEW');
                  if (adminPreviewTreeId && onAdminExitPreview) onAdminExitPreview();
                }}
                title="Thống kê tổng quan và trạng thái hạ tầng đám mây"
              >
                <Crown size={15} color="#fbbf24" />
                <span>Tổng Quan</span>
              </button>

              <button
                type="button"
                className={`framer-admin-tab-pill ${adminActiveTab === 'SETTINGS' ? 'active' : ''}`}
                onClick={() => {
                  onAdminTabChange?.('SETTINGS');
                  if (adminPreviewTreeId && onAdminExitPreview) onAdminExitPreview();
                }}
                title="Cấu hình kết nối Supabase Storage S3"
              >
                <Layers size={15} color="#a78bfa" />
                <span>Cấu Hình S3</span>
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
          <div className="framer-action-group">
            {/* If admin is previewing a tree, provide exit preview button */}
            {user?.role === 'ADMIN' && adminPreviewTreeId && onAdminExitPreview && (
              <button
                type="button"
                className="admin-preview-exit-btn"
                onClick={onAdminExitPreview}
                title="Trở lại giao diện Quản Trị Hệ Thống"
              >
                <span>⬅ Quay lại Quản Trị</span>
              </button>
            )}

            {/* Primary Action Button (Only for regular users, NOT admin) */}
            {user?.role !== 'ADMIN' && (
              <button
                type="button"
                className="framer-cta-pill"
                onClick={onOpenAddMember}
                aria-label="Thêm người thân vào cây gia phả"
                title="Thêm thành viên mới vào gia phả"
              >
                <UserPlus size={15} />
                <span>+ Thêm</span>
              </button>
            )}

            {/* User Profile & Logout */}
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
                <button
                  type="button"
                  className="framer-logout-btn"
                  onClick={onLogout}
                  title="Đăng xuất tài khoản"
                  aria-label="Đăng xuất tài khoản"
                >
                  <LogOut size={15} />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Right Controls: Quick Add (User only) + Hamburger Button */}
          <div className="mobile-header-actions">
            {user?.role !== 'ADMIN' && (
              <button
                type="button"
                className="mobile-quick-add-btn"
                onClick={onOpenAddMember}
                aria-label="Thêm thành viên mới"
              >
                <UserPlus size={18} />
                <span>Thêm</span>
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
            TIER 2: Sub-bar Controls (Only shown for non-admin, OR when admin is previewing a tree)
            ========================================================= */}
        {user?.role === 'ADMIN' ? (
          adminPreviewTreeId && (
            <div className="admin-preview-banner">
              <div>
                <span>Đang xem trước cây phả hệ: </span>
                <strong style={{ color: '#ffffff' }}>{tree?.name || adminPreviewTreeId}</strong>
              </div>
              <button
                type="button"
                className="admin-preview-exit-btn"
                onClick={onAdminExitPreview}
              >
                <span>⬅ Thoát Xem Trước</span>
              </button>
            </div>
          )
        ) : (
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
                <div className="brand-icon-box" style={{ width: 40, height: 40 }}>
                  <FamilyTreeLogo size={28} />
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
                      if (adminPreviewTreeId && onAdminExitPreview) onAdminExitPreview();
                      closeDrawer();
                    }}
                  >
                    <div className="mobile-action-icon-box">
                      <Users size={22} color="#34d399" />
                    </div>
                    <div className="mobile-action-content">
                      <div className="mobile-action-title">Quản Lý Tài Khoản</div>
                      <div className="mobile-action-desc">
                        Danh sách người dùng, phân quyền Admin & thêm tài khoản mới
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`mobile-action-card ${adminActiveTab === 'TREES' ? 'primary' : ''}`}
                    onClick={() => {
                      onAdminTabChange?.('TREES');
                      if (adminPreviewTreeId && onAdminExitPreview) onAdminExitPreview();
                      closeDrawer();
                    }}
                  >
                    <div className="mobile-action-icon-box">
                      <TreePine size={22} color="#38bdf8" />
                    </div>
                    <div className="mobile-action-content">
                      <div className="mobile-action-title">Cây Gia Phả Hệ Thống</div>
                      <div className="mobile-action-desc">
                        Xem chi tiết cây phả hệ, quy mô dòng họ và kiểm duyệt dữ liệu
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`mobile-action-card ${adminActiveTab === 'OVERVIEW' ? 'primary' : ''}`}
                    onClick={() => {
                      onAdminTabChange?.('OVERVIEW');
                      if (adminPreviewTreeId && onAdminExitPreview) onAdminExitPreview();
                      closeDrawer();
                    }}
                  >
                    <div className="mobile-action-icon-box">
                      <Crown size={22} color="#fbbf24" />
                    </div>
                    <div className="mobile-action-content">
                      <div className="mobile-action-title">Thống Kê Tổng Quan</div>
                      <div className="mobile-action-desc">
                        Chỉ số người dùng, dòng họ và trạng thái kết nối hạ tầng
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`mobile-action-card ${adminActiveTab === 'SETTINGS' ? 'primary' : ''}`}
                    onClick={() => {
                      onAdminTabChange?.('SETTINGS');
                      if (adminPreviewTreeId && onAdminExitPreview) onAdminExitPreview();
                      closeDrawer();
                    }}
                  >
                    <div className="mobile-action-icon-box">
                      <Layers size={22} color="#a78bfa" />
                    </div>
                    <div className="mobile-action-content">
                      <div className="mobile-action-title">Cấu Hình Supabase S3</div>
                      <div className="mobile-action-desc">
                        Cấu hình Anon Key & kiểm tra kết nối lưu trữ ảnh Cloud
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

                  {/* 1. Thêm Người Thân */}
                  <button
                    type="button"
                    className="mobile-action-card primary"
                    onClick={() => {
                      closeDrawer();
                      onOpenAddMember();
                    }}
                  >
                    <div className="mobile-action-icon-box" style={{ background: '#14532d' }}>
                      <UserPlus size={22} color="#ffffff" />
                    </div>
                    <div className="mobile-action-content">
                      <div className="mobile-action-title">+ Thêm Người Thân Mới</div>
                      <div className="mobile-action-desc">
                        Thêm con cháu, cha mẹ hoặc dâu rể mới vào cây gia phả
                      </div>
                    </div>
                  </button>

                  {/* 2. Đổi Vai Vế (Person Picker) */}
                  <button
                    type="button"
                    className="mobile-action-card"
                    onClick={() => {
                      closeDrawer();
                      onOpenPersonPicker();
                    }}
                  >
                    <div className="mobile-action-icon-box" style={{ background: '#eff6ff' }}>
                      <UserCheck size={22} color="#2563eb" />
                    </div>
                    <div className="mobile-action-content">
                      <div className="mobile-action-title">Đổi Góc Nhìn Xưng Hô</div>
                      <div className="mobile-action-desc">
                        Đang xem theo: <strong>{mePerson?.fullName || 'Bản thân'}</strong>
                      </div>
                    </div>
                  </button>

                  {/* 3. Tải Ảnh Cây Gia Phả */}
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
                      <Download size={22} color="#0d9488" />
                    </div>
                    <div className="mobile-action-content">
                      <div className="mobile-action-title">
                        {isExportingImage ? 'Đang tạo ảnh...' : 'Tải Ảnh Cây Gia Phả (HD)'}
                      </div>
                      <div className="mobile-action-desc">
                        Lưu hình ảnh cây sắc nét về máy để xem hoặc chia sẻ cho con cháu
                      </div>
                    </div>
                  </button>

                  {/* 4. Xuất Excel */}
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
                      <FileSpreadsheet size={22} color="#059669" />
                    </div>
                    <div className="mobile-action-content">
                      <div className="mobile-action-title">
                        {isExportingExcel ? 'Đang xuất...' : 'Xuất Danh Sách Excel'}
                      </div>
                      <div className="mobile-action-desc">
                        Tải bảng danh bạ kèm ngày sinh, SĐT, quê quán dòng họ
                      </div>
                    </div>
                  </button>

                  {/* 5. Lịch Giỗ & Mộ Phần */}
                  <button
                    type="button"
                    className="mobile-action-card"
                    onClick={() => {
                      closeDrawer();
                      onOpenLunar();
                    }}
                  >
                    <div className="mobile-action-icon-box" style={{ background: '#ffedd5' }}>
                      <Calendar size={22} color="#ea580c" />
                    </div>
                    <div className="mobile-action-content">
                      <div className="mobile-action-title">Lịch Giỗ & Mộ Phần</div>
                      <div className="mobile-action-desc">
                        Tra cứu ngày giỗ âm lịch, nơi an táng và tọa độ GPS tổ tiên
                      </div>
                    </div>
                  </button>

                  {/* 5.1 Gợi Nhớ Sinh Nhật & Ngày Giỗ */}
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
                        <Calendar size={22} color="#db2777" />
                      </div>
                      <div className="mobile-action-content">
                        <div className="mobile-action-title">Gợi Nhớ Sinh Nhật & Ngày Giỗ</div>
                        <div className="mobile-action-desc">
                          Cài đặt nhắc nhở trước ngày sinh nhật và ngày giỗ (Mặc định 1 ngày)
                        </div>
                      </div>
                    </button>
                  )}

                  {/* 6. Căn Vừa Màn Hình */}
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
                        <Scan size={22} color="#2563eb" />
                      </div>
                      <div className="mobile-action-content">
                        <div className="mobile-action-title">Căn Vừa Màn Hình</div>
                        <div className="mobile-action-desc">
                          Tự động gom gọn toàn bộ các thế hệ vào khung nhìn
                        </div>
                      </div>
                    </button>
                  )}

                  {/* 7. Về Vị Trí Của Tôi */}
                  {onPanToMe && mePerson && (
                    <button
                      type="button"
                      className="mobile-action-card"
                      onClick={() => {
                        closeDrawer();
                        onPanToMe();
                      }}
                    >
                      <div className="mobile-action-icon-box" style={{ background: '#fef3c7' }}>
                        <Compass size={22} color="#b45309" />
                      </div>
                      <div className="mobile-action-content">
                        <div className="mobile-action-title">Về Vị Trí Của Tôi</div>
                        <div className="mobile-action-desc">
                          Tự động di chuyển tâm canvas đến thẻ của bạn
                        </div>
                      </div>
                    </button>
                  )}

                  {/* 8. Về Thế Hệ I */}
                  {onPanToGen1 && (
                    <button
                      type="button"
                      className="mobile-action-card"
                      onClick={() => {
                        closeDrawer();
                        onPanToGen1();
                      }}
                    >
                      <div className="mobile-action-icon-box" style={{ background: '#f1f5f9' }}>
                        <ArrowUpCircle size={22} color="#475569" />
                      </div>
                      <div className="mobile-action-content">
                        <div className="mobile-action-title">Về Thế Hệ I (Đầu Cây)</div>
                        <div className="mobile-action-desc">
                          Di chuyển lên thế hệ ông bà tổ tiên đầu dòng
                        </div>
                      </div>
                    </button>
                  )}

                  {/* 10. Hướng Dẫn Sử Dụng */}
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
                        <HelpCircle size={22} color="#475569" />
                      </div>
                      <div className="mobile-action-content">
                        <div className="mobile-action-title">Hướng Dẫn Sử Dụng</div>
                        <div className="mobile-action-desc">
                          Xem cách kéo thả, phóng to, tìm kiếm và thêm thành viên
                        </div>
                      </div>
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Mobile User Profile & Logout Footer */}
            {user && (
              <div className="mobile-drawer-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="user-avatar-badge" style={{ width: 44, height: 44, fontSize: '1.1rem' }}>
                    {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <span className="drawer-user-name">{user.fullName}</span>
                    <span className="drawer-user-email">{user.email}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="drawer-logout-btn"
                  onClick={() => {
                    closeDrawer();
                    onLogout();
                  }}
                  title="Đăng xuất tài khoản"
                  aria-label="Đăng xuất tài khoản"
                >
                  <LogOut size={16} />
                  <span>Thoát</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
