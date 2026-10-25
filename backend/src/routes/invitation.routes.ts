import { Router } from 'express';
import {
  sendInvitation,
  getPendingInvitations,
  acceptInvitation,
  declineInvitation,
  cancelInvitation,
  getTreeCollaborators,
  updateCollaboratorRole,
  removeCollaborator,
  getInviteLinkInfo,
  joinTreeViaLink,
} from '../controllers/invitation.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

// Thông tin tóm tắt & tham gia qua đường link (?inviteTree=...)
router.get('/link-info/:treeId', getInviteLinkInfo);
router.post('/join-link/:treeId', joinTreeViaLink);

// Gửi lời mời chia sẻ cây (cả / và /send)
router.post('/', sendInvitation);
router.post('/send', sendInvitation);

// Lấy danh sách lời mời đang chờ xử lý của user hiện tại
router.get('/pending', getPendingInvitations);

// Chấp nhận / Từ chối / Hủy lời mời
router.post('/:id/accept', acceptInvitation);
router.post('/:id/decline', declineInvitation);
router.delete('/:id', cancelInvitation);

// Lấy danh sách cộng tác viên của một cây
router.get('/tree/:treeId', getTreeCollaborators);

// Cập nhật vai trò cộng tác viên (Chỉ xem, Chỉnh sửa, Chủ nhánh - tối đa 2 chủ nhánh)
router.patch('/tree/:treeId/collaborator/:collaboratorUserId/role', updateCollaboratorRole);

// Thu hồi quyền cộng tác viên / Đuổi khỏi cây (hỗ trợ cả 2 dạng path)
router.delete('/tree/:treeId/:collaboratorUserId', removeCollaborator);
router.delete('/tree/:treeId/collaborator/:collaboratorUserId', removeCollaborator);

export default router;

