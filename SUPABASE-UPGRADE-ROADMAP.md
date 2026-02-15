# 🚀 ROCK.SCOT SUPABASE UPGRADE PLAN
## Making It The BEST It Can Be

---

## 🤔 WHAT YOU HAVE NOW (Good but Basic)

**Current Architecture:**
```
Browser → Direct Database Insert → Done
```

**What's Working:**
- ✅ Form submissions go straight to Supabase
- ✅ RLS protects the data
- ✅ Analytics tracks page views
- ✅ THE WIRE uses Realtime

**What's Missing:**
- ❌ No server-side validation
- ❌ No automated emails
- ❌ No Stripe payment integration
- ❌ No server-side discount validation
- ❌ No invoice generation
- ❌ Edge Functions referenced but not created

---

## 🔥 WHAT YOU COULD HAVE (Production-Grade)

### **Upgrade Level 1: Edge Functions** (30 mins setup)
Add server-side logic that runs at the edge (ultra-fast):

**`book_campaign` Edge Function:**
```typescript
// Runs server-side when form submitted
1. Validate discount code (can't be faked client-side)
2. Calculate final price
3. Check for duplicate submissions
4. Insert to database
5. Send confirmation email via Resend/SendGrid
6. Return booking confirmation
```

**Benefits:**
- 🔒 Server-side validation (unhackable)
- 📧 Automated emails
- ⚡ Runs at the edge (fast)
- 🛡️ No client-side tampering

---

### **Upgrade Level 2: Supabase Auth** (10 mins setup)
Add proper user authentication for customers:

**Customer Portal:**
```
- Login with email/password or magic link
- View their booking history
- Download invoices
- Update campaign details
- See campaign performance
```

**Admin Portal:**
```
- Login as admin
- View all bookings
- Approve/reject campaigns
- Manage discount codes
- See analytics dashboard
```

**Benefits:**
- 🔐 Secure authentication (no custom auth code)
- 📱 Magic links (passwordless login)
- 👥 Role-based access (customer vs admin)
- 🔑 OAuth ready (Google, Facebook login if wanted)

---

### **Upgrade Level 3: Stripe Integration** (1 hour setup)
Accept payments directly on the website:

**Payment Flow:**
```
1. User selects package
2. Stripe Checkout opens
3. Payment processed
4. Webhook triggers Edge Function
5. Booking auto-created
6. Invoice emailed
7. Customer notified
```

**Benefits:**
- 💳 Accept cards instantly
- 🔒 PCI compliant (Stripe handles security)
- 🌍 International payments
- 📊 Revenue tracking
- 💰 Automatic invoicing

---

### **Upgrade Level 4: Storage + CDN** (10 mins setup)
Use Supabase Storage for assets:

**What You Can Store:**
- Customer-uploaded creative (advert scripts, audio files)
- Generated invoices (PDFs)
- Campaign reports
- Media assets (images, audio)

**Benefits:**
- 🌐 Global CDN delivery
- 🔐 RLS-protected uploads
- 🗜️ Automatic image optimization
- 📦 Unlimited bandwidth

---

### **Upgrade Level 5: Database Functions** (Advanced)
We already have some, but we could add:

**Auto-Invoice Generation:**
```sql
CREATE FUNCTION generate_invoice(booking_id UUID)
RETURNS TEXT -- Returns PDF URL
```

**Campaign Performance:**
```sql
CREATE FUNCTION get_campaign_stats(booking_id UUID)
RETURNS JSON -- Play counts, reach, CPM
```

**Automated Reports:**
```sql
CREATE FUNCTION send_weekly_report()
-- Runs via pg_cron, emails stats
```

---

### **Upgrade Level 6: Webhooks** (15 mins setup)
Trigger external services when things happen:

**Examples:**
- New booking → Slack notification
- Payment received → Update accounting software
- Campaign ends → Send performance report
- Discount used → Analytics event

---

### **Upgrade Level 7: Vector Search** (Future-Proof)
Use pgvector for AI features:

**AI-Powered Features:**
- "Find similar advertisers" (vector similarity)
- Smart campaign recommendations
- Content categorization
- Search through past campaigns

---

## 💎 THE ULTIMATE STACK (My Recommendation)

### **Phase 1: Essential (Do Now - 2 hours)**
1. ✅ **Edge Function for booking** (validation + email)
2. ✅ **Supabase Auth** (customer portal)
3. ✅ **Storage bucket** (invoices + uploads)

### **Phase 2: Growth (When Revenue Starts - 1 day)**
4. ✅ **Stripe integration** (take payments)
5. ✅ **Automated emails** (confirmations, reminders)
6. ✅ **Invoice generation** (PDF creation)

### **Phase 3: Scale (When Big - 1 week)**
7. ✅ **Analytics dashboard** (customer-facing)
8. ✅ **API for integrations** (connect to broadcast system)
9. ✅ **Webhooks** (Slack, accounting, CRM)

---

## 🎯 WHAT I RECOMMEND FOR YOU RIGHT NOW

Based on where you are (launching, need reliability, want growth):

### **Priority 1: Edge Functions ⚡**
**Why:** Server-side validation + automated emails are critical for professional operation.

**What it gives you:**
- Can't fake discount codes
- Automated booking confirmations
- Server-side price calculation
- Email notifications (you + customer)

**Effort:** 30 mins setup
**Value:** HUGE (professionalism + security)

---

### **Priority 2: Supabase Auth 🔐**
**Why:** Customers want to see their booking history, admins need dashboard access.

**What it gives you:**
- Customer login portal
- Admin dashboard with auth
- No custom auth code needed
- Magic links (passwordless)

**Effort:** 10 mins setup
**Value:** BIG (customer experience + admin convenience)

---

### **Priority 3: Stripe Later 💳**
**Why:** You can invoice manually at first, add Stripe when volume increases.

**When to add:** After first 10-20 bookings
**Effort:** 1 hour setup
**Value:** Automates everything once volume is there

---

## 🛠️ WHAT NEEDS TO BE BUILT

### **1. Edge Function: `book_campaign`**

**File:** `supabase/functions/book_campaign/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const formData = await req.json()
  
  // 1. Validate discount code (server-side!)
  let discount = null
  if (formData.discount_code) {
    const { data } = await supabase
      .rpc('validate_discount', { p_code: formData.discount_code })
    
    if (data && data[0]?.is_valid) {
      discount = data[0]
    } else {
      return new Response(JSON.stringify({ error: 'Invalid discount code' }), {
        status: 400
      })
    }
  }
  
  // 2. Calculate final price
  let finalPrice = formData.product_net_pence
  if (discount) {
    if (discount.amount_pence) {
      finalPrice -= discount.amount_pence
    } else if (discount.percent_off) {
      finalPrice = finalPrice * (1 - discount.percent_off / 100)
    }
  }
  
  // 3. Insert booking
  const { data: booking, error } = await supabase
    .from('advertising_leads')
    .insert([{
      ...formData,
      final_price_pence: finalPrice,
      discount_applied: discount?.code || null
    }])
    .select()
    .single()
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    })
  }
  
  // 4. Send confirmation email (using Resend)
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'ROCK.SCOT <bookings@rock.scot>',
      to: formData.email,
      subject: 'Booking Confirmed - ROCK.SCOT',
      html: `
        <h1>Thanks for booking with ROCK.SCOT!</h1>
        <p>Your campaign is confirmed:</p>
        <ul>
          <li>Package: ${formData.product_name}</li>
          <li>Price: £${(finalPrice / 100).toFixed(2)}</li>
          <li>Start: ${formData.start_date}</li>
        </ul>
        <p>We'll be in touch shortly!</p>
      `
    })
  })
  
  return new Response(JSON.stringify({ 
    success: true, 
    booking_id: booking.id 
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

---

### **2. Supabase Auth Setup**

Already built into Supabase! Just:

1. Enable Email auth in Dashboard
2. Add login/signup forms to website
3. Protect admin pages with auth check

**Code snippet for login:**
```javascript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'customer@example.com',
  password: 'secure-password'
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'customer@example.com',
  password: 'their-password'
})

// Magic link (passwordless)
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'customer@example.com'
})
```

---

### **3. Storage Bucket**

Create bucket in Supabase Dashboard:
```sql
-- RLS policy for customer uploads
CREATE POLICY "Customers can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'campaign-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can view all
CREATE POLICY "Admins can view all files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'campaign-assets');
```

---

## 🏁 BOTTOM LINE

**Your current setup:** ✅ Working, secure, functional  
**Could it be better?:** 💯 Absolutely yes  
**Should you upgrade now?:** 🤔 Depends on priority

**My recommendation:**
1. Launch with what you have (it works!)
2. Add Edge Function within first week (professionalism)
3. Add Auth within first month (customer portal)
4. Add Stripe when you hit 20 bookings/month (automation)

**The code you have IS good.** But these upgrades make it GREAT. 🎸🔥
