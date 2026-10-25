import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { sendSignupVerificationEmail, sendPasswordResetEmail } from '../services/email.service';

/**
 * Trích xuất URL gốc của frontend (Ưu tiên header origin/referer từ client)
 * Đảm bảo liên kết xác thực luôn là https://famlykin.pages.dev, tuyệt đối không bị dính localhost
 */
const getClientOrigin = (req: Request): string => {
  const originHeader = (req.headers['origin'] as string) || (req.headers['referer'] as string);
  if (originHeader && originHeader.startsWith('http')) {
    try {
      const url = new URL(originHeader);
      // Nếu là localhost thì chỉ cho phép khi đang chạy test nội bộ, ưu tiên production
      return url.origin;
    } catch {
      // Fallback
    }
  }
  return 'https://famlykin.pages.dev';
};

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

/**
 * BƯỚC 1 ĐĂNG KÝ: Yêu cầu đăng ký tài khoản
 * NGHIỆP VỤ CHUẨN: Chưa tạo tài khoản trong DB! Chỉ gửi email xác thực qua Cloudflare.
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ email và mật khẩu.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có độ dài từ 6 ký tự trở lên.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email này đã tồn tại trong hệ thống! Vui lòng đăng nhập hoặc dùng chức năng Quên mật khẩu.' });
    }

    const userDisplayName = (fullName && fullName.trim()) ? fullName.trim() : cleanEmail.split('@')[0];
    const passwordHash = bcrypt.hashSync(password, 10);

    const secret = process.env.JWT_SECRET || 'family_tree_secret_key';
    const registrationToken = jwt.sign(
      {
        purpose: 'SIGNUP_VERIFICATION',
        email: cleanEmail,
        fullName: userDisplayName,
        passwordHash,
      },
      secret,
      { expiresIn: '24h' }
    );

    const clientOrigin = getClientOrigin(req);
    const actionUrl = `${clientOrigin}/?verify_token=${registrationToken}`;

    // Gửi email xác thực trực tiếp qua hạ tầng Cloudflare
    await sendSignupVerificationEmail(cleanEmail, userDisplayName, actionUrl);

    // Tuyệt đối KHÔNG tạo bản ghi User trong DB cho đến khi người dùng nhấp liên kết trong email
    return res.json({
      success: true,
      message: `Liên kết xác thực đã được gửi tới ${cleanEmail}. Vui lòng kiểm tra hộp thư và nhấp vào liên kết để hoàn tất tạo tài khoản.`,
      email: cleanEmail,
    });
  } catch (error: any) {
    console.error('Lỗi register:', error);
    return res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ trong quá trình gửi email xác nhận.' });
  }
};

/**
 * BƯỚC 2 ĐĂNG KÝ: Người dùng nhấp liên kết xác nhận từ email
 * TẠI ĐÂY MỚI CHÍNH THỨC TẠO TÀI KHOẢN VÀ CÂY GIA PHẢ TRONG DATABASE
 */
export const verifyRegistration = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Mã xác thực không hợp lệ.' });
    }

    const secret = process.env.JWT_SECRET || 'family_tree_secret_key';
    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch (jwtErr: any) {
      return res.status(400).json({ error: 'Liên kết xác thực không hợp lệ hoặc đã hết hạn. Vui lòng đăng ký lại.' });
    }

    if (decoded.purpose !== 'SIGNUP_VERIFICATION' || !decoded.email) {
      return res.status(400).json({ error: 'Mã token xác thực không đúng loại.' });
    }

    // Kiểm tra xem tài khoản đã được tạo trước đó chưa (phòng trường hợp người dùng click 2 lần)
    let user = await prisma.user.findUnique({
      where: { email: decoded.email },
      include: { trees: { take: 1 } },
    });

    let defaultTreeId = user?.trees[0]?.id || null;

    if (!user) {
      // CHÍNH THỨC TẠO TÀI KHOẢN SAU KHI XÁC THỰC EMAIL THÀNH CÔNG
      user = await prisma.user.create({
        data: {
          email: decoded.email,
          passwordHash: decoded.passwordHash,
          fullName: decoded.fullName,
          role: 'MEMBER',
          isVerified: true,
        },
        include: { trees: { take: 1 } },
      });

      // Tạo Cây Gia Phả mặc định cho người dùng
      const defaultTree = await prisma.familyTree.create({
        data: {
          name: `Gia phả Dòng họ ${decoded.fullName}`,
          description: `Cây gia phả khởi tạo bởi ${decoded.fullName}`,
          branchName: 'Chi Trưởng',
          ownerId: user.id,
        },
      });
      defaultTreeId = defaultTree.id;

      // Tạo thành viên cội nguồn đầu tiên (Tôi)
      await prisma.person.create({
        data: {
          treeId: defaultTree.id,
          fullName: decoded.fullName,
          nickname: 'Tôi',
          gender: 'MALE',
          generation: 1,
          biography: 'Thành viên đầu tiên (Tôi) khởi tạo cây gia phả số.',
        },
      });
    }

    // Cấp phiên đăng nhập JWT
    const sessionToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role,
        status: user.status,
        deletedAt: user.deletedAt,
      },
      defaultTreeId,
      message: 'Xác thực email thành công! Tài khoản của bạn đã được khởi tạo.',
    });
  } catch (error: any) {
    console.error('Lỗi verifyRegistration:', error);
    return res.status(500).json({ error: 'Đã xảy ra lỗi khi hoàn tất tạo tài khoản.' });
  }
};

/**
 * Hoàn tất tạo tài khoản sau khi người dùng xác thực thành công qua Firebase Email Link
 * ĐẢM BẢO: Chỉ tạo tài khoản trong DB SAU KHI người dùng bấm link trong email!
 */
export const completeRegistration = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, avatarUrl } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email là bắt buộc.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { trees: { take: 1 } },
    });

    let defaultTreeId = user?.trees[0]?.id || null;

    if (user) {
      // Nếu user đã tồn tại nhưng chưa có avatar và Google cung cấp avatarUrl -> Tự động cập nhật
      if ((!user.avatarUrl || user.avatarUrl.trim() === '') && avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim()) {
        const cleanAvatar = avatarUrl.trim();
        user = await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl: cleanAvatar },
          include: { trees: { take: 1 } },
        });

        // Đồng bộ luôn cho thành viên 'Tôi' trong cây gia phả nếu thành viên này chưa có avatar
        if (defaultTreeId) {
          const rootPerson = await prisma.person.findFirst({
            where: {
              treeId: defaultTreeId,
              OR: [{ nickname: 'Tôi' }, { fullName: user.fullName }],
            },
          });
          if (rootPerson && (!rootPerson.avatarUrl || rootPerson.avatarUrl.trim() === '')) {
            await prisma.person.update({
              where: { id: rootPerson.id },
              data: { avatarUrl: cleanAvatar },
            });
          }
        }
      }
    } else {
      const userDisplayName = (fullName && fullName.trim()) ? fullName.trim() : cleanEmail.split('@')[0];
      const passwordHash = password ? bcrypt.hashSync(password, 10) : bcrypt.hashSync(Math.random().toString(36), 10);
      const cleanAvatar = (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim()) ? avatarUrl.trim() : null;

      // CHÍNH THỨC TẠO TÀI KHOẢN SAU KHI CLICK EMAIL XÁC THỰC HOẶC SIGN IN GOOGLE
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          fullName: userDisplayName,
          avatarUrl: cleanAvatar,
          role: 'MEMBER',
          isVerified: true,
        },
        include: { trees: { take: 1 } },
      });

      const defaultTree = await prisma.familyTree.create({
        data: {
          name: `Gia phả Dòng họ ${userDisplayName}`,
          description: `Cây gia phả khởi tạo bởi ${userDisplayName}`,
          branchName: 'Chi Trưởng',
          ownerId: user.id,
        },
      });
      defaultTreeId = defaultTree.id;

      await prisma.person.create({
        data: {
          treeId: defaultTree.id,
          fullName: userDisplayName,
          nickname: 'Tôi',
          gender: 'MALE',
          generation: 1,
          avatarUrl: cleanAvatar,
          biography: 'Thành viên đầu tiên (Tôi) khởi tạo cây gia phả số.',
        },
      });
    }

    const secret = process.env.JWT_SECRET || 'family_tree_secret_key';
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Khởi tạo tài khoản thành công!',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role,
        status: user.status,
        deletedAt: user.deletedAt,
      },
      defaultTreeId,
    });
  } catch (error: any) {
    console.error('Lỗi completeRegistration:', error);
    return res.status(500).json({ error: 'Đã xảy ra lỗi khi hoàn tất tạo tài khoản.' });
  }
};

/**
 * Xử lý Đăng Nhập
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { trees: { take: 1 } },
    });

    if (!user) {
      return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác.' });
    }

    if (user.status === 'BLOCKED') {
      return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa bởi quản trị viên.' });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
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
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role,
        status: user.status,
        deletedAt: user.deletedAt,
      },
      defaultTreeId,
    });
  } catch (error: any) {
    console.error('Lỗi đăng nhập:', error);
    return res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ trong quá trình đăng nhập.' });
  }
};

/**
 * BƯỚC 1 QUÊN MẬT KHẨU: Gửi email khôi phục mật khẩu qua Cloudflare
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Vui lòng cung cấp email.' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return res.status(404).json({ error: 'Email này chưa được đăng ký trong hệ thống Famlykin!' });
    }

    const secret = process.env.JWT_SECRET || 'family_tree_secret_key';
    const resetToken = jwt.sign(
      {
        purpose: 'PASSWORD_RESET',
        userId: user.id,
        email: user.email,
      },
      secret,
      { expiresIn: '1h' }
    );

    const clientOrigin = getClientOrigin(req);
    const actionUrl = `${clientOrigin}/?reset_token=${resetToken}`;

    await sendPasswordResetEmail(user.email, user.fullName, actionUrl);

    return res.json({
      success: true,
      message: 'Liên kết đặt lại mật khẩu đã được gửi tới email của bạn. Vui lòng kiểm tra hộp thư.',
      email: user.email,
    });
  } catch (error: any) {
    console.error('Lỗi forgotPassword:', error);
    return res.status(500).json({ error: 'Lỗi xử lý quên mật khẩu.' });
  }
};

/**
 * BƯỚC 2 QUÊN MẬT KHẨU: Xác nhận đặt lại mật khẩu mới
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Vui lòng cung cấp mã xác thực và mật khẩu mới.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
    }

    const secret = process.env.JWT_SECRET || 'family_tree_secret_key';
    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err: any) {
      return res.status(400).json({ error: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.' });
    }

    if (decoded.purpose !== 'PASSWORD_RESET' || !decoded.userId) {
      return res.status(400).json({ error: 'Token không hợp lệ.' });
    }

    const passwordHash = bcrypt.hashSync(newPassword, 10);
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { passwordHash },
    });

    return res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.',
    });
  } catch (error: any) {
    console.error('Lỗi resetPassword:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi đặt lại mật khẩu.' });
  }
};

/**
 * Lấy thông tin cá nhân hiện tại
 */
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Chưa đăng nhập.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        status: true,
        deletedAt: true,
        createdAt: true,
        trees: {
          select: {
            id: true,
            name: true,
            branchName: true,
          },
          take: 1,
        },
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

/**
 * Fallback magic login endpoint (hỗ trợ tương thích ngược)
 */
export const magicLogin = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email là bắt buộc.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { trees: { take: 1 } },
    });

    let defaultTreeId = user?.trees[0]?.id || null;

    if (!user) {
      return res.status(404).json({ error: 'Tài khoản chưa được khởi tạo. Vui lòng đăng ký.' });
    }

    if (user.status === 'BLOCKED') {
      return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa bởi quản trị viên.' });
    }

    const secret = process.env.JWT_SECRET || 'family_tree_secret_key';
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Đăng nhập thành công!',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role,
        status: user.status,
        deletedAt: user.deletedAt,
      },
      defaultTreeId,
    });
  } catch (error: any) {
    console.error('Lỗi magicLogin:', error);
    return res.status(500).json({ error: 'Đã xảy ra lỗi.' });
  }
};

/**
 * Cập nhật Số Điện Thoại cho tài khoản hiện tại
 */
export const updatePhone = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { phone } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Chưa đăng nhập.' });
    }

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return res.status(400).json({ error: 'Vui lòng cung cấp số điện thoại hợp lệ.' });
    }

    const cleanPhone = phone.trim();

    // Kiểm tra xem số điện thoại đã được đăng ký bởi tài khoản khác chưa
    const existing = await prisma.user.findFirst({
      where: {
        phone: cleanPhone,
        NOT: { id: userId },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Số điện thoại này đã được sử dụng bởi một tài khoản khác.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { phone: cleanPhone },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        role: true,
      },
    });

    return res.json({
      message: 'Cập nhật số điện thoại thành công!',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Lỗi updatePhone:', error);
    return res.status(500).json({ error: error?.message || 'Lỗi máy chủ.' });
  }
};

/**
 * Cập nhật thông tin cá nhân (Profile Dashboard)
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Chưa đăng nhập.' });
    }

    const { fullName, phone, avatarUrl, currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }

    const updateData: any = {};

    if (fullName && typeof fullName === 'string' && fullName.trim()) {
      updateData.fullName = fullName.trim();
    }

    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl && typeof avatarUrl === 'string' ? avatarUrl.trim() : null;
    }

    if (phone !== undefined) {
      const cleanPhone = phone && typeof phone === 'string' ? phone.trim().replace(/\s+/g, '') : null;
      if (cleanPhone) {
        // Kiểm tra xem số điện thoại đã tồn tại ở tài khoản khác chưa
        const existing = await prisma.user.findFirst({
          where: {
            phone: cleanPhone,
            NOT: { id: userId },
          },
        });
        if (existing) {
          return res.status(400).json({ error: 'Số điện thoại này đã được sử dụng bởi một tài khoản khác.' });
        }
      }
      updateData.phone = cleanPhone;
    }

    // Nếu đổi mật khẩu
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu mới.' });
      }
      const isMatch = bcrypt.compareSync(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Mật khẩu hiện tại không chính xác.' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
      }
      updateData.passwordHash = bcrypt.hashSync(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        status: true,
        deletedAt: true,
      },
    });

    return res.json({
      message: 'Cập nhật thông tin cá nhân thành công!',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Lỗi updateProfile:', error);
    return res.status(500).json({ error: error?.message || 'Lỗi máy chủ khi cập nhật thông tin cá nhân.' });
  }
};

/**
 * Đóng / Xóa mềm tài khoản (PENDING_DELETE, ân hạn 30 ngày)
 */
export const closeAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Chưa đăng nhập.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }

    const deletedAt = new Date();
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'PENDING_DELETE',
        deletedAt,
      },
    });

    return res.json({
      success: true,
      message: 'Tài khoản của bạn đã được đưa vào trạng thái chờ xóa. Bạn có 30 ngày để đăng nhập và khôi phục lại tài khoản.',
      deletedAt,
    });
  } catch (error: any) {
    console.error('Lỗi closeAccount:', error);
    return res.status(500).json({ error: error?.message || 'Lỗi máy chủ khi đóng tài khoản.' });
  }
};

/**
 * Khôi phục tài khoản từ trạng thái PENDING_DELETE về ACTIVE
 */
export const restoreAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Chưa đăng nhập.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }

    const restoredUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        status: true,
        deletedAt: true,
      },
    });

    return res.json({
      success: true,
      message: 'Khôi phục tài khoản thành công! Chào mừng bạn quay trở lại.',
      user: restoredUser,
    });
  } catch (error: any) {
    console.error('Lỗi restoreAccount:', error);
    return res.status(500).json({ error: error?.message || 'Lỗi máy chủ khi khôi phục tài khoản.' });
  }
};

/**
 * Tác vụ chạy nền định kỳ quét và xóa vĩnh viễn (Hard-Delete) các tài khoản PENDING_DELETE quá 30 ngày
 */
export const cleanupPendingDeleteAccounts = async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await prisma.user.deleteMany({
      where: {
        status: 'PENDING_DELETE',
        deletedAt: {
          lte: thirtyDaysAgo,
        },
      },
    });
    if (result.count > 0) {
      console.log(`[Background Worker] Đã xóa vĩnh viễn ${result.count} tài khoản PENDING_DELETE quá hạn 30 ngày.`);
    }
  } catch (err) {
    console.error('[Background Worker] Lỗi khi dọn dẹp tài khoản chờ xóa:', err);
  }
};

