import { Router } from 'express';
import {
  createStockRequest,
  getStockRequestsByStore,
  getPendingStockRequests,
  approveStockRequest,
  rejectStockRequest,
} from '../controllers/stockRequests.controller';

const router = Router();

router.post('/', createStockRequest);
router.get('/pending', getPendingStockRequests);
router.get('/store/:store_id', getStockRequestsByStore);
router.patch('/:id/approve', approveStockRequest);
router.patch('/:id/reject', rejectStockRequest);

export default router;