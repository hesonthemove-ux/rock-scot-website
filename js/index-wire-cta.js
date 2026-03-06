(function () {
  if (document.getElementById("wire-launch-card")) return;

  var main = document.querySelector("main") || document.body;
  var section = document.createElement("section");
  section.id = "wire-launch-card";
  section.className = "wire-launch-card";
  section.innerHTML =
    '<h2>The Wire</h2>' +
    '<p>Read full stories in a popout view, search by genre, and open the original source article.</p>' +
    '<div class="wire-launch-actions">' +
      '<a class="wire-btn primary" href="/wire.html">Open Wire</a>' +
      '<a class="wire-btn" href="/home-classic.html">Classic Station Pages</a>' +
    '</div>';

  if (main.firstElementChild && main.firstElementChild.nextElementSibling) {
    main.insertBefore(section, main.firstElementChild.nextElementSibling);
  } else {
    main.appendChild(section);
  }

  var fab = document.createElement("a");
  fab.className = "wire-fab";
  fab.href = "/wire.html";
  fab.textContent = "Open Wire";
  document.body.appendChild(fab);
})();
