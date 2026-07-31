/**
 * Homepage Hero Services — production inject for marketing SPA.
 * Removes booking widget; mounts CMS-driven (or default) service cards.
 */
(function () {
  "use strict";

  var DEFAULTS = [
    {
      icon: "passport",
      title: "Visa Services",
      description:
        "Tourist, business, student and family visas — prepared carefully for destinations worldwide.",
      buttonText: "Apply Now",
      url: "/inquiry?service=visa",
    },
    {
      icon: "kaaba",
      title: "Hajj & Umrah",
      description:
        "Complete pilgrimage packages with flights, hotels, transport and on-ground guidance.",
      buttonText: "View Packages",
      url: "/tours",
    },
    {
      icon: "plane",
      title: "Air Ticket",
      description: "Domestic and international tickets for individuals, families and groups.",
      buttonText: "Book Now",
      url: "/inquiry?service=air_ticket",
    },
    {
      icon: "globe",
      title: "Tour Packages",
      description: "Curated itineraries for families, honeymoons and groups — built around you.",
      buttonText: "Explore Tours",
      url: "/tours",
    },
  ];

  var ICONS = {
    passport:
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 6a2 2 0 0 1 2-2h10v18H6a2 2 0 0 1-2-2V6Z"/><path d="M16 2v18"/><path d="M8 10h4"/><path d="M8 14h4"/></svg>',
    kaaba:
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 8.5 12 4l8 4.5v11L12 24 4 19.5v-11Z"/><path d="M4 8.5 12 13l8-4.5M12 13v11"/></svg>',
    plane:
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 20 2.5 18.5 1 16.5 1.5 15 3l-3.5 3.5L4 5l-.8 1.8L10 11l-2 4.5-2.2-.7L5 16l3.5 1.5L10 21l1.2-.8-.7-2.2L15 16l4.2 6.8z"/></svg>',
    globe:
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 0 20"/><path d="M12 2a15 15 0 0 0 0 20"/></svg>',
    hotel:
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M9 14h.01"/><path d="M15 14h.01"/><path d="M9 18h.01"/><path d="M15 18h.01"/></svg>',
    bus:
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h20"/><path d="M6 18h.01"/><path d="M18 18h.01"/><rect width="18" height="14" x="3" y="4" rx="2"/></svg>',
  };

  function card(item) {
    var icon = ICONS[item.icon] || ICONS.globe;
    return (
      '<li><a class="st-hero-card" href="' +
      item.url +
      '" aria-label="' +
      item.title +
      ": " +
      item.buttonText +
      '">' +
      '<span class="st-hero-card-icon" aria-hidden="true">' +
      icon +
      "</span>" +
      '<span class="st-hero-card-title">' +
      item.title +
      "</span>" +
      '<span class="st-hero-card-desc">' +
      item.description +
      "</span>" +
      '<span class="st-hero-card-cta">' +
      item.buttonText +
      ' <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>' +
      "</a></li>"
    );
  }

  function build(items) {
    var root = document.createElement("div");
    root.className = "st-hero-services";
    root.innerHTML =
      '<ul class="st-hero-grid" aria-label="Featured travel services">' +
      items.map(card).join("") +
      "</ul>" +
      '<div class="st-hero-cta-wrap">' +
      '<a class="st-hero-cta" href="/inquiry">Request a Free Consultation' +
      ' <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></a>' +
      "</div>";
    return root;
  }

  function findBookingHost() {
    var nodes = document.querySelectorAll("section .max-w-3xl, section div");
    for (var i = 0; i < nodes.length; i++) {
      var t = (nodes[i].textContent || "").replace(/\s+/g, " ");
      if (
        /Request Quote/.test(t) &&
        (/Destination/.test(t) || /Travel Date/.test(t)) &&
        nodes[i].querySelector("button, select, input")
      ) {
        return nodes[i].classList.contains("max-w-3xl")
          ? nodes[i]
          : nodes[i].closest(".max-w-3xl") || nodes[i];
      }
    }
    return null;
  }

  function mount(items) {
    if (document.querySelector(".st-hero-services")) return true;
    var host = findBookingHost();
    if (!host) return false;
    var next = build(items);
    host.replaceWith(next);
    return true;
  }

  function start(items) {
    if (mount(items)) return;
    var n = 0;
    var t = setInterval(function () {
      if (mount(items) || ++n > 40) clearInterval(t);
    }, 250);
  }

  function mapCms(rows) {
    return (rows || [])
      .map(function (r) {
        var meta = r.meta || {};
        return {
          icon: r.coverUrl || meta.icon || "globe",
          title: r.title,
          description: r.summary || "",
          buttonText: r.body || "Learn more",
          url: meta.url || "/inquiry",
          sortOrder: r.sortOrder || 0,
        };
      })
      .sort(function (a, b) {
        return a.sortOrder - b.sortOrder;
      })
      .slice(0, 6);
  }

  fetch("/api2/site/content?type=hero_service")
    .then(function (r) {
      return r.ok ? r.json() : [];
    })
    .then(function (rows) {
      var items = mapCms(rows);
      start(items.length ? items : DEFAULTS);
    })
    .catch(function () {
      start(DEFAULTS);
    });
})();
