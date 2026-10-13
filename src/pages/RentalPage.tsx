// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - PENYEWAAN & LIVE TIMER PAGE
// Operasional utama kasir: PS-01 & PS-02 dengan timer presisi server
// ==============================================================================

import React, { useState } from 'react';
import { useRental } from '@/context/RentalContext';
import { UnitCard } from '@/features/rental/UnitCard';
import { StartRentalModal } from '@/features/rental/StartRentalModal';
import { ExtendRentalModal } from '@/features/rental/ExtendRentalModal';
import { PaymentModal } from '@/features/rental/PaymentModal';
import { RentalSession } from '@/types';
import { Plus, Radio, Clock, ShieldAlert } from 'lucide-react';
import { Modal } from '@/components/common/Modal';

export const RentalPage: React.FC = () => {
  const {
    units,
    activeRentals,
    timerCalculations,
    completeRental,
    cancelRental,
  } = useRental();

  // Modals state
  const [startRentalUnitId, setStartRentalUnitId] = useState<string | null>(null);
  const [extendTargetRental, setExtendTargetRental] = useState<RentalSession | null>(null);
  const [paymentTargetRental, setPaymentTargetRental] = useState<RentalSession | null>(null);
  const [cancelTargetRental, setCancelTargetRental] = useState<RentalSession | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const handleStart = (unitId: string) => {
    setStartRentalUnitId(unitId);
  };

  const handleExtend = (rental: RentalSession) => {
    setExtendTargetRental(rental);
  };

  const handlePayment = (rental: RentalSession) => {
    setPaymentTargetRental(rental);
  };

  const handleCancelClick = (rental: RentalSession) => {
    setCancelTargetRental(rental);
    setCancelReason('');
  };

  const handleConfirmCancel = async () => {
    if (!cancelTargetRental) return;
    await cancelRental(cancelTargetRental.id, cancelReason);
    setCancelTargetRental(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900 border border-purple-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
            <Radio className="w-4 h-4 animate-pulse text-purple-400" />
            <span>Operasional Live Kasir</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">
            Manajemen Unit & Timer Rental
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Pantau ketersediaan konsol PlayStation, sisa waktu penyewaan secara real-time, dan catat transaksi kas masuk.
          </p>
        </div>

        <button
          onClick={() => setStartRentalUnitId(units[0]?.id || '')}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-950/50 transition-all hover:scale-[1.02] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Mulai Sewa Baru</span>
        </button>
      </div>

      {/* Main Grid: PS-01 & PS-02 Unit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {units.map((unit) => {
          const activeRental = activeRentals.find((r) => r.unitId === unit.id);
          const timerCalc = activeRental ? timerCalculations[activeRental.id] : undefined;

          return (
            <UnitCard
              key={unit.id}
              unit={unit}
              activeRental={activeRental}
              timerCalc={timerCalc}
              onStartRental={handleStart}
              onExtendRental={handleExtend}
              onCompleteRental={completeRental}
              onCancelRental={handleCancelClick}
              onRecordPayment={handlePayment}
            />
          );
        })}
      </div>

      {/* Quick Operation Guide */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-400">
        <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-300 block mb-0.5">Ketentuan Timer Otomatis</span>
          <span>
            Waktu dihitung menggunakan timestamp database absolut (WITA). Notifikasi peringatan akan otomatis berbunyi pada 10 menit dan 5 menit sebelum waktu berakhir. Apabila waktu habis, sesi tidak akan diputus otomatis dan status akan berubah menjadi "Waktu Habis" sampai kasir menyelesaikan atau menambah waktu.
          </span>
        </div>
      </div>

      {/* MODALS */}
      {startRentalUnitId && (
        <StartRentalModal
          isOpen={Boolean(startRentalUnitId)}
          onClose={() => setStartRentalUnitId(null)}
          defaultUnitId={startRentalUnitId}
        />
      )}

      {extendTargetRental && (
        <ExtendRentalModal
          isOpen={Boolean(extendTargetRental)}
          onClose={() => setExtendTargetRental(null)}
          rental={extendTargetRental}
        />
      )}

      {paymentTargetRental && (
        <PaymentModal
          isOpen={Boolean(paymentTargetRental)}
          onClose={() => setPaymentTargetRental(null)}
          rental={paymentTargetRental}
        />
      )}

      {/* Cancel Rental Modal */}
      {cancelTargetRental && (
        <Modal
          isOpen={Boolean(cancelTargetRental)}
          onClose={() => setCancelTargetRental(null)}
          title="Batalkan Sesi Rental"
          description={`Unit: ${cancelTargetRental.unitName} - Pelanggan: ${cancelTargetRental.customerName}`}
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Pembatalan sesi akan mengembalikan status unit menjadi Tersedia. Pembatalan hanya diizinkan bila belum ada pembayaran yang diterima.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Alasan Pembatalan <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Contoh: Pelanggan mendadak pergi, salah pilih unit"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCancelTargetRental(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/40"
              >
                Konfirmasi Pembatalan
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
