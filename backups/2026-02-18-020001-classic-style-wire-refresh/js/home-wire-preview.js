(function () {
  var target = document.getElementById("homeWirePreview");
  if (!target) return;

  var SUPABASE_URL = (window.SUPABASE_URL || "https://pwzeapvopeeoahpyicdm.supabase.co").replace(/\/+$/, "");
  var SUPABASE_KEY = window.SUPABASE_ANON_KEY || "sb_publishable_60wC6CgYUm1QFk1HbOCEtw_Hh8mCb7u";
  var API = SUPABASE_URL + "/rest/v1/wire_news?select=title,genre,created_at&is_live=eq.true&order=created_at.desc&limit=6";

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, function (m) {
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[m];
    });
  }

  function fmt(v) {
    try { return new Date(v).toLocaleString("en-GB", { dateStyle:"medium", timeStyle:"short" }); }
    catch (e) { return String(v || ""); }
  }

  fetch(API, { headers: { apikey: SUPABASE_KEY, accept: "application/json" }, cache: "no-store" })
    .then(function (res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
    .then(function (rows) {
      if (!rows || !rows.length) {
        target.innerHTML = '<div class="panel"><div class="muted">No wire stories available right now.</div></div>';
        return;
      }
      target.innerHTML = rows.map(function (r) {
        return '' +
          '<article class="wire-item">' +
          '<h4>' + esc(r.title || "Untitled story") + '</h4>' +
          '<div class="wire-meta">' + esc(r.genre || "Wire") + ' • ' + esc(fmt(r.created_at)) + '</div>' +
          '<div class="story-actions"><a class="btn alt" href="/wire.html">Open full story view</a></div>' +
          '</article>';
      }).join("");
    })
    .catch(function () {
      target.innerHTML = '<div class="panel"><div class="muted">Wire preview unavailable.</div></div>';
    });
})();
