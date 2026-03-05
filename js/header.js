/* ROCK.SCOT — Persistent Header v4.1
   Injects: header nav, ticker, mobile nav, player into every page.
   Guard prevents double-injection. */
if (window.__rsLoaded) {
} else {
window.__rsLoaded = true;
(function () {
'use strict';
var SUPA_URL = window.SUPABASE_URL  || 'https://pwzeapvopeeoahpyicdm.supabase.co';
var SUPA_KEY = window.SUPABASE_ANON_KEY || '';
var sb = null;

/* STYLES */
var styleEl = document.createElement('style');
styleEl.textContent = '#rs-header{position:fixed;top:0;left:0;right:0;height:64px;background:rgba(6,6,6,.96);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid #1e1e1e;z-index:2000;font-family:"Barlow Condensed","Arial Narrow",Arial,sans-serif;transition:border-color .3s,box-shadow .3s;}'
+'#rs-header.scrolled{border-bottom-color:#ff5500;box-shadow:0 1px 30px rgba(255,85,0,.12);}'
+'#rs-hc{max-width:1300px;margin:0 auto;padding:0 1.25rem;height:100%;display:flex;align-items:center;gap:1rem;}'
+'#rs-logo{height:42px;width:auto;flex-shrink:0;display:block;transition:filter .2s;}'
+'#rs-logo:hover{filter:drop-shadow(0 0 10px rgba(255,85,0,.6));}'
+'#rs-nav{display:flex;align-items:center;gap:.2rem;margin-left:auto;}'
+'#rs-nav a{font-size:.88rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(242,242,242,.55);padding:.4rem .65rem;border-radius:3px;text-decoration:none;white-space:nowrap;transition:color .15s,background .15s;}'
+'#rs-nav a:hover,#rs-nav a.rs-active{color:#f2f2f2;background:rgba(255,255,255,.07);}'
+'#rs-nav a.rs-cta{color:#ff5500;border:1px solid rgba(255,85,0,.5);}'
+'#rs-nav a.rs-cta:hover{background:#ff5500;color:#000;border-color:#ff5500;}'
+'#rs-listen{background:#ff5500;color:#000;font-family:"Barlow Condensed","Arial Narrow",Arial,sans-serif;font-size:.82rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase;padding:.45rem 1rem;border-radius:3px;border:none;cursor:pointer;white-space:nowrap;flex-shrink:0;}'
+'#rs-listen:hover{background:#ff7722;}'
+'#rs-ham{display:none;flex-direction:column;justify-content:center;gap:5px;width:44px;height:44px;padding:10px;background:none;border:none;cursor:pointer;margin-left:auto;flex-shrink:0;}'
+'#rs-ham span{display:block;height:2px;background:#f2f2f2;border-radius:2px;transition:all .3s cubic-bezier(.4,0,.2,1);transform-origin:center;}'
+'#rs-ham.open span:nth-child(1){transform:translateY(7px) rotate(45deg);background:#ff5500;}'
+'#rs-ham.open span:nth-child(2){opacity:0;transform:scaleX(0);}'
+'#rs-ham.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg);background:#ff5500;}'
+'#rs-mob{position:fixed;inset:0;background:rgba(6,6,6,.98);backdrop-filter:blur(20px);z-index:1999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.3rem;opacity:0;pointer-events:none;transition:opacity .3s cubic-bezier(.4,0,.2,1);}'
+'#rs-mob.open{opacity:1;pointer-events:all;}'
+'#rs-mob a{font-family:"Bebas Neue","Impact",sans-serif;font-size:clamp(2.2rem,8vw,3.2rem);letter-spacing:.05em;color:#f2f2f2;text-decoration:none;padding:.15rem 0;transition:color .15s;text-align:center;}'
+'#rs-mob a:hover{color:#ff5500;}'
+'#rs-mob a.rs-mob-cta{color:#ff5500;}'
+'#rs-mob-close{position:absolute;top:1.5rem;right:1.5rem;font-size:1.5rem;color:rgba(242,242,242,.5);background:none;border:none;cursor:pointer;width:44px;height:44px;display:flex;align-items:center;justify-content:center;transition:color .2s,transform .2s;}'
+'#rs-mob-close:hover{color:#ff5500;transform:rotate(90deg);}'
+'#rs-mob-listen{margin-top:.75rem;background:#ff5500;color:#000;font-family:"Barlow Condensed","Arial Narrow",Arial,sans-serif;font-size:1.1rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase;padding:.75rem 2.5rem;border-radius:3px;border:none;cursor:pointer;}'
+'#rs-mob-listen:hover{background:#ff7722;}'
+'#rs-ticker{position:fixed;top:64px;left:0;right:0;height:34px;background:#ff5500;display:flex;align-items:center;overflow:hidden;z-index:1990;}'
+'#rs-ticker-label{background:#000;color:#ff5500;font-family:"Barlow Condensed","Arial Narrow",Arial,sans-serif;font-size:.68rem;font-weight:900;letter-spacing:.2em;text-transform:uppercase;padding:0 1rem;height:100%;display:flex;align-items:center;white-space:nowrap;flex-shrink:0;border-right:1px solid rgba(255,85,0,.3);}'
+'#rs-ticker-scroll{flex:1;overflow:hidden;height:100%;display:flex;align-items:center;}'
+'#rs-ticker-text{font-family:"Barlow Condensed","Arial Narrow",Arial,sans-serif;font-size:.83rem;font-weight:700;color:#000;white-space:nowrap;will-change:transform;display:inline-block;}'
+'#rs-ticker-more{background:rgba(0,0,0,.28);color:#000;font-family:"Barlow Condensed","Arial Narrow",Arial,sans-serif;font-size:.63rem;font-weight:900;letter-spacing:.15em;text-transform:uppercase;padding:0 .75rem;height:100%;display:flex;align-items:center;white-space:nowrap;flex-shrink:0;border-left:1px solid rgba(0,0,0,.18);text-decoration:none;}'
+'#rs-ticker-more:hover{background:rgba(0,0,0,.5);}'
+'#rs-player{position:fixed;bottom:0;left:0;right:0;background:rgba(6,6,6,.97);backdrop-filter:blur(16px);border-top:1px solid #1e1e1e;z-index:1980;transform:translateY(100%);transition:transform .35s cubic-bezier(.4,0,.2,1);}'
+'#rs-player.open{transform:translateY(0);}'
+'#rs-player-inner{max-width:1300px;margin:0 auto;padding:.65rem 1.25rem;display:flex;align-items:center;gap:1rem;font-family:"Barlow Condensed","Arial Narrow",Arial,sans-serif;}'
+'#rs-pb-play{width:44px;height:44px;border-radius:50%;background:#ff5500;color:#000;font-size:1rem;border:none;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:transform .2s;}'
+'#rs-pb-play:hover{transform:scale(1.1);}'
+'#rs-pb-track{flex:1;min-width:0;}'
+'#rs-pb-label{font-size:.58rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#ff5500;}'
+'#rs-pb-title{font-size:.92rem;font-weight:700;color:#f2f2f2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'
+'#rs-pb-sub{font-size:.75rem;color:rgba(242,242,242,.5);}'
+'#rs-pb-live{display:flex;align-items:center;gap:.35rem;font-size:.68rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#ff5500;flex-shrink:0;}'
+'#rs-pb-dot{width:7px;height:7px;border-radius:50%;background:#ff5500;animation:rs-dot 1.4s ease-in-out infinite;}'
+'#rs-pb-close{color:rgba(242,242,242,.4);font-size:1rem;width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:none;border:none;cursor:pointer;flex-shrink:0;}'
+'#rs-pb-close:hover{color:#f2f2f2;}'
+'@keyframes rs-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}'
+'@media(max-width:900px){#rs-nav{display:none!important}#rs-listen{display:none!important}#rs-ham{display:flex!important}}';
document.head.appendChild(styleEl);

/* HTML - use wrapper div, insert children in correct order */
var wrap = document.createElement('div');
wrap.innerHTML =
  '<header id="rs-header"><div id="rs-hc">'
  +'<a href="/rock/index.html" style="line-height:0;flex-shrink:0;"><img id="rs-logo" src="/rock/assets/images/logo.png" alt="ROCK.SCOT"></a>'
  +'<nav id="rs-nav">'
  +'<a href="/rock/index.html#genres" id="rs-n-genres">Genres</a>'
  +'<a href="/rock/wire.html" id="rs-n-wire">The Wire</a>'
  +'<a href="/rock/index.html#tom" id="rs-n-tom">Tom Russell</a>'
  +'<a href="/rock/index.html#schedule" id="rs-n-sched">Schedule</a>'
  +'<a href="/rock/coverage.html" id="rs-n-cov">Coverage</a>'
  +'<a href="/rock/advertise.html" class="rs-cta" id="rs-n-adv">Advertise</a>'
  +'</nav>'
  +'<button id="rs-listen">&#9654; Listen Live</button>'
  +'<button id="rs-ham" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button>'
  +'</div></header>'
  +'<div id="rs-ticker">'
  +'<div id="rs-ticker-label">&#9889; THE WIRE</div>'
  +'<div id="rs-ticker-scroll"><div id="rs-ticker-text">&#9889; LOADING NEWS...</div></div>'
  +'<a href="/rock/wire.html" id="rs-ticker-more">MORE &#8594;</a>'
  +'</div>'
  +'<nav id="rs-mob">'
  +'<button id="rs-mob-close">&#x2715;</button>'
  +'<a href="/rock/index.html#genres">Genres</a>'
  +'<a href="/rock/wire.html">The Wire</a>'
  +'<a href="/rock/index.html#tom">Tom Russell</a>'
  +'<a href="/rock/index.html#schedule">Schedule</a>'
  +'<a href="/rock/coverage.html">Coverage</a>'
  +'<a href="/rock/advertise.html" class="rs-mob-cta">Advertise</a>'
  +'<button id="rs-mob-listen">&#9654; Listen Live</button>'
  +'</nav>'
  +'<div id="rs-player"><div id="rs-player-inner">'
  +'<button id="rs-pb-play">&#9654;</button>'
  +'<div id="rs-pb-track"><div id="rs-pb-label">Now Playing</div><div id="rs-pb-title">ROCK.SCOT</div><div id="rs-pb-sub">Scotland\'s Rock Station &mdash; DAB+</div></div>'
  +'<div id="rs-pb-live"><div id="rs-pb-dot"></div>Live</div>'
  +'<button id="rs-pb-close">&#x2715;</button>'
  +'</div></div>';

var ref = document.body.firstChild;
while (wrap.firstChild) { document.body.insertBefore(wrap.firstChild, ref); }

/* ACTIVE NAV */
var path = window.location.pathname;
[['wire','rs-n-wire'],['coverage','rs-n-cov'],['advertise','rs-n-adv']].forEach(function(p){
  if(path.indexOf(p[0])>-1){ var el=document.getElementById(p[1]); if(el) el.classList.add('rs-active'); }
});

/* SCROLL */
window.addEventListener('scroll',function(){
  var h=document.getElementById('rs-header');
  if(h) h.classList.toggle('scrolled',window.scrollY>80);
},{passive:true});

/* HAMBURGER */
function openNav(){
  var m=document.getElementById('rs-mob'),h=document.getElementById('rs-ham');
  if(!m||!h) return;
  m.classList.add('open'); h.classList.add('open'); h.setAttribute('aria-expanded','true'); document.body.style.overflow='hidden';
}
function closeNav(){
  var m=document.getElementById('rs-mob'),h=document.getElementById('rs-ham');
  if(!m||!h) return;
  m.classList.remove('open'); h.classList.remove('open'); h.setAttribute('aria-expanded','false'); document.body.style.overflow='';
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

/* PLAYER */
var playerOpen=false,isPlaying=false,playerFrame=null;
function showPlayer(){
  var p=document.getElementById('rs-player');
  if(p&&!playerOpen){ p.classList.add('open'); playerOpen=true; }
}
function togglePlay(){
  if(!playerFrame){
    playerFrame=document.createElement('iframe');
    playerFrame.src='https://player.broadcast.radio/caledonia-tx-ltd';
    playerFrame.allow='autoplay';
    playerFrame.style.cssText='position:absolute;width:0;height:0;border:none;opacity:0;pointer-events:none;';
    document.body.appendChild(playerFrame);
  }
  isPlaying=!isPlaying;
  var pb=document.getElementById('rs-pb-play'),tit=document.getElementById('rs-pb-title'),sub=document.getElementById('rs-pb-sub');
  if(pb)  pb.innerHTML=isPlaying?'&#9646;&#9646;':'&#9654;';
  if(tit) tit.textContent=isPlaying?'ROCK.SCOT \u2014 Live on DAB+':'ROCK.SCOT';
  if(sub) sub.textContent=isPlaying?'Broadcasting Now':"Scotland's Rock Station \u2014 DAB+";
}
var listenBtn=document.getElementById('rs-listen');
var mobListen=document.getElementById('rs-mob-listen');
var pbPlay=document.getElementById('rs-pb-play');
var pbClose=document.getElementById('rs-pb-close');
if(listenBtn) listenBtn.addEventListener('click',function(){ showPlayer(); if(!isPlaying) togglePlay(); });
if(mobListen) mobListen.addEventListener('click',function(){ showPlayer(); if(!isPlaying) togglePlay(); closeNav(); });
if(pbPlay) pbPlay.addEventListener('click',togglePlay);
if(pbClose) pbClose.addEventListener('click',function(){ var p=document.getElementById('rs-player'); if(p){ p.classList.remove('open'); playerOpen=false; } });
document.addEventListener('click',function(e){
  var t=e.target;
  if(t&&(t.id==='hero-listen-btn'||t.getAttribute('data-listen'))){ e.preventDefault(); showPlayer(); if(!isPlaying) togglePlay(); }
},true);
setTimeout(function(){ showPlayer(); },6000);

/* TICKER (JS-driven scroll — no CSS animation conflicts) */
var tickerEl=null, tickerPos=0, tickerRAF=null;
function tickerStep(){
  if(!tickerEl) return;
  tickerPos-=0.5;
  var half=tickerEl.offsetWidth/2;
  if(Math.abs(tickerPos)>=half) tickerPos=0;
  tickerEl.style.transform='translateX('+tickerPos+'px)';
  tickerRAF=requestAnimationFrame(tickerStep);
}
function startTicker(){
  tickerEl=document.getElementById('rs-ticker-text');
  if(!tickerEl) return;
  tickerPos=0;
  if(tickerRAF) cancelAnimationFrame(tickerRAF);
  tickerRAF=requestAnimationFrame(tickerStep);
}
function setTickerText(txt){
  tickerEl=document.getElementById('rs-ticker-text');
  if(!tickerEl) return;
  tickerEl.textContent=txt+'   \u25C6   '+txt+'   \u25C6   ';
  tickerPos=0;
  if(tickerRAF) cancelAnimationFrame(tickerRAF);
  setTimeout(startTicker,50);
}
function defaultTicker(){
  setTickerText('\u26A1 ROCK.SCOT \u2014 SCOTLAND\'S ROCK STATION   \u25C6   DAB+ DIGITAL RADIO   \u25C6   METAL \u2022 ALT \u2022 PUNK \u2022 CLASSIC ROCK   \u25C6   SEARCH "ROCK.SCOT" ON YOUR DAB+ RADIO');
}

/* WIRE DATA */
var wireCache=[];
function renderTicker(items){
  if(!items||!items.length){ defaultTicker(); return; }
  wireCache=items;
  setTickerText(items.map(function(i){ return '\u26A1 '+String(i.title).toUpperCase(); }).join('   \u25C6   '));
}
function updateHomepageWire(items){
  var grid=document.getElementById('homepage-wire');
  if(!grid||!items||!items.length) return;
  grid.innerHTML=items.slice(0,3).map(function(s){
    var link=s.source_url&&s.source_url.startsWith('http')?s.source_url:null;
    var src=s.source_name?escH(s.source_name):'ROCK.SCOT';
    return '<div class="wire-card"'+(link?' style="cursor:pointer;" onclick="window.open(\''+escA(s.source_url)+'\',\'_blank\',\'noopener\')"':'')+' >'
      +'<div class="wire-card-genre">'+escH(s.genre||'Rock')+'</div>'
      +'<div class="wire-card-title">'+escH(s.title||'')+'</div>'
      +'<div class="wire-card-meta"><span class="wire-card-source">\uD83D\uDCF0 '+src+'</span><span class="wire-card-time">'+timeAgo(s.created_at)+'</span></div>'
      +(link?'<div style="margin-top:.5rem;font-size:.75rem;color:var(--orange,#ff5500);font-family:\'Barlow Condensed\',sans-serif;font-weight:700;letter-spacing:.08em;">READ FULL STORY \u2197</div>':'')
      +'</div>';
  }).join('');
}
function loadWireData(){
  if(!sb){ defaultTicker(); return; }
  sb.from('wire_news').select('id,title,summary,source_url,source_name,genre,created_at')
    .eq('is_live',true).order('created_at',{ascending:false}).limit(25)
    .then(function(res){ if(res.error||!res.data||!res.data.length){ defaultTicker(); return; } renderTicker(res.data); updateHomepageWire(res.data); })
    .catch(function(){ defaultTicker(); });
}
function subscribeWire(){
  if(!sb) return;
  try {
    sb.channel('rs-wire-'+Date.now()).on('postgres_changes',{event:'INSERT',schema:'public',table:'wire_news',filter:'is_live=eq.true'},function(p){
      if(p.new&&p.new.title){ wireCache.unshift(p.new); if(wireCache.length>25) wireCache.pop(); renderTicker(wireCache); updateHomepageWire(wireCache); }
    }).subscribe();
  } catch(e){ console.warn('[ROCK.SCOT] realtime:',e); }
}
function initSupabase(){
  try {
    if(window.supabase&&typeof window.supabase.createClient==='function'&&SUPA_KEY){
      sb=window.supabase.createClient(SUPA_URL,SUPA_KEY,{realtime:{params:{eventsPerSecond:10}}});
      return true;
    }
  } catch(e){}
  return false;
}
function bootWire(){
  startTicker();
  if(initSupabase()){ loadWireData(); subscribeWire(); }
  else {
    defaultTicker();
    var n=0,t=setInterval(function(){
      n++;
      if(initSupabase()){ clearInterval(t); loadWireData(); subscribeWire(); }
      if(n>=50) clearInterval(t);
    },200);
  }
}
setInterval(loadWireData,5*60*1000);

function timeAgo(d){ var s=Math.floor((Date.now()-new Date(d))/1000); if(s<3600) return Math.floor(s/60)+'m ago'; if(s<86400) return Math.floor(s/3600)+'h ago'; return Math.floor(s/86400)+'d ago'; }
function escH(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escA(s){ return String(s).replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',bootWire); } else { bootWire(); }

})();
}
