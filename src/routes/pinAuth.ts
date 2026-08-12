import { Router } from 'express';
import { switchPin, validatePin } from '../controllers/pinAuth.controller';

const router = Router();

router.post('/switch', switchPin);
router.post('/validate', validatePin);

export default router;