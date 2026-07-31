/**
 * Homepage Featured Packages — production inject for marketing SPA.
 * Loads Package Master SoT via /api2/site/packages (no hardcoded packages).
 */
(function () {
  "use strict";

  function formatPrice(poisha) {
    if (poisha == null || poisha === "") return "—";
    return "৳" + Math.round(Number(poisha) / 100).toLocaleString("en-BD");
  }

  function seatsLeft(p) {
    if (p.seatsAvailable == null) return null;
    return Math.max(0, Number(p.seatsAvailable) - Number(p.seatsSold || 0));
  }

  function detailHref(slug) {
    return "/erp/#/site/packages/" + encodeURIComponent(slug);
  }

  function bookHref(slug) {
    return "/erp/#/site/packages/" + encodeURIComponent(slug) + "/book";
  }

  function card(p) {
    var img = p.thumbnailUrl || p.bannerUrl || "";
    var price = p.offerPricePoisha != null ? p.offerPricePoisha : p.pricePoisha;
    var hasOffer = p.offerPricePoisha != null && p.pricePoisha != null && p.offerPricePoisha < p.pricePoisha;
    var dur =
      (p.durationDays ? p.durationDays + "D" : "") +
      (p.durationNights ? (p.durationDays ? " / " : "") + p.durationNights + "N" : "");
    var left = seatsLeft(p);
    var slug = p.slug || p.id;
    var title = (p.name || "Package").replace(/</g, "&lt;");
    return (
      '<li class="st-pkg-card" role="listitem">' +
      '<a class="st-pkg-media" href="' +
      detailHref(slug) +
      '" aria-label="View ' +
      title +
      '">' +
      '<div class="st-pkg-img" style="background-image:url(\'' +
      String(img).replace(/'/g, "%27") +
      "')\">" +
      (p.featured || p.homeFeatured ? '<span class="st-pkg-badge">Featured</span>' : "") +
      (hasOffer ? '<span class="st-pkg-offer">Offer</span>' : "") +
      '<span class="st-pkg-price">' +
      formatPrice(price) +
      "</span></div></a>" +
      '<div class="st-pkg-body">' +
      '<p class="st-pkg-meta">' +
      (p.country || p.destination || "") +
      (dur ? " · " + dur : "") +
      (p.ratingAvg != null ? " · ★ " + Number(p.ratingAvg).toFixed(1) : "") +
      "</p>" +
      '<h3 class="st-pkg-title"><a href="' +
      detailHref(slug) +
      '">' +
      title +
      "</a></h3>" +
      (left != null
        ? '<p class="st-pkg-seats">' + (left === 0 ? "Sold out" : left + " seats left") + "</p>"
        : "") +
      '<div class="st-pkg-actions">' +
      '<a class="st-pkg-btn st-pkg-btn-ghost" href="' +
      detailHref(slug) +
      '">View Details</a>' +
      '<a class="st-pkg-btn" href="' +
      bookHref(slug) +
      '">Book Now</a>' +
      "</div></div></li>"
    );
  }

  function build(items) {
    var root = document.createElement("section");
    root.className = "st-packages-home";
    root.setAttribute("aria-label", "Featured packages");
    root.innerHTML =
      "<h2>Featured Packages</h2>" +
      '<p class="st-packages-lead">Live packages from Shanghai Travels Package Master.</p>' +
      (items.length
        ? '<ul class="st-packages-grid" role="list">' +
          items.map(card).join("") +
          "</ul>" +
          '<a class="st-packages-all" href="/erp/#/site/search">Browse all packages →</a>'
        : '<p class="st-packages-empty">No published packages yet.</p>');
    return root;
  }

  function findFeaturedSection() {
    var headings = document.querySelectorAll("h2, h3");
    for (var i = 0; i < headings.length; i++) {
      var t = (headings[i].textContent || "").trim();
      if (/Featured Tour Packages|Featured Packages|Popular Packages|Our Packages/i.test(t)) {
        var sec = headings[i].closest("section");
        return sec || headings[i].parentElement;
      }
    }
    return null;
  }

  function mount(items) {
    if (document.querySelector(".st-packages-home")) return true;
    var host = findFeaturedSection();
    if (!host) return false;
    // Never inject into the hero — keep title/subtitle/nav as the primary focus.
    if (host.closest("section.relative") || host.closest(".st-hero-services")) return false;
    host.replaceWith(build(items));
    return true;
  }

  function start(items) {
    if (mount(items)) return;
    var n = 0;
    var t = setInterval(function () {
      if (mount(items) || ++n > 40) clearInterval(t);
    }, 250);
  }

  function listOf(r) {
    if (Array.isArray(r)) return r;
    if (r && Array.isArray(r.data)) return r.data;
    return [];
  }

  function load(url) {
    return fetch(url).then(function (r) {
      return r.ok ? r.json() : { data: [] };
    });
  }

  load("/api2/site/packages?collection=home&limit=6")
    .then(function (res) {
      var items = listOf(res);
      if (items.length) return items;
      return load("/api2/site/packages?collection=featured&limit=6").then(listOf);
    })
    .then(function (items) {
      if (items && items.length) return items;
      return load("/api2/site/packages?limit=6").then(listOf);
    })
    .then(start)
    .catch(function () {
      start([]);
    });
})();
