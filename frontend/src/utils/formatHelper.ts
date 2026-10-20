/**
 * Format Helpers for Fam3 - Cây Gia Phả Số
 */

/**
 * Lấy chữ cái viết tắt đại diện cho avatar (First letter of first word + First letter of last word)
 * Ví dụ: "Nguyen Phuc Khang" -> "NK", "Le Van An" -> "LA", "Khang" -> "KH", "An" -> "AN"
 */
export function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return 'FT';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const firstChar = parts[0][0];
    const lastChar = parts[parts.length - 1][0];
    return `${firstChar}${lastChar}`.toUpperCase();
  }
  // Nếu chỉ có 1 từ (ví dụ "Khang" hoặc "An"), lấy 2 ký tự đầu
  return name.trim().slice(0, 2).toUpperCase();
}
