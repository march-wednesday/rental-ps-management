// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - DOMAIN TYPES
// ==============================================================================

export type UserRole = 'owner' | 'operator';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export type UnitStatus = 'Tersedia' | 'Sedang Disewa' | 'Maintenance' | 'Nonaktif';

export interface PSUnit {
  id: string;
  code: string; // PS-01, PS-02
  name: string; // PS4 Unit 1, PS4 Unit 2
  consoleType: string; // PS4, PS5
  status: UnitStatus;
  notes?: string;
  hourlyRate: number; // e.g. 10000
  createdAt: string;
  updatedAt: string;
}

export interface TariffPackage {
  id: string;
  name: string; // e.g. "Reguler 1 Jam", "Reguler 2 Jam"
  durationMinutes: number; // 60, 120
  price: number; // 10000, 20000
  isActive: boolean;
  sortOrder: number;
}

export type RentalStatus = 'active' | 'completed' | 'cancelled';
export type PaymentStatus = 'Belum Bayar' | 'Sebagian' | 'Lunas';
export type PaymentMethod = 'Tunai' | 'Transfer' | 'QRIS' | 'Lainnya';

export interface RentalSession {
  id: string;
  rentalCode: string; // e.g. RENT-20261013-0001
  unitId: string;
  unitCode: string;
  unitName: string;
  customerName: string;
  customerPhone?: string;
  tariffPackageId?: string;
  tariffPackageName?: string;
  durationMinutes: number;
  startTime: string; // ISO String (WITA)
  targetEndTime: string; // ISO String (WITA)
  actualEndTime?: string; // ISO String (WITA)
  status: RentalStatus;
  totalPrice: number;
  totalPaid: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  invoiceNo: string;
  rentalId: string;
  rentalCode: string;
  unitCode: string;
  customerName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  notes?: string;
  createdBy?: string;
  createdByName?: string;
}

export type CashTxType = 'in' | 'out';
export type CashTxStatus = 'valid' | 'void' | 'corrected';

export interface CashTransaction {
  id: string;
  transactionNo: string; // CSH-IN-..., CSH-OUT-...
  transactionDate: string;
  categoryId?: string;
  categoryName: string;
  type: CashTxType;
  amount: number;
  balanceAfter?: number; // Saldo berjalan
  referenceNo?: string;
  rentalId?: string;
  paymentId?: string;
  description: string;
  isCapitalAsset: boolean; // Pembelian aset vs Biaya operasional rutin
  status: CashTxStatus;
  voidReason?: string;
  voidedBy?: string;
  voidedAt?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
}

export interface EquipmentItem {
  id: string;
  name: string; // Stabilizer 1.000 VA, Kipas dinding, etc.
  specification?: string;
  quantity: number;
  unit: string; // Unit, Meter, Pcs, Paket
  unitPrice: number;
  totalPrice: number;
  wattage: number; // Watt
  notes?: string;
  category: string;
}

export interface ElectricityEstimationSettings {
  totalWattage: number;
  dailyOperatingHours: number; // default 14
  monthlyOperatingDays: number; // default 30
  tariffPerKwh: number; // default 1444.70 (Tarif R-1/TR 1300-2200 VA)
}

export interface AuditLogItem {
  id: string;
  action: string;
  tableName: string;
  recordId?: string;
  actorEmail?: string;
  actorName?: string;
  changes?: Record<string, any>;
  createdAt: string;
}

export interface AppGeneralSettings {
  appName: string;
  businessName: string;
  timezone: string;
  currency: string;
  electricityKwhRate: number;
  operatingHoursPerDay: number;
  operatingDaysPerMonth: number;
  overtimeGraceMinutes: number;
  overtimeChargePer15Min: number;
}

export interface ImportBatchSummary {
  id: string;
  filename: string;
  sheetName: string;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  importedBy?: string;
  importedByName?: string;
  createdAt: string;
  notes?: string;
}

export interface ImportParsedRow {
  rowIndex: number;
  sheetName: string;
  rawData: Record<string, any>;
  parsedData: Record<string, any>;
  status: 'valid' | 'invalid' | 'needs_confirmation' | 'duplicate';
  errors: string[];
  warnings: string[];
}
