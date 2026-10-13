-- ==============================================================================
-- RENTAL PS MANAGEMENT SYSTEM - SEED DATA
-- Default units, tariffs, categories, equipment, and settings
-- ==============================================================================

-- 1. UNITS (PS-01 & PS-02)
INSERT INTO public.units (code, name, console_type, status, hourly_rate, notes)
VALUES
    ('PS-01', 'PS4 Unit 1', 'PS4', 'Tersedia', 10000.00, 'Unit 1 dekat pintu masuk, TV Sony 43 inch, 2 Stik DualShock 4 Wireless'),
    ('PS-02', 'PS4 Unit 2', 'PS4', 'Tersedia', 10000.00, 'Unit 2 area sofa tengah, TV Samsung 43 inch, 2 Stik DualShock 4 Wireless')
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name,
    hourly_rate = EXCLUDED.hourly_rate;

-- 2. TARIFF PACKAGES
INSERT INTO public.tariff_packages (name, duration_minutes, price, is_active, sort_order)
VALUES
    ('Reguler 1 Jam', 60, 10000.00, true, 1),
    ('Reguler 2 Jam', 120, 20000.00, true, 2),
    ('Paket Hemat 3 Jam', 180, 28000.00, true, 3),
    ('Paket Begadang 5 Jam', 300, 45000.00, true, 4)
ON CONFLICT DO NOTHING;

-- 3. CASH CATEGORIES
INSERT INTO public.cash_categories (name, type, is_system)
VALUES
    ('Pendapatan Rental', 'in', true),
    ('Pendapatan Makanan & Minuman', 'in', false),
    ('Pendapatan Lain-lain', 'in', false),
    ('Listrik', 'out', true),
    ('Internet', 'out', true),
    ('Perawatan PS', 'out', true),
    ('Aksesori', 'out', true),
    ('Kebersihan', 'out', true),
    ('Operasional lainnya', 'out', true),
    ('Pembelian peralatan', 'out', true)
ON CONFLICT (name) DO NOTHING;

-- 4. EQUIPMENT (Estimasi Peralatan Listrik awal dari workbook)
INSERT INTO public.equipment (name, specification, quantity, unit, unit_price, wattage, notes, category)
VALUES
    ('Stabilizer 1.000 VA', 'Matsunaga 1000W / Servo Motor System', 2.00, 'Unit', 350000.00, 20.00, 'Pengaman tegangan PS4 dan TV', 'Peralatan Listrik'),
    ('Kipas dinding', 'Maspion 16 Inch Dinding (Wall Fan)', 2.00, 'Unit', 285000.00, 55.00, 'Sirkulasi udara area rental', 'Peralatan Listrik'),
    ('Stopkontak heavy duty', 'Broco 4 Lubang + Saklar Arde', 3.00, 'Unit', 65000.00, 0.00, 'Titik daya colokan konsol & TV', 'Peralatan Listrik'),
    ('Kabel listrik', 'Supreme NYM 2x1.5mm', 30.00, 'Meter', 14000.00, 0.00, 'Instalasi jalur utama rental', 'Peralatan Listrik'),
    ('Steker heavy duty', 'Broco Steker Arde Bengkok 16A', 4.00, 'Pcs', 18000.00, 0.00, 'Steker tahan panas', 'Peralatan Listrik'),
    ('Lampu LED', 'Philips LED Bulb 14 Watt Cool Daylight', 3.00, 'Pcs', 52000.00, 14.00, 'Penerangan ruangan utama', 'Peralatan Listrik'),
    ('Aksesori instalasi', 'Klem kabel, isolasi unibel, paku beton, baut', 1.00, 'Paket', 75000.00, 0.00, 'Kelengkapan pasang listrik', 'Peralatan Listrik')
ON CONFLICT DO NOTHING;

-- 5. APP SETTINGS
INSERT INTO public.app_settings (key, value, description)
VALUES
    ('general', '{
        "appName": "Rental PS Management System",
        "businessName": "Rental PS Gaming Hub",
        "timezone": "Asia/Makassar",
        "currency": "IDR",
        "electricityKwhRate": 1444.70,
        "operatingHoursPerDay": 14,
        "operatingDaysPerMonth": 30,
        "overtimeGraceMinutes": 5,
        "overtimeChargePer15Min": 3000
    }'::jsonb, 'Konfigurasi umum sistem dan tarif listrik'),
    ('roles', '{
        "ownerEmail": "owner@rentalps.local",
        "allowOperatorVoid": false
    }'::jsonb, 'Kebijakan hak akses peran')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
