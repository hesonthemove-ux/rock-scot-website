-- =====================================================
-- ENTERPRISE AUTH & USERS SYSTEM
-- Supabase Auth + Custom User Profiles
-- =====================================================

-- =====================================================
-- 1. USER PROFILES (extends Supabase auth.users)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Basic info
    first_name TEXT,
    last_name TEXT,
    company_name TEXT,
    
    -- Role & permissions
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'super_admin')),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Contact
    phone TEXT,
    
    -- Billing
    billing_address JSONB,
    vat_number TEXT,
    
    -- Preferences
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    last_login_at TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    metadata JSONB
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view/edit their own profile
CREATE POLICY "Users can view own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON user_profiles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
);

-- Indexes
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_company ON user_profiles(company_name);

-- =====================================================
-- 2. CUSTOMER BOOKINGS (link leads to users)
-- =====================================================

-- Add user_id to advertising_leads if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='advertising_leads' AND column_name='user_id') THEN
        ALTER TABLE advertising_leads ADD COLUMN user_id UUID REFERENCES auth.users(id);
        CREATE INDEX idx_leads_user ON advertising_leads(user_id);
    END IF;
END $$;

-- Update RLS: Users can see their own bookings
CREATE POLICY "Users can view own bookings"
ON advertising_leads
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- =====================================================
-- 3. INVOICES
-- =====================================================

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Links
    booking_id UUID REFERENCES advertising_leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    
    -- Invoice details
    invoice_number TEXT UNIQUE NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    
    -- Financial
    subtotal_pence BIGINT NOT NULL,
    vat_pence BIGINT DEFAULT 0,
    total_pence BIGINT NOT NULL,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    paid_at TIMESTAMPTZ,
    
    -- Payment
    payment_method TEXT,
    stripe_payment_intent_id TEXT,
    
    -- Files
    pdf_url TEXT,
    
    -- Metadata
    notes TEXT,
    metadata JSONB
);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own invoices"
ON invoices
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all invoices"
ON invoices
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
);

-- Indexes
CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_booking ON invoices(booking_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- Auto-generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    year_suffix TEXT;
    next_num INTEGER;
BEGIN
    IF NEW.invoice_number IS NULL THEN
        year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
        
        SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 8) AS INTEGER)), 0) + 1
        INTO next_num
        FROM invoices
        WHERE invoice_number LIKE 'INV-' || year_suffix || '%';
        
        NEW.invoice_number := 'INV-' || year_suffix || LPAD(next_num::TEXT, 5, '0');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_invoice_number
BEFORE INSERT ON invoices
FOR EACH ROW
EXECUTE FUNCTION generate_invoice_number();

-- =====================================================
-- 4. PAYMENT TRANSACTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Links
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    
    -- Payment details
    amount_pence BIGINT NOT NULL,
    currency TEXT DEFAULT 'GBP',
    
    -- Provider
    provider TEXT NOT NULL CHECK (provider IN ('stripe', 'bank_transfer', 'cash', 'other')),
    provider_transaction_id TEXT,
    
    -- Status
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    
    -- Metadata
    metadata JSONB
);

-- Enable RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own transactions"
ON payment_transactions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all transactions"
ON payment_transactions
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
);

-- Indexes
CREATE INDEX idx_transactions_user ON payment_transactions(user_id);
CREATE INDEX idx_transactions_invoice ON payment_transactions(invoice_id);
CREATE INDEX idx_transactions_status ON payment_transactions(status);

-- =====================================================
-- 5. CAMPAIGNS (for tracking actual broadcasts)
-- =====================================================

CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Links
    booking_id UUID REFERENCES advertising_leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    
    -- Campaign details
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Package
    package_type TEXT NOT NULL,
    total_plays INTEGER NOT NULL,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'completed', 'cancelled')),
    
    -- Creative
    creative_url TEXT, -- Audio file in storage
    creative_approved BOOLEAN DEFAULT FALSE,
    creative_notes TEXT,
    
    -- Performance
    plays_completed INTEGER DEFAULT 0,
    reach_estimate INTEGER,
    
    -- Metadata
    metadata JSONB
);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own campaigns"
ON campaigns
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all campaigns"
ON campaigns
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
);

-- Indexes
CREATE INDEX idx_campaigns_user ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);

-- =====================================================
-- 6. ACTIVITY LOG (audit trail)
-- =====================================================

CREATE TABLE IF NOT EXISTS activity_log (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Who
    user_id UUID REFERENCES auth.users(id),
    
    -- What
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    
    -- Details
    description TEXT,
    metadata JSONB,
    
    -- Context
    ip_address INET,
    user_agent TEXT
);

-- Enable RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view logs
CREATE POLICY "Admins can view all logs"
ON activity_log
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
);

-- Indexes
CREATE INDEX idx_activity_user ON activity_log(user_id);
CREATE INDEX idx_activity_created ON activity_log(created_at DESC);
CREATE INDEX idx_activity_action ON activity_log(action);

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Create user profile on signup (trigger)
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, first_name, last_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        'customer'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_user_profile();

-- Update last login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_profiles
    SET last_login_at = NOW(),
        login_count = login_count + 1
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log activity helper
CREATE OR REPLACE FUNCTION log_activity(
    p_action TEXT,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO activity_log (user_id, action, entity_type, entity_id, description, metadata)
    VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_description, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's dashboard stats
CREATE OR REPLACE FUNCTION get_customer_dashboard_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_bookings', (SELECT COUNT(*) FROM advertising_leads WHERE user_id = p_user_id),
        'active_campaigns', (SELECT COUNT(*) FROM campaigns WHERE user_id = p_user_id AND status = 'active'),
        'total_spent_pence', (SELECT COALESCE(SUM(total_pence), 0) FROM invoices WHERE user_id = p_user_id AND status = 'paid'),
        'pending_invoices', (SELECT COUNT(*) FROM invoices WHERE user_id = p_user_id AND status = 'sent'),
        'last_booking', (SELECT created_at FROM advertising_leads WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 1)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

SELECT 'Enterprise Auth System Complete! ✅' AS status;
