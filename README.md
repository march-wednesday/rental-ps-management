# RENTAL PS MANAGEMENT SYSTEM

Aplikasi web full-stack modern berbasis **React, Vite, TypeScript, Tailwind CSS, PostgreSQL, dan Supabase** yang dirancang khusus untuk operasional usaha rental PlayStation.

---

## 🎮 Ringkasan Sistem

- **Nama Usaha**: Rental PS Management System
- **Unit Awal**:
  - `PS-01`: PS4 Unit 1 (Dekat pintu masuk, TV Sony 43", 2 Stik DualShock 4 Wireless)
  - `PS-02`: PS4 Unit 2 (Area sofa tengah, TV Samsung 43", 2 Stik DualShock 4 Wireless)
- **Tarif Dasar**: Rp10.000 / Jam, Rp20.000 / 2 Jam (Dapat diubah dinamis oleh Owner)
- **Mata Uang**: Rupiah (IDR)
- **Zona Waktu**: Asia/Makassar (WITA, UTC+8)
- **Prinsip Keuangan Utama**:
  - Saldo Kas Berjalan dihitung nyata dari *Total Kas Masuk - Total Kas Keluar (Non-Void)*
  - Laba Operasional dihitung dari *Omzet Rental - Beban Operasional Rutin* (tidak mencampuradukkan belanja modal peralatan jangka panjang)

---

## 🛠️ Arsitektur Teknologi

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, Lucide Icons, Date & Intl Formatters
- **Routing**: React Router DOM (Single Page Application dengan fallback `vercel.json`)
- **Backend & Database**: Supabase PostgreSQL 15+, Supabase Auth, Row Level Security (RLS), Partial Unique Indexes
- **Sinkronisasi Hybrid**: Memiliki **Dual Engine** (Dapat berjalan langsung menggunakan *Local Reactive Engine* untuk demo/operasional lokal, dan langsung otomatis tersinkronisasi ke *Supabase Cloud* saat kredensial `.env` diisi).
- **Integrasi Excel**: Library `xlsx` mendukung parsing waktu teks (`12.30`, `12:30`), normalisasi nama unit, deteksi status ambigu (`CU`), dry run preview, dan ekspor multi-sheet.

---

## 📂 Struktur Menu & Navigasi

| Rute URL | Menu | Deskripsi |
| :--- | :--- | :--- |
| `/login` | Login | Autentikasi Supabase & quick-fill role switcher untuk QA |
| `/dashboard` | Dashboard | KPI finansial, omzet, kas masuk/keluar, saldo kas, unit aktif |
| `/rental` | Penyewaan PS | Operasional kasir: Kartu visual PS-01 & PS-02 dengan timer real-time |
| `/logbook` | Logbook Harian | Riwayat seluruh sesi bermain PlayStation dan filter status |
| `/keuangan/kas` | Buku Kas Harian | Pencatatan kas masuk & kas keluar dengan saldo berjalan |
| `/keuangan/pengeluaran` | Pengeluaran | Pemisahan beban operasional rutin (Opex) vs Belanja aset (Capex) |
| `/laporan` | Laporan Keuangan | Laporan Laba Rugi eksekutif (Harian, Mingguan, Bulanan, Tahunan) |
| `/inventaris` | Inventaris & Listrik | Daftar komponen listrik & Kalkulator estimasi beban kWh bulanan |
| `/excel` | Impor & Ekspor Excel | Upload workbook XLSX, validasi per baris, dry run, dan ekspor |
| `/pengaturan/tarif` | Pengaturan Tarif | Manajemen katalog durasi paket sewa & tarif dasar unit |
| `/pengaturan/aplikasi` | Pengaturan Aplikasi | Konfigurasi sistem, zona waktu WITA, dan diagnostik Supabase |
| `/pengguna` | Manajemen Pengguna | Pengaturan peran akun Owner vs Operator beserta matriks izin |
| `/audit-log` | Audit Log | Rekam jejak seluruh mutasi transaksi dan aktivitas kasir |

---

## 🗄️ Database Supabase & Migrasi SQL

Skema database PostgreSQL tersedia lengkap di folder [`supabase/migrations/001_initial_schema.sql`](file:///c:/Users/hence/.gemini/antigravity/scratch/PS/supabase/migrations/001_initial_schema.sql):

1. **Tabel Database**:
   - `profiles`: Akun kasir dan pemilik dengan kolom `role` ('owner' | 'operator')
   - `units`: Master unit konsol (`PS-01`, `PS-02`) dengan status ('Tersedia', 'Sedang Disewa', 'Maintenance', 'Nonaktif')
   - `tariff_packages`: Paket tarif durasi sewa
   - `rentals`: Sesi rental aktif dan riwayat bermain
   - `payments`: Pembayaran transaksi sewa
   - `cash_categories`: Kategori kas masuk dan kas keluar
   - `cash_transactions`: Transaksi buku kas dengan saldo berjalan
   - `equipment`: Inventaris peralatan listrik & daya watt
   - `audit_logs`: Audit trail sistem
   - `app_settings`: Parameter umum aplikasi
   - `import_batches` & `import_rows`: Pelacakan audit hasil impor file Excel

2. **Jaminan Integritas & Keamanan**:
   - **Partial Unique Index**:
     ```sql
     CREATE UNIQUE INDEX idx_unique_active_rental_per_unit 
     ON public.rentals (unit_id) 
     WHERE status = 'active';
     ```
     Menjamin di level database PostgreSQL bahwa tidak akan pernah ada dua sesi aktif bersamaan pada unit PlayStation yang sama.
   - **Atomic Stored Procedures (RPC)**:
     - `rpc_start_rental`: Validasi status unit, pencatatan rental, update unit status
     - `rpc_extend_rental`: Tambah waktu dan target selesai
     - `rpc_complete_rental`: Selesaikan rental dan set unit kembali Tersedia
     - `rpc_cancel_rental`: Pembatalan sesi dengan proteksi pembayaran
     - `rpc_record_payment`: Atomik mencatat pembayaran, update status piutang sewa, dan otomatis mencatat kas masuk di Buku Kas Harian
     - `rpc_record_expense`: Catat kas keluar dan klasifikasi aset modal
     - `rpc_void_cash_transaction`: Pembatalan transaksi kas dengan alasan audit wajib

---

## 📊 Integrasi Workbook Excel (`Laporan_dan_Logbook_Rental_PS.xlsx`)

Sistem siap menerima file **`Laporan_dan_Logbook_Rental_PS.xlsx`**. Anda cukup menaruh file tersebut di folder proyek atau mengunggahnya langsung melalui halaman web **`/excel`**.

Sistem mengenali 3 sheet utama:
1. **`Logbook Harian`**:
   - Kolom: Unit, Nama Pelanggan, Tanggal, Jam Mulai, Durasi, Total, Status
   - Menangani format waktu teks (`12.30`, `12:30`, `09.15`) maupun pecahan serial Excel
   - Otomatis menormalisasi nama unit (misal: "Unit 1", "ps 1" -> `PS-01`)
   - Menandai status ambigu seperti `CU` untuk dikonfirmasi operator sebelum disimpan
2. **`Buku Kas Harian`**:
   - Kolom: Nomor, Tanggal, Nomor Referensi, Keterangan, Kas Masuk, Kas Keluar, Saldo
   - Otomatis memetakan kategori (Listrik, Internet, Servis PS, Aksesori, dsb.)
3. **`Estimasi Peralatan Listrik`**:
   - Kolom: Nama Komponen, Spesifikasi, Kuantitas, Satuan, Harga Satuan, Total Biaya, Daya Watt, Catatan
   - Terintegrasi dengan Kalkulator Beban Listrik Bulanan (kWh & estimasi tagihan PLN)

---

## 🚀 Panduan Menjalankan Proyek

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Jalankan Mode Pengembangan Lokal
```bash
npm run dev
```
Akses aplikasi melalui browser di `http://localhost:5173`.

### 3. Pengujian Otomatis (QA Tests)
Jalankan pengujian logika finansial, timer midnight math, validasi waktu Excel, dan rumus listrik:
```bash
node --test tests/business-logic.test.mjs
```

### 4. Build untuk Produksi
```bash
npm run build
```

---

## ☁️ Konfigurasi Supabase Cloud

Jika ingin menghubungkan aplikasi ke cloud project Supabase Anda:
1. Salin `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
2. Isi kredensial project Supabase Anda:
   ```env
   VITE_SUPABASE_URL=https://proyek-anda.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
3. Buka **SQL Editor** di dashboard Supabase Anda, lalu jalankan isi file:
   - `supabase/migrations/001_initial_schema.sql` (Skema tabel, RPC, RLS)
   - `supabase/seed.sql` (Data awal unit PS-01, PS-02, tarif, dan inventaris listrik)

---

## 🌐 Panduan Deployment ke Vercel

Aplikasi telah dilengkapi dengan file konfigurasi [`vercel.json`](file:///c:/Users/hence/.gemini/antigravity/scratch/PS/vercel.json) untuk mendukung SPA routing.

1. Buka [Vercel Dashboard](https://vercel.com) dan pilih **Add New Project**.
2. Hubungkan repository Git proyek ini.
3. Konfigurasi Build & Development Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Tambahkan Environment Variables di dashboard Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Klik **Deploy**.
