import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getTrees = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const isSuperAdmin = req.user?.role === 'ADMIN';

    let trees = await prisma.familyTree.findMany({
      where: isSuperAdmin ? {} : { ownerId: userId },
      include: {
        _count: {
          select: { members: true },
        },
      },
      orderBy: [
        { members: { _count: 'desc' } },
        { createdAt: 'desc' },
      ],
    });

    // Nếu người dùng (thành viên thông thường) chưa có bất kỳ cây gia phả nào, tự động tạo 1 cây gia phả cá nhân kèm ô "Tôi"
    if (!isSuperAdmin && trees.length === 0 && userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        const userDisplayName = user.fullName || user.email.split('@')[0];
        const newTree = await prisma.familyTree.create({
          data: {
            name: `Gia phả Dòng họ ${userDisplayName}`,
            description: `Cây gia phả số khởi tạo cho ${userDisplayName}`,
            branchName: 'Chi Trưởng',
            ownerId: user.id,
            members: {
              create: {
                fullName: userDisplayName,
                nickname: 'Tôi (Khởi tạo)',
                gender: 'MALE',
                generation: 1,
                biography: 'Thành viên đầu tiên (Tôi) khởi tạo cây gia phả số.',
              },
            },
          },
          include: {
            _count: {
              select: { members: true },
            },
          },
        });
        trees = [newTree];
      }
    }

    return res.json(trees);
  } catch (error: any) {
    console.error('Lỗi lấy danh sách cây gia phả:', error);
    return res.status(500).json({ error: error?.message || 'Lỗi máy chủ.' });
  }
};

export const getTreeById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tree = await prisma.familyTree.findUnique({
      where: { id },
      include: {
        members: {
          orderBy: [
            { generation: 'asc' },
            { birthDate: 'asc' },
          ],
        },
        relationships: true,
      },
    });

    if (!tree) {
      return res.status(404).json({ error: 'Không tìm thấy cây gia phả.' });
    }

    return res.json(tree);
  } catch (error) {
    console.error('Lỗi chi tiết cây gia phả:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ.' });
  }
};

export const createTree = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Chưa xác thực.' });

    const { name, description, branchName, ancestorInfo } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Vui lòng nhập tên gia phả.' });
    }

    const tree = await prisma.familyTree.create({
      data: {
        name,
        description,
        branchName,
        ancestorInfo,
        ownerId: userId,
      },
    });

    return res.status(201).json(tree);
  } catch (error) {
    console.error('Lỗi tạo cây gia phả:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ.' });
  }
};

export const updateTree = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, branchName, ancestorInfo } = req.body;

    const updated = await prisma.familyTree.update({
      where: { id },
      data: {
        name,
        description,
        branchName,
        ancestorInfo,
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error('Lỗi cập nhật cây gia phả:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ.' });
  }
};

export const deleteTree = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.familyTree.delete({ where: { id } });
    return res.json({ message: 'Đã xóa cây gia phả thành công.' });
  } catch (error) {
    console.error('Lỗi xóa cây gia phả:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ.' });
  }
};
