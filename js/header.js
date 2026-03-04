/* ROCK.SCOT — Persistent Header v3.3
   One file: nav, hamburger, ticker, wire, player
   Injected into every page via <script src="js/header.js">
   Only runs once even if included multiple times */
if (window._rsHeaderLoaded) { /* already loaded, skip */ }
else {
window._rsHeaderLoaded = true;
(function(){
'use strict';

var SUPA_URL = window.SUPABASE_URL || 'https://pwzeapvopeeoahpyicdm.supabase.co';
var SUPA_KEY = window.SUPABASE_ANON_KEY || '';
var sb = null;

/* ── STYLES ───────────────────────────────────────────────────── */
var style = document.createElement('style');
style.textContent = [
'#rs-header{position:fixed;top:0;left:0;right:0;height:64px;background:#080808;border-bottom:1px solid #242424;z-index:2000;font-family:"Barlow Condensed","Arial Narrow",Arial,sans-serif;}',
'#rs-header.scrolled{border-bottom-color:#ff5500;}',
'#rs-hc{max-width:1300px;margin:0 auto;padding:0 1.25rem;height:100%;display:flex;align-items:center;gap:1rem;}',
'#rs-logo{height:42px;width:auto;flex-shrink:0;display:block;}',
'#rs-nav{display:flex;align-items:center;gap:.2rem;margin-left:auto;}',
'#rs-nav a{font-size:.88rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(242,242,242,.55);padding:.4rem .65rem;border-radius:3px;text-decoration:none;white-space:nowrap;transition:color .15s,background .15s;}',
'#rs-nav a:hover,#rs-nav a.rs-active{color:#f2f2f2;background:rgba(255,255,255,.07);}',
'#rs-nav a.rs-cta{color:#ff5500;border:1px solid rgba(255,85,0,.6);padding:.35rem .8rem;}',
'#rs-nav a.rs-cta:hover{background:#ff5500;color:#000;border-color:#ff5500;}',
'#rs-listen{background:#ff5500;color:#000;font-family:"Barlow Condensed","Arial Narrow",Arial,sans-serif;font-size:.82rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase;padding:.45rem 1rem;border-radius:3px;border:none;cursor:pointer;white-space:nowrap;flex-shrink:0;margin-left:.5rem;}',
'#rs-listen:hover{background:#ff7722;}',
'#rs-ham{display:none;flex-direction:column;justify-content:center;gap:5px;width:44px;height:44px;padding:10px;background:none;border:none;cursor:pointer;margin-left:auto;flex-shrink:0;}',
'#rs-ham span{display:block;height:2px;background:#f2f2f2;border-radius:2px;transition:all .25s cubic-bezier(.4,0,.2,1);transform-origin:center;}',
'#rs-ham.open span:nth-child(1){transform:translateY(7px) rotate(45deg);}',
'#rs-ham.open span:nth-child(2){opacity:0;transform:scaleX(0);}',
'#rs-ham.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg);}',
'#rs-mob{position:fixed;inset:0;background:rgba(8,8,8,.98);z-index:1999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.3rem;opacity:0;pointer-events:none;transition:opacity .25s;padding:2rem 1rem;}',
'#rs-mob.open{opacity:1;pointer-events:all;}',
'#rs-mob a{font-family:"Bebas Neue","Impact",sans-serif;font-size:clamp(2rem,8vw,3rem);letter-spacing:.05em;color:#f2f2f2;text-decoration:none;padding:.15rem 0;transition:color .15s;text-align:center;line-height:1.1;}',
'#rs-mob a:hover{color:#ff5500;}',
'#rs-mob a.rs-mob-cta{color:#ff5500;}',
'#rs-mob-close{position:absolute;top:1.25rem;right:1.25rem;font-size:1.4rem;color:rgba(242,242,242,.5);background:none;border:none;cursor:pointer;width:44px;height:44px;display:flex;align-items:center;justify-content:center;line-height:1;}',
'#rs-mob-close:hover{color:#f2f2f2;}',
'#rs-mob-listen{margin-top:.75rem;background:#ff5500;color:#000;font-family:"Barlow Condensed","Arial Narrow",Arial,sans-serif;font-size:1rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase;padding:.7rem 2.5rem;border-radius:3px;border:none;cursor:pointer;}',
'#rs-mob-listen:hover{background:#ff7722;}',
'#rs-ticker{position:fixed;top:64px;left:0;right:0;height:34px;background:#ff5500;display:flex;align-items:center;overflow:hidden;z-index:1990;}',
'#rs-ticker-label{background:#000;color:#ff5500;font-family:"Barlow Condensed","Arial Narrow",Arial,sans-serif;font-size:.68rem;font-weight:900;letter-spacing:.2em;text-transform:uppercase;padding:0 .85rem;height:100%;display:flex;align-items:center;white-space:nowrap;flex-shrink:0;border-right:1px solid rgba(255,85,0,.3);}',
'#rs-ticker-text{font-family:"Barlow Condensed","Arial Narrow",Arial,sans-serif;font-size:.82rem;font-weight:700;color:#000;white-space:nowrap;padding-left:1rem;animation:rs-marquee 240s linear infinite;}',
'#rs-ticker-more{background:rgba(0,0,0,.25);color:#000;font-family:"Barlow Condensed","Arial Narrow",Arial,sans-serif;font-size:.65rem;font-weight:900;letter-spacing:.15em;text-transform:uppercase;padding:0 .75rem;height:100%;display:flex;align-items:center;white-space:nowrap;flex-shrink:0;border-left:1px solid rgba(0,0,0,.15);text-decoration:none;}',
'#rs-ticker-more:hover{background:rgba(0,0,0,.45);}',
'@keyframes rs-marquee{0%{transform:translateX(100vw)}100%{transform:translateX(-100%)}}',
'#rs-player{position:fixed;bottom:0;left:0;right:0;background:rgba(8,8,8,.97);backdrop-filter:blur(12px);border-top:1px solid #242424;z-index:1980;transform:translateY(100%);transition:transform .35s cubic-bezier(.4,0,.2,1);}',
'#rs-player.open{transform:translateY(0);}',
'#rs-player-inner{max-width:1300px;margin:0 auto;padding:.65rem 1.25rem;display:flex;align-items:center;gap:1rem;font-family:"Barlow Condensed","Arial Narrow",Arial,sans-serif;}',
'#rs-pb-play{width:44px;height:44px;border-radius:50%;background:#ff5500;color:#000;font-size:1.1rem;border:none;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;}',
'#rs-pb-play:hover{background:#ff7722;}',
'#rs-pb-track{flex:1;min-width:0;}',
'#rs-pb-label{font-size:.58rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#ff5500;}',
'#rs-pb-title{font-size:.92rem;font-weight:700;color:#f2f2f2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
'#rs-pb-sub{font-size:.75rem;color:rgba(242,242,242,.5);}',
'#rs-pb-live{display:flex;align-items:center;gap:.35rem;font-size:.68rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#ff5500;flex-shrink:0;}',
'#rs-pb-dot{width:7px;height:7px;border-radius:50%;background:#ff5500;animation:rs-pulse 1.5s ease-in-out infinite;}',
'#rs-pb-close{color:rgba(242,242,242,.4);font-size:1rem;width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:none;border:none;cursor:pointer;flex-shrink:0;}',
'#rs-pb-close:hover{color:#f2f2f2;}',
'@keyframes rs-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.75)}}',
'@media(max-width:900px){#rs-nav{display:none!important}#rs-listen{display:none!important}#rs-ham{display:flex!important}}'
].join('');
document.head.appendChild(style);

/* ── HTML ─────────────────────────────────────────────────────── */
document.body.insertAdjacentHTML('afterbegin', [
'<div id="rs-ticker"><div id="rs-ticker-label">&#9889; THE WIRE</div><div id="rs-ticker-text">LOADING SCOTTISH ROCK NEWS...</div><a href="/rock/wire.html" id="rs-ticker-more">MORE &#8594;</a></div>',
'<nav id="rs-mob"><button id="rs-mob-close">&#x2715;</button><a href="/rock/index.html#genres">Genres</a><a href="/rock/wire.html">The Wire</a><a href="/rock/index.html#tom">Tom Russell</a><a href="/rock/index.html#schedule">Schedule</a><a href="/rock/coverage.html">Coverage</a><a href="/rock/advertise.html" class="rs-mob-cta">Advertise</a><button id="rs-mob-listen">&#9654; Listen Live</button></nav>',
'<div id="rs-player"><div id="rs-player-inner"><button id="rs-pb-play">&#9654;</button><div id="rs-pb-track"><div id="rs-pb-label">Now Playing</div><div id="rs-pb-title">ROCK.SCOT</div><div id="rs-pb-sub">Scotland's Rock Station &mdash; DAB+</div></div><div id="rs-pb-live"><div id="rs-pb-dot"></div>Live</div><button id="rs-pb-close">&#x2715;</button></div></div>',
'<header id="rs-header"><div id="rs-hc"><a href="/rock/index.html" style="line-height:0"><img id="rs-logo" src="/rock/assets/images/logo.png" alt="ROCK.SCOT"></a><nav id="rs-nav"><a href="/rock/index.html#genres" id="rs-n-genres">Genres</a><a href="/rock/wire.html" id="rs-n-wire">The Wire</a><a href="/rock/index.html#tom" id="rs-n-tom">Tom Russell</a><a href="/rock/index.html#schedule" id="rs-n-sched">Schedule</a><a href="/rock/coverage.html" id="rs-n-cov">Coverage</a><a href="/rock/advertise.html" class="rs-cta" id="rs-n-adv">Advertise</a></nav><button id="rs-listen">&#9654; Listen Live</button><button id="rs-ham" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button></div></header>'
].join(''));

/* ── ACTIVE NAV ────────────────────────────────────────────────── */
var path = window.location.pathname;
if (path.indexOf('wire') > -1)      { var el = document.getElementById('rs-n-wire'); if(el) el.classList.add('rs-active'); }
else if (path.indexOf('coverage') > -1) { var el = document.getElementById('rs-n-cov');  if(el) el.classList.add('rs-active'); }
else if (path.indexOf('advertise') > -1){ var el = document.getElementById('rs-n-adv');  if(el) el.classList.add('rs-active'); }

/* ── SCROLL ────────────────────────────────────────────────────── */
window.addEventListener('scroll', function() {
  var h = document.getElementById('rs-header');
  if (h) h.classList.toggle('scrolled', window.scrollY > 80);
}, {passive:true});

/* ── HAMBURGER ─────────────────────────────────────────────────── */
function openNav() {
  var mob = document.getElementById('rs-mob');
  var ham = document.getElementById('rs-ham');
  if (!mob || !ham) return;
  mob.classList.add('open');
  ham.classList.add('open');
  ham.setAttribute('aria-expanded','true');
  document.body.style.overflow = 'hidden';
}
function closeNav() {
  var mob = document.getElementById('rs-mob');
  var ham = document.getElementById('rs-ham');
  if (!mob || !ham) return;
  mob.classList.remove('open');
  ham.classList.remove('open');
  ham.setAttribute('aria-expanded','false');
  document.body.style.overflow = '';
}

var ham = document.getElementById('rs-ham');
var mob = document.getElementById('rs-mob');
var cls = document.getElementById('rs-mob-close');

if (ham) ham.addEventListener('click', function() { mob && mob.classList.contains('open') ? closeNav() : openNav(); });
if (cls) cls.addEventListener('click', closeNav);
if (mob) {
  mob.addEventListener('click', function(e) { if (e.target === mob) closeNav(); });
  mob.querySelectorAll('a').forEach(function(a) { a.addEventListener('click', closeNav); });
}
document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeNav(); });

/* ── PLAYER ────────────────────────────────────────────────────── */
var playerOpen = false, isPlaying = false, playerFrame = null;

function showPlayer() {
  var p = document.getElementById('rs-player');
  if (p) { p.classList.add('open'); playerOpen = true; }
}
function togglePlay() {
  if (!playerFrame) {
    playerFrame = document.createElement('iframe');
    playerFrame.src = 'https://player.broadcast.radio/caledonia-tx-ltd';
    playerFrame.allow = 'autoplay';
    playerFrame.style.cssText = 'position:absolute;width:0;height:0;border:none;opacity:0;pointer-events:none;';
    document.body.appendChild(playerFrame);
  }
  isPlaying = !isPlaying;
  var pb  = document.getElementById('rs-pb-play');
  var tit = document.getElementById('rs-pb-title');
  var sub = document.getElementById('rs-pb-sub');
  if (pb)  pb.textContent  = isPlaying ? '\u23F8' : '\u25B6';
  if (tit) tit.textContent = isPlaying ? 'ROCK.SCOT — Live on DAB+' : 'ROCK.SCOT';
  if (sub) sub.textContent = isPlaying ? 'Broadcasting Now' : "Scotland's Rock Station \u2014 DAB+";
}

var listenBtn  = document.getElementById('rs-listen');
var mobListen  = document.getElementById('rs-mob-listen');
var pbPlay     = document.getElementById('rs-pb-play');
var pbClose    = document.getElementById('rs-pb-close');

if (listenBtn) listenBtn.addEventListener('click', function() { showPlayer(); if (!isPlaying) togglePlay(); });
if (mobListen) mobListen.addEventListener('click', function() { showPlayer(); if (!isPlaying) togglePlay(); closeNav(); });
if (pbPlay)    pbPlay.addEventListener('click', togglePlay);
if (pbClose)   pbClose.addEventListener('click', function() {
  var p = document.getElementById('rs-player');
  if (p) p.classList.remove('open');
});

/* Catch any page-level listen buttons */
document.addEventListener('click', function(e) {
  var t = e.target;
  if (t && (t.getAttribute('data-listen') || t.id === 'hero-listen-btn')) {
    e.preventDefault(); showPlayer(); if (!isPlaying) togglePlay();
  }
}, true);

setTimeout(function() { if (!playerOpen) showPlayer(); }, 5000);

/* ── TICKER & WIRE ─────────────────────────────────────────────── */
var wh = [];

function renderTicker(items) {
  var el = document.getElementById('rs-ticker-text');
  if (!el || !items || !items.length) return;
  wh = items;
  var txt = items.map(function(i){ return '\u26A1 ' + i.title.toUpperCase(); }).join('   \u25C6   ');
  el.textContent = txt + '   \u25C6   ';
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = 'rs-marquee 240s linear infinite';
}

function defaultTicker() {
  var el = document.getElementById('rs-ticker-text');
  if (el) el.textContent = '\u26A1 ROCK.SCOT \u2014 SCOTLAND\'S ROCK STATION   \u25C6   DAB+ DIGITAL RADIO   \u25C6   METAL \u2022 ALT \u2022 PUNK \u2022 CLASSIC ROCK   \u25C6   SEARCH "ROCK.SCOT" ON YOUR DAB+ RADIO   \u25C6   ';
}

function updateHomepageWire(data) {
  var g = document.getElementById('homepage-wire');
  if (!g || !data || !data.length) return;
  g.innerHTML = data.slice(0,3).map(function(s) {
    return '<div class="wire-card">'
      + '<div class="wire-card-genre">' + esc(s.genre || 'Rock') + '</div>'
      + '<div class="wire-card-title">' + esc(s.title) + '</div>'
      + '<div class="wire-card-meta">' + timeAgo(new Date(s.created_at)) + '</div>'
      + '</div>';
  }).join('');
}

function loadTicker() {
  if (!sb) { defaultTicker(); return; }
  sb.from('wire_news')
    .select('title,genre,created_at')
    .eq('is_live', true)
    .order('created_at', {ascending: false})
    .limit(20)
    .then(function(res) {
      if (res.error || !res.data || !res.data.length) { defaultTicker(); return; }
      renderTicker(res.data);
      updateHomepageWire(res.data);
    })
    .catch(function() { defaultTicker(); });
}

function subWire() {
  if (!sb) return;
  try {
    sb.channel('rs-wire-' + Date.now())
      .on('postgres_changes', {event:'INSERT', schema:'public', table:'wire_news', filter:'is_live=eq.true'}, function(p) {
        if (p.new && p.new.title) {
          wh.unshift(p.new);
          if (wh.length > 20) wh.pop();
          renderTicker(wh);
          updateHomepageWire(wh);
        }
      }).subscribe();
  } catch(e) { console.warn('Wire realtime subscribe failed:', e); }
}

function initSB() {
  try {
    if (window.supabase && window.supabase.createClient && SUPA_KEY) {
      sb = window.supabase.createClient(SUPA_URL, SUPA_KEY, {
        realtime: {params: {eventsPerSecond: 10}}
      });
      return true;
    }
  } catch(e) {}
  return false;
}

function bootWire() {
  if (initSB()) {
    loadTicker();
    subWire();
  } else {
    defaultTicker();
    /* Retry every 200ms up to 6s for SDK to finish loading */
    var attempts = 0;
    var timer = setInterval(function() {
      attempts++;
      if (initSB()) {
        clearInterval(timer);
        loadTicker();
        subWire();
      }
      if (attempts >= 30) { clearInterval(timer); }
    }, 200);
  }
}

setInterval(loadTicker, 5 * 60 * 1000);

/* ── HELPERS ───────────────────────────────────────────────────── */
function timeAgo(d) {
  var s = Math.floor((Date.now() - d) / 1000);
  if (s < 3600)  return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ── BOOT ──────────────────────────────────────────────────────── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootWire);
} else {
  bootWire();
}

})();
}
