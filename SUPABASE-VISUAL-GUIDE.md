# 🚀 ROCK.SCOT SUPABASE SETUP - VISUAL GUIDE

## **Complete Fresh Start - Step by Step**

---

## 📋 **STEP 1: Create Supabase Project (2 minutes)**

```
1. Go to: https://supabase.com/dashboard
2. Click: "New Project"
3. Fill in:
   Name: rock-scot
   Database Password: [SAVE THIS PASSWORD!]
   Region: Europe West (London)
4. Click: "Create new project"
5. Wait ~2 minutes for it to provision...
```

---

## 🔑 **STEP 2: Get Your Keys (30 seconds)**

```
1. In Supabase Dashboard → Settings (left sidebar)
2. Click: API (under settings)
3. Copy these two keys:

┌─────────────────────────────────────────┐
│ Project URL:                            │
│ https://xxxxx.supabase.co               │
│                                         │
│ anon public:                            │
│ eyJhbGciOiJIUzI1NiIsInR5...            │
│ (This is SAFE for frontend)            │
│                                         │
│ service_role:                           │
│ eyJhbGciOiJIUzI1NiIsInR5...            │
│ (This is SECRET - admin only!)         │
└─────────────────────────────────────────┘

4. Save these somewhere safe (Notes app, password manager)
```

---

## 💾 **STEP 3: Run Database Setup (1 minute)**

```
1. In Supabase Dashboard → SQL Editor (left sidebar)
2. Click: "+ New query"
3. Copy ENTIRE file: supabase-complete-setup.sql
4. Paste into SQL Editor
5. Click: RUN (bottom right)
6. Wait ~10 seconds
7. You should see: ✅ "ROCK.SCOT Database Setup Complete!"
```

**What this creates:**
```
✅ advertising_leads table (form submissions)
✅ discounts table (discount codes)
✅ discount_approvals table (audit log)
✅ wire_news table (news ticker)
✅ page_views table (analytics)
✅ sessions table (analytics)
✅ Helper functions (create/approve discounts)
✅ RLS policies on EVERYTHING
✅ Realtime enabled for THE WIRE
```

---

## 🔐 **STEP 4: Verify RLS is Enabled**

```
1. In Supabase Dashboard → Table Editor (left sidebar)
2. For each table, you should see:
   
   advertising_leads    [🔒 RLS enabled]
   discounts           [🔒 RLS enabled]
   wire_news           [🔒 RLS enabled]
   page_views          [🔒 RLS enabled]
   sessions            [🔒 RLS enabled]

3. If any say "RLS not enabled", click the table:
   → Click "RLS" toggle at top
   → Confirm
```

---

## 🌐 **STEP 5: Update Your Website Files**

### **A) Update index.html (THE WIRE ticker)**

Find this section (around line 800):
```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
```

Replace with YOUR values:
```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co';  // Your Project URL
const SUPABASE_ANON_KEY = 'eyJhbGci...';           // Your anon public key
```

### **B) Update advertise.html (booking form)**

Same thing - find and replace:
```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGci...';
```

### **C) Update admin.html (discount manager)**

⚠️ **USE SERVICE ROLE KEY HERE:**
```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGci...';  // service_role key (SECRET!)
```

---

## 🧪 **STEP 6: Test Everything**

### **Test 1: THE WIRE News Ticker**

```sql
-- In Supabase SQL Editor, run:
INSERT INTO wire_news (title, genre, source_url, is_live) 
VALUES ('TEST: SCOTTISH ROCK NEWS IS LIVE!', 'Rock', 'test-001', true);
```

Then:
1. Open your website (index.html)
2. Look at the orange ticker bar at top
3. You should see: "TEST: SCOTTISH ROCK NEWS IS LIVE!"
4. If not, check browser console for errors

### **Test 2: Advertising Form**

1. Go to advertise.html
2. Fill in the form
3. Click "Submit Enquiry"
4. You should see: "✅ Thank you! Your enquiry has been submitted"
5. Check Supabase → Table Editor → advertising_leads
6. Your submission should be there!

### **Test 3: Discount Code**

```sql
-- In Supabase SQL Editor, create a test discount:
SELECT create_discount_code(
    'TEST50',      -- code
    5000,          -- £50 off (5000 pence)
    NULL,          -- no percentage
    NULL,          -- created_by
    'Test code'    -- note
);

-- Approve it:
SELECT approve_discount(
    (SELECT id FROM discounts WHERE code = 'TEST50'),
    'admin-user',
    'Approved for testing'
);
```

Then:
1. Go to advertise.html
2. In discount code field, type: TEST50
3. Tab out of the field
4. You should see: "✅ Valid discount: £50.00 off"

---

## 📊 **STEP 7: View Your Data**

### **In Supabase Dashboard:**

```
Table Editor → Select table:

advertising_leads    → See all form submissions
discounts           → See all discount codes
wire_news           → See all news stories
page_views          → See analytics (if enabled)
```

### **Security Check:**

Try this in browser console:
```javascript
// This should FAIL (RLS blocks it):
const { data } = await supabase
    .from('advertising_leads')
    .select('*');
// Returns: null (RLS blocked read access)

// This should WORK (anyone can read live news):
const { data } = await supabase
    .from('wire_news')
    .select('*')
    .eq('is_live', true);
// Returns: array of news stories
```

---

## 🎯 **WHAT EACH KEY DOES:**

### **Anon Public Key (Frontend - SAFE):**
```
✅ Can: Insert advertising leads
✅ Can: Read approved discounts
✅ Can: Read live wire news
✅ Can: Insert page views (analytics)
❌ Cannot: Read other people's data
❌ Cannot: Update or delete anything
❌ Cannot: See unapproved discounts
```

### **Service Role Key (Admin - DANGEROUS):**
```
✅ Can: Do absolutely EVERYTHING
✅ Can: Bypass ALL RLS policies
✅ Can: Read all data
✅ Can: Update/delete anything
⚠️ NEVER expose in frontend
⚠️ NEVER commit to git
⚠️ Only use in secure admin pages
```

---

## 🔒 **SECURITY BEST PRACTICES:**

### ✅ **DO:**
- Use anon key in public website files
- Use service role key ONLY in admin pages
- Keep service role key secret
- Enable RLS on all tables
- Test RLS policies work
- Use HTTPS in production

### ❌ **DON'T:**
- Put service role key in public files
- Commit service role key to git
- Disable RLS policies
- Share service role key publicly
- Use same key for public and admin

---

## 🐛 **TROUBLESHOOTING:**

### **"RLS policy violation" errors:**
```
Problem: Trying to read data without permission
Solution: 
1. Check RLS is enabled on table
2. Check policy allows your action
3. Use service role key if admin action
```

### **"Insert failed" on advertising form:**
```
Problem: Missing required fields or RLS block
Solution:
1. Check all required fields filled
2. Check console for exact error
3. Verify RLS policy allows INSERT for anon
```

### **Wire ticker shows "CONNECTING...":**
```
Problem: Can't fetch news or no news in database
Solution:
1. Check SUPABASE_URL is correct
2. Check SUPABASE_ANON_KEY is correct
3. Insert test news (see Test 1 above)
4. Check browser console for errors
```

### **Discount validation fails:**
```
Problem: Code not approved or doesn't exist
Solution:
1. Check discount exists in database
2. Check approved_at is NOT NULL
3. Check is_active = true
4. Code is case-insensitive (stored uppercase)
```

---

## ✅ **SUCCESS CHECKLIST:**

- [ ] Supabase project created
- [ ] Keys copied and saved
- [ ] SQL setup script run successfully
- [ ] RLS enabled on all tables
- [ ] Website files updated with correct keys
- [ ] Wire ticker showing test news
- [ ] Advertising form submission working
- [ ] Discount code validation working
- [ ] Data visible in Supabase Table Editor

---

## 🎉 **YOU'RE DONE!**

Your database is:
- ✅ Secure (RLS enabled)
- ✅ Connected (keys configured)
- ✅ Working (tests passed)
- ✅ Real-time enabled (for THE WIRE)
- ✅ Ready for production!

**Next steps:**
1. Deploy your website
2. Start adding real discount codes
3. Set up RSS feed for THE WIRE
4. Monitor submissions in Supabase

🎸 **ROCK ON!** 🔥
