(function () {
  "use strict";

  var CFG = window.KANGAROO_CONFIG;
  var I18N = window.KANGAROO_I18N;
  var LANGS = ["ru", "uz"];
  var lang = "ru";

  // ── Утилиты ────────────────────────────────────────────
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function t(key, vars) {
    var s = I18N[lang][key];
    if (s == null) s = "";
    if (vars) Object.keys(vars).forEach(function (k) { s = s.split("{" + k + "}").join(vars[k]); });
    return s;
  }
  function money(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }
  function cur() { return CFG.currency[lang]; }
  function pick(v) { return v && typeof v === "object" ? v[lang] : v; }
  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
  }

  // ── Аналитика ─────────────────────────────────────────
  window.dataLayer = window.dataLayer || [];
  function loadScript(src) { var s = document.createElement("script"); s.async = true; s.src = src; document.head.appendChild(s); }
  (function initAnalytics() {
    var a = CFG.analytics || {};
    if (a.ga4) {
      loadScript("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(a.ga4));
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", a.ga4);
    }
    if (a.yandexMetrika) {
      window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
      window.ym.l = Date.now();
      loadScript("https://mc.yandex.ru/metrika/tag.js");
      window.ym(Number(a.yandexMetrika), "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
    }
    if (a.metaPixel) {
      var f = window.fbq = function () { f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments); };
      f.push = f; f.loaded = true; f.version = "2.0"; f.queue = [];
      loadScript("https://connect.facebook.net/en_US/fbevents.js");
      window.fbq("init", a.metaPixel);
      window.fbq("track", "PageView");
    }
  })();

  function track(event, params) {
    params = params || {};
    params.lang = lang;
    try {
      window.dataLayer.push(Object.assign({ event: event }, params));
      if (window.gtag && CFG.analytics.ga4) window.gtag("event", event, params);
      if (window.ym && CFG.analytics.yandexMetrika) window.ym(Number(CFG.analytics.yandexMetrika), "reachGoal", event, params);
      if (window.fbq && CFG.analytics.metaPixel && event.indexOf("click_register") === 0) {
        window.fbq("track", "Lead", { content_name: event, placement: params.placement });
      }
    } catch (e) { /* аналитика не должна ломать страницу */ }
  }

  // ── Ссылки регистрации (+ UTM из рекламы) ─────────────
  var query = new URLSearchParams(location.search);
  var utm = {};
  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (k) {
    var v = query.get(k) || sessionGet(k);
    if (v) { utm[k] = v; sessionSet(k, v); }
  });
  function sessionGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function sessionSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* noop */ } }

  function siteUrl(placement) {
    var url;
    try { url = new URL(CFG.links.register, location.href); } catch (e) { return CFG.links.register; }
    if (CFG.passUtm) {
      Object.keys(utm).forEach(function (k) { url.searchParams.set(k, utm[k]); });
      if (!utm.utm_source) url.searchParams.set("utm_source", "landing");
      if (!utm.utm_content) url.searchParams.set("utm_content", placement);
    }
    url.searchParams.set("lang", lang);
    return url.toString();
  }
  function telegramUrl() {
    var url = CFG.links.telegramBot;
    if (CFG.passUtm && utm.utm_source) {
      var payload = ("landing_" + utm.utm_source + (utm.utm_campaign ? "_" + utm.utm_campaign : ""))
        .replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 64);
      url += (url.indexOf("?") > -1 ? "&" : "?") + "start=" + payload;
    }
    return url;
  }

  function updateLinks() {
    $$("[data-cta]").forEach(function (a) {
      var type = a.getAttribute("data-cta");
      a.href = type === "telegram" ? telegramUrl() : siteUrl(a.getAttribute("data-placement") || "");
      a.target = "_blank";
      a.rel = "noopener";
    });
    $$("[data-link]").forEach(function (a) {
      var key = a.getAttribute("data-link");
      var v = CFG.links[key];
      if (!v) return;
      a.href = key === "phone" ? "tel:" + v : v;
      if (v === "#") { a.removeAttribute("target"); }
    });
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-cta]");
    if (!a) return;
    var type = a.getAttribute("data-cta");
    track(type === "telegram" ? "click_register_telegram" : "click_register_site", {
      placement: a.getAttribute("data-placement") || "unknown",
      price: currentTier().amount,
    });
  });

  // ── Цены и таймер ─────────────────────────────────────
  var prices = CFG.prices.map(function (p) { return Object.assign({}, p, { ts: Date.parse(p.from) }); })
    .sort(function (a, b) { return a.ts - b.ts; });

  function currentIndex(now) {
    var idx = -1;
    for (var i = 0; i < prices.length; i++) if (now >= prices[i].ts) idx = i;
    // До начала первого тарифа показываем его как актуальный
    return idx === -1 ? 0 : idx;
  }
  function currentTier() { return prices[currentIndex(Date.now())]; }

  function renderPrices() {
    var now = Date.now();
    var idx = currentIndex(now);
    var tiers = $("#tiers");
    tiers.innerHTML = "";
    prices.forEach(function (p, i) {
      var el = document.createElement("div");
      el.className = "tier" + (i === idx ? " is-current" : "") + (i < idx ? " is-past" : "");
      var badge = i === idx ? (i === 0 ? t("price.best") : t("price.current")) : (i < idx ? t("price.past") : "");
      el.innerHTML =
        (badge ? '<span class="tier__badge">' + badge + "</span>" : "") +
        '<span class="tier__period">' + pick(p.label) + "</span>" +
        '<strong class="tier__amount">' + money(p.amount) + "</strong>" +
        '<span class="tier__cur">' + cur() + "</span>";
      tiers.appendChild(el);
    });

    var current = prices[idx].amount;
    var max = prices[prices.length - 1].amount;
    $$("[data-price='current']").forEach(function (el) { el.textContent = money(current); });
    $$("[data-currency]").forEach(function (el) { el.textContent = cur(); });

    var saving = $(".saving");
    if (current < max) {
      saving.hidden = false;
      var amount = money(max - current) + " " + cur();
      $("#savingText").innerHTML = idx === 0 ? t("price.save", { amount: amount }) : t("price.saveNow", { amount: amount });
    } else {
      saving.hidden = true;
    }

    var next = prices[idx + 1];
    var timer = $("#timer");
    timer.classList.toggle("is-final", !next);
    $("#timerLabel").textContent = next ? t("price.timer") : t("price.timerFinal");
    deadline = next ? next.ts : null;
    tick();
  }

  var deadline = null;
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  function tick() {
    if (!deadline) return;
    var diff = deadline - Date.now();
    if (diff <= 0) { renderPrices(); return; } // автоматическая смена цены
    var s = Math.floor(diff / 1000);
    $("[data-t='d']").textContent = Math.floor(s / 86400);
    $("[data-t='h']").textContent = pad(Math.floor(s % 86400 / 3600));
    $("[data-t='m']").textContent = pad(Math.floor(s % 3600 / 60));
    $("[data-t='s']").textContent = pad(s % 60);
  }
  setInterval(tick, 1000);

  // ── Статистика / дата ─────────────────────────────────
  function renderStats() {
    var st = CFG.stats;
    var years = new Date().getFullYear() - st.since;
    $("#statSince").textContent = t("world.since", { year: st.since });
    $("#statSinceText").textContent = t("world.sinceText", { n: years });
    $("#statCountries").textContent = st.countries;
    $("#statParticipants").textContent = pick(st.participants);

    var heroDate = $("#heroDate");
    if (CFG.contestDate) {
      var d = new Date(CFG.contestDate + "T00:00:00+05:00");
      var fmt = d.toLocaleDateString(lang === "uz" ? "uz-Latn-UZ" : "ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Tashkent" });
      heroDate.textContent = t("hero.dateSet", { date: fmt });
    }
    $("#copy").textContent = t("footer.copy", { year: new Date().getFullYear() });
  }

  // ── Языки ─────────────────────────────────────────────
  function applyLang(next, user) {
    if (LANGS.indexOf(next) === -1) next = "ru";
    lang = next;
    document.documentElement.lang = lang === "uz" ? "uz-Latn" : "ru";

    $$("[data-i18n]").forEach(function (el) { el.textContent = t(el.getAttribute("data-i18n")); });
    $$("[data-i18n-html]").forEach(function (el) { el.innerHTML = t(el.getAttribute("data-i18n-html")); });
    $$("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var p = pair.split(":");
        el.setAttribute(p[0].trim(), t(p[1].trim()));
      });
    });
    document.title = t("meta.title");
    $$(".lang button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === lang)); });
    $("#taskFigure").setAttribute("aria-label", t("task.figureAlt"));

    renderPrices();
    renderStats();
    renderTaskOptions();
    updateLinks();
    if (window.__mapReady) window.__mapReady();

    if (user) {
      store("lang", lang);
      var u = new URL(location.href);
      u.searchParams.set("lang", lang);
      history.replaceState(null, "", u.toString());
      track("lang_switch", { to: lang });
    }
  }

  $$(".lang button").forEach(function (b) {
    b.addEventListener("click", function () { applyLang(b.getAttribute("data-lang"), true); });
  });

  // ── Меню ──────────────────────────────────────────────
  var burger = $(".burger");
  var menu = $("#menu");
  function setMenu(open) {
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", t(open ? "nav.close" : "nav.menu"));
    menu.hidden = !open;
  }
  burger.addEventListener("click", function () { setMenu(menu.hidden); });
  menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  // ── Шапка и закреплённая панель ───────────────────────
  var topbar = $(".topbar");
  var sticky = $("#stickyCta");
  var heroCta = $(".hero .cta-group");
  var finalBlock = $(".final");
  var heroOut = false, finalIn = false;
  function updateSticky() {
    var show = heroOut && !finalIn;
    sticky.classList.toggle("is-visible", show);
    document.body.style.setProperty("--sticky-h", show ? sticky.offsetHeight + "px" : "0px");
  }
  window.addEventListener("scroll", function () { topbar.classList.toggle("is-scrolled", window.scrollY > 8); }, { passive: true });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { heroOut = !en[0].isIntersecting && en[0].boundingClientRect.top < 0; updateSticky(); }).observe(heroCta);
    new IntersectionObserver(function (en) { finalIn = en[0].isIntersecting; updateSticky(); }, { threshold: .3 }).observe(finalBlock);
  } else {
    heroOut = true; updateSticky();
  }

  // ── Карта мира ────────────────────────────────────────
  var SVGNS = "http://www.w3.org/2000/svg";
  function svgEl(name, attrs) {
    var el = document.createElementNS(SVGNS, name);
    Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }
  function loadMap() {
    var canvas = $("#mapCanvas");
    fetch("assets/world-map.svg").then(function (r) { return r.text(); }).then(function (txt) {
      canvas.innerHTML = txt;
      var svg = canvas.querySelector("svg");
      var part = {};
      CFG.map.countries.forEach(function (c) { part[c] = true; });
      $$("path[data-iso]", svg).forEach(function (p) {
        var iso = p.getAttribute("data-iso");
        if (part[iso]) p.classList.add("is-part");
        if (iso === CFG.map.highlight) p.classList.add("is-uz");
      });

      var x = parseFloat(svg.getAttribute("data-uz-x"));
      var y = parseFloat(svg.getAttribute("data-uz-y"));
      var marker = svgEl("g", { "class": "map__marker" });
      marker.appendChild(svgEl("circle", { "class": "pulse", cx: x, cy: y, r: 14 }));
      marker.appendChild(svgEl("circle", { "class": "dot", cx: x, cy: y, r: 8 }));
      // Подпись рисуется в координатах карты; на узких экранах увеличиваем её,
      // чтобы «Узбекистан» оставался читаемым (не меньше ~13px на экране)
      var label = svgEl("g", {});
      var rect = svgEl("rect", { x: -70, y: -66, rx: 10, height: 38, width: 140 });
      var text = svgEl("text", { x: 0, y: -40, "text-anchor": "middle" });
      var tail = svgEl("path", { d: "M-8 -29 L0 -16 L8 -29Z", fill: "#1F7FD1" });
      label.appendChild(rect); label.appendChild(tail); label.appendChild(text);
      marker.appendChild(label);
      svg.appendChild(marker);

      window.__mapReady = function () {
        var k = Math.min(2.2, Math.max(1, (13 / 22) * 1000 / (canvas.clientWidth || 1000)));
        label.setAttribute("transform", "translate(" + x + " " + y + ") scale(" + k.toFixed(2) + ")");
        text.textContent = t("world.uz");
        var w = Math.max(110, text.getComputedTextLength() + 36);
        rect.setAttribute("width", w);
        rect.setAttribute("x", -w / 2);
      };
      window.__mapReady();
      window.addEventListener("resize", window.__mapReady);
    }).catch(function () { canvas.closest(".map").hidden = true; });
  }
  if ("IntersectionObserver" in window) {
    var mo = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { mo.disconnect(); loadMap(); }
    }, { rootMargin: "600px" });
    mo.observe($("#map"));
  } else { loadMap(); }

  // ── Задача ────────────────────────────────────────────
  var task = CFG.task;
  var selected = -1;
  var solved = false;

  (function renderFigure() {
    var fig = $("#taskFigure");
    fig.setAttribute("role", "img");
    if (task.figure === "grid3") {
      var s = svgEl("svg", { viewBox: "0 0 156 156" });
      for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
        s.appendChild(svgEl("rect", { x: 3 + c * 50, y: 3 + r * 50, width: 50, height: 50, "class": r < 2 && c < 2 ? "hl-2" : "" }));
      }
      fig.appendChild(s);
    } else {
      var img = document.createElement("img");
      img.src = task.figure; img.alt = ""; img.loading = "lazy";
      fig.appendChild(img);
    }
  })();

  function renderTaskOptions() {
    var box = $("#taskOptions");
    box.setAttribute("aria-label", t("task.hint"));
    box.innerHTML = "";
    task.options.forEach(function (opt, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "option";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", String(i === selected));
      b.innerHTML = '<span class="option__letter">' + "ABCDE"[i] + "</span><span>" + opt + "</span>";
      if (solved) {
        if (i === task.correct) b.classList.add("is-correct");
        else if (i === selected) b.classList.add("is-wrong");
        b.disabled = true;
      }
      b.addEventListener("click", function () {
        selected = i;
        track("task_answer", { answer: opt, correct: i === task.correct });
        showSolution();
      });
      box.appendChild(b);
    });
    if (solved) renderVerdict();
  }

  function renderVerdict() {
    var v = $("#taskVerdict");
    if (selected === -1) { v.hidden = true; return; }
    v.hidden = false;
    var ok = selected === task.correct;
    v.textContent = ok ? t("task.correct") : t("task.wrong");
    v.classList.toggle("ok", ok);
  }

  function showSolution() {
    solved = true;
    $("#taskResult").hidden = false;
    $("#taskCta").hidden = false;
    $("#taskShow").hidden = true;
    $("#taskFigure").classList.add("is-solved");
    renderTaskOptions();
  }
  $("#taskShow").addEventListener("click", function () {
    track("task_show_solution", { answered: selected !== -1 });
    showSolution();
  });

  // ── FAQ ───────────────────────────────────────────────
  $$("#faqList details").forEach(function (d, i) {
    d.addEventListener("toggle", function () {
      if (!d.open) return;
      $$("#faqList details").forEach(function (o) { if (o !== d) o.open = false; });
      track("faq_open", { question: i + 1 });
    });
  });

  // ── Подстановка фото из конфига ───────────────────────
  $$("[data-img]").forEach(function (img) {
    var src = CFG.images[img.getAttribute("data-img")];
    if (src && img.getAttribute("src") !== src) img.src = src;
  });

  // ── Старт ─────────────────────────────────────────────
  var initial = query.get("lang") || store("lang") ||
    ((navigator.language || "").toLowerCase().indexOf("uz") === 0 ? "uz" : "ru");
  applyLang(initial, false);
})();
