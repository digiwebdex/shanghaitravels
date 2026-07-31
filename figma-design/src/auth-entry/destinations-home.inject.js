/**
 * Homepage Popular Destinations — production inject for marketing SPA.
 * Loads Destination Master via /api2/site/destinations (no hardcoded countries).
 */
(function () {
  "use strict";

  function formatPackageCount(n) {
    var c = Math.max(0, Number(n) || 0);
    return c === 1 ? "1 Package" : c + " Packages";
  }

  function detailHref(slug) {
    return "/erp/#/site/destinations/" + encodeURIComponent(slug);
  }

  function browseHref() {
    return "/erp/#/site/destinations";
  }

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function card(d, settings) {
    var country = d.countryName || d.country || d.name || "Destination";
    var code = (d.countryCode || "").toUpperCase();
    var img = settings.showHeroImage !== false ? d.heroImageUrl || d.coverImageUrl || "" : "";
    var slug = d.slug || d.id;
    var cta = settings.ctaLabel || "Explore Destination →";
    var flag =
      settings.showFlag !== false
        ? d.flagUrl
          ? '<img class="st-dest-flag-img" src="' + esc(d.flagUrl) + '" alt="" loading="lazy" />'
          : '<span class="st-dest-flag-emoji" aria-hidden="true">' + esc(d.flagEmoji || "🌍") + "</span>"
        : "";
    var region =
      settings.showRegion !== false && d.region
        ? '<p class="st-dest-region">' + esc(d.region) + "</p>"
        : "";
    var pkg =
      settings.showPackageCount !== false
        ? '<p class="st-dest-packages">' + formatPackageCount(d.packageCount) + "</p>"
        : "";
    var ctaLink =
      settings.showCta !== false
        ? '<a class="st-dest-cta" href="' + detailHref(slug) + '">' + esc(cta) + "</a>"
        : "";
    var hero =
      settings.showHeroImage !== false
        ? '<div class="st-dest-hero">' +
          (img
            ? '<img src="' + esc(img) + '" alt="" loading="lazy" class="st-dest-hero-img" />'
            : '<div class="st-dest-hero-fallback"></div>') +
          '<div class="st-dest-hero-overlay"></div></div>'
        : "";

    return (
      '<li class="st-dest-card" role="listitem">' +
      '<a class="st-dest-main" href="' +
      detailHref(slug) +
      '" aria-label="Explore ' +
      esc(country) +
      '">' +
      '<div class="st-dest-left">' +
      (flag ? '<div class="st-dest-flag">' + flag + "</div>" : "") +
      '<div class="st-dest-meta">' +
      "<h3>" +
      esc(country) +
      "</h3>" +
      (code ? '<p class="st-dest-code">' + esc(code) + "</p>" : "") +
      region +
      "</div></div>" +
      hero +
      "</a>" +
      '<div class="st-dest-foot">' +
      '<div class="st-dest-foot-text">' +
      pkg +
      ctaLink +
      "</div>" +
      '<a class="st-dest-arrow" href="' +
      detailHref(slug) +
      '" aria-label="Open ' +
      esc(country) +
      '"><span aria-hidden="true">→</span></a></div></li>'
    );
  }

  function build(items, settings) {
    var root = document.createElement("section");
    root.className = "st-destinations-home";
    root.setAttribute("aria-label", "Popular destinations");
    var max = Math.max(1, Number(settings.maxCards) || 8);
    var sorted = items.slice().sort(function (a, b) {
      var ao = a.displayOrder != null ? a.displayOrder : a.sortOrder != null ? a.sortOrder : 9999;
      var bo = b.displayOrder != null ? b.displayOrder : b.sortOrder != null ? b.sortOrder : 9999;
      return ao - bo;
    });
    var visible = sorted.slice(0, max);
    root.innerHTML =
      "<h2>Popular Destinations</h2>" +
      '<p class="st-destinations-lead">Where we can take you — live destinations from Shanghai Travels.</p>' +
      (visible.length
        ? '<ul class="st-destinations-grid" role="list">' +
          visible.map(function (d) {
            return card(d, settings);
          }).join("") +
          "</ul>" +
          '<a class="st-destinations-all" href="' +
          browseHref() +
          '">Browse all countries →</a>'
        : '<p class="st-destinations-empty">No published destinations yet.</p>');
    return root;
  }

  function findSection() {
    var headings = document.querySelectorAll("h2, h3");
    for (var i = 0; i < headings.length; i++) {
      var t = (headings[i].textContent || "").trim();
      if (/Popular Destinations|Where We Can Take You|Visa Destinations|Top Destinations/i.test(t)) {
        var sec = headings[i].closest("section");
        return sec || headings[i].parentElement;
      }
    }
    return document.querySelector(".st-destinations-home-mount");
  }

  function mount(items, settings) {
    if (document.querySelector(".st-destinations-home")) return true;
    if (settings && settings.enabled === false) return true;
    var host = findSection();
    if (!host) return false;
    if (host.closest("section.relative") || host.closest(".st-hero-services")) return false;
    host.replaceWith(build(items, settings || {}));
    return true;
  }

  function start(items, settings) {
    if (mount(items, settings)) return;
    var n = 0;
    var t = setInterval(function () {
      if (mount(items, settings) || ++n > 40) clearInterval(t);
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

  Promise.all([
    load("/api2/site/destinations?collection=home"),
    load("/api2/site/destinations/settings").catch(function () {
      return {};
    }),
  ])
    .then(function (res) {
      var items = listOf(res[0]);
      var settings = res[1] || {};
      if (items.length) return { items: items, settings: settings };
      return load("/api2/site/destinations?homepageFeatured=true").then(function (r) {
        return { items: listOf(r), settings: settings };
      });
    })
    .then(function (payload) {
      if (payload.items.length) return payload;
      return load("/api2/site/destinations?popular=true").then(function (r) {
        return { items: listOf(r), settings: payload.settings };
      });
    })
    .then(function (payload) {
      start(payload.items, payload.settings);
    })
    .catch(function () {
      start([], {});
    });
})();
