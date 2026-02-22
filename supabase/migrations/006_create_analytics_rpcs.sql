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
SET search_path = ''
AS $$
    SELECT 
        COUNT(DISTINCT s.id)::bigint as total_sessions,
        COUNT(pv.id)::bigint as total_pageviews,
        COUNT(DISTINCT COALESCE(s.user_id, s.ip::text))::bigint as unique_visitors,
        ROUND(AVG(s.duration_seconds), 2) as avg_session_duration,
        ROUND(AVG(s.pages_viewed), 2) as avg_pages_per_session
    FROM public.sessions s
    LEFT JOIN public.page_views pv ON pv.session_id = s.id
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
SET search_path = ''
AS $$
    SELECT 
        pv.page_path,
        COUNT(*)::bigint as view_count,
        COUNT(DISTINCT pv.session_id)::bigint as unique_visitors
    FROM public.page_views pv
    WHERE pv.created_at BETWEEN p_start_date AND p_end_date
    GROUP BY pv.page_path
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
SET search_path = ''
AS $$
    SELECT 
        COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.total_pence ELSE 0 END), 0)::bigint as total_revenue_pence,
        COALESCE(SUM(CASE WHEN i.status = 'pending' THEN i.total_pence ELSE 0 END), 0)::bigint as pending_revenue_pence,
        COUNT(CASE WHEN i.status = 'paid' THEN 1 END)::bigint as paid_invoices,
        COUNT(CASE WHEN i.status = 'pending' THEN 1 END)::bigint as pending_invoices,
        (SELECT COUNT(*) FROM public.bookings WHERE created_at BETWEEN p_start_date AND p_end_date)::bigint as total_bookings
    FROM public.invoices i
    WHERE i.issued_at BETWEEN p_start_date AND p_end_date;
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
SET search_path = ''
AS $$
BEGIN
    UPDATE public.invoices
    SET status = 'paid',
        paid_at = now(),
        payment_method = p_payment_method,
        payment_reference = p_payment_reference
    WHERE id = p_invoice_id;
    
    INSERT INTO public.receipts (invoice_id, paid_by, payment_method, payment_reference, amount_pence)
    SELECT id, p_paid_by, p_payment_method, p_payment_reference, total_pence
    FROM public.invoices
    WHERE id = p_invoice_id;
    
    UPDATE public.customers c
    SET total_spent_pence = total_spent_pence + i.total_pence,
        last_contact = now()
    FROM public.invoices i
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
SET search_path = ''
AS $$
DECLARE
    v_id bigint;
BEGIN
    INSERT INTO public.email_log (customer_id, email_to, subject, body, status)
    VALUES (p_customer_id, p_email_to, p_subject, p_body, p_status)
    RETURNING id INTO v_id;
    
    UPDATE public.customers SET last_contact = now() WHERE id = p_customer_id;
    
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

