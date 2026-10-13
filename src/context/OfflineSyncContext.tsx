// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - OFFLINE & AUTO-SYNC CONTEXT
// Allows full cashier operations while offline on mobile/desktop,
// queues mutations, and auto-syncs to Supabase Cloud when connectivity returns.
// ==============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localEngine } from '@/lib/mockEngine';
import { useToast } from './ToastContext';

export interface OfflineMutation {
  id: string;
  type: 'START_RENTAL' | 'EXTEND_RENTAL' | 'COMPLETE_RENTAL' | 'CANCEL_RENTAL' | 'PAYMENT' | 'EXPENSE' | 'VOID';
  payload: any;
  createdAt: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  errorMessage?: string;
}

interface OfflineSyncContextType {
  isOnline: boolean;
  pendingCount: number;
  syncQueue: OfflineMutation[];
  isSyncing: boolean;
  lastSyncTime: string | null;
  triggerSync: () => Promise<{ success: boolean; syncedCount: number }>;
  enqueueMutation: (type: OfflineMutation['type'], payload: any) => void;
  clearCompletedSyncs: () => void;
}

const OfflineSyncContext = createContext<OfflineSyncContextType | undefined>(undefined);

const SYNC_QUEUE_KEY = 'rental_ps_offline_sync_queue';
const LAST_SYNC_KEY = 'rental_ps_last_sync_timestamp';

export const OfflineSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { success, warning, info, error } = useToast();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncQueue, setSyncQueue] = useState<OfflineMutation[]>(() => {
    try {
      const stored = localStorage.getItem(SYNC_QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LAST_SYNC_KEY);
    } catch {
      return null;
    }
  });

  // Save queue to localStorage
  const saveQueue = useCallback((newQueue: OfflineMutation[]) => {
    setSyncQueue(newQueue);
    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(newQueue));
    } catch (e) {
      console.warn('Failed to save sync queue in localStorage', e);
    }
  }, []);

  // Enqueue an action when performed
  const enqueueMutation = useCallback(
    (type: OfflineMutation['type'], payload: any) => {
      const mutation: OfflineMutation = {
        id: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type,
        payload,
        createdAt: new Date().toISOString(),
        status: 'pending',
      };
      const updated = [...syncQueue, mutation];
      saveQueue(updated);
    },
    [syncQueue, saveQueue]
  );

  // Sync execution engine
  const triggerSync = useCallback(async (): Promise<{ success: boolean; syncedCount: number }> => {
    const pendingItems = syncQueue.filter((m) => m.status === 'pending' || m.status === 'failed');
    if (pendingItems.length === 0) {
      return { success: true, syncedCount: 0 };
    }

    if (!navigator.onLine) {
      warning('Masih Offline', 'Perangkat belum terhubung ke jaringan internet.');
      return { success: false, syncedCount: 0 };
    }

    setIsSyncing(true);
    let syncedCount = 0;
    const updatedQueue = [...syncQueue];

    for (let i = 0; i < updatedQueue.length; i++) {
      const item = updatedQueue[i];
      if (item.status === 'pending' || item.status === 'failed') {
        item.status = 'syncing';
        try {
          if (isSupabaseConfigured) {
            // Push to Supabase Cloud
            if (item.type === 'START_RENTAL') {
              await supabase.rpc('rpc_start_rental', {
                p_unit_id: item.payload.unitId,
                p_customer_name: item.payload.customerName,
                p_customer_phone: item.payload.customerPhone || null,
                p_tariff_package_id: item.payload.tariffPackageId || null,
                p_duration_minutes: item.payload.durationMinutes,
                p_notes: item.payload.notes || null,
                p_actor_id: (await supabase.auth.getUser()).data.user?.id || null,
              });
            } else if (item.type === 'EXTEND_RENTAL') {
              await supabase.rpc('rpc_extend_rental', {
                p_rental_id: item.payload.rentalId,
                p_additional_minutes: item.payload.additionalMinutes,
                p_additional_price: item.payload.additionalPrice,
                p_actor_id: (await supabase.auth.getUser()).data.user?.id || null,
              });
            } else if (item.type === 'COMPLETE_RENTAL') {
              await supabase.rpc('rpc_complete_rental', {
                p_rental_id: item.payload.rentalId,
                p_actor_id: (await supabase.auth.getUser()).data.user?.id || null,
              });
            } else if (item.type === 'CANCEL_RENTAL') {
              await supabase.rpc('rpc_cancel_rental', {
                p_rental_id: item.payload.rentalId,
                p_reason: item.payload.reason,
                p_actor_id: (await supabase.auth.getUser()).data.user?.id || null,
              });
            } else if (item.type === 'PAYMENT') {
              await supabase.rpc('rpc_record_payment', {
                p_rental_id: item.payload.rentalId,
                p_amount: item.payload.amount,
                p_payment_method: item.payload.paymentMethod,
                p_notes: item.payload.notes || null,
                p_actor_id: (await supabase.auth.getUser()).data.user?.id || null,
              });
            } else if (item.type === 'EXPENSE') {
              await supabase.rpc('rpc_record_expense', {
                p_category_name: item.payload.categoryName,
                p_amount: item.payload.amount,
                p_description: item.payload.description,
                p_reference_no: item.payload.referenceNo || null,
                p_is_capital_asset: item.payload.isCapitalAsset,
                p_actor_id: (await supabase.auth.getUser()).data.user?.id || null,
              });
            } else if (item.type === 'VOID') {
              await supabase.rpc('rpc_void_cash_transaction', {
                p_transaction_id: item.payload.transactionId,
                p_reason: item.payload.reason,
                p_actor_id: (await supabase.auth.getUser()).data.user?.id || null,
              });
            }
          }

          item.status = 'synced';
          syncedCount++;
        } catch (e: any) {
          console.warn(`Sync failed for mutation ${item.id}:`, e);
          item.status = 'failed';
          item.errorMessage = e.message || 'Gagal sinkronisasi';
        }
      }
    }

    const now = new Date().toISOString();
    setLastSyncTime(now);
    try {
      localStorage.setItem(LAST_SYNC_KEY, now);
    } catch {}

    saveQueue(updatedQueue);
    setIsSyncing(false);

    if (syncedCount > 0) {
      success(
        'Sinkronisasi Berhasil',
        `${syncedCount} transaksi offline berhasil disinkronkan ke database cloud.`
      );
    }

    return { success: true, syncedCount };
  }, [syncQueue, saveQueue, success, warning]);

  // Listen to network status changes (online / offline)
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      info(
        'Jaringan Pulih (Online)',
        'Koneksi internet terdeteksi kembali. Memulai sinkronisasi otomatis...'
      );
      // Auto-trigger sync when back online!
      setTimeout(() => {
        triggerSync();
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      warning(
        'Perangkat Offline',
        'Tidak ada jaringan internet. Anda tetap dapat mencatat sewa & transaksi, data disimpan aman di HP/komputer dan disinkronkan saat terhubung kembali.'
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [triggerSync, info, warning]);

  const clearCompletedSyncs = () => {
    const remaining = syncQueue.filter((m) => m.status !== 'synced');
    saveQueue(remaining);
  };

  const pendingCount = syncQueue.filter((m) => m.status === 'pending' || m.status === 'failed').length;

  return (
    <OfflineSyncContext.Provider
      value={{
        isOnline,
        pendingCount,
        syncQueue,
        isSyncing,
        lastSyncTime,
        triggerSync,
        enqueueMutation,
        clearCompletedSyncs,
      }}
    >
      {children}
    </OfflineSyncContext.Provider>
  );
};

export const useOfflineSync = () => {
  const context = useContext(OfflineSyncContext);
  if (!context) throw new Error('useOfflineSync must be used within OfflineSyncProvider');
  return context;
};
