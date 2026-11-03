/**
 * main.js — общий скрипт для всех страниц.
 * Подключается после analytics.js:
 *   <script src="js/analytics.js"></script>
 *   <script src="js/main.js"></script>
 *
 * Что делает:
 *  1) инициализирует window.dataLayer;
 *  2) подсвечивает активный пункт меню (класс .active) по location.pathname;
 *  3) отправляет события по data-атрибутам: data-event="contact_click";
 *  4) управляет мобильным меню-бургером;
 *  5) подставляет текущий год в [data-current-year].
 */
(function () {
  'use strict';

  /* ---------- 1. dataLayer ---------- */
  window.dataLayer = window.dataLayer || [];

  document.documentElement.classList.add('js');

  /* ---------- Вспомогательное: отправка события ---------- */
  function send(eventName, params) {
    if (typeof window.trackEvent === 'function') {
      window.trackEvent(eventName, params);
    } else {
      window.dataLayer.push(Object.assign({ event: eventName }, params || {}));
    }
  }

  /* ---------- 2. Активный пункт меню ---------- */

  // Имя файла страницы из пути: "/site/catalog.html" -> "catalog.html",
  // "/" -> "index.html", "/catalog" -> "catalog.html".
  function normalizePage(pathname) {
    let file = pathname.split('/').pop() || '';

    try {
      file = decodeURIComponent(file);
    } catch (e) {
      /* оставляем как есть */
    }

    if (file === '') {
      return 'index.html';
    }
    if (!/\.html?$/i.test(file)) {
      file += '.html';
    }
    return file.toLowerCase();
  }

  function highlightActiveMenu() {
    const current = normalizePage(window.location.pathname);
    const links = document.querySelectorAll('.main-nav a');

    links.forEach(function (link) {
      const href = link.getAttribute('href');
      link.classList.remove('active');
      link.removeAttribute('aria-current');

      if (!href || href.charAt(0) === '#' || /^(mailto:|tel:)/i.test(href)) {
        return;
      }

      let target;
      try {
        target = new URL(href, window.location.href);
      } catch (e) {
        return;
      }

      // Внешние ссылки не подсвечиваем.
      if (target.origin !== window.location.origin && target.protocol !== 'file:') {
        return;
      }

      // Кнопка-призыв в шапке не считается пунктом меню.
      if (link.classList.contains('btn')) {
        return;
      }

      if (normalizePage(target.pathname) === current) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ---------- 3. События по data-атрибутам ---------- */

  // data-event-label="phone" -> { label: "phone" }
  // data-event-item-name="Нежность" -> { item_name: "Нежность" }
  const NUMERIC_KEYS = ['value', 'price', 'quantity', 'count'];

  function collectParams(el) {
    const params = {};

    Object.keys(el.dataset).forEach(function (key) {
      if (key === 'event' || key.indexOf('event') !== 0 || key.length === 5) {
        return;
      }

      const rest = key.slice(5);
      const name = (rest.charAt(0).toLowerCase() + rest.slice(1))
        .replace(/[A-Z]/g, function (ch) { return '_' + ch.toLowerCase(); });

      let value = el.dataset[key];
      if (NUMERIC_KEYS.indexOf(name) !== -1 && /^-?\d+(\.\d+)?$/.test(value)) {
        value = Number(value);
      }
      params[name] = value;
    });

    return params;
  }

  function initDataEvents() {
    document.addEventListener('click', function (e) {
      const el = e.target.closest('[data-event]');
      if (!el) {
        return;
      }

      const eventName = (el.dataset.event || '').trim();
      if (eventName) {
        send(eventName, collectParams(el));
      }
    });
  }

  /* ---------- 4. Мобильное меню ---------- */
  function initBurger() {
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.main-nav');

    if (!burger || !nav) {
      return;
    }

    const desktopQuery = window.matchMedia('(min-width: 768px)');

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      document.body.classList.toggle('no-scroll', open);
    }

    burger.addEventListener('click', function () {
      const willOpen = burger.getAttribute('aria-expanded') !== 'true';
      setOpen(willOpen);
      send('menu_toggle', { state: willOpen ? 'open' : 'close' });
    });

    // Закрываем при переходе по ссылке меню.
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        setOpen(false);
      }
    });

    // Закрываем по Escape и возвращаем фокус на кнопку.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        burger.focus();
      }
    });

    // Закрываем по клику вне шапки.
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !e.target.closest('.site-header')) {
        setOpen(false);
      }
    });

    // При переходе на десктопную ширину сбрасываем состояние.
    function onBreakpointChange(e) {
      if (e.matches) {
        setOpen(false);
      }
    }

    if (typeof desktopQuery.addEventListener === 'function') {
      desktopQuery.addEventListener('change', onBreakpointChange);
    } else if (typeof desktopQuery.addListener === 'function') {
      desktopQuery.addListener(onBreakpointChange);
    }
  }

  /* ---------- 5. Год в подвале ---------- */
  function setCurrentYear() {
    const year = String(new Date().getFullYear());
    document.querySelectorAll('[data-current-year]').forEach(function (el) {
      el.textContent = year;
    });
  }

  /* ---------- Запуск ---------- */
  function init() {
    highlightActiveMenu();
    initDataEvents();
    initBurger();
    setCurrentYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
