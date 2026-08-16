import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

const STATUS_ORDER = ['dilaporkan', 'dicek', 'diperbaiki', 'selesai'];

export const createTicket = async (req: Request, res: Response) => {
  const { store_id, machine_name, description, urgency, reported_by } = req.body;

  if (!store_id || !machine_name || !urgency) {
    return res.status(400).json({ error: 'Data laporan kerusakan tidak lengkap' });
  }

  const { data: ticket, error } = await supabase
    .from('machine_tickets')
    .insert({ store_id, machine_name, description, urgency, reported_by, status: 'dilaporkan' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await supabase.from('ticket_logs').insert({
    ticket_id: ticket.id,
    status: 'dilaporkan',
    note: 'Tiket dibuat oleh staf cabang',
  });

  res.status(201).json({ success: true, ticket });
};

export const getTickets = async (req: Request, res: Response) => {
  const { active_only, urgency } = req.query;

  let query = supabase
    .from('machine_tickets')
    .select('id, machine_name, description, urgency, status, sparepart_needed, sparepart_fulfilled, created_at, updated_at, store:stores(name)')
    .order('created_at', { ascending: false });

  if (active_only === 'true') {
    query = query.neq('status', 'selesai');
  } else {
    query = query.eq('status', 'selesai');
  }

  if (urgency && urgency !== 'semua') {
    query = query.eq('urgency', urgency);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const getTicketDetail = async (req: Request, res: Response) => {
  const { id } = req.params;

  const { data: ticket, error } = await supabase
    .from('machine_tickets')
    .select('*, store:stores(name)')
    .eq('id', id)
    .single();

  if (error || !ticket) return res.status(404).json({ error: 'Tiket tidak ditemukan' });

  const { data: logs } = await supabase
    .from('ticket_logs')
    .select('*')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true });

  res.json({ ticket, logs: logs ?? [] });
};

export const updateTicketStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, note, mechanic_id } = req.body;

  const { data: ticket, error: fetchError } = await supabase
    .from('machine_tickets')
    .select('status')
    .eq('id', id)
    .single();

  if (fetchError || !ticket) return res.status(404).json({ error: 'Tiket tidak ditemukan' });

  const currentIndex = STATUS_ORDER.indexOf(ticket.status);
  const newIndex = STATUS_ORDER.indexOf(status);

  if (newIndex !== currentIndex + 1) {
    return res.status(400).json({ error: 'Perubahan status harus berurutan, tidak boleh melompat tahap' });
  }

  const { data: updated, error: updateError } = await supabase
    .from('machine_tickets')
    .update({ status, assigned_mechanic: mechanic_id, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (updateError) return res.status(500).json({ error: updateError.message });

  await supabase.from('ticket_logs').insert({ ticket_id: id, status, note });

  res.json({ success: true, ticket: updated });
};

export const updateSparepartInfo = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { sparepart_needed } = req.body;

  const { data, error } = await supabase
    .from('machine_tickets')
    .update({ sparepart_needed, sparepart_fulfilled: false })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await supabase.from('ticket_logs').insert({
    ticket_id: id,
    status: 'dicek',
    note: `Membutuhkan sparepart: ${sparepart_needed}`,
  });

  res.json({ success: true, ticket: data });
};

export const markSparepartFulfilled = async (req: Request, res: Response) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('machine_tickets')
    .update({ sparepart_fulfilled: true })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await supabase.from('ticket_logs').insert({
    ticket_id: id,
    status: 'dicek',
    note: 'Sparepart telah dibeli/tersedia',
  });

  res.json({ success: true, ticket: data });
};