import { PayOS } from '@payos/node';

const clientId = process.env.PAYOS_CLIENT_ID || '';
const apiKey = process.env.PAYOS_API_KEY || '';
const checksumKey = process.env.PAYOS_CHECKSUM_KEY || '';

let payOSInstance: PayOS | null = null;

if (clientId && apiKey && checksumKey) {
  try {
    payOSInstance = new PayOS({ clientId, apiKey, checksumKey });
  } catch (err) {
    console.warn('[PayOS] Khởi tạo thất bại, vui lòng kiểm tra keys trong .env:', err);
  }
}

export const getPayOS = (): PayOS | null => payOSInstance;

export const isPayOSConfigured = (): boolean => {
  return Boolean(process.env.PAYOS_CLIENT_ID && process.env.PAYOS_API_KEY && process.env.PAYOS_CHECKSUM_KEY && payOSInstance);
};
