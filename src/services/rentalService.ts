// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - RENTAL SERVICE
// Handles real-time timer calculations, unit queries, session lifecycle
// Bridges Supabase & LocalEngine with transparent fallback
// ==============================================================================

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localEngine } from '@/lib/mockEngine';
import { PSUnit, RentalSession, TariffPackage } from '@/types';

export const rentalService = {
  // Query all PS units
  async getUnits(): Promise<PSUnit[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('units')
          .select('*')
          .order('code', { ascending: true });
        if (!error && data) {
          return data.map((u: any) => ({
            id: u.id,
            code: u.code,
            name: u.name,
            consoleType: u.console_type,
            status: u.status,
            notes: u.notes,
            hourlyRate: Number(u.hourly_rate),
            createdAt: u.created_at,
            updatedAt: u.updated_at,
          }));
        }
      } catch (e) {
        console.warn('Supabase fetch units failed, fallback to local engine', e);
      }
    }
    return localEngine.getState().units;
  },

  // Query tariff packages
  async getTariffPackages(): Promise<TariffPackage[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('tariff_packages')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        if (!error && data) {
          return data.map((t: any) => ({
            id: t.id,
            name: t.name,
            durationMinutes: t.duration_minutes,
            price: Number(t.price),
            isActive: t.is_active,
            sortOrder: t.sort_order,
          }));
        }
      } catch (e) {
        console.warn('Supabase fetch tariff packages failed', e);
      }
    }
    return localEngine.getState().tariffPackages;
  },

  // Query all rental sessions (with optional filter for active)
  async getRentals(activeOnly = false): Promise<RentalSession[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('rentals').select(`
          *,
          units (code, name),
          tariff_packages (name)
        `).order('created_at', { ascending: false });

        if (activeOnly) {
          query = query.eq('status', 'active');
        }

        const { data, error } = await query;
        if (!error && data) {
          return data.map((r: any) => ({
            id: r.id,
            rentalCode: r.rental_code,
            unitId: r.unit_id,
            unitCode: r.units?.code || '',
            unitName: r.units?.name || '',
            customerName: r.customer_name,
            customerPhone: r.customer_phone,
            tariffPackageId: r.tariff_package_id,
            tariffPackageName: r.tariff_packages?.name,
            durationMinutes: r.duration_minutes,
            startTime: r.start_time,
            targetEndTime: r.target_end_time,
            actualEndTime: r.actual_end_time,
            status: r.status,
            totalPrice: Number(r.total_price),
            totalPaid: Number(r.total_paid),
            paymentStatus: r.payment_status,
            notes: r.notes,
            createdBy: r.created_by,
            createdAt: r.created_at,
          }));
        }
      } catch (e) {
        console.warn('Supabase fetch rentals failed', e);
      }
    }

    const all = localEngine.getState().rentals;
    return activeOnly ? all.filter((r) => r.status === 'active') : all;
  },

  // Atomic Start Rental Session
  async startRental(params: {
    unitId: string;
    customerName: string;
    customerPhone?: string;
    tariffPackageId?: string;
    durationMinutes: number;
    notes?: string;
  }): Promise<{ success: boolean; rental?: RentalSession; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('rpc_start_rental', {
          p_unit_id: params.unitId,
          p_customer_name: params.customerName,
          p_customer_phone: params.customerPhone || null,
          p_tariff_package_id: params.tariffPackageId || null,
          p_duration_minutes: params.durationMinutes,
          p_notes: params.notes || null,
          p_actor_id: (await supabase.auth.getUser()).data.user?.id || null,
        });

        if (error) throw error;
        // Also sync local state if needed
        return { success: true };
      } catch (e: any) {
        console.warn('Supabase rpc_start_rental error, trying local fallback:', e);
      }
    }

    return localEngine.rpcStartRental(params);
  },

  // Atomic Extend Rental Session (Tambah Waktu)
  async extendRental(params: {
    rentalId: string;
    additionalMinutes: number;
    additionalPrice: number;
  }): Promise<{ success: boolean; rental?: RentalSession; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('rpc_extend_rental', {
          p_rental_id: params.rentalId,
          p_additional_minutes: params.additionalMinutes,
          p_additional_price: params.additionalPrice,
          p_actor_id: (await supabase.auth.getUser()).data.user?.id || null,
        });
        if (error) throw error;
        return { success: true };
      } catch (e: any) {
        console.warn('Supabase rpc_extend_rental error:', e);
      }
    }

    return localEngine.rpcExtendRental(params);
  },

  // Atomic Complete Rental Session (Selesaikan Sewa)
  async completeRental(rentalId: string): Promise<{ success: boolean; rental?: RentalSession; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.rpc('rpc_complete_rental', {
          p_rental_id: rentalId,
          p_actor_id: (await supabase.auth.getUser()).data.user?.id || null,
        });
        if (error) throw error;
        return { success: true };
      } catch (e: any) {
        console.warn('Supabase rpc_complete_rental error:', e);
      }
    }

    return localEngine.rpcCompleteRental({ rentalId });
  },

  // Atomic Cancel Rental Session (Batalkan Sewa)
  async cancelRental(rentalId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.rpc('rpc_cancel_rental', {
          p_rental_id: rentalId,
          p_reason: reason,
          p_actor_id: (await supabase.auth.getUser()).data.user?.id || null,
        });
        if (error) throw error;
        return { success: true };
      } catch (e: any) {
        console.warn('Supabase rpc_cancel_rental error:', e);
      }
    }

    return localEngine.rpcCancelRental({ rentalId, reason });
  },
};
