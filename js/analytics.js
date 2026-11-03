/**
 * analytics.js — отправка событий GA4 через window.dataLayer.
 * Подключается раньше остальных скриптов:
 *   <script src="js/analytics.js"></script>
 *
 * Публичный API (глобальные функции):
 *   trackEvent(eventName, params)
 *   trackEcommerce(eventName, { currency, value, items, ...прочее })
 */
(function () {
  'use strict';

  // Если dataLayer ещё нет (GTM не загружен или файл открыт локально) — создаём.
  window.dataLayer = window.dataLayer || [];

  /**
   * Кладёт в dataLayer объект { event, ...params }.
   * @param {string} eventName — имя события GA4, например "contact_click".
   * @param {Object} [params]  — параметры события.
   * @returns {Object|null} — отправленный объект (удобно для отладки).
   */
  function trackEvent(eventName, params) {
    if (typeof eventName !== 'string' || eventName.trim() === '') {
      return null;
    }

    const payload = Object.assign(
      { event: eventName.trim() },
      params && typeof params === 'object' ? params : {}
    );

    window.dataLayer.push(payload);
    return payload;
  }

  /**
   * Событие электронной коммерции (view_item_list, select_item, add_to_cart,
   * begin_checkout, purchase и т. п.) в формате GA4.
   *
   * Перед отправкой очищает прошлый объект ecommerce — это требование GA4,
   * иначе данные соседних событий могут смешаться.
   *
   * @param {string} eventName
   * @param {Object} data
   * @param {string} [data.currency='RUB']
   * @param {number} [data.value]   — если не передан, считается по items
   * @param {Array}  [data.items]   — [{ item_id, item_name, price, quantity, ... }]
   */
  function trackEcommerce(eventName, data) {
    if (typeof eventName !== 'string' || eventName.trim() === '') {
      return null;
    }

    const source = data && typeof data === 'object' ? data : {};
    const items = Array.isArray(source.items) ? source.items : [];

    let value = Number(source.value);
    if (!Number.isFinite(value)) {
      value = items.reduce(function (sum, item) {
        const price = Number(item && item.price) || 0;
        const qty = Number(item && item.quantity) || 1;
        return sum + price * qty;
      }, 0);
    }

    // Всё, кроме служебных полей, переносим в ecommerce (например, transaction_id).
    const ecommerce = Object.assign({}, source, {
      currency: source.currency || 'RUB',
      value: value,
      items: items
    });

    window.dataLayer.push({ ecommerce: null });

    const payload = { event: eventName.trim(), ecommerce: ecommerce };
    window.dataLayer.push(payload);
    return payload;
  }

  window.trackEvent = trackEvent;
  window.trackEcommerce = trackEcommerce;
})();
