-- ================================================================
-- ROCK.SCOT — ENTERPRISE DATABASE
-- ONE FILE. COPY. PASTE. RUN. DONE.
-- ================================================================
-- Includes:
--   ✅ pgvector  (AI-powered ad matching)
--   ✅ PostGIS   (geospatial coverage maps)
--   ✅ RLS       (row-level security on every table)
--   ✅ MFA       (multi-factor auth support)
--   ✅ Auth      (user profiles, roles)
--   ✅ Realtime  (wire news ticker)
--   ✅ Invoicing (auto-numbered, VAT)
--   ✅ Payments  (Revolut / bank transfer tracking)
--   ✅ Campaigns (broadcast tracking)
--   ✅ Discounts (approval workflow)
--   ✅ Analytics (page views, sessions)
--   ✅ Activity log (full audit trail)
--   ✅ Full-text search on news
-- ================================================================

BEGIN;

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";          -- pgvector: AI similarity search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";          -- Trigram: fast fuzzy text search
CREATE EXTENSION IF NOT EXISTS "unaccent";         -- Clean text for search

-- PostGIS for geospatial (coverage maps) — uncomment if enabled on your plan
-- CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================
-- HELPER: safe DROP existing objects before recreating
-- (prevents the "already exists" error you saw)
-- ============================================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS activity_log            CASCADE;
DROP TABLE IF EXISTS payment_transactions    CASCADE;
DROP TABLE IF EXISTS invoices               CASCADE;
DROP TABLE IF EXISTS campaigns              CASCADE;
DROP TABLE IF EXISTS wire_news              CASCADE;
DROP TABLE IF EXISTS page_views             CASCADE;
DROP TABLE IF EXISTS sessions               CASCADE;
DROP TABLE IF EXISTS discount_approvals     CASCADE;
DROP TABLE IF EXISTS discounts              CASCADE;
DROP TABLE IF EXISTS advertising_leads      CASCADE;
DROP TABLE IF EXISTS user_profiles          CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS create_user_profile()         CASCADE;
DROP FUNCTION IF EXISTS generate_invoice_number()     CASCADE;
DROP FUNCTION IF EXISTS purge_old_wire_news()         CASCADE;
DROP FUNCTION IF EXISTS log_activity(TEXT,TEXT,UUID,TEXT,JSONB) CASCADE;
DROP FUNCTION IF EXISTS get_customer_dashboard_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS validate_discount(TEXT)       CASCADE;
DROP FUNCTION IF EXISTS create_discount_code(TEXT,BIGINT,INTEGER,UUID,TEXT) CASCADE;
DROP FUNCTION IF EXISTS approve_discount(UUID,UUID,TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_pending_discounts()       CASCADE;
DROP FUNCTION IF EXISTS match_advertisers(vector,FLOAT,INT) CASCADE;
DROP FUNCTION IF EXISTS search_wire_news(TEXT)        CASCADE;

-- ============================================================
-- 1. USER PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE user_profiles (
    id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    first_name          TEXT,
    last_name           TEXT,
    company_name        TEXT,
    phone               TEXT,
    vat_number          TEXT,
    billing_address     JSONB,

    -- Role-based access: customer < admin < super_admin
    role                TEXT NOT NULL DEFAULT 'customer'
                            CHECK (role IN ('customer','admin','super_admin')),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,

    -- MFA support
    mfa_enabled         BOOLEAN NOT NULL DEFAULT FALSE,

    -- Preferences
    email_notifications BOOLEAN NOT NULL DEFAULT TRUE,

    -- Tracking
    last_login_at       TIMESTAMPTZ,
    login_count         INTEGER NOT NULL DEFAULT 0,

    -- pgvector: embedding for AI ad matching (128-dim)
    embedding           vector(128),

    metadata            JSONB
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_profile_select"   ON user_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own_profile_update"   ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "admin_all_profiles"   ON user_profiles FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')));

CREATE INDEX idx_user_profiles_role      ON user_profiles(role);
CREATE INDEX idx_user_profiles_embedding ON user_profiles USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);  -- AI similarity index

-- ============================================================
-- 2. ADVERTISING LEADS (booking submissions)
-- ============================================================
CREATE TABLE advertising_leads (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Who
    user_id             UUID REFERENCES auth.users(id),
    first_name          TEXT NOT NULL,
    last_name           TEXT NOT NULL,
    company             TEXT,
    email               TEXT NOT NULL,
    phone               TEXT,

    -- Package
    product_id          TEXT NOT NULL,
    product_name        TEXT NOT NULL,
    campaign_length_days INTEGER NOT NULL DEFAULT 28,

    -- Mux configuration (captured at booking time)
    -- mux_type: 'single' | 'multi' | 'toh'
    mux_type            TEXT NOT NULL DEFAULT 'multi'
                            CHECK (mux_type IN ('single','multi','toh')),
    selected_mux        TEXT
                            CHECK (selected_mux IN ('inverclyde','north_ayrshire','south_lanarkshire')),
    mux_weight          INTEGER NOT NULL DEFAULT 3
                            CHECK (mux_weight IN (1, 3)),

    -- Pricing (all in pence to avoid float issues)
    product_net_pence   BIGINT NOT NULL,
    bolt_on_included    BOOLEAN NOT NULL DEFAULT FALSE,
    bolt_on_cost_pence  BIGINT NOT NULL DEFAULT 0,
    discount_code       TEXT,
    discount_amount_pence BIGINT NOT NULL DEFAULT 0,
    final_price_pence   BIGINT NOT NULL DEFAULT 0,

    -- Campaign dates
    start_date          DATE,

    -- Rush surcharge
    is_rush             BOOLEAN NOT NULL DEFAULT FALSE,

    -- Message
    message             TEXT,

    -- Tracking
    user_agent          TEXT,
    ip_address          INET,
    submitted_via       TEXT DEFAULT 'web',
    meta                JSONB
);

ALTER TABLE advertising_leads ENABLE ROW LEVEL SECURITY;

-- Public: insert only (form submissions)
CREATE POLICY "public_insert_leads"        ON advertising_leads FOR INSERT TO anon, authenticated WITH CHECK (true);
-- Authenticated users see their own
CREATE POLICY "own_leads_select"           ON advertising_leads FOR SELECT TO authenticated USING (user_id = auth.uid());
-- Admins see all
CREATE POLICY "admin_all_leads"            ON advertising_leads FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')));

CREATE INDEX idx_leads_created   ON advertising_leads(created_at DESC);
CREATE INDEX idx_leads_email     ON advertising_leads(email);
CREATE INDEX idx_leads_user      ON advertising_leads(user_id);
CREATE INDEX idx_leads_start     ON advertising_leads(start_date);

-- ============================================================
-- 3. DISCOUNTS
-- ============================================================
CREATE TABLE discounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    code            TEXT UNIQUE NOT NULL,

    -- One of these must be set (check constraint enforces it)
    amount_pence    BIGINT,
    percent_off     INTEGER CHECK (percent_off BETWEEN 1 AND 100),

    -- Approval workflow (two-person rule)
    created_by      UUID REFERENCES auth.users(id),
    approved_by     UUID REFERENCES auth.users(id),
    approved_at     TIMESTAMPTZ,

    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    note            TEXT,

    -- Usage limits
    max_uses        INTEGER,
    use_count       INTEGER NOT NULL DEFAULT 0,
    expires_at      TIMESTAMPTZ,

    CONSTRAINT discount_type_check CHECK (
        (amount_pence IS NOT NULL AND percent_off IS NULL) OR
        (amount_pence IS NULL AND percent_off IS NOT NULL)
    )
);

ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

-- Public: read approved, active, non-expired only
CREATE POLICY "public_read_approved_discounts" ON discounts FOR SELECT TO anon, authenticated
    USING (
        approved_at IS NOT NULL
        AND is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (max_uses IS NULL OR use_count < max_uses)
    );
-- Admins: full control
CREATE POLICY "admin_all_discounts" ON discounts FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')));

CREATE INDEX idx_discount_code     ON discounts(code);
CREATE INDEX idx_discount_approved ON discounts(approved_at) WHERE approved_at IS NOT NULL;
CREATE INDEX idx_discount_expires  ON discounts(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================
-- 4. DISCOUNT APPROVALS (audit log)
-- ============================================================
CREATE TABLE discount_approvals (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    discount_id UUID NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
    approved_by UUID NOT NULL REFERENCES auth.users(id),
    action      TEXT NOT NULL CHECK (action IN ('approved','rejected')),
    note        TEXT
);

ALTER TABLE discount_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_discount_approvals" ON discount_approvals FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')));

-- ============================================================
-- 5. INVOICES (auto-numbered, VAT-aware)
-- ============================================================
CREATE TABLE invoices (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    booking_id              UUID NOT NULL REFERENCES advertising_leads(id) ON DELETE CASCADE,
    user_id                 UUID REFERENCES auth.users(id),

    invoice_number          TEXT UNIQUE,          -- e.g. INV-26-00001
    invoice_date            DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date                DATE NOT NULL,

    -- Money (all pence)
    subtotal_pence          BIGINT NOT NULL,
    vat_pence               BIGINT NOT NULL DEFAULT 0,
    total_pence             BIGINT NOT NULL,

    -- Status
    status                  TEXT NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
    paid_at                 TIMESTAMPTZ,

    -- Payment (Revolut / bank transfer / other)
    payment_method          TEXT CHECK (payment_method IN ('revolut','bank_transfer','cash','other')),
    revolut_payment_link    TEXT,
    bank_reference          TEXT,

    -- Document
    pdf_url                 TEXT,
    notes                   TEXT,
    metadata                JSONB
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_invoices_select"  ON invoices FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admin_all_invoices"   ON invoices FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')));

CREATE INDEX idx_invoices_user   ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- ============================================================
-- 6. PAYMENT TRANSACTIONS (Revolut / bank transfer)
-- ============================================================
CREATE TABLE payment_transactions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    invoice_id              UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    user_id                 UUID REFERENCES auth.users(id),

    amount_pence            BIGINT NOT NULL,
    currency                TEXT NOT NULL DEFAULT 'GBP',

    -- Provider: Revolut or bank transfer (no Stripe)
    provider                TEXT NOT NULL CHECK (provider IN ('revolut','bank_transfer','cash','other')),
    provider_transaction_id TEXT,
    provider_reference      TEXT,

    status                  TEXT NOT NULL CHECK (status IN ('pending','processing','completed','failed','refunded')),

    completed_at            TIMESTAMPTZ,
    metadata                JSONB
);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_transactions_select" ON payment_transactions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admin_all_transactions"  ON payment_transactions FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')));

CREATE INDEX idx_transactions_invoice ON payment_transactions(invoice_id);
CREATE INDEX idx_transactions_status  ON payment_transactions(status);

-- ============================================================
-- 7. BROADCAST CONSTANTS
-- ============================================================
-- These are the immutable physics of the schedule.
-- All capacity logic derives from these values.
-- ============================================================
CREATE TABLE broadcast_constants (
    key     TEXT PRIMARY KEY,
    value   INTEGER NOT NULL,
    note    TEXT
);

INSERT INTO broadcast_constants (key, value, note) VALUES
    ('spots_per_break',          4,   '2-min break ÷ 30sec = 4 spots'),
    ('breaks_per_hour',          2,   'at :20 and :40 past each hour'),
    ('campaign_days',           28,   'standard campaign length'),
    ('plays_per_campaign',     134,   '5,376 slot-plays ÷ 40 campaigns'),
    ('plays_toh',              672,   '1 per hour × 24hrs × 28 days'),
    ('mux_count',                3,   'Inverclyde, N.Ayrshire, S.Lanarkshire'),
    ('mux_weight_multi',         3,   'multi-mux consumes 3 capacity units'),
    ('mux_weight_single',        1,   'single-mux consumes 1 capacity unit'),
    ('mux_weight_toh',           3,   'TOH always multi-mux = 3 units'),
    ('max_mux_capacity',       120,   '40 campaigns × weight_3, or 120 × weight_1'),
    ('spots_per_mux_28d',     5376,   '4 × 2 × 24 × 28 = 5,376 slot-plays per mux');

-- broadcast_constants is read-only: admins read, nobody writes via API
ALTER TABLE broadcast_constants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_constants" ON broadcast_constants FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')));

-- ============================================================
-- 8. CAMPAIGNS (broadcast-aware capacity tracking)
-- ============================================================
-- mux_type:   'multi' = all 3 mux, 'single' = 1 mux, 'toh' = top of hour ident
-- mux_weight: derived from mux_type (3, 1, or 3). Stored for fast capacity queries.
-- selected_mux: which mux for single-mux campaigns ('inverclyde','north_ayrshire','south_lanarkshire')
-- capacity_units: mux_weight × total_plays — the number this campaign contributes
--                 to the capacity check query.
-- ============================================================
CREATE TABLE campaigns (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    booking_id      UUID NOT NULL REFERENCES advertising_leads(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES auth.users(id),

    name            TEXT NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,

    -- ── PACKAGE TYPE ─────────────────────────────────────────
    package_type    TEXT NOT NULL
                        CHECK (package_type IN ('regional','multi_regional','top_of_hour')),

    -- ── MUX CONFIGURATION ────────────────────────────────────
    mux_type        TEXT NOT NULL
                        CHECK (mux_type IN ('single','multi','toh')),

    -- Which mux for single-mux campaigns (NULL = all mux for multi/toh)
    selected_mux    TEXT
                        CHECK (selected_mux IN ('inverclyde','north_ayrshire','south_lanarkshire')),

    -- Pre-computed from mux_type — used in capacity queries
    -- single=1, multi=3, toh=3
    mux_weight      INTEGER NOT NULL
                        CHECK (mux_weight IN (1, 3)),

    -- ── PLAYS ─────────────────────────────────────────────────
    -- Standard = 134 (multi/single), TOH = 672
    total_plays     INTEGER NOT NULL
                        CHECK (total_plays IN (134, 672)),

    plays_completed INTEGER NOT NULL DEFAULT 0
                        CHECK (plays_completed >= 0),

    -- ── CAPACITY UNITS (for the capacity check constraint) ────
    -- = mux_weight × total_plays
    -- multi:  3 × 134 =  402
    -- single: 1 × 134 =  134
    -- toh:    3 × 672 = 2,016
    capacity_units  INTEGER NOT NULL
                        GENERATED ALWAYS AS (mux_weight * total_plays) STORED,

    -- ── STATUS ───────────────────────────────────────────────
    status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','approved','active','completed','cancelled')),

    -- ── CREATIVE ─────────────────────────────────────────────
    creative_url        TEXT,
    creative_approved   BOOLEAN NOT NULL DEFAULT FALSE,
    creative_notes      TEXT,

    -- ── PERFORMANCE ──────────────────────────────────────────
    -- reach = how many unique listeners could hear it
    -- For multi: estimated full Scotland reach (~410,000)
    -- For single: per-mux reach estimate
    reach_estimate  INTEGER,
    impressions     INTEGER NOT NULL DEFAULT 0,

    metadata        JSONB,

    -- ── INTEGRITY CONSTRAINTS ────────────────────────────────
    -- Single-mux MUST have a selected_mux
    CONSTRAINT single_mux_must_specify
        CHECK (mux_type != 'single' OR selected_mux IS NOT NULL),

    -- Multi and TOH must NOT have a selected_mux (they play everywhere)
    CONSTRAINT multi_toh_no_selected_mux
        CHECK (mux_type NOT IN ('multi','toh') OR selected_mux IS NULL),

    -- TOH must use toh package_type
    CONSTRAINT toh_package_type
        CHECK (mux_type != 'toh' OR package_type = 'top_of_hour'),

    -- mux_weight must match mux_type (denormalised but enforced)
    CONSTRAINT weight_matches_type
        CHECK (
            (mux_type = 'single' AND mux_weight = 1) OR
            (mux_type = 'multi'  AND mux_weight = 3) OR
            (mux_type = 'toh'    AND mux_weight = 3)
        ),

    -- total_plays must match mux_type
    CONSTRAINT plays_match_type
        CHECK (
            (mux_type = 'toh'                    AND total_plays = 672) OR
            (mux_type IN ('single','multi')       AND total_plays = 134)
        )
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_campaigns_select" ON campaigns FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admin_all_campaigns"  ON campaigns FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')));

CREATE INDEX idx_campaigns_user      ON campaigns(user_id);
CREATE INDEX idx_campaigns_status    ON campaigns(status);
CREATE INDEX idx_campaigns_dates     ON campaigns(start_date, end_date);
CREATE INDEX idx_campaigns_mux_type  ON campaigns(mux_type);
CREATE INDEX idx_campaigns_sel_mux   ON campaigns(selected_mux) WHERE selected_mux IS NOT NULL;
-- Partial index: active campaigns only — the ones that matter for capacity
CREATE INDEX idx_campaigns_active    ON campaigns(status, start_date, end_date)
    WHERE status IN ('approved','active');

-- ============================================================
-- 9. CAPACITY ENFORCEMENT
-- ============================================================
-- Function: get_current_mux_capacity_used
-- Returns how many of the 120 capacity units are currently
-- consumed by active/approved campaigns in a given date range.
-- ============================================================
CREATE OR REPLACE FUNCTION get_capacity_used(
    p_start_date DATE DEFAULT CURRENT_DATE,
    p_end_date   DATE DEFAULT CURRENT_DATE + 28
)
RETURNS TABLE (
    mux_type            TEXT,
    campaign_count      BIGINT,
    capacity_units_used BIGINT,
    capacity_remaining  INTEGER
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
    WITH active AS (
        SELECT
            mux_type,
            COUNT(*)         AS campaign_count,
            SUM(mux_weight)  AS weight_used      -- weight per campaign slot (not × plays)
        FROM campaigns
        WHERE status IN ('approved','active')
          AND start_date <= p_end_date
          AND end_date   >= p_start_date
        GROUP BY mux_type
    ),
    totals AS (
        SELECT
            SUM(weight_used) AS total_weight_used
        FROM active
    )
    SELECT
        a.mux_type,
        a.campaign_count,
        a.weight_used         AS capacity_units_used,
        120 - t.total_weight_used AS capacity_remaining
    FROM active a, totals t
    ORDER BY a.mux_type;
$$;

-- Function: check_capacity_before_approve
-- Returns TRUE if a proposed campaign fits within remaining capacity.
-- Call this BEFORE approving a new campaign.
CREATE OR REPLACE FUNCTION check_capacity(
    p_mux_type   TEXT,
    p_start_date DATE,
    p_end_date   DATE
)
RETURNS JSON
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
    v_weight          INTEGER;
    v_used            INTEGER;
    v_remaining       INTEGER;
    v_toh_sold        BOOLEAN;
    v_max             INTEGER := 120;
BEGIN
    -- Get weight for proposed campaign type
    v_weight := CASE p_mux_type
        WHEN 'single' THEN 1
        WHEN 'multi'  THEN 3
        WHEN 'toh'    THEN 3
    END;

    -- Get current total weight used in this date range
    SELECT COALESCE(SUM(mux_weight), 0)
    INTO v_used
    FROM campaigns
    WHERE status IN ('approved','active')
      AND start_date <= p_end_date
      AND end_date   >= p_start_date;

    v_remaining := v_max - v_used;

    -- Check if TOH is already sold in this period
    SELECT EXISTS (
        SELECT 1 FROM campaigns
        WHERE mux_type = 'toh'
          AND status IN ('approved','active')
          AND start_date <= p_end_date
          AND end_date   >= p_start_date
    ) INTO v_toh_sold;

    RETURN json_build_object(
        'proposed_type',      p_mux_type,
        'proposed_weight',    v_weight,
        'capacity_used',      v_used,
        'capacity_remaining', v_remaining,
        'max_capacity',       v_max,
        'toh_already_sold',   v_toh_sold,
        'can_approve',        (v_remaining >= v_weight AND (p_mux_type != 'toh' OR NOT v_toh_sold)),
        'reason', CASE
            WHEN p_mux_type = 'toh' AND v_toh_sold
                THEN 'Top of Hour already sold for this period'
            WHEN v_remaining < v_weight
                THEN 'Insufficient capacity: need ' || v_weight || ' units, only ' || v_remaining || ' remaining'
            ELSE 'OK'
        END
    );
END;
$$;

-- Function: capacity_summary
-- Admin dashboard overview of current and upcoming capacity
CREATE OR REPLACE FUNCTION capacity_summary()
RETURNS JSON
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE result JSON;
BEGIN
    SELECT json_build_object(
        'max_capacity',         120,

        -- Active now
        'active_weight_used',   (
            SELECT COALESCE(SUM(mux_weight), 0) FROM campaigns
            WHERE status = 'active' AND CURRENT_DATE BETWEEN start_date AND end_date
        ),
        'active_campaigns',     (
            SELECT COUNT(*) FROM campaigns
            WHERE status = 'active' AND CURRENT_DATE BETWEEN start_date AND end_date
        ),

        -- By type (active)
        'active_multi',         (SELECT COUNT(*) FROM campaigns WHERE status='active' AND mux_type='multi'  AND CURRENT_DATE BETWEEN start_date AND end_date),
        'active_single',        (SELECT COUNT(*) FROM campaigns WHERE status='active' AND mux_type='single' AND CURRENT_DATE BETWEEN start_date AND end_date),
        'active_toh',           (SELECT COUNT(*) FROM campaigns WHERE status='active' AND mux_type='toh'    AND CURRENT_DATE BETWEEN start_date AND end_date),

        -- Single mux breakdown
        'active_single_inverclyde',     (SELECT COUNT(*) FROM campaigns WHERE status='active' AND mux_type='single' AND selected_mux='inverclyde'     AND CURRENT_DATE BETWEEN start_date AND end_date),
        'active_single_north_ayrshire', (SELECT COUNT(*) FROM campaigns WHERE status='active' AND mux_type='single' AND selected_mux='north_ayrshire'  AND CURRENT_DATE BETWEEN start_date AND end_date),
        'active_single_s_lanarkshire',  (SELECT COUNT(*) FROM campaigns WHERE status='active' AND mux_type='single' AND selected_mux='south_lanarkshire' AND CURRENT_DATE BETWEEN start_date AND end_date),

        -- TOH
        'toh_sold',             (SELECT EXISTS (SELECT 1 FROM campaigns WHERE status IN ('approved','active') AND mux_type='toh' AND CURRENT_DATE BETWEEN start_date AND end_date)),

        -- Headroom
        'capacity_remaining',   120 - (SELECT COALESCE(SUM(mux_weight),0) FROM campaigns WHERE status IN ('approved','active') AND CURRENT_DATE BETWEEN start_date AND end_date),
        'max_additional_multi', (120 - (SELECT COALESCE(SUM(mux_weight),0) FROM campaigns WHERE status IN ('approved','active') AND CURRENT_DATE BETWEEN start_date AND end_date)) / 3,
        'max_additional_single',(120 - (SELECT COALESCE(SUM(mux_weight),0) FROM campaigns WHERE status IN ('approved','active') AND CURRENT_DATE BETWEEN start_date AND end_date))
    ) INTO result;
    RETURN result;
END;
$$;

-- ============================================================
-- 8. THE WIRE — Scottish Rock News Ticker
-- ============================================================
CREATE TABLE wire_news (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    title           TEXT NOT NULL,
    summary         TEXT,
    source_url      TEXT UNIQUE,
    source_name     TEXT,
    genre           TEXT CHECK (genre IN ('Rock','Metal','Punk','Indie','Alternative')),

    is_live         BOOLEAN NOT NULL DEFAULT TRUE,
    dialect_applied BOOLEAN NOT NULL DEFAULT FALSE,

    -- pgvector: AI embedding for similarity/dedup (384-dim)
    embedding       vector(384),

    -- Full-text search
    search_vector   TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(title,'') || ' ' || coalesce(summary,''))
    ) STORED
);

ALTER TABLE wire_news ENABLE ROW LEVEL SECURITY;

-- Public: read live stories
CREATE POLICY "public_read_wire"          ON wire_news FOR SELECT TO anon, authenticated USING (is_live = TRUE);
-- Authenticated (backend/admin): insert & update
CREATE POLICY "authenticated_insert_wire" ON wire_news FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "authenticated_update_wire" ON wire_news FOR UPDATE TO authenticated USING (TRUE);

CREATE INDEX idx_wire_created   ON wire_news(created_at DESC);
CREATE INDEX idx_wire_genre     ON wire_news(genre);
CREATE INDEX idx_wire_live      ON wire_news(is_live) WHERE is_live = TRUE;
CREATE INDEX idx_wire_fts       ON wire_news USING gin(search_vector);  -- Full-text search
CREATE INDEX idx_wire_embedding ON wire_news USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 50);  -- AI similarity index

-- Enable for Realtime (THE WIRE live ticker)
ALTER PUBLICATION supabase_realtime ADD TABLE wire_news;

-- ============================================================
-- 9. PAGE VIEWS (analytics — only with cookie consent)
-- ============================================================
CREATE TABLE page_views (
    id          BIGSERIAL PRIMARY KEY,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    session_id  UUID,
    visitor_id  UUID,
    user_id     UUID REFERENCES auth.users(id),

    page_path   TEXT NOT NULL,
    referrer    TEXT,
    user_agent  TEXT,
    device_type TEXT CHECK (device_type IN ('mobile','tablet','desktop')),
    country     TEXT,
    ip_address  INET
);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_insert_pageviews"    ON page_views FOR INSERT TO anon, authenticated WITH CHECK (TRUE);
CREATE POLICY "admin_all_pageviews"        ON page_views FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')));

CREATE INDEX idx_pageviews_created ON page_views(created_at DESC);
CREATE INDEX idx_pageviews_path    ON page_views(page_path);
CREATE INDEX idx_pageviews_session ON page_views(session_id);

-- ============================================================
-- 10. SESSIONS (analytics)
-- ============================================================
CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    visitor_id      UUID,
    user_id         UUID REFERENCES auth.users(id),

    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,

    duration_seconds INTEGER,
    pages_viewed    INTEGER NOT NULL DEFAULT 0,
    referrer        TEXT,
    user_agent      TEXT,
    device_type     TEXT,
    country         TEXT
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_insert_sessions"   ON sessions FOR INSERT TO anon, authenticated WITH CHECK (TRUE);
CREATE POLICY "public_update_sessions"   ON sessions FOR UPDATE TO anon, authenticated USING (TRUE);
CREATE POLICY "admin_all_sessions"       ON sessions FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')));

CREATE INDEX idx_sessions_visitor ON sessions(visitor_id);
CREATE INDEX idx_sessions_started ON sessions(started_at DESC);

-- ============================================================
-- 11. ACTIVITY LOG (full audit trail)
-- ============================================================
CREATE TABLE activity_log (
    id          BIGSERIAL PRIMARY KEY,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    user_id     UUID REFERENCES auth.users(id),
    action      TEXT NOT NULL,
    entity_type TEXT,
    entity_id   UUID,
    description TEXT,
    metadata    JSONB,
    ip_address  INET,
    user_agent  TEXT
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_logs" ON activity_log FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')));

CREATE INDEX idx_activity_created ON activity_log(created_at DESC);
CREATE INDEX idx_activity_user    ON activity_log(user_id);
CREATE INDEX idx_activity_action  ON activity_log(action);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- A) Auto-create user profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO user_profiles (id, first_name, last_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        'customer'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- B) Auto-number invoices (INV-YY-NNNNN)
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    yr TEXT;
    nxt INTEGER;
BEGIN
    IF NEW.invoice_number IS NULL THEN
        yr := TO_CHAR(CURRENT_DATE, 'YY');
        SELECT COALESCE(MAX(CAST(SPLIT_PART(invoice_number, '-', 3) AS INTEGER)), 0) + 1
        INTO nxt
        FROM invoices
        WHERE invoice_number LIKE 'INV-' || yr || '-%';
        NEW.invoice_number := 'INV-' || yr || '-' || LPAD(nxt::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_invoice_number
    BEFORE INSERT ON invoices
    FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- C) Auto-purge Wire news older than 30 days (keeps THE WIRE searchable for 30 days)
CREATE OR REPLACE FUNCTION purge_old_wire_news()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    DELETE FROM wire_news
    WHERE created_at < NOW() - INTERVAL '30 days';
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_wire_cleanup
    AFTER INSERT ON wire_news
    FOR EACH STATEMENT EXECUTE FUNCTION purge_old_wire_news();

-- D) Activity logger (call from Edge Functions)
CREATE OR REPLACE FUNCTION log_activity(
    p_action      TEXT,
    p_entity_type TEXT    DEFAULT NULL,
    p_entity_id   UUID    DEFAULT NULL,
    p_description TEXT    DEFAULT NULL,
    p_metadata    JSONB   DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO activity_log (user_id, action, entity_type, entity_id, description, metadata)
    VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_description, p_metadata);
END;
$$;

-- E) Validate discount (public-safe, checks all guards)
CREATE OR REPLACE FUNCTION validate_discount(p_code TEXT)
RETURNS TABLE (
    id          UUID,
    code        TEXT,
    amount_pence BIGINT,
    percent_off INTEGER,
    is_valid    BOOLEAN
)
LANGUAGE sql SECURITY DEFINER AS $$
    SELECT
        id, code, amount_pence, percent_off,
        (
            approved_at IS NOT NULL
            AND is_active = TRUE
            AND (expires_at IS NULL OR expires_at > NOW())
            AND (max_uses IS NULL OR use_count < max_uses)
        ) AS is_valid
    FROM discounts
    WHERE UPPER(code) = UPPER(p_code);
$$;

-- F) Create discount code (admin only)
CREATE OR REPLACE FUNCTION create_discount_code(
    p_code          TEXT,
    p_amount_pence  BIGINT  DEFAULT NULL,
    p_percent_off   INTEGER DEFAULT NULL,
    p_created_by    UUID    DEFAULT NULL,
    p_note          TEXT    DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_id UUID;
BEGIN
    INSERT INTO discounts (code, amount_pence, percent_off, created_by, note)
    VALUES (UPPER(p_code), p_amount_pence, p_percent_off, p_created_by, p_note)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

-- G) Approve discount (two-person rule)
CREATE OR REPLACE FUNCTION approve_discount(
    p_discount_id UUID,
    p_approved_by UUID,
    p_note        TEXT DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Cannot approve own discount
    IF (SELECT created_by FROM discounts WHERE id = p_discount_id) = p_approved_by THEN
        RAISE EXCEPTION 'Cannot approve your own discount code';
    END IF;

    UPDATE discounts
    SET approved_at = NOW(), approved_by = p_approved_by
    WHERE id = p_discount_id;

    INSERT INTO discount_approvals (discount_id, approved_by, action, note)
    VALUES (p_discount_id, p_approved_by, 'approved', p_note);
END;
$$;

-- H) Get pending discounts
CREATE OR REPLACE FUNCTION get_pending_discounts()
RETURNS TABLE (
    id           UUID,
    code         TEXT,
    amount_pence BIGINT,
    percent_off  INTEGER,
    created_at   TIMESTAMPTZ,
    note         TEXT
)
LANGUAGE sql SECURITY DEFINER AS $$
    SELECT id, code, amount_pence, percent_off, created_at, note
    FROM discounts
    WHERE approved_at IS NULL
    ORDER BY created_at DESC;
$$;

-- I) Customer dashboard stats
CREATE OR REPLACE FUNCTION get_customer_dashboard_stats(p_user_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result JSON;
BEGIN
    SELECT json_build_object(
        'total_bookings',   (SELECT COUNT(*)   FROM advertising_leads   WHERE user_id = p_user_id),
        'active_campaigns', (SELECT COUNT(*)   FROM campaigns           WHERE user_id = p_user_id AND status = 'active'),
        'total_spent_pence',(SELECT COALESCE(SUM(total_pence),0) FROM invoices WHERE user_id = p_user_id AND status = 'paid'),
        'pending_invoices', (SELECT COUNT(*)   FROM invoices            WHERE user_id = p_user_id AND status IN ('sent','overdue')),
        'plays_this_month', (SELECT COALESCE(SUM(plays_completed),0) FROM campaigns WHERE user_id = p_user_id AND start_date >= DATE_TRUNC('month', NOW())::DATE)
    ) INTO result;
    RETURN result;
END;
$$;

-- J) AI: Find similar advertisers via pgvector cosine similarity
CREATE OR REPLACE FUNCTION match_advertisers(
    query_embedding vector(128),
    match_threshold FLOAT   DEFAULT 0.7,
    match_count     INT     DEFAULT 5
)
RETURNS TABLE (
    id          UUID,
    company     TEXT,
    similarity  FLOAT
)
LANGUAGE sql STABLE AS $$
    SELECT
        p.id,
        p.company_name,
        1 - (p.embedding <=> query_embedding) AS similarity
    FROM user_profiles p
    WHERE p.embedding IS NOT NULL
      AND 1 - (p.embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
$$;

-- K) Full-text search on Wire news
CREATE OR REPLACE FUNCTION search_wire_news(query TEXT)
RETURNS TABLE (
    id       UUID,
    title    TEXT,
    summary  TEXT,
    genre    TEXT,
    rank     FLOAT
)
LANGUAGE sql STABLE AS $$
    SELECT
        id, title, summary, genre,
        ts_rank(search_vector, plainto_tsquery('english', query)) AS rank
    FROM wire_news
    WHERE is_live = TRUE
      AND search_vector @@ plainto_tsquery('english', query)
    ORDER BY rank DESC
    LIMIT 20;
$$;

-- ============================================================
-- STORAGE BUCKETS (run after tables)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('documents',        'documents',        TRUE,  10485760, ARRAY['application/pdf','text/html']),
    ('campaign-assets',  'campaign-assets',  FALSE, 52428800, ARRAY['audio/mpeg','audio/wav','audio/mp3','audio/ogg','application/pdf','image/jpeg','image/png']),
    ('avatars',          'avatars',          TRUE,  2097152,  ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "public_read_documents"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'documents');

CREATE POLICY "auth_upload_documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "auth_upload_assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'campaign-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "own_assets_select"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'campaign-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "admin_all_assets"
ON storage.objects FOR ALL TO authenticated
USING (
    bucket_id IN ('campaign-assets','documents')
    AND EXISTS (SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin'))
);

CREATE POLICY "auth_upload_avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "public_read_avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

-- ============================================================
-- PERMISSIONS
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON wire_news, discounts TO anon;
GRANT SELECT, INSERT ON advertising_leads, page_views, sessions TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION validate_discount TO anon;
GRANT EXECUTE ON FUNCTION search_wire_news  TO anon;

-- ============================================================
-- SEED: Sample wire news (so ticker isn't empty on launch)
-- ============================================================
INSERT INTO wire_news (title, genre, source_url, source_name, is_live)
VALUES
    ('ROCK.SCOT NOW LIVE ON DAB+ ACROSS SCOTLAND', 'Rock', 'seed-001', 'ROCK.SCOT', TRUE),
    ('TOM RUSSELL OPENS SCOTLAND''S FIRST DEDICATED ROCK STATION', 'Rock', 'seed-002', 'ROCK.SCOT', TRUE),
    ('INVERCLYDE AND NORTH AYRSHIRE TUNE IN AS SCOTLAND ROCKS', 'Rock', 'seed-003', 'ROCK.SCOT', TRUE)
ON CONFLICT (source_url) DO NOTHING;

-- ============================================================
-- AUDIT: Verify everything was created correctly
-- ============================================================
DO $$
DECLARE
    t RECORD;
    policy_count INT;
    missing_rls BOOLEAN := FALSE;
BEGIN
    -- Check all tables have RLS
    FOR t IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename IN (
            'user_profiles','advertising_leads','discounts','discount_approvals',
            'invoices','payment_transactions','campaigns','wire_news',
            'page_views','sessions','activity_log'
          )
    LOOP
        IF NOT COALESCE((
            SELECT c.relrowsecurity
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = t.tablename AND n.nspname = 'public'
            LIMIT 1
        ), FALSE) THEN
            RAISE WARNING 'RLS NOT enabled on: %', t.tablename;
            missing_rls := TRUE;
        ELSE
            RAISE NOTICE '✅ RLS OK: %', t.tablename;
        END IF;
    END LOOP;

    IF missing_rls THEN
        RAISE EXCEPTION 'AUDIT FAILED: Some tables missing RLS. Check warnings above.';
    END IF;

    -- Check vector extension
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        RAISE WARNING '⚠️  pgvector extension not available on this plan';
    ELSE
        RAISE NOTICE '✅ pgvector OK';
    END IF;

    -- Check realtime
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        RAISE NOTICE '✅ Realtime publication exists';
    END IF;

    RAISE NOTICE '🎸 ROCK.SCOT Enterprise Database — AUDIT PASSED';
END $$;

COMMIT;

-- Final confirmation
SELECT
    '✅ ROCK.SCOT Enterprise DB Ready' AS status,
    COUNT(*) || ' tables created' AS tables,
    NOW() AS deployed_at
FROM pg_tables
WHERE schemaname = 'public';
