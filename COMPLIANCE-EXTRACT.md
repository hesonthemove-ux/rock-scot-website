## COMPLIANCE-EXTRACT.md
(no compliance matches)

## WIRE-GUIDE.md
25:## 📊 **Database Schema:**
27:### **Migration:** `007_create_wire_news.sql`
29:```sql
45:- ✅ RLS policies (public can read, authenticated can insert)
63:const { data } = await supabase
107:### **1. Run SQL Migration:**
109:# In Supabase SQL Editor:
110:# Run: supabase/migrations/007_create_wire_news.sql
114:```sql
122:const SUPABASE_ANON_KEY = 'YOUR_ACTUAL_KEY';
126:```sql
167:## 🔐 **Security:**
169:### **RLS Policies:**
170:```sql
172:CREATE POLICY "allow_public_read_wire" ON wire_news
176:CREATE POLICY "allow_authenticated_insert_wire" ON wire_news
180:**Service Role Key:** Only give to trusted backend scripts  
181:**Anon Key:** Safe for frontend (read-only)
188:```sql
201:```sql
211:## 📊 **Analytics:**
214:```sql
247:1. Check Supabase anon key is correct
253:1. Check `is_live = true` in database
254:2. Verify RLS policies allow SELECT

## EDGE-FUNCTION-GUIDE.md
16:✅ **IP address logging** (security)  
96:const { data, error } = await supabase
98:    .insert([formData]);
103:const { data, error } = await fetch(
109:            'apikey': SUPABASE_ANON_KEY
111:        body: JSON.stringify(formData)
115:if (data.success) {
116:    alert('✅ ' + data.message);
118:    alert('❌ ' + (data.error || 'Submission failed'));
134:  --data '{"first_name":"Test","last_name":"User","email":"test@example.com",...}'
155:**Without Resend:** Function still works, just won't send emails (bookings still save to database).
172:6. Saves to database

## SQL-VALIDATION-REPORT.md
1:# ✅ SUPABASE SQL VALIDATION REPORT
16:  - `page_views` (analytics)
17:  - `sessions` (analytics)
19:- **RLS Policies:** 16 defined
40:### ✅ Security Validation
41:- ✅ RLS enabled on ALL 6 tables
42:- ✅ Policies protect public access (anon users limited)
43:- ✅ Service role checks present (authenticated users privileged)
45:- ✅ Functions use SECURITY DEFINER (safe privilege escalation)
46:- ✅ No SQL injection vulnerabilities
55:- ✅ CHECK constraints validate data types
59:- ✅ No typos in SQL keywords
67:## ERROR YOU SAW: "policy already exists"
71:- ✅ RLS is already enabled
73:- ✅ Your database is working correctly
82:**Use file:** `supabase-reset-and-setup.sql`
85:1. DROP all existing tables (deletes data!)
91:- You don't have real customer data
96:**Use file:** Skip SQL entirely!
98:Your database is already set up correctly. Just:
104:- You have data you want to keep
112:| File | Purpose | Deletes Data? | When to Use |
114:| `supabase-complete-setup.sql` | Initial setup | No | First time only |
115:| `supabase-reset-and-setup.sql` | Wipe + rebuild | **YES** | Fresh start needed |
122:Both SQL files have been validated with:
124:- Security audit ✅
127:- RLS policy validation ✅
138:2. **If running SQL:**
140:   - Paste into Supabase SQL Editor
146:   - Skip SQL
149:     - `SUPABASE_ANON_KEY` in index.html
158:=== FINAL COMPREHENSIVE SQL CHECK ===
162:   RLS Policies: 16 defined
166:✅ SECURITY VALIDATION:
167:   RLS enabled on all tables
169:   Service role checks present
171:   Functions use SECURITY DEFINER
177:   No warnings - SQL looks production-ready!
179:FINAL VERDICT: SQL file is VALID and SECURE ✅
184:**Your SQL is perfect. The error just means it already ran successfully!** 🎸✅

## README.md
55:### **Analytics:**
56:- Traffic tracking active (js/analytics.js)
58:- All data goes to Supabase
68:## 📦 **Booking SQL & Supabase**
70:The booking system uses **ROCKSCOT-MASTER-SETUP.sql** as the single source of truth for the database.
73:   In Supabase Dashboard → SQL Editor, run **ROCKSCOT-MASTER-SETUP.sql** (creates `advertising_leads`, `campaigns`, `discounts`, `invoices`, RLS, `check_capacity`, `validate_discount`, etc.).
76:   Edit **js/supabase-config.js** and set your project URL and **anon public** key:
77:   - Supabase Dashboard → Settings → API → copy **anon public**.
78:   - Replace `YOUR_ANON_KEY` in `js/supabase-config.js` with that key.
84:   For admin dashboard, set your **service_role** key only in a server-side or secure environment—never in client-side config.
94:├── js/supabase-config.js   ← Set SUPABASE_ANON_KEY here
102:├── supabase/migrations/    ← 6 SQL files
103:├── js/analytics.js         ← Traffic tracking
109:├── SUPABASE-SETUP.md      ← Database setup
145:- Analytics tracking everything
170:Footer line 485-487 - Replace # with real URLs:
286:## 📊 Analytics
288:To add Google Analytics:
289:1. Get your GA tracking ID
291:3. Uncomment the tracking code in `js/main.js`

## TESTING.md
5:This guide provides curl commands to test the Edge Function and database.
11:2. **Anon Key:** Settings → API → anon public key
49:# Step 1: Create discount (use service_role key)
51:  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
52:  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
63:  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
64:  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
122:  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
123:  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
181:  -H "apikey: YOUR_ANON_KEY" \
222:- Use service_role key or admin token
225:- Discount code doesn't exist in database
255:1. **Never expose service_role key** in frontend code
263:## 🔐 Security Checklist
265:- [ ] Service role key stored securely (not in git/frontend)
266:- [ ] Admin RPCs only callable by service_role
267:- [ ] RLS policies enabled on sensitive tables

## WIRE-SETUP.md
1:# THE WIRE — RSS and 30-day retention
5:If you already ran **ROCKSCOT-MASTER-SETUP.sql** before this change, run in Supabase **SQL Editor**:
7:```sql
8:-- Run contents of: supabase/migrations/009_wire_retention_30_days.sql
10:RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
19:New runs of the full master SQL already use 30 days.
37:  every 30 minutes, with header **Authorization: Bearer YOUR_ANON_KEY** (or use the Invoke URL from the Dashboard).

## SUPABASE-COPY-PASTE.md
18:const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';               // ← CHANGE THIS
20:const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
32:    // Get form data
33:    const formData = {
58:        const { data, error } = await supabase
60:            .insert([formData])
88:        const { data, error } = await supabase
93:        if (data && data[0]?.is_valid) {
94:            const discount = data[0];
131:const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';               // ← CHANGE THIS
133:const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
140:        const { data, error } = await supabase
151:        if (data && data.length > 0) {
152:            const headlines = data.map(item => item.title.toUpperCase()).join(' ::: ');
158:        console.log('📰 Wire news loaded:', data.length, 'stories');
203:## 📊 **3. ANALYTICS (OPTIONAL - if cookie consent given)**
211:// ANALYTICS TRACKING
214:const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';               // ← CHANGE THIS
216:const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
219:// ONLY TRACK IF CONSENT GIVEN
221:if (window.analyticsAllowed) {  // Set by cookie-consent.js
253:            console.error('Analytics error:', error);
275:const SUPABASE_SERVICE_KEY = 'YOUR_SERVICE_ROLE_KEY_HERE';       // ← CHANGE THIS (KEEP SECRET!)
300:        const { data, error } = await supabase
325:        const { data, error } = await supabase
333:        if (data && data.length > 0) {
334:            data.forEach(discount => {
388:Run this in Supabase SQL Editor to add test news:
390:```sql
406:## ✅ **SECURITY CHECKLIST**
408:- ✅ RLS enabled on all tables
412:- ✅ Analytics only tracks if consent given
413:- ✅ Service role key only used in admin panel
414:- ✅ Anon key safe for frontend (read-only on protected data)
420:### **Anon Key vs Service Role Key:**
422:**Anon Key** (Safe for frontend):
424:- Can: Read approved data, insert leads, read live news
425:- Cannot: Read private data, update/delete anything
427:**Service Role Key** (DANGEROUS - Admin only):
436:That's it! All copy/paste ready with proper RLS security! 🔐

## SUPABASE-VISUAL-GUIDE.md
14:   Database Password: [SAVE THIS PASSWORD!]
33:│ anon public:                            │
37:│ service_role:                           │
47:## 💾 **STEP 3: Run Database Setup (1 minute)**
50:1. In Supabase Dashboard → SQL Editor (left sidebar)
52:3. Copy ENTIRE file: supabase-complete-setup.sql
53:4. Paste into SQL Editor
56:7. You should see: ✅ "ROCK.SCOT Database Setup Complete!"
65:✅ page_views table (analytics)
66:✅ sessions table (analytics)
68:✅ RLS policies on EVERYTHING
74:## 🔐 **STEP 4: Verify RLS is Enabled**
80:   advertising_leads    [🔒 RLS enabled]
81:   discounts           [🔒 RLS enabled]
82:   wire_news           [🔒 RLS enabled]
83:   page_views          [🔒 RLS enabled]
84:   sessions            [🔒 RLS enabled]
86:3. If any say "RLS not enabled", click the table:
87:   → Click "RLS" toggle at top
100:const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
106:const SUPABASE_ANON_KEY = 'eyJhbGci...';           // Your anon public key
114:const SUPABASE_ANON_KEY = 'eyJhbGci...';
119:⚠️ **USE SERVICE ROLE KEY HERE:**
122:const SUPABASE_SERVICE_KEY = 'eyJhbGci...';  // service_role key (SECRET!)
131:```sql
132:-- In Supabase SQL Editor, run:
154:```sql
155:-- In Supabase SQL Editor, create a test discount:
180:## 📊 **STEP 7: View Your Data**
190:page_views          → See analytics (if enabled)
193:### **Security Check:**
197:// This should FAIL (RLS blocks it):
198:const { data } = await supabase
201:// Returns: null (RLS blocked read access)
204:const { data } = await supabase
215:### **Anon Public Key (Frontend - SAFE):**
220:✅ Can: Insert page views (analytics)
221:❌ Cannot: Read other people's data
226:### **Service Role Key (Admin - DANGEROUS):**
229:✅ Can: Bypass ALL RLS policies
230:✅ Can: Read all data
239:## 🔒 **SECURITY BEST PRACTICES:**
242:- Use anon key in public website files
243:- Use service role key ONLY in admin pages
244:- Keep service role key secret
245:- Enable RLS on all tables
246:- Test RLS policies work
250:- Put service role key in public files
251:- Commit service role key to git
252:- Disable RLS policies
253:- Share service role key publicly
260:### **"RLS policy violation" errors:**
262:Problem: Trying to read data without permission
264:1. Check RLS is enabled on table
265:2. Check policy allows your action
266:3. Use service role key if admin action
271:Problem: Missing required fields or RLS block
275:3. Verify RLS policy allows INSERT for anon
280:Problem: Can't fetch news or no news in database
283:2. Check SUPABASE_ANON_KEY is correct
292:1. Check discount exists in database
304:- [ ] SQL setup script run successfully
305:- [ ] RLS enabled on all tables
310:- [ ] Data visible in Supabase Table Editor
316:Your database is:
317:- ✅ Secure (RLS enabled)

## DEPLOY.md
36:- Ensure `js/supabase-config.js` has your real Supabase anon key (same project where you ran the SQL).
37:- In Supabase, run the **30-day retention** change: SQL Editor → run `supabase/migrations/009_wire_retention_30_days.sql`.

## SUPABASE-UPGRADE-ROADMAP.md
10:Browser → Direct Database Insert → Done
15:- ✅ RLS protects the data
16:- ✅ Analytics tracks page views
40:4. Insert to database
71:- See analytics dashboard
98:- 🔒 PCI compliant (Stripe handles security)
100:- 📊 Revenue tracking
116:- 🔐 RLS-protected uploads
122:### **Upgrade Level 5: Database Functions** (Advanced)
126:```sql
132:```sql
138:```sql
152:- Discount used → Analytics event
180:7. ✅ **Analytics dashboard** (customer-facing)
200:**Value:** HUGE (professionalism + security)
240:    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
243:  const formData = await req.json()
247:  if (formData.discount_code) {
248:    const { data } = await supabase
249:      .rpc('validate_discount', { p_code: formData.discount_code })
251:    if (data && data[0]?.is_valid) {
252:      discount = data[0]
261:  let finalPrice = formData.product_net_pence
271:  const { data: booking, error } = await supabase
274:      ...formData,
296:      to: formData.email,
302:          <li>Package: ${formData.product_name}</li>
304:          <li>Start: ${formData.start_date}</li>
333:const { data, error } = await supabase.auth.signUp({
339:const { data, error } = await supabase.auth.signInWithPassword({
345:const { data, error } = await supabase.auth.signInWithOtp({
355:```sql
356:-- RLS policy for customer uploads
357:CREATE POLICY "Customers can upload their own files"
363:CREATE POLICY "Admins can view all files"

## GITHUB-PUSH.md
(no compliance matches)

## PERSISTENT-PLAYER.md
75:- `js/analytics.js` - Tracking
96:- Links with `data-no-ajax` attribute
108:### **Method 2: Use Data Attribute**
110:<button data-action="listen">🎵 Play Now</button>
150:<a href="advertise.html" data-no-ajax>
162:3. Check "Listen Live" button has correct class/data-action
166:2. Add `data-no-ajax` to those links as fallback
171:2. If it does, might be iframe security issue
181:- URLs update properly
191:- [ ] Now playing metadata from API
199:## 📊 **Analytics:**
205:- All via existing analytics.js

## ENTERPRISE-DEPLOYMENT.md
35:- Payment tracking
42:- Status tracking (pending/active/completed)
43:- Play count tracking
62:- Analytics dashboard
76:- RLS protected buckets
84:### ✅ **Security**
85:- Row Level Security on ALL tables
94:## 🗄️ DATABASE SCHEMA
106:10. `page_views` - Analytics
107:11. `sessions` - Session tracking
121:### **PHASE 1: Database Setup (5 minutes)**
123:1. **Run SQL migrations in Supabase:**
126:# In Supabase SQL Editor, run in order:
127:1. supabase-complete-setup.sql (base tables)
128:2. 008_enterprise_auth_system.sql (auth + invoicing)
139:```sql
140:-- In Supabase SQL Editor
146:-- RLS policies for uploads
147:CREATE POLICY "Authenticated users can upload documents"
152:CREATE POLICY "Public can view documents"
231:const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY'
371:- Review analytics
381:## 📈 ANALYTICS & REPORTING
387:4. Payment transactions - revenue tracking
390:```sql
421:```sql
422:-- Make sure RLS is enabled and policies exist
423:SELECT tablename, rowsecurity 
453:3. **Advanced analytics** (Metabase/Grafana)
468:4. Review SQL migration output

## COMPLIANCE-MUST-KEEP.md
2:- Keep privacy.html and terms.html clearly linked.
3:- Keep cookie consent script active.
4:- Keep only publishable/anon keys in frontend JS.
5:- Do not expose service_role keys in frontend.
6:- Preserve backend SQL/RLS behavior.

## SUPABASE-SETUP.md
12:### Step 1: Run Database Migrations
14:Go to your Supabase Dashboard → SQL Editor and run these files **in order**:
16:1. **001_create_discounts_and_audit.sql**
17:2. **002_create_booking_attempts_and_receipts.sql**  
18:3. **003_create_admin_rpcs.sql**
19:4. **004_rls_and_indexes.sql**
24:```sql
31:2. Copy **anon public** key
49:## 📊 Database Schema
84:- Payment tracking
93:const { data } = await supabase.auth.getSession();
94:console.log(data.session.access_token);
97:### Get Service Role Key:
98:Dashboard → Settings → API → service_role (⚠️ Keep secret!)
112:## 💾 Database Schema

## supabase/functions/fetch_wire_rss/README-PI-DEPLOY.md
43:      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',

## SEO-DOMINATION-STRATEGY.md
146:    <!-- CANONICAL & LANGUAGE                           -->
149:    <link rel="canonical" href="https://rock.scot/">
155:    <!-- SCHEMA.ORG STRUCTURED DATA (Rich Snippets)     -->
183:            "legalName": "Caledonia TX Ltd",
356:<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
370:    <loc>https://rock.scot/privacy.html</loc>
376:    <loc>https://rock.scot/terms.html</loc>
382:    <loc>https://rock.scot/cookies.html</loc>
387:</urlset>
457:   - Data-driven, testimonial, conversion-focused
526:✅ Structured data (you have this!)
579:- [ ] Set up Google Analytics goals
587:- [ ] Review analytics
593:## 📊 **11. TRACKING & MEASUREMENT**
597:2. **Google Analytics** - Traffic sources, user behavior
599:4. **SEMrush** (optional, paid) - Competitor tracking
649:- Ranking for brand terms
656:- Beating Quality Radio on 5-10 terms

## ADMIN-FEATURES.md
22:- **Total Customers** - Customer database size
26:### **Analytics Page** 📈
138:## 📈 **Analytics Tracking (NEW!)**
142:**Automatic Tracking:**
146:4. User leaves site → Final session data saved
148:**Data Captured:**
157:- `js/analytics.js` tracks everything automatically
167:```sql
168:-- In Supabase SQL Editor, run these in order:
169:005_create_analytics_and_admin_tables.sql
170:006_create_analytics_rpcs.sql
177:const SUPABASE_SERVICE_ROLE = 'YOUR_SERVICE_ROLE_KEY'; // GET FROM SUPABASE
181:### **3. Update analytics.js:**
185:const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY'; // PUBLIC KEY OK
192:<script src="js/analytics.js"></script>
202:## 📊 **What You'll See in Analytics:**
204:### **Example Session Data:**
262:### **Analytics CSV (Coming):**
277:2. Export customer data
285:4. Customer retention analysis
292:2. Add service_role key to admin-dashboard.html
293:3. Add analytics.js to all pages
294:4. Test page view tracking
296:6. Start making data-driven decisions!
300:## ⚠️ **Security Notes:**
302:- **service_role key** = Full database access - NEVER commit to git!
310:**You now have a complete business management system with real-time analytics!** 🎸📊

## COMPLIANCE.md
1:# LEGAL COMPLIANCE SUMMARY
13:### ✅ **UK GDPR (Data Protection Act 2018)**
18:- ✅ **Privacy Policy** (`privacy.html`) - Comprehensive data protection notice
19:- ✅ **Data Controller Details** - Company info, contact details
20:- ✅ **Legal Basis** - Contractual, legitimate interest, consent, legal obligation
21:- ✅ **Data Retention** - 7 years (accounting), 26 months (analytics), 90 days (logs)
23:- ✅ **Security Measures** - HTTPS, encryption, access controls
24:- ✅ **Data Breach Procedures** - 72-hour ICO notification process
32:- Right to Data Portability
36:**Contact:** privacy@rock.scot
40:### ✅ **PECR (Privacy and Electronic Communications Regulations)**
45:- ✅ **Cookie Consent Banner** (`js/cookie-consent.js`)
46:- ✅ **Cookie Policy** (`cookies.html`)
47:- ✅ **Explicit Consent** - Before non-essential cookies set
50:- ✅ **26-Month Maximum** - Analytics cookies expire after 26 months
51:- ✅ **Consent Withdrawal** - Users can change preferences anytime
53:**Cookie Categories:**
54:1. **Strictly Necessary** (no consent needed):
57:   - Cookie preferences
59:2. **Analytics** (requires consent):
62:   - Visitor tracking (anonymized)
64:**Cookie Banner Features:**
67:- Links to Privacy & Cookie Policies
80:- ✅ **Logging Requirements** - 90-day retention of broadcast logs
105:- ✅ **Terms of Service** - Advertising standards section
110:- ✅ **Make-Good Policy** - Compensation for missed spots
113:- Must be legal, decent, honest, truthful
127:### ✅ **Terms of Service**
132:- ✅ **terms.html** - Comprehensive Terms of Service
133:- ✅ **User Agreement** - Clear terms for listeners and advertisers
143:- Advertising terms and conditions
155:| **Privacy/Data** | privacy@rock.scot | ICO |
162:## 🔒 **DATA PROTECTION SPECIFICS**
166:**Website Visitors (with consent):**
183:### **Data Retention:**
185:| Data Type | Retention Period | Legal Basis |
188:| Analytics | 26 months | PECR maximum |
190:| Marketing | Until withdrawn or 2 years | Consent |
197:| **Supabase** | Database hosting | EU/US | ✅ Yes |
201:All processors have Data Processing Agreements (DPAs) and comply with UK GDPR.
205:## 🛡️ **SECURITY MEASURES**
208:- ✅ Database encryption at rest
210:- ✅ Regular security audits
211:- ✅ Staff training on data protection
217:## 📝 **LEGAL DOCUMENTS LOCATION**
221:| **Privacy Policy** | `/privacy.html` | 8 Feb 2026 |
222:| **Terms of Service** | `/terms.html` | 8 Feb 2026 |
223:| **Cookie Policy** | `/cookies.html` | 8 Feb 2026 |
225:**Footer Links:** All pages have legal links in footer
234:- **Remit:** UK GDPR, Data Protection, PECR
251:- ✅ Privacy Policy (every 12 months)
252:- ✅ Terms of Service (every 12 months)
253:- ✅ Cookie Policy (every 12 months)
254:- ✅ Security audit
258:- Data breach detection
262:- Cookie consent rates
269:- Cookie consent rate (accept vs reject)
270:- Data subject requests (SARs)
272:- Security incidents
279:### **Data Breach:**
285:6. Review and improve security
305:**Legal Review:** Required before go-live  
315:**Legal/Compliance Questions:**  
316:Email: privacy@rock.scot

