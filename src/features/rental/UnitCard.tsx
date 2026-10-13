// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - UNIT CARD COMPONENT
// Visual card for PS-01 and PS-02 with real-time countdown & atomic action buttons
// ==============================================================================

import React, { useState } from 'react';
import {
  Gamepad2,
  Tv,
  Clock,
  User,
  PlusCircle,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
} from 'lucide-react';
import { PSUnit, RentalSession } from '@/types';
import { RemainingTimeCalculation, formatTimeOnly } from '@/utils/dateUtils';
import { formatRupiah, formatDuration } from '@/utils/formatters';
import { Badge } from '@/components/common/Badge';

interface UnitCardProps {
  unit: PSUnit;
  activeRental?: RentalSession;
  timerCalc?: RemainingTimeCalculation;
  onStartRental: (unitId: string) => void;
  onExtendRental: (rental: RentalSession) => void;
  onCompleteRental: (rentalId: string) => void;
  onCancelRental: (rental: RentalSession) => void;
  onRecordPayment: (rental: RentalSession) => void;
}

export const UnitCard: React.FC<UnitCardProps> = ({
  unit,
  activeRental,
  timerCalc,
  onStartRental,
  onExtendRental,
  onCompleteRental,
  onCancelRental,
  onRecordPayment,
}) => {
  const [confirmComplete, setConfirmComplete] = useState(false);

  const isRented = unit.status === 'Sedang Disewa' && activeRental;
  const isAvailable = unit.status === 'Tersedia';

  // Determine card border & glow based on timer state
  let cardBorder = 'border-slate-800 bg-slate-900/60';
  let timerBadgeColor = 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30';

  if (isAvailable) {
    cardBorder = 'border-emerald-500/30 bg-slate-900/70 shadow-lg shadow-emerald-950/10';
  } else if (isRented) {
    if (timerCalc?.isExpired) {
      cardBorder = 'border-rose-500/60 bg-rose-950/20 shadow-xl shadow-rose-950/30 animate-pulse-subtle';
      timerBadgeColor = 'text-rose-400 bg-rose-950/80 border-rose-500/50';
    } else if (timerCalc?.isWarning5Min) {
      cardBorder = 'border-amber-500/60 bg-amber-950/20 shadow-xl shadow-amber-950/20';
      timerBadgeColor = 'text-amber-400 bg-amber-950/80 border-amber-500/50';
    } else if (timerCalc?.isWarning10Min) {
      cardBorder = 'border-amber-500/40 bg-slate-900/80 shadow-lg shadow-amber-950/15';
      timerBadgeColor = 'text-amber-300 bg-amber-950/50 border-amber-500/40';
    } else {
      cardBorder = 'border-purple-500/40 bg-slate-900/80 shadow-lg shadow-purple-950/20';
    }
  }

  return (
    <div className={`rounded-2xl border p-5 transition-all duration-300 ${cardBorder} flex flex-col justify-between`}>
      {/* Top Header: Unit Code, Name & Status */}
      <div>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl border ${
              isAvailable 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : isRented 
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-800/60">
                  {unit.code}
                </span>
                <span className="text-sm font-bold text-white tracking-wide">{unit.name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <Tv className="w-3.5 h-3.5" />
                  {unit.consoleType}
                </span>
                <span>•</span>
                <span>{formatRupiah(unit.hourlyRate)}/jam</span>
              </div>
            </div>
          </div>

          {/* Unit Status Badge */}
          <Badge
            variant={
              unit.status === 'Tersedia'
                ? 'success'
                : unit.status === 'Sedang Disewa'
                ? 'purple'
                : 'danger'
            }
            dot
          >
            {unit.status}
          </Badge>
        </div>

        {/* Notes / Equipment Detail */}
        {unit.notes && (
          <p className="text-[11px] text-slate-400 mt-3 line-clamp-1 italic">
            {unit.notes}
          </p>
        )}

        {/* ACTIVE SESSION DETAILS */}
        {isRented && activeRental && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
            {/* Customer & Start Time */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <User className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-semibold text-white">{activeRental.customerName}</span>
                {activeRental.customerPhone && (
                  <span className="text-slate-500 text-[10px]">({activeRental.customerPhone})</span>
                )}
              </div>
              <span className="text-[11px] text-slate-400">
                Mulai: {formatTimeOnly(activeRental.startTime)}
              </span>
            </div>

            {/* BIG LIVE TIMER DISPLAY */}
            <div className={`p-4 rounded-xl border text-center transition-all ${timerBadgeColor}`}>
              <div className="text-[11px] uppercase tracking-wider font-semibold opacity-90 flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {timerCalc?.isExpired ? 'WAKTU HABIS' : 'SISA WAKTU'}
              </div>
              <div className="text-3xl font-extrabold font-mono tracking-wider my-1">
                {timerCalc?.formattedText || '00:00'}
              </div>
              <div className="text-[11px] opacity-80">
                Target Selesai: {formatTimeOnly(activeRental.targetEndTime)} ({formatDuration(activeRental.durationMinutes)})
              </div>
            </div>

            {/* Financial Overview for this rental */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Total Tagihan</span>
                <span className="font-bold text-white font-mono">
                  {formatRupiah(activeRental.totalPrice)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Terbayar</span>
                <span className="font-semibold text-emerald-400 font-mono">
                  {formatRupiah(activeRental.totalPaid)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Status</span>
                <Badge
                  variant={
                    activeRental.paymentStatus === 'Lunas'
                      ? 'success'
                      : activeRental.paymentStatus === 'Sebagian'
                      ? 'warning'
                      : 'danger'
                  }
                  size="sm"
                >
                  {activeRental.paymentStatus}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ACTION BUTTONS (BOTTOM) */}
      <div className="mt-5 pt-3 border-t border-slate-800/60">
        {isAvailable && (
          <button
            onClick={() => onStartRental(unit.id)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.01]"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Mulai Sewa Unit Ini</span>
          </button>
        )}

        {isRented && activeRental && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {/* Tambah Waktu */}
              <button
                onClick={() => onExtendRental(activeRental)}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 text-xs font-semibold transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Tambah Waktu</span>
              </button>

              {/* Catat Pembayaran */}
              <button
                onClick={() => onRecordPayment(activeRental)}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  activeRental.paymentStatus === 'Lunas'
                    ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    : 'bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-500/40 text-emerald-200'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{activeRental.paymentStatus === 'Lunas' ? 'Rincian Bayar' : 'Bayar'}</span>
              </button>
            </div>

            {/* Selesaikan Sewa or Confirmation */}
            {!confirmComplete ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfirmComplete(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Selesaikan Sewa</span>
                </button>
                <button
                  onClick={() => onCancelRental(activeRental)}
                  title="Batalkan Sesi"
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-slate-950 border border-amber-500/40 flex items-center justify-between text-xs animate-in fade-in">
                <div className="flex items-center gap-1.5 text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Selesaikan sewa sekarang?</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setConfirmComplete(false)}
                    className="px-2 py-1 rounded-lg text-slate-400 hover:text-white text-[11px]"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      setConfirmComplete(false);
                      onCompleteRental(activeRental.id);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px]"
                  >
                    Ya, Selesai
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
