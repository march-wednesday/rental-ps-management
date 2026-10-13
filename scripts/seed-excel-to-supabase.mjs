// ==============================================================================
// SEED EXCEL DATA DIRECTLY TO SUPABASE CLOUD VIA REST (Service Role)
// ==============================================================================

import { parseAllData } from './seed-excel-to-all.mjs';

const SUPABASE_URL = 'https://xqsqprkbeurihbhjlagw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhxc3FwcmtiZXVyaWhiaGpsYWd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTg2NTg1MiwiZXhwIjoyMTA3NDQxODUyfQ.U5aQgyIFC8qnaXqc9rG81URTNv3QqMtLo5ShsAvrT64';

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

async function post(endpoint, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const txt = await res.text();
    console.error(`❌ Gagal ${endpoint}:`, txt);
    return null;
  }
  return await res.json();
}

async function get(endpoint) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    console.error(`❌ Gagal GET ${endpoint}:`, txt);
    return [];
  }
  return await res.json();
}

async function run() {
  console.log('🚀 Memulai impor data Excel ke Supabase Cloud...');
  const { rentals, cashTransactions, equipment } = parseAllData();

  // 1. Dapatkan Unit IDs dari Supabase
  const units = await get('units?select=id,code');
  console.log('Unit di Supabase:', units);

  const unitMap = {};
  units.forEach(u => {
    unitMap[u.code] = u.id;
  });

  // 2. Dapatkan Kategori Kas
  const categories = await get('cash_categories?select=id,name');
  const catMap = {};
  categories.forEach(c => {
    catMap[c.name] = c.id;
  });
  const defaultCatId = categories[0]?.id || null;

  // 3. Masukkan Sesi Rentals
  const rentalPayload = rentals.map(r => ({
    rental_code: r.rentalCode,
    unit_id: unitMap[r.unitCode] || units[0]?.id,
    customer_name: r.customerName,
    customer_phone: r.customerPhone || null,
    duration_minutes: r.durationMinutes,
    start_time: r.startTime,
    target_end_time: r.targetEndTime,
    actual_end_time: r.actualEndTime,
    status: r.status,
    total_price: r.totalPrice,
    total_paid: r.totalPaid,
    payment_status: r.paymentStatus,
    notes: r.notes,
    created_at: r.createdAt,
  }));

  console.log(`Menyimpan ${rentalPayload.length} sesi rental ke Supabase...`);
  // Insert in batches of 20
  for (let i = 0; i < rentalPayload.length; i += 20) {
    const batch = rentalPayload.slice(i, i + 20);
    const result = await post('rentals', batch);
    if (result) {
      console.log(`✅ Batch ${Math.floor(i / 20) + 1} (${result.length} rows) berhasil disimpan`);
    }
  }

  // 4. Masukkan Transaksi Kas
  const cashPayload = cashTransactions.map(c => ({
    transaction_no: c.transactionCode,
    transaction_date: c.transactionDate,
    type: c.type,
    category_id: catMap[c.categoryName] || defaultCatId,
    category_name: c.categoryName,
    amount: c.amount,
    description: c.description,
    status: 'valid',
    created_at: c.createdAt,
  }));

  console.log(`Menyimpan ${cashPayload.length} transaksi kas ke Supabase...`);
  const cashRes = await post('cash_transactions', cashPayload);
  if (cashRes) {
    console.log(`✅ ${cashRes.length} transaksi kas berhasil disimpan`);
  }

  // 5. Masukkan Peralatan Listrik
  const equipPayload = equipment.map(e => ({
    name: e.name,
    specification: e.specification,
    quantity: e.quantity,
    unit: e.unit,
    unit_price: e.unitPrice,
    wattage: e.wattage,
    notes: e.notes,
    category: e.category,
  }));

  console.log(`Menyimpan ${equipPayload.length} inventaris ke Supabase...`);
  const equipRes = await post('equipment', equipPayload);
  if (equipRes) {
    console.log(`✅ ${equipRes.length} item inventaris berhasil disimpan`);
  }

  console.log('🎉 SELURUH DATA EXCEL BERHASIL DI-SEED KE SUPABASE CLOUD!');
}

run();
