import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Sliders,
  Bell,
  User as UserIcon,
  Phone,
  LogOut,
  Share2,
  Shield,
  Eye,
  Edit3,
  Crown,
  LayoutGrid,
  Users,
  Calendar,
  Sparkles,
  HelpCircle,
  Settings,
  BookOpen,
  LucideIcon,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { User, FamilyTree, TreeRole } from '../types';
import { FamilyTreeLogo } from './FamilyTreeLogo';

export type SidebarMode = 'expanded' | 'collapsed' | 'hover-expand';

export interface NavItemConfig {
  key: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  badgeColor?: string;
  onClick?: () => void;
  children?: {
    key: string;
    label: string;
    onClick?: () => void;
  }[];
}

interface LayoutProps {
  user: User | null;
  tree: FamilyTree | null;
  activeNav: string;
  onSelectNav: (key: string) => void;
  pendingInvitationsCount?: number;
  onOpenInvitations?: () => void;
  onOpenShareModal?: () => void;
  onUpdatePhone?: () => void;
  onOpenProfile?: () => void;
  onLogout: () => void;
  headerContent?: React.ReactNode;
  children: React.ReactNode;
}

const STORAGE_KEY = 'sidebar_mode_preference';

export const Layout: React.FC<LayoutProps> = ({
  user,
  tree,
  activeNav,
  onSelectNav,
  pendingInvitationsCount = 0,
  onOpenInvitations,
  onOpenShareModal,
  onUpdatePhone,
  onOpenProfile,
  onLogout,
  headerContent,
  children,
}) => {
  // Sidebar mode state: expanded | collapsed | hover-expand
  const [mode, setMode] = useState<SidebarMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'expanded' || saved === 'collapsed' || saved === 'hover-expand') {
      return saved;
    }
    return 'hover-expand'; // default mode
  });

  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [showModeMenu, setShowModeMenu] = useState<boolean>(false);
  const modeMenuRef = useRef<HTMLDivElement>(null);

  const setSidebarMode = (newMode: SidebarMode) => {
    setMode(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
    setShowModeMenu(false);
  };

  // Close mode popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target as Node)) {
        setShowModeMenu(false);
      }
    };
    if (showModeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModeMenu]);

  const toggleSidebar = () => {
    if (mode === 'expanded') {
      setSidebarMode('collapsed');
    } else {
      setSidebarMode('expanded');
    }
  };

  // Keyboard shortcut: Ctrl + B toggles sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode]);

  // Derived sidebar visual state: On mobile, drawer is ALWAYS expanded so all text and labels are shown!
  const isExpanded = Boolean(mobileOpen || mode === 'expanded' || (mode === 'hover-expand' && isHovered));

  // Main content margin offset
  // If 'expanded', main margin is w-72 (288px)
  // If 'collapsed' or 'hover-expand', main margin is w-20 (80px) so hover overlay does not shift canvas
  const contentMarginClass = mode === 'expanded' ? 'lg:ml-72' : 'lg:ml-20';

  // Navigation items config
  const navItems: NavItemConfig[] = [
    {
      key: 'TREE',
      label: 'Sơ đồ Cây',
      icon: LayoutGrid,
    },
    {
      key: 'LIST',
      label: 'Danh bạ Gia Phả',
      icon: Users,
      badge: tree?.members ? `${tree.members.length}` : undefined,
    },
    {
      key: 'LUNAR',
      label: 'Lịch Giỗ & Mộ phần',
      icon: Calendar,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      key: 'FLASHCARD',
      label: 'Trắc nghiệm Gia Đình',
      icon: Sparkles,
      badge: 'Mini App',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      key: 'REMINDER',
      label: 'Cài đặt Nhắc nhở',
      icon: Settings,
    },
    {
      key: 'SHARE',
      label: 'Mời người thân',
      icon: Share2,
      onClick: onOpenShareModal,
    },
    ...(user?.role === 'ADMIN'
      ? [
          {
            key: 'ADMIN',
            label: 'Quản trị Hệ thống',
            icon: Shield,
            badge: 'Admin',
            badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          },
        ]
      : []),
    {
      key: 'TOUR',
      label: 'Hướng dẫn sử dụng',
      icon: BookOpen,
    },
  ];

  // Render role badge helper
  const renderRoleBadge = (role?: TreeRole) => {
    switch (role) {
      case 'OWNER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Crown size={12} className="text-amber-400" />
            Chủ cây
          </span>
        );
      case 'EDITOR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <Edit3 size={12} className="text-emerald-400" />
            Chỉnh sửa
          </span>
        );
      case 'VIEWER':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/20 text-slate-300 border border-slate-500/40">
            <Eye size={12} className="text-slate-400" />
            Chỉ xem
          </span>
        );
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-transparent text-slate-100 flex flex-col font-sans overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Mobile Topbar */}
      <header className="lg:hidden sticky top-0 z-40 w-full h-14 bg-slate-900/90 backdrop-blur-md border-b border-emerald-500/20 px-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
            aria-label="Mở menu"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <FamilyTreeLogo size={26} />
            <span className="font-bold text-sm bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
              Famlykin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pendingInvitationsCount > 0 && (
            <button
              type="button"
              onClick={onOpenInvitations}
              className="relative p-2 rounded-lg text-amber-300 hover:bg-amber-500/10 transition"
              title="Lời mời vào cây gia phả"
            >
              <Bell size={20} />
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-900">
                {pendingInvitationsCount}
              </span>
            </button>
          )}

          {tree && (
            <button
              type="button"
              onClick={onOpenShareModal}
              className="p-2 rounded-lg text-emerald-300 hover:bg-emerald-500/10 transition"
              title="Mời người thân"
            >
              <Share2 size={18} />
            </button>
          )}
        </div>
      </header>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar: Desktop fixed & Mobile Drawer */}
      <aside
        onMouseEnter={() => mode === 'hover-expand' && setIsHovered(true)}
        onMouseLeave={() => mode === 'hover-expand' && setIsHovered(false)}
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-950/92 backdrop-blur-2xl border-r border-emerald-500/20 shadow-2xl transition-all duration-300 ease-in-out
          ${
            mobileOpen
              ? 'translate-x-0 w-72'
              : '-translate-x-full lg:translate-x-0 ' +
                (mode === 'expanded'
                  ? 'w-72'
                  : mode === 'collapsed'
                  ? 'w-20'
                  : isHovered
                  ? 'w-72 shadow-emerald-950/50 shadow-2xl'
                  : 'w-20')
          }
        `}
      >
        {/* Sidebar Header: Logo & Mode Controller */}
        <div className={`h-16 px-3 flex items-center border-b border-emerald-500/15 relative ${isExpanded ? 'justify-between' : 'justify-center'}`}>
          {!isExpanded ? (
            <div className="flex flex-col items-center justify-center group py-1">
              <button
                type="button"
                onClick={toggleSidebar}
                className="relative p-1.5 rounded-xl hover:bg-emerald-500/20 text-emerald-400 transition cursor-pointer flex items-center justify-center group"
                title="Nhấn để mở rộng thanh menu (Ctrl + B)"
                aria-label="Mở rộng menu bên trái"
              >
                <FamilyTreeLogo size={36} />
                <span className="absolute -bottom-1 -right-1 p-0.5 rounded bg-slate-900 border border-emerald-500/40 text-emerald-400 group-hover:scale-110 transition shadow-sm">
                  <PanelLeftOpen size={12} />
                </span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="flex-shrink-0 flex items-center justify-center">
                  <FamilyTreeLogo size={34} />
                </div>
                <div className="flex flex-col whitespace-nowrap overflow-hidden">
                  <span className="font-bold text-base bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-200 bg-clip-text text-transparent truncate tracking-tight">
                    Famlykin
                  </span>
                  <span className="text-[11px] text-slate-400 truncate">
                    Cây Gia Phả Số
                  </span>
                </div>
              </div>

              {/* Desktop Mode Toggle & Collapse Controls */}
              <div className="hidden lg:flex items-center gap-1">
                {/* 1-Click Collapse Button */}
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-800/80 transition cursor-pointer"
                  title="Thu gọn thanh menu (Ctrl + B)"
                  aria-label="Thu gọn thanh menu"
                >
                  <PanelLeftClose size={18} />
                </button>

                {/* Mode Settings Popover */}
                <div className="relative" ref={modeMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowModeMenu(!showModeMenu)}
                    className={`p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-800/80 transition cursor-pointer ${
                      showModeMenu ? 'bg-slate-800 text-emerald-300 ring-1 ring-emerald-500/30' : ''
                    }`}
                    title="Cài đặt chế độ thanh điều hướng"
                    aria-label="Cài đặt chế độ thanh điều hướng"
                  >
                    <Sliders size={18} />
                  </button>

                  {showModeMenu && (
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-slate-900 border border-emerald-500/30 shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-2 py-1.5 font-semibold text-slate-300 border-b border-slate-800 mb-1">
                        Chế độ Sidebar
                      </div>
                      <button
                        type="button"
                        onClick={() => setSidebarMode('hover-expand')}
                        className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition ${
                          mode === 'hover-expand'
                            ? 'bg-emerald-500/20 text-emerald-300 font-medium'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div>
                          <div>Tự mở khi di chuột</div>
                          <div className="text-[10px] text-slate-400 font-normal">Mặc định, tối ưu không gian</div>
                        </div>
                        {mode === 'hover-expand' && <span className="text-emerald-400 font-bold">✓</span>}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSidebarMode('expanded')}
                        className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition ${
                          mode === 'expanded'
                            ? 'bg-emerald-500/20 text-emerald-300 font-medium'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div>
                          <div>Luôn mở rộng (Rộng)</div>
                          <div className="text-[10px] text-slate-400 font-normal">Cố định 288px</div>
                        </div>
                        {mode === 'expanded' && <span className="text-emerald-400 font-bold">✓</span>}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSidebarMode('collapsed')}
                        className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition ${
                          (mode as string) === 'collapsed'
                            ? 'bg-emerald-500/20 text-emerald-300 font-medium'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div>
                          <div>Luôn thu gọn (Icon)</div>
                          <div className="text-[10px] text-slate-400 font-normal">Cố định 80px</div>
                        </div>
                        {(mode as string) === 'collapsed' && <span className="text-emerald-400 font-bold">✓</span>}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Close Button */}
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label="Đóng menu"
              >
                <X size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Tree Info Pill (When Expanded) */}
        {isExpanded && tree && (
          <div className="mx-3 my-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/20 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">Cây gia phả đang xem:</span>
              {renderRoleBadge(tree.userRole || 'OWNER')}
            </div>
            <div className="font-semibold text-sm text-slate-100 truncate">
              {tree.name}
            </div>
            {tree.branchName && (
              <div className="text-[11px] text-emerald-400/90 truncate">
                Chi/Nhánh: {tree.branchName}
              </div>
            )}
          </div>
        )}

        {/* Main Navigation List */}
        <nav className="flex-1 px-2.5 py-3 space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  if (item.onClick) {
                    item.onClick();
                  } else {
                    onSelectNav(item.key);
                  }
                  if (mobileOpen) setMobileOpen(false);
                }}
                className={`group relative w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 outline-none
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600/30 to-teal-600/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-950/40'
                      : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/60'
                  }
                `}
                title={!isExpanded ? item.label : undefined}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-400 rounded-r-full shadow-emerald-400 shadow-[0_0_8px]" />
                )}

                <div className={`flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  <Icon size={20} />
                </div>

                {isExpanded && (
                  <div className="flex-1 flex items-center justify-between overflow-hidden text-left whitespace-nowrap">
                    <span className="truncate">{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className={`ml-2 px-1.5 py-0.5 text-[10px] font-semibold rounded-full border ${
                          item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}

                {/* Tooltip on collapsed desktop */}
                {!isExpanded && (
                  <div className="hidden lg:group-hover:flex absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-900 text-slate-100 text-xs font-medium whitespace-nowrap border border-emerald-500/30 shadow-xl z-50 items-center gap-1.5 pointer-events-none animate-in fade-in zoom-in-95 duration-100">
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="px-1.5 py-0.2 text-[10px] rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Invitations Alert Banner in Sidebar (if any) */}
        {pendingInvitationsCount > 0 && (
          <div className="p-2.5 border-t border-emerald-500/15">
            <button
              type="button"
              onClick={() => {
                if (onOpenInvitations) onOpenInvitations();
                if (mobileOpen) setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition text-xs font-medium ${
                !isExpanded ? 'justify-center' : ''
              }`}
              title="Bạn có lời mời vào cây gia phả!"
            >
              <div className="relative">
                <Bell size={18} className="text-amber-400 animate-pulse" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500" />
              </div>
              {isExpanded && (
                <div className="flex-1 text-left truncate">
                  <div className="font-semibold">{pendingInvitationsCount} lời mời gia phả</div>
                  <div className="text-[10px] text-amber-200/80">Bấm để duyệt ngay</div>
                </div>
              )}
            </button>
          </div>
        )}

        {/* User Profile Card at Bottom */}
        <div className="p-2.5 border-t border-emerald-500/15 bg-slate-900/70">
          <div className={`flex items-center gap-3 ${!isExpanded ? 'justify-center' : ''}`}>
            {/* Avatar button */}
            <button
              type="button"
              onClick={onOpenProfile}
              className="relative flex-shrink-0 w-9 h-9 rounded-full bg-emerald-700/40 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-300 overflow-hidden hover:ring-2 hover:ring-emerald-400/80 transition cursor-pointer"
              title="Nhấn để xem & chỉnh sửa thông tin cá nhân"
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName || 'User'} className="w-full h-full object-cover" />
              ) : (
                <span>{(user?.fullName || user?.email || 'U').charAt(0).toUpperCase()}</span>
              )}
            </button>

            {/* User Info (when expanded) */}
            {isExpanded && (
              <button
                type="button"
                onClick={onOpenProfile}
                className="flex-1 min-w-0 text-left group transition cursor-pointer"
                title="Nhấn để xem & chỉnh sửa thông tin cá nhân"
              >
                <div className="font-semibold text-xs text-slate-200 group-hover:text-emerald-300 truncate">
                  {user?.fullName || 'Người dùng'}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-emerald-400 transition truncate mt-0.5">
                  <Phone size={11} className={user?.phone ? 'text-emerald-400' : 'text-amber-400'} />
                  <span className="truncate">
                    {user?.phone ? user.phone : 'Chỉnh sửa hồ sơ'}
                  </span>
                </div>
              </button>
            )}

            {/* Logout button */}
            {isExpanded && (
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                title="Đăng xuất"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area: offset margin adapts to sidebar mode */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${contentMarginClass}`}>
        {/* Optional Desktop Top Header Bar (if headerContent provided) */}
        {headerContent && (
          <header className="sticky top-0 z-30 w-full bg-[#0a111e]/90 backdrop-blur-md border-b border-emerald-500/20 px-4 py-2.5 shadow-md flex items-center justify-between">
            {headerContent}
          </header>
        )}

        {/* Viewport Children (Canvas / List / Modals) */}
        <main className="flex-1 relative flex flex-col min-h-0 w-full overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
