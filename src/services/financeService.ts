// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - FINANCE SERVICE
// Handles payments, cash book (Buku Kas), expenses, running balance, profit/loss
// Bridges Supabase & LocalEngine with transparent bidirectional synchronization
// ==============================================================================

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localEngine } from '@/lib/mockEngine';
import { CashTransaction, PaymentRecord, PaymentMethod } from '@/types';

export const financeService = {
  // Query cash transactions with running balance
  async getCashTransactions(filters?: {
    startDate?: string;
    endDate?: string;
    type?: 'in' | 'out';
    category?: string;
    search?: string;
  }): Promise<{ transactions: CashTransaction[]; currentBalance: number }> {
    let list: CashTransaction[] = [];

    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('cash_transactions')
          .select('*')
          .order('transaction_date', { ascending: false });

        if (filters?.type) {
          query = query.eq('type', filters.type);
        }
        if (filters?.category) {
          query = query.eq('category_name', filters.category);
        }

        const { data, error } = await query;
        if (!error && data) {
          list = data.map((t: any) => ({
            id: t.id,
            transactionNo: t.transaction_no,
            transactionDate: t.transaction_date,
            categoryId: t.category_id,
            categoryName: t.category_name,
            type: t.type,
            amount: Number(t.amount),
            referenceNo: t.reference_no,
            rentalId: t.rental_id,
            paymentId: t.payment_id,
            description: t.description,
            isCapitalAsset: t.is_capital_asset,
            status: t.status,
            voidReason: t.void_reason,
            voidedBy: t.voided_by,
            voidedAt: t.voided_at,
            createdBy: t.created_by,
            createdAt: t.created_at,
          }));

          // Sync into localEngine so local queries & getSummary() have complete data
          const cloudIds = new Set(list.map((t) => t.id));
          const localOnly = localEngine.getState().cashTransactions.filter((l) => !cloudIds.has(l.id));
          localEngine.getState().cashTransactions = [...list, ...localOnly];
          localEngine.saveState();
        }
      } catch (e) {
        console.warn('Supabase fetch cash transactions failed', e);
      }
    }

    if (list.length === 0) {
      list = [...localEngine.getState().cashTransactions];
    }

    // Apply client filters if present
    let filtered = list;
    if (filters?.type) {
      filtered = filtered.filter((t) => t.type === filters.type);
    }
    if (filters?.category) {
      filtered = filtered.filter((t) => t.categoryName.toLowerCase().includes(filters.category!.toLowerCase()));
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.transactionNo.toLowerCase().includes(q) ||
          (t.referenceNo && t.referenceNo.toLowerCase().includes(q))
      );
    }

    // Calculate running balance in chronological order (oldest to newest)
    // Non-void transactions only!
    const chronological = [...filtered].sort(
      (a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
    );

    let runningBalance = 0;
    const withRunningBalance = chronological.map((t) => {
      if (t.status !== 'void') {
        if (t.type === 'in') {
          runningBalance += t.amount;
        } else {
          runningBalance -= t.amount;
        }
      }
      return {
        ...t,
        balanceAfter: runningBalance,
      };
    });

    // Return in reverse chronological order (newest first for UI table display)
    const sortedDisplay = withRunningBalance.reverse();
    return {
      transactions: sortedDisplay,
      currentBalance: runningBalance,
    };
  },

  // Record Payment for Rental (Atomic Kas Masuk)
  async recordPayment(params: {
    rentalId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  }): Promise<{ success: boolean; payment?: PaymentRecord; error?: string }> {
    const localRes = localEngine.rpcRecordPayment(params);

    if (isSupabaseConfigured && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.rentalId)) {
      try {
        const { error: rpcErr } = await supabase.rpc('rpc_record_payment', {
          p_rental_id: params.rentalId,
          p_amount: params.amount,
          p_payment_method: params.paymentMethod,
          p_notes: params.notes || null,
          p_actor_id: (await supabase.auth.getUser()).data.user?.id || null,
        });

        if (rpcErr) {
          console.warn('Supabase rpc_record_payment error, using direct insert fallback:', rpcErr);
          const now = new Date();
          const invoiceNo = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
            now.getDate()
          ).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

          // Direct payment insert
          const { data: pData } = await supabase.from('payments').insert({
            invoice_no: invoiceNo,
            rental_id: params.rentalId,
            amount: params.amount,
            payment_method: params.paymentMethod,
            notes: params.notes || null,
          }).select().single();

          // Direct cash transaction insert
          const txNo = `CSH-IN-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
            now.getDate()
          ).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

          await supabase.from('cash_transactions').insert({
            transaction_no: txNo,
            category_name: 'Pendapatan Rental',
            type: 'in',
            amount: params.amount,
            reference_no: invoiceNo,
            rental_id: params.rentalId,
            payment_id: pData?.id || null,
            description: `Pembayaran Rental [${params.paymentMethod}]`,
            is_capital_asset: false,
            status: 'valid',
          });

          // Update rental status in Supabase
          const { data: rData } = await supabase.from('rentals').select('total_price, total_paid').eq('id', params.rentalId).single();
          if (rData) {
            const newTotalPaid = Number(rData.total_paid || 0) + params.amount;
            const newPayStatus = newTotalPaid >= Number(rData.total_price) ? 'Lunas' : 'Sebagian';
            await supabase.from('rentals').update({
              total_paid: newTotalPaid,
              payment_status: newPayStatus,
            }).eq('id', params.rentalId);
          }
        }
      } catch (e: any) {
        console.warn('Supabase recordPayment exception:', e);
      }
    }

    window.dispatchEvent(new CustomEvent('rental-data-updated'));
    return localRes;
  },

  // Record Expense (Kas Keluar)
  async recordExpense(params: {
    categoryName: string;
    amount: number;
    description: string;
    referenceNo?: string;
    isCapitalAsset: boolean;
    transactionDate?: string;
  }): Promise<{ success: boolean; transaction?: CashTransaction; error?: string }> {
    const localRes = localEngine.rpcRecordExpense(params);

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.rpc('rpc_record_expense', {
          p_category_name: params.categoryName,
          p_amount: params.amount,
          p_description: params.description,
          p_reference_no: params.referenceNo || null,
          p_is_capital_asset: params.isCapitalAsset,
          p_actor_id: (await supabase.auth.getUser()).data.user?.id || null,
        });

        if (error) {
          console.warn('RPC record_expense failed, using direct insert fallback:', error);
          const now = new Date();
          const txNo = `CSH-OUT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
            now.getDate()
          ).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

          await supabase.from('cash_transactions').insert({
            transaction_no: txNo,
            transaction_date: params.transactionDate || now.toISOString(),
            category_name: params.categoryName,
            type: 'out',
            amount: params.amount,
            reference_no: params.referenceNo || null,
            description: params.description,
            is_capital_asset: params.isCapitalAsset,
            status: 'valid',
          });
        }
      } catch (e: any) {
        console.warn('Supabase rpc_record_expense error:', e);
      }
    }

    window.dispatchEvent(new CustomEvent('rental-data-updated'));
    return localRes;
  },

  // Void Transaction
  async voidTransaction(params: {
    transactionId: string;
    reason: string;
  }): Promise<{ success: boolean; error?: string }> {
    const localRes = localEngine.rpcVoidCashTransaction(params);

    if (isSupabaseConfigured && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.transactionId)) {
      try {
        const { error } = await supabase.rpc('rpc_void_cash_transaction', {
          p_transaction_id: params.transactionId,
          p_reason: params.reason,
          p_actor_id: (await supabase.auth.getUser()).data.user?.id || null,
        });

        if (error) {
          console.warn('RPC void failed, using direct update fallback:', error);
          await supabase.from('cash_transactions').update({
            status: 'void',
            void_reason: params.reason,
            voided_at: new Date().toISOString(),
          }).eq('id', params.transactionId);
        }
      } catch (e: any) {
        console.warn('Supabase rpc_void_cash_transaction error:', e);
      }
    }

    window.dispatchEvent(new CustomEvent('rental-data-updated'));
    return localRes;
  },

  // Financial summary & KPI indicators
  getSummary() {
    return localEngine.getFinancialSummary();
  },
};
