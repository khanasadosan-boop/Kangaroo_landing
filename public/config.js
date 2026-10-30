/*
 * НАСТРОЙКИ ЛЕНДИНГА «КЕНГУРУ–2027»
 * Всё, что может поменяться (цены, даты, ссылки, задача, фото, аналитика),
 * редактируется здесь — вёрстку трогать не нужно.
 * После правки достаточно задеплоить проект заново (git push → Railway).
 */
window.KANGAROO_CONFIG = {
  // ── Ссылки ────────────────────────────────────────────────
  links: {
    // Отдельный сайт регистрации и оплаты. ЗАМЕНИТЕ на реальный адрес.
    register: "https://olympia.uz",
    // Telegram-бот регистрации
    telegramBot: "https://t.me/Olympia_uz_bot",
    // Telegram-канал конкурса
    telegramChannel: "https://t.me/contest_kenguru_uz",
    site: "https://olympia.uz",
    phone: "+998955151500",
    // Документы (положите PDF в public/docs/ или укажите внешние ссылки)
    rules: "#",
    offer: "#",
    privacy: "#",
  },

  // Передавать utm_* из рекламы (Telegram/Instagram) на сайт регистрации,
  // а в Telegram-бот — параметр ?start=<utm_source> (латиница, цифры, _ и -).
  passUtm: true,

  // ── Цены ──────────────────────────────────────────────────
  // Тариф действует с даты `from` (включительно) до `from` следующего тарифа.
  // Время — ташкентское (UTC+05:00). Добавьте/удалите строки при необходимости.
  currency: { ru: "сум", uz: "söm" },
  prices: [
    { from: "2026-11-01T00:00:00+05:00", amount: 175000, label: { ru: "Ноябрь 2026", uz: "2026-yil noyabr" } },
    { from: "2026-12-01T00:00:00+05:00", amount: 200000, label: { ru: "С 1 декабря 2026", uz: "1-dekabr 2026-yildan" } },
    { from: "2027-01-01T00:00:00+05:00", amount: 225000, label: { ru: "С 1 января 2027", uz: "1-yanvar 2027-yildan" } },
  ],
  // До начала первого тарифа (например, в октябре) актуальным считается первый тариф.

  // Дата конкурса. Пока не утверждена — оставьте null.
  contestDate: null, // например: "2027-03-19"

  // ── Статистика «Кенгуру в мире» (уточнить перед публикацией) ──
  stats: { since: 1991, countries: "110+", participants: { ru: "7 млн+", uz: "7 mln+" } },

  // ── Карта мира: страны-участницы (коды ISO 3166-1 alpha-3) ──
  // СПИСОК ПРЕДВАРИТЕЛЬНЫЙ — сверить с подтверждёнными данными Kangourou Sans Frontières.
  map: {
    highlight: "UZB",
    countries: [
      // Европа
      "ALB","AUT","BEL","BIH","BGR","BLR","CHE","CYP","CZE","DEU","DNK","ESP","EST","FIN","FRA","GBR",
      "GRC","HRV","HUN","IRL","ISL","ITA","LTU","LUX","LVA","MDA","MKD","MNE","NLD","NOR","POL","PRT",
      "ROU","RUS","SRB","SVK","SVN","SWE","UKR","XKX",
      // Азия
      "ARM","AZE","GEO","KAZ","KGZ","TJK","TKM","UZB","MNG","CHN","IND","IDN","IRN","IRQ","ISR","JOR",
      "KHM","KOR","LBN","LKA","MYS","NPL","PAK","PHL","PSE","SAU","SYR","THA","TUR","VNM","ARE","OMN",
      "QAT","KWT","BGD","LAO","MMR","AFG",
      // Африка
      "DZA","EGY","MAR","TUN","NGA","KEN","GHA","ZAF","TZA","UGA","ETH","CMR","SEN","CIV",
      // Америка
      "USA","CAN","MEX","BRA","ARG","CHL","COL","PER","VEN","ECU","BOL","PRY","URY","CRI","PAN","GTM",
      "CUB","DOM",
      // Океания
      "AUS","NZL"
    ],
  },

  // ── Фото (замените файлы в public/assets/img/ на реальные фото) ──
  images: {
    hero: "assets/img/hero-kids.jpg",
    certificate: "assets/img/kangaroo-certificates.jpg",
    gift: "assets/img/kangaroo-gifts.jpg",
    medals: "assets/img/kangaroo-medals.jpg",
  },

  // ── Задача «Кенгуру» (предоставляется заказчиком) ─────────
  // figure: "grid3" — квадрат 3×3 из клеток (SVG рисуется автоматически),
  // либо путь к картинке, например "assets/img/task.png".
  task: {
    figure: "grid3",
    options: ["9", "10", "13", "14"],
    correct: 3, // индекс правильного ответа (с нуля) → «14»
  },

  // ── Аналитика ─────────────────────────────────────────────
  // Заполните нужные ID — счётчики подключатся автоматически.
  // События: click_register_site, click_register_telegram (с параметром placement),
  // task_answer, task_show_solution, faq_open, lang_switch.
  analytics: {
    ga4: "",            // например "G-XXXXXXX"
    yandexMetrika: "",  // например "98765432"
    metaPixel: "",      // например "1234567890"
  },
};
