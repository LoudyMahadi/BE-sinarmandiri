import { Router } from 'express';
import {
  createTicket,
  getTickets,
  getTicketDetail,
  updateTicketStatus,
  updateSparepartInfo,
  markSparepartFulfilled,
} from '../controllers/tickets.controller';

const router = Router();

router.post('/', createTicket);
router.get('/', getTickets);
router.get('/:id', getTicketDetail);
router.patch('/:id/status', updateTicketStatus);
router.patch('/:id/sparepart', updateSparepartInfo);
router.patch('/:id/sparepart/fulfilled', markSparepartFulfilled);

export default router;