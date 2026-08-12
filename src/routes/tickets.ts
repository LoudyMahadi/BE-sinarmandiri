import { Router } from 'express';
import { createTicket, getTickets, getTicketDetail, updateTicketStatus } from '../controllers/tickets.controller';

const router = Router();

router.post('/', createTicket);
router.get('/', getTickets);
router.get('/:id', getTicketDetail);
router.patch('/:id/status', updateTicketStatus);

export default router;