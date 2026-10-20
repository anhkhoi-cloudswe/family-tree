import { Router } from 'express';
import {
  getTrees,
  getTreeById,
  createTree,
  updateTree,
  deleteTree,
} from '../controllers/tree.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getTrees);
router.get('/:id', getTreeById);
router.post('/', createTree);
router.put('/:id', updateTree);
router.delete('/:id', deleteTree);

export default router;
