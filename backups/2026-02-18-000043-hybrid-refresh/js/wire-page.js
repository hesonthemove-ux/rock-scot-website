(function () {
  var SUPABASE_URL = (window.SUPABASE_URL || "https://pwzeapvopeeoahpyicdm.supabase.co").replace(/\/+$/, "");
  var SUPABASE_KEY = window.SUPABASE_ANON_KEY || "sb_publishable_60wC6CgYUm1QFk1HbOCEtw_Hh8mCb7u";

  var searchEl = document.getElementById("wireSearch");
  var genreEl = document.getElementById("wireGenre");
  var gridEl = document.getElementById("wireGrid");
  var metaEl = document.getElementById("wireMeta");
  var refreshBtn = document.getElementById("wireRefresh");

  var modalEl = document.getElementById("wireModal");
  var modalTitle = document.getElementById("wireModalTitle");
  var modalMeta = document.getElementById("wireModalMeta");
  var modalSummary = document.getElementById("wireModalSummary");
  var modalBody = document.getElementById("wireModalBody");
  var modalImgWrap = document.getElementById("wireModalImageWrap");
  var modalImg = document.getElementById("wireModalImage");
  var modalLink = document.getElementById("wireModalLink");

  var allRows = [];
  var viewRows = [];

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, function (m) {
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[m];
    });
  }

  function first(obj, keys) {
    for (var i = 0; i < keys.length; i++) {
      var v = obj[keys[i]];
      if (v !== null && v !== undefined && String(v).trim() !== "") return v;
    }
    return "";
  }

  function stripHtml(input) {
    return String(input || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  function fmtDate(v) {
    if (!v) return "Unknown time";
    try { return new Date(v).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }); }
    catch (e) { return String(v); }
  }

  function normalize(row) {
    var title = first(row, ["title", "headline", "name"]);
    var genre = first(row, ["genre", "category", "tag", "source_genre"]) || "Wire";
    var createdAt = first(row, ["created_at", "published_at", "pub_date", "date"]);
    var url = first(row, ["article_url", "url", "link", "source_url", "original_url"]);
    var image = first(row, ["image_url", "image", "thumbnail_url", "thumbnail", "hero_image", "photo_url"]);
    var summary = stripHtml(first(row, ["summary", "description", "excerpt", "snippet", "dek"]));
    var content = stripHtml(first(row, ["content", "body", "article", "full_text"]));
    var source = first(row, ["source", "source_name", "site", "feed_name"]);
    return {
      id: first(row, ["id", "uuid"]) || Math.random().toString(36).slice(2),
      title: title || "Untitled story",
      genre: genre,
      created_at: createdAt,
      url: url,
      image: image,
      summary: summary,
      content: content,
      source: source
    };
  }

  function populateGenres(rows) {
    var seen = {};
    rows.forEach(function (r) { seen[r.genre] = true; });
    var genres = Object.keys(seen).sort();
    genreEl.innerHTML = '<option value="">All genres</option>' + genres.map(function (g) {
      return '<option value="' + esc(g) + '">' + esc(g) + '</option>';
    }).join("");
  }

  function renderRows(rows) {
    if (!rows.length) {
      gridEl.innerHTML = '<div class="panel"><strong>No stories found.</strong></div>';
      return;
    }
    gridEl.innerHTML = rows.map(function (r, i) {
      var imgHtml = r.image ? '<img class="wire-card-image" src="' + esc(r.image) + '" alt="Story image" loading="lazy">' : '';
      return '' +
        '<article class="wire-item">' +
          imgHtml +
          '<span class="badge">' + esc(r.genre || "Wire") + '</span>' +
          '<h4>' + esc(r.title) + '</h4>' +
          '<div class="wire-meta">' + esc(fmtDate(r.created_at)) + (r.source ? ' • ' + esc(r.source) : '') + '</div>' +
          '<div class="story-actions"><button class="btn open-btn" data-open-index="' + i + '">Read story</button></div>' +
        '</article>';
    }).join("");
  }

  function applyFilters() {
    var q = (searchEl.value || "").toLowerCase().trim();
    var g = genreEl.value || "";
    viewRows = allRows.filter(function (r) {
      var okQ = !q || String(r.title || "").toLowerCase().indexOf(q) !== -1;
      var okG = !g || r.genre === g;
      return okQ && okG;
    });
    renderRows(viewRows);
  }

  function openModal(row) {
    modalTitle.textContent = row.title || "Story";
    modalMeta.textContent = [row.genre || "Wire", fmtDate(row.created_at), row.source || ""].filter(Boolean).join(" • ");

    modalSummary.textContent = row.summary || "No short summary available.";
    var body = row.content || row.summary || "No full text available in feed. Use original article link.";
    modalBody.textContent = body.length > 4500 ? body.slice(0, 4500) + "..." : body;

    if (row.image) {
      modalImg.src = row.image;
      modalImgWrap.style.display = "";
    } else {
      modalImg.src = "";
      modalImgWrap.style.display = "none";
    }

    if (row.url) {
      modalLink.href = row.url;
      modalLink.style.display = "inline-block";
      modalLink.textContent = "Open original article";
    } else {
      modalLink.removeAttribute("href");
      modalLink.style.display = "none";
    }

    modalEl.classList.add("is-open");
    modalEl.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modalEl.classList.remove("is-open");
    modalEl.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  async function fetchRows() {
    var urls = [
      SUPABASE_URL + "/rest/v1/wire_news?select=*&is_live=eq.true&order=created_at.desc&limit=250",
      SUPABASE_URL + "/rest/v1/wire_news?select=*&is_live=eq.true&order=id.desc&limit=250"
    ];

    for (var i = 0; i < urls.length; i++) {
      var res = await fetch(urls[i], { headers: { apikey: SUPABASE_KEY, accept: "application/json" }, cache: "no-store" });
      if (res.ok) return res.json();
    }
    throw new Error("Unable to fetch wire rows");
  }

  async function loadWire() {
    metaEl.textContent = "Loading wire stories...";
    try {
      var rows = await fetchRows();
      allRows = (rows || []).map(normalize);
      populateGenres(allRows);
      applyFilters();
      metaEl.textContent = "Showing " + allRows.length + " stories from wire_news.";
    } catch (err) {
      console.error("wire load failed", err);
      metaEl.textContent = "Wire loading failed.";
      gridEl.innerHTML = '<div class="panel"><strong>Could not load stories.</strong></div>';
    }
  }

  gridEl.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-open-index]");
    if (!btn) return;
    var idx = Number(btn.getAttribute("data-open-index"));
    if (Number.isNaN(idx) || !viewRows[idx]) return;
    openModal(viewRows[idx]);
  });

  modalEl.addEventListener("click", function (e) {
    if (e.target.matches("[data-close-modal], .wire-modal-backdrop")) closeModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modalEl.classList.contains("is-open")) closeModal();
  });

  searchEl.addEventListener("input", applyFilters);
  genreEl.addEventListener("change", applyFilters);
  if (refreshBtn) refreshBtn.addEventListener("click", loadWire);

  loadWire();
  setInterval(loadWire, 60000);
})();
