import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getAllProducts = async (_req: Request, res: Response) => {
  const { data, error } = await supabase.from('products').select('*').order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const createProduct = async (req: Request, res: Response) => {
  const { name, sku, price, tipe, store_id, initial_qty } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: 'Nama dan harga barang wajib diisi' });
  }

  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({ name, sku, price, tipe: tipe || 'barang' })
    .select()
    .single();

  if (productError) return res.status(500).json({ error: productError.message });

  if (store_id) {
    await supabase.from('inventories').insert({
      product_id: product.id,
      store_id,
      quantity: initial_qty || 0,
    });
  }

  res.status(201).json({ success: true, product });
};