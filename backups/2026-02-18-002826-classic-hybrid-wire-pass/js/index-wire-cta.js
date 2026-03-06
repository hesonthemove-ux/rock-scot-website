(function () {
  if (document.getElementById("wire-launch-card")) return;

  var main = document.querySelector("main") || document.body;

  var card = document.createElement("section");
  card.id = "wire-launch-card";
  card.className = "wire-launch-card";
  card.innerHTML =
    '<h2>Scottish Rock Wire</h2>' +
    '<p>Search by genre (Classic Rock, grunge, metal, indie, prog, punk, other), open stories in a popout reader, and jump to original source links.</p>' +
    '<div class="wire-cta-actions">' +
      '<a class="wire-btn primary" href="/wire.html">Open Wire</a>' +
      '<a class="wire-btn" href="/home-classic.html">Classic Station Pages</a>' +
    '</div>';

  if (main.firstElementChild && main.firstElementChild.nextElementSibling) {
    main.insertBefore(card, main.firstElementChild.nextElementSibling);
  } else {
    main.appendChild(card);
  }

  var fab = document.createElement("a");
  fab.className = "wire-fab";
  fab.href = "/wire.html";
  fab.textContent = "Open Wire";
  document.body.appendChild(fab);
})();
