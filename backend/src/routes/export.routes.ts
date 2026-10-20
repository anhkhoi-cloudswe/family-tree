import { Router } from 'express';
import { exportExcel } from '../controllers/export.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.get('/excel/:treeId', exportExcel);

export default router;
