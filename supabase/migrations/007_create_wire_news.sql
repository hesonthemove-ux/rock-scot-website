-- Migration: 007_create_wire_news
-- Description: THE WIRE - Real-time Scottish rock news ticker
-- Date: 2026-02-08

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. NEWS TABLE
CREATE TABLE IF NOT EXISTS wire_news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT NOT NULL,
    summary TEXT,
    source_url TEXT UNIQUE,
    genre TEXT CHECK (genre IN ('Rock', 'Metal', 'Punk', 'Indie', 'Alternative')),
    dialect_applied BOOLEAN DEFAULT FALSE,
    is_live BOOLEAN DEFAULT TRUE
);

-- 2. AUTOMATED CLEANUP (PURGE OLD NEWS)
-- Policy: Keep only news from the last 7 days
CREATE OR REPLACE FUNCTION purge_old_wire_news()
RETURNS trigger AS $$
BEGIN
    DELETE FROM wire_news
    WHERE created_at < NOW() - INTERVAL '7 days';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_wire_cleanup
AFTER INSERT ON wire_news
EXECUTE FUNCTION purge_old_wire_news();

-- 3. ENABLE REALTIME FOR LIVE UPDATES
-- This allows the frontend to subscribe to INSERT events
ALTER PUBLICATION supabase_realtime ADD TABLE wire_news;

-- 4. RLS POLICIES
ALTER TABLE wire_news ENABLE ROW LEVEL SECURITY;

-- Allow public to read news
CREATE POLICY "allow_public_read_wire" ON wire_news
    FOR SELECT
    USING (is_live = true);

-- Only authenticated users can insert (for backend RSS scripts)
CREATE POLICY "allow_authenticated_insert_wire" ON wire_news
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wire_news_created ON wire_news(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wire_news_genre ON wire_news(genre);
CREATE INDEX IF NOT EXISTS idx_wire_news_source ON wire_news(source_url);

-- Comments
COMMENT ON TABLE wire_news IS 'THE WIRE: Real-time Scottish rock music news feed';
COMMENT ON COLUMN wire_news.title IS 'Headline (shown on ticker)';
COMMENT ON COLUMN wire_news.dialect_applied IS 'Has set_dialect.sh been applied?';
COMMENT ON COLUMN wire_news.is_live IS 'Show on public ticker?';
