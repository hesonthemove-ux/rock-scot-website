-- Wire news: keep stories for 30 days (was 7)
-- Run this in Supabase SQL Editor if you already ran ROCKSCOT-MASTER-SETUP.sql

CREATE OR REPLACE FUNCTION purge_old_wire_news()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    DELETE FROM wire_news
    WHERE created_at < NOW() - INTERVAL '30 days';
    RETURN NULL;
END;
$$;
