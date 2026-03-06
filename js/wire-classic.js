(function () {
  var GENRES = ["Classic Rock", "grunge", "metal", "indie", "prog", "punk", "other"];
  var SCOTLAND_HINTS = ["scot", "glasgow", "edinburgh", "dundee", "aberdeen", "fife", "ayrshire", "lanarkshire", "stirling", "highland", "inverness"];
  var HEAVY_HINTS = ["nme", "loudersound", "diy"];

  var SUPABASE_URL = (window.SUPABASE_URL || "https://pwzeapvopeeoahpyicdm.supabase.co").replace(/\/+$/, "");
  var SUPABASE_KEY = window.SUPABASE_ANON_KEY || "sb_publishable_60wC6CgYUm1QFk1HbOCEtw_Hh8mCb7u";

  var state = { rows: [], filtered: [] };

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, function (m) {
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[m];
    });
  }

  function pick(obj, keys) {
    for (var i = 0; i < keys.length; i++) {
      var v = obj[keys[i]];
      if (v !== undefined && v !== null && String(v).trim() !== "") return v;
    }
    return "";
  }

  function stripHtml(s) {
    return String(s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  function fmtDate(v) {
    try { return new Date(v).toLocaleString("en-GB", { dateStyle:"medium", timeStyle:"short" }); }
    catch (e) { return String(v || ""); }
  }

  function hostFromUrl(u) {
    try { return new URL(u).hostname.replace(/^www\./, ""); }
    catch (e) { return ""; }
  }

  function normalizeGenre(raw) {
    var t = String(raw || "").toLowerCase();
    if (/classic rock|hard rock|aor|thin lizzy|led zeppelin|deep purple|ac\/dc|fleetwood|sabbath/.test(t)) return "Classic Rock";
    if (/grunge|nirvana|soundgarden|pearl jam|alice in chains|mudhoney/.test(t)) return "grunge";
    if (/metal|heavy metal|death metal|black metal|thrash|doom|sludge|metalcore|nu metal/.test(t)) return "metal";
    if (/indie|alternative|shoegaze|britpop|dream pop/.test(t)) return "indie";
    if (/prog|progressive|art rock|math rock/.test(t)) return "prog";
    if (/punk|post-punk|hardcore|pop punk/.test(t)) return "punk";
    return "other";
  }

  function isScottish(text) {
    var t = String(text || "").toLowerCase();
    for (var i = 0; i < SCOTLAND_HINTS.length; i++) if (t.indexOf(SCOTLAND_HINTS[i]) !== -1) return true;
    return false;
  }

  function isHeavySource(text) {
    var t = String(text || "").toLowerCase();
    for (var i = 0; i < HEAVY_HINTS.length; i++) if (t.indexOf(HEAVY_HINTS[i]) !== -1) return true;
    return false;
  }

  function normalizeRow(r) {
    var url = pick(r, ["article_url", "url", "link", "source_url", "original_url"]);
    var title = pick(r, ["title", "headline", "name"]) || "Untitled story";
    var summary = stripHtml(pick(r, ["summary", "description", "excerpt", "snippet", "dek"]));
    var content = stripHtml(pick(r, ["content", "body", "article", "full_text"]));
    var source = pick(r, ["source", "source_name", "publication", "feed_name"]) || hostFromUrl(url) || "Rock.Scot Wire";
    var genreRaw = [pick(r, ["genre", "category", "tag", "source_genre"]), title, summary, content].join(" ");
    return {
      id: pick(r, ["id", "uuid"]) || Math.random().toString(36).slice(2),
      title: title,
      summary: summary,
      content: content,
      source: source,
      genre: normalizeGenre(genreRaw),
      created_at: pick(r, ["created_at", "published_at", "pub_date", "date"]),
      image: pick(r, ["image_url", "image", "thumbnail_url", "thumbnail", "hero_image", "photo_url"]),
      url: url
    };
  }

  function rebalance(rows) {
    var sorted = rows.slice().sort(function (a, b) {
      var aS = isScottish(a.source + " " + a.title) ? 1 : 0;
      var bS = isScottish(b.source + " " + b.title) ? 1 : 0;
      if (aS !== bS) return bS - aS;

      var aH = isHeavySource(a.source) ? 1 : 0;
      var bH = isHeavySource(b.source) ? 1 : 0;
      if (aH !== bH) return aH - bH;

      return String(b.created_at || "").localeCompare(String(a.created_at || ""));
    });

    var maxPerSource = 4;
    var sourceCount = {};
    var out = [];
    for (var i = 0; i < sorted.length; i++) {
      var s = String(sorted[i].source || "unknown");
      sourceCount[s] = (sourceCount[s] || 0) + 1;
      if (sourceCount[s] <= maxPerSource) out.push(sorted[i]);
      if (out.length >= 240) break;
    }
    return out;
  }

  function populateGenreFilter() {
    var sel = document.getElementById("wireGenre");
    if (!sel) return;
    sel.innerHTML = '<option value="">All genres</option>' + GENRES.map(function (g) {
      return '<option value="' + esc(g) + '">' + esc(g) + '</option>';
    }).join("");
  }

  function renderRows(rows) {
    var grid = document.getElementById("wireGrid");
    if (!grid) return;
    if (!rows.length) {
      grid.innerHTML = '<article class="wire-card"><h3>No stories found</h3><div class="wire-meta">Try another search or genre.</div></article>';
      return;
    }

    grid.innerHTML = rows.map(function (r, i) {
      var img = r.image ? '<img src="' + esc(r.image) + '" alt="Story image" loading="lazy">' : '';
      var origin = r.url ? '<a class="wire-btn" href="' + esc(r.url) + '" target="_blank" rel="noopener">Original</a>' : '';
      return '' +
        '<article class="wire-card">' +
          img +
          '<span class="wire-chip">' + esc(r.genre) + '</span>' +
          '<h3>' + esc(r.title) + '</h3>' +
          '<div class="wire-meta">' + esc(r.source) + ' • ' + esc(fmtDate(r.created_at)) + '</div>' +
          '<div class="wire-actions">' +
            '<button class="wire-btn primary" data-open-wire="' + i + '">Read popout</button>' +
            origin +
          '</div>' +
        '</article>';
    }).join("");
  }

  function applyFilters() {
    var q = String((document.getElementById("wireSearch") || {}).value || "").toLowerCase().trim();
    var g = String((document.getElementById("wireGenre") || {}).value || "");
    state.filtered = state.rows.filter(function (r) {
      var txt = (r.title + " " + r.summary + " " + r.content + " " + r.source).toLowerCase();
      var okQ = !q || txt.indexOf(q) !== -1;
      var okG = !g || r.genre === g;
      return okQ && okG;
    });
    renderRows(state.filtered);
    var count = document.getElementById("wireCount");
    if (count) count.textContent = state.filtered.length + " stories";
  }

  async function fetchRows() {
    var endpoints = [
      SUPABASE_URL + "/rest/v1/wire_news?select=*&is_live=eq.true&order=created_at.desc&limit=500",
      SUPABASE_URL + "/rest/v1/wire_news?select=*&is_live=eq.true&order=id.desc&limit=500"
    ];
    for (var i = 0; i < endpoints.length; i++) {
      var res = await fetch(endpoints[i], { headers: { apikey: SUPABASE_KEY, accept: "application/json" }, cache: "no-store" });
      if (res.ok) return res.json();
    }
    throw new Error("wire fetch failed");
  }

  function modalEls() {
    return {
      root: document.getElementById("wireModal"),
      title: document.getElementById("wireModalTitle"),
      meta: document.getElementById("wireModalMeta"),
      imgWrap: document.getElementById("wireModalImageWrap"),
      img: document.getElementById("wireModalImage"),
      summary: document.getElementById("wireModalSummary"),
      body: document.getElementById("wireModalBody"),
      source: document.getElementById("wireModalSource"),
      link: document.getElementById("wireModalLink")
    };
  }

  function openModal(row) {
    var m = modalEls();
    if (!m.root) return;

    m.title.textContent = row.title;
    m.meta.textContent = [row.genre, fmtDate(row.created_at)].filter(Boolean).join(" • ");

    if (row.image) { m.img.src = row.image; m.imgWrap.style.display = ""; }
    else { m.img.src = ""; m.imgWrap.style.display = "none"; }

    m.summary.textContent = row.summary || "No short summary available.";
    var body = row.content || row.summary || "No full feed text available. Use original article link.";
    if (body.length > 7000) body = body.slice(0, 7000) + "...";
    m.body.textContent = body;
    m.source.textContent = "Source credit: " + (row.source || "Rock.Scot Wire");

    if (row.url) { m.link.href = row.url; m.link.style.display = "inline-block"; }
    else { m.link.removeAttribute("href"); m.link.style.display = "none"; }

    m.root.classList.add("is-open");
    m.root.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    var r = document.getElementById("wireModal");
    if (!r) return;
    r.classList.remove("is-open");
    r.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  async function loadWire() {
    var status = document.getElementById("wireStatus");
    if (status) status.textContent = "Loading stories...";
    try {
      var rows = await fetchRows();
      state.rows = rebalance((rows || []).map(normalizeRow).filter(function (r) { return !!r.title; }));
      applyFilters();
      if (status) status.textContent = "Updated " + state.rows.length + " stories.";
    } catch (e) {
      if (status) status.textContent = "Could not load stories right now.";
      var grid = document.getElementById("wireGrid");
      if (grid) grid.innerHTML = '<article class="wire-card"><h3>Wire unavailable</h3><div class="wire-meta">Please try again shortly.</div></article>';
    }
  }

  function bind() {
    populateGenreFilter();

    document.addEventListener("click", function (e) {
      var openBtn = e.target.closest("[data-open-wire]");
      if (openBtn) {
        var idx = Number(openBtn.getAttribute("data-open-wire"));
        if (!Number.isNaN(idx) && state.filtered[idx]) openModal(state.filtered[idx]);
      }
      if (e.target.matches("[data-close-modal], .wire-modal .backdrop")) closeModal();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
    });

    var q = document.getElementById("wireSearch");
    var g = document.getElementById("wireGenre");
    var r = document.getElementById("wireRefresh");
    if (q) q.addEventListener("input", applyFilters);
    if (g) g.addEventListener("change", applyFilters);
    if (r) r.addEventListener("click", loadWire);

    loadWire();
    setInterval(loadWire, 60000);
  }

  document.addEventListener("DOMContentLoaded", bind);
})();
