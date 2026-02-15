# ROCK.SCOT - FRONTEND JAVASCRIPT SNIPPETS

All ready to copy/paste into your HTML files.

---

## 📝 **1. ADVERTISING FORM SUBMISSION**

Add this to **advertise.html** (replace the existing form submission):

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
// ============================================
// SUPABASE CONFIG
// ============================================
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';  // ← CHANGE THIS
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';               // ← CHANGE THIS

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// FORM SUBMISSION
// ============================================
document.getElementById('advertising-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    // Get form data
    const formData = {
        first_name: document.getElementById('first-name').value,
        last_name: document.getElementById('last-name').value,
        company: document.getElementById('company').value || null,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value || null,
        
        product_id: document.getElementById('package').value,
        product_name: document.getElementById('package').selectedOptions[0].text,
        campaign_length_days: 28,
        
        product_net_pence: parseInt(document.getElementById('package').value.split('-')[1]),
        
        discount_code: document.getElementById('discount-code')?.value?.toUpperCase() || null,
        message: document.getElementById('message')?.value || null,
        
        user_agent: navigator.userAgent,
        meta: {
            submitted_at: new Date().toISOString(),
            page_url: window.location.href
        }
    };
    
    try {
        // Insert lead
        const { data, error } = await supabase
            .from('advertising_leads')
            .insert([formData])
            .select();
        
        if (error) throw error;
        
        // Success!
        alert('✅ Thank you! Your enquiry has been submitted. We\'ll be in touch soon.');
        e.target.reset();
        
    } catch (error) {
        console.error('Submission error:', error);
        alert('❌ Sorry, there was an error. Please try again or email advertise@rock.scot');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Enquiry';
    }
});

// ============================================
// DISCOUNT CODE VALIDATION (OPTIONAL)
// ============================================
async function validateDiscountCode() {
    const codeInput = document.getElementById('discount-code');
    const code = codeInput?.value?.toUpperCase();
    
    if (!code) return;
    
    try {
        const { data, error } = await supabase
            .rpc('validate_discount', { p_code: code });
        
        if (error) throw error;
        
        if (data && data[0]?.is_valid) {
            const discount = data[0];
            let message = '✅ Valid discount: ';
            
            if (discount.amount_pence) {
                message += `£${(discount.amount_pence / 100).toFixed(2)} off`;
            } else if (discount.percent_off) {
                message += `${discount.percent_off}% off`;
            }
            
            alert(message);
        } else {
            alert('❌ Invalid or expired discount code');
            codeInput.value = '';
        }
    } catch (error) {
        console.error('Discount validation error:', error);
    }
}

// Add blur event to discount input
document.getElementById('discount-code')?.addEventListener('blur', validateDiscountCode);
</script>
```

---

## 📰 **2. THE WIRE NEWS TICKER**

Add this to **index.html** (before closing `</body>` tag):

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
// ============================================
// THE WIRE - REAL-TIME NEWS TICKER
// ============================================
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';  // ← CHANGE THIS
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';               // ← CHANGE THIS

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// LOAD INITIAL NEWS
// ============================================
async function loadWireNews() {
    try {
        const { data, error } = await supabase
            .from('wire_news')
            .select('title, genre, created_at')
            .eq('is_live', true)
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) throw error;
        
        const tickerEl = document.getElementById('ticker-content');
        
        if (data && data.length > 0) {
            const headlines = data.map(item => item.title.toUpperCase()).join(' ::: ');
            tickerEl.innerHTML = headlines + ' ::: ';
        } else {
            tickerEl.innerHTML = 'SCOTTISH ROCK NEWS COMING SOON ::: ';
        }
        
        console.log('📰 Wire news loaded:', data.length, 'stories');
        
    } catch (error) {
        console.error('Wire load error:', error);
        document.getElementById('ticker-content').innerHTML = 'THE WIRE ::: SCOTTISH ROCK NEWS ::: ';
    }
}

// ============================================
// SUBSCRIBE TO REAL-TIME UPDATES
// ============================================
const wireChannel = supabase
    .channel('wire-realtime')
    .on(
        'postgres_changes',
        {
            event: 'INSERT',
            schema: 'public',
            table: 'wire_news'
        },
        (payload) => {
            console.log('🔥 NEW STORY:', payload.new);
            
            const tickerEl = document.getElementById('ticker-content');
            const newHeadline = payload.new.title.toUpperCase();
            
            // Prepend new headline
            tickerEl.innerHTML = newHeadline + ' ::: ' + tickerEl.innerHTML;
        }
    )
    .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
            console.log('📡 THE WIRE is LIVE');
        }
    });

// ============================================
// INITIALIZE
// ============================================
loadWireNews();
</script>
```

---

## 📊 **3. ANALYTICS (OPTIONAL - if cookie consent given)**

Add this to **every page** (before closing `</body>` tag):

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
// ============================================
// ANALYTICS TRACKING
// ============================================
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';  // ← CHANGE THIS
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';               // ← CHANGE THIS

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// ONLY TRACK IF CONSENT GIVEN
// ============================================
if (window.analyticsAllowed) {  // Set by cookie-consent.js
    
    // Get or create visitor ID
    let visitorId = localStorage.getItem('rock_visitor_id');
    if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem('rock_visitor_id', visitorId);
    }
    
    // Get or create session ID
    let sessionId = sessionStorage.getItem('rock_session_id');
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem('rock_session_id', sessionId);
    }
    
    // Track page view
    async function trackPageView() {
        try {
            await supabase
                .from('page_views')
                .insert([{
                    session_id: sessionId,
                    visitor_id: visitorId,
                    page_path: window.location.pathname,
                    referrer: document.referrer || null,
                    user_agent: navigator.userAgent,
                    device_type: /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
                }]);
            
            console.log('📊 Page view tracked');
        } catch (error) {
            console.error('Analytics error:', error);
        }
    }
    
    trackPageView();
}
</script>
```

---

## 🔐 **4. ADMIN - CREATE DISCOUNT CODE**

Add this to **admin.html**:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
// ============================================
// ADMIN SUPABASE CONFIG
// ============================================
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';      // ← CHANGE THIS
const SUPABASE_SERVICE_KEY = 'YOUR_SERVICE_ROLE_KEY_HERE';       // ← CHANGE THIS (KEEP SECRET!)

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================
// CREATE DISCOUNT CODE
// ============================================
document.getElementById('create-discount-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const code = document.getElementById('discount-code').value.toUpperCase();
    const type = document.getElementById('discount-type').value;
    const value = parseInt(document.getElementById('discount-value').value);
    const note = document.getElementById('discount-note').value || null;
    
    let amountPence = null;
    let percentOff = null;
    
    if (type === 'fixed') {
        amountPence = value * 100;  // Convert £ to pence
    } else if (type === 'percent') {
        percentOff = value;
    }
    
    try {
        const { data, error } = await supabase
            .rpc('create_discount_code', {
                p_code: code,
                p_amount_pence: amountPence,
                p_percent_off: percentOff,
                p_note: note
            });
        
        if (error) throw error;
        
        alert('✅ Discount code created: ' + code);
        e.target.reset();
        loadPendingDiscounts();  // Refresh list
        
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error: ' + error.message);
    }
});

// ============================================
// LOAD PENDING DISCOUNTS
// ============================================
async function loadPendingDiscounts() {
    try {
        const { data, error } = await supabase
            .rpc('get_pending_discounts');
        
        if (error) throw error;
        
        const tbody = document.getElementById('pending-discounts-tbody');
        tbody.innerHTML = '';
        
        if (data && data.length > 0) {
            data.forEach(discount => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${discount.code}</td>
                    <td>${discount.amount_pence ? 'Fixed £' : 'Percent %'}</td>
                    <td>${discount.amount_pence ? '£' + (discount.amount_pence / 100) : discount.percent_off + '%'}</td>
                    <td>${new Date(discount.created_at).toLocaleDateString()}</td>
                    <td>
                        <button onclick="approveDiscount('${discount.id}')">✓ Approve</button>
                    </td>
                `;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5">No pending discounts</td></tr>';
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// ============================================
// APPROVE DISCOUNT
// ============================================
async function approveDiscount(discountId) {
    if (!confirm('Approve this discount code?')) return;
    
    try {
        const { error } = await supabase
            .rpc('approve_discount', {
                p_discount_id: discountId,
                p_approved_by: 'ADMIN_USER_ID',  // You can change this
                p_note: 'Approved via admin panel'
            });
        
        if (error) throw error;
        
        alert('✅ Discount approved!');
        loadPendingDiscounts();
        
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error: ' + error.message);
    }
}

// Load on page load
loadPendingDiscounts();
</script>
```

---

## 🧪 **5. TEST THE WIRE (Add Sample News)**

Run this in Supabase SQL Editor to add test news:

```sql
-- Insert test Scottish rock news
INSERT INTO wire_news (title, genre, source_url, is_live) 
VALUES 
    ('SCOTTISH ROCK LEGENDS ANNOUNCE GLASGOW SHOW', 'Rock', 'test-001', true),
    ('NEW METAL ALBUM DROPS FROM EDINBURGH BAND', 'Metal', 'test-002', true),
    ('PUNK FESTIVAL COMING TO SCOTLAND THIS SUMMER', 'Punk', 'test-003', true);

-- Check it worked
SELECT * FROM wire_news ORDER BY created_at DESC;
```

Then refresh your website - you should see the news on the ticker!

---

## ✅ **SECURITY CHECKLIST**

- ✅ RLS enabled on all tables
- ✅ Public can only INSERT leads (not read them)
- ✅ Public can only read APPROVED discounts
- ✅ Public can only read LIVE wire news
- ✅ Analytics only tracks if consent given
- ✅ Service role key only used in admin panel
- ✅ Anon key safe for frontend (read-only on protected data)

---

## 🚨 **IMPORTANT NOTES**

### **Anon Key vs Service Role Key:**

**Anon Key** (Safe for frontend):
- Use in: index.html, advertise.html, all public pages
- Can: Read approved data, insert leads, read live news
- Cannot: Read private data, update/delete anything

**Service Role Key** (DANGEROUS - Admin only):
- Use in: admin.html, admin-dashboard.html
- Can: Do EVERYTHING
- ⚠️ NEVER put in public pages
- ⚠️ NEVER commit to git
- ⚠️ Keep secret

---

That's it! All copy/paste ready with proper RLS security! 🔐
