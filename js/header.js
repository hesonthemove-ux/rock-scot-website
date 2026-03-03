(function(){'use strict';
var SUPABASE_URL=window.SUPABASE_URL||'https://pwzeapvopeeoahpyicdm.supabase.co';
var SUPABASE_KEY=window.SUPABASE_ANON_KEY||'';
var sb=null;
var H=['<style>',
'#rs-header{position:fixed;top:0;left:0;right:0;height:64px;background:#080808;border-bottom:1px solid #242424;z-index:2000;font-family:"Barlow Condensed","Arial Narrow",Arial,sans-serif;}',
'#rs-header.scrolled{border-bottom-color:#ff5500;}',
'#rs-hc{max-width:1300px;margin:0 auto;padding:0 1.25rem;height:100%;display:flex;align-items:center;gap:1rem;}',
'#rs-logo{height:42px;width:auto;flex-shrink:0;display:block;}',
'#rs-nav{display:flex;align-items:center;gap:.2rem;margin-left:auto;}',
'#rs-nav a{font-size:.9rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(242,242,242,.55);padding:.4rem .7rem;border-radius:3px;text-decoration:none;white-space:nowrap;transition:color .15s,background .15s;}',
'#rs-nav a:hover,#rs-nav a.rs-active{color:#f2f2f2;background:rgba(255,255,255,.07);}',
'#rs-nav a.rs-cta{color:#ff5500;border:1px solid #ff5500;}',
'#rs-nav a.rs-cta:hover{background:#ff5500;color:#000;}',
'#rs-listen{background:#ff5500;color:#000;font-family:"Barlow Condensed","Arial Narrow",Arial,sans-serif;font-size:.85rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase;padding:.45rem 1.1rem;border-radius:3px;border:none;cursor:pointer;white-space:nowrap;flex-shrink:0;}',
'#rs-listen:hover{background:#ff7722;}',
'#rs-ham{display:none;flex-direction:column;justify-content:center;gap:5px;width:40px;height:40px;padding:8px;background:none;border:none;cursor:pointer;margin-left:auto;flex-shrink:0;}',
'#rs-ham span{display:block;height:2px;background:#f2f2f2;border-radius:2px;transition:all .25s;transform-origin:center;}',
'#rs-ham.open span:nth-child(1){transform:translateY(7px) rotate(45deg);}',
'#rs-ham.open span:nth-child(2){opacity:0;transform:scaleX(0);}',
'#rs-ham.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg);}',
'#rs-mob{position:fixed;inset:0;background:rgba(8,8,8,.98);z-index:1999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.4rem;opacity:0;pointer-events:none;transition:opacity .25s;}',
'#rs-mob.open{opacity:1;pointer-events:all;}',
'#rs-mob a{font-family:"Bebas Neue","Impact",sans-serif;font-size:clamp(2.2rem,8vw,3.2rem);letter-spacing:.05em;color:#f2f2f2;text-decoration:none;padding:.2rem 0;transition:color .15s;text-align:center;}',
'#rs-mob a:hover{color:#ff5500;}',
'#rs-mob a.rs-mob-cta{color:#ff5500;}',
'#rs-mob-close{position:absolute;top:1.5rem;right:1.5rem;font-size:1.5rem;color:rgba(242,242,242,.5);background:none;border:none;cursor:pointer;width:44px;height:44px;display:flex;align-items:center;justify-content:center;}',
'#rs-mob-close:hover{color:#ff5500;}',
'#rs-mob-listen{margin-top:.75rem;background:#ff5500;color:#000;font-family:"Barlow Condensed","Arial Narrow",Arial,sans-serif;font-size:1.1rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase;padding:.75rem 2.5rem;border-radius:3px;border:none;cursor:pointer;}',
'#rs-ticker{position:fixed;top:64px;left:0;right:0;height:34px;background:#ff5500;display:flex;align-items:center;overflow:hidden;z-index:1990;}',
'#rs-ticker-label{background:#000;color:#ff5500;font-family:"Barlow Condensed","Arial Narrow",Arial,sans-serif;font-size:.7rem;font-weight:900;letter-spacing:.2em;text-transform:uppercase;padding:0 1rem;height:100%;display:flex;align-items:center;white-space:nowrap;flex-shrink:0;border-right:1px solid rgba(255,85,0,.4);}',
'#rs-ticker-text{font-family:"Barlow Condensed","Arial Narrow",Arial,sans-serif;font-size:.85rem;font-weight:700;color:#000;white-space:nowrap;padding:0 1rem;animation:rs-marquee 250s linear infinite;flex:1;min-width:0;}',
'#rs-ticker-more{background:rgba(0,0,0,.3);color:#000;font-family:"Barlow Condensed","Arial Narrow",Arial,sans-serif;font-size:.65rem;font-weight:900;letter-spacing:.15em;text-transform:uppercase;padding:0 .75rem;height:100%;display:flex;align-items:center;white-space:nowrap;flex-shrink:0;border-left:1px solid rgba(0,0,0,.2);text-decoration:none;}',
'#rs-ticker-more:hover{background:rgba(0,0,0,.5);}',
'@keyframes rs-marquee{from{transform:translateX(100vw)}to{transform:translateX(-100%)}}',
'#rs-player{position:fixed;bottom:0;left:0;right:0;background:rgba(8,8,8,.97);border-top:1px solid #242424;z-index:1980;transform:translateY(100%);transition:transform .35s cubic-bezier(.4,0,.2,1);}',
'#rs-player.open{transform:translateY(0);}',
'#rs-player-inner{max-width:1300px;margin:0 auto;padding:.75rem 1.25rem;display:flex;align-items:center;gap:1rem;font-family:"Barlow Condensed","Arial Narrow",Arial,sans-serif;}',
'#rs-pb-play{width:44px;height:44px;border-radius:50%;background:#ff5500;color:#000;font-size:1rem;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}',
'#rs-pb-play:hover{background:#ff7722;}',
'#rs-pb-track{flex:1;min-width:0;}',
'#rs-pb-now{font-size:.6rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#ff5500;}',
'#rs-pb-title{font-size:.95rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#f2f2f2;}',
'#rs-pb-sub{font-size:.78rem;color:rgba(242,242,242,.5);}',
'#rs-pb-live{display:flex;align-items:center;gap:.4rem;font-size:.7rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#ff5500;}',
'#rs-pb-dot{width:8px;height:8px;border-radius:50%;background:#ff5500;animation:rs-pulse 1.5s ease-in-out infinite;}',
'#rs-pb-close{color:rgba(242,242,242,.5);font-size:1.1rem;width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:none;border:none;cursor:pointer;flex-shrink:0;}',
'#rs-pb-close:hover{color:#f2f2f2;}',
'@keyframes rs-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}',
'@media(max-width:768px){#rs-nav{display:none!important}#rs-listen{display:none!important}#rs-ham{display:flex!important}}',
'</style>',
'<header id="rs-header">',
'<div id="rs-hc">',
'<a href="/rock/index.html"><img id="rs-logo" src="/rock/assets/images/logo.png" alt="ROCK.SCOT"></a>',
'<nav id="rs-nav">',
'<a href="/rock/index.html#genres" id="rs-n-genres">Genres</a>',
'<a href="/rock/wire.html" id="rs-n-wire">The Wire</a>',
'<a href="/rock/index.html#tom" id="rs-n-tom">Tom Russell</a>',
'<a href="/rock/index.html#schedule" id="rs-n-sched">Schedule</a>',
'<a href="/rock/coverage.html" id="rs-n-cov">Coverage</a>',
'<a href="/rock/advertise.html" class="rs-cta" id="rs-n-adv">Advertise</a>',
'</nav>',
'<button id="rs-listen">&#9654; Listen Live</button>',
'<button id="rs-ham" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button>',
'</div></header>',
'<nav id="rs-mob">',
'<button id="rs-mob-close">&#x2715;</button>',
'<a href="/rock/index.html#genres">Genres</a>',
'<a href="/rock/wire.html">The Wire</a>',
'<a href="/rock/index.html#tom">Tom Russell</a>',
'<a href="/rock/index.html#schedule">Schedule</a>',
'<a href="/rock/coverage.html">Coverage</a>',
'<a href="/rock/advertise.html" class="rs-mob-cta">Advertise</a>',
'<button id="rs-mob-listen">&#9654; Listen Live</button>',
'</nav>',
'<div id="rs-ticker">',
'<div id="rs-ticker-label">&#9889; THE WIRE</div>',
'<div id="rs-ticker-text">LOADING SCOTTISH ROCK NEWS...</div>',
'<a href="/rock/wire.html" id="rs-ticker-more">MORE &#8594;</a>',
'</div>',
'<div id="rs-player"><div id="rs-player-inner">',
'<button id="rs-pb-play">&#9654;</button>',
'<div id="rs-pb-track"><div id="rs-pb-now">Now Playing</div><div id="rs-pb-title">ROCK.SCOT</div><div id="rs-pb-sub">Scotland\'s Rock Station &mdash; DAB+</div></div>',
'<div id="rs-pb-live"><div id="rs-pb-dot"></div>Live</div>',
'<button id="rs-pb-close">&#x2715;</button>',
'</div></div>'];

document.body.insertAdjacentHTML('afterbegin',H.join(''));

// Active nav
var p=window.location.pathname;
var map={'wire':'rs-n-wire','coverage':'rs-n-cov','advertise':'rs-n-adv'};
Object.keys(map).forEach(function(k){if(p.indexOf(k)>-1){var el=document.getElementById(map[k]);if(el)el.classList.add('rs-active');}});

// Scroll
window.addEventListener('scroll',function(){document.getElementById('rs-header').classList.toggle('scrolled',window.scrollY>80);},{passive:true});

// Hamburger
var ham=document.getElementById('rs-ham');
var mob=document.getElementById('rs-mob');
var cls=document.getElementById('rs-mob-close');
function openNav(){mob.classList.add('open');ham.classList.add('open');ham.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';}
function closeNav(){mob.classList.remove('open');ham.classList.remove('open');ham.setAttribute('aria-expanded','false');document.body.style.overflow='';}
ham.addEventListener('click',function(){mob.classList.contains('open')?closeNav():openNav();});
cls.addEventListener('click',closeNav);
mob.addEventListener('click',function(e){if(e.target===mob)closeNav();});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeNav();});
mob.querySelectorAll('a').forEach(function(a){a.addEventListener('click',closeNav);});

// Player
var playerOpen=false,isPlaying=false,playerFrame=null;
function showPlayer(){document.getElementById('rs-player').classList.add('open');playerOpen=true;}
function togglePlay(){
  if(!playerFrame){playerFrame=document.createElement('iframe');playerFrame.src='https://player.broadcast.radio/caledonia-tx-ltd';playerFrame.style.cssText='position:absolute;width:0;height:0;border:none;opacity:0;pointer-events:none;';playerFrame.allow='autoplay';document.body.appendChild(playerFrame);}
  isPlaying=!isPlaying;
  var pb=document.getElementById('rs-pb-play');if(pb)pb.textContent=isPlaying?'\u23F8':'\u25B6';
  var t=document.getElementById('rs-pb-title');if(t)t.textContent=isPlaying?'ROCK.SCOT LIVE':'ROCK.SCOT';
  var s=document.getElementById('rs-pb-sub');if(s)s.textContent=isPlaying?'Broadcasting Now on DAB+':"Scotland's Rock Station \u2014 DAB+";
}
document.getElementById('rs-pb-play').addEventListener('click',togglePlay);
document.getElementById('rs-pb-close').addEventListener('click',function(){document.getElementById('rs-player').classList.remove('open');});
document.getElementById('rs-mob-listen').addEventListener('click',function(){showPlayer();if(!isPlaying)togglePlay();closeNav();});
document.getElementById('rs-listen').addEventListener('click',function(){showPlayer();if(!isPlaying)togglePlay();});
document.addEventListener('click',function(e){if(e.target.id==='hero-listen-btn'||e.target.getAttribute('data-listen')){e.preventDefault();showPlayer();if(!isPlaying)togglePlay();}});
setTimeout(function(){if(!playerOpen)showPlayer();},5000);

// Ticker + Wire
var tickerEl=document.getElementById('rs-ticker-text');
var wh=[];
function renderTicker(items){if(!items||!items.length)return;wh=items;var t=items.map(function(i){return'\u26A1 '+i.title.toUpperCase();}).join('   \u25C6   ');tickerEl.textContent=t+'   \u25C6   ';tickerEl.style.animation='none';void tickerEl.offsetHeight;tickerEl.style.animation='rs-marquee 250s linear infinite';}
function defaultTicker(){tickerEl.textContent='\u26A1 ROCK.SCOT \u2014 SCOTLAND\'S ROCK STATION   \u25C6   DAB+ DIGITAL RADIO   \u25C6   METAL \u2022 ALT \u2022 PUNK \u2022 CLASSIC ROCK   \u25C6   SEARCH "ROCK.SCOT" ON DAB+   \u25C6   ';}
function updateGrid(data){var g=document.getElementById('homepage-wire');if(!g||!data||!data.length)return;g.innerHTML=data.slice(0,3).map(function(s){var ago=timeAgo(new Date(s.created_at));return'<div class="wire-card"><div class="wire-card-genre">'+esc(s.genre||'Rock')+'</div><div class="wire-card-title">'+esc(s.title)+'</div><div class="wire-card-meta">'+ago+'</div></div>';}).join('');}
function loadTicker(){if(!sb){defaultTicker();return;}sb.from('wire_news').select('title,genre,created_at').eq('is_live',true).order('created_at',{ascending:false}).limit(20).then(function(r){if(r.error||!r.data||!r.data.length){defaultTicker();return;}renderTicker(r.data);updateGrid(r.data);}).catch(defaultTicker);}
function subWire(){if(!sb)return;sb.channel('rs-wire').on('postgres_changes',{event:'INSERT',schema:'public',table:'wire_news',filter:'is_live=eq.true'},function(p){if(p.new&&p.new.title){wh.unshift(p.new);if(wh.length>20)wh.pop();renderTicker(wh);updateGrid(wh);}}).subscribe();}
function initSB(){try{if(window.supabase&&window.supabase.createClient&&SUPABASE_KEY){sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{realtime:{params:{eventsPerSecond:10}}});return true;}}catch(e){}return false;}
function boot(){if(initSB()){loadTicker();subWire();}else{defaultTicker();var n=0,t=setInterval(function(){n++;if(initSB()){clearInterval(t);loadTicker();subWire();}if(n>33)clearInterval(t);},300);}}
function timeAgo(d){var s=Math.floor((Date.now()-d)/1000);if(s<3600)return Math.floor(s/60)+'m ago';if(s<86400)return Math.floor(s/3600)+'h ago';return Math.floor(s/86400)+'d ago';}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
setInterval(loadTicker,5*60*1000);
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',boot);}else{boot();}
})();
