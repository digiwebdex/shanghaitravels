/**
 * Shanghai Travels — Auth Entry System (production injector)
 * Mounts Login / Register workspace choosers on the public marketing header
 * without rebuilding the Bangladesh-localized SPA bundle.
 */
(function () {
  "use strict";

  var ERP = {
    staffLogin: "/erp/#/login",
    corporateLogin: "/erp/#/portal/corporate/login",
    agentLogin: "/erp/#/portal/agent/login",
    customerLogin: "/erp/#/portal/customer/login",
    agentRegister: "/erp/#/portal/agent/register",
    customerRegister: "/erp/#/portal/customer/register",
    contact: "/contact",
  };

  var LOGIN_ITEMS = [
    { title: "Staff ERP", desc: "Internal employees & administrators", href: ERP.staffLogin, icon: "shield" },
    { title: "Corporate Portal", desc: "Corporate travel managers", href: ERP.corporateLogin, icon: "building" },
    { title: "Agent Portal", desc: "Travel partners & B2B agents", href: ERP.agentLogin, icon: "handshake" },
    { title: "Customer Portal", desc: "Track applications, payments & documents", href: ERP.customerLogin, icon: "user" },
  ];

  var REGISTER_ITEMS = [
    { title: "Become an Agent", desc: "Apply to become a Shanghai Travels partner.", href: ERP.agentRegister, icon: "handshake" },
    { title: "Customer Registration", desc: "Create your customer account.", href: ERP.customerRegister, icon: "user" },
  ];

  var ICONS = {
    shield:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-8 8.5C7.5 20.5 4 18 4 13V6l8-3 8 3z"/></svg>',
    building:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>',
    handshake:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/></svg>',
    user:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    chevron:
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    arrow:
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
  };

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function itemRow(item) {
    var a = el("a", "st-auth-item");
    a.href = item.href;
    a.setAttribute("role", "menuitem");
    a.innerHTML =
      '<span class="st-auth-icon" aria-hidden="true">' +
      ICONS[item.icon] +
      "</span><span class=\"st-auth-item-body\"><span class=\"st-auth-item-title\">" +
      item.title +
      '<span class="st-auth-arrow">' +
      ICONS.arrow +
      '</span></span><span class="st-auth-item-desc">' +
      item.desc +
      "</span></span>";
    return a;
  }

  function buildPanel(kind) {
    var isLogin = kind === "login";
    var panel = el("div", "st-auth-panel");
    panel.setAttribute("role", "menu");
    panel.setAttribute("aria-label", isLogin ? "Choose your workspace" : "Choose account type");

    var head = el("div", "st-auth-panel-head");
    head.innerHTML =
      '<p class="st-auth-panel-title">' +
      (isLogin ? "Welcome Back" : "Create Account") +
      '</p><p class="st-auth-panel-sub">' +
      (isLogin ? "Choose your workspace" : "Choose account type") +
      "</p>";
    panel.appendChild(head);

    var list = el("div", "st-auth-panel-list");
    (isLogin ? LOGIN_ITEMS : REGISTER_ITEMS).forEach(function (item) {
      list.appendChild(itemRow(item));
    });
    panel.appendChild(list);

    if (!isLogin) {
      var foot = el("div", "st-auth-panel-foot");
      foot.innerHTML =
        '<p class="st-auth-corp-title">Need Corporate Access?</p>' +
        '<p class="st-auth-corp-desc">Corporate accounts are created by our sales team.</p>' +
        '<a class="st-auth-corp-btn" href="' +
        ERP.contact +
        '">Contact Sales ' +
        ICONS.arrow +
        "</a>";
      panel.appendChild(foot);
    }
    return panel;
  }

  function closeAll(root) {
    root.querySelectorAll(".st-auth-dropdown.is-open").forEach(function (d) {
      d.classList.remove("is-open");
      var btn = d.querySelector(".st-auth-trigger");
      if (btn) btn.setAttribute("aria-expanded", "false");
    });
  }

  function makeDropdown(kind, accent, mobile) {
    var wrap = el("div", "st-auth-dropdown" + (mobile ? " st-auth-dropdown--mobile" : ""));
    wrap.dataset.kind = kind;

    var btn = el("button", "st-auth-trigger" + (accent ? " st-auth-trigger--accent" : ""));
    btn.type = "button";
    btn.setAttribute("aria-haspopup", "menu");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", kind === "login" ? "Login — choose workspace" : "Register — choose account type");
    btn.innerHTML =
      (kind === "login" ? "Login" : "Register") +
      '<span class="st-auth-chevron">' +
      ICONS.chevron +
      "</span>";

    var panel = buildPanel(kind);
    var panelId = "st-auth-" + kind + "-" + Math.random().toString(36).slice(2, 8);
    panel.id = panelId;
    btn.setAttribute("aria-controls", panelId);

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var root = wrap.closest(".st-auth-root") || document;
      var willOpen = !wrap.classList.contains("is-open");
      closeAll(root);
      if (willOpen) {
        wrap.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
    });

    btn.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        var root = wrap.closest(".st-auth-root") || document;
        closeAll(root);
        wrap.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
        var first = panel.querySelector("a");
        if (first) first.focus();
      }
    });

    wrap.appendChild(btn);
    wrap.appendChild(panel);
    return wrap;
  }

  function buildDesktopBar() {
    var root = el("div", "st-auth-root st-auth-root--desktop");
    root.appendChild(makeDropdown("login", false, false));
    root.appendChild(makeDropdown("register", true, false));
    return root;
  }

  function buildMobileBlock() {
    var root = el("div", "st-auth-root st-auth-root--mobile");
    var label = el("p", "st-auth-mobile-label");
    label.textContent = "Account";
    root.appendChild(label);
    root.appendChild(makeDropdown("login", false, true));
    root.appendChild(makeDropdown("register", true, true));
    return root;
  }

  function findDesktopCtaHost(header) {
    var nodes = header.querySelectorAll("div");
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var cls = n.className || "";
      if (cls.indexOf("hidden") === -1 || cls.indexOf("lg:flex") === -1) continue;
      var text = (n.textContent || "").replace(/\s+/g, " ");
      if (/Request a Service|Sign In|Apply Now/.test(text) && n.querySelectorAll("a").length >= 1) {
        return n;
      }
    }
    for (var j = 0; j < nodes.length; j++) {
      if ((nodes[j].textContent || "").indexOf("Request a Service") !== -1 && nodes[j].children.length <= 3) {
        return nodes[j];
      }
    }
    return null;
  }

  function findMobileCtaHost(header) {
    var links = header.querySelectorAll("a");
    for (var i = 0; i < links.length; i++) {
      var t = (links[i].textContent || "").trim();
      if (t === "Request a Service" || t === "Apply Now" || t === "Sign In") {
        var parent = links[i].parentElement;
        if (parent && parent.children.length <= 3) return parent;
      }
    }
    return null;
  }

  function syncSolidState(header, desktopRoot) {
    function update() {
      var solid =
        header.className.indexOf("bg-white") !== -1 ||
        header.className.indexOf("backdrop-blur") !== -1;
      desktopRoot.classList.toggle("st-auth-solid", solid);
      desktopRoot.classList.toggle("st-auth-transparent", !solid);
    }
    update();
    new MutationObserver(update).observe(header, { attributes: true, attributeFilter: ["class"] });
  }

  function wireGlobalDismiss(root) {
    document.addEventListener("mousedown", function (e) {
      if (!root.contains(e.target)) closeAll(root);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeAll(root);
    });
  }

  var mountedDesktop = false;
  var mountedMobile = false;

  function mount() {
    var header = document.querySelector("header");
    if (!header) return;

    if (!mountedDesktop) {
      var desktopHost = findDesktopCtaHost(header);
      if (desktopHost && !desktopHost.querySelector(".st-auth-root")) {
        var desktop = buildDesktopBar();
        desktopHost.innerHTML = "";
        desktopHost.appendChild(desktop);
        syncSolidState(header, desktop);
        wireGlobalDismiss(desktop);
        mountedDesktop = true;
      }
    }

    if (!mountedMobile) {
      var mobileHost = findMobileCtaHost(header);
      if (mobileHost && !mobileHost.querySelector(".st-auth-root")) {
        var mobile = buildMobileBlock();
        mobileHost.innerHTML = "";
        mobileHost.appendChild(mobile);
        wireGlobalDismiss(mobile);
        mountedMobile = true;
      }
    }
  }

  function start() {
    mount();
    var n = 0;
    var t = setInterval(function () {
      mount();
      if ((mountedDesktop && mountedMobile) || ++n > 40) clearInterval(t);
    }, 250);

    // Mobile menu opens after click — watch for CTA row
    var header = document.querySelector("header");
    if (header) {
      new MutationObserver(function () {
        mount();
      }).observe(header, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
