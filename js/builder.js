/**
 * builder.js — конструктор букета.
 * Подключается с defer после analytics.js и main.js.
 *
 * События:
 *   bouquet_build — при каждом изменении (степпер, ввод числа, упаковка):
 *     { bouquet_total, packaging, flowers: {roses, peonies, ...}, flowers_count }
 *   cta_click — по кнопке «Заказать букет» отправляет main.js (data-event),
 *     значения value и packaging в её data-атрибутах обновляются при каждом пересчёте.
 */
(function () {
  'use strict';

  window.dataLayer = window.dataLayer || [];

  /* ---------- Данные ---------- */
  const FLOWERS = {
    roses: { price: 150, forms: ['роза', 'розы', 'роз'] },
    peonies: { price: 350, forms: ['пион', 'пиона', 'пионов'] },
    tulips: { price: 120, forms: ['тюльпан', 'тюльпана', 'тюльпанов'] },
    chrysanthemums: { price: 90, forms: ['хризантема', 'хризантемы', 'хризантем'] },
    gerberas: { price: 130, forms: ['гербера', 'герберы', 'гербер'] }
  };

  const PACKAGING = {
    kraft: { price: 0, name: 'крафт-бумага' },
    film: { price: 200, name: 'плёнка' },
    box: { price: 500, name: 'коробка' },
    hatbox: { price: 900, name: 'шляпная коробка' }
  };

  const MAX_QTY = 99;
  const FLOWER_KEYS = Object.keys(FLOWERS);

  const state = {
    roses: 0,
    peonies: 0,
    tulips: 0,
    chrysanthemums: 0,
    gerberas: 0,
    packaging: 'kraft'
  };

  /* ---------- Элементы ---------- */
  const flowerGrid = document.getElementById('flower-grid');
  const packagingList = document.getElementById('packaging-list');
  const form = document.getElementById('order-form');
  const orderBtn = document.getElementById('order-btn');
  const orderHint = document.getElementById('order-hint');
  const totalEl = document.getElementById('total-value');
  const summaryEl = document.getElementById('summary-rows');
  const priceField = document.getElementById('order-price');
  const compositionField = document.getElementById('order-composition');

  if (!flowerGrid || !packagingList || !form) {
    return;
  }

  const cards = {};
  FLOWER_KEYS.forEach(function (key) {
    const card = flowerGrid.querySelector('[data-flower="' + key + '"]');
    cards[key] = {
      input: card.querySelector('[data-qty-input]'),
      minus: card.querySelector('[data-qty-minus]'),
      plus: card.querySelector('[data-qty-plus]'),
      sum: card.querySelector('[data-line-sum]')
    };
  });

  /* ---------- Утилиты ---------- */
  function formatPrice(value) {
    return Number(value).toLocaleString('ru-RU') + ' ₽';
  }

  function clamp(n) {
    return Math.max(0, Math.min(MAX_QTY, Math.floor(Number(n)) || 0));
  }

  // 1 роза, 2 розы, 5 роз; 11–14 — всегда третья форма
  function plural(n, forms) {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) {
      return forms[0];
    }
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) {
      return forms[1];
    }
    return forms[2];
  }

  /* ---------- Расчёты ---------- */
  function flowersCount() {
    return FLOWER_KEYS.reduce(function (sum, key) { return sum + state[key]; }, 0);
  }

  function flowersSum() {
    return FLOWER_KEYS.reduce(function (sum, key) {
      return sum + state[key] * FLOWERS[key].price;
    }, 0);
  }

  function total() {
    return flowersSum() + PACKAGING[state.packaging].price;
  }

  function flowersSnapshot() {
    const snapshot = {};
    FLOWER_KEYS.forEach(function (key) { snapshot[key] = state[key]; });
    return snapshot;
  }

  // «5 роз, 3 пиона; упаковка: шляпная коробка» (пусто, если цветов нет)
  function compositionText() {
    const parts = [];
    FLOWER_KEYS.forEach(function (key) {
      if (state[key] > 0) {
        parts.push(state[key] + ' ' + plural(state[key], FLOWERS[key].forms));
      }
    });

    if (!parts.length) {
      return '';
    }
    return parts.join(', ') + '; упаковка: ' + PACKAGING[state.packaging].name;
  }

  /* ---------- Аналитика ---------- */
  function trackBuild() {
    const params = {
      bouquet_total: total(),
      packaging: state.packaging,
      flowers: flowersSnapshot(),
      flowers_count: flowersCount()
    };

    if (typeof window.trackEvent === 'function') {
      window.trackEvent('bouquet_build', params);
    } else {
      window.dataLayer.push(Object.assign({ event: 'bouquet_build' }, params));
    }
  }

  /* ---------- Отрисовка ---------- */
  function renderSummary() {
    const rows = [];

    FLOWER_KEYS.forEach(function (key) {
      const n = state[key];
      if (n > 0) {
        rows.push([n + ' ' + plural(n, FLOWERS[key].forms), formatPrice(n * FLOWERS[key].price)]);
      }
    });

    if (!rows.length) {
      summaryEl.innerHTML = '<p class="text-muted">Добавьте цветы, и здесь появится состав букета.</p>';
      return;
    }

    rows.push(['Упаковка: ' + PACKAGING[state.packaging].name, formatPrice(PACKAGING[state.packaging].price)]);
    summaryEl.innerHTML = rows.map(function (row) {
      return '<div class="summary-row"><span>' + row[0] + '</span><span>' + row[1] + '</span></div>';
    }).join('');
  }

  function render() {
    FLOWER_KEYS.forEach(function (key) {
      const c = cards[key];
      const n = state[key];

      // Пока человек стёр число и печатает новое, пустое поле не трогаем
      if (!(document.activeElement === c.input && c.input.value === '')) {
        c.input.value = String(n);
      }
      c.minus.disabled = n <= 0;
      c.plus.disabled = n >= MAX_QTY;
      c.sum.textContent = formatPrice(n * FLOWERS[key].price);
    });

    const hasFlowers = flowersCount() > 0;
    const sum = total();

    totalEl.textContent = formatPrice(sum);
    orderBtn.disabled = !hasFlowers;
    orderHint.hidden = hasFlowers;

    // Данные для cta_click (их читает main.js в момент клика)
    orderBtn.dataset.eventValue = String(sum);
    orderBtn.dataset.eventPackaging = state.packaging;

    // Скрытые поля, которые уйдут в contacts.html
    priceField.value = String(sum);
    compositionField.value = compositionText();

    renderSummary();
  }

  /* ---------- Изменение состояния ---------- */
  function setQty(key, value) {
    const next = clamp(value);

    if (next === state[key]) {
      render();
      return;
    }

    state[key] = next;
    render();
    trackBuild();
  }

  function setPackaging(value) {
    if (!PACKAGING[value] || value === state.packaging) {
      return;
    }
    state.packaging = value;
    render();
    trackBuild();
  }

  /* ---------- Обработчики ---------- */
  flowerGrid.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-qty-minus], [data-qty-plus]');
    if (!btn) {
      return;
    }

    const key = btn.closest('[data-flower]').dataset.flower;
    setQty(key, state[key] + (btn.hasAttribute('data-qty-plus') ? 1 : -1));
  });

  flowerGrid.addEventListener('input', function (e) {
    const input = e.target.closest('[data-qty-input]');
    if (!input) {
      return;
    }

    const key = input.closest('[data-flower]').dataset.flower;
    const digits = input.value.replace(/\D/g, '');
    const n = digits === '' ? 0 : clamp(parseInt(digits, 10));

    // Убираем лишнее: буквы, ведущие нули, значения больше максимума
    if (digits !== '' && input.value !== String(n)) {
      input.value = String(n);
    }
    setQty(key, n);
  });

  flowerGrid.addEventListener('focusout', function (e) {
    const input = e.target.closest('[data-qty-input]');
    if (input) {
      input.value = String(state[input.closest('[data-flower]').dataset.flower]);
    }
  });

  packagingList.addEventListener('change', function (e) {
    if (e.target.name === 'packaging') {
      setPackaging(e.target.value);
    }
  });

  // Форма отправляется методом GET на contacts.html:
  // ?item_id=CUSTOM&item_name=Свой+букет&price=...&composition=...
  form.addEventListener('submit', function (e) {
    if (flowersCount() === 0) {
      e.preventDefault();
      return;
    }
    priceField.value = String(total());
    compositionField.value = compositionText();
  });

  /* ---------- Старт ---------- */
  // Браузер может восстановить значения полей при возврате назад — берём их за основу.
  function readFromDom() {
    FLOWER_KEYS.forEach(function (key) {
      state[key] = clamp(parseInt(cards[key].input.value, 10));
    });

    const checked = packagingList.querySelector('input[name="packaging"]:checked');
    state.packaging = checked && PACKAGING[checked.value] ? checked.value : 'kraft';

    const radio = packagingList.querySelector('input[name="packaging"][value="' + state.packaging + '"]');
    if (radio) {
      radio.checked = true;
    }
  }

  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      readFromDom();
      render();
    }
  });

  readFromDom();
  render();
})();
