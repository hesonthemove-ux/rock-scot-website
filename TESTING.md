# SUPABASE TESTING GUIDE

## 🧪 Testing Your Advertising Booking System

This guide provides curl commands to test the Edge Function and database.

## 🔑 Prerequisites

Get these from your Supabase Dashboard:
1. **Project URL:** `https://dtgftjcholwniewbooyc.supabase.co`
2. **Anon Key:** Settings → API → anon public key
3. **User Token:** Login a test user and get their JWT
4. **Admin Token:** Login an admin user

## 📝 Test Commands

### A) Test: Booking WITHOUT Discount Code

```bash
curl -X POST 'https://dtgftjcholwniewbooyc.supabase.co/functions/v1/book_campaign/book' \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "regional",
    "product_name": "Regional Campaign",
    "product_net_pence": 29900,
    "campaign_length_days": 28,
    "bolt_on_included": false,
    "bolt_on_cost_pence": 0,
    "meta": {
      "first_name": "Test",
      "last_name": "User",
      "company": "Test Ltd",
      "email": "test@example.com",
      "phone": "01234567890"
    }
  }'
```

**Expected:** 200 OK with booking_id and invoice_id

---

### B) Test: Booking WITH Valid Approved Discount

First, create and approve a discount code (admin only):

```bash
# Step 1: Create discount (use service_role key)
curl -X POST 'https://dtgftjcholwniewbooyc.supabase.co/rest/v1/rpc/create_discount' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "p_code": "SPRING50",
    "p_amount_pence": 5000,
    "p_created_by": "YOUR_ADMIN_UUID",
    "p_note": "Spring promotion - £50 off"
  }'

# Step 2: Approve the discount
curl -X POST 'https://dtgftjcholwniewbooyc.supabase.co/rest/v1/rpc/approve_discount' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "p_discount_id": "DISCOUNT_ID_FROM_STEP1",
    "p_approved_by": "YOUR_ADMIN_UUID",
    "p_note": "Approved for spring campaign"
  }'

# Step 3: Book with discount code
curl -X POST 'https://dtgftjcholwniewbooyc.supabase.co/functions/v1/book_campaign/book' \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "regional",
    "product_name": "Regional Campaign",
    "product_net_pence": 29900,
    "campaign_length_days": 28,
    "bolt_on_included": false,
    "bolt_on_cost_pence": 0,
    "discount_code": "SPRING50",
    "meta": {
      "first_name": "Test",
      "last_name": "User",
      "company": "Test Ltd",
      "email": "test@example.com"
    }
  }'
```

**Expected:** 200 OK with discounted total (£249 instead of £299)

---

### C) Test: Booking with INVALID Discount

```bash
curl -X POST 'https://dtgftjcholwniewbooyc.supabase.co/functions/v1/book_campaign/book' \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "regional",
    "product_name": "Regional Campaign",
    "product_net_pence": 29900,
    "campaign_length_days": 28,
    "discount_code": "INVALID_CODE",
    "meta": {}
  }'
```

**Expected:** 400 Bad Request with error: "invalid_discount"

---

### D) Test: Booking with UNAPPROVED Discount

```bash
# Create discount but DON'T approve it
curl -X POST 'https://dtgftjcholwniewbooyc.supabase.co/rest/v1/rpc/create_discount' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "p_code": "PENDING50",
    "p_amount_pence": 5000,
    "p_created_by": "YOUR_ADMIN_UUID"
  }'

# Try to use it
curl -X POST 'https://dtgftjcholwniewbooyc.supabase.co/functions/v1/book_campaign/book' \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "regional",
    "product_name": "Regional Campaign",
    "product_net_pence": 29900,
    "discount_code": "PENDING50",
    "meta": {}
  }'
```

**Expected:** 400 Bad Request with error: "unapproved_discount"

---

### E) Test: Fetch Invoice

```bash
curl -X GET 'https://dtgftjcholwniewbooyc.supabase.co/functions/v1/book_campaign/invoice/INVOICE_ID' \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

**Expected:** 200 OK with invoice details and nested booking

---

### F) Test: Admin Mark Invoice Paid

```bash
curl -X POST 'https://dtgftjcholwniewbooyc.supabase.co/functions/v1/book_campaign/pay' \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_id": "INVOICE_UUID",
    "payment_method": "bank_transfer",
    "payment_reference": "REF123456",
    "amount_pence": 29900
  }'
```

**Expected:** 200 OK with receipt details

---

### G) Test: Non-Admin Cannot Call Admin RPC

```bash
curl -X POST 'https://dtgftjcholwniewbooyc.supabase.co/rest/v1/rpc/create_discount' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer REGULAR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "p_code": "HACK",
    "p_amount_pence": 100000
  }'
```

**Expected:** 403 Forbidden or permission denied

---

## 📊 Verify in Supabase Dashboard

After each test, check:

1. **Table Editor → booking_attempts_logs**
   - See all attempts logged
   - Check payload and result

2. **Table Editor → invoices**
   - Verify invoice created
   - Check totals and discount applied

3. **Table Editor → receipts**
   - Confirm payment recorded

4. **Table Editor → discounts**
   - Check discount codes and approval status

---

## 🐛 Troubleshooting

### Error: "unauthenticated"
- Your user token is missing or expired
- Get a new token by signing in

### Error: "forbidden"
- You're trying admin action without admin role
- Use service_role key or admin token

### Error: "invalid_discount"
- Discount code doesn't exist in database
- Check spelling and create it first

### Error: "unapproved_discount"
- Discount exists but not approved yet
- Run approve_discount first

---

## 🎯 Quick Test Scenarios

### Scenario 1: Regional Campaign - No Discount
- Base: £299
- Rush (<27 days): +£50
- **Total: £349 or £299**

### Scenario 2: Multi-Regional - £50 Discount
- Base: £449
- Discount: -£50
- **Total: £399**

### Scenario 3: Top of Hour - 10% Discount
- Base: £2,500
- Discount: -£250
- **Total: £2,250**

---

## 📝 Notes for Your Team

1. **Never expose service_role key** in frontend code
2. **Admin functions** must run on secure backend
3. **Log everything** - booking_attempts_logs tracks all attempts
4. **Approve carefully** - discounts can't be easily revoked once used
5. **Test in staging first** before production deployment

---

## 🔐 Security Checklist

- [ ] Service role key stored securely (not in git/frontend)
- [ ] Admin RPCs only callable by service_role
- [ ] RLS policies enabled on sensitive tables
- [ ] User tokens validated on every request
- [ ] Discount codes require approval before use
- [ ] All booking attempts logged for audit
