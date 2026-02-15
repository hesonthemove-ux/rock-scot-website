# ADMIN DASHBOARD FEATURES

## 🎯 Complete Admin System Overview

You now have TWO admin interfaces:

### 1. **admin.html** (Simple)
Basic discount code management

### 2. **admin-dashboard.html** (Full Featured) ⭐
Complete business management system

---

## 📊 **Admin Dashboard Features**

### **Dashboard Page**
Real-time business overview:
- **Total Revenue** - All paid invoices
- **Active Bookings** - Currently running campaigns
- **Pending Invoices** - Awaiting payment
- **Total Customers** - Customer database size
- **Revenue Chart** - 30-day trend
- **Recent Bookings Table** - Latest 10 bookings

### **Analytics Page** 📈
**Track Website Traffic & User Behavior:**

**Metrics Displayed:**
- **Total Visitors (30 days)** - Unique visitors
- **Total Sessions** - Complete browsing sessions
- **Avg Session Duration** - How long people stay (in minutes:seconds)
- **Pages Per Session** - Average pages viewed

**Charts:**
- Traffic over time (daily/weekly views)

**Tables:**
- Top Pages - Most visited pages with view counts

**What You Can See:**
- Which pages get most traffic
- How long people browse
- Where visitors come from (referrer)
- Desktop vs Mobile vs Tablet breakdown
- Time spent on each page

### **Bookings Page** 📅
Manage all advertising campaigns:

**View:**
- Booking ID
- Customer name
- Package type (Regional/Multi-Regional/Top of Hour)
- Campaign start/end dates
- Status (Pending/Confirmed/Active/Completed/Cancelled)

**Actions:**
- Create new booking manually
- View booking details
- Update campaign status
- Cancel booking

### **Invoices Page** 💰
Financial management:

**View:**
- Invoice number
- Customer
- Amount (inc. VAT)
- Issue date
- Due date
- Status (Pending/Paid/Overdue/Cancelled)

**Actions:**
- **Mark as Paid** - Record payment with:
  - Payment method (Bank transfer, Stripe, Cash, Cheque)
  - Payment reference number
  - Automatically creates receipt
  - Updates customer total spent
- Export all invoices to CSV
- Send invoice reminders

### **Customers Page** 👥
Complete CRM:

**View:**
- Full name
- Company
- Email & phone
- **Total Spent** - Lifetime value
- **Total Bookings** - Number of campaigns
- Last contact date
- Customer status (Active/Inactive/Blocked)

**Actions:**
- View full customer history
- See all their bookings & invoices
- Add notes
- Export customer list to CSV
- Email customer directly

### **Discounts Page** 🎟️
Discount code management:

**Pending Discounts Table:**
- Shows codes awaiting approval
- Quick approve/reject buttons

**All Discounts Table:**
- Complete discount history
- Filter by status (Approved/Pending)
- See usage statistics

**Create New Discount:**
- Code name (e.g., SPRING50)
- Type: Fixed (£50 off) or Percent (10% off)
- Value
- Optional note
- Requires approval before customers can use

### **Emails Page** ✉️
Customer communication:

**Send Email:**
- Select customer from dropdown
- Write subject & message
- Logs all sent emails

**Email History:**
- See all emails sent
- Date, recipient, subject
- Status (Sent/Failed/Bounced)
- Error messages if failed

---

## 📈 **Analytics Tracking (NEW!)**

### **How It Works:**

**Automatic Tracking:**
1. User visits any page → Page view recorded
2. Session ID created (persists across pages)
3. Every 10 seconds → Session duration updated
4. User leaves site → Final session data saved

**Data Captured:**
- Page path (e.g., /index.html, /advertise.html)
- Referrer (where they came from)
- Device type (mobile/desktop/tablet)
- User agent (browser info)
- Session duration (total time on site)
- Pages viewed per session

**Implementation:**
- `js/analytics.js` tracks everything automatically
- Added to every page via script tag
- Stores in Supabase `page_views` and `sessions` tables

---

## 🔐 **Setup Required**

### **1. Run New Migrations:**

```sql
-- In Supabase SQL Editor, run these in order:
005_create_analytics_and_admin_tables.sql
006_create_analytics_rpcs.sql
```

### **2. Update admin-dashboard.html:**

**Line 636-637:**
```javascript
const SUPABASE_SERVICE_ROLE = 'YOUR_SERVICE_ROLE_KEY'; // GET FROM SUPABASE
const ADMIN_USER_ID = 'YOUR_ADMIN_UUID'; // YOUR USER ID
```

### **3. Update analytics.js:**

**Line 7:**
```javascript
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY'; // PUBLIC KEY OK
```

### **4. Add to Each Page:**

Add before closing `</body>` tag:
```html
<script src="js/analytics.js"></script>
```

Pages to update:
- index.html
- advertise.html  
- (any other public pages)

---

## 📊 **What You'll See in Analytics:**

### **Example Session Data:**

**Session #1:**
- Visitor ID: abc123-xyz789
- Started: 07/02/2026 14:23:15
- Duration: 5 minutes 47 seconds
- Pages viewed: 4
  1. / (homepage) - 2 min 15 sec
  2. /advertise.html - 2 min 30 sec
  3. /index.html#genres - 45 sec
  4. /index.html#schedule - 17 sec
- Device: Desktop
- Referrer: google.com
- Location: Glasgow, Scotland

### **Aggregate Stats (Last 30 Days):**
- Total visitors: 1,247
- Total sessions: 1,458
- Avg duration: 3:24
- Pages/session: 2.8
- Top page: /advertise.html (487 views)
- Peak time: Wednesday 2-4 PM

---

## 💡 **Business Insights You Can Get:**

### **Traffic Analysis:**
- Which marketing channels work? (Check referrers)
- Best time to post? (Check traffic by hour)
- Mobile vs desktop split? (Optimize accordingly)

### **Conversion Funnel:**
- Homepage views → Advertise page views → Form submissions
- Where do people drop off?
- Which pages need improvement?

### **Customer Behavior:**
- How long do they research before booking?
- Do they compare packages?
- What information do they need?

### **Revenue Intelligence:**
- Revenue by package type
- Average customer value
- Payment collection rate
- Discount code ROI

---

## 📥 **Export Features:**

### **Invoices CSV:**
Columns: Invoice #, Customer, Amount, Status, Date, Payment Method

### **Customers CSV:**
Columns: Name, Company, Email, Phone, Total Spent, Bookings, Status

### **Analytics CSV (Coming):**
Columns: Date, Page Views, Sessions, Avg Duration, Top Page

---

## 🎯 **Quick Actions:**

**Daily Tasks:**
1. Check pending invoices
2. Approve new discount codes
3. Review new bookings
4. Check yesterday's traffic

**Weekly Tasks:**
1. Send invoice reminders
2. Export customer data
3. Analyze top referrers
4. Review revenue trends

**Monthly Tasks:**
1. Generate reports
2. Analyze conversion rates
3. Review discount usage
4. Customer retention analysis

---

## 🚀 **Next Steps:**

1. Run migrations 005 & 006
2. Add service_role key to admin-dashboard.html
3. Add analytics.js to all pages
4. Test page view tracking
5. Check admin dashboard stats
6. Start making data-driven decisions!

---

## ⚠️ **Security Notes:**

- **service_role key** = Full database access - NEVER commit to git!
- Only load admin-dashboard.html on secure, password-protected page
- Consider adding proper admin authentication
- Rotate keys if exposed
- Use HTTPS in production

---

**You now have a complete business management system with real-time analytics!** 🎸📊
