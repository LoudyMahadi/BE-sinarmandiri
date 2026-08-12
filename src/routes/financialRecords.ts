import { Router } from 'express';
import { getFinancialRecordsByStore, createFinancialRecord } from '../controllers/financialRecords.controller';

const router = Router();

router.get('/store/:store_id', getFinancialRecordsByStore);
router.post('/', createFinancialRecord);

export default router;