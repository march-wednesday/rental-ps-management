// ==============================================================================
// SUPABASE DATABASE MIGRATION SCRIPT
// Executes 001_initial_schema.sql and seed.sql directly on Supabase PostgreSQL
// ==============================================================================

import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Client } = pg;

const DB_PASS = 'hZx7gXDK8r2DhRHJ';
const PROJECT_REF = 'xqsqprkbeurihbhjlagw';

// Try direct host first, then pooler host
const connectionStrings = [
  // Session pooler (IPv4 compatible)
  `postgres://postgres.${PROJECT_REF}:${encodeURIComponent(DB_PASS)}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`,
  // Transaction pooler
  `postgres://postgres.${PROJECT_REF}:${encodeURIComponent(DB_PASS)}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
  // Direct host
  `postgres://postgres:${encodeURIComponent(DB_PASS)}@db.${PROJECT_REF}.supabase.co:5432/postgres?sslmode=require`,
];

async function runMigrations() {
  console.log('🔄 Menghubungkan ke Supabase PostgreSQL...');

  let client = null;
  for (const connStr of connectionStrings) {
    const masked = connStr.replace(/:[^:@]+@/, ':****@');
    try {
      console.log(`Mencoba koneksi: ${masked}`);
      const testClient = new Client({
        connectionString: connStr,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      });
      await testClient.connect();
      console.log('✅ Koneksi PostgreSQL Berhasil!');
      client = testClient;
      break;
    } catch (err) {
      console.warn(`Gagal terhubung dengan endpoint: ${err.message}`);
    }
  }

  if (!client) {
    console.error('❌ Tidak dapat terhubung ke PostgreSQL Supabase.');
    process.exit(1);
  }

  try {
    // 1. Run Initial Schema Migration
    console.log('\n📄 Menjalankan 001_initial_schema.sql...');
    const schemaSql = fs.readFileSync(path.resolve('supabase/migrations/001_initial_schema.sql'), 'utf-8');
    await client.query(schemaSql);
    console.log('✅ Migrasi skema database berhasil dieksekusi!');

    // 2. Run Seed Data
    console.log('\n🌱 Menjalankan seed.sql...');
    const seedSql = fs.readFileSync(path.resolve('supabase/seed.sql'), 'utf-8');
    await client.query(seedSql);
    console.log('✅ Seed data (PS-01, PS-02, tarif, inventaris) berhasil dimasukkan!');

    // 3. Verify Database Contents
    console.log('\n🔍 Verifikasi tabel database...');
    const unitsRes = await client.query('SELECT code, name, status, hourly_rate FROM public.units ORDER BY code;');
    console.log('Unit PlayStation Terdaftar:', unitsRes.rows);

    const tariffsRes = await client.query('SELECT name, duration_minutes, price FROM public.tariff_packages ORDER BY sort_order;');
    console.log('Paket Tarif Terdaftar:', tariffsRes.rows);

    const eqRes = await client.query('SELECT count(*) FROM public.equipment;');
    console.log(`Total Komponen Listrik: ${eqRes.rows[0].count} item`);

    console.log('\n🎉 DATABASE SUPABASE SIAP DIGUNAKAN 100%!');
  } catch (err) {
    console.error('❌ Error saat mengeksekusi SQL:', err);
  } finally {
    await client.end();
  }
}

runMigrations();
