// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - OWNER PIN VERIFICATION MODAL
// Touch keypad & keyboard support with security feedback
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  ShieldCheck,
  Lock,
  X,
  Delete,
  RotateCcw,
  AlertCircle,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

export const OwnerPinModal: React.FC = () => {
  const {
    isPinModalOpen,
    closePinModal,
    unlockOwnerWithPin,
    ownerPin,
    targetPathAfterUnlock,
  } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [pin, setPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isShake, setIsShake] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset and focus when modal opens
  useEffect(() => {
    if (isPinModalOpen) {
      setPin('');
      setErrorMessage(null);
      setIsSubmitting(false);
      setIsShake(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isPinModalOpen]);

  if (!isPinModalOpen) return null;

  const handleKeyClick = (val: string) => {
    if (pin.length < 6) {
      const nextPin = pin + val;
      setPin(nextPin);
      setErrorMessage(null);
      // Auto verify if reached length of ownerPin
      if (nextPin.length === ownerPin.length) {
        handleSubmit(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handleClear = () => {
    setPin('');
    setErrorMessage(null);
  };

  const handleSubmit = async (pinToSubmit = pin) => {
    if (!pinToSubmit) {
      setErrorMessage('Silakan masukkan PIN Owner.');
      return;
    }

    setIsSubmitting(true);
    const result = await unlockOwnerWithPin(pinToSubmit);

    if (result.success) {
      success('Mode Owner Terbuka', 'Akses penuh laporan keuangan & pengaturan telah aktif.');
      closePinModal();
      if (targetPathAfterUnlock) {
        navigate(targetPathAfterUnlock);
      } else {
        navigate('/dashboard');
      }
    } else {
      setIsSubmitting(false);
      setErrorMessage(result.error || 'PIN salah!');
      setIsShake(true);
      setTimeout(() => setIsShake(false), 500);
      setPin('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closePinModal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-sm rounded-3xl bg-slate-900 border border-purple-500/30 shadow-2xl shadow-purple-950/50 p-6 space-y-6 relative transition-all ${
          isShake ? 'animate-bounce' : ''
        }`}
      >
        {/* Close Button */}
        <button
          onClick={closePinModal}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Tutup / Batal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">
              Beralih ke Mode Owner
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Masukkan PIN keamanan untuk membuka akses keuangan, laporan, dan pengaturan.
            </p>
          </div>
        </div>

        {/* Hidden Input for physical keyboard typing */}
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            setPin(val);
            setErrorMessage(null);
            if (val.length === ownerPin.length) {
              handleSubmit(val);
            }
          }}
          onKeyDown={handleKeyDown}
          className="opacity-0 absolute -top-10 left-0 pointer-events-none w-1 h-1"
          autoFocus
        />

        {/* Masked PIN Dots Indicator */}
        <div
          onClick={() => inputRef.current?.focus()}
          className="flex items-center justify-center gap-3.5 py-3 cursor-pointer select-none"
        >
          {Array.from({ length: Math.max(4, ownerPin.length) }).map((_, idx) => {
            const isFilled = idx < pin.length;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-purple-400 scale-125 shadow-lg shadow-purple-500/60 ring-2 ring-purple-300'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs justify-center animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Numeric Touch Keypad */}
        <div className="grid grid-cols-3 gap-2.5 select-none">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyClick(digit)}
              className="h-13 rounded-2xl bg-slate-800/80 hover:bg-purple-600/20 active:bg-purple-600/40 border border-slate-700/60 hover:border-purple-500/40 text-lg font-semibold text-white shadow-sm transition-all hover:scale-[1.03] active:scale-[0.97] flex items-center justify-center"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-13 rounded-2xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all flex items-center justify-center uppercase tracking-wider"
          >
            Hapus
          </button>
          <button
            type="button"
            onClick={() => handleKeyClick('0')}
            className="h-13 rounded-2xl bg-slate-800/80 hover:bg-purple-600/20 active:bg-purple-600/40 border border-slate-700/60 hover:border-purple-500/40 text-lg font-semibold text-white shadow-sm transition-all hover:scale-[1.03] active:scale-[0.97] flex items-center justify-center"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-13 rounded-2xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 text-slate-300 hover:text-white transition-all flex items-center justify-center"
            title="Backspace"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Footer Hint & Default PIN info */}
        <div className="pt-2 border-t border-slate-800/80 text-center space-y-2">
          {ownerPin === '1234' && (
            <div className="text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-xl py-1 px-2.5 inline-block">
              PIN Bawaan (Default): <span className="font-mono font-bold">1234</span>
            </div>
          )}
          <p className="text-[11px] text-slate-500">
            Anda dapat mengubah PIN kapan saja di menu <span className="text-purple-400">Pengaturan Aplikasi</span>.
          </p>
        </div>
      </div>
    </div>
  );
};
