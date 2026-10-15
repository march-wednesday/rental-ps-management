import React, { useState, useEffect } from 'react';
import { inventoryService } from '@/services/inventoryService';
import { excelService } from '@/services/excelService';
import { EquipmentItem } from '@/types';
import { formatRupiah, formatNumber } from '@/utils/formatters';
import {
  Zap,
  FileSpreadsheet,
  Plus,
  Calculator,
  AlertCircle,
  Tv,
  CheckCircle2,
  Trash2,
  Edit,
} from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { useToast } from '@/context/ToastContext';

export const InventoryPage: React.FC = () => {
  const { success, error } = useToast();
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const items = await inventoryService.getEquipment();
    setEquipmentList(items);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Electrical Calculator State
  const [dailyHours, setDailyHours] = useState<number>(14); // 14 jam per hari
  const [operatingDays, setOperatingDays] = useState<number>(30); // 30 hari per bulan
  const [kwhRate, setKwhRate] = useState<number>(1444.7); // Tarif PLN R-1/TR

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<EquipmentItem | null>(null);
  const [name, setName] = useState('');
  const [spec, setSpec] = useState('');
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState('Unit');
  const [unitPrice, setUnitPrice] = useState(0);
  const [wattage, setWattage] = useState(0);
  const [notes, setNotes] = useState('');

  // Calculations
  const totalCapex = equipmentList.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalWattage = equipmentList.reduce(
    (sum, item) => sum + item.quantity * (item.wattage || 0),
    0
  );

  // Formula: Energi bulanan (kWh) = Total watt × jam/hari × hari/bulan ÷ 1000
  const monthlyKwh = (totalWattage * dailyHours * operatingDays) / 1000;
  // Biaya listrik bulanan = Energi bulanan × tarif per kWh
  const monthlyCost = monthlyKwh * kwhRate;

  const handleOpenAdd = () => {
    setEditItem(null);
    setName('');
    setSpec('');
    setQty(1);
    setUnit('Unit');
    setUnitPrice(0);
    setWattage(0);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: EquipmentItem) => {
    setEditItem(item);
    setName(item.name);
    setSpec(item.specification || '');
    setQty(item.quantity);
    setUnit(item.unit);
    setUnitPrice(item.unitPrice);
    setWattage(item.wattage);
    setNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (editItem) {
        await inventoryService.updateEquipment(editItem.id, {
          name: name.trim(),
          specification: spec.trim() || undefined,
          quantity: qty,
          unit,
          unitPrice,
          wattage,
          notes: notes.trim() || undefined,
        });
        success('Peralatan Diperbarui', `${name} berhasil diubah.`);
      } else {
        await inventoryService.addEquipment({
          name: name.trim(),
          specification: spec.trim() || undefined,
          quantity: qty,
          unit,
          unitPrice,
          wattage,
          notes: notes.trim() || undefined,
          category: 'Peralatan Listrik',
        });
        success('Peralatan Ditambahkan', `${name} ditambahkan ke daftar inventaris.`);
      }

      await loadData();
      setIsModalOpen(false);
    } catch (err: any) {
      error('Gagal Menyimpan', err.message || 'Terjadi kesalahan.');
    }
  };

  const handleDelete = async (id: string, itemName: string) => {
    if (!window.confirm(`Yakin ingin menghapus "${itemName}" dari inventaris?`)) return;
    try {
      await inventoryService.deleteEquipment(id);
      await loadData();
      success('Peralatan Dihapus', 'Item dihapus dari daftar.');
    } catch (err: any) {
      error('Gagal Menghapus', err.message || 'Terjadi kesalahan.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Kelistrikan & Inventaris</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">
            Estimasi Peralatan Listrik & Daya
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Rincian komponen stabilizer, steker, kabel instalasi, serta kalkulator beban pemakaian daya kWh bulanan.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold shadow-lg shadow-amber-950/40 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Komponen</span>
          </button>
          <button
            onClick={() => excelService.exportEquipment()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-medium transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* KALKULATOR BEBAN LISTRIK BULANAN (Section 12 requirement) */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Kalkulator Estimasi Biaya Listrik Bulanan
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Hitung proyeksi tagihan listrik PLN berdasarkan total daya watt peralatan yang terpasang.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
          {/* Parameter 1: Total Watt */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">Total Daya Peralatan Aktif</label>
            <div className="text-xl font-bold text-amber-400 font-mono">
              {formatNumber(totalWattage)} <span className="text-xs text-slate-400">Watt</span>
            </div>
            <span className="text-[10px] text-slate-500">Dihitung dari seluruh komponen</span>
          </div>

          {/* Parameter 2: Jam Operasional */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">Jam Nyala / Hari</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="24"
                value={dailyHours}
                onChange={(e) => setDailyHours(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white font-mono"
              />
              <span className="text-xs text-slate-400">Jam/Hari</span>
            </div>
            <span className="text-[10px] text-slate-500">Default: 14 Jam Operasional</span>
          </div>

          {/* Parameter 3: Hari Operasional */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">Hari Kerja / Bulan</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="31"
                value={operatingDays}
                onChange={(e) => setOperatingDays(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white font-mono"
              />
              <span className="text-xs text-slate-400">Hari</span>
            </div>
            <span className="text-[10px] text-slate-500">Default: 30 Hari/Bulan</span>
          </div>

          {/* Parameter 4: Tarif PLN per kWh */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">Tarif Listrik PLN / kWh</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                value={kwhRate}
                onChange={(e) => setKwhRate(parseFloat(e.target.value) || 0)}
                className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white font-mono"
              />
              <span className="text-xs text-slate-400">Rp/kWh</span>
            </div>
            <span className="text-[10px] text-slate-500">Tarif R-1/TR 1300-2200 VA</span>
          </div>
        </div>

        {/* Calculation Result Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30">
            <span className="text-xs text-purple-300 font-semibold uppercase tracking-wider block">
              Proyeksi Konsumsi Energi Bulanan
            </span>
            <div className="text-2xl font-extrabold text-white font-mono mt-1">
              {monthlyKwh.toFixed(2)} <span className="text-sm font-normal text-purple-300">kWh / bulan</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Rumus: {totalWattage}W × {dailyHours}h × {operatingDays}d ÷ 1.000
            </span>
          </div>

          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30">
            <span className="text-xs text-amber-300 font-semibold uppercase tracking-wider block">
              Estimasi Biaya Listrik Bulanan
            </span>
            <div className="text-2xl font-extrabold text-amber-400 font-mono mt-1">
              {formatRupiah(monthlyCost)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              *Estimasi matematis beban peralatan terpasang, bukan tagihan meteran resmi PLN.
            </span>
          </div>
        </div>
      </div>

      {/* EQUIPMENT TABLE (Matching Workbook Sheet) */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-wide">
            Daftar Komponen Peralatan Listrik ({equipmentList.length} Item)
          </h3>
          <span className="text-xs font-semibold text-emerald-400 font-mono">
            Total Biaya Peralatan: {formatRupiah(totalCapex)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">No</th>
                <th className="py-3 px-4">Nama Komponen</th>
                <th className="py-3 px-3">Spesifikasi</th>
                <th className="py-3 px-3 text-center">Kuantitas</th>
                <th className="py-3 px-3">Satuan</th>
                <th className="py-3 px-3 text-right">Harga Satuan (Rp)</th>
                <th className="py-3 px-3 text-right">Total Biaya (Rp)</th>
                <th className="py-3 px-3 text-center">Daya Watt</th>
                <th className="py-3 px-3">Catatan</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {equipmentList.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-3 text-slate-500 font-mono">{idx + 1}</td>
                  <td className="py-3 px-4 text-white font-semibold">{item.name}</td>
                  <td className="py-3 px-3 text-slate-400">{item.specification || '-'}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-purple-300">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-3 text-slate-300">{item.unit}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    {formatRupiah(item.unitPrice)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                    {formatRupiah(item.totalPrice)}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-amber-300">
                    {item.wattage > 0 ? `${item.wattage} W` : '-'}
                  </td>
                  <td className="py-3 px-3 text-slate-400 italic text-[11px]">
                    {item.notes || '-'}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Edit komponen"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Hapus komponen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editItem ? 'Edit Komponen Peralatan' : 'Tambah Komponen Peralatan'}
        description="Komponen listrik dan spesifikasi daya watt."
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nama Komponen <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Stabilizer 1.000 VA, Kipas angin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Spesifikasi Teknis
            </label>
            <input
              type="text"
              placeholder="Contoh: Matsunaga 1000W / Servo Motor System"
              value={spec}
              onChange={(e) => setSpec(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Kuantitas</label>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Satuan</label>
              <input
                type="text"
                placeholder="Unit, Meter, Pcs"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Daya (Watt)</label>
              <input
                type="number"
                min="0"
                value={wattage}
                onChange={(e) => setWattage(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Harga Satuan (Rp)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={unitPrice}
              onChange={(e) => setUnitPrice(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Catatan</label>
            <input
              type="text"
              placeholder="Catatan fungsi atau penempatan"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold shadow-lg shadow-amber-950/40"
            >
              Simpan Komponen
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
