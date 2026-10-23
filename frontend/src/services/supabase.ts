import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Đọc cấu hình từ biến môi trường Vite hoặc LocalStorage (để tiện cấu hình trực tiếp)
const ENV_SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const ENV_SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

const LS_URL_KEY = 'fam3_supabase_url';
const LS_KEY_KEY = 'fam3_supabase_anon_key';

export const getSupabaseConfig = () => {
  const envUrl = ((import.meta as any).env?.VITE_SUPABASE_URL || '').trim();
  const envAnonKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '').trim();

  // Ưu tiên biến môi trường từ GitHub Secrets / Cloudflare Pages nếu hợp lệ
  const url = (envUrl && envUrl.startsWith('https://'))
    ? envUrl
    : (localStorage.getItem(LS_URL_KEY) || 'https://ggefsinnmmrfcfvyhvko.supabase.co');

  const anonKey = (envAnonKey && envAnonKey.length > 20)
    ? envAnonKey
    : (localStorage.getItem(LS_KEY_KEY) || '');

  return { url, anonKey };
};

export const saveSupabaseConfig = (url: string, anonKey: string) => {
  localStorage.setItem(LS_URL_KEY, url.trim());
  localStorage.setItem(LS_KEY_KEY, anonKey.trim());
  cachedClient = null; // Reset cache
};

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith('https://'));
};

let cachedClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (cachedClient) return cachedClient;
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey || !url.startsWith('https://')) return null;

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
    return cachedClient;
  } catch (err) {
    console.error('Lỗi khởi tạo Supabase Client:', err);
    return null;
  }
};

/**
 * Gửi Magic Link (Passwordless Authentication) tới Email người dùng qua Supabase
 */
export const sendMagicLink = async (email: string): Promise<{ success: boolean; message: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(
      'Chưa cấu hình Supabase! Vui lòng kiểm tra lại Secret Key trên GitHub Repo.'
    );
  }

  const cleanEmail = email.toLowerCase().trim();
  const redirectTo = window.location.origin;

  const { error } = await client.auth.signInWithOtp({
    email: cleanEmail,
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: true,
    },
  });

  if (error) {
    console.error('Supabase signInWithOtp error:', error);
    throw new Error(error.message || 'Không thể gửi email xác thực qua Supabase');
  }

  return {
    success: true,
    message: `Đã gửi liên kết xác thực an toàn tới ${cleanEmail}!`,
  };
};

/**
 * Xác thực mã OTP 6 số hoặc token từ email qua Supabase
 */
export const verifySupabaseOtp = async (email: string, token: string): Promise<string> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Chưa kết nối Supabase Client');

  const cleanEmail = email.toLowerCase().trim();
  const cleanToken = token.trim();

  const { data, error } = await client.auth.verifyOtp({
    email: cleanEmail,
    token: cleanToken,
    type: 'email',
  });

  if (error) {
    console.error('Supabase verifyOtp error:', error);
    throw new Error(error.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn.');
  }

  return data.user?.email || cleanEmail;
};

/**
 * Tải ảnh đại diện lên Supabase Storage bucket 'familytree-avatars'
 */
export const uploadAvatarToSupabase = async (file: File): Promise<string> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Chưa cấu hình Supabase Storage');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await client.storage
    .from('familytree-avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    throw new Error(`Lỗi tải ảnh lên Supabase: ${uploadError.message}`);
  }

  const { data } = client.storage.from('familytree-avatars').getPublicUrl(filePath);
  return data.publicUrl;
};
