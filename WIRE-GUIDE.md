# THE WIRE - Real-time Scottish Rock News

## 🎸 **What Is THE WIRE?**

THE WIRE is a real-time news ticker that displays Scottish rock music news across the top of your website. It uses Supabase Realtime to instantly "pop" new stories the moment they're discovered.

---

## 🔥 **How It Works:**

### **The Flow:**
```
1. FETCH → Source from 8 RSS Feeds (National Scottish Rock focus)
2. FILTER → If "Central Scotland" in content, REWRITE to "National/Local"
3. DIALECT → Pass through 'set_dialect.sh' for Scottish tone
4. UPSERT → Push to wire_news table in Supabase
5. SYNC → Website listens via Realtime for instant updates
```

### **The Magic:**
**Negative Margin Positioning** + **Supabase Realtime** = News appears in <200ms instead of waiting 60 seconds!

---

## 📊 **Database Schema:**

### **Migration:** `007_create_wire_news.sql`

```sql
CREATE TABLE wire_news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT NOT NULL,
    summary TEXT,
    source_url TEXT UNIQUE,
    genre TEXT CHECK (genre IN ('Rock', 'Metal', 'Punk', 'Indie', 'Alternative')),
    dialect_applied BOOLEAN DEFAULT FALSE,
    is_live BOOLEAN DEFAULT TRUE
);
```

**Key Features:**
- ✅ Auto-purges news older than 7 days
- ✅ Realtime enabled for instant updates
- ✅ RLS policies (public can read, authenticated can insert)
- ✅ Upsert on `source_url` prevents duplicates

---

## 🎯 **Frontend Integration:**

### **Ticker HTML:**
```html
<div id="wire-ticker">
    <div class="wire-label">THE WIRE</div>
    <div id="ticker-content">CONNECTING...</div>
</div>
```

### **JavaScript (Already Included):**
```javascript
// Load initial news
const { data } = await supabase
    .from('wire_news')
    .select('title')
    .eq('is_live', true)
    .order('created_at', { ascending: false })
    .limit(20);

// Subscribe to new stories
supabase
    .channel('realtime_rock_wire')
    .on('postgres_changes', { 
        event: 'INSERT', 
        table: 'wire_news' 
    }, (payload) => {
        // Prepend new headline instantly
        const newHeadline = payload.new.title.toUpperCase();
        tickerEl.innerHTML = newHeadline + ' ::: ' + tickerEl.innerHTML;
    })
    .subscribe();
```

---

## 🚀 **Backend: Adding News (Python Example):**

```python
from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Upsert news (no duplicates by source_url)
supabase.table('wire_news').upsert({
    'title': 'New Album from Glasgow Legends',
    'source_url': 'https://example.com/story1',
    'genre': 'Rock',
    'dialect_applied': True,
    'is_live': True
}, on_conflict='source_url').execute()
```

---

## 🔧 **Setup Steps:**

### **1. Run SQL Migration:**
```bash
# In Supabase SQL Editor:
# Run: supabase/migrations/007_create_wire_news.sql
```

### **2. Enable Realtime:**
```sql
-- Already in migration, but verify:
ALTER PUBLICATION supabase_realtime ADD TABLE wire_news;
```

### **3. Update Frontend:**
```javascript
// index.html line ~800
const SUPABASE_ANON_KEY = 'YOUR_ACTUAL_KEY';
```

### **4. Test:**
```sql
-- Insert test news:
INSERT INTO wire_news (title, genre, source_url) 
VALUES ('Scottish Rock Legends Return!', 'Rock', 'test-001');
```

Watch it appear on the ticker **instantly**! 🔥

---

## 📈 **RSS Feed Sources (Suggested):**

1. **Louder Sound** (rock news)
2. **Metal Hammer** (metal)
3. **Kerrang!** (alt/punk)
4. **Classic Rock Magazine**
5. **The Scotsman Music** (Scottish focus)
6. **BBC Scotland Music**
7. **NME Scotland**
8. **DIY Magazine** (indie/alt)

---

## 🎨 **Visual Design:**

```
┌─────────────────────────────────────────────────┐
│ THE WIRE │ NEW ALBUM FROM GLASGOW... ::: TOUR │
└─────────────────────────────────────────────────┘
     ↑            ↑
   Fixed     Scrolling marquee
   Label     (60s animation)
```

**Colors:**
- Background: `#FF6600` (orange)
- Text: Black, bold, uppercase
- Label: Black background, orange text

---

## 🔐 **Security:**

### **RLS Policies:**
```sql
-- Public can READ
CREATE POLICY "allow_public_read_wire" ON wire_news
    FOR SELECT USING (is_live = true);

-- Only authenticated can INSERT
CREATE POLICY "allow_authenticated_insert_wire" ON wire_news
    FOR INSERT TO authenticated WITH CHECK (true);
```

**Service Role Key:** Only give to trusted backend scripts  
**Anon Key:** Safe for frontend (read-only)

---

## 🧪 **Testing:**

### **Manual Insert:**
```sql
INSERT INTO wire_news (title, genre, source_url, is_live) 
VALUES 
    ('Breaking: Scottish Band Wins Award', 'Rock', 'test-001', true),
    ('New Metal Festival Announced in Glasgow', 'Metal', 'test-002', true);
```

### **Check Frontend:**
- Open website
- Console should show: "📡 ROCK.SCOT is LIVE on THE WIRE"
- Ticker should display both headlines

### **Test Realtime:**
```sql
-- Insert another while watching site:
INSERT INTO wire_news (title, genre, source_url) 
VALUES ('LIVE TEST: Realtime Working!', 'Rock', 'test-003');
```

Should appear **instantly** without refresh!

---

## 📊 **Analytics:**

### **Track Wire Performance:**
```sql
-- Most viewed genres
SELECT genre, COUNT(*) as story_count
FROM wire_news
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY genre
ORDER BY story_count DESC;

-- Recent headlines
SELECT title, genre, created_at
FROM wire_news
WHERE is_live = true
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎯 **Future Enhancements:**

- [ ] Click headlines to read full story
- [ ] Filter by genre (Metal/Punk/etc)
- [ ] Pause/resume ticker
- [ ] Speed control
- [ ] Archive view (past 7 days)
- [ ] Admin moderation panel
- [ ] Email notifications for major stories

---

## 🐛 **Troubleshooting:**

### **Ticker Not Loading:**
1. Check Supabase anon key is correct
2. Verify migration ran successfully
3. Check browser console for errors
4. Ensure Realtime enabled on table

### **News Not Appearing:**
1. Check `is_live = true` in database
2. Verify RLS policies allow SELECT
3. Test with manual INSERT
4. Check created_at timestamp

### **Duplicate Stories:**
- Uses `source_url` as unique constraint
- Upsert on conflict prevents duplicates
- If seeing dupes, check source_url consistency

---

## 📚 **Documentation:**

- **Supabase Docs:** https://supabase.com/docs/guides/realtime
- **Marquee CSS:** Standard `@keyframes` animation
- **Scottish Dialect:** Custom `set_dialect.sh` script (not included)

---

**THE WIRE is live and ready to rock! 🎸📡**
