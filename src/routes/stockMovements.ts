import { Router } from 'express';
import { getMovementsByStore, createMovement } from '../controllers/stockMovements.controller';

const router = Router();

router.get('/store/:store_id', getMovementsByStore);
router.post('/', createMovement);

export default router;