// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - RENTAL CONTEXT & ACTIVE TIMER TICKER
// Provides live state, 1-second reactive countdown, and sound/alert notifications
// ==============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { localEngine } from '@/lib/mockEngine';
import { rentalService } from '@/services/rentalService';
import { financeService } from '@/services/financeService';
import { PSUnit, RentalSession, TariffPackage, PaymentMethod } from '@/types';
import { calculateRemainingTime, RemainingTimeCalculation } from '@/utils/dateUtils';
import { useToast } from './ToastContext';
import { useOfflineSync } from './OfflineSyncContext';

interface RentalContextType {
  units: PSUnit[];
  activeRentals: RentalSession[];
  tariffPackages: TariffPackage[];
  refreshData: () => void;
  // Timer calculation map by rental ID
  timerCalculations: Record<string, RemainingTimeCalculation>;
  // Operations
  startRental: (params: {
    unitId: string;
    customerName: string;
    customerPhone?: string;
    tariffPackageId?: string;
    durationMinutes: number;
    notes?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  extendRental: (params: {
    rentalId: string;
    additionalMinutes: number;
    additionalPrice: number;
  }) => Promise<{ success: boolean; error?: string }>;
  completeRental: (rentalId: string) => Promise<{ success: boolean; error?: string }>;
  cancelRental: (rentalId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
  recordPayment: (params: {
    rentalId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  createUnit: (params: {
    code: string;
    name: string;
    consoleType: string;
    hourlyRate: number;
    status?: 'Tersedia' | 'Sedang Disewa' | 'Maintenance' | 'Nonaktif';
    notes?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  updateUnit: (unitId: string, params: Partial<PSUnit>) => Promise<{ success: boolean; error?: string }>;
  deleteUnit: (unitId: string) => Promise<{ success: boolean; error?: string }>;
  isSubmitting: boolean;
}

const RentalContext = createContext<RentalContextType | undefined>(undefined);

export const RentalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { warning, info, success } = useToast();
  const { enqueueMutation, isOnline } = useOfflineSync();
  const [units, setUnits] = useState<PSUnit[]>([]);
  const [activeRentals, setActiveRentals] = useState<RentalSession[]>([]);
  const [tariffPackages, setTariffPackages] = useState<TariffPackage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timerCalculations, setTimerCalculations] = useState<Record<string, RemainingTimeCalculation>>({});

  // Track notified warnings so we don't spam notifications
  const [notifiedWarnings, setNotifiedWarnings] = useState<Record<string, { tenMin?: boolean; fiveMin?: boolean; expired?: boolean }>>({});

  const loadData = useCallback(async () => {
    const fetchedUnits = await rentalService.getUnits();
    const fetchedRentals = await rentalService.getRentals(true);
    const fetchedTariffs = await rentalService.getTariffPackages();

    setUnits(fetchedUnits);
    setActiveRentals(fetchedRentals);
    setTariffPackages(fetchedTariffs);
  }, []);

  useEffect(() => {
    loadData();
    // Subscribe to localEngine state changes
    const unsubscribe = localEngine.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  // 1-second reactive ticker for real-time countdown calculations
  useEffect(() => {
    const tick = () => {
      if (activeRentals.length === 0) {
        setTimerCalculations({});
        return;
      }

      const calcs: Record<string, RemainingTimeCalculation> = {};

      activeRentals.forEach((rental) => {
        const calc = calculateRemainingTime(rental.targetEndTime);
        calcs[rental.id] = calc;

        // Check for warning notifications
        const rentalNotifs = notifiedWarnings[rental.id] || {};

        if (calc.isWarning10Min && !rentalNotifs.tenMin) {
          warning(
            `Waktu Tersisa 10 Menit: ${rental.unitName}`,
            `Pelanggan: ${rental.customerName}. Persiapkan perpanjangan atau penyelesaian sewa.`
          );
          setNotifiedWarnings((prev) => ({
            ...prev,
            [rental.id]: { ...prev[rental.id], tenMin: true },
          }));
        }

        if (calc.isWarning5Min && !rentalNotifs.fiveMin) {
          warning(
            `Waktu Tersisa 5 Menit: ${rental.unitName}`,
            `Pelanggan: ${rental.customerName}. Waktu sewa hampir habis!`
          );
          setNotifiedWarnings((prev) => ({
            ...prev,
            [rental.id]: { ...prev[rental.id], fiveMin: true },
          }));
        }

        if (calc.isExpired && !rentalNotifs.expired) {
          warning(
            `WAKTU SEWA HABIS: ${rental.unitName}`,
            `Pelanggan: ${rental.customerName}. Sesi telah mencapai batas waktu!`
          );
          setNotifiedWarnings((prev) => ({
            ...prev,
            [rental.id]: { ...prev[rental.id], expired: true },
          }));
        }
      });

      setTimerCalculations(calcs);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeRentals, notifiedWarnings, warning]);

  const startRental = async (params: {
    unitId: string;
    customerName: string;
    customerPhone?: string;
    tariffPackageId?: string;
    durationMinutes: number;
    notes?: string;
  }) => {
    if (isSubmitting) return { success: false, error: 'Permintaan sedang diproses.' };
    setIsSubmitting(true);
    try {
      const res = await rentalService.startRental(params);
      if (!res.success) {
        setIsSubmitting(false);
        return { success: false, error: res.error || 'Gagal memulai rental' };
      }
      enqueueMutation('START_RENTAL', params);
      success('Sewa Berhasil Dimulai', `Unit sedang berjalan dengan timer aktif.${!isOnline ? ' (Tersimpan Offline)' : ''}`);
      await loadData();
      setIsSubmitting(false);
      return { success: true };
    } catch (e: any) {
      setIsSubmitting(false);
      return { success: false, error: e.message || 'Terjadi kesalahan' };
    }
  };

  const extendRental = async (params: {
    rentalId: string;
    additionalMinutes: number;
    additionalPrice: number;
  }) => {
    if (isSubmitting) return { success: false, error: 'Permintaan sedang diproses.' };
    setIsSubmitting(true);
    try {
      const res = await rentalService.extendRental(params);
      if (!res.success) {
        setIsSubmitting(false);
        return { success: false, error: res.error || 'Gagal menambah waktu' };
      }
      enqueueMutation('EXTEND_RENTAL', params);
      info('Waktu Sewa Diperpanjang', `Tambahan durasi berhasil diperbarui.${!isOnline ? ' (Tersimpan Offline)' : ''}`);
      // Reset notifications for this rental
      setNotifiedWarnings((prev) => ({
        ...prev,
        [params.rentalId]: {},
      }));
      await loadData();
      setIsSubmitting(false);
      return { success: true };
    } catch (e: any) {
      setIsSubmitting(false);
      return { success: false, error: e.message || 'Terjadi kesalahan' };
    }
  };

  const completeRental = async (rentalId: string) => {
    if (isSubmitting) return { success: false, error: 'Permintaan sedang diproses.' };
    setIsSubmitting(true);
    try {
      const res = await rentalService.completeRental(rentalId);
      if (!res.success) {
        setIsSubmitting(false);
        return { success: false, error: res.error || 'Gagal menyelesaikan sewa' };
      }
      enqueueMutation('COMPLETE_RENTAL', { rentalId });
      success('Sewa Selesai', `Unit PlayStation kembali berstatus Tersedia.${!isOnline ? ' (Tersimpan Offline)' : ''}`);
      await loadData();
      setIsSubmitting(false);
      return { success: true };
    } catch (e: any) {
      setIsSubmitting(false);
      return { success: false, error: e.message || 'Terjadi kesalahan' };
    }
  };

  const cancelRental = async (rentalId: string, reason: string) => {
    if (isSubmitting) return { success: false, error: 'Permintaan sedang diproses.' };
    setIsSubmitting(true);
    try {
      const res = await rentalService.cancelRental(rentalId, reason);
      if (!res.success) {
        setIsSubmitting(false);
        return { success: false, error: res.error || 'Gagal membatalkan sewa' };
      }
      enqueueMutation('CANCEL_RENTAL', { rentalId, reason });
      info('Sewa Dibatalkan', `Sesi dihentikan dan unit kembali Tersedia.${!isOnline ? ' (Tersimpan Offline)' : ''}`);
      await loadData();
      setIsSubmitting(false);
      return { success: true };
    } catch (e: any) {
      setIsSubmitting(false);
      return { success: false, error: e.message || 'Terjadi kesalahan' };
    }
  };

  const recordPayment = async (params: {
    rentalId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  }) => {
    if (isSubmitting) return { success: false, error: 'Permintaan sedang diproses.' };
    setIsSubmitting(true);
    try {
      const res = await financeService.recordPayment(params);
      if (!res.success) {
        setIsSubmitting(false);
        return { success: false, error: res.error || 'Gagal mencatat pembayaran' };
      }
      enqueueMutation('PAYMENT', params);
      success('Pembayaran Diterima', `Kas masuk otomatis tercatat di Buku Kas Harian.${!isOnline ? ' (Tersimpan Offline)' : ''}`);
      await loadData();
      setIsSubmitting(false);
      return { success: true };
    } catch (e: any) {
      setIsSubmitting(false);
      return { success: false, error: e.message || 'Terjadi kesalahan' };
    }
  };

  const createUnit = async (params: {
    code: string;
    name: string;
    consoleType: string;
    hourlyRate: number;
    status?: 'Tersedia' | 'Sedang Disewa' | 'Maintenance' | 'Nonaktif';
    notes?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setIsSubmitting(true);
    const res = await rentalService.createUnit(params);
    if (res.success) {
      success('Unit Berhasil Ditambahkan', `Unit ${params.code} (${params.name}) telah aktif.`);
      await loadData();
      setIsSubmitting(false);
      return { success: true };
    } else {
      setIsSubmitting(false);
      return { success: false, error: res.error || 'Gagal menambahkan unit' };
    }
  };

  const updateUnit = async (unitId: string, params: Partial<PSUnit>): Promise<{ success: boolean; error?: string }> => {
    setIsSubmitting(true);
    const res = await rentalService.updateUnit(unitId, params);
    if (res.success) {
      success('Unit Diperbarui', 'Data unit PlayStation berhasil diperbarui.');
      await loadData();
      setIsSubmitting(false);
      return { success: true };
    } else {
      setIsSubmitting(false);
      return { success: false, error: res.error || 'Gagal memperbarui unit' };
    }
  };

  const deleteUnit = async (unitId: string): Promise<{ success: boolean; error?: string }> => {
    setIsSubmitting(true);
    const res = await rentalService.deleteUnit(unitId);
    if (res.success) {
      info('Unit Dihapus', 'Unit telah dihapus dari daftar sistem.');
      await loadData();
      setIsSubmitting(false);
      return { success: true };
    } else {
      setIsSubmitting(false);
      return { success: false, error: res.error || 'Gagal menghapus unit' };
    }
  };

  return (
    <RentalContext.Provider
      value={{
        units,
        activeRentals,
        tariffPackages,
        refreshData: loadData,
        timerCalculations,
        startRental,
        extendRental,
        completeRental,
        cancelRental,
        recordPayment,
        createUnit,
        updateUnit,
        deleteUnit,
        isSubmitting,
      }}
    >
      {children}
    </RentalContext.Provider>
  );
};

export const useRental = () => {
  const context = useContext(RentalContext);
  if (!context) throw new Error('useRental must be used within RentalProvider');
  return context;
};
