(function () {
  var SUPABASE_URL = (window.SUPABASE_URL || "https://pwzeapvopeeoahpyicdm.supabase.co").replace(/\/+$/, "");
  var SUPABASE_KEY = window.SUPABASE_ANON_KEY || "sb_publishable_60wC6CgYUm1QFk1HbOCEtw_Hh8mCb7u";
  var API = SUPABASE_URL + "/rest/v1/wire_news?select=id,title,genre,created_at,is_live&is_live=eq.true&order=created_at.desc&limit=250";

  var rows = [];
  var searchEl = document.getElementById("wireSearch");
  var genreEl = document.getElementById("wireGenre");
  var gridEl = document.getElementById("wireGrid");
  var metaEl = document.getElementById("wireMeta");

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, function (m) {
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[m];
    });
  }

  function fmtDate(v) {
    if (!v) return "Unknown time";
    try { return new Date(v).toLocaleString("en-GB", { dateStyle:"medium", timeStyle:"short" }); }
    catch (e) { return String(v); }
  }

  function applyFilters() {
    var q = (searchEl.value || "").toLowerCase().trim();
    var g = genreEl.value || "";
    var filtered = rows.filter(function (r) {
      var t = String(r.title || "").toLowerCase();
      var rg = String(r.genre || "Wire");
      var okQ = !q || t.indexOf(q) !== -1;
      var okG = !g || rg === g;
      return okQ && okG;
    });

    if (!filtered.length) {
      gridEl.innerHTML = '<div class="panel"><strong>No stories match your filter.</strong></div>';
      return;
    }

    gridEl.innerHTML = filtered.map(function (r) {
      return (
        '<article class="wire-item">' +
          '<h4>' + esc(r.title || "Untitled story") + '</h4>' +
          '<div class="wire-meta">' + esc(r.genre || "Wire") + " • " + esc(fmtDate(r.created_at)) + '</div>' +
        '</article>'
      );
    }).join("");
  }

  function populateGenres() {
    var genres = {};
    rows.forEach(function (r) { genres[String(r.genre || "Wire")] = true; });
    var list = Object.keys(genres).sort();
    genreEl.innerHTML = '<option value="">All genres</option>' + list.map(function (g) {
      return '<option value="' + esc(g) + '">' + esc(g) + '</option>';
    }).join("");
  }

  async function loadWire() {
    metaEl.textContent = "Loading latest wire stories...";
    try {
      var res = await fetch(API, {
        headers: { apikey: SUPABASE_KEY, accept: "application/json" },
        cache: "no-store"
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      rows = await res.json();
      populateGenres();
      applyFilters();
      metaEl.textContent = "Showing " + rows.length + " latest stories from wire_news.";
    } catch (err) {
      metaEl.textContent = "Could not load wire stories right now.";
      gridEl.innerHTML = '<div class="panel"><strong>Wire load failed:</strong> ' + esc(err.message) + '</div>';
      console.error("wire-page load failed", err);
    }
  }

  searchEl.addEventListener("input", applyFilters);
  genreEl.addEventListener("change", applyFilters);

  loadWire();
  setInterval(loadWire, 60000);
})();
