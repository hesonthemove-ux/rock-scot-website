(function () {
  var target = document.getElementById("originalStories");
  if (!target) return;

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, function (m) {
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[m];
    });
  }

  function textFromDoc(doc) {
    var p = doc.querySelector("main p, article p, .content p, p");
    return p ? (p.textContent || "").trim().slice(0, 180) : "Open story";
  }

  function absPath(base, val) {
    if (!val) return "";
    if (/^https?:\/\//i.test(val)) return val;
    if (val[0] === "/") return val;
    var b = base.replace(/\/[^\/]*$/, "/");
    return b + val.replace(/^\.\//, "");
  }

  function parseNewsLinks(html) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    return Array.prototype.slice.call(doc.querySelectorAll("a[href]"))
      .map(function (a) { return a.getAttribute("href"); })
      .filter(function (h) {
        if (!h) return false;
        if (h.indexOf("?") === 0 || h.indexOf("#") === 0) return false;
        if (h === "../") return false;
        return /\.html?$/i.test(h);
      })
      .slice(0, 12)
      .map(function (h) { return h[0] === "/" ? h : "/news/" + h.replace(/^\.\//, ""); });
  }

  async function fetchStory(url) {
    try {
      var res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return null;
      var html = await res.text();
      var doc = new DOMParser().parseFromString(html, "text/html");
      var title = (doc.querySelector("meta[property='og:title']") || {}).content || (doc.querySelector("title") || {}).textContent || url.split("/").pop();
      var imgVal = (doc.querySelector("meta[property='og:image']") || {}).content || (doc.querySelector("img") || {}).getAttribute && doc.querySelector("img").getAttribute("src");
      var img = absPath(url, imgVal || "/logo.png");
      var snippet = textFromDoc(doc);
      return { url: url, title: title.trim(), image: img, snippet: snippet };
    } catch (e) {
      return null;
    }
  }

  async function loadStories() {
    target.innerHTML = '<div class="muted">Loading original stories...</div>';

    var links = [];
    try {
      var listing = await fetch("/news/", { cache: "no-store" });
      if (listing.ok) {
        links = parseNewsLinks(await listing.text());
      }
    } catch (e) {}

    if (!links.length) {
      links = ["/home-classic.html", "/advertise.html", "/privacy.html", "/terms.html"];
    }

    var stories = (await Promise.all(links.map(fetchStory))).filter(Boolean).slice(0, 8);

    if (!stories.length) {
      target.innerHTML = '<div class="panel"><div class="muted">Could not load original story cards right now.</div></div>';
      return;
    }

    target.innerHTML = stories.map(function (s) {
      return '' +
        '<article class="story-card">' +
          '<img class="story-thumb" src="' + esc(s.image || "/logo.png") + '" alt="Story image" loading="lazy">' +
          '<div class="story-body">' +
            '<h4>' + esc(s.title || "Story") + '</h4>' +
            '<p>' + esc(s.snippet || "Open story") + '</p>' +
            '<div class="story-actions"><a class="btn alt" href="' + esc(s.url) + '" target="_blank" rel="noopener">Read story</a></div>' +
          '</div>' +
        '</article>';
    }).join("");
  }

  loadStories();
})();
