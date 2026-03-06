/* WIRE_TICKER_FALLBACK_V2 */
(function () {
  var SUPABASE_URL = "https://pwzeapvopeeoahpyicdm.supabase.co";
  var SUPABASE_KEY = "sb_publishable_60wC6CgYUm1QFk1HbOCEtw_Hh8mCb7u";
  var API = SUPABASE_URL.replace(/\/+$/, "") +
    "/rest/v1/wire_news?select=title,created_at&is_live=eq.true&order=created_at.desc&limit=25";

  function uniq(arr) {
    return arr.filter(function (v, i, a) { return a.indexOf(v) === i; });
  }

  function findTargets() {
    var out = [];
    [
      "#wireTicker", "#wireTickerText", "#wire-news-ticker", "#wireNewsTicker",
      "#newsTicker", ".wire-ticker", ".wire-ticker-text", ".ticker-content",
      ".ticker-text", ".news-ticker"
    ].forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) { out.push(el); });
    });

    document.querySelectorAll("[id*='ticker'],[class*='ticker'],[id*='wire'],[class*='wire']")
      .forEach(function (el) { out.push(el); });

    document.querySelectorAll("div,span,p,li,strong,h1,h2,h3")
      .forEach(function (el) {
        var t = (el.textContent || "").toLowerCase();
        if (t.indexOf("connecting to the scottish rock news") !== -1 || t.indexOf("scottish rock news") !== -1) {
          out.push(el);
        }
      });

    return uniq(out).filter(function (el) { return el && el.nodeType === 1; });
  }

  function render(text) {
    var targets = findTargets();
    if (!targets.length) return;
    targets.forEach(function (el) { el.textContent = text; });
  }

  async function refreshWire() {
    try {
      var res = await fetch(API, {
        headers: { "apikey": SUPABASE_KEY, "accept": "application/json" },
        cache: "no-store"
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      var rows = await res.json();
      var titles = Array.isArray(rows)
        ? rows.map(function (r) { return r && r.title; }).filter(Boolean)
        : [];
      if (!titles.length) {
        render("No Scottish Rock News available right now.");
        return;
      }
      render(titles.join("   •   "));
    } catch (err) {
      console.error("WIRE_TICKER_FALLBACK_V2 error:", err);
    }
  }

  function boot() {
    refreshWire();
    setInterval(refreshWire, 30000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
