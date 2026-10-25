import { Router } from 'express';
import {
  sendInvitation,
  getPendingInvitations,
  acceptInvitation,
  declineInvitation,
  getTreeCollaborators,
  removeCollaborator,
} from '../controllers/invitation.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

// Gửi lời mời chia sẻ cây
router.post('/send', sendInvitation);

// Lấy danh sách lời mời đang chờ xử lý của user hiện tại
router.get('/pending', getPendingInvitations);

// Chấp nhận lời mời
router.post('/:id/accept', acceptInvitation);

// Từ chối lời mời
router.post('/:id/decline', declineInvitation);

// Lấy danh sách cộng tác viên của một cây
router.get('/tree/:treeId', getTreeCollaborators);

// Thu hồi quyền cộng tác viên
router.delete('/tree/:treeId/:collaboratorUserId', removeCollaborator);

export default router;
