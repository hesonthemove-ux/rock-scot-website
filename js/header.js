/* ROCK.SCOT — Persistent Header v5.0
   Works whether loaded from <head> or <body>.
   Self-contained: no dependency on Supabase SDK being loaded first. */
if (window.__rsLoaded) { /* already injected */ } else {
window.__rsLoaded = true;

var SUPA_URL = 'https://pwzeapvopeeoahpyicdm.supabase.co';
var SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3emVhcHZvcGVlb2FocHlpY2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNjg3NDEsImV4cCI6MjA4Njc0NDc0MX0.rc8IqfQF537UA5iWarxDia174HyCZ_xc2VPWOWdGxYk';

/* ── STYLES: inject into <head> immediately (safe before body) ── */
var styleEl = document.createElement('style');
styleEl.textContent = '#rs-header{position:fixed;top:0;left:0;right:0;height:64px;background:rgba(6,6,6,.97);border-bottom:2px solid #1e1e1e;z-index:2000;font-family:"Barlow Condensed","Arial Narrow",Arial,sans-serif;transition:border-color .3s;}'
+'#rs-header.scrolled{border-bottom-color:#ff5500;}'
+'#rs-hc{max-width:1300px;margin:0 auto;padding:0 1.25rem;height:100%;display:flex;align-items:center;gap:1rem;}'
+'#rs-logo{height:42px;width:auto;flex-shrink:0;display:block;}'
+'#rs-nav{display:flex;align-items:center;gap:.2rem;margin-left:auto;}'
+'#rs-nav a{font-size:.88rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(242,242,242,.6);padding:.4rem .65rem;border-radius:3px;text-decoration:none;white-space:nowrap;transition:color .15s,background .15s;}'
+'#rs-nav a:hover,#rs-nav a.rs-active{color:#f2f2f2;background:rgba(255,255,255,.08);}'
+'#rs-nav a.rs-cta{color:#ff5500;border:1px solid rgba(255,85,0,.5);}'
+'#rs-nav a.rs-cta:hover{background:#ff5500;color:#000;}'
+'#rs-listen{background:#ff5500;color:#000;font-family:"Barlow Condensed","Arial Narrow",Arial,sans-serif;font-size:.82rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase;padding:.45rem 1rem;border-radius:3px;border:none;cursor:pointer;white-space:nowrap;flex-shrink:0;}'
+'#rs-listen:hover{background:#ff7722;}'
+'#rs-ham{display:none;flex-direction:column;justify-content:center;gap:5px;width:44px;height:44px;padding:10px;background:none;border:none;cursor:pointer;margin-left:auto;flex-shrink:0;}'
+'#rs-ham span{display:block;height:2px;background:#f2f2f2;border-radius:2px;transition:all .3s cubic-bezier(.4,0,.2,1);transform-origin:center;}'
+'#rs-ham.open span:nth-child(1){transform:translateY(7px) rotate(45deg);background:#ff5500;}'
+'#rs-ham.open span:nth-child(2){opacity:0;transform:scaleX(0);}'
+'#rs-ham.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg);background:#ff5500;}'
+'#rs-mob{position:fixed;inset:0;background:rgba(6,6,6,.99);z-index:1999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.3rem;opacity:0;pointer-events:none;transition:opacity .3s;}'
+'#rs-mob.open{opacity:1;pointer-events:all;}'
+'#rs-mob a{font-family:"Bebas Neue","Impact",sans-serif;font-size:clamp(2.4rem,9vw,3.5rem);letter-spacing:.05em;color:#f2f2f2;text-decoration:none;padding:.2rem 0;transition:color .15s;text-align:center;display:block;}'
+'#rs-mob a:hover,#rs-mob a.rs-mob-cta{color:#ff5500;}'
+'#rs-mob-close{position:absolute;top:1.5rem;right:1.5rem;font-size:2rem;color:rgba(242,242,242,.6);background:none;border:none;cursor:pointer;line-height:1;padding:.5rem;}'
+'#rs-mob-close:hover{color:#ff5500;}'
+'#rs-mob-listen{margin-top:1rem;background:#ff5500;color:#000;font-family:"Barlow Condensed","Arial Narrow",Arial,sans-serif;font-size:1.1rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase;padding:.75rem 2.5rem;border-radius:3px;border:none;cursor:pointer;}'
+'#rs-mob-listen:hover{background:#ff7722;}'
+'#rs-ticker{position:fixed;top:64px;left:0;right:0;height:34px;background:#ff5500;display:flex;align-items:center;overflow:hidden;z-index:1990;}'
+'#rs-ticker-label{background:#000;color:#ff5500;font-family:"Barlow Condensed","Arial Narrow",Arial,sans-serif;font-size:.68rem;font-weight:900;letter-spacing:.2em;text-transform:uppercase;padding:0 1rem;height:100%;display:flex;align-items:center;white-space:nowrap;flex-shrink:0;border-right:1px solid rgba(255,85,0,.3);}'
+'#rs-ticker-inner{flex:1;overflow:hidden;height:100%;position:relative;}'
+'#rs-ticker-text{font-family:"Barlow Condensed","Arial Narrow",Arial,sans-serif;font-size:.83rem;font-weight:700;color:#000;white-space:nowrap;position:absolute;top:50%;transform:translateY(-50%);will-change:transform;}'
+'#rs-ticker-more{background:rgba(0,0,0,.28);color:#000;font-family:"Barlow Condensed","Arial Narrow",Arial,sans-serif;font-size:.63rem;font-weight:900;letter-spacing:.15em;text-transform:uppercase;padding:0 .75rem;height:100%;display:flex;align-items:center;white-space:nowrap;flex-shrink:0;border-left:1px solid rgba(0,0,0,.18);text-decoration:none;}'
+'#rs-ticker-more:hover{background:rgba(0,0,0,.5);}'
+'#rs-player{position:fixed;bottom:0;left:0;right:0;background:rgba(6,6,6,.98);border-top:1px solid #242424;z-index:1980;transform:translateY(100%);transition:transform .35s cubic-bezier(.4,0,.2,1);}'
+'#rs-player.open{transform:translateY(0);}'
+'#rs-player-inner{max-width:1300px;margin:0 auto;padding:.65rem 1.25rem;display:flex;align-items:center;gap:1rem;font-family:"Barlow Condensed","Arial Narrow",Arial,sans-serif;}'
+'#rs-pb-play{width:44px;height:44px;border-radius:50%;background:#ff5500;color:#000;font-size:1rem;border:none;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;}'
+'#rs-pb-play:hover{background:#ff7722;}'
+'#rs-pb-track{flex:1;min-width:0;}'
+'#rs-pb-label{font-size:.58rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#ff5500;}'
+'#rs-pb-title{font-size:.92rem;font-weight:700;color:#f2f2f2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'
+'#rs-pb-sub{font-size:.75rem;color:rgba(242,242,242,.5);}'
+'#rs-pb-live{display:flex;align-items:center;gap:.35rem;font-size:.68rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#ff5500;flex-shrink:0;}'
+'#rs-pb-dot{width:7px;height:7px;border-radius:50%;background:#ff5500;animation:rs-dot 1.4s ease-in-out infinite;}'
+'#rs-pb-close{color:rgba(242,242,242,.4);font-size:1.1rem;width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:none;border:none;cursor:pointer;flex-shrink:0;}'
+'#rs-pb-close:hover{color:#f2f2f2;}'
+'@keyframes rs-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}'
+'@media(max-width:900px){#rs-nav{display:none!important}#rs-listen{display:none!important}#rs-ham{display:flex!important}}'
+''; /* pages handle their own top offset via margin-top:98px */
document.head.appendChild(styleEl);

/* ── ALL DOM WORK DEFERRED until body exists ────────────────────── */
function injectHeader() {
  if (!document.body) { setTimeout(injectHeader, 10); return; }

  var wrap = document.createElement('div');
  wrap.innerHTML =
    '<header id="rs-header"><div id="rs-hc">'
    +'<a href="/rock/index.html" style="line-height:0;flex-shrink:0;">'
    +'<img id="rs-logo" src="/rock/assets/images/logo.png" alt="ROCK.SCOT"></a>'
    +'<nav id="rs-nav">'
    +'<a href="/rock/index.html#genres" id="rs-n-genres">Genres</a>'
    +'<a href="/rock/wire.html" id="rs-n-wire">The Wire</a>'
    +'<a href="/rock/index.html#tom" id="rs-n-tom">Tom Russell</a>'
    +'<a href="/rock/index.html#schedule" id="rs-n-sched">Schedule</a>'
    +'<a href="/rock/coverage.html" id="rs-n-cov">Coverage</a>'
    +'<a href="/rock/advertise.html" class="rs-cta" id="rs-n-adv">Advertise</a>'
    +'</nav>'
    +'<button id="rs-listen">&#9654; Listen Live</button>'
    +'<button id="rs-ham" aria-label="Open menu" aria-expanded="false">'
    +'<span></span><span></span><span></span></button>'
    +'</div></header>'
    +'<div id="rs-ticker"><div id="rs-ticker-label">&#9889; THE WIRE</div>'
    +'<div id="rs-ticker-inner"><div id="rs-ticker-text">&#9889; ROCK.SCOT — SCOTLAND\'S ROCK STATION</div></div>'
    +'<a href="/rock/wire.html" id="rs-ticker-more">MORE &#8594;</a></div>'
    +'<nav id="rs-mob"><button id="rs-mob-close">&#x2715;</button>'
    +'<a href="/rock/index.html#genres">Genres</a>'
    +'<a href="/rock/wire.html">The Wire</a>'
    +'<a href="/rock/index.html#tom">Tom Russell</a>'
    +'<a href="/rock/index.html#schedule">Schedule</a>'
    +'<a href="/rock/coverage.html">Coverage</a>'
    +'<a href="/rock/advertise.html" class="rs-mob-cta">Advertise</a>'
    +'<button id="rs-mob-listen">&#9654; Listen Live</button></nav>'
    +'<div id="rs-player"><div id="rs-player-inner">'
    +'<button id="rs-pb-play">&#9654;</button>'
    +'<div id="rs-pb-track"><div id="rs-pb-label">Now Playing</div>'
    +'<div id="rs-pb-title">ROCK.SCOT</div>'
    +'<div id="rs-pb-sub">Scotland\'s Rock Station &mdash; DAB+</div>'
    +'<div id="rs-pb-iframe-wrap" style="display:none;margin-top:4px;width:100%;"></div>'
    +'</div>'
    +'<div id="rs-pb-live"><div id="rs-pb-dot"></div>Live</div>'
    +'<button id="rs-pb-close">&#x2715;</button>'
    +'</div></div>';

  var ref = document.body.firstChild;
  while (wrap.firstChild) { document.body.insertBefore(wrap.firstChild, ref); }

  /* Active nav */
  var path = window.location.pathname;
  [['wire','rs-n-wire'],['coverage','rs-n-cov'],['advertise','rs-n-adv']].forEach(function(p){
    if(path.indexOf(p[0])>-1){ var el=document.getElementById(p[1]); if(el) el.classList.add('rs-active'); }
  });

  /* Scroll */
  window.addEventListener('scroll',function(){
    var h=document.getElementById('rs-header');
    if(h) h.classList.toggle('scrolled',window.scrollY>80);
  },{passive:true});

  /* Hamburger */
  function openNav(){
    var m=document.getElementById('rs-mob'),h=document.getElementById('rs-ham');
    if(!m||!h) return;
    m.classList.add('open'); h.classList.add('open');
    h.setAttribute('aria-expanded','true'); document.body.style.overflow='hidden';
  }
  function closeNav(){
    var m=document.getElementById('rs-mob'),h=document.getElementById('rs-ham');
    if(!m||!h) return;
    m.classList.remove('open'); h.classList.remove('open');
    h.setAttribute('aria-expanded','false'); document.body.style.overflow='';
  }
  var hamEl=document.getElementById('rs-ham');
  var mobEl=document.getElementById('rs-mob');
  var closeEl=document.getElementById('rs-mob-close');
  if(hamEl) hamEl.addEventListener('click',function(){ mobEl&&mobEl.classList.contains('open')?closeNav():openNav(); });
  if(closeEl) closeEl.addEventListener('click',closeNav);
  if(mobEl){
    mobEl.addEventListener('click',function(e){ if(e.target===mobEl) closeNav(); });
    mobEl.querySelectorAll('a').forEach(function(a){ a.addEventListener('click',closeNav); });
  }
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') closeNav(); });

  /* Player */
  var playerOpen=false,isPlaying=false,playerFrame=null;
  function showPlayer(){
    var p=document.getElementById('rs-player');
    if(p&&!playerOpen){ p.classList.add('open'); playerOpen=true; }
  }
  function togglePlay(){
    var pb=document.getElementById('rs-pb-play');
    var tit=document.getElementById('rs-pb-title');
    var sub=document.getElementById('rs-pb-sub');
    var container=document.getElementById('rs-pb-iframe-wrap');
    if(!playerFrame){
      // Create visible iframe in player bar - required for autoplay policy compliance
      playerFrame=document.createElement('iframe');
      playerFrame.src='https://player.broadcast.radio/caledonia-tx-ltd';
      playerFrame.allow='autoplay; encrypted-media';
      playerFrame.allowFullscreen=false;
      playerFrame.scrolling='no';
      playerFrame.style.cssText='width:100%;height:52px;border:none;display:block;border-radius:3px;overflow:hidden;';
      if(container){ container.innerHTML=''; container.appendChild(playerFrame); }
      else { document.body.appendChild(playerFrame); }
      isPlaying=true;
    } else {
      isPlaying=!isPlaying;
      // Toggle iframe visibility
      if(container) container.style.display=isPlaying?'block':'none';
    }
    if(pb) pb.innerHTML=isPlaying?'&#9646;&#9646;':'&#9654;';
    if(tit) tit.textContent=isPlaying?'ROCK.SCOT — Live on DAB+':'ROCK.SCOT';
    if(sub) sub.textContent=isPlaying?'Broadcasting Now':"Scotland's Rock Station — DAB+";
    // Persist play state across page navigation
    try { sessionStorage.setItem('rs_playing', isPlaying?'1':'0'); } catch(e){}
  }
  var listenBtn=document.getElementById('rs-listen');
  var mobListen=document.getElementById('rs-mob-listen');
  var pbPlay=document.getElementById('rs-pb-play');
  var pbClose=document.getElementById('rs-pb-close');
  if(listenBtn) listenBtn.addEventListener('click',function(){ showPlayer(); if(!isPlaying) togglePlay(); });
  if(mobListen) mobListen.addEventListener('click',function(){ showPlayer(); if(!isPlaying) togglePlay(); closeNav(); });
  if(pbPlay) pbPlay.addEventListener('click',togglePlay);
  if(pbClose) pbClose.addEventListener('click',function(){
    var p=document.getElementById('rs-player'); if(p){ p.classList.remove('open'); playerOpen=false; }
  });
  document.addEventListener('click',function(e){
    var t=e.target;
    if(t&&(t.id==='hero-listen-btn'||t.getAttribute('data-listen'))){
      e.preventDefault(); showPlayer(); if(!isPlaying) togglePlay();
    }
  },true);
  // Auto-resume stream if playing on previous page
  try {
    if(sessionStorage.getItem('rs_playing')==='1'){
      showPlayer();
      setTimeout(function(){ if(!isPlaying) togglePlay(); },800);
    } else {
      setTimeout(function(){ showPlayer(); },6000);
    }
  } catch(e){ setTimeout(function(){ showPlayer(); },6000); }

  /* Ticker scroll animation */
  var tickerEl=null,tickerX=0,tickerRAF=null;
  function tickerStep(){
    if(!tickerEl) return;
    tickerX-=0.4;
    if(Math.abs(tickerX)>=tickerEl.scrollWidth/2) tickerX=0;
    tickerEl.style.transform='translateY(-50%) translateX('+tickerX+'px)';
    tickerRAF=requestAnimationFrame(tickerStep);
  }
  function setTicker(txt){
    tickerEl=document.getElementById('rs-ticker-text');
    if(!tickerEl) return;
    var t=txt+'   \u25C6   '+txt+'   \u25C6   ';
    tickerEl.textContent=t;
    tickerX=0;
    if(tickerRAF) cancelAnimationFrame(tickerRAF);
    setTimeout(function(){ tickerRAF=requestAnimationFrame(tickerStep); },100);
  }
  function defaultTicker(){
    setTicker('\u26A1 ROCK.SCOT \u2014 SCOTLAND\'S ROCK STATION   \u25C6   DAB+ DIGITAL RADIO   \u25C6   METAL \u2022 ALT \u2022 PUNK \u2022 CLASSIC ROCK   \u25C6   SEARCH "ROCK.SCOT" ON YOUR DAB+ RADIO');
  }

  /* Wire data — fetch directly via REST API (no SDK needed, Brave-safe) */
  var wireCache=[];
  function fetchWireREST(){
    var url=SUPA_URL+'/rest/v1/wire_news?select=id,title,summary,genre,source_name,source_url,created_at&is_live=eq.true&order=created_at.desc&limit=25';
    fetch(url,{
      headers:{
        'apikey': SUPA_KEY,
        'Authorization': 'Bearer '+SUPA_KEY,
        'Content-Type': 'application/json'
      }
    })
    .then(function(r){ return r.json(); })
    .then(function(data){
      if(Array.isArray(data)&&data.length>0){
        wireCache=data;
        setTicker(data.map(function(i){ return '\u26A1 '+String(i.title).toUpperCase(); }).join('   \u25C6   '));
        updateHomepageWire(data);
      } else {
        defaultTicker();
        updateHomepageWire(null);
      }
    })
    .catch(function(){ defaultTicker(); });
  }

  function updateHomepageWire(items){
    var grid=document.getElementById('homepage-wire');
    if(!grid) return;
    if(!items||!items.length){ return; }
    window.__hwWireData=items.slice(0,3);
    grid.innerHTML=window.__hwWireData.map(function(s,i){
      var src=s.source_name?escH(s.source_name):'ROCK.SCOT';
      return '<div class="wire-card" style="cursor:pointer;" role="button" tabindex="0" data-hwi="'+i+'">'
        +'<div class="wire-card-genre">'+escH(s.genre||'Rock')+'</div>'
        +'<div class="wire-card-title">'+escH(s.title||'')+'</div>'
        +'<div class="wire-card-meta">'+escH(src)+' &bull; '+timeAgo(s.created_at)+'</div>'
        +'</div>';
    }).join('');
    // Delegated handler - no inline JS, no quote escaping issues
    grid.onclick=function(e){
      var card=e.target.closest('[data-hwi]');
      if(card&&typeof window.hwOpenModal==='function') window.hwOpenModal(+card.getAttribute('data-hwi'));
    };
    grid.onkeydown=function(e){
      if(e.key==='Enter'||e.key===' '){
        var card=e.target.closest('[data-hwi]');
        if(card&&typeof window.hwOpenModal==='function'){ e.preventDefault(); window.hwOpenModal(+card.getAttribute('data-hwi')); }
      }
    };
  }

  setInterval(fetchWireREST, 5*60*1000);
  fetchWireREST();
}

function escH(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escA(s){ return String(s).replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function timeAgo(d){
  var s=Math.floor((Date.now()-new Date(d))/1000);
  if(s<3600) return Math.floor(s/60)+'m ago';
  if(s<86400) return Math.floor(s/3600)+'h ago';
  return Math.floor(s/86400)+'d ago';
}

/* Boot — safe from anywhere */
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded', injectHeader);
} else {
  injectHeader();
}

} /* end guard */
