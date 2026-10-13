// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - EXPENSE MODAL (Pencatatan Kas Keluar)
// Separates operational expenses from capital equipment asset purchases
// ==============================================================================

import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { financeService } from '@/services/financeService';
import { useToast } from '@/context/ToastContext';
import { useOfflineSync } from '@/context/OfflineSyncContext';
import { formatRupiah } from '@/utils/formatters';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_EXPENSE_CATEGORIES = [
  'Listrik',
  'Internet',
  'Perawatan PS',
  'Aksesori',
  'Kebersihan',
  'Operasional lainnya',
  'Pembelian peralatan',
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const { enqueueMutation, isOnline } = useOfflineSync();
  const [categoryName, setCategoryName] = useState('Listrik');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [isCapitalAsset, setIsCapitalAsset] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (amount <= 0) {
      setErrorMessage('Nominal pengeluaran harus lebih besar dari Rp 0.');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('Keterangan pengeluaran wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        categoryName,
        amount,
        description: description.trim(),
        referenceNo: referenceNo.trim() || undefined,
        isCapitalAsset,
      };
      const res = await financeService.recordExpense(payload);

      if (res.success) {
        enqueueMutation('EXPENSE', payload);
        success('Pengeluaran Berhasil Dicatat', `${formatRupiah(amount)} tercatat di Buku Kas.${!isOnline ? ' (Tersimpan Offline)' : ''}`);
        setDescription('');
        setAmount(0);
        setReferenceNo('');
        setIsCapitalAsset(false);
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.error || 'Gagal menyimpan pengeluaran.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catat Pengeluaran Kas"
      description="Pencatatan kas keluar harian dan belanja operasional / peralatan rental."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Kategori Pengeluaran
          </label>
          <select
            value={categoryName}
            onChange={(e) => {
              const val = e.target.value;
              setCategoryName(val);
              if (val === 'Pembelian peralatan') {
                setIsCapitalAsset(true);
              }
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
          >
            {DEFAULT_EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Nominal Amount */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Nominal Pengeluaran (Rp) <span className="text-rose-400">*</span>
          </label>
          <input
            type="number"
            min="1000"
            step="1000"
            value={amount || ''}
            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
            placeholder="Contoh: 50000"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Keterangan Pengeluaran <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            placeholder="Contoh: Beli token listrik PLN 50rb, bayar tagihan IndiHome"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            required
          />
        </div>

        {/* Reference Number */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Nomor Referensi / Struk (Opsional)
          </label>
          <input
            type="text"
            placeholder="Contoh: STRUK-20261013-01"
            value={referenceNo}
            onChange={(e) => setReferenceNo(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Capital Asset Distinction Checkbox */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
          <input
            type="checkbox"
            id="capitalAssetCheck"
            checked={isCapitalAsset}
            onChange={(e) => setIsCapitalAsset(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700 focus:ring-purple-500"
          />
          <label htmlFor="capitalAssetCheck" className="text-xs text-slate-300 cursor-pointer">
            <span className="font-semibold block text-white">Pembelian Aset / Peralatan (Capex)</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Centang jika ini merupakan pembelian aset jangka panjang (misal: tambah PS, TV, kipas), bukan beban operasional harian.
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting || amount <= 0}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/40 disabled:opacity-50"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
