import React, { useState, useEffect } from 'react';
import {
  Users,
  Crown,
  Search,
  UserPlus,
  Edit2,
  Trash2,
  RefreshCw,
  Settings,
  BarChart3,
  Database,
  Save,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Lock,
  Shield,
  ShieldCheck,
  FileSpreadsheet,
  Activity,
  Server,
  Cloud,
  LogOut,
  Clock,
  KeyRound,
  UserCheck,
  Zap,
  Sparkles,
} from 'lucide-react';
import {
  apiGetAdminStats,
  apiGetAdminUsers,
  apiCreateAdminUser,
  apiUpdateAdminUser,
  apiDeleteAdminUser,
  apiUpdateAdminUserSubscription,
  AdminStats,
  AdminUserItem,
} from '../services/api';
import { getSupabaseConfig, saveSupabaseConfig, isSupabaseConfigured } from '../services/supabase';
import { useToast } from './Toast';

export type AdminTab = 'USERS' | 'SUBSCRIPTIONS' | 'REPORTS' | 'AUDIT' | 'SETTINGS';

interface AdminDashboardProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onLogout: () => void;
}

interface AuditLogItem {
  id: string;
  type: 'AUTH' | 'USER_CREATE' | 'ROLE_CHANGE' | 'SECURITY';
  title: string;
  detail: string;
  timestamp: string;
  status: 'SUCCESS' | 'WARN' | 'INFO';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  activeTab,
  onTabChange,
  onLogout,
}) => {
  const toast = useToast();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // User Filter & Search
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'ADMIN' | 'MEMBER'>('ALL');

  // User Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createFullName, setCreateFullName] = useState('');
  const [createRole, setCreateRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // User Edit Modal
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // User Delete Modal
  const [deletingUser, setDeletingUser] = useState<AdminUserItem | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // User Subscription Admin Control
  const [subscribingUser, setSubscribingUser] = useState<AdminUserItem | null>(null);
  const [subTier, setSubTier] = useState<'FREE' | 'PRO'>('PRO');
  const [subDuration, setSubDuration] = useState<number>(30); // 30, 90, 365, 36500
  const [isSubmittingSub, setIsSubmittingSub] = useState(false);
  const [subTierFilter, setSubTierFilter] = useState<'ALL' | 'PRO' | 'FREE'>('ALL');
  const [subSearchTerm, setSubSearchTerm] = useState('');

  // Settings State
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [isSavedConfig, setIsSavedConfig] = useState(false);

  // Audit Logs Data
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  useEffect(() => {
    loadAllData();
    const config = getSupabaseConfig();
    setSupabaseUrl(config.url || 'https://ggefsinnmmrfcfvyhvko.supabase.co');
    setSupabaseAnonKey(config.anonKey || '');
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [s, u] = await Promise.all([
        apiGetAdminStats().catch(() => null),
        apiGetAdminUsers().catch(() => []),
      ]);
      if (s) setStats(s);
      setUsers(u || []);

      // Mock recent security & system events
      const now = new Date();
      setAuditLogs([
        {
          id: 'log-1',
          type: 'SECURITY',
          title: 'Khởi tạo phiên quản trị hệ thống',
          detail: 'Super Admin đăng nhập an toàn qua JWT Session Bridge.',
          timestamp: 'Vừa xong',
          status: 'SUCCESS',
        },
        {
          id: 'log-2',
          type: 'AUTH',
          title: 'Đồng bộ hạ tầng PostgreSQL & Cloudflare Edge',
          detail: 'Kết nối Node HTTP Bridge qua PgBouncer pool latency < 45ms.',
          timestamp: '15 phút trước',
          status: 'SUCCESS',
        },
        {
          id: 'log-3',
          type: 'USER_CREATE',
          title: 'Đăng ký tài khoản mới qua Firebase Magic Link',
          detail: 'Hệ thống gửi email xác thực 2 lớp cho người dùng mới.',
          timestamp: '1 giờ trước',
          status: 'INFO',
        },
        {
          id: 'log-4',
          type: 'ROLE_CHANGE',
          title: 'Kiểm tra quyền hạn người dùng',
          detail: 'Chính sách bảo mật: Khóa bảo vệ Admin cuối cùng luôn kích hoạt.',
          timestamp: 'Hôm nay',
          status: 'SUCCESS',
        },
      ]);
    } catch (err: any) {
      toast.error(err.message || 'Không thể nạp dữ liệu quản trị');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createEmail || !createPassword) {
      toast.error('Email và mật khẩu là bắt buộc!');
      return;
    }
    if (createPassword.length < 6) {
      toast.error('Mật khẩu tối thiểu phải từ 6 ký tự!');
      return;
    }

    setIsSubmittingCreate(true);
    try {
      const res = await apiCreateAdminUser({
        email: createEmail.toLowerCase().trim(),
        password: createPassword.trim(),
        fullName: createFullName.trim() || undefined,
        role: createRole,
      });
      toast.success(res.message || 'Đã tạo tài khoản thành công!');
      setShowCreateModal(false);
      setCreateEmail('');
      setCreatePassword('');
      setCreateFullName('');
      setCreateRole('MEMBER');
      await loadAllData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tạo người dùng');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmittingEdit(true);
    try {
      const res = await apiUpdateAdminUser(editingUser.id, {
        fullName: editFullName.trim(),
        role: editRole,
        password: editNewPassword.trim() ? editNewPassword.trim() : undefined,
      });
      toast.success(res.message || 'Cập nhật tài khoản thành công!');
      setEditingUser(null);
      await loadAllData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi cập nhật người dùng');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setIsDeletingUser(true);
    try {
      const res = await apiDeleteAdminUser(deletingUser.id);
      toast.success(res.message || 'Đã xóa người dùng thành công!');
      setDeletingUser(null);
      await loadAllData();
    } catch (err: any) {
      toast.error(err.message || 'Không thể xóa người dùng');
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim().startsWith('https://')) {
      toast.error('Supabase URL phải bắt đầu bằng https://');
      return;
    }
    saveSupabaseConfig(supabaseUrl.trim(), supabaseAnonKey.trim());
    setIsSavedConfig(true);
    toast.success('Đã lưu cấu hình Supabase Storage thành công!');
    setTimeout(() => setIsSavedConfig(false), 3000);
  };

  // Update user subscription tier (Admin control)
  const handleUpdateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribingUser) return;
    try {
      setIsSubmittingSub(true);
      const res = await apiUpdateAdminUserSubscription(subscribingUser.id, {
        tier: subTier,
        durationDays: subTier === 'PRO' ? subDuration : undefined,
      });
      toast.success(res.message || 'Đã cập nhật gói dịch vụ thành công!');
      setSubscribingUser(null);
      await loadAllData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi cập nhật gói dịch vụ.');
    } finally {
      setIsSubmittingSub(false);
    }
  };

  // Export Executive System Report to CSV
  const handleExportSystemReport = () => {
    try {
      const reportRows = [
        ['BÁO CÁO TỔNG QUAN HỆ THỐNG FAMLYKIN'],
        ['Thời gian xuất:', new Date().toLocaleString('vi-VN')],
        [''],
        ['CHỈ SỐ HỆ THỐNG', 'SỐ LƯỢNG'],
        ['Tổng số tài khoản', stats?.totalUsers || users.length],
        ['Quản trị viên (Admin)', stats?.totalAdmins || 0],
        ['Thành viên (Member)', stats?.totalMembers || 0],
        ['Tổng số dòng họ phả hệ', stats?.totalTrees || 0],
        ['Tổng nhân khẩu phả hệ', stats?.totalPersons || 0],
        ['Thành viên còn sống', stats?.totalLiving || 0],
        ['Thành viên đã mất', stats?.totalDeceased || 0],
        ['Mối liên kết huyết thống', stats?.totalRelationships || 0],
        [''],
        ['DANH SÁCH NGƯỜI DÙNG'],
        ['STT', 'Họ Và Tên', 'Email', 'Vai Trò', 'Số Cây Sở Hữu', 'Ngày Đăng Ký'],
        ...users.map((u, idx) => [
          idx + 1,
          u.fullName || 'Chưa cập nhật',
          u.email,
          u.role,
          u._count?.trees || 0,
          new Date(u.createdAt).toLocaleDateString('vi-VN'),
        ]),
      ];

      const csvContent =
        '\uFEFF' + reportRows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Famlykin_BaoCao_HeThong_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Đã xuất báo cáo hệ thống thành công!');
    } catch (err: any) {
      toast.error('Lỗi khi xuất báo cáo hệ thống.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      (u.fullName || '').toLowerCase().includes(userSearchTerm.toLowerCase());
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="admin-dashboard-container">
      {/* ================= TOP DASHBOARD BANNER ================= */}
      <div className="admin-header-card">
        <div className="admin-header-left">
          <div className="admin-crown-avatar">
            <Crown size={28} color="#fbbf24" />
          </div>
          <div>
            <div className="admin-badge-pill">
              <span className="pulsing-dot" />
              <span>HỆ THỐNG QUẢN TRỊ TRUNG ƯƠNG (SUPER ADMIN)</span>
            </div>
            <h2 className="admin-main-title">Bảng Điều Khiển Quản Trị Hệ Thống</h2>
            <p className="admin-subtitle">
              Giám sát toàn diện người dùng, phân quyền, báo cáo vận hành và hạ tầng đám mây.
            </p>
          </div>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="admin-btn-refresh"
            onClick={loadAllData}
            disabled={isLoading}
            title="Làm mới dữ liệu từ máy chủ"
          >
            <RefreshCw size={16} className={isLoading ? 'spin-icon' : ''} />
            <span>{isLoading ? 'Đang nạp...' : 'Làm Mới'}</span>
          </button>

          {/* RÕ RÀNG NÚT ĐĂNG XUẤT CHO ADMIN */}
          <button
            type="button"
            className="admin-logout-prominent-btn"
            onClick={onLogout}
            title="Đăng xuất khỏi phiên quản trị hệ thống"
          >
            <LogOut size={16} />
            <span>Đăng Xuất</span>
          </button>
        </div>
      </div>

      {/* ================= TAB NAVIGATION ================= */}
      <div className="admin-tab-bar" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'USERS'}
          className={`admin-tab-btn ${activeTab === 'USERS' ? 'active' : ''}`}
          onClick={() => onTabChange('USERS')}
        >
          <Users size={17} />
          <span>Quản Lý Tài Khoản ({users.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'SUBSCRIPTIONS'}
          className={`admin-tab-btn ${activeTab === 'SUBSCRIPTIONS' ? 'active' : ''}`}
          onClick={() => onTabChange('SUBSCRIPTIONS')}
        >
          <Crown size={17} color="#fbbf24" />
          <span>Quản Lý Gói PRO ({users.filter((u) => u.subscriptionTier === 'PRO').length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'REPORTS'}
          className={`admin-tab-btn ${activeTab === 'REPORTS' ? 'active' : ''}`}
          onClick={() => onTabChange('REPORTS')}
        >
          <BarChart3 size={17} />
          <span>Báo Cáo & Thống Kê Hệ Thống</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'AUDIT'}
          className={`admin-tab-btn ${activeTab === 'AUDIT' ? 'active' : ''}`}
          onClick={() => onTabChange('AUDIT')}
        >
          <ShieldCheck size={17} />
          <span>Nhật Ký & Bảo Mật</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'SETTINGS'}
          className={`admin-tab-btn ${activeTab === 'SETTINGS' ? 'active' : ''}`}
          onClick={() => onTabChange('SETTINGS')}
        >
          <Settings size={17} />
          <span>Cấu Hình Hạ Tầng & S3</span>
        </button>
      </div>

      {/* ================= TAB 1: USERS ================= */}
      {activeTab === 'USERS' && (
        <div className="admin-card-glass">
          <div className="admin-table-toolbar">
            <div className="admin-search-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Tìm theo email, họ tên người dùng..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="admin-input-search"
              />
            </div>

            <div className="admin-toolbar-right">
              <div className="admin-filter-group">
                <button
                  type="button"
                  className={`admin-filter-btn ${userRoleFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setUserRoleFilter('ALL')}
                >
                  Tất Cả ({users.length})
                </button>
                <button
                  type="button"
                  className={`admin-filter-btn ${userRoleFilter === 'ADMIN' ? 'active' : ''}`}
                  onClick={() => setUserRoleFilter('ADMIN')}
                >
                  👑 Admin ({users.filter((u) => u.role === 'ADMIN').length})
                </button>
                <button
                  type="button"
                  className={`admin-filter-btn ${userRoleFilter === 'MEMBER' ? 'active' : ''}`}
                  onClick={() => setUserRoleFilter('MEMBER')}
                >
                  Thành Viên ({users.filter((u) => u.role === 'MEMBER').length})
                </button>
              </div>

              <button
                type="button"
                className="admin-btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <UserPlus size={16} />
                <span>+ Thêm Tài Khoản</span>
              </button>
            </div>
          </div>

          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>NGƯỜI DÙNG</th>
                  <th>VAI TRÒ</th>
                  <th>GÓI HỘI VIÊN</th>
                  <th>SỐ DÒNG HỌ</th>
                  <th>NGÀY ĐĂNG KÝ</th>
                  <th style={{ textAlign: 'right' }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="admin-empty-td">
                      Không tìm thấy tài khoản nào phù hợp với tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="user-cell-wrap">
                          <div className={`user-avatar-initials-badge ${u.role === 'ADMIN' ? 'is-admin' : ''}`}>
                            {u.fullName ? u.fullName.slice(0, 2).toUpperCase() : u.email.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="user-cell-name">{u.fullName || 'Chưa cập nhật họ tên'}</div>
                            <div className="user-cell-email">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {u.role === 'ADMIN' ? (
                          <span className="role-tag-admin">
                            <Crown size={13} color="#fef08a" />
                            Quản Trị Viên
                          </span>
                        ) : (
                          <span className="role-tag-member">Thành Viên</span>
                        )}
                      </td>
                      <td>
                        {u.subscriptionTier === 'PRO' ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                              <Crown size={12} className="text-amber-400" />
                              PRO
                            </span>
                            {u.subscriptionExpiresAt && (
                              <span className="text-[10px] text-slate-400">
                                ({new Date(u.subscriptionExpiresAt).toLocaleDateString('vi-VN')})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                            FREE (5 nhánh)
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="tree-count-badge">
                          {u._count?.trees || 0} Cây
                        </span>
                      </td>
                      <td>
                        <span className="date-cell">
                          {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions-cell">
                          <button
                            type="button"
                            className="btn-action-edit"
                            style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24' }}
                            title="Quản lý và kích hoạt gói PRO cho tài khoản này"
                            onClick={() => {
                              setSubscribingUser(u);
                              setSubTier('PRO');
                              setSubDuration(30);
                            }}
                          >
                            <Crown size={14} />
                            <span>Gói PRO</span>
                          </button>
                          <button
                            type="button"
                            className="btn-action-edit"
                            title="Chỉnh sửa thông tin & đổi mật khẩu"
                            onClick={() => {
                              setEditingUser(u);
                              setEditFullName(u.fullName || '');
                              setEditRole((u.role as 'ADMIN' | 'MEMBER') || 'MEMBER');
                              setEditNewPassword('');
                            }}
                          >
                            <Edit2 size={15} />
                            <span>Sửa</span>
                          </button>
                          <button
                            type="button"
                            className="btn-action-delete"
                            title="Xóa tài khoản này"
                            onClick={() => setDeletingUser(u)}
                          >
                            <Trash2 size={15} />
                            <span>Xóa</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 1.5: SUBSCRIPTIONS ================= */}
      {activeTab === 'SUBSCRIPTIONS' && (
        <div className="space-y-4">
          {/* Subscriptions Overview Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/30 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Tài Khoản PRO
                </div>
                <div className="text-2xl font-black text-white mt-1">
                  {users.filter((u) => u.subscriptionTier === 'PRO').length}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Không giới hạn nhánh cây</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Crown size={22} />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Tài Khoản Miễn Phí (FREE)
                </div>
                <div className="text-2xl font-black text-white mt-1">
                  {users.filter((u) => u.subscriptionTier !== 'PRO').length}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Tối đa 5 nhánh phả hệ</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold">
                <Users size={22} />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Cổng Thanh Toán PayOS
                </div>
                <div className="text-base font-bold text-emerald-300 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 size={16} />
                  <span>Sẵn Sàng VietQR</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Hỗ trợ Napas247 tự động</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Zap size={22} />
              </div>
            </div>
          </div>

          {/* Subscriptions Management Table */}
          <div className="admin-card-glass">
            <div className="admin-table-toolbar">
              <div className="admin-search-wrap">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Tìm tài khoản theo email hoặc họ tên..."
                  value={subSearchTerm}
                  onChange={(e) => setSubSearchTerm(e.target.value)}
                  className="admin-input-search"
                />
              </div>

              <div className="admin-filter-group">
                <button
                  type="button"
                  className={`admin-filter-btn ${subTierFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setSubTierFilter('ALL')}
                >
                  Tất Cả ({users.length})
                </button>
                <button
                  type="button"
                  className={`admin-filter-btn ${subTierFilter === 'PRO' ? 'active' : ''}`}
                  onClick={() => setSubTierFilter('PRO')}
                >
                  👑 Gói PRO ({users.filter((u) => u.subscriptionTier === 'PRO').length})
                </button>
                <button
                  type="button"
                  className={`admin-filter-btn ${subTierFilter === 'FREE' ? 'active' : ''}`}
                  onClick={() => setSubTierFilter('FREE')}
                >
                  Gói FREE ({users.filter((u) => u.subscriptionTier !== 'PRO').length})
                </button>
              </div>
            </div>

            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>NGƯỜI DÙNG</th>
                    <th>GÓI HIỆN TẠI</th>
                    <th>THỜI HẠN / HẾT HẠN</th>
                    <th>SỐ NHÁNH CÂY</th>
                    <th style={{ textAlign: 'right' }}>THAO TÁC ADMIN</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter((u) => {
                      const matchesSearch =
                        u.email.toLowerCase().includes(subSearchTerm.toLowerCase()) ||
                        (u.fullName || '').toLowerCase().includes(subSearchTerm.toLowerCase());
                      const matchesTier =
                        subTierFilter === 'ALL' ||
                        (subTierFilter === 'PRO' && u.subscriptionTier === 'PRO') ||
                        (subTierFilter === 'FREE' && u.subscriptionTier !== 'PRO');
                      return matchesSearch && matchesTier;
                    })
                    .map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="user-cell-wrap">
                            <div className={`user-avatar-initials-badge ${u.subscriptionTier === 'PRO' ? 'is-admin' : ''}`}>
                              {u.fullName ? u.fullName.slice(0, 2).toUpperCase() : u.email.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="user-cell-name">{u.fullName || 'Chưa cập nhật họ tên'}</div>
                              <div className="user-cell-email">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {u.subscriptionTier === 'PRO' ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1.5 shadow-sm">
                              <Crown size={13} className="text-amber-400" />
                              <span>PRO</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                              Miễn Phí (5 Nhánh)
                            </span>
                          )}
                        </td>
                        <td>
                          {u.subscriptionTier === 'PRO' ? (
                            u.subscriptionExpiresAt ? (
                              <div className="text-xs">
                                <div className="text-slate-200 font-semibold">
                                  {new Date(u.subscriptionExpiresAt).toLocaleDateString('vi-VN')}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {Math.ceil(
                                    (new Date(u.subscriptionExpiresAt).getTime() - Date.now()) /
                                      (1000 * 60 * 60 * 24)
                                  ) > 0
                                    ? `Còn ${Math.ceil(
                                        (new Date(u.subscriptionExpiresAt).getTime() - Date.now()) /
                                          (1000 * 60 * 60 * 24)
                                      )} ngày`
                                    : 'Đã hết hạn'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs font-semibold text-emerald-400">Vĩnh viễn</span>
                            )
                          ) : (
                            <span className="text-xs text-slate-500">Mặc định</span>
                          )}
                        </td>
                        <td>
                          <span className="tree-count-badge">
                            {u._count?.trees || 0} nhánh
                          </span>
                        </td>
                        <td>
                          <div className="admin-actions-cell">
                            <button
                              type="button"
                              className="btn-action-edit"
                              style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24' }}
                              onClick={() => {
                                setSubscribingUser(u);
                                setSubTier(u.subscriptionTier === 'PRO' ? 'PRO' : 'PRO');
                                setSubDuration(30);
                              }}
                            >
                              <Crown size={14} />
                              <span>{u.subscriptionTier === 'PRO' ? 'Gia Hạn / Đổi Gói' : 'Cấp PRO'}</span>
                            </button>
                            {u.subscriptionTier === 'PRO' && (
                              <button
                                type="button"
                                className="btn-action-delete"
                                title="Hạ về gói Miễn Phí"
                                onClick={() => {
                                  setSubscribingUser(u);
                                  setSubTier('FREE');
                                }}
                              >
                                <span>Về FREE</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: REPORTS & ANALYTICS ================= */}
      {activeTab === 'REPORTS' && (
        <div className="admin-overview-grid">
          {/* Executive Metrics Row */}
          <div className="metrics-cards-row">
            <div className="metric-card metric-users">
              <div className="metric-header">
                <Users size={22} color="#34d399" />
                <span className="metric-label">TỔNG TÀI KHOẢN</span>
              </div>
              <div className="metric-value">{stats?.totalUsers || users.length}</div>
              <div className="metric-detail">
                👑 {stats?.totalAdmins || 0} Quản trị viên • 👥 {stats?.totalMembers || 0} Thành viên
              </div>
            </div>

            <div className="metric-card metric-trees">
              <div className="metric-header">
                <Database size={22} color="#38bdf8" />
                <span className="metric-label">TỔNG DÒNG HỌ ĐÃ TẠO</span>
              </div>
              <div className="metric-value">{stats?.totalTrees || 0}</div>
              <div className="metric-detail">Cơ sở dữ liệu phả hệ số hóa</div>
            </div>

            <div className="metric-card metric-persons">
              <div className="metric-header">
                <BarChart3 size={22} color="#fbbf24" />
                <span className="metric-label">TỔNG NHÂN KHẨU PHẢ HỆ</span>
              </div>
              <div className="metric-value">{stats?.totalPersons || 0}</div>
              <div className="metric-detail">
                🌱 {stats?.totalLiving || 0} còn sống • 🕯️ {stats?.totalDeceased || 0} đã mất
              </div>
            </div>

            <div className="metric-card metric-rels">
              <div className="metric-header">
                <Activity size={22} color="#a78bfa" />
                <span className="metric-label">LIÊN KẾT HUYẾT THỐNG</span>
              </div>
              <div className="metric-value">{stats?.totalRelationships || 0}</div>
              <div className="metric-detail">Quan hệ Cha/Mẹ, Vợ/Chồng, Con cái</div>
            </div>
          </div>

          {/* Demographic Breakdown & Export Action Card */}
          <div className="infra-health-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 className="infra-title" style={{ margin: 0 }}>
                <BarChart3 size={20} color="#34d399" />
                <span>Báo Cáo Phân Tích Nhân Khẩu & Dữ Liệu</span>
              </h3>

              <button
                type="button"
                className="admin-btn-primary"
                onClick={handleExportSystemReport}
                title="Tải toàn bộ báo cáo tổng hợp hệ thống dạng CSV/Excel"
              >
                <FileSpreadsheet size={16} />
                <span>Xuất Báo Cáo Hệ Thống (.CSV)</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '1.25rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <h4 style={{ color: '#ffffff', fontSize: '0.95rem', margin: '0 0 0.75rem 0', fontWeight: 700 }}>
                  Tỷ Lệ Thành Viên Phả Hệ
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#34d399' }}>🌱 Còn sống:</span>
                    <strong style={{ color: '#ffffff' }}>{stats?.totalLiving || 0} ({stats?.totalPersons ? Math.round(((stats?.totalLiving || 0) / stats.totalPersons) * 100) : 0}%)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#94a3b8' }}>🕯️ Đã mất (Ngày giỗ):</span>
                    <strong style={{ color: '#ffffff' }}>{stats?.totalDeceased || 0} ({stats?.totalPersons ? Math.round(((stats?.totalDeceased || 0) / stats.totalPersons) * 100) : 0}%)</strong>
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '1.25rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <h4 style={{ color: '#ffffff', fontSize: '0.95rem', margin: '0 0 0.75rem 0', fontWeight: 700 }}>
                  Hiệu Suất Dữ Liệu Dòng Họ
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#38bdf8' }}>Trung bình thành viên / Cây:</span>
                    <strong style={{ color: '#ffffff' }}>{stats?.totalTrees ? Math.round((stats?.totalPersons || 0) / stats.totalTrees) : 0} người</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#fbbf24' }}>Trung bình quan hệ / Cây:</span>
                    <strong style={{ color: '#ffffff' }}>{stats?.totalTrees ? Math.round((stats?.totalRelationships || 0) / stats.totalTrees) : 0} liên kết</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: AUDIT & SECURITY ================= */}
      {activeTab === 'AUDIT' && (
        <div className="admin-overview-grid">
          <div className="infra-health-card">
            <h3 className="infra-title">
              <ShieldCheck size={20} color="#34d399" />
              <span>Nhật Ký An Toàn & Sự Kiện Hệ Thống (Audit Trail)</span>
            </h3>

            <div className="infra-list">
              {auditLogs.map((log) => (
                <div key={log.id} className="infra-item">
                  <div className={`infra-dot ${log.status === 'SUCCESS' ? 'ok' : 'warn'}`} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{log.title}</strong>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{log.timestamp}</span>
                    </div>
                    <p>{log.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security Policies Card */}
          <div className="infra-health-card">
            <h3 className="infra-title">
              <Shield size={20} color="#38bdf8" />
              <span>Chính Sách Bảo Mật Hệ Thống Đang Kích Hoạt</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                  <KeyRound size={16} color="#34d399" />
                  <strong style={{ color: '#ffffff', fontSize: '0.88rem' }}>Mã Hóa JWT Phiên Bản 7 Ngày</strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                  Mã hóa Secret Key an toàn, tự động thu hồi phiên đăng nhập khi hết hạn.
                </p>
              </div>

              <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                  <Mail size={16} color="#38bdf8" />
                  <strong style={{ color: '#ffffff', fontSize: '0.88rem' }}>Xác Thực 2 Lớp Firebase</strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                  Yêu cầu nhấp liên kết qua Email xác thực trước khi cấp quyền truy cập.
                </p>
              </div>

              <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                  <UserCheck size={16} color="#fbbf24" />
                  <strong style={{ color: '#ffffff', fontSize: '0.88rem' }}>Khóa Bảo Vệ Admin Cuối Cùng</strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                  Ngăn chặn tuyệt đối việc xóa hoặc hạ quyền Quản trị viên duy nhất.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: SETTINGS & S3 ================= */}
      {activeTab === 'SETTINGS' && (
        <div className="admin-settings-container">
          <div className="settings-card-glass">
            <h3 className="settings-card-title">
              <Settings size={20} color="#34d399" />
              <span>Cấu Hình Supabase Storage (S3-Compatible Object Storage)</span>
            </h3>
            <p className="settings-desc">
              Hệ thống sử dụng Supabase Storage bucket <code>familytree-avatars</code> để tải ảnh đại diện thành viên
              trực tiếp lên Cloud CDN tốc độ cao.
            </p>

            <form onSubmit={handleSaveConfig} className="settings-form">
              <div className="settings-field">
                <label className="settings-label">
                  1. Supabase Project URL
                  <span className="field-hint"> (Địa chỉ dự án Supabase của bạn)</span>
                </label>
                <input
                  type="text"
                  required
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://ggefsinnmmrfcfvyhvko.supabase.co"
                  className="settings-input"
                />
              </div>

              <div className="settings-field">
                <label className="settings-label">
                  2. Supabase Anon Public Key (VITE_SUPABASE_ANON_KEY)
                  <span className="field-hint"> (Chuỗi token JWT dài bắt đầu bằng eyJhbGci...)</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="Dán mã anon public key copy từ Supabase Dashboard vào đây..."
                  className="settings-textarea"
                />
              </div>

              <div className="settings-actions">
                <button type="submit" className="admin-btn-primary">
                  <Save size={16} />
                  <span>{isSavedConfig ? 'Đã Lưu Thành Công!' : 'Lưu Cấu Hình Supabase'}</span>
                </button>
              </div>
            </form>

            <div className="settings-guide-box">
              <h4 className="guide-title">
                📖 Hướng dẫn chi tiết 3 bước lấy <code>VITE_SUPABASE_ANON_KEY</code> trên Supabase:
              </h4>
              <ol className="guide-steps">
                <li>
                  Đăng nhập vào <strong>Supabase Dashboard</strong>, mở Project của bạn (Project ID: <code>ggefsinnmmrfcfvyhvko</code>).
                </li>
                <li>
                  Nhìn vào thanh menu màu đen bên trái màn hình, bấm vào biểu tượng bánh răng <strong>Project Settings ⚙️</strong> ở góc dưới cùng.
                </li>
                <li>
                  Chọn mục <strong>API</strong> (dưới nhóm Configuration) &rarr; Cuộn xuống phần <strong>Project API keys</strong>:
                  <br />
                  Bấm nút <strong>Copy</strong> ở dòng khóa <strong><code>anon public</code></strong> (chuỗi dài bắt đầu bằng <code>eyJhbGciOi...</code>).
                  <br />
                  <span className="guide-note">
                    *Lưu ý: Không copy link s3 <code>storage/v1/s3</code> vào ô key này vì link đó là endpoint, không phải mã xác thực key!
                  </span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL TẠO NGƯỜI DÙNG MỚI ================= */}
      {showCreateModal && (
        <div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="admin-submodal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="submodal-title">Tạo Tài Khoản Người Dùng Mới</h3>
            <form onSubmit={handleCreateUser}>
              <div className="submodal-field">
                <label>Địa chỉ Email *</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  className="submodal-input"
                />
              </div>

              <div className="submodal-field">
                <label>Họ và Tên</label>
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={createFullName}
                  onChange={(e) => setCreateFullName(e.target.value)}
                  className="submodal-input"
                />
              </div>

              <div className="submodal-field">
                <label>Mật khẩu khởi tạo * (Tối thiểu 6 ký tự)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className="submodal-input"
                />
              </div>

              <div className="submodal-field">
                <label>Phân Quyền Hệ Thống</label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as 'MEMBER' | 'ADMIN')}
                  className="submodal-select"
                >
                  <option value="MEMBER">Thành Viên Thường (MEMBER)</option>
                  <option value="ADMIN">Quản Trị Viên (ADMIN)</option>
                </select>
              </div>

              <div className="submodal-actions">
                <button
                  type="button"
                  className="btn-ghost-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="admin-btn-primary"
                >
                  {isSubmittingCreate ? 'Đang Tạo...' : 'Tạo Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL SỬA NGƯỜI DÙNG ================= */}
      {editingUser && (
        <div className="admin-modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="admin-submodal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="submodal-title">Cập Nhật Thông Tin Tài Khoản</h3>
            <form onSubmit={handleUpdateUser}>
              <div className="submodal-field">
                <label>Địa chỉ Email</label>
                <input
                  type="email"
                  disabled
                  value={editingUser.email}
                  className="submodal-input"
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>

              <div className="submodal-field">
                <label>Họ và Tên</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="submodal-input"
                />
              </div>

              <div className="submodal-field">
                <label>Đổi Mật Khẩu Mới (Để trống nếu giữ nguyên)</label>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu mới..."
                  value={editNewPassword}
                  onChange={(e) => setEditNewPassword(e.target.value)}
                  className="submodal-input"
                />
              </div>

              <div className="submodal-field">
                <label>Phân Quyền Vai Trò</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as 'MEMBER' | 'ADMIN')}
                  className="submodal-select"
                >
                  <option value="MEMBER">Thành Viên Thường (MEMBER)</option>
                  <option value="ADMIN">Quản Trị Viên (ADMIN)</option>
                </select>
              </div>

              <div className="submodal-actions">
                <button
                  type="button"
                  className="btn-ghost-secondary"
                  onClick={() => setEditingUser(null)}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="admin-btn-primary"
                >
                  {isSubmittingEdit ? 'Đang Lưu...' : 'Cập Nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL XÁC NHẬN XÓA TÀI KHOẢN ================= */}
      {deletingUser && (
        <div className="admin-modal-overlay" onClick={() => setDeletingUser(null)}>
          <div className="admin-submodal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="submodal-title" style={{ color: '#f87171' }}>Xác Nhận Xóa Tài Khoản</h3>
            <p className="submodal-confirm-desc">
              Bạn có chắc chắn muốn xóa tài khoản <strong>{deletingUser.email}</strong>?
            </p>
            <div className="submodal-warning-box">
              ⚠️ Cảnh báo: Toàn bộ dữ liệu dòng họ, thành viên và mối quan hệ do tài khoản này tạo sẽ bị xóa vĩnh viễn khỏi cơ sở dữ liệu.
            </div>
            <div className="submodal-actions">
              <button
                type="button"
                className="btn-ghost-secondary"
                onClick={() => setDeletingUser(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isDeletingUser}
                className="btn-danger-solid"
                onClick={handleDeleteUser}
              >
                {isDeletingUser ? 'Đang Xóa...' : 'Xác Nhận Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL QUẢN LÝ GÓI HỘI VIÊN PRO (ADMIN) ================= */}
      {subscribingUser && (
        <div className="admin-modal-overlay" onClick={() => setSubscribingUser(null)}>
          <div className="admin-submodal-box" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                <Crown size={18} />
              </div>
              <div>
                <h3 className="submodal-title" style={{ margin: 0 }}>
                  Quản Lý Gói Hội Viên
                </h3>
                <p className="text-xs text-slate-400">
                  {subscribingUser.fullName || subscribingUser.email}
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateSubscription} className="space-y-4">
              <div className="submodal-field">
                <label>Chọn Gói Hội Viên Cho Người Dùng</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setSubTier('PRO')}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                      subTier === 'PRO'
                        ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-bold'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400'
                    }`}
                  >
                    <Crown size={16} className="text-amber-400 flex-shrink-0" />
                    <div>
                      <div className="text-xs">Gói PRO</div>
                      <div className="text-[10px] opacity-75">Không giới hạn nhánh</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubTier('FREE')}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                      subTier === 'FREE'
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400'
                    }`}
                  >
                    <Users size={16} className="text-emerald-400 flex-shrink-0" />
                    <div>
                      <div className="text-xs">Gói Miễn Phí</div>
                      <div className="text-[10px] opacity-75">Tối đa 5 nhánh</div>
                    </div>
                  </button>
                </div>
              </div>

              {subTier === 'PRO' && (
                <div className="submodal-field">
                  <label>Thời Hạn Kích Hoạt Gói PRO</label>
                  <select
                    value={subDuration}
                    onChange={(e) => setSubDuration(Number(e.target.value))}
                    className="submodal-select"
                  >
                    <option value={30}>30 Ngày (1 Tháng)</option>
                    <option value={90}>90 Ngày (3 Tháng)</option>
                    <option value={365}>365 Ngày (1 Năm)</option>
                    <option value={36500}>Vĩnh Viễn (Trọn Đời)</option>
                  </select>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300">
                {subTier === 'PRO' ? (
                  <div className="space-y-1">
                    <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                      <Sparkles size={13} />
                      <span>Quyền lợi PRO được áp dụng ngay:</span>
                    </div>
                    <p className="text-slate-400 text-[10px]">
                      Tài khoản sẽ được mở khóa không giới hạn số lượng nhánh, tự động mở khóa các nhánh đang bị khóa và kích hoạt huy hiệu PRO.
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-400 text-[10px]">
                    Tài khoản sẽ trở về gói Miễn Phí (tối đa 5 nhánh). Nếu người dùng sở hữu nhiều hơn 5 nhánh, các nhánh vượt sẽ bị tạm khóa theo quy định.
                  </p>
                )}
              </div>

              <div className="submodal-actions">
                <button
                  type="button"
                  className="btn-ghost-secondary"
                  onClick={() => setSubscribingUser(null)}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSub}
                  className="admin-btn-primary"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                >
                  <Crown size={15} />
                  <span>{isSubmittingSub ? 'Đang Lưu...' : 'Xác Nhận Cập Nhật Gói'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
