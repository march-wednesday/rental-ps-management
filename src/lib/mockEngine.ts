// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - LOCAL REACTIVE ENGINE & SEED STORE
// Provides full operational parity with Supabase database & RPC procedures.
// ==============================================================================

import {
  PSUnit,
  TariffPackage,
  RentalSession,
  PaymentRecord,
  CashTransaction,
  EquipmentItem,
  AuditLogItem,
  AppGeneralSettings,
  UserProfile,
  ImportBatchSummary,
} from '@/types';

const STORAGE_KEY = 'rental_ps_database_v1';

export interface DatabaseState {
  profiles: UserProfile[];
  currentUser: UserProfile;
  units: PSUnit[];
  tariffPackages: TariffPackage[];
  rentals: RentalSession[];
  payments: PaymentRecord[];
  cashTransactions: CashTransaction[];
  equipment: EquipmentItem[];
  auditLogs: AuditLogItem[];
  settings: AppGeneralSettings;
  importBatches: ImportBatchSummary[];
}

const INITIAL_STATE: DatabaseState = {
  profiles: [
    {
      id: 'usr-owner-001',
      email: 'owner@rentalps.com',
      fullName: 'Owner Rental PS',
      role: 'owner',
      createdAt: '2026-10-01T08:00:00.000Z',
    },
    {
      id: 'usr-operator-001',
      email: 'operator@rentalps.com',
      fullName: 'Operator Kasir Shift 1',
      role: 'operator',
      createdAt: '2026-10-01T08:00:00.000Z',
    },
  ],
  currentUser: {
    id: 'usr-operator-001',
    email: 'kasir@rentalps.com',
    fullName: 'Kasir Shift 1',
    role: 'operator',
    createdAt: '2026-10-01T08:00:00.000Z',
  },
  units: [
    {
      id: 'unit-ps-01',
      code: 'PS-01',
      name: 'PS4 Unit 1',
      consoleType: 'PS4',
      status: 'Tersedia',
      notes: 'Unit 1 dekat pintu masuk, TV Sony 43 inch, 2 Stik DualShock 4 Wireless',
      hourlyRate: 10000,
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-01T08:00:00.000Z',
    },
    {
      id: 'unit-ps-02',
      code: 'PS-02',
      name: 'PS4 Unit 2',
      consoleType: 'PS4',
      status: 'Tersedia',
      notes: 'Unit 2 area sofa tengah, TV Samsung 43 inch, 2 Stik DualShock 4 Wireless',
      hourlyRate: 10000,
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-01T08:00:00.000Z',
    },
  ],
  tariffPackages: [
    {
      id: 'pkg-1',
      name: 'Reguler 1 Jam',
      durationMinutes: 60,
      price: 10000,
      isActive: true,
      sortOrder: 1,
    },
    {
      id: 'pkg-2',
      name: 'Reguler 2 Jam',
      durationMinutes: 120,
      price: 20000,
      isActive: true,
      sortOrder: 2,
    },
    {
      id: 'pkg-3',
      name: 'Paket Hemat 3 Jam',
      durationMinutes: 180,
      price: 28000,
      isActive: true,
      sortOrder: 3,
    },
    {
      id: 'pkg-4',
      name: 'Paket Begadang 5 Jam',
      durationMinutes: 300,
      price: 45000,
      isActive: true,
      sortOrder: 4,
    },
  ],
  rentals: [],
  payments: [],
  cashTransactions: [],
  equipment: [
    {
      id: 'eq-01',
      name: 'Stabilizer 1.000 VA',
      specification: 'Matsunaga 1000W / Servo Motor System',
      quantity: 2,
      unit: 'Unit',
      unitPrice: 350000,
      totalPrice: 700000,
      wattage: 20,
      notes: 'Pengaman tegangan PS4 dan TV',
      category: 'Peralatan Listrik',
    },
    {
      id: 'eq-02',
      name: 'Kipas dinding',
      specification: 'Maspion 16 Inch Dinding (Wall Fan)',
      quantity: 2,
      unit: 'Unit',
      unitPrice: 285000,
      totalPrice: 570000,
      wattage: 55,
      notes: 'Sirkulasi udara area rental',
      category: 'Peralatan Listrik',
    },
    {
      id: 'eq-03',
      name: 'Stopkontak heavy duty',
      specification: 'Broco 4 Lubang + Saklar Arde',
      quantity: 3,
      unit: 'Unit',
      unitPrice: 65000,
      totalPrice: 195000,
      wattage: 0,
      notes: 'Titik daya colokan konsol & TV',
      category: 'Peralatan Listrik',
    },
    {
      id: 'eq-04',
      name: 'Kabel listrik',
      specification: 'Supreme NYM 2x1.5mm',
      quantity: 30,
      unit: 'Meter',
      unitPrice: 14000,
      totalPrice: 420000,
      wattage: 0,
      notes: 'Instalasi jalur utama rental',
      category: 'Peralatan Listrik',
    },
    {
      id: 'eq-05',
      name: 'Steker heavy duty',
      specification: 'Broco Steker Arde Bengkok 16A',
      quantity: 4,
      unit: 'Pcs',
      unitPrice: 18000,
      totalPrice: 72000,
      wattage: 0,
      notes: 'Steker tahan panas',
      category: 'Peralatan Listrik',
    },
    {
      id: 'eq-06',
      name: 'Lampu LED',
      specification: 'Philips LED Bulb 14 Watt Cool Daylight',
      quantity: 3,
      unit: 'Pcs',
      unitPrice: 52000,
      totalPrice: 156000,
      wattage: 14,
      notes: 'Penerangan ruangan utama',
      category: 'Peralatan Listrik',
    },
    {
      id: 'eq-07',
      name: 'Aksesori instalasi',
      specification: 'Klem kabel, isolasi unibel, paku beton, baut',
      quantity: 1,
      unit: 'Paket',
      unitPrice: 75000,
      totalPrice: 75000,
      wattage: 0,
      notes: 'Kelengkapan pasang listrik',
      category: 'Peralatan Listrik',
    },
  ],
  auditLogs: [
    {
      id: 'log-init',
      action: 'SYSTEM_INITIALIZED',
      tableName: 'system',
      actorEmail: 'system',
      actorName: 'System Kernel',
      changes: { message: 'Database initialized with seed units PS-01 and PS-02' },
      createdAt: new Date().toISOString(),
    },
  ],
  settings: {
    appName: 'Rental PS Management System',
    businessName: 'Rental PS Hub',
    timezone: 'Asia/Makassar',
    currency: 'IDR',
    electricityKwhRate: 1444.7,
    operatingHoursPerDay: 14,
    operatingDaysPerMonth: 30,
    overtimeGraceMinutes: 5,
    overtimeChargePer15Min: 3000,
    ownerPin: '1234',
  },
  importBatches: [],
};

// Memory store & persistence
class LocalEngine {
  private state: DatabaseState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DatabaseState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure units PS-01 and PS-02 always exist
        if (!parsed.units || parsed.units.length === 0) {
          parsed.units = INITIAL_STATE.units;
        }
        return { ...INITIAL_STATE, ...parsed };
      }
    } catch (e) {
      console.warn('Could not read from localStorage, using initial state', e);
    }
    return JSON.parse(JSON.stringify(INITIAL_STATE));
  }

  private persistState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public resetToDefault() {
    this.state = JSON.parse(JSON.stringify(INITIAL_STATE));
    this.persistState();
  }

  public setCurrentUser(user: UserProfile) {
    this.state.currentUser = user;
    this.persistState();
  }

  // ==========================================
  // ATOMIC RPC EQUIVALENTS
  // ==========================================

  /**
   * RPC: Start Rental
   * Validates unit availability, ensures no concurrent session, sets unit status to 'Sedang Disewa'
   */
  public rpcStartRental(params: {
    unitId: string;
    customerName: string;
    customerPhone?: string;
    tariffPackageId?: string;
    durationMinutes: number;
    notes?: string;
  }): { success: boolean; rental: RentalSession; error?: string } {
    const unit = this.state.units.find((u) => u.id === params.unitId);
    if (!unit) {
      return { success: false, rental: null as any, error: 'Unit tidak ditemukan.' };
    }

    if (unit.status !== 'Tersedia') {
      return {
        success: false,
        rental: null as any,
        error: `Unit sedang tidak tersedia (status: ${unit.status}).`,
      };
    }

    const activeRental = this.state.rentals.find(
      (r) => r.unitId === params.unitId && r.status === 'active'
    );
    if (activeRental) {
      return {
        success: false,
        rental: null as any,
        error: 'Unit ini sudah memiliki sesi rental yang sedang berjalan.',
      };
    }

    // Price calculation
    let totalPrice = 0;
    let tariffPackageName = undefined;
    if (params.tariffPackageId) {
      const pkg = this.state.tariffPackages.find((p) => p.id === params.tariffPackageId);
      if (pkg) {
        totalPrice = pkg.price;
        tariffPackageName = pkg.name;
      }
    }
    if (totalPrice === 0) {
      totalPrice = (params.durationMinutes / 60) * unit.hourlyRate;
    }

    const now = new Date();
    const targetEnd = new Date(now.getTime() + params.durationMinutes * 60 * 1000);
    const rentalCode = `RENT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}-${String(Math.floor(1000 + Math.random() * 9000))}`;

    const newRental: RentalSession = {
      id: `rent-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      rentalCode,
      unitId: unit.id,
      unitCode: unit.code,
      unitName: unit.name,
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
      notes: params.notes,
      createdBy: this.state.currentUser.id,
      createdByName: this.state.currentUser.fullName,
      createdAt: now.toISOString(),
    };

    // Update unit
    unit.status = 'Sedang Disewa';
    unit.updatedAt = now.toISOString();

    this.state.rentals.unshift(newRental);

    // Audit log
    this.addAuditLog({
      action: 'START_RENTAL',
      tableName: 'rentals',
      recordId: newRental.id,
      changes: {
        rentalCode,
        unitCode: unit.code,
        customerName: params.customerName,
        durationMinutes: params.durationMinutes,
        totalPrice,
      },
    });

    this.persistState();
    return { success: true, rental: newRental };
  }

  /**
   * RPC: Extend Rental (Tambah Waktu)
   */
  public rpcExtendRental(params: {
    rentalId: string;
    additionalMinutes: number;
    additionalPrice: number;
  }): { success: boolean; rental: RentalSession; error?: string } {
    const rental = this.state.rentals.find((r) => r.id === params.rentalId);
    if (!rental) {
      return { success: false, rental: null as any, error: 'Sesi rental tidak ditemukan.' };
    }

    if (rental.status !== 'active') {
      return { success: false, rental: null as any, error: 'Hanya sesi aktif yang dapat diperpanjang.' };
    }

    const currentTargetMs = new Date(rental.targetEndTime).getTime();
    const newTargetMs = currentTargetMs + params.additionalMinutes * 60 * 1000;
    const newTargetEnd = new Date(newTargetMs).toISOString();

    rental.durationMinutes += params.additionalMinutes;
    rental.targetEndTime = newTargetEnd;
    rental.totalPrice += params.additionalPrice;

    if (rental.totalPaid >= rental.totalPrice) {
      rental.paymentStatus = 'Lunas';
    } else if (rental.totalPaid > 0) {
      rental.paymentStatus = 'Sebagian';
    } else {
      rental.paymentStatus = 'Belum Bayar';
    }

    this.addAuditLog({
      action: 'EXTEND_RENTAL',
      tableName: 'rentals',
      recordId: rental.id,
      changes: {
        additionalMinutes: params.additionalMinutes,
        additionalPrice: params.additionalPrice,
        newTargetEndTime: newTargetEnd,
        newTotalPrice: rental.totalPrice,
      },
    });

    this.persistState();
    return { success: true, rental };
  }

  /**
   * RPC: Complete Rental (Selesaikan Sewa)
   */
  public rpcCompleteRental(params: {
    rentalId: string;
  }): { success: boolean; rental: RentalSession; error?: string } {
    const rental = this.state.rentals.find((r) => r.id === params.rentalId);
    if (!rental) {
      return { success: false, rental: null as any, error: 'Sesi rental tidak ditemukan.' };
    }

    if (rental.status !== 'active') {
      return { success: false, rental: null as any, error: 'Sesi rental ini sudah tidak aktif.' };
    }

    const now = new Date().toISOString();
    rental.status = 'completed';
    rental.actualEndTime = now;

    // Release unit
    const unit = this.state.units.find((u) => u.id === rental.unitId);
    if (unit) {
      unit.status = 'Tersedia';
      unit.updatedAt = now;
    }

    this.addAuditLog({
      action: 'COMPLETE_RENTAL',
      tableName: 'rentals',
      recordId: rental.id,
      changes: {
        actualEndTime: now,
        totalPrice: rental.totalPrice,
        totalPaid: rental.totalPaid,
        paymentStatus: rental.paymentStatus,
      },
    });

    this.persistState();
    return { success: true, rental };
  }

  /**
   * RPC: Cancel Rental (Batalkan Sewa)
   */
  public rpcCancelRental(params: {
    rentalId: string;
    reason: string;
  }): { success: boolean; error?: string } {
    const rental = this.state.rentals.find((r) => r.id === params.rentalId);
    if (!rental) {
      return { success: false, error: 'Sesi rental tidak ditemukan.' };
    }

    if (rental.status !== 'active') {
      return { success: false, error: 'Sesi rental ini sudah tidak aktif.' };
    }

    if (rental.totalPaid > 0) {
      return {
        success: false,
        error: 'Sesi dengan pembayaran tercatat tidak dapat dibatalkan langsung. Refund pembayaran terlebih dahulu.',
      };
    }

    const now = new Date().toISOString();
    rental.status = 'cancelled';
    rental.actualEndTime = now;
    rental.notes = `${rental.notes ? rental.notes + ' | ' : ''}Dibatalkan: ${params.reason}`;

    const unit = this.state.units.find((u) => u.id === rental.unitId);
    if (unit) {
      unit.status = 'Tersedia';
      unit.updatedAt = now;
    }

    this.addAuditLog({
      action: 'CANCEL_RENTAL',
      tableName: 'rentals',
      recordId: rental.id,
      changes: { reason: params.reason },
    });

    this.persistState();
    return { success: true };
  }

  /**
   * RPC: Record Payment and Atomic Cash Transaction (Buku Kas Masuk)
   */
  public rpcRecordPayment(params: {
    rentalId: string;
    amount: number;
    paymentMethod: 'Tunai' | 'Transfer' | 'QRIS' | 'Lainnya';
    notes?: string;
  }): { success: boolean; payment: PaymentRecord; error?: string } {
    if (params.amount <= 0) {
      return { success: false, payment: null as any, error: 'Nominal pembayaran harus lebih dari 0.' };
    }

    const rental = this.state.rentals.find((r) => r.id === params.rentalId);
    if (!rental) {
      return { success: false, payment: null as any, error: 'Sesi rental tidak ditemukan.' };
    }

    const remainingDue = rental.totalPrice - rental.totalPaid;
    if (params.amount > remainingDue) {
      return {
        success: false,
        payment: null as any,
        error: `Nominal Rp ${params.amount.toLocaleString()} melebihi sisa tagihan Rp ${remainingDue.toLocaleString()}.`,
      };
    }

    const now = new Date();
    const invoiceNo = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const payment: PaymentRecord = {
      id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      invoiceNo,
      rentalId: rental.id,
      rentalCode: rental.rentalCode,
      unitCode: rental.unitCode,
      customerName: rental.customerName,
      amount: params.amount,
      paymentMethod: params.paymentMethod,
      paymentDate: now.toISOString(),
      notes: params.notes,
      createdBy: this.state.currentUser.id,
      createdByName: this.state.currentUser.fullName,
    };

    // Update rental
    rental.totalPaid += params.amount;
    if (rental.totalPaid >= rental.totalPrice) {
      rental.paymentStatus = 'Lunas';
    } else {
      rental.paymentStatus = 'Sebagian';
    }

    // Atomic Cash Transaction (Kas Masuk)
    const cashTx: CashTransaction = {
      id: `csh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      transactionNo: `CSH-IN-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
        now.getDate()
      ).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
      transactionDate: now.toISOString(),
      categoryName: 'Pendapatan Rental',
      type: 'in',
      amount: params.amount,
      referenceNo: invoiceNo,
      rentalId: rental.id,
      paymentId: payment.id,
      description: `Pembayaran Rental (${rental.rentalCode}) - Pelanggan: ${rental.customerName} [${params.paymentMethod}]`,
      isCapitalAsset: false,
      status: 'valid',
      createdBy: this.state.currentUser.id,
      createdByName: this.state.currentUser.fullName,
      createdAt: now.toISOString(),
    };

    this.state.payments.unshift(payment);
    this.state.cashTransactions.unshift(cashTx);

    this.addAuditLog({
      action: 'PAYMENT_RECORDED',
      tableName: 'payments',
      recordId: payment.id,
      changes: {
        rentalCode: rental.rentalCode,
        amount: params.amount,
        paymentMethod: params.paymentMethod,
        invoiceNo,
      },
    });

    this.persistState();
    return { success: true, payment };
  }

  /**
   * RPC: Record Expense (Kas Keluar)
   */
  public rpcRecordExpense(params: {
    categoryName: string;
    amount: number;
    description: string;
    referenceNo?: string;
    isCapitalAsset: boolean;
    transactionDate?: string;
  }): { success: boolean; transaction: CashTransaction; error?: string } {
    if (params.amount <= 0) {
      return { success: false, transaction: null as any, error: 'Nominal pengeluaran harus lebih dari 0.' };
    }

    const now = new Date();
    const txDate = params.transactionDate || now.toISOString();
    const transactionNo = `CSH-OUT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const cashTx: CashTransaction = {
      id: `csh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      transactionNo,
      transactionDate: txDate,
      categoryName: params.categoryName,
      type: 'out',
      amount: params.amount,
      referenceNo: params.referenceNo || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
      description: params.description.trim(),
      isCapitalAsset: Boolean(params.isCapitalAsset),
      status: 'valid',
      createdBy: this.state.currentUser.id,
      createdByName: this.state.currentUser.fullName,
      createdAt: now.toISOString(),
    };

    this.state.cashTransactions.unshift(cashTx);

    this.addAuditLog({
      action: 'EXPENSE_RECORDED',
      tableName: 'cash_transactions',
      recordId: cashTx.id,
      changes: {
        categoryName: params.categoryName,
        amount: params.amount,
        isCapitalAsset: params.isCapitalAsset,
        description: params.description,
      },
    });

    this.persistState();
    return { success: true, transaction: cashTx };
  }

  /**
   * RPC: Void Cash Transaction
   */
  public rpcVoidCashTransaction(params: {
    transactionId: string;
    reason: string;
  }): { success: boolean; error?: string } {
    const tx = this.state.cashTransactions.find((t) => t.id === params.transactionId);
    if (!tx) {
      return { success: false, error: 'Transaksi tidak ditemukan.' };
    }

    if (tx.status === 'void') {
      return { success: false, error: 'Transaksi ini sudah berstatus void.' };
    }

    if (!params.reason || !params.reason.trim()) {
      return { success: false, error: 'Alasan pembatalan/void wajib diisi.' };
    }

    const now = new Date().toISOString();
    tx.status = 'void';
    tx.voidReason = params.reason.trim();
    tx.voidedBy = this.state.currentUser.id;
    tx.voidedAt = now;

    this.addAuditLog({
      action: 'VOID_CASH_TRANSACTION',
      tableName: 'cash_transactions',
      recordId: tx.id,
      changes: {
        transactionNo: tx.transactionNo,
        amount: tx.amount,
        type: tx.type,
        reason: params.reason,
      },
    });

    this.persistState();
    return { success: true };
  }

  // ==========================================
  // UNIT MANAGEMENT
  // ==========================================
  public updateUnit(unitId: string, updates: Partial<PSUnit>): boolean {
    const unit = this.state.units.find((u) => u.id === unitId);
    if (!unit) return false;
    Object.assign(unit, updates, { updatedAt: new Date().toISOString() });
    this.persistState();
    return true;
  }

  public addUnit(unit: Omit<PSUnit, 'id' | 'createdAt' | 'updatedAt'>): PSUnit {
    const newUnit: PSUnit = {
      ...unit,
      id: `unit-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.units.push(newUnit);
    this.persistState();
    return newUnit;
  }

  // ==========================================
  // TARIFF PACKAGES
  // ==========================================
  public saveTariffPackages(packages: TariffPackage[]) {
    this.state.tariffPackages = packages;
    this.persistState();
  }

  // ==========================================
  // EQUIPMENT / ELECTRICAL INVENTORY
  // ==========================================
  public addEquipment(item: Omit<EquipmentItem, 'id' | 'totalPrice'>): EquipmentItem {
    const newItem: EquipmentItem = {
      ...item,
      id: `eq-${Date.now()}`,
      totalPrice: item.quantity * item.unitPrice,
    };
    this.state.equipment.push(newItem);
    this.persistState();
    return newItem;
  }

  public updateEquipment(id: string, updates: Partial<EquipmentItem>): boolean {
    const item = this.state.equipment.find((e) => e.id === id);
    if (!item) return false;
    Object.assign(item, updates);
    item.totalPrice = item.quantity * item.unitPrice;
    this.persistState();
    return true;
  }

  public deleteEquipment(id: string): boolean {
    const idx = this.state.equipment.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    this.state.equipment.splice(idx, 1);
    this.persistState();
    return true;
  }

  // ==========================================
  // APP SETTINGS
  // ==========================================
  public updateSettings(settings: Partial<AppGeneralSettings>) {
    this.state.settings = { ...this.state.settings, ...settings };
    this.persistState();
  }

  // ==========================================
  // EXCEL IMPORT BATCH
  // ==========================================
  public addImportBatch(batch: ImportBatchSummary) {
    this.state.importBatches.unshift(batch);
    this.persistState();
  }

  // ==========================================
  // AUDIT LOG HELPER
  // ==========================================
  public addAuditLog(params: {
    action: string;
    tableName: string;
    recordId?: string;
    changes?: Record<string, any>;
  }) {
    const log: AuditLogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action: params.action,
      tableName: params.tableName,
      recordId: params.recordId,
      actorEmail: this.state.currentUser.email,
      actorName: this.state.currentUser.fullName,
      changes: params.changes,
      createdAt: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(log);
    // keep max 500 logs
    if (this.state.auditLogs.length > 500) {
      this.state.auditLogs = this.state.auditLogs.slice(0, 500);
    }
  }

  // ==========================================
  // FINANCIAL CALCULATIONS (Single Source of Truth)
  // ==========================================
  public getFinancialSummary() {
    // Valid cash transactions only (non-void)
    const validTx = this.state.cashTransactions.filter((t) => t.status !== 'void');

    const totalCashIn = validTx
      .filter((t) => t.type === 'in')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalCashOut = validTx
      .filter((t) => t.type === 'out')
      .reduce((sum, t) => sum + t.amount, 0);

    // Current Cash Balance
    const cashBalance = totalCashIn - totalCashOut;

    // Distinguish operational expenses vs capital asset purchases
    const operationalExpenses = validTx
      .filter((t) => t.type === 'out' && !t.isCapitalAsset)
      .reduce((sum, t) => sum + t.amount, 0);

    const capitalAssetPurchases = validTx
      .filter((t) => t.type === 'out' && t.isCapitalAsset)
      .reduce((sum, t) => sum + t.amount, 0);

    // Rental Turnover / Omzet (Total billing from non-cancelled rentals)
    const validRentals = this.state.rentals.filter((r) => r.status !== 'cancelled');
    const totalRentalOmzet = validRentals.reduce((sum, r) => sum + r.totalPrice, 0);
    const totalRentalCollected = validRentals.reduce((sum, r) => sum + r.totalPaid, 0);
    const totalReceivables = totalRentalOmzet - totalRentalCollected; // Piutang

    // Estimated Operational Profit = Rental Omzet - Operational Expenses
    // Note requirement: "Jangan menyebut sisa kas sebagai laba."
    const estimatedOperationalProfit = totalRentalOmzet - operationalExpenses;

    // Active sessions & unit availability
    const activeRentals = this.state.rentals.filter((r) => r.status === 'active');
    const availableUnits = this.state.units.filter((u) => u.status === 'Tersedia').length;

    return {
      cashBalance,
      totalCashIn,
      totalCashOut,
      operationalExpenses,
      capitalAssetPurchases,
      totalRentalOmzet,
      totalRentalCollected,
      totalReceivables,
      estimatedOperationalProfit,
      activeSessionsCount: activeRentals.length,
      availableUnitsCount: availableUnits,
      totalUnitsCount: this.state.units.length,
    };
  }
}

export const localEngine = new LocalEngine();
