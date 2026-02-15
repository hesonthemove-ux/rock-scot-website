# 🚀 EDGE FUNCTION DEPLOYMENT GUIDE

## What You Now Have

A production-ready **Edge Function** that runs server-side when customers submit the booking form.

---

## Features Included

✅ **Server-side discount validation** (can't be faked)  
✅ **Automatic price calculation** (secure)  
✅ **Duplicate submission prevention** (5-minute window)  
✅ **Confirmation emails** (customer + admin)  
✅ **Beautiful HTML emails** (branded)  
✅ **IP address logging** (security)  
✅ **Comprehensive error handling**  
✅ **CORS support** (works from any domain)  

---

## How To Deploy (10 Minutes)

### **Step 1: Install Supabase CLI**

```bash
# macOS / Linux
brew install supabase/tap/supabase

# Windows
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or use NPM
npm install -g supabase
```

### **Step 2: Login to Supabase**

```bash
supabase login
```

This opens your browser to authenticate.

### **Step 3: Link Your Project**

```bash
# In your rock-scot-website directory
cd /path/to/rock-scot-website
supabase link --project-ref YOUR_PROJECT_ID
```

Your project ID is in the Supabase URL:  
`https://YOUR_PROJECT_ID.supabase.co`

### **Step 4: Deploy the Edge Function**

```bash
supabase functions deploy book_campaign
```

That's it! The function is now live at:  
`https://YOUR_PROJECT_ID.supabase.co/functions/v1/book_campaign`

### **Step 5: Set Environment Variables**

In Supabase Dashboard → Edge Functions → book_campaign → Settings:

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
```

Get a free Resend API key at https://resend.com (100 emails/day free)

---

## Alternative: Deploy via Dashboard

Don't want to use CLI? Deploy directly in the dashboard:

1. Supabase Dashboard → Edge Functions → Create Function
2. Name: `book_campaign`
3. Paste the code from `supabase/functions/book_campaign/index.ts`
4. Click Deploy
5. Add `RESEND_API_KEY` in function settings

---

## Update Your Website

Change `advertise.html` to call the Edge Function instead of direct insert:

### **Before (Current - Direct Insert):**
```javascript
const { data, error } = await supabase
    .from('advertising_leads')
    .insert([formData]);
```

### **After (Edge Function):**
```javascript
const { data, error } = await fetch(
    'https://YOUR_PROJECT_ID.supabase.co/functions/v1/book_campaign',
    {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify(formData)
    }
).then(r => r.json());

if (data.success) {
    alert('✅ ' + data.message);
} else {
    alert('❌ ' + (data.error || 'Submission failed'));
}
```

---

## Testing

### **Test Locally (Optional):**
```bash
# Serve function locally
supabase functions serve book_campaign

# Test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/book_campaign' \
  --header 'Content-Type: application/json' \
  --data '{"first_name":"Test","last_name":"User","email":"test@example.com",...}'
```

### **Test Live:**
Just submit the form on advertise.html — you'll get:
- Confirmation in browser
- Email to customer
- Email to advertise@rock.scot

---

## Email Setup (Resend)

1. Go to https://resend.com
2. Sign up (free plan: 100 emails/day)
3. Verify your domain: `rock.scot`
   - Add DNS records they provide
   - Enables `bookings@rock.scot` as sender
4. Get API key
5. Add to Supabase: Settings → Environment Variables → `RESEND_API_KEY`

**Without Resend:** Function still works, just won't send emails (bookings still save to database).

---

## What The Edge Function Does

```
1. Customer submits form
   ↓
2. Edge Function receives request
   ↓
3. Validates discount code (server-side, secure)
   ↓
4. Calculates final price (can't be faked)
   ↓
5. Checks for duplicate (prevents spam)
   ↓
6. Saves to database
   ↓
7. Sends email to customer (confirmation)
   ↓
8. Sends email to you (notification)
   ↓
9. Returns success to browser
```

**Benefits:**
- 🔒 Secure (server validates everything)
- 📧 Professional (automated emails)
- 🛡️ Protected (anti-spam, anti-fraud)
- ⚡ Fast (runs at edge, globally distributed)

---

## Monitoring

View logs in real-time:

```bash
supabase functions logs book_campaign --follow
```

Or in Dashboard → Edge Functions → book_campaign → Logs

---

## Cost

**Free tier:** 500,000 invocations/month  
**Your usage:** ~100-500/month (plenty of headroom)  
**Overage:** $2 per 1M requests (you won't hit it)

Essentially **FREE** for your scale.

---

## Troubleshooting

### Function not deploying?
```bash
# Check you're logged in
supabase projects list

# Check function syntax
cd supabase/functions/book_campaign
deno check index.ts
```

### Emails not sending?
- Check RESEND_API_KEY is set
- Verify domain in Resend dashboard
- Check function logs for errors

### 404 error when calling?
- Verify URL: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/book_campaign`
- Check function is deployed: `supabase functions list`

---

## Next Level: Add More Functions

Once you see how easy this is, you can add:

**`generate_invoice`** - Auto-create PDF invoices  
**`send_campaign_report`** - Weekly performance emails  
**`process_stripe_webhook`** - Handle payments  
**`sync_with_broadcast`** - Push to playout system  

Sky's the limit! 🚀

---

**You now have a production-grade booking system with server-side validation and automated emails!** 🎸✅
