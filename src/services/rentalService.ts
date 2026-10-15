// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - RENTAL SERVICE
// Handles real-time timer calculations, unit queries, session lifecycle
// Bridges Supabase & LocalEngine with transparent bidirectional synchronization
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
        if (!error && data && data.length > 0) {
          const cloudUnits: PSUnit[] = data.map((u: any) => ({
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
          // Sync into localEngine so IDs & statuses match perfectly
          localEngine.syncUnitsFromCloud(cloudUnits);
          return cloudUnits;
        }
      } catch (e) {
        console.warn('Supabase fetch units failed, fallback to local engine', e);
      }
    }
    return localEngine.getState().units;
  },

  // Create new PS unit (Tambah Unit PS)
  async createUnit(params: {
    code: string;
    name: string;
    consoleType: string;
    hourlyRate: number;
    status?: 'Tersedia' | 'Sedang Disewa' | 'Maintenance' | 'Nonaktif';
    notes?: string;
  }): Promise<{ success: boolean; unit?: PSUnit; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('units')
          .insert({
            code: params.code.trim().toUpperCase(),
            name: params.name.trim(),
            console_type: params.consoleType,
            hourly_rate: params.hourlyRate,
            status: params.status || 'Tersedia',
            notes: params.notes || null,
          })
          .select()
          .single();

        if (!error && data) {
          const unit: PSUnit = {
            id: data.id,
            code: data.code,
            name: data.name,
            consoleType: data.console_type,
            status: data.status,
            notes: data.notes,
            hourlyRate: Number(data.hourly_rate),
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
          try {
            // Keep localEngine in sync with the same UUID
            const existing = localEngine.getState().units.findIndex((u) => u.code === unit.code || u.id === unit.id);
            if (existing >= 0) {
              localEngine.getState().units[existing] = unit;
            } else {
              localEngine.getState().units.push(unit);
            }
            localEngine.saveState();
          } catch {}
          return { success: true, unit };
        }
      } catch (e: any) {
        console.warn('Supabase createUnit error, trying local:', e);
      }
    }

    try {
      const unit = localEngine.createUnit(params);
      return { success: true, unit };
    } catch (e: any) {
      return { success: false, error: e.message || 'Gagal menambahkan unit' };
    }
  },

  // Update existing PS unit
  async updateUnit(unitId: string, params: Partial<PSUnit>): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const payload: any = {};
        if (params.name !== undefined) payload.name = params.name;
        if (params.consoleType !== undefined) payload.console_type = params.consoleType;
        if (params.hourlyRate !== undefined) payload.hourly_rate = params.hourlyRate;
        if (params.status !== undefined) payload.status = params.status;
        if (params.notes !== undefined) payload.notes = params.notes;

        const { error } = await supabase.from('units').update(payload).eq('id', unitId);
        if (!error) {
          try { localEngine.updateUnit(unitId, params); } catch {}
          return { success: true };
        }
      } catch (e: any) {
        console.warn('Supabase updateUnit error:', e);
      }
    }

    try {
      localEngine.updateUnit(unitId, params);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Gagal memperbarui unit' };
    }
  },

  // Delete PS unit
  async deleteUnit(unitId: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('units').delete().eq('id', unitId);
        if (!error) {
          try { localEngine.deleteUnit(unitId); } catch {}
          return { success: true };
        }
      } catch (e: any) {
        console.warn('Supabase deleteUnit error:', e);
      }
    }

    try {
      localEngine.deleteUnit(unitId);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Gagal menghapus unit' };
    }
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
          const cloudTariffs: TariffPackage[] = data.map((t: any) => ({
            id: t.id,
            name: t.name,
            durationMinutes: t.duration_minutes,
            price: Number(t.price),
            isActive: t.is_active,
            sortOrder: t.sort_order,
          }));
          localEngine.syncTariffsFromCloud(cloudTariffs);
          return cloudTariffs;
        }
      } catch (e) {
        console.warn('Supabase fetch tariff packages failed', e);
      }
    }
    return localEngine.getState().tariffPackages;
  },

  // Create new tariff package
  async createTariffPackage(params: {
    name: string;
    durationMinutes: number;
    price: number;
  }): Promise<{ success: boolean; tariffPackage?: TariffPackage; error?: string }> {
    const currentTariffs = localEngine.getState().tariffPackages;
    const sortOrder = currentTariffs.length + 1;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('tariff_packages')
          .insert({
            name: params.name.trim(),
            duration_minutes: params.durationMinutes,
            price: params.price,
            is_active: true,
            sort_order: sortOrder,
          })
          .select()
          .single();

        if (!error && data) {
          const newPkg: TariffPackage = {
            id: data.id,
            name: data.name,
            durationMinutes: data.duration_minutes,
            price: Number(data.price),
            isActive: data.is_active,
            sortOrder: data.sort_order,
          };
          const list = [...currentTariffs, newPkg];
          localEngine.saveTariffPackages(list);
          window.dispatchEvent(new CustomEvent('rental-data-updated'));
          return { success: true, tariffPackage: newPkg };
        } else if (error) {
          console.warn('Supabase insert tariff package warning:', error);
        }
      } catch (e: any) {
        console.warn('Supabase createTariffPackage error:', e);
      }
    }

    // Local fallback
    const newPkg: TariffPackage = {
      id: `pkg-${Date.now()}`,
      name: params.name.trim(),
      durationMinutes: params.durationMinutes,
      price: params.price,
      isActive: true,
      sortOrder,
    };
    const list = [...currentTariffs, newPkg];
    localEngine.saveTariffPackages(list);
    window.dispatchEvent(new CustomEvent('rental-data-updated'));
    return { success: true, tariffPackage: newPkg };
  },

  // Update existing tariff package
  async updateTariffPackage(
    id: string,
    params: { name?: string; durationMinutes?: number; price?: number }
  ): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      try {
        const payload: any = {};
        if (params.name !== undefined) payload.name = params.name.trim();
        if (params.durationMinutes !== undefined) payload.duration_minutes = params.durationMinutes;
        if (params.price !== undefined) payload.price = params.price;

        const { error } = await supabase.from('tariff_packages').update(payload).eq('id', id);
        if (error) console.warn('Supabase update tariff warning:', error);
      } catch (e: any) {
        console.warn('Supabase updateTariffPackage error:', e);
      }
    }

    const current = [...localEngine.getState().tariffPackages];
    const idx = current.findIndex((p) => p.id === id);
    if (idx !== -1) {
      current[idx] = {
        ...current[idx],
        name: params.name !== undefined ? params.name.trim() : current[idx].name,
        durationMinutes: params.durationMinutes !== undefined ? params.durationMinutes : current[idx].durationMinutes,
        price: params.price !== undefined ? params.price : current[idx].price,
      };
      localEngine.saveTariffPackages(current);
    }
    window.dispatchEvent(new CustomEvent('rental-data-updated'));
    return { success: true };
  },

  // Delete tariff package (hard delete with soft delete fallback)
  async deleteTariffPackage(id: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      try {
        // First try hard delete
        const { error } = await supabase.from('tariff_packages').delete().eq('id', id);
        if (error) {
          // If referenced by foreign keys in past rentals, use soft delete
          await supabase.from('tariff_packages').update({ is_active: false }).eq('id', id);
        }
      } catch (e: any) {
        console.warn('Supabase deleteTariffPackage error, soft deleting:', e);
        try {
          await supabase.from('tariff_packages').update({ is_active: false }).eq('id', id);
        } catch {}
      }
    }

    const current = localEngine.getState().tariffPackages.filter((p) => p.id !== id);
    localEngine.saveTariffPackages(current);
    window.dispatchEvent(new CustomEvent('rental-data-updated'));
    return { success: true };
  },

  // Query all rental sessions (with optional filter for active)
  async getRentals(activeOnly = false): Promise<RentalSession[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('rentals').select(`
          *,
          units (code, name),
          tariff_packages (name)
        `).order('start_time', { ascending: false });

        if (activeOnly) {
          query = query.eq('status', 'active');
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const cloudRentals: RentalSession[] = data.map((r: any) => ({
            id: r.id,
            rentalCode: r.rental_code,
            unitId: r.unit_id,
            unitCode: r.units?.code || (r.unit_id === '028ea2d7-c00a-410b-b660-d73dc2ff536b' ? 'PS-01' : 'PS-02'),
            unitName: r.units?.name || (r.units?.code === 'PS-02' ? 'PS4 Unit 2' : 'PS4 Unit 1'),
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

          // Sync into localEngine so local financial calculations have the exact data
          localEngine.syncRentalsFromCloud(cloudRentals);

          const localAll = localEngine.getState().rentals;
          const localFiltered = activeOnly ? localAll.filter((r) => r.status === 'active') : localAll;
          const cloudCodes = new Set(cloudRentals.map((c) => c.rentalCode));
          const localOnly = localFiltered.filter((l) => !cloudCodes.has(l.rentalCode));
          return [...cloudRentals, ...localOnly];
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
    // 1. Resolve unit from localEngine or Supabase
    let targetUnit = localEngine.getState().units.find(
      (u) => u.id === params.unitId || u.code === params.unitId
    );

    if (!targetUnit) {
      const allUnits = await this.getUnits();
      targetUnit = allUnits.find(
        (u) => u.id === params.unitId || u.code === params.unitId
      );
    }

    if (!targetUnit) {
      return { success: false, error: 'Unit PlayStation tidak ditemukan.' };
    }

    // 2. Map unit ID for Supabase
    let sbUnitId = targetUnit.id;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sbUnitId)) {
      if (targetUnit.code === 'PS-01') sbUnitId = '028ea2d7-c00a-410b-b660-d73dc2ff536b';
      if (targetUnit.code === 'PS-02') sbUnitId = '2ac6a322-a4fe-41a1-9bc0-b6a280dd13fc';
    }

    // 3. Sanitize tariff ID (must be valid UUID for Postgres)
    const isUuidTariff = params.tariffPackageId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.tariffPackageId);
    const sbTariffId = isUuidTariff ? params.tariffPackageId : null;

    // 4. Calculate total price
    let totalPrice = 0;
    let tariffPackageName: string | undefined = undefined;
    if (params.tariffPackageId) {
      const pkg = localEngine.getState().tariffPackages.find((p) => p.id === params.tariffPackageId);
      if (pkg) {
        totalPrice = pkg.price;
        tariffPackageName = pkg.name;
      }
    }
    if (totalPrice === 0) {
      totalPrice = (params.durationMinutes / 60) * (targetUnit.hourlyRate || 10000);
    }

    const now = new Date();
    const targetEnd = new Date(now.getTime() + params.durationMinutes * 60 * 1000);
    let rentalCode = `RENT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(
      now.getMinutes()
    ).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}-${targetUnit.code}`;

    let createdRentalId = `rent-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // 5. If Supabase configured, execute on cloud
    if (isSupabaseConfigured && sbUnitId) {
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('rpc_start_rental', {
          p_unit_id: sbUnitId,
          p_customer_name: params.customerName.trim(),
          p_customer_phone: params.customerPhone?.trim() || null,
          p_tariff_package_id: sbTariffId,
          p_duration_minutes: params.durationMinutes,
          p_notes: params.notes?.trim() || null,
          p_actor_id: (await supabase.auth.getUser()).data.user?.id || null,
        });

        if (!rpcError && rpcData && rpcData.rental_id) {
          createdRentalId = rpcData.rental_id;
          if (rpcData.rental_code) rentalCode = rpcData.rental_code;
        } else {
          // Direct insert fallback if RPC has validation or procedural issue
          console.warn('RPC start_rental failed, using resilient direct insert fallback:', rpcError);
          const { data: insertData, error: insertError } = await supabase
            .from('rentals')
            .insert({
              rental_code: rentalCode,
              unit_id: sbUnitId,
              customer_name: params.customerName.trim(),
              customer_phone: params.customerPhone?.trim() || null,
              tariff_package_id: sbTariffId,
              duration_minutes: params.durationMinutes,
              start_time: now.toISOString(),
              target_end_time: targetEnd.toISOString(),
              status: 'active',
              total_price: totalPrice,
              total_paid: 0,
              payment_status: 'Belum Bayar',
              notes: params.notes?.trim() || null,
            })
            .select()
            .single();

          if (!insertError && insertData) {
            createdRentalId = insertData.id;
            rentalCode = insertData.rental_code;
            await supabase.from('units').update({ status: 'Sedang Disewa' }).eq('id', sbUnitId);
          } else if (insertError) {
            console.error('Supabase direct insert error:', insertError);
            return { success: false, error: insertError.message || 'Gagal menyimpan sewa ke database cloud.' };
          }
        }
      } catch (e: any) {
        console.warn('Supabase startRental exception:', e);
      }
    }

    // 6. Sync into localEngine
    const newRental: RentalSession = {
      id: createdRentalId,
      rentalCode,
      unitId: targetUnit.id,
      unitCode: targetUnit.code,
      unitName: targetUnit.name,
      customerName: params.customerName.trim(),
      customerPhone: params.customerPhone?.trim(),
      tariffPackageId: params.tariffPackageId,
      tariffPackageName,
      durationMinutes: params.durationMinutes,
      startTime: now.toISOString(),
      targetEndTime: targetEnd.toISOString(),
      status: 'active',
      totalPrice,
      totalPaid: 0,
      paymentStatus: 'Belum Bayar',
      notes: params.notes?.trim(),
      createdAt: now.toISOString(),
    };

    targetUnit.status = 'Sedang Disewa';
    targetUnit.updatedAt = now.toISOString();

    const existingIdx = localEngine.getState().rentals.findIndex(
      (r) => r.id === newRental.id || r.rentalCode === newRental.rentalCode
    );
    if (existingIdx >= 0) {
      localEngine.getState().rentals[existingIdx] = newRental;
    } else {
      localEngine.getState().rentals.unshift(newRental);
    }
    localEngine.saveState();

    window.dispatchEvent(new CustomEvent('rental-data-updated'));
    return { success: true, rental: newRental };
  },

  // Atomic Extend Rental Session (Tambah Waktu)
  async extendRental(params: {
    rentalId: string;
    additionalMinutes: number;
    additionalPrice: number;
  }): Promise<{ success: boolean; rental?: RentalSession; error?: string }> {
    const rental = localEngine.getState().rentals.find(
      (r) => r.id === params.rentalId || r.rentalCode === params.rentalId
    );

    let newTargetEnd: string = '';
    let newTotalPrice: number = 0;

    if (rental) {
      const currentTargetMs = new Date(rental.targetEndTime).getTime();
      const newTargetMs = currentTargetMs + params.additionalMinutes * 60 * 1000;
      newTargetEnd = new Date(newTargetMs).toISOString();

      rental.durationMinutes += params.additionalMinutes;
      rental.targetEndTime = newTargetEnd;
      rental.totalPrice += params.additionalPrice;
      newTotalPrice = rental.totalPrice;

      if (rental.totalPaid >= rental.totalPrice) {
        rental.paymentStatus = 'Lunas';
      } else if (rental.totalPaid > 0) {
        rental.paymentStatus = 'Sebagian';
      } else {
        rental.paymentStatus = 'Belum Bayar';
      }
      localEngine.saveState();
    }

    if (isSupabaseConfigured && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.rentalId)) {
      try {
        const { error: rpcErr } = await supabase.rpc('rpc_extend_rental', {
          p_rental_id: params.rentalId,
          p_additional_minutes: params.additionalMinutes,
          p_additional_price: params.additionalPrice,
          p_actor_id: (await supabase.auth.getUser()).data.user?.id || null,
        });

        if (rpcErr) {
          await supabase.from('rentals').update({
            duration_minutes: rental?.durationMinutes,
            target_end_time: newTargetEnd || undefined,
            total_price: newTotalPrice || undefined,
            payment_status: rental?.paymentStatus,
          }).eq('id', params.rentalId);
        }
      } catch (e: any) {
        console.warn('Supabase extendRental error:', e);
      }
    }

    window.dispatchEvent(new CustomEvent('rental-data-updated'));
    return { success: true, rental: rental || undefined };
  },

  // Atomic Complete Rental Session (Selesaikan Sewa)
  async completeRental(rentalId: string): Promise<{ success: boolean; rental?: RentalSession; error?: string }> {
    const now = new Date().toISOString();
    let unitToFreeId: string | null = null;
    let unitToFreeCode: string | null = null;

    if (isSupabaseConfigured) {
      try {
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rentalId)) {
          const { error: rpcErr } = await supabase.rpc('rpc_complete_rental', {
            p_rental_id: rentalId,
            p_actor_id: (await supabase.auth.getUser()).data.user?.id || null,
          });

          if (rpcErr) {
            console.warn('RPC complete_rental failed, using direct update fallback:', rpcErr);
            const { data: rData } = await supabase
              .from('rentals')
              .update({ status: 'completed', actual_end_time: now })
              .eq('id', rentalId)
              .select('unit_id')
              .single();

            if (rData?.unit_id) {
              await supabase.from('units').update({ status: 'Tersedia' }).eq('id', rData.unit_id);
            }
          }
        }
      } catch (e: any) {
        console.warn('Supabase completeRental error:', e);
      }
    }

    const rental = localEngine.getState().rentals.find(
      (r) => r.id === rentalId || r.rentalCode === rentalId
    );

    if (rental) {
      rental.status = 'completed';
      rental.actualEndTime = now;
      unitToFreeId = rental.unitId;
      unitToFreeCode = rental.unitCode;
    }

    const unit = localEngine.getState().units.find(
      (u) => (unitToFreeId && u.id === unitToFreeId) || (unitToFreeCode && u.code === unitToFreeCode)
    );

    if (unit) {
      unit.status = 'Tersedia';
      unit.updatedAt = now;
      if (isSupabaseConfigured && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(unit.id)) {
        supabase.from('units').update({ status: 'Tersedia' }).eq('id', unit.id).then();
      }
    }

    localEngine.saveState();
    window.dispatchEvent(new CustomEvent('rental-data-updated'));
    return { success: true, rental: rental || undefined };
  },

  // Atomic Cancel Rental Session (Batalkan Sewa)
  async cancelRental(rentalId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    const now = new Date().toISOString();
    let unitToFreeId: string | null = null;
    let unitToFreeCode: string | null = null;

    if (isSupabaseConfigured) {
      try {
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rentalId)) {
          const { error: rpcErr } = await supabase.rpc('rpc_cancel_rental', {
            p_rental_id: rentalId,
            p_reason: reason,
            p_actor_id: (await supabase.auth.getUser()).data.user?.id || null,
          });

          if (rpcErr) {
            const { data: rData } = await supabase
              .from('rentals')
              .update({ status: 'cancelled', actual_end_time: now, notes: `Dibatalkan: ${reason}` })
              .eq('id', rentalId)
              .select('unit_id')
              .single();

            if (rData?.unit_id) {
              await supabase.from('units').update({ status: 'Tersedia' }).eq('id', rData.unit_id);
            }
          }
        }
      } catch (e: any) {
        console.warn('Supabase cancelRental error:', e);
      }
    }

    const rental = localEngine.getState().rentals.find(
      (r) => r.id === rentalId || r.rentalCode === rentalId
    );

    if (rental) {
      rental.status = 'cancelled';
      rental.actualEndTime = now;
      rental.notes = `${rental.notes ? rental.notes + ' | ' : ''}Dibatalkan: ${reason}`;
      unitToFreeId = rental.unitId;
      unitToFreeCode = rental.unitCode;
    }

    const unit = localEngine.getState().units.find(
      (u) => (unitToFreeId && u.id === unitToFreeId) || (unitToFreeCode && u.code === unitToFreeCode)
    );

    if (unit) {
      unit.status = 'Tersedia';
      unit.updatedAt = now;
      if (isSupabaseConfigured && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(unit.id)) {
        supabase.from('units').update({ status: 'Tersedia' }).eq('id', unit.id).then();
      }
    }

    localEngine.saveState();
    window.dispatchEvent(new CustomEvent('rental-data-updated'));
    return { success: true };
  },

  // Update any fields of a rental session in Logbook
  async updateRentalSession(
    rentalId: string,
    updates: Partial<RentalSession>
  ): Promise<{ success: boolean; error?: string }> {
    const localRes = localEngine.updateRentalSession(rentalId, updates);

    if (isSupabaseConfigured && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rentalId)) {
      try {
        const payload: any = {};
        if (updates.customerName !== undefined) payload.customer_name = updates.customerName;
        if (updates.customerPhone !== undefined) payload.customer_phone = updates.customerPhone || null;
        if (updates.durationMinutes !== undefined) payload.duration_minutes = updates.durationMinutes;
        if (updates.startTime !== undefined) payload.start_time = updates.startTime;
        if (updates.targetEndTime !== undefined) payload.target_end_time = updates.targetEndTime;
        if (updates.actualEndTime !== undefined) payload.actual_end_time = updates.actualEndTime;
        if (updates.createdAt !== undefined) payload.created_at = updates.createdAt;
        if (updates.totalPrice !== undefined) payload.total_price = updates.totalPrice;
        if (updates.totalPaid !== undefined) payload.total_paid = updates.totalPaid;
        if (updates.paymentStatus !== undefined) payload.payment_status = updates.paymentStatus;
        if (updates.status !== undefined) payload.status = updates.status;
        if (updates.notes !== undefined) payload.notes = updates.notes || null;
        if (updates.unitId !== undefined) {
          let sbUnitId = updates.unitId;
          if (sbUnitId === 'unit-ps-01' || sbUnitId === 'PS-01') sbUnitId = '028ea2d7-c00a-410b-b660-d73dc2ff536b';
          if (sbUnitId === 'unit-ps-02' || sbUnitId === 'PS-02') sbUnitId = '2ac6a322-a4fe-41a1-9bc0-b6a280dd13fc';
          payload.unit_id = sbUnitId;
        }

        const { error } = await supabase.from('rentals').update(payload).eq('id', rentalId);
        if (error) console.warn('Supabase updateRentalSession warning:', error);
      } catch (e: any) {
        console.warn('Supabase updateRentalSession error:', e);
      }
    }

    window.dispatchEvent(new CustomEvent('rental-data-updated'));
    return localRes;
  },

  // Quick Action: Mark a rental session as paid (Lunas)
  async markRentalAsPaid(
    rentalId: string,
    totalPrice?: number
  ): Promise<{ success: boolean; error?: string }> {
    const existing = localEngine.getState().rentals.find((r) => r.id === rentalId || r.rentalCode === rentalId);
    const amount = totalPrice !== undefined ? totalPrice : (existing?.totalPrice || 10000);

    return this.updateRentalSession(rentalId, {
      paymentStatus: 'Lunas',
      totalPaid: amount,
    });
  },
};
