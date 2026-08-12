import { Router } from 'express';
import { getAllProducts, createProduct } from '../controllers/products.controller';

const router = Router();

router.get('/', getAllProducts);
router.post('/', createProduct);

export default router;