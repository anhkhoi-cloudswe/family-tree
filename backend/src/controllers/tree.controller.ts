import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getTrees = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const isSuperAdmin = req.user?.role === 'ADMIN';
    const trees = await prisma.familyTree.findMany({
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
    return res.json(trees);
  } catch (error) {
    console.error('Lỗi lấy danh sách cây gia phả:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ.' });
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
