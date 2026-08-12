import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

// Admin Cabang: ajukan permintaan stok baru
export const createStockRequest = async (req: Request, res: Response) => {
  const { from_store_id, product_id, qty_requested, requested_by } = req.body;

  if (!from_store_id || !product_id || !qty_requested || qty_requested <= 0) {
    return res.status(400).json({ error: 'Data pengajuan tidak lengkap atau tidak valid' });
  }

  const { data, error } = await supabase
    .from('stock_requests')
    .insert({ from_store_id, product_id, qty_requested, requested_by, status: 'pending' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ success: true, request: data });
};

// Admin Cabang: lihat riwayat pengajuan miliknya
export const getStockRequestsByStore = async (req: Request, res: Response) => {
  const { store_id } = req.params;

  const { data, error } = await supabase
    .from('stock_requests')
    .select('id, qty_requested, status, reject_reason, created_at, product:products(name)')
    .eq('from_store_id', store_id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// Admin Pusat: lihat semua pengajuan yang masih pending dari seluruh cabang
export const getPendingStockRequests = async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('stock_requests')
    .select('id, qty_requested, status, created_at, product:products(id, name), from_store:stores(id, name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// Admin Pusat: setujui pengajuan -> pindahkan stok dari gudang pusat ke cabang
export const approveStockRequest = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { approved_by, pusat_store_id } = req.body;

  const { data: request, error: reqError } = await supabase
    .from('stock_requests')
    .select('id, product_id, qty_requested, from_store_id, status')
    .eq('id', id)
    .single();

  if (reqError || !request) return res.status(404).json({ error: 'Pengajuan tidak ditemukan' });
  if (request.status !== 'pending') return res.status(400).json({ error: 'Pengajuan sudah diproses sebelumnya' });

  // cek stok gudang pusat cukup atau tidak
  const { data: pusatInventory } = await supabase
    .from('inventories')
    .select('id, quantity')
    .eq('product_id', request.product_id)
    .eq('store_id', pusat_store_id)
    .single();

  if (!pusatInventory || pusatInventory.quantity < request.qty_requested) {
    return res.status(400).json({ error: 'Stok gudang pusat tidak mencukupi untuk menyetujui permintaan ini' });
  }

  // kurangi stok pusat
  await supabase
    .from('inventories')
    .update({ quantity: pusatInventory.quantity - request.qty_requested })
    .eq('id', pusatInventory.id);

  // tambah stok cabang (kalau baris inventori cabang belum ada, buat baru)
  const { data: cabangInventory } = await supabase
    .from('inventories')
    .select('id, quantity')
    .eq('product_id', request.product_id)
    .eq('store_id', request.from_store_id)
    .single();

  if (cabangInventory) {
    await supabase
      .from('inventories')
      .update({ quantity: cabangInventory.quantity + request.qty_requested })
      .eq('id', cabangInventory.id);
  } else {
    await supabase
      .from('inventories')
      .insert({ product_id: request.product_id, store_id: request.from_store_id, quantity: request.qty_requested });
  }

  // update status pengajuan
  const { data: updated, error: updateError } = await supabase
    .from('stock_requests')
    .update({ status: 'approved', approved_by })
    .eq('id', id)
    .select()
    .single();

  if (updateError) return res.status(500).json({ error: updateError.message });
  res.json({ success: true, request: updated });
};

// Admin Pusat: tolak pengajuan
export const rejectStockRequest = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { approved_by, reject_reason } = req.body;

  const { data, error } = await supabase
    .from('stock_requests')
    .update({ status: 'rejected', approved_by, reject_reason })
    .eq('id', id)
    .eq('status', 'pending')
    .select()
    .single();

  if (error || !data) return res.status(400).json({ error: 'Gagal menolak, pengajuan mungkin sudah diproses' });
  res.json({ success: true, request: data });
};