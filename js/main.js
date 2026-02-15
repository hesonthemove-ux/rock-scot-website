// ROCK.SCOT - Main JavaScript

// ========== HEADER SCROLL EFFECT ==========
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// ========== SMOOTH SCROLL ==========
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ========== PLAYER BAR ==========
const playerBar = document.getElementById('player-bar');
const listenBtn = document.querySelector('.btn-listen-live');
const playBtn = document.getElementById('play-btn');
let isPlaying = false;
let player;

// Show player bar on Listen Live button click
listenBtn.addEventListener('click', () => {
    playerBar.classList.add('active');
    if (!isPlaying) {
        togglePlay();
    }
});

// Play/Pause functionality
function togglePlay() {
    if (!player) {
        // Create Myriad player iframe
        player = document.createElement('iframe');
        player.src = 'https://player.broadcast.radio/caledonia-tx-ltd';
        player.style.cssText = 'position:absolute;width:0;height:0;border:none;opacity:0;';
        player.allow = 'autoplay';
        document.body.appendChild(player);
    }
    
    isPlaying = !isPlaying;
    playBtn.textContent = isPlaying ? '⏸' : '▶';
    
    // Update track info
    if (isPlaying) {
        document.getElementById('track-name').textContent = 'ROCK.SCOT LIVE';
        document.getElementById('track-artist').textContent = 'Broadcasting Now on DAB+';
    } else {
        document.getElementById('track-name').textContent = 'ROCK.SCOT';
        document.getElementById('track-artist').textContent = "Scotland's Rock Station";
    }
}

playBtn.addEventListener('click', togglePlay');

// Auto-show player bar after page load
setTimeout(() => {
    playerBar.classList.add('active');
}, 3000);

// ========== SCROLL ANIMATIONS ==========
// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe sections
document.querySelectorAll('section:not(#hero)').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(40px)';
    section.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
    observer.observe(section);
});

// Observe schedule items with stagger
document.querySelectorAll('.schedule-item').forEach((item, index) => {
    item.style.opacity = '0';
    item.style.transform = 'translateX(-20px)';
    item.style.transition = `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`;
    observer.observe(item);
});

// Observe genre badges with stagger
document.querySelectorAll('.genre-badge').forEach((badge, index) => {
    badge.style.opacity = '0';
    badge.style.transform = 'scale(0.9)';
    badge.style.transition = `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.15}s`;
    observer.observe(badge);
});

// ========== GENRE BADGE CLICKS ==========
document.querySelectorAll('.genre-badge').forEach(badge => {
    badge.addEventListener('click', function() {
        const genreName = this.querySelector('img').alt;
        alert(`${genreName} coming soon! Full genre pages are being built.`);
    });
});

// ========== CONSOLE EASTER EGG ==========
console.log('%c🎸 ROCK.SCOT 🎸', 'font-size: 24px; font-weight: bold; color: #FF6600;');
console.log('%cScotland\'s Rock Station on DAB+', 'font-size: 14px; color: #FFD700;');
console.log('%cBroadcasting 24/7 across West Scotland', 'font-size: 12px; color: #FFFFFF;');
console.log('%cReach: 410,000+ | Ofcom Licensed: SC646223', 'font-size: 11px; color: #999;');

// ========== KEYBOARD SHORTCUTS ==========
document.addEventListener('keydown', (e) => {
    // Space bar to play/pause
    if (e.code === 'Space' && playerBar.classList.contains('active')) {
        e.preventDefault();
        togglePlay();
    }
    
    // 'L' key to toggle player
    if (e.code === 'KeyL') {
        playerBar.classList.toggle('active');
    }
});

// ========== TRACK METADATA (Simulated) ==========
// In production, this would fetch from your Myriad API
const sampleTracks = [
    { name: 'Biffy Clyro - Mountains', artist: 'Biffy Clyro' },
    { name: 'Royal Blood - Figure It Out', artist: 'Royal Blood' },
    { name: 'Enter Shikari - The Spark', artist: 'Enter Shikari' },
    { name: 'The Twilight Sad - Videograms', artist: 'The Twilight Sad' },
    { name: 'Twin Atlantic - Heart and Soul', artist: 'Twin Atlantic' }
];

let trackIndex = 0;

function updateTrackInfo() {
    if (isPlaying) {
        const track = sampleTracks[trackIndex];
        document.getElementById('track-name').textContent = track.name;
        document.getElementById('track-artist').textContent = track.artist;
        
        trackIndex = (trackIndex + 1) % sampleTracks.length;
    }
}

// Update track every 3 minutes (simulated)
setInterval(updateTrackInfo, 180000);

// ========== PERFORMANCE OPTIMIZATIONS ==========
// Lazy load images below the fold
if ('loading' in HTMLImageElement.prototype) {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
        img.src = img.dataset.src;
    });
} else {
    // Fallback for browsers that don't support lazy loading
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
    document.body.appendChild(script);
}

// Preload critical assets
const preloadLink = document.createElement('link');
preloadLink.rel = 'preload';
preloadLink.as = 'image';
preloadLink.href = 'assets/images/hero.png';
document.head.appendChild(preloadLink);

// ========== ANNOUNCEMENTS / NOTIFICATIONS ==========
// Show announcements or live event notifications
function showNotification(message, duration = 5000) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(135deg, #FF6600, #FF8833);
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(255, 102, 0, 0.4);
        z-index: 10000;
        animation: slideInRight 0.5s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.5s ease-out';
        setTimeout(() => notification.remove(), 500);
    }, duration);
}

// Example: Show notification after 5 seconds
setTimeout(() => {
    showNotification('🎸 Now playing Scottish rock 24/7 on DAB+!');
}, 5000);

// ========== ANALYTICS (Placeholder) ==========
// Add your analytics tracking here
function trackEvent(category, action, label) {
    // Google Analytics example:
    // gtag('event', action, { 'event_category': category, 'event_label': label });
    console.log(`Event tracked: ${category} - ${action} - ${label}`);
}

// Track Listen Live clicks
listenBtn.addEventListener('click', () => {
    trackEvent('Player', 'Click', 'Listen Live Button');
});

// Track genre clicks
document.querySelectorAll('.genre-badge').forEach(badge => {
    badge.addEventListener('click', function() {
        const genre = this.querySelector('img').alt;
        trackEvent('Genre', 'Click', genre);
    });
});

console.log('✅ ROCK.SCOT website loaded successfully!');
