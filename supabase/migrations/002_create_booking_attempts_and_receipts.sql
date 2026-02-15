-- Migration: 002_create_booking_attempts_and_receipts
-- Description: Create booking attempts logs and receipts tables
-- Date: 2026-02-07

-- Booking attempts logs for auditing
CREATE TABLE IF NOT EXISTS booking_attempts_logs (
    id bigserial PRIMARY KEY,
    user_id uuid,
    ip inet,
    payload jsonb,
    result jsonb,
    created_at timestamptz DEFAULT now()
);

-- Receipts table
-- Note: This assumes 'invoices' table already exists
CREATE TABLE IF NOT EXISTS receipts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
    paid_by uuid,
    payment_method text,
    payment_reference text,
    amount_pence bigint,
    created_at timestamptz DEFAULT now()
);

-- Add comments
COMMENT ON TABLE booking_attempts_logs IS 'Audit log of all booking attempts';
COMMENT ON TABLE receipts IS 'Payment receipts linked to invoices';
COMMENT ON COLUMN receipts.payment_method IS 'e.g., stripe, bank_transfer, cash';
COMMENT ON COLUMN receipts.payment_reference IS 'External payment ID or reference';
