# SUPABASE SETUP GUIDE - COMPLETE

## 🎉 Your Supabase Project

**URL:** `https://dtgftjcholwniewbooyc.supabase.co`  
**Edge Function:** `book_campaign` ✅ Already deployed!

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Run Database Migrations

Go to your Supabase Dashboard → SQL Editor and run these files **in order**:

1. **001_create_discounts_and_audit.sql**
2. **002_create_booking_attempts_and_receipts.sql**  
3. **003_create_admin_rpcs.sql**
4. **004_rls_and_indexes.sql**

All files are in: `supabase/migrations/`

**OR** run them all at once:
```sql
-- Copy/paste the contents of each file in order
```

### Step 2: Get Your API Key

1. Dashboard → Settings → API
2. Copy **anon public** key
3. Update `advertise.html` line 534:

```javascript
const SUPABASE_KEY = 'eyJhb...';  // Paste your key here
```

### Step 3: Test It!

```bash
cd /home/rockscot/claude_production/rock-scot-website
python3 -m http.server 8080
```

Visit advertise page and submit a test quote!

---

## 📊 Database Schema

### Tables Created:

| Table | Purpose |
|-------|---------|
| `discounts` | Discount codes (£50 off, 10% off, etc) |
| `discount_approvals` | Audit trail of approvals |
| `booking_attempts_logs` | Every booking attempt logged |
| `receipts` | Payment receipts |
| `advertising_leads` | Simple lead capture (current form) |

### Admin Functions:

| Function | Purpose |
|----------|---------|
| `create_discount()` | Create new discount code |
| `approve_discount()` | Approve pending discount |
| `list_pending_discounts()` | Show unapproved discounts |

---

## 🎯 Current Setup

**SIMPLE MODE** (Active Now):
- Form saves to `advertising_leads` table
- No auth required
- Works immediately!
- Perfect for testing

**ADVANCED MODE** (Ready When You Are):
- Edge Function `/book` endpoint
- User authentication
- Invoice generation
- Discount validation
- Payment tracking

---

## 🔑 Getting Tokens for Testing

### Get User Token:
```javascript
// In browser console on your site:
const { data } = await supabase.auth.getSession();
console.log(data.session.access_token);
```

### Get Service Role Key:
Dashboard → Settings → API → service_role (⚠️ Keep secret!)

---

## 📋 See Full Testing Guide

Check `TESTING.md` for:
- Complete curl command examples
- Discount code creation
- Payment marking
- Troubleshooting

---

## 💾 Database Schema
