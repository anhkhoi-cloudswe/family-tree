import { Response } from 'express';
import * as XLSX from 'xlsx';
import { prisma } from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const exportExcel = async (req: AuthRequest, res: Response) => {
  try {
    const { treeId } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Chưa đăng nhập.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, subscriptionTier: true, subscriptionExpiresAt: true },
    });

    const isExpired = Boolean(
      user?.subscriptionTier === 'PRO' &&
      user?.subscriptionExpiresAt &&
      new Date(user.subscriptionExpiresAt) < new Date()
    );

    const isPro = user?.role === 'ADMIN' || (user?.subscriptionTier === 'PRO' && !isExpired);

    if (!isPro) {
      return res.status(403).json({
        error: 'Tính năng Xuất báo cáo & file Excel toàn diện dành riêng cho Gói PRO. Vui lòng nâng cấp gói để tải file!',
        requiresPro: true,
      });
    }

    const tree = await prisma.familyTree.findUnique({
      where: { id: treeId },
      include: {
        members: {
          orderBy: [
            { generation: 'asc' },
            { birthDate: 'asc' },
          ],
        },
      },
    });

    if (!tree) {
      return res.status(404).json({ error: 'Không tìm thấy gia phả để xuất Excel.' });
    }

    const dataRows = tree.members.map((m, index) => ({
      'STT': index + 1,
      'Thế Hệ (Đời)': `Đời thứ ${m.generation}`,
      'Họ và Tên': m.fullName,
      'Tên thường gọi / Nickname': m.nickname || '',
      'Giới tính': m.gender === 'MALE' ? 'Nam' : m.gender === 'FEMALE' ? 'Nữ' : 'Khác',
      'Tình trạng': m.isDeceased ? 'Đã khuất' : 'Còn sống',
      'Ngày sinh': m.birthDate ? new Date(m.birthDate).toLocaleDateString('vi-VN') : '',
      'Ngày mất (Dương lịch)': m.deathDate ? new Date(m.deathDate).toLocaleDateString('vi-VN') : '',
      'Ngày giỗ Âm lịch': m.lunarDeathDay || '',
      'Số điện thoại': m.phone || '',
      'Địa chỉ hiện tại': m.address || '',
      'Nơi an táng / Mộ phần': m.burialPlace || '',
      'Tọa độ GPS / Google Maps': m.burialCoordinates || '',
      'Tiểu sử / Ghi chú': m.biography || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataRows);

    // Điều chỉnh độ rộng cột
    worksheet['!cols'] = [
      { wch: 6 },  // STT
      { wch: 15 }, // Thế Hệ
      { wch: 25 }, // Họ và tên
      { wch: 20 }, // Nickname
      { wch: 10 }, // Giới tính
      { wch: 12 }, // Tình trạng
      { wch: 14 }, // Ngày sinh
      { wch: 20 }, // Ngày mất
      { wch: 18 }, // Ngày giỗ
      { wch: 15 }, // SĐT
      { wch: 30 }, // Địa chỉ
      { wch: 25 }, // Mộ phần
      { wch: 25 }, // Tọa độ
      { wch: 35 }, // Ghi chú
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ThanhVienGiaToc');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const cleanTreeName = (tree.name || 'Dòng_họ').replace(/^Gia\s*phả\s*/i, '').trim();
    const safeTreeName = encodeURIComponent(cleanTreeName.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_'));
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Famlykin_${safeTreeName}.xlsx"`
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    return res.send(buffer);
  } catch (error) {
    console.error('Lỗi xuất file Excel gia phả:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi tạo file Excel.' });
  }
};
