import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const checkEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email là bắt buộc.' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    return res.json({ exists: Boolean(user) });
  } catch (error: any) {
    return res.status(500).json({ error: 'Lỗi kiểm tra email.' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Vui lòng cung cấp email.' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return res.status(404).json({ error: 'Email này chưa được đăng ký trong hệ thống Fam3!' });
    }

    return res.json({
      message: 'Email hợp lệ. Bạn có thể nhận liên kết đặt lại mật khẩu qua email.',
      email: user.email,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Lỗi xử lý quên mật khẩu.' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ email và mật khẩu.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email này đã tồn tại trong hệ thống!' });
    }

    const userDisplayName = (fullName && fullName.trim()) ? fullName.trim() : cleanEmail.split('@')[0];
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        fullName: userDisplayName,
        role: 'MEMBER',
      },
    });

    // Tạo sẵn một Cây Gia Phả mặc định cho người dùng
    const defaultTree = await prisma.familyTree.create({
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
            biography: 'Thành viên đầu tiên khởi tạo cây gia phả số.',
          },
        },
      },
    });

    const secret = process.env.JWT_SECRET || 'family_tree_secret_key';
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Đăng ký tài khoản thành công!',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      defaultTreeId: defaultTree.id,
    });
  } catch (error: any) {
    console.error('Lỗi đăng ký:', error);
    return res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ trong quá trình đăng ký.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu.' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { trees: { take: 1 } },
    });

    if (!user) {
      return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác.' });
    }

    const secret = process.env.JWT_SECRET || 'family_tree_secret_key';
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '7d' }
    );

    let defaultTreeId = user.trees[0]?.id || null;
    if (user.role === 'ADMIN') {
      const populatedTree = await prisma.familyTree.findFirst({
        where: { members: { some: {} } },
      });
      if (populatedTree) {
        defaultTreeId = populatedTree.id;
      }
    }

    return res.json({
      message: 'Đăng nhập thành công!',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
      defaultTreeId,
    });
  } catch (error: any) {
    console.error('Lỗi đăng nhập:', error);
    return res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ trong quá trình đăng nhập.' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Chưa đăng nhập.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        trees: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }

    return res.json(user);
  } catch (error) {
    console.error('Lỗi lấy thông tin cá nhân:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ.' });
  }
};

export const magicLogin = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email là bắt buộc.' });
    }

    let user = await prisma.user.findUnique({
      where: { email },
      include: { trees: { take: 1 } },
    });

    let defaultTreeId = user?.trees[0]?.id || null;

    if (!user) {
      const userDisplayName = email.split('@')[0];
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
      user = await prisma.user.create({
        data: {
          email,
          passwordHash: randomPassword,
          fullName: userDisplayName,
          role: 'MEMBER',
        },
        include: { trees: { take: 1 } },
      });

      const newTree = await prisma.familyTree.create({
        data: {
          name: `Gia phả Dòng họ ${userDisplayName}`,
          description: `Cây gia phả khởi tạo qua Supabase Magic Link`,
          branchName: 'Chi Trưởng',
          ownerId: user.id,
          members: {
            create: {
              fullName: userDisplayName,
              nickname: 'Tôi (Khởi tạo)',
              gender: 'MALE',
              generation: 1,
              biography: 'Thành viên đầu tiên khởi tạo cây gia phả số.',
            },
          },
        },
      });
      defaultTreeId = newTree.id;
    }

    const secret = process.env.JWT_SECRET || 'family_tree_secret_key';
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Xác thực Magic Link thành công!',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
      defaultTreeId,
    });
  } catch (error: any) {
    console.error('Lỗi magicLogin:', error);
    return res.status(500).json({ error: 'Đã xảy ra lỗi khi xác thực Magic Link.' });
  }
};
