// ==============================================================================
// SEED SUPABASE VIA REST API (Service Role)
// ==============================================================================

const SUPABASE_URL = 'https://xqsqprkbeurihbhjlagw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhxc3FwcmtiZXVyaWhiaGpsYWd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTg2NTg1MiwiZXhwIjoyMTA3NDQxODUyfQ.U5aQgyIFC8qnaXqc9rG81URTNv3QqMtLo5ShsAvrT64';

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'resolution=merge-duplicates',
};

async function post(endpoint, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const txt = await res.text();
    console.error(`Failed ${endpoint}:`, txt);
  } else {
    console.log(`✅ Success seeding ${endpoint}`);
  }
}

async function runSeed() {
  console.log('🌱 Memasukkan seed data ke Supabase Cloud...');

  // 1. Units PS-01 & PS-02
  await post('units', [
    {
      code: 'PS-01',
      name: 'PS4 Unit 1',
      console_type: 'PS4',
      status: 'Tersedia',
      hourly_rate: 10000.0,
      notes: 'Unit 1 dekat pintu masuk, TV Sony 43 inch, 2 Stik DualShock 4 Wireless',
    },
    {
      code: 'PS-02',
      name: 'PS4 Unit 2',
      console_type: 'PS4',
      status: 'Tersedia',
      hourly_rate: 10000.0,
      notes: 'Unit 2 area sofa tengah, TV Samsung 43 inch, 2 Stik DualShock 4 Wireless',
    },
  ]);

  // 2. Tariff Packages
  await post('tariff_packages', [
    { name: 'Reguler 1 Jam', duration_minutes: 60, price: 10000.0, is_active: true, sort_order: 1 },
    { name: 'Reguler 2 Jam', duration_minutes: 120, price: 20000.0, is_active: true, sort_order: 2 },
    { name: 'Paket Hemat 3 Jam', duration_minutes: 180, price: 28000.0, is_active: true, sort_order: 3 },
    { name: 'Paket Begadang 5 Jam', duration_minutes: 300, price: 45000.0, is_active: true, sort_order: 4 },
  ]);

  // 3. Cash Categories
  await post('cash_categories', [
    { name: 'Pendapatan Rental', type: 'in', is_system: true },
    { name: 'Pendapatan Makanan & Minuman', type: 'in', is_system: false },
    { name: 'Pendapatan Lain-lain', type: 'in', is_system: false },
    { name: 'Listrik', type: 'out', is_system: true },
    { name: 'Internet', type: 'out', is_system: true },
    { name: 'Perawatan PS', type: 'out', is_system: true },
    { name: 'Aksesori', type: 'out', is_system: true },
    { name: 'Kebersihan', type: 'out', is_system: true },
    { name: 'Operasional lainnya', type: 'out', is_system: true },
    { name: 'Pembelian peralatan', type: 'out', is_system: true },
  ]);

  // 4. Equipment (Estimasi Peralatan Listrik)
  await post('equipment', [
    {
      name: 'Stabilizer 1.000 VA',
      specification: 'Matsunaga 1000W / Servo Motor System',
      quantity: 2.0,
      unit: 'Unit',
      unit_price: 350000.0,
      wattage: 20.0,
      notes: 'Pengaman tegangan PS4 dan TV',
      category: 'Peralatan Listrik',
    },
    {
      name: 'Kipas dinding',
      specification: 'Maspion 16 Inch Dinding (Wall Fan)',
      quantity: 2.0,
      unit: 'Unit',
      unit_price: 285000.0,
      wattage: 55.0,
      notes: 'Sirkulasi udara area rental',
      category: 'Peralatan Listrik',
    },
    {
      name: 'Stopkontak heavy duty',
      specification: 'Broco 4 Lubang + Saklar Arde',
      quantity: 3.0,
      unit: 'Unit',
      unit_price: 65000.0,
      wattage: 0.0,
      notes: 'Titik daya colokan konsol & TV',
      category: 'Peralatan Listrik',
    },
    {
      name: 'Kabel listrik',
      specification: 'Supreme NYM 2x1.5mm',
      quantity: 30.0,
      unit: 'Meter',
      unit_price: 14000.0,
      wattage: 0.0,
      notes: 'Instalasi jalur utama rental',
      category: 'Peralatan Listrik',
    },
    {
      name: 'Steker heavy duty',
      specification: 'Broco Steker Arde Bengkok 16A',
      quantity: 4.0,
      unit: 'Pcs',
      unit_price: 18000.0,
      wattage: 0.0,
      notes: 'Steker tahan panas',
      category: 'Peralatan Listrik',
    },
    {
      name: 'Lampu LED',
      specification: 'Philips LED Bulb 14 Watt Cool Daylight',
      quantity: 3.0,
      unit: 'Pcs',
      unit_price: 52000.0,
      wattage: 14.0,
      notes: 'Penerangan ruangan utama',
      category: 'Peralatan Listrik',
    },
    {
      name: 'Aksesori instalasi',
      specification: 'Klem kabel, isolasi unibel, paku beton, baut',
      quantity: 1.0,
      unit: 'Paket',
      unit_price: 75000.0,
      wattage: 0.0,
      notes: 'Kelengkapan pasang listrik',
      category: 'Peralatan Listrik',
    },
  ]);

  console.log('🎉 SEED SUPABASE CLOUD SELESAI!');
}

runSeed();
