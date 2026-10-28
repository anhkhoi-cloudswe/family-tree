import { User, FamilyTree, Person, Relationship, KinshipResult, TreeCollaborator, TreeInvitation, TreeRole, SubscriptionStatus } from '../types';
import { isSupabaseConfigured, uploadAvatarToSupabase } from './supabase';

const rawApiBase = (import.meta as any).env?.VITE_API_BASE_URL || '/api';
const API_BASE = rawApiBase.endsWith('/') ? rawApiBase.slice(0, -1) : rawApiBase;

export const getStoredToken = () => localStorage.getItem('gia_pha_token');
export const setStoredToken = (token: string) => localStorage.setItem('gia_pha_token', token);
export const removeStoredToken = () => localStorage.removeItem('gia_pha_token');

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Do not set Content-Type if FormData is used
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Yêu cầu thất bại (${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData.error) errorMsg = errorData.error;
    } catch {}
    throw new Error(errorMsg);
  }

  return response.json();
}

// Auth API
export const apiLogin = (data: { email: string; password: string }) =>
  request<{ token: string; user: User; defaultTreeId?: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const apiRegister = (data: { email: string; password: string; fullName?: string }) =>
  request<{ success: boolean; message: string; email: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const apiVerifyRegistration = (token: string) =>
  request<{ success: boolean; token: string; user: User; defaultTreeId?: string; message: string }>('/auth/verify-registration', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });

export const apiCompleteRegistration = (data: { email: string; password?: string; fullName?: string; avatarUrl?: string }) =>
  request<{ token: string; user: User; defaultTreeId?: string; message?: string }>('/auth/complete-registration', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const apiCheckEmail = (email: string) =>
  request<{ exists: boolean }>('/auth/check-email', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

export const apiForgotPassword = (email: string) =>
  request<{ success: boolean; message: string; email: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

export const apiResetPassword = (data: { token: string; newPassword: string }) =>
  request<{ success: boolean; message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const apiMagicLogin = (email: string) =>
  request<{ token: string; user: User; defaultTreeId?: string }>('/auth/magic-login', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

export const apiGetMe = () => request<User>('/auth/me');

// Tree API
export const apiGetTrees = () => request<FamilyTree[]>('/trees/');
export const apiGetTreeById = (id: string) => request<FamilyTree>(`/trees/${id}`);
export const apiCreateTree = (data: Partial<FamilyTree>) =>
  request<FamilyTree>('/trees/', { method: 'POST', body: JSON.stringify(data) });
export const apiUpdateTree = (id: string, data: Partial<FamilyTree>) =>
  request<FamilyTree>(`/trees/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const apiDeleteTree = (id: string) =>
  request<{ message: string }>(`/trees/${id}`, { method: 'DELETE' });

// Person API
export const apiCreatePerson = (data: any) =>
  request<Person>('/persons', { method: 'POST', body: JSON.stringify(data) });
export const apiUpdatePerson = (id: string, data: Partial<Person>) =>
  request<Person>(`/persons/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const apiDeletePerson = (id: string) =>
  request<{ message: string }>(`/persons/${id}`, { method: 'DELETE' });

export const apiUploadAvatar = async (file: File): Promise<string> => {
  if (isSupabaseConfigured()) {
    try {
      return await uploadAvatarToSupabase(file);
    } catch (sbErr) {
      console.warn('Lỗi tải ảnh qua Supabase Storage, thử upload qua backend API:', sbErr);
    }
  }

  const formData = new FormData();
  formData.append('avatar', file);
  const result = await request<{ avatarUrl: string }>('/persons/upload-avatar', {
    method: 'POST',
    body: formData,
  });
  return result.avatarUrl;
};

// Relationship API
export const apiCreateRelationship = (data: {
  treeId: string;
  type: 'PARENT_CHILD' | 'SPOUSE' | 'ADOPTED';
  parentId?: string;
  childId?: string;
  spouse1Id?: string;
  spouse2Id?: string;
}) => request<Relationship>('/persons/relationship', { method: 'POST', body: JSON.stringify(data) });

export const apiDeleteRelationship = (id: string) =>
  request<{ message: string }>(`/persons/relationship/${id}`, { method: 'DELETE' });

// Kinship API
export const apiCalculateKinship = (treeId: string, personAId: string, personBId: string) =>
  request<KinshipResult>(`/kinship/calculate?treeId=${treeId}&personAId=${personAId}&personBId=${personBId}`);

// Export Excel download
export const downloadTreeExcel = async (treeId: string, treeName: string) => {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE}/export/excel/${treeId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error('Không thể tải file Excel gia phả');
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanTreeName = (treeName || 'Dòng họ').replace(/^Gia\s*phả\s*/i, '').trim();
  a.download = `Famlykin ${cleanTreeName}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

// Admin API
export interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalMembers: number;
  totalTrees: number;
  totalPersons: number;
  totalLiving: number;
  totalDeceased: number;
  totalRelationships: number;
}

export interface AdminUserItem {
  id: string;
  email: string;
  fullName: string;
  role: string;
  subscriptionTier?: 'FREE' | 'PRO';
  subscriptionExpiresAt?: string | null;
  createdAt: string;
  _count: { trees: number; collaborations?: number };
}

export interface AdminTreeItem {
  id: string;
  name: string;
  branchName?: string;
  createdAt: string;
  owner: { id: string; email: string; fullName: string };
  _count: { members: number; relationships: number };
}

export const apiGetAdminStats = () => request<AdminStats>('/admin/stats');
export const apiGetAdminUsers = () => request<AdminUserItem[]>('/admin/users');
export const apiCreateAdminUser = (data: { email: string; password: string; fullName?: string; role?: string }) =>
  request<{ message: string; user: AdminUserItem }>('/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
export const apiUpdateAdminUser = (id: string, data: { fullName?: string; role?: string; password?: string }) =>
  request<{ message: string; user: AdminUserItem }>(`/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
export const apiUpdateAdminUserRole = (id: string, role: string) =>
  request<{ message: string; user: any }>(`/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
export const apiDeleteAdminUser = (id: string) =>
  request<{ message: string }>(`/admin/users/${id}`, {
    method: 'DELETE',
  });
export const apiGetAdminTrees = () => request<AdminTreeItem[]>('/admin/trees');

// Phone Management
export const apiUpdatePhone = (phone: string) =>
  request<{ message: string; user: User }>('/auth/phone', {
    method: 'PUT',
    body: JSON.stringify({ phone }),
  });

// Phone SMS OTP & Daily Rate Limit API
export const apiGetPhoneOtpStatus = () =>
  request<{
    attemptsToday: number;
    maxDaily: number;
    remaining: number;
    isLocked: boolean;
  }>('/auth/phone-otp/status');

export const apiRequestPhoneOtp = (phone: string) =>
  request<{
    success: boolean;
    message: string;
    attemptsToday: number;
    remainingAttempts: number;
    normalizedPhone: string;
    formattedE164: string;
  }>('/auth/phone-otp/request', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });

export const apiVerifyPhoneOtp = (phone: string) =>
  request<{ success: boolean; message: string; user: User }>('/auth/phone-otp/verify', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });

// Tree Collaboration & Invitations
export const apiSendInvitation = (data: { treeId: string; phone: string; role: 'VIEWER' | 'EDITOR' | 'OWNER'; message?: string }) =>
  request<{ message: string; invitation: TreeInvitation }>('/invitations/send', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const apiGetPendingInvitations = () =>
  request<TreeInvitation[]>('/invitations/pending');

export const apiAcceptInvitation = (id: string, personId?: string) =>
  request<{ message: string; treeId: string; treeName: string }>(`/invitations/${id}/accept`, {
    method: 'POST',
    body: JSON.stringify({ personId }),
  });

export const apiDeclineInvitation = (id: string) =>
  request<{ message: string }>(`/invitations/${id}/decline`, {
    method: 'POST',
  });

export const apiCancelInvitation = (id: string) =>
  request<{ message: string }>(`/invitations/${id}`, {
    method: 'DELETE',
  });

export const apiGetTreeCollaborators = (treeId: string) =>
  request<{
    treeOwner?: User;
    collaborators: TreeCollaborator[];
    pendingInvitations: TreeInvitation[];
    totalOwnersCount?: number;
    maxOwners?: number;
  }>(`/invitations/tree/${treeId}`);

export const apiUpdateCollaboratorRole = (treeId: string, collaboratorUserId: string, role: 'VIEWER' | 'EDITOR' | 'OWNER') =>
  request<{ message: string; collaborator: TreeCollaborator }>(`/invitations/tree/${treeId}/collaborator/${collaboratorUserId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });

export const apiRemoveCollaborator = (treeId: string, collaboratorUserId: string) =>
  request<{ message: string }>(`/invitations/tree/${treeId}/collaborator/${collaboratorUserId}`, {
    method: 'DELETE',
  });

// Profile & Account Management
export const apiUpdateProfile = (data: {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  currentPassword?: string;
  newPassword?: string;
}) =>
  request<{ message: string; user: User }>('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const apiCloseAccount = () =>
  request<{ success: boolean; message: string; deletedAt: string }>('/auth/close-account', {
    method: 'POST',
  });

export const apiRestoreAccount = () =>
  request<{ success: boolean; message: string; user: User }>('/auth/restore-account', {
    method: 'POST',
  });

// Subscription Management
export const apiGetSubscriptionStatus = () =>
  request<SubscriptionStatus>('/subscription/status');

export const apiUpgradeSubscription = (durationDays: number = 30) =>
  request<{ message: string; subscription: any }>('/subscription/upgrade', {
    method: 'POST',
    body: JSON.stringify({ durationDays }),
  });

export const apiSimulateSubscriptionExpiry = () =>
  request<{ message: string; subscription: any }>('/subscription/simulate-expiry', {
    method: 'POST',
  });

// SePay Gateway & Bank Info
export const apiGetSePayConfig = () =>
  request<{ bankAccount: string; bankName: string; accountHolder?: string }>('/subscription/sepay-config');

// PayOS Gateway
export const apiGetPayOSStatus = () =>
  request<{ isConfigured: boolean }>('/subscription/payos-status');

export const apiCreatePayOSPayment = (plan: 'MONTHLY' | 'YEARLY') =>
  request<{ isConfigured: boolean; checkoutUrl?: string; orderCode?: number; amount?: number; error?: string }>(
    '/subscription/payos-create',
    {
      method: 'POST',
      body: JSON.stringify({ plan }),
    }
  );

export const apiCheckPaymentStatus = (orderCode: number) =>
  request<{ isPaid: boolean }>(`/subscription/payos-check/${orderCode}`);

// Invite Link & Collaborator Self-Leave
export const apiGetInviteLinkInfo = (treeId: string) =>
  request<{
    treeId: string;
    treeName: string;
    description?: string;
    branchName?: string;
    ownerName: string;
    membersCount: number;
  }>(`/invitations/link-info/${treeId}`);

export const apiJoinTreeViaLink = (treeId: string) =>
  request<{ message: string; treeId: string }>(`/invitations/join-link/${treeId}`, {
    method: 'POST',
  });

export const apiLeaveTree = (treeId: string, currentUserId: string) =>
  apiRemoveCollaborator(treeId, currentUserId);

// Admin Subscription Management
export const apiUpdateAdminUserSubscription = (
  userId: string,
  data: { tier: 'FREE' | 'PRO'; durationDays?: number; expiresAt?: string | null }
) =>
  request<{ message: string; user: any }>(`/admin/users/${userId}/subscription`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
