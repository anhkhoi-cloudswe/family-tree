import { Router } from 'express';
import {
  createPerson,
  updatePerson,
  deletePerson,
  uploadAvatarHandler,
  createRelationship,
  deleteRelationship,
} from '../controllers/person.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { uploadAvatar } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/', createPerson);
router.put('/:id', updatePerson);
router.delete('/:id', deletePerson);
router.post('/upload-avatar', uploadAvatar.single('avatar'), uploadAvatarHandler);
router.post('/relationship', createRelationship);
router.delete('/relationship/:id', deleteRelationship);

export default router;
