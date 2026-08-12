import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { supabase } from '../config/supabase';

export const switchPin = async (req: Request, res: Response) => {
  const { pin, store_id } = req.body;

  const { data: staffPins, error } = await supabase
    .from('staff_pins')
    .select('id, pin_hash, is_supervisor, profile_id, staff_name')
    .eq('store_id', store_id);

  if (error) return res.status(500).json({ message: 'Gagal ambil data PIN' });

  for (const staff of staffPins ?? []) {
    const match = await bcrypt.compare(pin, staff.pin_hash);
    if (match) {
      return res.json({
        success: true,
        staff_pin_id: staff.id,
        profile_id: staff.profile_id,
        staff_name: staff.staff_name,
        is_supervisor: staff.is_supervisor,
      });
    }
  }

  return res.status(401).json({ success: false, message: 'PIN salah' });
};

export const validatePin = async (req: Request, res: Response) => {
  const { pin, store_id } = req.body;

  const { data: supervisorPins } = await supabase
    .from('staff_pins')
    .select('pin_hash')
    .eq('store_id', store_id)
    .eq('is_supervisor', true);

  for (const sup of supervisorPins ?? []) {
    const match = await bcrypt.compare(pin, sup.pin_hash);
    if (match) return res.json({ valid: true });
  }

  return res.json({ valid: false });
};