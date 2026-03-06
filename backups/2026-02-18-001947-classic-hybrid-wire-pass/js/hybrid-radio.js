(function () {
  var SUPABASE_URL = (window.SUPABASE_URL || "https://pwzeapvopeeoahpyicdm.supabase.co").replace(/\/+$/, "");
  var SUPABASE_KEY = window.SUPABASE_ANON_KEY || "sb_publishable_60wC6CgYUm1QFk1HbOCEtw_Hh8mCb7u";
  var STATE = { rows: [], filtered: [] };

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
    return String(s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  function fmtDate(v) {
    if (!v) return "Unknown time";
    try { return new Date(v).toLocaleString("en-GB", { dateStyle:"medium", timeStyle:"short" }); }
    catch (e) { return String(v); }
  }

  function hostFromUrl(u) {
    try { return new URL(u).hostname.replace(/^www\./, ""); }
    catch (e) { return ""; }
  }

  function imgExists(src) {
    return new Promise(function (resolve) {
      var i = new Image();
      i.onload = function () { resolve(true); };
      i.onerror = function () { resolve(false); };
      i.src = src;
    });
  }

  async function firstImage(list, fallback) {
    for (var i = 0; i < list.length; i++) {
      if (await imgExists(list[i])) return list[i];
    }
    return fallback;
  }

  async function setupBrandAssets() {
    var logos = ["/logo.png", "/assets/logo.png", "/assets/rock-logo.png", "/assets/brand/logo.png", "/assets/img/logo.png"];
    var hero = ["/assets/hero.jpg", "/assets/hero.png", "/assets/rock-banner.jpg", "/assets/banner.jpg", "/assets/cover.jpg", "/logo.png"];

    var logo = await firstImage(logos, "/logo.png");
    var heroImg = await firstImage(hero, logo);

    document.querySelectorAll("[data-brand-logo]").forEach(function (el) { el.src = logo; });
    document.documentElement.style.setProperty("--hero-image", "url('" + heroImg + "')");
  }

  function normalizeRow(r) {
    var url = pick(r, ["article_url", "url", "link", "source_url", "original_url"]);
    return {
      id: pick(r, ["id", "uuid"]) || Math.random().toString(36).slice(2),
      title: pick(r, ["title", "headline", "name"]) || "Untitled story",
      genre: pick(r, ["genre", "category", "tag", "source_genre"]) || "Rock",
      created_at: pick(r, ["created_at", "published_at", "pub_date", "date"]),
      summary: stripHtml(pick(r, ["summary", "description", "excerpt", "snippet", "dek"])),
      content: stripHtml(pick(r, ["content", "body", "article", "full_text"])),
      source: pick(r, ["source", "source_name", "publication", "feed_name"]) || hostFromUrl(url) || "Rock.Scot Wire",
      url: url,
      image: pick(r, ["image_url", "image", "thumbnail_url", "thumbnail", "hero_image", "photo_url"])
    };
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

    m.title.textContent = row.title || "Story";
    m.meta.textContent = [row.genre, fmtDate(row.created_at)].filter(Boolean).join(" • ");

    if (row.image) {
      m.img.src = row.image;
      m.imgWrap.style.display = "";
    } else {
      m.img.src = "";
      m.imgWrap.style.display = "none";
    }

    m.summary.textContent = row.summary || "No short summary available.";
    var body = row.content || row.summary || "No full text in feed for this story.";
    if (body.length > 6000) body = body.slice(0, 6000) + "...";
    m.body.textContent = body;

    m.source.textContent = row.source ? ("Source credit: " + row.source) : "Source credit: Rock.Scot Wire";
    if (row.url) {
      m.link.href = row.url;
      m.link.style.display = "inline-block";
    } else {
      m.link.removeAttribute("href");
      m.link.style.display = "none";
    }

    m.root.classList.add("is-open");
    m.root.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    var root = document.getElementById("wireModal");
    if (!root) return;
    root.classList.remove("is-open");
    root.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function bindModal() {
    var root = document.getElementById("wireModal");
    if (!root) return;
    root.addEventListener("click", function (e) {
      if (e.target.matches("[data-close-modal], .wire-modal-backdrop")) closeModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
    });
  }

  function wireCards(rows, withExternal) {
    return rows.map(function (r, i) {
      var img = r.image ? ('<img class="wire-card-image" src="' + esc(r.image) + '" alt="Story image" loading="lazy">') : "";
      var ext = (withExternal && r.url) ? ('<a class="btn alt" href="' + esc(r.url) + '" target="_blank" rel="noopener">Original</a>') : "";
      return '' +
        '<article class="wire-item">' +
          img +
          '<span class="badge">' + esc(r.genre || "Rock") + '</span>' +
          '<h4>' + esc(r.title) + '</h4>' +
          '<div class="wire-meta">' + esc(fmtDate(r.created_at)) + ' • ' + esc(r.source || "Rock.Scot Wire") + '</div>' +
          '<div class="story-actions">' +
            '<button class="btn" data-open-wire="' + i + '">Read popout</button>' +
            ext +
          '</div>' +
        '</article>';
    }).join("");
  }

  function renderHomeHighlights() {
    var target = document.getElementById("wireHighlights");
    var count = document.getElementById("wireCount");
    if (!target) return;
    var top = STATE.rows.slice(0, 8);
    target.innerHTML = top.length ? wireCards(top, true) : '<div class="panel"><div class="muted">No stories available.</div></div>';
    if (count) count.textContent = top.length + " headlines loaded";
  }

  function populateGenreFilter() {
    var sel = document.getElementById("wireGenre");
    if (!sel) return;
    var seen = {};
    STATE.rows.forEach(function (r) { seen[r.genre || "Rock"] = true; });
    var genres = Object.keys(seen).sort();
    sel.innerHTML = '<option value="">All genres</option>' + genres.map(function (g) {
      return '<option value="' + esc(g) + '">' + esc(g) + '</option>';
    }).join("");
  }

  function applyWireFilters() {
    var grid = document.getElementById("wireGrid");
    if (!grid) return;

    var qEl = document.getElementById("wireSearch");
    var gEl = document.getElementById("wireGenre");

    var q = qEl ? String(qEl.value || "").toLowerCase().trim() : "";
    var g = gEl ? String(gEl.value || "") : "";

    STATE.filtered = STATE.rows.filter(function (r) {
      var okQ = !q || String(r.title || "").toLowerCase().indexOf(q) !== -1 || String(r.summary || "").toLowerCase().indexOf(q) !== -1;
      var okG = !g || String(r.genre || "") === g;
      return okQ && okG;
    });

    grid.innerHTML = STATE.filtered.length ? wireCards(STATE.filtered, true) : '<div class="panel"><div class="muted">No stories match your filter.</div></div>';
    var count = document.getElementById("wireCount");
    if (count) count.textContent = STATE.filtered.length + " stories";
  }

  function bindWireEvents() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-open-wire]");
      if (!btn) return;
      var idx = Number(btn.getAttribute("data-open-wire"));
      var scope = document.getElementById("wireGrid") ? STATE.filtered : STATE.rows.slice(0, 8);
      if (!Number.isNaN(idx) && scope[idx]) openModal(scope[idx]);
    });

    var q = document.getElementById("wireSearch");
    var g = document.getElementById("wireGenre");
    var r = document.getElementById("wireRefresh");
    if (q) q.addEventListener("input", applyWireFilters);
    if (g) g.addEventListener("change", applyWireFilters);
    if (r) r.addEventListener("click", loadWire);
  }

  async function loadWire() {
    var status = document.getElementById("wireStatus");
    if (status) status.textContent = "Loading latest stories...";
    var endpoints = [
      SUPABASE_URL + "/rest/v1/wire_news?select=*&is_live=eq.true&order=created_at.desc&limit=250",
      SUPABASE_URL + "/rest/v1/wire_news?select=*&is_live=eq.true&order=id.desc&limit=250"
    ];

    try {
      var rows = [];
      for (var i = 0; i < endpoints.length; i++) {
        var res = await fetch(endpoints[i], { headers: { apikey: SUPABASE_KEY, accept: "application/json" }, cache: "no-store" });
        if (res.ok) { rows = await res.json(); break; }
      }
      STATE.rows = (rows || []).map(normalizeRow).filter(function (r) { return !!r.title; });
      renderHomeHighlights();
      populateGenreFilter();
      applyWireFilters();
      if (status) status.textContent = "Updated " + STATE.rows.length + " stories.";
    } catch (err) {
      if (status) status.textContent = "Wire could not load at this moment.";
      console.error("Wire load failed", err);
    }
  }

  function parseLinksFromListing(html, basePath) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    var links = Array.prototype.slice.call(doc.querySelectorAll("a[href]"))
      .map(function (a) { return a.getAttribute("href"); })
      .filter(function (h) {
        if (!h) return false;
        if (h.indexOf("?") === 0 || h.indexOf("#") === 0) return false;
        return /\.html?$/i.test(h);
      })
      .map(function (h) {
        if (/^https?:\/\//i.test(h)) return h;
        if (h[0] === "/") return h;
        return basePath + "/" + h.replace(/^\.\//, "");
      });

    var dedup = [];
    links.forEach(function (l) { if (dedup.indexOf(l) === -1) dedup.push(l); });
    return dedup.slice(0, 12);
  }

  function absFrom(base, src) {
    if (!src) return "";
    if (/^https?:\/\//i.test(src)) return src;
    if (src[0] === "/") return src;
    return base.replace(/\/[^\/]*$/, "/") + src.replace(/^\.\//, "");
  }

  async function loadClassicStories() {
    var target = document.getElementById("classicStoryGrid");
    if (!target) return;
    target.innerHTML = '<div class="muted">Loading original stories...</div>';

    var links = [];
    try {
      var newsRes = await fetch("/news/", { cache: "no-store" });
      if (newsRes.ok) links = parseLinksFromListing(await newsRes.text(), "/news");
    } catch (e) {}

    if (!links.length) links = ["/home-classic.html", "/advertise.html", "/privacy.html", "/terms.html"];

    var cards = [];
    for (var i = 0; i < links.length; i++) {
      try {
        var res = await fetch(links[i], { cache: "no-store" });
        if (!res.ok) continue;
        var html = await res.text();
        var doc = new DOMParser().parseFromString(html, "text/html");

        var title = (doc.querySelector("meta[property='og:title']") || {}).content || (doc.querySelector("title") || {}).textContent || links[i];
        var imgRaw = (doc.querySelector("meta[property='og:image']") || {}).content || (doc.querySelector("img") || {}).src || "/logo.png";
        var img = absFrom(links[i], imgRaw);
        var para = (doc.querySelector("main p, article p, .content p, p") || {}).textContent || "Open to read full piece";
        var snippet = String(para).replace(/\s+/g, " ").trim().slice(0, 180);

        cards.push({
          title: title.trim(),
          image: img,
          snippet: snippet,
          href: links[i]
        });
      } catch (e) {}
      if (cards.length >= 8) break;
    }

    if (!cards.length) {
      target.innerHTML = '<div class="panel"><div class="muted">Original stories unavailable right now.</div></div>';
      return;
    }

    target.innerHTML = cards.map(function (c) {
      return '' +
        '<article class="story-card">' +
          '<img class="story-thumb" src="' + esc(c.image || "/logo.png") + '" alt="Story image" loading="lazy">' +
          '<div class="story-body">' +
            '<h4>' + esc(c.title || "Story") + '</h4>' +
            '<p>' + esc(c.snippet || "Open story") + '</p>' +
            '<div class="story-actions"><a class="btn alt" href="' + esc(c.href) + '" target="_blank" rel="noopener">Read article</a></div>' +
          '</div>' +
        '</article>';
    }).join("");
  }

  async function loadAssetGallery() {
    var target = document.getElementById("assetGallery");
    if (!target) return;

    var images = [];
    try {
      var res = await fetch("/assets/", { cache: "no-store" });
      if (res.ok) {
        var doc = new DOMParser().parseFromString(await res.text(), "text/html");
        images = Array.prototype.slice.call(doc.querySelectorAll("a[href]"))
          .map(function (a) { return a.getAttribute("href"); })
          .filter(function (h) { return /\.(png|jpe?g|webp|gif)$/i.test(h || ""); })
          .map(function (h) { return h[0] === "/" ? h : "/assets/" + h.replace(/^\.\//, ""); })
          .slice(0, 12);
      }
    } catch (e) {}

    if (!images.length) images = ["/logo.png", "/logo.png", "/logo.png", "/logo.png"];

    target.innerHTML = images.map(function (src) {
      return '<img src="' + esc(src) + '" alt="Rock.Scot visual" loading="lazy">';
    }).join("");
  }

  async function init() {
    await setupBrandAssets();
    bindModal();
    bindWireEvents();
    loadWire();
    loadClassicStories();
    loadAssetGallery();
    setInterval(loadWire, 60000);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
