import { Router } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

router.post('/', async (req, res) => {
  const { store_id, items, payment_method } = req.body;
  // items = [{ product_id, qty }, ...]

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Item transaksi kosong' });
  }

  let total = 0;
  const validatedItems = [];

  // validasi stok & hitung total
  for (const item of items) {
    const { data: product } = await supabase
      .from('products')
      .select('id, price')
      .eq('id', item.product_id)
      .single();

    const { data: inventory } = await supabase
      .from('inventories')
      .select('id, quantity')
      .eq('product_id', item.product_id)
      .eq('store_id', store_id)
      .single();

    if (!product || !inventory) {
      return res.status(404).json({ error: `Produk tidak ditemukan` });
    }
    if (inventory.quantity < item.qty) {
      return res.status(400).json({ error: `Stok tidak cukup untuk produk ${item.product_id}` });
    }

    const subtotal = product.price * item.qty;
    total += subtotal;
    validatedItems.push({ ...item, subtotal, inventory_id: inventory.id, current_qty: inventory.quantity });
  }

  // simpan transaksi utama
  const { data: transaction, error: trxError } = await supabase
    .from('transactions')
    .insert({ store_id, total, payment_method })
    .select()
    .single();

  if (trxError) return res.status(500).json({ error: trxError.message });

  // simpan detail item + kurangi stok
 for (const item of validatedItems) {
    await supabase.from('transaction_items').insert({
      transaction_id: transaction.id,
      product_id: item.product_id,
      qty: item.qty,
      subtotal: item.subtotal,
    });

    await supabase
      .from('inventories')
      .update({ quantity: item.current_qty - item.qty })
      .eq('id', item.inventory_id);

    // catat jejak pergerakan stok akibat transaksi ini
    await supabase.from('stock_movements').insert({
      product_id: item.product_id,
      store_id,
      tipe: 'keluar',
      qty: item.qty,
      catatan: `Transaksi kasir #${transaction.id.slice(0, 8)}`,
    });
  }

  res.status(201).json({ success: true, transaction_id: transaction.id, total });
});

export default router;