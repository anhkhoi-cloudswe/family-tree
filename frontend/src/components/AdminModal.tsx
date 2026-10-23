import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Users,
  Crown,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Mail,
  Lock,
  UserPlus,
  Edit2,
  Trash2,
  Search,
  AlertTriangle,
} from 'lucide-react';
import {
  apiGetAdminStats,
  apiGetAdminUsers,
  apiCreateAdminUser,
  apiUpdateAdminUser,
  apiDeleteAdminUser,
  apiUpdateAdminUserRole,
  AdminStats,
  AdminUserItem,
} from '../services/api';
import { useToast } from './Toast';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'USERS' | 'OVERVIEW'>('USERS');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'MEMBER'>('ALL');

  // Modal Create User state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createFullName, setCreateFullName] = useState('');
  const [createRole, setCreateRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Modal Edit User state
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Modal Delete User state
  const [deletingUser, setDeletingUser] = useState<AdminUserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAdminData();
    }
  }, [isOpen]);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [s, u] = await Promise.all([
        apiGetAdminStats(),
        apiGetAdminUsers(),
      ]);
      setStats(s);
      setUsers(u);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải dữ liệu quản trị');
    } finally {
      setIsLoading(false);
    }
  };

  // Tạo người dùng mới
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createEmail || !createPassword) {
      toast.error('Email và mật khẩu là bắt buộc!');
      return;
    }
    if (createPassword.length < 6) {
      toast.error('Mật khẩu tối thiểu phải 6 ký tự!');
      return;
    }

    setIsSubmittingCreate(true);
    try {
      const res = await apiCreateAdminUser({
        email: createEmail.toLowerCase().trim(),
        password: createPassword,
        fullName: createFullName.trim(),
        role: createRole,
      });
      toast.success(res.message || 'Đã tạo tài khoản thành công!');
      setShowCreateModal(false);
      setCreateEmail('');
      setCreatePassword('');
      setCreateFullName('');
      setCreateRole('MEMBER');
      await loadAdminData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi tạo tài khoản');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Mở modal sửa người dùng
  const handleOpenEdit = (user: AdminUserItem) => {
    setEditingUser(user);
    setEditFullName(user.fullName || '');
    setEditRole(user.role as 'MEMBER' | 'ADMIN');
    setEditNewPassword('');
  };

  // Lưu sửa người dùng
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmittingEdit(true);
    try {
      const payload: any = {
        fullName: editFullName.trim(),
        role: editRole,
      };
      if (editNewPassword.trim()) {
        if (editNewPassword.trim().length < 6) {
          toast.error('Mật khẩu mới tối thiểu 6 ký tự!');
          setIsSubmittingEdit(false);
          return;
        }
        payload.password = editNewPassword.trim();
      }

      await apiUpdateAdminUser(editingUser.id, payload);
      toast.success('Cập nhật tài khoản người dùng thành công!');
      setEditingUser(null);
      await loadAdminData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi cập nhật người dùng');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Xác nhận xóa người dùng
  const handleConfirmDelete = async () => {
    if (!deletingUser) return;

    setIsDeleting(true);
    try {
      await apiDeleteAdminUser(deletingUser.id);
      toast.success('Đã xóa người dùng khỏi hệ thống!');
      setDeletingUser(null);
      await loadAdminData();
    } catch (err: any) {
      toast.error(err.message || 'Không thể xóa người dùng');
    } finally {
      setIsDeleting(false);
    }
  };

  // Đổi nhanh role trên bảng
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await apiUpdateAdminUserRole(userId, newRole);
      toast.success(`Đã cập nhật quyền sang ${newRole}!`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err: any) {
      toast.error(err.message || 'Lỗi cập nhật phân quyền');
    }
  };

  // Lọc người dùng
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (!isOpen) return null;

  return (
    <div
      className="minimal-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{ zIndex: 12000 }}
    >
      <div
        className="minimal-modal-box"
        style={{
          maxWidth: '880px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          background: 'rgba(7, 20, 14, 0.98)',
          border: '1px solid rgba(52, 211, 153, 0.35)',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.85), 0 0 45px rgba(16, 185, 129, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.2rem 1.6rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, rgba(6, 78, 59, 0.6), rgba(4, 31, 20, 0.95))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)',
              }}
            >
              <Crown size={22} color="#fef08a" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                  Trung Tâm Quản Trị Hệ Thống Famlykin
                </h3>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.55rem',
                    borderRadius: '999px',
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                  }}
                >
                  SUPER ADMIN
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
                Quản lý toàn bộ tài khoản người dùng, phân quyền và dữ liệu hệ thống
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              type="button"
              className="btn-ghost-sm"
              onClick={loadAdminData}
              title="Làm mới dữ liệu"
              disabled={isLoading}
              style={{ color: '#34d399' }}
            >
              <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              className="btn-ghost-sm"
              onClick={onClose}
              title="Đóng bảng quản trị"
              style={{ color: '#ffffff' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation: Tập trung vào Quản lý User (CRUD) và Tổng Quan */}
        <div
          style={{
            display: 'flex',
            padding: '0.6rem 1.6rem 0 1.6rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            gap: '0.5rem',
            background: 'rgba(0, 0, 0, 0.25)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('USERS')}
            style={{
              padding: '0.65rem 1.1rem',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'USERS' ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
              borderBottom: activeTab === 'USERS' ? '2px solid #34d399' : '2px solid transparent',
              color: activeTab === 'USERS' ? '#ffffff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <Users size={16} color="#38bdf8" />
            <span>Quản Lý Người Dùng ({users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('OVERVIEW')}
            style={{
              padding: '0.65rem 1.1rem',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'OVERVIEW' ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
              borderBottom: activeTab === 'OVERVIEW' ? '2px solid #34d399' : '2px solid transparent',
              color: activeTab === 'OVERVIEW' ? '#ffffff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <Shield size={16} color="#34d399" />
            <span>Tổng Quan Hệ Thống</span>
          </button>
        </div>

        {/* Tab Body */}
        <div style={{ padding: '1.5rem 1.6rem', overflowY: 'auto', flex: 1 }}>
          {/* TAB 1: QUẢN LÝ NGƯỜI DÙNG (FULL CRUD) */}
          {activeTab === 'USERS' && (
            <div>
              {/* Controls: Search, Filter, Nút Thêm User */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.25rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flex: 1, minWidth: '280px' }}>
                  {/* Search box */}
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search
                      size={15}
                      color="#64748b"
                      style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      type="text"
                      placeholder="Tìm theo email hoặc họ tên..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="auth-input-dark"
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.8rem 0.55rem 2.2rem',
                        fontSize: '0.85rem',
                        borderRadius: '9px',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        background: 'rgba(0, 0, 0, 0.4)',
                        color: '#ffffff',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Filter Role */}
                  <select
                    value={roleFilter}
                    onChange={(e: any) => setRoleFilter(e.target.value)}
                    style={{
                      padding: '0.55rem 0.8rem',
                      fontSize: '0.85rem',
                      borderRadius: '9px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(10, 26, 18, 0.95)',
                      color: '#ffffff',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="ALL">Tất cả vai trò</option>
                    <option value="ADMIN">Chỉ Admin</option>
                    <option value="MEMBER">Chỉ Thành viên</option>
                  </select>
                </div>

                {/* Nút Tạo User Mới */}
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.58rem 1.1rem',
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    color: '#ffffff',
                    border: '1px solid rgba(52, 211, 153, 0.4)',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <UserPlus size={16} />
                  <span>+ Tạo Người Dùng Mới</span>
                </button>
              </div>

              {/* Bảng Danh Sách Người Dùng */}
              <div
                style={{
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: 'rgba(0, 0, 0, 0.35)',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <th style={{ padding: '0.8rem 1rem', textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>
                        NGƯỜI DÙNG
                      </th>
                      <th style={{ padding: '0.8rem 1rem', textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>
                        PHÂN QUYỀN
                      </th>
                      <th style={{ padding: '0.8rem 1rem', textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>
                        NGÀY TẠO
                      </th>
                      <th style={{ padding: '0.8rem 1rem', textAlign: 'right', color: '#94a3b8', fontWeight: 600 }}>
                        THAO TÁC
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                          Không tìm thấy người dùng nào phù hợp với bộ lọc.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr
                          key={u.id}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          {/* User info */}
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  background: u.role === 'ADMIN' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                  border: u.role === 'ADMIN' ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(52, 211, 153, 0.5)',
                                  color: u.role === 'ADMIN' ? '#fbbf24' : '#34d399',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: '0.85rem',
                                }}
                              >
                                {u.fullName ? u.fullName[0].toUpperCase() : u.email[0].toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: '#ffffff' }}>{u.fullName || 'Chưa đặt tên'}</div>
                                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{u.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Role badge (Bấm vào để mở modal sửa phân quyền, không bị che khuất hàng dưới) */}
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(u)}
                              title="Bấm để thay đổi phân quyền"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.28rem 0.65rem',
                                borderRadius: '999px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                letterSpacing: '0.02em',
                                cursor: 'pointer',
                                background: u.role === 'ADMIN' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                color: u.role === 'ADMIN' ? '#fbbf24' : '#34d399',
                                border: u.role === 'ADMIN' ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid rgba(52, 211, 153, 0.45)',
                                boxShadow: u.role === 'ADMIN' ? '0 0 10px rgba(245, 158, 11, 0.2)' : '0 0 10px rgba(16, 185, 129, 0.15)',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {u.role === 'ADMIN' ? <Crown size={12} color="#fbbf24" /> : <Shield size={12} color="#34d399" />}
                              <span>{u.role === 'ADMIN' ? 'SUPER ADMIN' : 'THÀNH VIÊN'}</span>
                            </button>
                          </td>

                          {/* Created date */}
                          <td style={{ padding: '0.85rem 1rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                            {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                          </td>

                          {/* Action buttons (CRUD) */}
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(u)}
                                title="Chỉnh sửa thông tin / Đặt lại mật khẩu"
                                style={{
                                  padding: '0.4rem 0.65rem',
                                  borderRadius: '6px',
                                  background: 'rgba(56, 189, 248, 0.12)',
                                  border: '1px solid rgba(56, 189, 248, 0.3)',
                                  color: '#38bdf8',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  fontSize: '0.78rem',
                                }}
                              >
                                <Edit2 size={13} />
                                <span>Sửa</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeletingUser(u)}
                                title="Xóa tài khoản người dùng"
                                style={{
                                  padding: '0.4rem 0.65rem',
                                  borderRadius: '6px',
                                  background: 'rgba(239, 68, 68, 0.12)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: '#f87171',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  fontSize: '0.78rem',
                                }}
                              >
                                <Trash2 size={13} />
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

          {/* TAB 2: TỔNG QUAN HỆ THỐNG */}
          {activeTab === 'OVERVIEW' && (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ padding: '1.2rem', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>TỔNG NGƯỜI DÙNG</div>
                  <div style={{ fontSize: '1.9rem', fontWeight: 700, color: '#ffffff', marginTop: '0.3rem' }}>{stats?.totalUsers || users.length}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem' }}>{stats?.totalAdmins || 0} Admin • {stats?.totalMembers || 0} Thành viên</div>
                </div>

                <div style={{ padding: '1.2rem', borderRadius: '14px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                  <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600 }}>TỔNG SỐ DÒNG HỌ</div>
                  <div style={{ fontSize: '1.9rem', fontWeight: 700, color: '#ffffff', marginTop: '0.3rem' }}>{stats?.totalTrees || 0}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem' }}>Cây gia phả số trong hệ thống</div>
                </div>

                <div style={{ padding: '1.2rem', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                  <div style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 600 }}>TỔNG THÀNH VIÊN PHẢ HỆ</div>
                  <div style={{ fontSize: '1.9rem', fontWeight: 700, color: '#ffffff', marginTop: '0.3rem' }}>{stats?.totalPersons || 0}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem' }}>{stats?.totalLiving || 0} còn sống • {stats?.totalDeceased || 0} đã mất</div>
                </div>
              </div>

              <div
                style={{
                  padding: '1.2rem 1.4rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <h4 style={{ fontSize: '0.95rem', color: '#ffffff', margin: '0 0 0.5rem 0' }}>Trạng Thái Máy Chủ & Dữ Liệu</h4>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                  • Cơ sở dữ liệu: <strong>PostgreSQL 15</strong> kết nối ổn định.<br />
                  • Xác thực người dùng: <strong>Supabase Magic Link + JSON Web Token (JWT)</strong>.<br />
                  • Hệ thống lưu trữ gia phả đã sẵn sàng cho hàng ngàn dòng họ độc lập.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ================= MODAL TẠO NGƯỜI DÙNG MỚI ================= */}
        {showCreateModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 13000,
              padding: '1rem',
            }}
          >
            <form
              onSubmit={handleCreateUser}
              style={{
                maxWidth: '440px',
                width: '100%',
                background: 'rgba(10, 26, 18, 0.98)',
                border: '1px solid rgba(52, 211, 153, 0.4)',
                borderRadius: '16px',
                padding: '1.8rem',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
              }}
            >
              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: '0 0 1.2rem 0', fontWeight: 700 }}>
                Tạo Tài Khoản Người Dùng Mới
              </h3>

              <div style={{ marginBottom: '0.9rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Địa chỉ Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  className="auth-input-dark"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ marginBottom: '0.9rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Mật khẩu khởi tạo * (tối thiểu 6 ký tự)
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className="auth-input-dark"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ marginBottom: '0.9rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Họ và Tên
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={createFullName}
                  onChange={(e) => setCreateFullName(e.target.value)}
                  className="auth-input-dark"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.4rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Phân quyền hệ thống
                </label>
                <select
                  value={createRole}
                  onChange={(e: any) => setCreateRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    background: 'rgba(16, 36, 26, 0.75)',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                    color: '#ffffff',
                    outline: 'none',
                  }}
                >
                  <option value="MEMBER">Thành viên thông thường (MEMBER)</option>
                  <option value="ADMIN">Quản trị viên toàn hệ thống (ADMIN)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isSubmittingCreate ? 'Đang tạo...' : 'Tạo Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= MODAL CHỈNH SỬA / ĐẶT LẠI MẬT KHẨU ================= */}
        {editingUser && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 13000,
              padding: '1rem',
            }}
          >
            <form
              onSubmit={handleSaveEdit}
              style={{
                maxWidth: '440px',
                width: '100%',
                background: 'rgba(10, 26, 18, 0.98)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '16px',
                padding: '1.8rem',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
              }}
            >
              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: '0 0 0.35rem 0', fontWeight: 700 }}>
                Chỉnh Sửa Người Dùng
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#38bdf8', margin: '0 0 1.2rem 0' }}>
                {editingUser.email}
              </p>

              <div style={{ marginBottom: '0.9rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Họ và Tên
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="auth-input-dark"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ marginBottom: '0.9rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Phân quyền
                </label>
                <select
                  value={editRole}
                  onChange={(e: any) => setEditRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    background: 'rgba(16, 36, 26, 0.75)',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                    color: '#ffffff',
                    outline: 'none',
                  }}
                >
                  <option value="MEMBER">Thành viên thông thường (MEMBER)</option>
                  <option value="ADMIN">Quản trị viên toàn hệ thống (ADMIN)</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.4rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Đổi Mật Khẩu Mới (để trống nếu giữ nguyên)
                </label>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu mới nếu muốn đổi..."
                  value={editNewPassword}
                  onChange={(e) => setEditNewPassword(e.target.value)}
                  className="auth-input-dark"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isSubmittingEdit ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= MODAL XÁC NHẬN XÓA ================= */}
        {deletingUser && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 13000,
              padding: '1rem',
            }}
          >
            <div
              style={{
                maxWidth: '420px',
                width: '100%',
                background: 'rgba(15, 23, 42, 0.98)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '16px',
                padding: '1.8rem',
                textAlign: 'center',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                }}
              >
                <AlertTriangle size={28} color="#ef4444" />
              </div>

              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: '0 0 0.5rem 0', fontWeight: 700 }}>
                Xác Nhận Xóa Tài Khoản?
              </h3>

              <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 1.4rem 0' }}>
                Bạn có chắc chắn muốn xóa tài khoản <strong style={{ color: '#ffffff' }}>{deletingUser.email}</strong>?
                Hành động này sẽ xóa vĩnh viễn tài khoản và các dữ liệu liên quan.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setDeletingUser(null)}
                  style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  style={{
                    padding: '0.6rem 1.4rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isDeleting ? 'Đang xóa...' : 'Xóa Tài Khoản'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
