import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getMovementsByStore = async (req: Request, res: Response) => {
  const { store_id } = req.params;

  const { data, error } = await supabase
    .from('stock_movements')
    .select('id, tipe, qty, catatan, created_at, product:products(name)')
    .eq('store_id', store_id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const createMovement = async (req: Request, res: Response) => {
  const { product_id, store_id, tipe, qty, catatan } = req.body;

  if (!product_id || !store_id || !tipe || !qty || qty <= 0) {
    return res.status(400).json({ error: 'Data stok tidak lengkap atau tidak valid' });
  }

  const { data: inventory, error: invError } = await supabase
    .from('inventories')
    .select('id, quantity')
    .eq('product_id', product_id)
    .eq('store_id', store_id)
    .single();

  if (invError || !inventory) {
    return res.status(404).json({ error: 'Data inventori untuk barang ini di toko tersebut tidak ditemukan' });
  }

  const newQty = tipe === 'masuk' ? inventory.quantity + qty : inventory.quantity - qty;

  if (newQty < 0) {
    return res.status(400).json({ error: 'Stok tidak mencukupi untuk pengurangan sebesar ini' });
  }

  await supabase.from('inventories').update({ quantity: newQty }).eq('id', inventory.id);

  const { data: movement, error: moveError } = await supabase
    .from('stock_movements')
    .insert({ product_id, store_id, tipe, qty, catatan })
    .select()
    .single();

  if (moveError) return res.status(500).json({ error: moveError.message });
  res.status(201).json({ success: true, movement, new_quantity: newQty });
};