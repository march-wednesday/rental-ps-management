// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - INVENTORY & EQUIPMENT SERVICE
// Bridges Supabase table 'equipment' & LocalEngine with transparent synchronization
// ==============================================================================

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localEngine } from '@/lib/mockEngine';
import { EquipmentItem } from '@/types';

export const inventoryService = {
  // Query all equipment / inventory items
  async getEquipment(): Promise<EquipmentItem[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('equipment')
          .select('*')
          .order('name', { ascending: true });

        if (!error && data && data.length > 0) {
          const cloudItems: EquipmentItem[] = data.map((e: any) => ({
            id: e.id,
            name: e.name,
            specification: e.specification || undefined,
            quantity: Number(e.quantity),
            unit: e.unit || 'Unit',
            unitPrice: Number(e.unit_price),
            totalPrice: Number(e.total_price || e.quantity * e.unit_price),
            wattage: Number(e.wattage || 0),
            notes: e.notes || undefined,
            category: e.category || 'Peralatan Listrik',
          }));

          // Sync into localEngine
          localEngine.getState().equipment = cloudItems;
          localEngine.saveState();
          return cloudItems;
        }
      } catch (e) {
        console.warn('Supabase fetch equipment failed, using local:', e);
      }
    }
    return localEngine.getState().equipment;
  },

  // Add new equipment item
  async addEquipment(params: Omit<EquipmentItem, 'id' | 'totalPrice'>): Promise<{ success: boolean; item?: EquipmentItem; error?: string }> {
    const totalPrice = params.quantity * params.unitPrice;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('equipment')
          .insert({
            name: params.name.trim(),
            specification: params.specification?.trim() || null,
            quantity: params.quantity,
            unit: params.unit,
            unit_price: params.unitPrice,
            wattage: params.wattage,
            notes: params.notes?.trim() || null,
            category: params.category || 'Peralatan Listrik',
          })
          .select()
          .single();

        if (!error && data) {
          const newItem: EquipmentItem = {
            id: data.id,
            name: data.name,
            specification: data.specification || undefined,
            quantity: Number(data.quantity),
            unit: data.unit,
            unitPrice: Number(data.unit_price),
            totalPrice: Number(data.total_price || data.quantity * data.unit_price),
            wattage: Number(data.wattage),
            notes: data.notes || undefined,
            category: data.category,
          };

          localEngine.addEquipment(newItem);
          return { success: true, item: newItem };
        }
      } catch (e: any) {
        console.warn('Supabase addEquipment error:', e);
      }
    }

    const newItem = localEngine.addEquipment({
      ...params,
    });
    return { success: true, item: newItem };
  },

  // Update equipment item
  async updateEquipment(
    id: string,
    params: Partial<Omit<EquipmentItem, 'id' | 'totalPrice'>>
  ): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      try {
        const payload: any = {};
        if (params.name !== undefined) payload.name = params.name.trim();
        if (params.specification !== undefined) payload.specification = params.specification?.trim() || null;
        if (params.quantity !== undefined) payload.quantity = params.quantity;
        if (params.unit !== undefined) payload.unit = params.unit;
        if (params.unitPrice !== undefined) payload.unit_price = params.unitPrice;
        if (params.wattage !== undefined) payload.wattage = params.wattage;
        if (params.notes !== undefined) payload.notes = params.notes?.trim() || null;
        if (params.category !== undefined) payload.category = params.category;

        const { error } = await supabase.from('equipment').update(payload).eq('id', id);
        if (error) console.warn('Supabase updateEquipment warning:', error);
      } catch (e: any) {
        console.warn('Supabase updateEquipment error:', e);
      }
    }

    localEngine.updateEquipment(id, params);
    return { success: true };
  },

  // Delete equipment item
  async deleteEquipment(id: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      try {
        const { error } = await supabase.from('equipment').delete().eq('id', id);
        if (error) console.warn('Supabase deleteEquipment warning:', error);
      } catch (e: any) {
        console.warn('Supabase deleteEquipment error:', e);
      }
    }

    localEngine.deleteEquipment(id);
    return { success: true };
  },
};
