// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - PWA INSTALL PROMPT
// Prompts users to install app to Home Screen on mobile and desktop
// Supports Android (beforeinstallprompt) and iOS Safari instructions
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  X,
  Share,
  PlusSquare,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if already in standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Check session dismiss
    const isDismissed = sessionStorage.getItem('pwa_prompt_dismissed');

    // Handler for Chrome / Edge / Android beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isDismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Custom event to manually open prompt from anywhere
    const handleManualShow = () => {
      setIsVisible(true);
    };
    window.addEventListener('open-pwa-install', handleManualShow);

    // If on iOS and not dismissed, show prompt after 3 seconds
    if (isIosDevice && !isDismissed && !isStandalone) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('open-pwa-install', handleManualShow);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!isVisible || isInstalled) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="p-4 rounded-2xl bg-slate-900/95 border border-purple-500/40 shadow-2xl shadow-purple-950/60 backdrop-blur-md space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-900/40 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white tracking-wide">
                  Pasang Aplikasi Kasir
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  PWA
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Install ke HP atau Desktop untuk akses cepat layaknya aplikasi native.
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
            title="Tutup Notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Instructions for iOS Safari */}
        {isIos ? (
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <div className="font-semibold text-purple-300 flex items-center gap-1.5">
              <span>Cara Pasang di iPhone / iPad:</span>
            </div>
            <p className="flex items-center gap-1.5 text-slate-400">
              1. Ketuk tombol <Share className="w-3.5 h-3.5 text-cyan-400 inline" /> <strong>Bagikan (Share)</strong> di browser Safari.
            </p>
            <p className="flex items-center gap-1.5 text-slate-400">
              2. Gulir ke bawah lalu pilih <PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline" /> <strong>Tambah ke Layar Utama</strong>.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Nanti Saja
            </button>
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-950/40 transition-all hover:scale-105 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install Sekarang</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
