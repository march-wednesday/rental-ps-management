// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - EDIT RENTAL MODAL
// Allows owner/cashier to edit logbook sessions, dates/times, & payment status
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { useRental } from '@/context/RentalContext';
import { useToast } from '@/context/ToastContext';
import { rentalService } from '@/services/rentalService';
import { RentalSession, PaymentStatus, RentalStatus } from '@/types';
import { formatRupiah } from '@/utils/formatters';
import { CheckCircle2, Save, X, AlertCircle, Calendar, Clock, DollarSign, User } from 'lucide-react';

interface EditRentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  rental: RentalSession | null;
  onSuccess?: () => void;
}

function extractDateAndTimeString(isoString?: string): { dateStr: string; timeStr: string } {
  if (!isoString) {
    const today = new Date().toISOString().split('T')[0];
    return { dateStr: today, timeStr: '12:00' };
  }
  try {
    const parts = isoString.split('T');
    const dateStr = parts[0] || new Date().toISOString().split('T')[0];
    let timeStr = '12:00';
    if (parts[1]) {
      timeStr = parts[1].substring(0, 5);
    }
    return { dateStr, timeStr };
  } catch {
    return { dateStr: new Date().toISOString().split('T')[0], timeStr: '12:00' };
  }
}

export const EditRentalModal: React.FC<EditRentalModalProps> = ({
  isOpen,
  onClose,
  rental,
  onSuccess,
}) => {
  const { units } = useRental();
  const { success, error } = useToast();

  const [customerName, setCustomerName] = useState('');
  const [selectedUnitCode, setSelectedUnitCode] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [sessionDate, setSessionDate] = useState('2026-10-09');
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('13:00');
  const [totalPrice, setTotalPrice] = useState(10000);
  const [totalPaid, setTotalPaid] = useState(10000);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Lunas');
  const [status, setStatus] = useState<RentalStatus>('completed');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (rental) {
      setCustomerName(rental.customerName || '');
      setSelectedUnitCode(rental.unitCode || 'PS-01');
      setDurationMinutes(rental.durationMinutes || 60);

      const startParsed = extractDateAndTimeString(rental.startTime);
      const endParsed = extractDateAndTimeString(rental.targetEndTime || rental.actualEndTime);
      setSessionDate(startParsed.dateStr);
      setStartTime(startParsed.timeStr);
      setEndTime(endParsed.timeStr);

      setTotalPrice(rental.totalPrice || 10000);
      setTotalPaid(rental.totalPaid !== undefined ? rental.totalPaid : rental.totalPrice);
      setPaymentStatus(rental.paymentStatus || 'Lunas');
      setStatus(rental.status || 'completed');
      setNotes(rental.notes || '');
    }
  }, [rental, isOpen]);

  if (!rental) return null;

  const handlePaymentStatusChange = (newStatus: PaymentStatus) => {
    setPaymentStatus(newStatus);
    if (newStatus === 'Lunas') {
      setTotalPaid(totalPrice);
    } else if (newStatus === 'Belum Bayar') {
      setTotalPaid(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      error('Nama Pelanggan Wajib Diisi', 'Silakan masukkan nama pelanggan.');
      return;
    }

    if (!sessionDate) {
      error('Tanggal Wajib Diisi', 'Silakan tentukan tanggal penggunaan konsol.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedUnit = units.find((u) => u.code === selectedUnitCode);

      const startIso = `${sessionDate}T${startTime || '12:00'}:00+08:00`;
      const endIso = `${sessionDate}T${endTime || '13:00'}:00+08:00`;

      const res = await rentalService.updateRentalSession(rental.id, {
        customerName: customerName.trim(),
        unitCode: selectedUnitCode,
        unitName: selectedUnit?.name || (selectedUnitCode === 'PS-02' ? 'PS4 Unit 2' : 'PS4 Unit 1'),
        unitId: selectedUnit?.id || (selectedUnitCode === 'PS-02' ? 'unit-ps-02' : 'unit-ps-01'),
        durationMinutes: Number(durationMinutes) || 60,
        startTime: startIso,
        targetEndTime: endIso,
        actualEndTime: status === 'completed' ? endIso : undefined,
        createdAt: startIso,
        totalPrice: Number(totalPrice) || 0,
        totalPaid: Number(totalPaid) || 0,
        paymentStatus,
        status,
        notes: notes.trim(),
      });

      if (res.success) {
        success('Data Berhasil Diperbarui', `Sesi ${rental.rentalCode} tanggal ${sessionDate} berhasil disimpan.`);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        error('Gagal Memperbarui', res.error || 'Terjadi kesalahan.');
      }
    } catch (err: any) {
      error('Kesalahan Sistem', err.message || 'Gagal menyimpan pembaruan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Sesi Rental: ${rental.rentalCode}`}
      description="Ubah tanggal penggunaan, waktu, status pembayaran, atau data pelanggan lama."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quick Payment Banner */}
        {paymentStatus !== 'Lunas' && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Sesi ini saat ini <strong>{paymentStatus}</strong> (Belum Lunas).</span>
            </div>
            <button
              type="button"
              onClick={() => handlePaymentStatusChange('Lunas')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tandai Lunas Sekarang</span>
            </button>
          </div>
        )}

        {/* TANGGAL & WAKTU PENGGUNAAN (KOREKSI DATA LAMA) */}
        <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span>Koreksi Tanggal & Jam Penggunaan Konsol</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Tanggal Bermain
              </label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Jam Mulai
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Jam Selesai
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 italic">
            * Mengubah tanggal bermain akan memperbarui posisi arsip di Logbook Harian dan Buku Kas periode yang bersangkutan.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Customer Name */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Nama Pelanggan</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Unit PS */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Unit PlayStation
            </label>
            <select
              value={selectedUnitCode}
              onChange={(e) => setSelectedUnitCode(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
            >
              {units.map((u) => (
                <option key={u.id} value={u.code}>
                  {u.code} - {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Durasi Sewa (Menit)</span>
            </label>
            <input
              type="number"
              min={15}
              step={15}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>

          {/* Status Sesi */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Status Sesi Rental
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as RentalStatus)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
            >
              <option value="completed">Selesai (Completed)</option>
              <option value="active">Sedang Main (Active)</option>
              <option value="cancelled">Dibatalkan (Cancelled)</option>
            </select>
          </div>

          {/* Total Tagihan (Biaya) */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
              <span>Total Tagihan (Rp)</span>
            </label>
            <input
              type="number"
              min={0}
              step={1000}
              value={totalPrice}
              onChange={(e) => {
                const p = Number(e.target.value);
                setTotalPrice(p);
                if (paymentStatus === 'Lunas') setTotalPaid(p);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>

          {/* Total Dibayar */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Jumlah Dibayar (Rp)
            </label>
            <input
              type="number"
              min={0}
              step={1000}
              value={totalPaid}
              onChange={(e) => {
                const paid = Number(e.target.value);
                setTotalPaid(paid);
                if (paid >= totalPrice && totalPrice > 0) {
                  setPaymentStatus('Lunas');
                } else if (paid > 0) {
                  setPaymentStatus('Sebagian');
                } else {
                  setPaymentStatus('Belum Bayar');
                }
              }}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>

          {/* Status Pembayaran */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Status Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Lunas', 'Sebagian', 'Belum Bayar'] as PaymentStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handlePaymentStatusChange(st)}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                    paymentStatus === st
                      ? st === 'Lunas'
                        ? 'bg-emerald-600/25 border-emerald-500 text-emerald-300'
                        : st === 'Sebagian'
                        ? 'bg-amber-600/25 border-amber-500 text-amber-300'
                        : 'bg-rose-600/25 border-rose-500 text-rose-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'Belum Bayar' ? 'Belum Bayar (CU)' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Catatan Logbook
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan kasir/operator..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-950/40 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
