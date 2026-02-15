-- Migration: 004_rls_and_indexes
-- Description: Row Level Security policies and performance indexes
-- Date: 2026-02-07

-- Enable RLS on booking_attempts_logs
ALTER TABLE booking_attempts_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own logs
CREATE POLICY "insert_own_log" 
ON booking_attempts_logs 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = (SELECT auth.uid()));

-- Policy: Users can select their own logs
CREATE POLICY "select_own_logs" 
ON booking_attempts_logs 
FOR SELECT 
TO authenticated 
USING (user_id = (SELECT auth.uid()));

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_discount_code ON discounts(code);
CREATE INDEX IF NOT EXISTS idx_booking_attempts_user ON booking_attempts_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_discount_approvals_discount ON discount_approvals(discount_id);
CREATE INDEX IF NOT EXISTS idx_discounts_approved ON discounts(approved_at) WHERE approved_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_receipts_invoice ON receipts(invoice_id);

-- Add index comments
COMMENT ON INDEX idx_discount_code IS 'Fast lookup for discount code validation';
COMMENT ON INDEX idx_discounts_approved IS 'Partial index for approved discounts only';
