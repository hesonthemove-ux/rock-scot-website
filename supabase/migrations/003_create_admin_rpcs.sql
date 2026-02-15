-- Migration: 003_create_admin_rpcs
-- Description: Admin-only helper functions with SECURITY DEFINER
-- Date: 2026-02-07
-- WARNING: These functions are SECURITY DEFINER - only grant to trusted admins

-- Function: create_discount
-- Creates a new discount code (admin only)
CREATE OR REPLACE FUNCTION create_discount(
    p_code text,
    p_amount_pence bigint DEFAULT NULL,
    p_percent_off numeric DEFAULT NULL,
    p_created_by uuid,
    p_note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id uuid := gen_random_uuid();
BEGIN
    INSERT INTO discounts(id, code, amount_pence, percent_off, created_by, note)
    VALUES (v_id, p_code, p_amount_pence, p_percent_off, p_created_by, p_note);
    RETURN v_id;
END;
$$;

-- Revoke public access - admin only
REVOKE EXECUTE ON FUNCTION create_discount(text,bigint,numeric,uuid,text) FROM public;

-- Function: approve_discount
-- Approves a pending discount code (admin only)
CREATE OR REPLACE FUNCTION approve_discount(
    p_discount_id uuid,
    p_approved_by uuid,
    p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE discounts 
    SET approved_by = p_approved_by,
        approved_at = now(),
        note = COALESCE(note, '') || COALESCE(p_note, '')
    WHERE id = p_discount_id;
    
    INSERT INTO discount_approvals(discount_id, approved_by, approved_at, note)
    VALUES (p_discount_id, p_approved_by, now(), p_note);
END;
$$;

-- Revoke public access - admin only
REVOKE EXECUTE ON FUNCTION approve_discount(uuid,uuid,text) FROM public;

-- Function: list_pending_discounts
-- Lists all unapproved discount codes (admin only)
CREATE OR REPLACE FUNCTION list_pending_discounts()
RETURNS SETOF discounts
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM discounts WHERE approved_at IS NULL;
$$;

-- Revoke public access - admin only
REVOKE EXECUTE ON FUNCTION list_pending_discounts() FROM public;

-- Add function comments
COMMENT ON FUNCTION create_discount IS 'Admin-only: Create new discount code';
COMMENT ON FUNCTION approve_discount IS 'Admin-only: Approve pending discount code';
COMMENT ON FUNCTION list_pending_discounts IS 'Admin-only: List unapproved discounts';
