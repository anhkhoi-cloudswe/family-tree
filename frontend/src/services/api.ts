import { User, FamilyTree, Person, Relationship, KinshipResult } from '../types';
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
  request<{ token: string; user: User; defaultTreeId?: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const apiCheckEmail = (email: string) =>
  request<{ exists: boolean }>('/auth/check-email', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

export const apiForgotPassword = (email: string) =>
  request<{ message: string; email: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

export const apiMagicLogin = (email: string) =>
  request<{ token: string; user: User; defaultTreeId?: string }>('/auth/magic-login', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

export const apiGetMe = () => request<User>('/auth/me');

// Tree API
export const apiGetTrees = () => request<FamilyTree[]>('/trees');
export const apiGetTreeById = (id: string) => request<FamilyTree>(`/trees/${id}`);
export const apiCreateTree = (data: Partial<FamilyTree>) =>
  request<FamilyTree>('/trees', { method: 'POST', body: JSON.stringify(data) });
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
  a.download = `${treeName}_GiaPha.xlsx`;
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
  createdAt: string;
  _count: { trees: number };
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
