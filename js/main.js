// ================================================================
// ROCK.SCOT — SHARED JAVASCRIPT
// ================================================================

// ── SUPABASE INIT ─────────────────────────────────────────────
const SUPABASE_URL      = window.SUPABASE_URL      || 'https://pwzeapvopeeoahpyicdm.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '';

let sb = null;
try {
    if (SUPABASE_ANON_KEY && window.supabase) {
        sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            realtime: { params: { eventsPerSecond: 10 } }
        });
    }
} catch (e) { console.warn('Supabase init:', e.message); }

// ── THE WIRE ─────────────────────────────────────────────────
const ticker = document.getElementById('ticker-content');
let wireItems = [];

function renderWire(items) {
    if (!items || !items.length || !ticker) return;
    wireItems = items;
    const text = items.map(i => '⚡ ' + i.title.toUpperCase()).join('   ◆   ');
    ticker.textContent = text + '   ◆   ';
    ticker.style.animation = 'none';
    void ticker.offsetHeight;
    ticker.style.animation = '';
}

async function loadWire() {
    if (!sb || !ticker) return;
    try {
        const { data, error } = await sb
            .from('wire_news')
            .select('title, genre, created_at')
            .eq('is_live', true)
            .order('created_at', { ascending: false })
            .limit(25);
        if (!error && data && data.length) renderWire(data);
    } catch (e) { /* silent */ }
}

function subscribeWire() {
    if (!sb) return;
    sb.channel('wire-live')
        .on('postgres_changes', {
            event: 'INSERT', schema: 'public',
            table: 'wire_news', filter: 'is_live=eq.true'
        }, (payload) => {
            if (payload.new && payload.new.title) {
                wireItems.unshift(payload.new);
                if (wireItems.length > 25) wireItems.pop();
                renderWire(wireItems);
                const lbl = document.querySelector('.wire-label');
                if (lbl) {
                    lbl.style.cssText += ';background:#fff;color:#FF6600';
                    setTimeout(() => lbl.style.cssText = '', 800);
                }
            }
        }).subscribe();
}

loadWire();
subscribeWire();
setInterval(loadWire, 5 * 60 * 1000);

// ── HEADER SHRINK ─────────────────────────────────────────────
const siteHeader = document.getElementById('site-header');
if (siteHeader) {
    window.addEventListener('scroll', () => {
        siteHeader.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
}

// ── BACK TO TOP ───────────────────────────────────────────────
const btt = document.getElementById('back-to-top');
if (btt) {
    window.addEventListener('scroll', () => {
        btt.style.opacity       = window.scrollY > 400 ? '1' : '0';
        btt.style.pointerEvents = window.scrollY > 400 ? 'auto' : 'none';
    }, { passive: true });
    btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ── SCROLL ANIMATIONS ─────────────────────────────────────────
const fadeEls = document.querySelectorAll('.fade-up');
if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    fadeEls.forEach(el => obs.observe(el));
} else {
    fadeEls.forEach(el => el.classList.add('visible'));
}

// ── COOKIE CONSENT ────────────────────────────────────────────
const cookieBar = document.getElementById('cookie-bar');
const CONSENT_KEY = 'rs-cookie-consent';
const ANALYTICS_PREF_KEY = 'rs-cookie-analytics';

function isDNTEnabled() {
    return navigator.doNotTrack === '1' ||
        window.doNotTrack === '1' ||
        navigator.msDoNotTrack === '1';
}

function getConsentState() {
    const mode = localStorage.getItem(CONSENT_KEY);
    if (!mode) return { saved: false, mode: null, analytics: false };
    if (mode === 'all') return { saved: true, mode, analytics: true };
    if (mode === 'custom') {
        return {
            saved: true,
            mode,
            analytics: localStorage.getItem(ANALYTICS_PREF_KEY) === 'true'
        };
    }
    return { saved: true, mode: 'essential', analytics: false };
}

function hideCookieBar() {
    if (cookieBar) cookieBar.classList.add('hidden');
}

function closeCookieSettings() {
    document.getElementById('cookie-settings-modal')?.classList.remove('visible');
}

function saveConsent(mode, analyticsEnabled) {
    localStorage.setItem(CONSENT_KEY, mode);
    localStorage.setItem(ANALYTICS_PREF_KEY, analyticsEnabled ? 'true' : 'false');
    window.analyticsAllowed = !!analyticsEnabled;
    hideCookieBar();
    closeCookieSettings();
    if (window.analyticsAllowed) trackPageView();
}

function openCookieSettings() {
    if (!cookieBar) return;
    let modal = document.getElementById('cookie-settings-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'cookie-settings-modal';
        modal.innerHTML = `
            <div class="cookie-settings-panel" role="dialog" aria-modal="true" aria-label="Cookie preferences">
                <h3>Cookie Preferences</h3>
                <p>Choose which optional cookies we can use.</p>
                <div class="cookie-settings-row">
                    <div>
                        <label for="cookie-analytics-toggle">Analytics Cookies</label>
                        <small>Helps us understand traffic and improve the site.</small>
                    </div>
                    <input id="cookie-analytics-toggle" type="checkbox">
                </div>
                <div class="cookie-settings-actions">
                    <button type="button" class="cookie-settings-cancel" id="cookie-settings-cancel">Cancel</button>
                    <button type="button" class="cookie-settings-save" id="cookie-settings-save">Save</button>
                </div>
            </div>`;
        document.body.appendChild(modal);

        modal.addEventListener('click', (event) => {
            if (event.target === modal) closeCookieSettings();
        });
        modal.querySelector('#cookie-settings-cancel')?.addEventListener('click', closeCookieSettings);
        modal.querySelector('#cookie-settings-save')?.addEventListener('click', () => {
            const enabled = !!modal.querySelector('#cookie-analytics-toggle')?.checked;
            saveConsent('custom', enabled);
        });
    }

    const current = getConsentState();
    const toggle = modal.querySelector('#cookie-analytics-toggle');
    if (toggle) toggle.checked = !!current.analytics;
    modal.classList.add('visible');
}

window.showCookieSettings = openCookieSettings;
window.analyticsAllowed = false;

if (cookieBar) {
    const existing = getConsentState();
    if (isDNTEnabled()) {
        // DNT wins over any prior preference while browser signal is active.
        saveConsent('essential', false);
    } else if (existing.saved) {
        window.analyticsAllowed = !!existing.analytics;
        hideCookieBar();
    }

    document.getElementById('cookie-accept')?.addEventListener('click', () => saveConsent('all', true));
    document.getElementById('cookie-decline')?.addEventListener('click', () => saveConsent('essential', false));
    document.getElementById('cookie-customize')?.addEventListener('click', openCookieSettings);
}

// ── ANALYTICS ────────────────────────────────────────────────
async function trackPageView() {
    if (!window.analyticsAllowed || !sb) return;
    try {
        let vid = localStorage.getItem('rs_visitor_id');
        if (!vid) { vid = crypto.randomUUID(); localStorage.setItem('rs_visitor_id', vid); }
        let sid = sessionStorage.getItem('rs_session_id');
        if (!sid) { sid = crypto.randomUUID(); sessionStorage.setItem('rs_session_id', sid); }
        await sb.from('page_views').insert([{
            session_id: sid, visitor_id: vid,
            page_path: window.location.pathname,
            referrer: document.referrer || null,
            user_agent: navigator.userAgent,
            device_type: /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
        }]);
    } catch (e) { /* silent */ }
}
trackPageView();

// ── KEYBOARD SHORTCUTS ────────────────────────────────────────
document.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
    if (e.key === 'l' || e.key === 'L') document.getElementById('listen')?.scrollIntoView({ behavior: 'smooth' });
    if (e.key === 'Escape') document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
});

console.log('%c🎸 ROCK.SCOT', 'font-size:24px;color:#FF6600;font-weight:bold;');
console.log('%cScotland\'s Rock Station — DAB+ Digital Radio', 'color:#FFD700;font-size:14px;');
console.log('%cPress L to jump to the live player. 🤘', 'color:#888;font-size:12px;');
