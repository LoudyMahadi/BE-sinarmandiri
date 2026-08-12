import { Router } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

router.get('/stores', async (_req, res) => {
  const { data, error } = await supabase.from('stores').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;