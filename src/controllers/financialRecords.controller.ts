import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getFinancialRecordsByStore = async (req: Request, res: Response) => {
  const { store_id } = req.params;

  const { data, error } = await supabase
    .from('financial_records')
    .select('id, tanggal, deskripsi, kategori, tipe, nominal, dibuat_oleh')
    .eq('store_id', store_id)
    .order('tanggal', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const createFinancialRecord = async (req: Request, res: Response) => {
  const { store_id, deskripsi, kategori, nominal, dibuat_oleh } = req.body;

  if (!store_id || !deskripsi || !nominal || nominal <= 0) {
    return res.status(400).json({ error: 'Data pengeluaran tidak lengkap atau tidak valid' });
  }

  const { data, error } = await supabase
    .from('financial_records')
    .insert({
      store_id,
      deskripsi,
      kategori: kategori || 'Operasional',
      tipe: 'pengeluaran',
      nominal,
      dibuat_oleh,
      tanggal: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ success: true, record: data });
};