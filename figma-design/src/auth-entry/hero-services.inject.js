/**
 * Homepage Hero Service Navigation — marketing inject.
 * Replaces booking widget / large service cards with premium pill nav.
 * Fixed routes only — no CMS/API dependency.
 */
(function () {
  "use strict";

  var NAV = [
    { icon: "🛂", title: "Visa Services", url: "/visa" },
    { icon: "✈️", title: "Air Tickets", url: "/air-ticket" },
    { icon: "🕋", title: "Hajj & Umrah", url: "/hajj" },
    { icon: "🌍", title: "Tour Packages", url: "/tours" },
  ];

  function pill(item) {
    return (
      '<li class="st-hero-nav-item">' +
      '<a class="st-hero-pill" href="' +
      item.url +
      '" aria-label="' +
      item.title +
      '">' +
      '<span class="st-hero-pill-icon" aria-hidden="true">' +
      item.icon +
      "</span>" +
      '<span class="st-hero-pill-label">' +
      item.title +
      "</span>" +
      "</a></li>"
    );
  }

  function build() {
    var root = document.createElement("div");
    root.className = "st-hero-services";
    root.innerHTML =
      '<nav aria-label="Quick access travel services">' +
      '<ul class="st-hero-nav">' +
      NAV.map(pill).join("") +
      "</ul></nav>" +
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

  function findCardHost() {
    var existing = document.querySelector(".st-hero-services");
    if (existing) return existing;
    var grids = document.querySelectorAll('ul[aria-label="Featured travel services"]');
    for (var i = 0; i < grids.length; i++) {
      if (grids[i].querySelector(".st-hero-card") || grids[i].children.length >= 3) {
        return grids[i].closest(".st-hero-services") || grids[i];
      }
    }
    return null;
  }

  function mount() {
    var next = build();
    var cards = findCardHost();
    if (cards) {
      cards.replaceWith(next);
      return true;
    }
    var host = findBookingHost();
    if (!host) return false;
    host.replaceWith(next);
    return true;
  }

  function start() {
    if (mount()) return;
    var n = 0;
    var t = setInterval(function () {
      if (mount() || ++n > 40) clearInterval(t);
    }, 250);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
