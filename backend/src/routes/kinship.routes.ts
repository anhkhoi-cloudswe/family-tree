import { Router } from 'express';
import { calculateKinship } from '../controllers/kinship.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.get('/calculate', calculateKinship);

export default router;
