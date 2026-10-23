import React, { useState, useEffect } from 'react';
import {
  Users,
  Crown,
  Search,
  UserPlus,
  Edit2,
  Trash2,
  RefreshCw,
  FolderTree,
  Eye,
  Settings,
  BarChart3,
  Database,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Lock,
} from 'lucide-react';
import {
  apiGetAdminStats,
  apiGetAdminUsers,
  apiGetAdminTrees,
  apiCreateAdminUser,
  apiUpdateAdminUser,
  apiDeleteAdminUser,
  apiDeleteTree,
  AdminStats,
  AdminUserItem,
  AdminTreeItem,
} from '../services/api';
import { getSupabaseConfig, saveSupabaseConfig, isSupabaseConfigured } from '../services/supabase';
import { useToast } from './Toast';

export type AdminTab = 'USERS' | 'TREES' | 'OVERVIEW' | 'SETTINGS';

interface AdminDashboardProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onPreviewTree: (treeId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  activeTab,
  onTabChange,
  onPreviewTree,
}) => {
  const toast = useToast();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [trees, setTrees] = useState<AdminTreeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter & Search states
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'ADMIN' | 'MEMBER'>('ALL');
  const [treeSearchTerm, setTreeSearchTerm] = useState('');

  // User Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createFullName, setCreateFullName] = useState('');
  const [createRole, setCreateRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const [deletingUser, setDeletingUser] = useState<AdminUserItem | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Tree Delete state
  const [deletingTree, setDeletingTree] = useState<AdminTreeItem | null>(null);
  const [isDeletingTree, setIsDeletingTree] = useState(false);

  // Settings State
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [isSavedConfig, setIsSavedConfig] = useState(false);

  useEffect(() => {
    loadAllData();
    const config = getSupabaseConfig();
    setSupabaseUrl(config.url || 'https://ggefsinnmmrfcfvyhvko.supabase.co');
    setSupabaseAnonKey(config.anonKey || '');
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [s, u, t] = await Promise.all([
        apiGetAdminStats().catch(() => null),
        apiGetAdminUsers().catch(() => []),
        apiGetAdminTrees().catch(() => []),
      ]);
      if (s) setStats(s);
      setUsers(u || []);
      setTrees(t || []);
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

  const handleDeleteTree = async () => {
    if (!deletingTree) return;
    setIsDeletingTree(true);
    try {
      const res = await apiDeleteTree(deletingTree.id);
      toast.success(res.message || 'Đã xóa cây gia phả thành công!');
      setDeletingTree(null);
      await loadAllData();
    } catch (err: any) {
      toast.error(err.message || 'Không thể xóa cây gia phả');
    } finally {
      setIsDeletingTree(false);
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

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      (u.fullName || '').toLowerCase().includes(userSearchTerm.toLowerCase());
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredTrees = trees.filter((t) => {
    const term = treeSearchTerm.toLowerCase();
    const matchesName = t.name.toLowerCase().includes(term);
    const matchesBranch = (t.branchName || '').toLowerCase().includes(term);
    const matchesOwner = (t.owner?.fullName || t.owner?.email || '').toLowerCase().includes(term);
    return matchesName || matchesBranch || matchesOwner;
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
              <span>HỆ THỐNG QUẢN TRỊ TRUNG ƯƠNG</span>
            </div>
            <h2 className="admin-main-title">Bảng Điều Khiển Quản Trị Viên</h2>
            <p className="admin-subtitle">
              Giám sát toàn diện người dùng, cây phả hệ, dữ liệu và hạ tầng lưu trữ đám mây.
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
          aria-selected={activeTab === 'TREES'}
          className={`admin-tab-btn ${activeTab === 'TREES' ? 'active' : ''}`}
          onClick={() => onTabChange('TREES')}
        >
          <FolderTree size={17} />
          <span>Cây Gia Phả Hệ Thống ({trees.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'OVERVIEW'}
          className={`admin-tab-btn ${activeTab === 'OVERVIEW' ? 'active' : ''}`}
          onClick={() => onTabChange('OVERVIEW')}
        >
          <BarChart3 size={17} />
          <span>Thống Kê Tổng Quan</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'SETTINGS'}
          className={`admin-tab-btn ${activeTab === 'SETTINGS' ? 'active' : ''}`}
          onClick={() => onTabChange('SETTINGS')}
        >
          <Settings size={17} />
          <span>Cấu Hình & Lưu Trữ S3</span>
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
                <span>+ Thêm Người Dùng</span>
              </button>
            </div>
          </div>

          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>NGƯỜI DÙNG</th>
                  <th>VAI TRÒ</th>
                  <th>CÂY PHẢ HỆ</th>
                  <th>NGÀY TẠO</th>
                  <th style={{ textAlign: 'right' }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-empty-td">
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

      {/* ================= TAB 2: TREES ================= */}
      {activeTab === 'TREES' && (
        <div className="admin-card-glass">
          <div className="admin-table-toolbar">
            <div className="admin-search-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Tìm kiếm cây phả hệ, tên dòng họ, chủ sở hữu..."
                value={treeSearchTerm}
                onChange={(e) => setTreeSearchTerm(e.target.value)}
                className="admin-input-search"
              />
            </div>
            <div className="admin-tree-total-info">
              Tổng số: <strong>{trees.length}</strong> dòng họ trong hệ thống
            </div>
          </div>

          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>TÊN CÂY GIA PHẢ</th>
                  <th>CHI / NHÁNH</th>
                  <th>CHỦ SỞ HỮU</th>
                  <th>QUY MÔ DÒNG HỌ</th>
                  <th>NGÀY TẠO</th>
                  <th style={{ textAlign: 'right' }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="admin-empty-td">
                      Không tìm thấy cây gia phả nào.
                    </td>
                  </tr>
                ) : (
                  filteredTrees.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div className="tree-name-cell">
                          <FolderTree size={18} color="#34d399" />
                          <div>
                            <div className="tree-title-bold">{t.name}</div>
                            <div className="tree-id-small">ID: {t.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="branch-tag">{t.branchName || 'Đại Tôn'}</span>
                      </td>
                      <td>
                        <div className="owner-info-cell">
                          <div className="owner-name">{t.owner?.fullName || 'Không rõ'}</div>
                          <div className="owner-email">{t.owner?.email || 'Chưa liên kết'}</div>
                        </div>
                      </td>
                      <td>
                        <div className="scale-info-cell">
                          <span>{t._count?.members || 0} thành viên</span>
                          <span className="dot-sep">•</span>
                          <span>{t._count?.relationships || 0} quan hệ</span>
                        </div>
                      </td>
                      <td>
                        <span className="date-cell">
                          {new Date(t.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions-cell">
                          <button
                            type="button"
                            className="btn-action-preview"
                            title="Xem chi tiết cây gia phả này"
                            onClick={() => onPreviewTree(t.id)}
                          >
                            <Eye size={15} />
                            <span>Xem Cây</span>
                          </button>
                          <button
                            type="button"
                            className="btn-action-delete"
                            title="Xóa cây gia phả này khỏi hệ thống"
                            onClick={() => setDeletingTree(t)}
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

      {/* ================= TAB 3: OVERVIEW & STATS ================= */}
      {activeTab === 'OVERVIEW' && (
        <div className="admin-overview-grid">
          {/* Metrics Row */}
          <div className="metrics-cards-row">
            <div className="metric-card metric-users">
              <div className="metric-header">
                <Users size={22} color="#34d399" />
                <span className="metric-label">TỔNG NGƯỜI DÙNG</span>
              </div>
              <div className="metric-value">{stats?.totalUsers || users.length}</div>
              <div className="metric-detail">
                👑 {stats?.totalAdmins || 0} Admin • 👥 {stats?.totalMembers || 0} Thành viên
              </div>
            </div>

            <div className="metric-card metric-trees">
              <div className="metric-header">
                <FolderTree size={22} color="#38bdf8" />
                <span className="metric-label">TỔNG DÒNG HỌ</span>
              </div>
              <div className="metric-value">{stats?.totalTrees || trees.length}</div>
              <div className="metric-detail">Cây phả hệ số hoạt động độc lập</div>
            </div>

            <div className="metric-card metric-persons">
              <div className="metric-header">
                <BarChart3 size={22} color="#fbbf24" />
                <span className="metric-label">THÀNH VIÊN PHẢ HỆ</span>
              </div>
              <div className="metric-value">{stats?.totalPersons || 0}</div>
              <div className="metric-detail">
                🌱 {stats?.totalLiving || 0} còn sống • 🕯️ {stats?.totalDeceased || 0} đã mất
              </div>
            </div>

            <div className="metric-card metric-rels">
              <div className="metric-header">
                <Database size={22} color="#a78bfa" />
                <span className="metric-label">LIÊN KẾT HUYẾT THỐNG</span>
              </div>
              <div className="metric-value">{stats?.totalRelationships || 0}</div>
              <div className="metric-detail">Quan hệ Cha/Mẹ, Vợ/Chồng, Con cái</div>
            </div>
          </div>

          {/* Infrastructure Health Card */}
          <div className="infra-health-card">
            <h3 className="infra-title">
              <CheckCircle2 size={19} color="#34d399" />
              <span>Trạng Thái Hạ Tầng & Dịch Vụ Đám Mây</span>
            </h3>
            <div className="infra-list">
              <div className="infra-item">
                <div className="infra-dot ok" />
                <div>
                  <strong>Cơ Sở Dữ Liệu PostgreSQL (Supabase Connection Pool)</strong>
                  <p>Hoạt động ổn định qua Node HTTP Bridge + Prisma Client request-scoped an toàn.</p>
                </div>
              </div>
              <div className="infra-item">
                <div className="infra-dot ok" />
                <div>
                  <strong>Edge Computing (Cloudflare Workers & Pages)</strong>
                  <p>Tự động scale toàn cầu, độ trễ thấp &lt; 50ms, chống DDoS tự động.</p>
                </div>
              </div>
              <div className="infra-item">
                <div className="infra-dot ok" />
                <div>
                  <strong>Xác Thực Người Dùng (JWT + Firebase Magic Link)</strong>
                  <p>Mã hóa chuẩn công nghiệp, xác thực 2 lớp qua liên kết email an toàn.</p>
                </div>
              </div>
              <div className="infra-item">
                <div className={`infra-dot ${isSupabaseConfigured() ? 'ok' : 'warn'}`} />
                <div>
                  <strong>Lưu Trữ Ảnh S3 (Supabase Storage: familytree-avatars)</strong>
                  <p>
                    {isSupabaseConfigured()
                      ? 'Đã kết nối Supabase Storage bucket familytree-avatars.'
                      : 'Chưa điền Anon Key trong mục Cấu Hình. Vui lòng cập nhật bên tab Cấu Hình S3.'}
                  </p>
                </div>
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
                <label>Vai trò hệ thống</label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as 'MEMBER' | 'ADMIN')}
                  className="submodal-select"
                >
                  <option value="MEMBER">Thành viên thông thường (MEMBER)</option>
                  <option value="ADMIN">Quản trị viên hệ thống (ADMIN)</option>
                </select>
              </div>

              <div className="submodal-btn-row">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowCreateModal(false)}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="admin-btn-primary"
                >
                  {isSubmittingCreate ? 'Đang tạo...' : 'Tạo Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL CHỈNH SỬA NGƯỜI DÙNG ================= */}
      {editingUser && (
        <div className="admin-modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="admin-submodal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="submodal-title">Chỉnh Sửa Tài Khoản: {editingUser.email}</h3>
            <form onSubmit={handleUpdateUser}>
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
                <label>Vai trò hệ thống</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as 'MEMBER' | 'ADMIN')}
                  className="submodal-select"
                >
                  <option value="MEMBER">Thành viên thông thường (MEMBER)</option>
                  <option value="ADMIN">Quản trị viên hệ thống (ADMIN)</option>
                </select>
              </div>

              <div className="submodal-field">
                <label>Đặt lại Mật khẩu mới (Bỏ trống nếu giữ nguyên)</label>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu mới nếu muốn đổi..."
                  value={editNewPassword}
                  onChange={(e) => setEditNewPassword(e.target.value)}
                  className="submodal-input"
                />
              </div>

              <div className="submodal-btn-row">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setEditingUser(null)}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="admin-btn-primary"
                >
                  {isSubmittingEdit ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL XÁC NHẬN XÓA USER ================= */}
      {deletingUser && (
        <div className="admin-modal-overlay" onClick={() => setDeletingUser(null)}>
          <div className="admin-submodal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
              <AlertTriangle size={36} color="#ef4444" style={{ margin: '0 auto 0.5rem auto' }} />
              <h3 className="submodal-title" style={{ color: '#fca5a5' }}>
                Xác Nhận Xóa Tài Khoản?
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.5 }}>
                Bạn có chắc chắn muốn xóa tài khoản <strong>{deletingUser.email}</strong>?
                <br />
                Mọi cây phả hệ thuộc sở hữu của tài khoản này sẽ bị xóa theo. Hành động này không thể hoàn tác!
              </p>
            </div>
            <div className="submodal-btn-row">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setDeletingUser(null)}
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={handleDeleteUser}
                className="btn-danger-confirm"
              >
                {isDeletingUser ? 'Đang xóa...' : 'Xác Nhận Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL XÁC NHẬN XÓA CÂY PHẢ HỆ ================= */}
      {deletingTree && (
        <div className="admin-modal-overlay" onClick={() => setDeletingTree(null)}>
          <div className="admin-submodal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
              <AlertTriangle size={36} color="#ef4444" style={{ margin: '0 auto 0.5rem auto' }} />
              <h3 className="submodal-title" style={{ color: '#fca5a5' }}>
                Xác Nhận Xóa Cây Phả Hệ?
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.5 }}>
                Bạn có chắc muốn xóa cây <strong>"{deletingTree.name}"</strong>?
                <br />
                Toàn bộ dữ liệu thành viên và liên kết trong cây này sẽ bị xóa khỏi cơ sở dữ liệu.
              </p>
            </div>
            <div className="submodal-btn-row">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setDeletingTree(null)}
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                disabled={isDeletingTree}
                onClick={handleDeleteTree}
                className="btn-danger-confirm"
              >
                {isDeletingTree ? 'Đang xóa...' : 'Xác Nhận Xóa Cây'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
