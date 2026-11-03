/**
 * delivery.js — калькулятор стоимости доставки.
 * Подключается с defer после analytics.js и main.js.
 *
 * Тарифы: центр 400 ₽, внутри МКАД 550 ₽, за МКАД 800 ₽; самовывоз 0 ₽;
 * «Срочно» — +300 ₽ (и к доставке курьером, и к срочной сборке при самовывозе).
 *
 * События:
 *   delivery_calc — при каждом изменении полей: { zone, method, urgency, total }
 *     (при самовывозе zone = 'none', зона на цену не влияет)
 *   cta_click — по кнопке «Перейти к заказу» отправляет main.js (data-event);
 *     её data-атрибуты (value, delivery_method, delivery_zone, delivery_urgency)
 *     обновляются при каждом пересчёте.
 */
(function () {
  'use strict';

  window.dataLayer = window.dataLayer || [];

  /* ---------- Тарифы ---------- */
  const ZONES = {
    center: { label: 'Центр Москвы', price: 400, hint: 'Внутри Садового кольца.' },
    inside_mkad: { label: 'Внутри МКАД', price: 550, hint: 'Все районы Москвы внутри МКАД, кроме центра.' },
    outside_mkad: { label: 'За МКАД', price: 800, hint: 'Ближнее Подмосковье — до 15 км от МКАД.' }
  };

  const URGENCY = {
    standard: { label: 'Стандарт — 2 часа', surcharge: 0 },
    urgent: { label: 'Срочно — 1 час', surcharge: 300 }
  };

  const PICKUP_ADDRESS = 'Москва, ул. Садовая-Кудринская, 14, строение 2';
  const DEFAULTS = { zone: 'inside_mkad', method: 'courier', urgency: 'standard' };

  /* ---------- Элементы ---------- */
  const form = document.getElementById('delivery-form');
  const zoneSelect = document.getElementById('zone');
  const zoneHint = document.getElementById('zone-hint');
  const totalEl = document.getElementById('calc-total');
  const breakdownEl = document.getElementById('calc-breakdown');
  const noteEl = document.getElementById('calc-note');
  const cta = document.getElementById('calc-cta');

  if (!form || !zoneSelect || !totalEl) {
    return;
  }

  /* ---------- Утилиты ---------- */
  function formatPrice(value) {
    return Number(value).toLocaleString('ru-RU') + ' ₽';
  }

  function checkedValue(name) {
    const input = form.querySelector('input[name="' + name + '"]:checked');
    return input ? input.value : '';
  }

  function getState() {
    const zone = ZONES[zoneSelect.value] ? zoneSelect.value : DEFAULTS.zone;
    const method = checkedValue('method') === 'pickup' ? 'pickup' : DEFAULTS.method;
    const urgency = URGENCY[checkedValue('urgency')] ? checkedValue('urgency') : DEFAULTS.urgency;
    return { zone: zone, method: method, urgency: urgency };
  }

  /* ---------- Расчёт ---------- */
  function calculate(state) {
    const base = state.method === 'pickup' ? 0 : ZONES[state.zone].price;
    const surcharge = URGENCY[state.urgency].surcharge;
    return { base: base, surcharge: surcharge, total: base + surcharge };
  }

  /* ---------- Отрисовка ---------- */
  function renderBreakdown(state, result) {
    const isPickup = state.method === 'pickup';
    const rows = [];

    rows.push([
      isPickup ? 'Самовывоз из мастерской' : 'Доставка курьером: ' + ZONES[state.zone].label,
      formatPrice(result.base)
    ]);

    if (result.surcharge > 0) {
      rows.push([
        isPickup ? 'Срочная сборка за 1 час' : 'Срочная доставка за 1 час',
        '+' + formatPrice(result.surcharge)
      ]);
    } else {
      rows.push([
        isPickup ? 'Готовность через 2 часа' : 'Стандартный срок — 2 часа',
        'включено'
      ]);
    }

    breakdownEl.innerHTML = rows.map(function (row) {
      return '<div class="summary-row"><span>' + row[0] + '</span><span>' + row[1] + '</span></div>';
    }).join('');
  }

  function renderNote(state) {
    if (state.method === 'pickup') {
      noteEl.textContent = 'Заберите букет в мастерской: ' + PICKUP_ADDRESS +
        ', ежедневно с 9:00 до 21:00. Мы позвоним, когда букет будет готов.';
    } else {
      noteEl.textContent = 'Цена указана за один адрес доставки. Точное время курьер согласует с получателем по телефону.';
    }
  }

  function renderCta(state, result) {
    const params = new URLSearchParams();
    params.set('delivery_method', state.method);
    if (state.method === 'courier') {
      params.set('delivery_zone', state.zone);
    }
    params.set('delivery_urgency', state.urgency);
    params.set('delivery_price', String(result.total));

    cta.setAttribute('href', 'contacts.html?' + params.toString());

    // Данные для cta_click (их читает main.js в момент клика)
    cta.dataset.eventValue = String(result.total);
    cta.dataset.eventDeliveryMethod = state.method;
    cta.dataset.eventDeliveryZone = state.method === 'courier' ? state.zone : 'none';
    cta.dataset.eventDeliveryUrgency = state.urgency;
  }

  function render() {
    const state = getState();
    const result = calculate(state);
    const isPickup = state.method === 'pickup';

    // При самовывозе зона не нужна
    zoneSelect.disabled = isPickup;
    zoneHint.textContent = isPickup
      ? 'При самовывозе зона не нужна — доставка не требуется.'
      : ZONES[state.zone].hint;

    totalEl.textContent = formatPrice(result.total);
    renderBreakdown(state, result);
    renderNote(state);
    renderCta(state, result);

    return { state: state, result: result };
  }

  /* ---------- Аналитика ---------- */
  function track(state, result) {
    const params = {
      zone: state.method === 'pickup' ? 'none' : state.zone,
      method: state.method,
      urgency: state.urgency,
      total: result.total
    };

    if (typeof window.trackEvent === 'function') {
      window.trackEvent('delivery_calc', params);
    } else {
      window.dataLayer.push(Object.assign({ event: 'delivery_calc' }, params));
    }
  }

  /* ---------- Обработчики ---------- */
  form.addEventListener('change', function () {
    const current = render();
    track(current.state, current.result);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
  });

  // Возврат назад: браузер мог восстановить значения полей
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      render();
    }
  });

  /* ---------- Старт ---------- */
  render();
})();
