# THE WIRE — RSS and 30-day retention

## 1. Keep news for 30 days

If you already ran **ROCKSCOT-MASTER-SETUP.sql** before this change, run in Supabase **SQL Editor**:

```sql
-- Run contents of: supabase/migrations/009_wire_retention_30_days.sql
CREATE OR REPLACE FUNCTION purge_old_wire_news()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    DELETE FROM wire_news
    WHERE created_at < NOW() - INTERVAL '30 days';
    RETURN NULL;
END;
$$;
```

New runs of the full master SQL already use 30 days.

## 2. Populate THE WIRE from RSS

The **fetch_wire_rss** Edge Function fetches rock/music RSS feeds and upserts into `wire_news` (searchable, kept 30 days).

**Deploy the function** (Supabase CLI, from project root):

```bash
cd ~/Rock\ Scot/rock-scot-website
supabase functions deploy fetch_wire_rss
```

**Call it on a schedule** so the ticker gets new stories:

- **Option A:** Supabase Dashboard → Edge Functions → **fetch_wire_rss** → **Invoke** (manual test). For automation, use Option B.
- **Option B:** [cron-job.org](https://cron-job.org) (or similar): create a cron that **POST**s to  
  `https://YOUR_PROJECT_REF.supabase.co/functions/v1/fetch_wire_rss`  
  every 30 minutes, with header **Authorization: Bearer YOUR_ANON_KEY** (or use the Invoke URL from the Dashboard).

After the first run, the homepage ticker should show headlines from the feeds; new inserts appear in real time if Realtime is enabled for `wire_news`.
