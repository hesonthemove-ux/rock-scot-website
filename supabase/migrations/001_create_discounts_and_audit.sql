-- Migration: 001_create_discounts_and_audit
-- Description: Create discounts table and discount approval audit trail
-- Date: 2026-02-07

-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create discounts table
CREATE TABLE IF NOT EXISTS discounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text UNIQUE NOT NULL,
    amount_pence bigint,
    percent_off numeric,
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    approved_by uuid,
    approved_at timestamptz,
    note text
);

-- Create discount approvals audit table
CREATE TABLE IF NOT EXISTS discount_approvals (
    id bigserial PRIMARY KEY,
    discount_id uuid REFERENCES discounts(id) ON DELETE CASCADE,
    approved_by uuid,
    approved_at timestamptz DEFAULT now(),
    note text
);

-- Add comments for documentation
COMMENT ON TABLE discounts IS 'Discount codes for advertising campaigns';
COMMENT ON TABLE discount_approvals IS 'Audit trail for discount approvals';
COMMENT ON COLUMN discounts.amount_pence IS 'Fixed discount amount in pence';
COMMENT ON COLUMN discounts.percent_off IS 'Percentage discount (e.g., 10 for 10%)';
