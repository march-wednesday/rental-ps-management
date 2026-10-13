// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - AUTHENTICATION CONTEXT
// Supabase Auth Integration with local QA role switching
// ==============================================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localEngine } from '@/lib/mockEngine';
import { UserProfile, UserRole } from '@/types';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isOwner: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchRole: (newRole: UserRole) => void;
  isSupabaseConnected: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(localEngine.getState().currentUser);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isSupabaseConnected = isSupabaseConfigured;

  useEffect(() => {
    // If Supabase is configured, listen to Supabase Auth state
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          fetchSupabaseProfile(session.user.id, session.user.email || '');
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          fetchSupabaseProfile(session.user.id, session.user.email || '');
        } else {
          // Fall back to default
          setUser(localEngine.getState().currentUser);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const fetchSupabaseProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setUser({
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          role: data.role,
          avatarUrl: data.avatar_url,
          createdAt: data.created_at,
        });
      } else {
        // Create basic profile
        setUser({
          id: userId,
          email,
          fullName: email.split('@')[0],
          role: email.includes('owner') ? 'owner' : 'operator',
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('Error fetching Supabase profile', e);
    }
  };

  const login = async (email: string, password = ''): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }
        setIsLoading(false);
        return { success: true };
      }

      // Local / Offline demo authentication
      const isOwnerRole = email.toLowerCase().includes('owner');
      const newUser: UserProfile = {
        id: isOwnerRole ? 'usr-owner-001' : 'usr-operator-001',
        email,
        fullName: isOwnerRole ? 'Owner Rental PS' : 'Kasir Shift 1',
        role: isOwnerRole ? 'owner' : 'operator',
        createdAt: new Date().toISOString(),
      };
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
      await supabase.auth.signOut();
    }
    // Set to operator guest
    const guest: UserProfile = {
      id: 'usr-guest-001',
      email: 'operator@rentalps.com',
      fullName: 'Kasir Shift 1',
      role: 'operator',
      createdAt: new Date().toISOString(),
    };
    setUser(guest);
    localEngine.setCurrentUser(guest);
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      role: newRole,
      fullName: newRole === 'owner' ? 'Owner Rental PS' : 'Kasir Shift 1',
    };
    setUser(updated);
    localEngine.setCurrentUser(updated);
  };

  const role: UserRole = user?.role || 'operator';
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
