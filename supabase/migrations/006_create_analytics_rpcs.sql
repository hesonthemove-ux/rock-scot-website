-- Migration: 006_create_analytics_rpcs
-- Description: Helper functions for analytics and reporting
-- Date: 2026-02-07

-- Get traffic stats for date range
CREATE OR REPLACE FUNCTION get_traffic_stats(
    p_start_date timestamptz,
    p_end_date timestamptz
)
RETURNS TABLE (
    total_sessions bigint,
    total_pageviews bigint,
    unique_visitors bigint,
    avg_session_duration numeric,
    avg_pages_per_session numeric
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        COUNT(DISTINCT s.id)::bigint as total_sessions,
        COUNT(pv.id)::bigint as total_pageviews,
        COUNT(DISTINCT COALESCE(s.user_id, s.ip::text))::bigint as unique_visitors,
        ROUND(AVG(s.duration_seconds), 2) as avg_session_duration,
        ROUND(AVG(s.pages_viewed), 2) as avg_pages_per_session
    FROM sessions s
    LEFT JOIN page_views pv ON pv.session_id = s.id
    WHERE s.started_at BETWEEN p_start_date AND p_end_date;
$$;

-- Get top pages
CREATE OR REPLACE FUNCTION get_top_pages(
    p_start_date timestamptz,
    p_end_date timestamptz,
    p_limit integer DEFAULT 10
)
RETURNS TABLE (
    page_path text,
    view_count bigint,
    unique_visitors bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        page_path,
        COUNT(*)::bigint as view_count,
        COUNT(DISTINCT session_id)::bigint as unique_visitors
    FROM page_views
    WHERE created_at BETWEEN p_start_date AND p_end_date
    GROUP BY page_path
    ORDER BY view_count DESC
    LIMIT p_limit;
$$;

-- Get revenue stats
CREATE OR REPLACE FUNCTION get_revenue_stats(
    p_start_date timestamptz,
    p_end_date timestamptz
)
RETURNS TABLE (
    total_revenue_pence bigint,
    pending_revenue_pence bigint,
    paid_invoices bigint,
    pending_invoices bigint,
    total_bookings bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        COALESCE(SUM(CASE WHEN status = 'paid' THEN total_pence ELSE 0 END), 0)::bigint as total_revenue_pence,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN total_pence ELSE 0 END), 0)::bigint as pending_revenue_pence,
        COUNT(CASE WHEN status = 'paid' THEN 1 END)::bigint as paid_invoices,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::bigint as pending_invoices,
        (SELECT COUNT(*) FROM bookings WHERE created_at BETWEEN p_start_date AND p_end_date)::bigint as total_bookings
    FROM invoices
    WHERE issued_at BETWEEN p_start_date AND p_end_date;
$$;

-- Mark invoice as paid (admin only)
CREATE OR REPLACE FUNCTION mark_invoice_paid(
    p_invoice_id uuid,
    p_payment_method text,
    p_payment_reference text,
    p_paid_by uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE invoices
    SET status = 'paid',
        paid_at = now(),
        payment_method = p_payment_method,
        payment_reference = p_payment_reference
    WHERE id = p_invoice_id;
    
    -- Create receipt
    INSERT INTO receipts (invoice_id, paid_by, payment_method, payment_reference, amount_pence)
    SELECT id, p_paid_by, p_payment_method, p_payment_reference, total_pence
    FROM invoices
    WHERE id = p_invoice_id;
    
    -- Update customer total spent
    UPDATE customers c
    SET total_spent_pence = total_spent_pence + i.total_pence,
        last_contact = now()
    FROM invoices i
    WHERE i.id = p_invoice_id AND c.id = i.customer_id;
END;
$$;

-- Send email helper (logs only, actual sending done externally)
CREATE OR REPLACE FUNCTION log_email(
    p_customer_id uuid,
    p_email_to text,
    p_subject text,
    p_body text,
    p_status text DEFAULT 'sent'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id bigint;
BEGIN
    INSERT INTO email_log (customer_id, email_to, subject, body, status)
    VALUES (p_customer_id, p_email_to, p_subject, p_body, p_status)
    RETURNING id INTO v_id;
    
    -- Update customer last contact
    UPDATE customers SET last_contact = now() WHERE id = p_customer_id;
    
    RETURN v_id;
END;
$$;

-- Revoke public access
REVOKE EXECUTE ON FUNCTION get_traffic_stats(timestamptz, timestamptz) FROM public;
REVOKE EXECUTE ON FUNCTION get_top_pages(timestamptz, timestamptz, integer) FROM public;
REVOKE EXECUTE ON FUNCTION get_revenue_stats(timestamptz, timestamptz) FROM public;
REVOKE EXECUTE ON FUNCTION mark_invoice_paid(uuid, text, text, uuid) FROM public;
REVOKE EXECUTE ON FUNCTION log_email(uuid, text, text, text, text) FROM public;

-- Comments
COMMENT ON FUNCTION get_traffic_stats IS 'Admin: Get website traffic statistics';
COMMENT ON FUNCTION get_top_pages IS 'Admin: Get most viewed pages';
COMMENT ON FUNCTION get_revenue_stats IS 'Admin: Get revenue and booking stats';
COMMENT ON FUNCTION mark_invoice_paid IS 'Admin: Mark invoice as paid and create receipt';
COMMENT ON FUNCTION log_email IS 'Admin: Log outgoing emails';

