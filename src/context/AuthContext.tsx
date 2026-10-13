// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - AUTHENTICATION & ACCESS CONTROL CONTEXT
// Default role: Kasir (Operator). PIN Protection for Owner Switch & Settings.
// ==============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localEngine } from '@/lib/mockEngine';
import { UserProfile, UserRole } from '@/types';

const PIN_STORAGE_KEY = 'rental_ps_owner_pin';
const DEFAULT_OWNER_PIN = '1234';

const OPERATOR_PROFILE: UserProfile = {
  id: 'usr-operator-001',
  email: 'kasir@rentalps.com',
  fullName: 'Kasir Shift 1',
  role: 'operator',
  createdAt: '2026-10-01T08:00:00.000Z',
};

const OWNER_PROFILE: UserProfile = {
  id: 'usr-owner-001',
  email: 'owner@rentalps.com',
  fullName: 'Owner Rental PS',
  role: 'owner',
  createdAt: '2026-10-01T08:00:00.000Z',
};

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isOwner: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchRole: (newRole: UserRole) => void;
  isSupabaseConnected: boolean;

  // Owner PIN & Access Protection
  ownerPin: string;
  verifyPin: (pin: string) => boolean;
  unlockOwnerWithPin: (pin: string) => Promise<{ success: boolean; error?: string }>;
  lockToCashier: () => void;
  updateOwnerPin: (currentPin: string, newPin: string) => Promise<{ success: boolean; error?: string }>;
  resetOwnerPinToDefault: () => void;

  // Global PIN Modal State
  isPinModalOpen: boolean;
  targetPathAfterUnlock: string | null;
  openPinModal: (targetPath?: string) => void;
  closePinModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Requirement: Saat dibuka hanya kasir!
  // App opens strictly in Kasir mode
  const [user, setUser] = useState<UserProfile>(OPERATOR_PROFILE);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [ownerPin, setOwnerPin] = useState<string>(() => {
    return localStorage.getItem(PIN_STORAGE_KEY) || localEngine.getState().settings.ownerPin || DEFAULT_OWNER_PIN;
  });

  // Modal State
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [targetPathAfterUnlock, setTargetPathAfterUnlock] = useState<string | null>(null);

  const isSupabaseConnected = isSupabaseConfigured;

  // Sync PIN from Supabase cloud if available
  useEffect(() => {
    if (isSupabaseConfigured) {
      const fetchCloudPin = async () => {
        try {
          const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'owner_security_pin')
            .single();

          if (!error && data?.value && typeof data.value === 'object' && 'pin' in data.value) {
            const cloudPin = String((data.value as { pin: string | number }).pin);
            setOwnerPin(cloudPin);
            localStorage.setItem(PIN_STORAGE_KEY, cloudPin);
          }
        } catch {
          // Fallback to local
        }
      };

      fetchCloudPin();
    }
  }, []);

  const openPinModal = useCallback((targetPath?: string) => {
    setTargetPathAfterUnlock(targetPath || null);
    setIsPinModalOpen(true);
  }, []);

  const closePinModal = useCallback(() => {
    setIsPinModalOpen(false);
    setTargetPathAfterUnlock(null);
  }, []);

  const verifyPin = useCallback((pin: string): boolean => {
    return pin.trim() === ownerPin.trim();
  }, [ownerPin]);

  const unlockOwnerWithPin = async (pin: string): Promise<{ success: boolean; error?: string }> => {
    if (!verifyPin(pin)) {
      return { success: false, error: 'PIN tidak sesuai. Silakan coba lagi.' };
    }

    setUser(OWNER_PROFILE);
    localEngine.setCurrentUser(OWNER_PROFILE);
    setIsPinModalOpen(false);
    return { success: true };
  };

  const lockToCashier = useCallback(() => {
    setUser(OPERATOR_PROFILE);
    localEngine.setCurrentUser(OPERATOR_PROFILE);
  }, []);

  const updateOwnerPin = async (currentPin: string, newPin: string): Promise<{ success: boolean; error?: string }> => {
    if (!verifyPin(currentPin)) {
      return { success: false, error: 'PIN lama yang Anda masukkan salah.' };
    }

    const cleanNewPin = newPin.trim();
    if (!/^\d{4,6}$/.test(cleanNewPin)) {
      return { success: false, error: 'PIN baru harus berupa 4 sampai 6 digit angka.' };
    }

    setOwnerPin(cleanNewPin);
    localStorage.setItem(PIN_STORAGE_KEY, cleanNewPin);
    localEngine.updateSettings({ ownerPin: cleanNewPin });

    // Sync to Supabase cloud
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('app_settings')
          .upsert({
            key: 'owner_security_pin',
            value: { pin: cleanNewPin },
            description: 'PIN Keamanan Akses Owner Rental PS',
          });
      } catch (e) {
        console.warn('Gagal sinkron PIN ke Supabase', e);
      }
    }

    return { success: true };
  };

  const resetOwnerPinToDefault = useCallback(() => {
    setOwnerPin(DEFAULT_OWNER_PIN);
    localStorage.setItem(PIN_STORAGE_KEY, DEFAULT_OWNER_PIN);
    localEngine.updateSettings({ ownerPin: DEFAULT_OWNER_PIN });
  }, []);

  const login = async (email: string, password = ''): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }
      }

      const isOwnerRole = email.toLowerCase().includes('owner');
      const newUser = isOwnerRole ? OWNER_PROFILE : OPERATOR_PROFILE;
      setUser(newUser);
      localEngine.setCurrentUser(newUser);
      setIsLoading(false);
      return { success: true };
    } catch (e: any) {
      setIsLoading(false);
      return { success: false, error: e.message || 'Login gagal' };
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore signout network error
      }
    }
    // Return to cashier mode
    lockToCashier();
  };

  const switchRole = (newRole: UserRole) => {
    if (newRole === 'owner') {
      openPinModal();
    } else {
      lockToCashier();
    }
  };

  const role: UserRole = user.role;
  const isOwner = role === 'owner';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isOwner,
        isLoading,
        login,
        logout,
        switchRole,
        isSupabaseConnected,
        ownerPin,
        verifyPin,
        unlockOwnerWithPin,
        lockToCashier,
        updateOwnerPin,
        resetOwnerPinToDefault,
        isPinModalOpen,
        targetPathAfterUnlock,
        openPinModal,
        closePinModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
