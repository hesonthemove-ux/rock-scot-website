-- Migration: 005_create_analytics_and_admin_tables
-- Description: Analytics tracking, invoices, bookings, and customers
-- Date: 2026-02-07

-- Page views and session tracking
CREATE TABLE IF NOT EXISTS page_views (
    id bigserial PRIMARY KEY,
    session_id uuid,
    user_id uuid,
    page_path text NOT NULL,
    referrer text,
    user_agent text,
    ip inet,
    country text,
    city text,
    device_type text, -- mobile, desktop, tablet
    created_at timestamptz DEFAULT now()
);

-- Session tracking with linger time
CREATE TABLE IF NOT EXISTS sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    started_at timestamptz DEFAULT now(),
    last_activity_at timestamptz DEFAULT now(),
    ended_at timestamptz,
    duration_seconds integer,
    pages_viewed integer DEFAULT 0,
    ip inet,
    user_agent text,
    referrer text,
    country text,
    city text
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name text NOT NULL,
    last_name text NOT NULL,
    company text,
    email text UNIQUE NOT NULL,
    phone text,
    created_at timestamptz DEFAULT now(),
    last_contact timestamptz,
    total_spent_pence bigint DEFAULT 0,
    total_bookings integer DEFAULT 0,
    status text DEFAULT 'active', -- active, inactive, blocked
    notes text
);

-- Bookings table (if not exists)
CREATE TABLE IF NOT EXISTS bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid REFERENCES customers(id),
    user_id uuid,
    product_id text NOT NULL,
    product_name text NOT NULL,
    campaign_length_days integer NOT NULL,
    start_date date,
    end_date date,
    status text DEFAULT 'pending', -- pending, confirmed, active, completed, cancelled
    created_at timestamptz DEFAULT now(),
    confirmed_at timestamptz,
    meta jsonb
);

-- Invoices table (if not exists)
CREATE TABLE IF NOT EXISTS invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid REFERENCES bookings(id),
    customer_id uuid REFERENCES customers(id),
    net_pence bigint NOT NULL,
    vat_pence bigint DEFAULT 0,
    total_pence bigint NOT NULL,
    discount_id uuid REFERENCES discounts(id),
    discount_amount_pence bigint DEFAULT 0,
    status text DEFAULT 'pending', -- pending, paid, overdue, cancelled
    issued_at timestamptz DEFAULT now(),
    due_at timestamptz,
    paid_at timestamptz,
    payment_method text,
    payment_reference text,
    meta jsonb
);

-- Email log
CREATE TABLE IF NOT EXISTS email_log (
    id bigserial PRIMARY KEY,
    customer_id uuid REFERENCES customers(id),
    email_to text NOT NULL,
    subject text NOT NULL,
    body text,
    sent_at timestamptz DEFAULT now(),
    status text DEFAULT 'sent', -- sent, failed, bounced
    error_message text
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due ON invoices(due_at) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own page views
CREATE POLICY "allow_insert_pageviews" ON page_views
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Allow authenticated users to insert/update their own sessions
CREATE POLICY "allow_insert_sessions" ON sessions
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "allow_update_own_sessions" ON sessions
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

-- Comments
COMMENT ON TABLE page_views IS 'Track every page view for analytics';
COMMENT ON TABLE sessions IS 'User sessions with duration tracking';
COMMENT ON TABLE customers IS 'Customer master database';
COMMENT ON TABLE email_log IS 'Audit trail of all emails sent';
COMMENT ON COLUMN sessions.duration_seconds IS 'Total session time in seconds';
COMMENT ON COLUMN sessions.pages_viewed IS 'Number of pages viewed in session';

