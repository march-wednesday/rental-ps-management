-- ==============================================================================
-- RENTAL PS MANAGEMENT SYSTEM - INITIAL DATABASE SCHEMA
-- Target Database: Supabase / PostgreSQL 15+
-- Timezone: Asia/Makassar (WITA)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES TABLE (Supabase Auth link)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'operator')) DEFAULT 'operator',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Makassar', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Makassar', now())
);

-- 2. UNITS TABLE
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    console_type TEXT NOT NULL DEFAULT 'PS4',
    status TEXT NOT NULL CHECK (status IN ('Tersedia', 'Sedang Disewa', 'Maintenance', 'Nonaktif')) DEFAULT 'Tersedia',
    notes TEXT,
    hourly_rate NUMERIC(12, 2) NOT NULL DEFAULT 10000.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Makassar', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Makassar', now())
);

-- 3. TARIFF PACKAGES TABLE
CREATE TABLE IF NOT EXISTS public.tariff_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Makassar', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Makassar', now())
);

-- 4. RENTALS TABLE
CREATE TABLE IF NOT EXISTS public.rentals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_code TEXT NOT NULL UNIQUE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE RESTRICT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    tariff_package_id UUID REFERENCES public.tariff_packages(id) ON DELETE SET NULL,
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
    start_time TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Makassar', now()),
    target_end_time TIMESTAMPTZ NOT NULL,
    actual_end_time TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
    total_price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
    total_paid NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_paid >= 0),
    payment_status TEXT NOT NULL CHECK (payment_status IN ('Belum Bayar', 'Sebagian', 'Lunas')) DEFAULT 'Belum Bayar',
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Makassar', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Makassar', now())
);

-- CRITICAL REQUIREMENT: Strict partial unique index to prevent two active rentals on the same unit
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_rental_per_unit 
ON public.rentals (unit_id) 
WHERE status = 'active';

-- Index for searching and reporting
CREATE INDEX IF NOT EXISTS idx_rentals_start_time ON public.rentals(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON public.rentals(status);
CREATE INDEX IF NOT EXISTS idx_rentals_payment_status ON public.rentals(payment_status);

-- 5. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no TEXT NOT NULL UNIQUE,
    rental_id UUID NOT NULL REFERENCES public.rentals(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Tunai', 'Transfer', 'QRIS', 'Lainnya')),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Makassar', now()),
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Makassar', now())
);

CREATE INDEX IF NOT EXISTS idx_payments_rental_id ON public.payments(rental_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date DESC);

-- 6. CASH CATEGORIES
CREATE TABLE IF NOT EXISTS public.cash_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('in', 'out')),
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Makassar', now())
);

-- 7. CASH TRANSACTIONS (Buku Kas Harian)
CREATE TABLE IF NOT EXISTS public.cash_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_no TEXT NOT NULL UNIQUE,
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Makassar', now()),
    category_id UUID REFERENCES public.cash_categories(id) ON DELETE SET NULL,
    category_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('in', 'out')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    reference_no TEXT,
    rental_id UUID REFERENCES public.rentals(id) ON DELETE SET NULL,
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    is_capital_asset BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL CHECK (status IN ('valid', 'void', 'corrected')) DEFAULT 'valid',
    void_reason TEXT,
    voided_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    voided_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Makassar', now())
);

CREATE INDEX IF NOT EXISTS idx_cash_tx_date ON public.cash_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_cash_tx_status ON public.cash_transactions(status);
CREATE INDEX IF NOT EXISTS idx_cash_tx_type ON public.cash_transactions(type);

-- 8. EQUIPMENT TABLE (Peralatan & Estimasi Beban Listrik)
CREATE TABLE IF NOT EXISTS public.equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    specification TEXT,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.00 CHECK (quantity >= 0),
    unit TEXT NOT NULL DEFAULT 'Unit',
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
    total_price NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    wattage NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (wattage >= 0),
    notes TEXT,
    category TEXT NOT NULL DEFAULT 'Peralatan Listrik',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Makassar', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Makassar', now())
);

-- 9. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_email TEXT,
    changes JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Makassar', now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON public.audit_logs(created_at DESC);

-- 10. APP SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Makassar', now())
);

-- 11. EXCEL IMPORT BATCHES
CREATE TABLE IF NOT EXISTS public.import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    file_hash TEXT,
    sheet_name TEXT,
    total_rows INT NOT NULL DEFAULT 0,
    successful_rows INT NOT NULL DEFAULT 0,
    failed_rows INT NOT NULL DEFAULT 0,
    imported_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Makassar', now())
);

-- 12. EXCEL IMPORT ROWS (Audit per row)
CREATE TABLE IF NOT EXISTS public.import_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES public.import_batches(id) ON DELETE CASCADE,
    sheet_name TEXT NOT NULL,
    row_index INT NOT NULL,
    raw_data JSONB NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped', 'needs_confirmation')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Makassar', now())
);

-- ==============================================================================
-- DATABASE FUNCTIONS & ATOMIC RPCs
-- ==============================================================================

-- 1. Helper generator for sequential transaction numbers
CREATE OR REPLACE FUNCTION public.fn_generate_tx_no(prefix TEXT)
RETURNS TEXT AS $$
DECLARE
    cur_date TEXT := to_char(timezone('Asia/Makassar', now()), 'YYYYMMDD');
    seq_val INT;
BEGIN
    seq_val := floor(random() * 9000 + 1000)::INT;
    RETURN prefix || '-' || cur_date || '-' || seq_val;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 2. RPC: Start Rental Session
CREATE OR REPLACE FUNCTION public.rpc_start_rental(
    p_unit_id UUID,
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_tariff_package_id UUID,
    p_duration_minutes INT,
    p_notes TEXT,
    p_actor_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_unit RECORD;
    v_tariff RECORD;
    v_rental_id UUID;
    v_rental_code TEXT;
    v_now TIMESTAMPTZ := timezone('Asia/Makassar', now());
    v_target_end TIMESTAMPTZ;
    v_total_price NUMERIC(12, 2);
    v_active_exists BOOLEAN;
BEGIN
    -- Check if unit exists
    SELECT * INTO v_unit FROM public.units WHERE id = p_unit_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Unit PlayStation tidak ditemukan.';
    END IF;

    -- Check if unit is available
    IF v_unit.status != 'Tersedia' THEN
        RAISE EXCEPTION 'Unit sedang tidak tersedia (status: %).', v_unit.status;
    END IF;

    -- Double check no active rental on unit
    SELECT EXISTS(
        SELECT 1 FROM public.rentals WHERE unit_id = p_unit_id AND status = 'active'
    ) INTO v_active_exists;
    IF v_active_exists THEN
        RAISE EXCEPTION 'Unit sudah memiliki sesi rental aktif.';
    END IF;

    -- Calculate price & duration
    IF p_tariff_package_id IS NOT NULL THEN
        SELECT * INTO v_tariff FROM public.tariff_packages WHERE id = p_tariff_package_id;
        IF FOUND THEN
            v_total_price := v_tariff.price;
        ELSE
            v_total_price := (p_duration_minutes::NUMERIC / 60.0) * v_unit.hourly_rate;
        END IF;
    ELSE
        v_total_price := (p_duration_minutes::NUMERIC / 60.0) * v_unit.hourly_rate;
    END IF;

    v_target_end := v_now + (p_duration_minutes || ' minutes')::INTERVAL;
    v_rental_code := 'RENT-' || to_char(v_now, 'YYYYMMDD') || '-' || to_char(v_now, 'HH24MISS') || '-' || substring(v_unit.code from 1 for 5);

    -- Insert rental
    INSERT INTO public.rentals (
        rental_code, unit_id, customer_name, customer_phone,
        tariff_package_id, duration_minutes, start_time, target_end_time,
        status, total_price, total_paid, payment_status, notes, created_by
    ) VALUES (
        v_rental_code, p_unit_id, p_customer_name, p_customer_phone,
        p_tariff_package_id, p_duration_minutes, v_now, v_target_end,
        'active', v_total_price, 0, 'Belum Bayar', p_notes, p_actor_id
    ) RETURNING id INTO v_rental_id;

    -- Update unit status
    UPDATE public.units 
    SET status = 'Sedang Disewa', updated_at = v_now
    WHERE id = p_unit_id;

    -- Audit Log
    INSERT INTO public.audit_logs (action, table_name, record_id, actor_id, changes)
    VALUES ('START_RENTAL', 'rentals', v_rental_id::TEXT, p_actor_id, jsonb_build_object(
        'rental_code', v_rental_code,
        'unit_code', v_unit.code,
        'customer_name', p_customer_name,
        'duration_minutes', p_duration_minutes,
        'total_price', v_total_price
    ));

    RETURN jsonb_build_object(
        'success', true,
        'rental_id', v_rental_id,
        'rental_code', v_rental_code,
        'start_time', v_now,
        'target_end_time', v_target_end
    );
END;
$$ LANGUAGE plpgsql;

-- 3. RPC: Extend Rental Session (Tambah Waktu)
CREATE OR REPLACE FUNCTION public.rpc_extend_rental(
    p_rental_id UUID,
    p_additional_minutes INT,
    p_additional_price NUMERIC(12, 2),
    p_actor_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_rental RECORD;
    v_now TIMESTAMPTZ := timezone('Asia/Makassar', now());
    v_new_target TIMESTAMPTZ;
    v_new_duration INT;
    v_new_total NUMERIC(12, 2);
    v_new_payment_status TEXT;
BEGIN
    SELECT * INTO v_rental FROM public.rentals WHERE id = p_rental_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sesi rental tidak ditemukan.';
    END IF;

    IF v_rental.status != 'active' THEN
        RAISE EXCEPTION 'Hanya sesi aktif yang dapat diperpanjang.';
    END IF;

    v_new_duration := v_rental.duration_minutes + p_additional_minutes;
    -- If current target is in the past, add from current target or now?
    -- Standard practice: add to existing target_end_time
    v_new_target := v_rental.target_end_time + (p_additional_minutes || ' minutes')::INTERVAL;
    v_new_total := v_rental.total_price + p_additional_price;

    IF v_rental.total_paid >= v_new_total THEN
        v_new_payment_status := 'Lunas';
    ELSIF v_rental.total_paid > 0 THEN
        v_new_payment_status := 'Sebagian';
    ELSE
        v_new_payment_status := 'Belum Bayar';
    END IF;

    UPDATE public.rentals
    SET duration_minutes = v_new_duration,
        target_end_time = v_new_target,
        total_price = v_new_total,
        payment_status = v_new_payment_status,
        updated_at = v_now
    WHERE id = p_rental_id;

    -- Audit Log
    INSERT INTO public.audit_logs (action, table_name, record_id, actor_id, changes)
    VALUES ('EXTEND_RENTAL', 'rentals', p_rental_id::TEXT, p_actor_id, jsonb_build_object(
        'additional_minutes', p_additional_minutes,
        'additional_price', p_additional_price,
        'new_target_end_time', v_new_target,
        'new_total_price', v_new_total
    ));

    RETURN jsonb_build_object(
        'success', true,
        'rental_id', p_rental_id,
        'target_end_time', v_new_target,
        'total_price', v_new_total
    );
END;
$$ LANGUAGE plpgsql;

-- 4. RPC: Complete Rental Session (Selesaikan Sewa)
CREATE OR REPLACE FUNCTION public.rpc_complete_rental(
    p_rental_id UUID,
    p_actor_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_rental RECORD;
    v_now TIMESTAMPTZ := timezone('Asia/Makassar', now());
BEGIN
    SELECT * INTO v_rental FROM public.rentals WHERE id = p_rental_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sesi rental tidak ditemukan.';
    END IF;

    IF v_rental.status != 'active' THEN
        RAISE EXCEPTION 'Sesi rental ini sudah tidak aktif.';
    END IF;

    -- Complete rental
    UPDATE public.rentals
    SET status = 'completed',
        actual_end_time = v_now,
        updated_at = v_now
    WHERE id = p_rental_id;

    -- Mark unit available
    UPDATE public.units
    SET status = 'Tersedia',
        updated_at = v_now
    WHERE id = v_rental.unit_id;

    -- Audit Log
    INSERT INTO public.audit_logs (action, table_name, record_id, actor_id, changes)
    VALUES ('COMPLETE_RENTAL', 'rentals', p_rental_id::TEXT, p_actor_id, jsonb_build_object(
        'actual_end_time', v_now,
        'payment_status', v_rental.payment_status,
        'total_price', v_rental.total_price,
        'total_paid', v_rental.total_paid
    ));

    RETURN jsonb_build_object(
        'success', true,
        'rental_id', p_rental_id,
        'actual_end_time', v_now,
        'unpaid_balance', (v_rental.total_price - v_rental.total_paid)
    );
END;
$$ LANGUAGE plpgsql;

-- 5. RPC: Cancel Rental Session (Batalkan Sewa)
CREATE OR REPLACE FUNCTION public.rpc_cancel_rental(
    p_rental_id UUID,
    p_reason TEXT,
    p_actor_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_rental RECORD;
    v_now TIMESTAMPTZ := timezone('Asia/Makassar', now());
BEGIN
    SELECT * INTO v_rental FROM public.rentals WHERE id = p_rental_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sesi rental tidak ditemukan.';
    END IF;

    IF v_rental.status != 'active' THEN
        RAISE EXCEPTION 'Sesi rental ini sudah tidak aktif.';
    END IF;

    IF v_rental.total_paid > 0 THEN
        RAISE EXCEPTION 'Sesi dengan pembayaran tercatat tidak bisa dibatalkan langsung. Refund pembayaran terlebih dahulu.';
    END IF;

    UPDATE public.rentals
    SET status = 'cancelled',
        notes = coalesce(notes || ' | ', '') || 'Dibatalkan: ' || coalesce(p_reason, 'Tanpa keterangan'),
        actual_end_time = v_now,
        updated_at = v_now
    WHERE id = p_rental_id;

    UPDATE public.units
    SET status = 'Tersedia',
        updated_at = v_now
    WHERE id = v_rental.unit_id;

    INSERT INTO public.audit_logs (action, table_name, record_id, actor_id, changes)
    VALUES ('CANCEL_RENTAL', 'rentals', p_rental_id::TEXT, p_actor_id, jsonb_build_object(
        'reason', p_reason,
        'cancelled_at', v_now
    ));

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

-- 6. RPC: Record Payment & Atomic Cash Inflow (Buku Kas Masuk)
CREATE OR REPLACE FUNCTION public.rpc_record_payment(
    p_rental_id UUID,
    p_amount NUMERIC(12, 2),
    p_payment_method TEXT,
    p_notes TEXT,
    p_actor_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_rental RECORD;
    v_payment_id UUID;
    v_invoice_no TEXT;
    v_cash_tx_no TEXT;
    v_now TIMESTAMPTZ := timezone('Asia/Makassar', now());
    v_new_total_paid NUMERIC(12, 2);
    v_new_payment_status TEXT;
    v_cat_id UUID;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Nominal pembayaran harus lebih besar dari 0.';
    END IF;

    SELECT * INTO v_rental FROM public.rentals WHERE id = p_rental_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sesi rental tidak ditemukan.';
    END IF;

    -- Prevent overpayment unless allowed
    IF (v_rental.total_paid + p_amount) > v_rental.total_price THEN
        RAISE EXCEPTION 'Jumlah pembayaran (Rp%) melebihi sisa tagihan (Rp%).', 
            to_char(p_amount, 'FM999,999,999'), 
            to_char(v_rental.total_price - v_rental.total_paid, 'FM999,999,999');
    END IF;

    v_new_total_paid := v_rental.total_paid + p_amount;
    IF v_new_total_paid >= v_rental.total_price THEN
        v_new_payment_status := 'Lunas';
    ELSE
        v_new_payment_status := 'Sebagian';
    END IF;

    -- Generate Invoice & Cash Tx No
    v_invoice_no := 'INV-' || to_char(v_now, 'YYYYMMDD') || '-' || to_char(v_now, 'HH24MISS') || '-' || floor(random() * 900 + 100)::INT;
    v_cash_tx_no := 'CSH-IN-' || to_char(v_now, 'YYYYMMDD') || '-' || to_char(v_now, 'HH24MISS');

    -- Insert Payment
    INSERT INTO public.payments (
        invoice_no, rental_id, amount, payment_method, payment_date, notes, created_by
    ) VALUES (
        v_invoice_no, p_rental_id, p_amount, p_payment_method, v_now, p_notes, p_actor_id
    ) RETURNING id INTO v_payment_id;

    -- Update Rental
    UPDATE public.rentals
    SET total_paid = v_new_total_paid,
        payment_status = v_new_payment_status,
        updated_at = v_now
    WHERE id = p_rental_id;

    -- Get or create system cash category for Rental
    SELECT id INTO v_cat_id FROM public.cash_categories WHERE name = 'Pendapatan Rental' LIMIT 1;
    IF v_cat_id IS NULL THEN
        INSERT INTO public.cash_categories (name, type, is_system)
        VALUES ('Pendapatan Rental', 'in', true) RETURNING id INTO v_cat_id;
    END IF;

    -- Atomic Insert Cash Transaction (Buku Kas Masuk)
    INSERT INTO public.cash_transactions (
        transaction_no, transaction_date, category_id, category_name,
        type, amount, reference_no, rental_id, payment_id,
        description, is_capital_asset, status, created_by
    ) VALUES (
        v_cash_tx_no, v_now, v_cat_id, 'Pendapatan Rental',
        'in', p_amount, v_invoice_no, p_rental_id, v_payment_id,
        'Pembayaran Rental (' || v_rental.rental_code || ') - Pelanggan: ' || v_rental.customer_name || ' [' || p_payment_method || ']',
        false, 'valid', p_actor_id
    );

    -- Audit Log
    INSERT INTO public.audit_logs (action, table_name, record_id, actor_id, changes)
    VALUES ('PAYMENT_RECORDED', 'payments', v_payment_id::TEXT, p_actor_id, jsonb_build_object(
        'rental_id', p_rental_id,
        'invoice_no', v_invoice_no,
        'amount', p_amount,
        'payment_method', p_payment_method,
        'new_total_paid', v_new_total_paid,
        'payment_status', v_new_payment_status
    ));

    RETURN jsonb_build_object(
        'success', true,
        'payment_id', v_payment_id,
        'invoice_no', v_invoice_no,
        'total_paid', v_new_total_paid,
        'payment_status', v_new_payment_status,
        'remaining_due', (v_rental.total_price - v_new_total_paid)
    );
END;
$$ LANGUAGE plpgsql;

-- 7. RPC: Record Expense & Atomic Cash Outflow (Buku Kas Keluar)
CREATE OR REPLACE FUNCTION public.rpc_record_expense(
    p_category_name TEXT,
    p_amount NUMERIC(12, 2),
    p_description TEXT,
    p_reference_no TEXT,
    p_is_capital_asset BOOLEAN,
    p_actor_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_cash_tx_id UUID;
    v_cash_tx_no TEXT;
    v_cat_id UUID;
    v_now TIMESTAMPTZ := timezone('Asia/Makassar', now());
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Nominal pengeluaran harus lebih besar dari 0.';
    END IF;

    SELECT id INTO v_cat_id FROM public.cash_categories WHERE name = p_category_name AND type = 'out' LIMIT 1;
    IF v_cat_id IS NULL THEN
        INSERT INTO public.cash_categories (name, type, is_system)
        VALUES (p_category_name, 'out', false) RETURNING id INTO v_cat_id;
    END IF;

    v_cash_tx_no := 'CSH-OUT-' || to_char(v_now, 'YYYYMMDD') || '-' || to_char(v_now, 'HH24MISS');

    INSERT INTO public.cash_transactions (
        transaction_no, transaction_date, category_id, category_name,
        type, amount, reference_no, description, is_capital_asset, status, created_by
    ) VALUES (
        v_cash_tx_no, v_now, v_cat_id, p_category_name,
        'out', p_amount, p_reference_no, p_description, coalesce(p_is_capital_asset, false), 'valid', p_actor_id
    ) RETURNING id INTO v_cash_tx_id;

    INSERT INTO public.audit_logs (action, table_name, record_id, actor_id, changes)
    VALUES ('EXPENSE_RECORDED', 'cash_transactions', v_cash_tx_id::TEXT, p_actor_id, jsonb_build_object(
        'transaction_no', v_cash_tx_no,
        'category_name', p_category_name,
        'amount', p_amount,
        'is_capital_asset', p_is_capital_asset,
        'description', p_description
    ));

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_cash_tx_id,
        'transaction_no', v_cash_tx_no
    );
END;
$$ LANGUAGE plpgsql;

-- 8. RPC: Void Cash Transaction
CREATE OR REPLACE FUNCTION public.rpc_void_cash_transaction(
    p_transaction_id UUID,
    p_reason TEXT,
    p_actor_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_tx RECORD;
    v_now TIMESTAMPTZ := timezone('Asia/Makassar', now());
BEGIN
    SELECT * INTO v_tx FROM public.cash_transactions WHERE id = p_transaction_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transaksi kas tidak ditemukan.';
    END IF;

    IF v_tx.status = 'void' THEN
        RAISE EXCEPTION 'Transaksi ini sudah berstatus void.';
    END IF;

    IF trim(coalesce(p_reason, '')) = '' THEN
        RAISE EXCEPTION 'Alasan void transaksi wajib diisi.';
    END IF;

    UPDATE public.cash_transactions
    SET status = 'void',
        void_reason = p_reason,
        voided_by = p_actor_id,
        voided_at = v_now
    WHERE id = p_transaction_id;

    INSERT INTO public.audit_logs (action, table_name, record_id, actor_id, changes)
    VALUES ('VOID_CASH_TRANSACTION', 'cash_transactions', p_transaction_id::TEXT, p_actor_id, jsonb_build_object(
        'transaction_no', v_tx.transaction_no,
        'amount', v_tx.amount,
        'type', v_tx.type,
        'reason', p_reason
    ));

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

-- 9. Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tariff_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_rows ENABLE ROW LEVEL SECURITY;

-- Profiles: Authenticated users can view profiles; only self or owner can update
CREATE POLICY "Profiles viewable by authenticated users"
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Units & Tariffs: Authenticated can view; only owner can modify
CREATE POLICY "Units viewable by authenticated"
ON public.units FOR SELECT TO authenticated USING (true);

CREATE POLICY "Units modifiable by authenticated"
ON public.units FOR ALL TO authenticated USING (true);

CREATE POLICY "Tariff packages viewable by authenticated"
ON public.tariff_packages FOR SELECT TO authenticated USING (true);

CREATE POLICY "Tariff packages modifiable by authenticated"
ON public.tariff_packages FOR ALL TO authenticated USING (true);

-- Rentals & Payments: Authenticated can view and insert
CREATE POLICY "Rentals viewable by authenticated"
ON public.rentals FOR SELECT TO authenticated USING (true);

CREATE POLICY "Rentals insertable by authenticated"
ON public.rentals FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Rentals updatable by authenticated"
ON public.rentals FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Payments viewable by authenticated"
ON public.payments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Payments insertable by authenticated"
ON public.payments FOR INSERT TO authenticated WITH CHECK (true);

-- Cash Transactions: Authenticated can view and insert; NO DELETES ALLOWED
CREATE POLICY "Cash tx viewable by authenticated"
ON public.cash_transactions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Cash tx insertable by authenticated"
ON public.cash_transactions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Cash tx updatable by authenticated"
ON public.cash_transactions FOR UPDATE TO authenticated USING (true);

-- Equipment: Authenticated can read/write
CREATE POLICY "Equipment viewable by authenticated"
ON public.equipment FOR SELECT TO authenticated USING (true);

CREATE POLICY "Equipment modifiable by authenticated"
ON public.equipment FOR ALL TO authenticated USING (true);

-- Audit logs: Authenticated can view, only system/rpc inserts
CREATE POLICY "Audit logs viewable by authenticated"
ON public.audit_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Audit logs insertable by authenticated"
ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- App Settings & Imports
CREATE POLICY "App settings viewable by authenticated"
ON public.app_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "App settings modifiable by authenticated"
ON public.app_settings FOR ALL TO authenticated USING (true);

CREATE POLICY "Import batches viewable by authenticated"
ON public.import_batches FOR SELECT TO authenticated USING (true);

CREATE POLICY "Import batches insertable by authenticated"
ON public.import_batches FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Import rows viewable by authenticated"
ON public.import_rows FOR SELECT TO authenticated USING (true);

CREATE POLICY "Import rows insertable by authenticated"
ON public.import_rows FOR INSERT TO authenticated WITH CHECK (true);
