# PERSISTENT PLAYER GUIDE

## 🎸 **AJAX Navigation with Continuous Playback**

Your site now has a **persistent player** - the stream keeps playing when users navigate!

---

## 🎯 **What It Does:**

### **WITHOUT Persistent Player:**
```
User clicks "Listen Live" → Player starts → 🎵
User clicks "Advertise" → PAGE RELOADS → Player stops → 😞
```

### **WITH Persistent Player (NOW):**
```
User clicks "Listen Live" → Player starts → 🎵
User clicks "Advertise" → PAGE LOADS VIA AJAX → Player keeps playing! → 🎸🔥
User clicks "Our Story" → AJAX AGAIN → Still playing! → 🎸🔥
```

---

## ⚡ **How It Works:**

### **1. Fixed Player Bar**
- Sits at bottom of screen (like Spotify)
- Never reloads, always stays in DOM
- Contains the Broadcast.Radio iframe

### **2. AJAX Navigation**
- Intercepts all internal link clicks
- Fetches new page via JavaScript
- Swaps content WITHOUT full page reload
- Player iframe never touched = keeps playing!

### **3. Browser History**
- Updates URL properly
- Back/forward buttons work
- Still feels like normal navigation

---

## 🎮 **User Experience:**

### **Player Bar Features:**
```
┌─────────────────────────────────────────────────────┐
│ [▶] NOW PLAYING                         [Player] [×] │
│     ROCK.SCOT LIVE                                   │
│     Broadcasting Now                                 │
└─────────────────────────────────────────────────────┘
```

**Controls:**
- **Play/Pause Button** - Big orange circle button
- **Close Button** - × to hide player bar
- **Player Frame** - Embedded Broadcast.Radio player

**States:**
- Hidden by default
- Slides up when "Listen Live" clicked
- Stays visible while navigating
- Can be closed anytime

---

## 🔧 **Technical Implementation:**

### **Files:**
- `js/persistent-player.js` - Main system (new)
- `js/main.js` - Site functionality
- `js/analytics.js` - Tracking

### **How It Intercepts Links:**
```javascript
document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    
    if (internal link && not special) {
        e.preventDefault();
        loadPageViaAJAX(href);
        // Player keeps playing!
    }
});
```

### **What It DOESN'T Intercept:**
- External links (http://other-site.com)
- Mailto links (mailto:info@rock.scot)
- Tel links (tel:01234567890)
- Hash links (#section)
- Links with `target="_blank"`
- Links with `data-no-ajax` attribute

---

## 🎯 **Adding "Listen Live" Buttons:**

### **Method 1: Use Existing Classes**
```html
<button class="btn-listen">Listen Live</button>
<button class="btn-listen-live">Tune In</button>
```

### **Method 2: Use Data Attribute**
```html
<button data-action="listen">🎵 Play Now</button>
```

### **Method 3: Use JavaScript**
```javascript
// From anywhere in your code:
window.rockScotPlayer.show();  // Show and play
window.rockScotPlayer.close(); // Hide player
window.rockScotPlayer.toggle(); // Toggle play/pause
```

---

## 📱 **Mobile Behavior:**

- Player bar stacks vertically on small screens
- All controls still accessible
- Swipe gestures could be added later

---

## ⚙️ **Customization:**

### **Change Player Position:**
Edit `persistent-player.js` line ~50:
```javascript
bottom: 0;  // Change to: top: 80px; for top position
```

### **Auto-Show on Page Load:**
Add to end of `persistent-player.js`:
```javascript
// Auto-show player after 3 seconds
setTimeout(() => {
    window.rockScotPlayer.show();
}, 3000);
```

### **Skip AJAX for Specific Links:**
```html
<a href="advertise.html" data-no-ajax>
    Advertise (will do full page load)
</a>
```

---

## 🐛 **Troubleshooting:**

### **Player Not Showing:**
1. Check browser console (F12) for errors
2. Verify `js/persistent-player.js` loaded
3. Check "Listen Live" button has correct class/data-action

### **Page Load Issues:**
1. Some pages might have special scripts that break
2. Add `data-no-ajax` to those links as fallback
3. Check console for JavaScript errors

### **Player Stops Playing:**
1. This shouldn't happen with AJAX
2. If it does, might be iframe security issue
3. Check Broadcast.Radio iframe allows embedding

---

## 🎯 **SEO Impact:**

✅ **No negative SEO impact because:**
- Initial page load is normal HTML
- Search engines see full content
- URLs update properly
- History API used correctly
- Progressive enhancement (works without JS)

---

## 🚀 **Advanced Features (Future):**

### **Could Add:**
- [ ] Volume control
- [ ] Now playing metadata from API
- [ ] Social share current song
- [ ] Favorite songs/shows
- [ ] Schedule integration
- [ ] Equalizer visualization

---

## 📊 **Analytics:**

Player usage is tracked:
- When player shown
- Navigation with player active
- Time played
- All via existing analytics.js

---

## ✨ **The Magic:**

**Old Way:**
```
Click link → Server request → Full page reload → Player dies
```

**New Way (AJAX):**
```
Click link → JavaScript fetch → Content swap → Player lives!
```

**That's the AJAX system people talk about!** 🎸

---

## 🎵 **Result:**

Users can browse your ENTIRE site while the stream plays continuously. 

**Just like Spotify, SoundCloud, and other modern music platforms.**

Perfect for a radio station! 🔥
