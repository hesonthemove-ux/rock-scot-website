# ROCK.SCOT - Scotland's Rock Station

## 🎸 **RADIO STATION FIRST. BUSINESS PLATFORM UNDERNEATH.**

This is a complete rock radio station website with a powerful advertising platform hidden in the backend.

---

## 🎯 **What Visitors See:**

### **index.html** - The Rock Station Experience
- High-impact storytelling
- Tom Russell showcase
- **WORKING LIVE PLAYER** (embedded Broadcast.Radio)
- Our story and vision
- Scotland-wide expansion plan
- No regional limitations in messaging
- Pure rock station branding

### **advertise.html** - Hidden Business Side
- Professional advertising packages
- Full booking system with Supabase
- Discount codes
- Quote calculator
- All the business power, accessible but not prominent

---

## 🔥 **The New Homepage:**

**Built Around:**
1. **Hero** - Graffiti aesthetic, "THIS IS ROCK.SCOT"
2. **Our Story** - Scotland's rock movement narrative
3. **Tom Russell** - Legendary DJ spotlight with achievements
4. **Live Player** - Working Broadcast.Radio embed
5. **Coverage** - Current areas + expansion vision
6. **High Impact** - Big typography, bold statements

**Messaging:**
- "Scotland's Rock Station" (NOT regional/local)
- "Ever-expanding" vision
- Current broadcast areas mentioned factually
- Future: All of Scotland

---

## 📡 **Technical:**

### **Live Player:**
- URL: `https://player.broadcast.radio/caledonia-tx-ltd`
- Embedded as iframe in #listen section
- Auto-sizing, fully functional
- No external player needed

### **Analytics:**
- Traffic tracking active (js/analytics.js)
- Captures linger time, page views, sessions
- All data goes to Supabase

### **Admin Backend:**
- **admin-dashboard.html** - Full business management
- **admin.html** - Simple discount manager
- Both hidden from main navigation
- Access directly by URL

---

## 📦 **Booking SQL & Supabase**

The booking system uses **ROCKSCOT-MASTER-SETUP.sql** as the single source of truth for the database.

1. **Apply the schema**  
   In Supabase Dashboard → SQL Editor, run **ROCKSCOT-MASTER-SETUP.sql** (creates `advertising_leads`, `campaigns`, `discounts`, `invoices`, RLS, `check_capacity`, `validate_discount`, etc.).

2. **Configure the site**  
   Edit **js/supabase-config.js** and set your project URL and **anon public** key:
   - Supabase Dashboard → Settings → API → copy **anon public**.
   - Replace `YOUR_ANON_KEY` in `js/supabase-config.js` with that key.

3. **Edge function**  
   Deploy the `book_campaign` edge function (Supabase CLI or Dashboard). It inserts into `advertising_leads` and optionally sends confirmation emails (set `RESEND_API_KEY` in edge function secrets for email).

4. **Optional**  
   For admin dashboard, set your **service_role** key only in a server-side or secure environment—never in client-side config.

---

## 📁 **File Structure:**

```
Public Site (Visitor-Facing):
├── index.html              ← NEW: Rock station homepage
├── advertise.html          ← Business side (subtle link in footer)
├── js/supabase-config.js   ← Set SUPABASE_ANON_KEY here
├── assets/images/          ← All your branding

Admin (Hidden):
├── admin.html              ← Simple discount manager
├── admin-dashboard.html    ← Full business platform

Backend:
├── supabase/migrations/    ← 6 SQL files
├── js/analytics.js         ← Traffic tracking
├── js/main.js             ← Site functionality

Documentation:
├── README.md              ← This file
├── ADMIN-FEATURES.md      ← Complete admin guide
├── SUPABASE-SETUP.md      ← Database setup
├── TESTING.md             ← Test suite
```

---

## 🚀 **Deploy:**

```bash
cd /home/rockscot/claude_production/
unzip rock-scot-website.zip
cd rock-scot-website/
python3 -m http.server 8080
```

Visit: `http://192.168.0.200:8080/`

---

## ✨ **What Makes This Different:**

**OLD VERSION:**
- Business/advertising focused
- Looked like a media kit
- Functional but not exciting

**NEW VERSION:**
- ROCK STATION with attitude
- Tom Russell front and center
- Storytelling that builds excitement
- Working player immediately visible
- Business side is there but not intrusive

**Backend stays exactly the same:**
- All booking power intact
- All admin features working
- Analytics tracking everything
- Zero functionality lost

---

## 🎯 **The Balance:**

**Front of House (95% of visitors):**
- Pure rock station experience
- Exciting, high-energy
- Scotland-wide vision
- Live player front and center

**Business Side (5% - potential advertisers):**
- Footer link to "Advertise"
- Professional presentation
- Full booking system
- Quote calculator
- All the power you built

---

## 🔧 **Customization:**

### **Add Your Socials:**
Footer line 485-487 - Replace # with real URLs:
```html
<a href="YOUR_FACEBOOK" class="social-icon">f</a>
<a href="YOUR_TWITTER" class="social-icon">𝕏</a>
<a href="YOUR_INSTAGRAM" class="social-icon">📷</a>
```

### **Add Tom Russell Photo:**
Replace `assets/images/studio-1.jpg` with actual Tom photo

### **Update Contact:**
Add phone number, actual social links from rock.caledoniatx.uk

---

## 🎸 **The Vision Statement:**

> "ROCK.SCOT isn't just another radio station. We're a movement."

This homepage tells that story. The backend lets you run the business.

**Perfect balance achieved.** 🔥

## 📦 Package Contents

```
rock-scot-website/
├── index.html              # Main HTML file
├── css/
│   └── style.css          # All styles and animations
├── js/
│   └── main.js            # All JavaScript and interactivity
├── assets/
│   └── images/
│       ├── logo.png                        # Main logo (lion crest)
│       ├── hero.png                        # Hero background (newspaper collage)
│       ├── genre-badge-metal.png          # Metal badge
│       ├── genre-badge-alt.png            # Alt badge
│       ├── genre-badge-punk.png           # Punk badge
│       ├── genre-badge-rock.png           # Rock badge
│       ├── banner-1-guitars-flames.png    # Banner 1
│       ├── banner-2-silhouettes-stag.png  # Banner 2
│       ├── banner-3-saltire-guitars-bridge.png  # Banner 3
│       ├── banner-4-skull-flames-castles.png    # Banner 4
│       └── banner-5-born-to-rock-castle.png     # Banner 5
└── README.md              # This file
```

## 🚀 Quick Start

1. **Extract the ZIP file**
2. **Open `index.html` in your web browser**
3. That's it! The website is ready to use.

## ✨ Features

### Design
- ✅ Full-screen hero with newspaper collage background
- ✅ Your actual lion crest logo throughout
- ✅ Real genre badges (Metal, Alt, Punk, Rock)
- ✅ Smooth scroll animations
- ✅ Header shrinks on scroll
- ✅ Responsive mobile design

### Functionality
- ✅ **Fixed player bar** (slides up from bottom)
- ✅ **Myriad player integration** (ready to connect)
- ✅ **EQ visualizer** animation
- ✅ **Smooth scroll** navigation
- ✅ **Intersection Observer** for fade-in animations
- ✅ **Keyboard shortcuts** (Space = play/pause, L = toggle player)
- ✅ **Console easter egg** (check browser console!)

### Information
- ✅ All correct: DAB+ terminology
- ✅ Ad times: :20 and :40 (in footer only)
- ✅ 134 plays per campaign
- ✅ 410,000+ reach
- ✅ Company Reg: SC646223
- ✅ VAT: 491589639
- ✅ Ofcom Licensed

## 📱 Browser Support

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (iOS/Android)

## 🔧 Customization

### Change Colors
Edit `css/style.css` at the top:
```css
:root {
    --orange: #FF6600;  /* Change this */
    --gold: #FFD700;    /* Change this */
    --navy: #002B5C;    /* Change this */
}
```

### Update Schedule
Edit the schedule items in `index.html` (search for "schedule-item")

### Add More Sections
Copy any section structure from `index.html` and modify

## 🎵 Myriad Player

The player is configured to use:
```
https://player.broadcast.radio/caledonia-tx-ltd
```

This loads automatically when you click "Listen Live"

## 📊 Analytics

To add Google Analytics:
1. Get your GA tracking ID
2. Add the GA script to `index.html` before `</head>`
3. Uncomment the tracking code in `js/main.js`

## 🎨 Images

All images are optimized and included:
- **Logo**: 2.5MB PNG (transparent background)
- **Hero**: 1.9MB PNG (newspaper collage)
- **Genre Badges**: 4 x ~480KB PNG each
- **Banners**: 5 x ~300KB PNG each

## 📞 Support

**Radio Station:**
- Email: info@rock.scot
- Advertising: advertise@rock.scot

**Website Issues:**
- Check browser console for errors (F12)
- Ensure all files are in correct folders
- Clear browser cache if styles don't load

## 🔥 Coming Soon

- Genre-specific pages (/metal, /alt, /punk, /rock)
- Advertise page with booking form
- News & events sections
- Podcast/listen-back functionality
- Social media integration

## 📝 License

All branding and content © 2026 ROCK.SCOT
SC646223 | VAT 491589639 | Ofcom Licensed

---

Built with 🎸 for Scotland's Rock Community
