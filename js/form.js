/**
 * form.js — форма заказа (contacts.html).
 * Подключается с defer после analytics.js и main.js.
 *
 * Что делает:
 *  1) заполняет скрытые поля из адресной строки (item_id, item_name, price,
 *     composition и данные расчёта доставки) и показывает сводку заказа;
 *  2) маска телефона +7 (___) ___-__-__;
 *  3) валидация с сообщениями рядом с полями (aria-invalid, aria-live);
 *  4) при успехе: номер заказа M-ГГГГ-XXXX, событие generate_lead
 *     и переход на thanks.html?order=<номер>.
 *
 * В dataLayer не отправляются имя, телефон, e-mail и адрес (персональные данные).
 */
(function () {
  'use strict';

  window.dataLayer = window.dataLayer || [];

  const form = document.getElementById('order-form');
  if (!form) {
    return;
  }

  const byId = function (id) { return document.getElementById(id); };

  const fields = {
    name: byId('name'),
    phone: byId('phone'),
    email: byId('email'),
    address: byId('address'),
    date: byId('date'),
    consent: byId('consent')
  };

  const statusBox = byId('form-status');
  const submitBtn = byId('submit-btn');

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const FIELD_ORDER = ['name', 'phone', 'email', 'address', 'date', 'consent'];

  const ZONE_LABELS = {
    center: 'Центр Москвы',
    inside_mkad: 'Внутри МКАД',
    outside_mkad: 'За МКАД'
  };

  /* ---------- Утилиты ---------- */
  function formatPrice(value) {
    return Number(value).toLocaleString('ru-RU') + ' ₽';
  }

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function toISO(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  // Границы даты считаем заново при каждой проверке — страница может простоять открытой до полуночи
  function dateBounds() {
    const min = new Date();
    min.setDate(min.getDate() + 1);
    const max = new Date();
    max.setFullYear(max.getFullYear() + 1);
    return { min: toISO(min), max: toISO(max) };
  }

  /* ---------- 1. Скрытые поля из query string ---------- */
  // Допустимые значения и длина: адрес можно подделать, поэтому ничего не берём на веру
  const HIDDEN_RULES = {
    item_id: { max: 40, test: /^[\w-]+$/ },
    item_name: { max: 120 },
    price: { max: 9, test: /^\d+(\.\d{1,2})?$/ },
    composition: { max: 300 },
    delivery_method: { max: 10, test: /^(courier|pickup)$/ },
    delivery_zone: { max: 20, test: /^(center|inside_mkad|outside_mkad)$/ },
    delivery_urgency: { max: 10, test: /^(standard|urgent)$/ },
    delivery_price: { max: 9, test: /^\d+(\.\d{1,2})?$/ },
    subscription: { max: 10, test: /^office$/ }
  };

  function fillHiddenFields() {
    let params;
    try {
      params = new URLSearchParams(window.location.search);
    } catch (e) {
      return;
    }

    Object.keys(HIDDEN_RULES).forEach(function (key) {
      const input = form.elements[key];
      if (!input) {
        return;
      }

      const rule = HIDDEN_RULES[key];
      const value = (params.get(key) || '').trim().slice(0, rule.max);
      input.value = !value || (rule.test && !rule.test.test(value)) ? '' : value;
    });
  }

  function hidden(name) {
    return form.elements[name] ? form.elements[name].value : '';
  }

  function orderValue() {
    return (Number(hidden('price')) || 0) + (Number(hidden('delivery_price')) || 0);
  }

  /* ---------- Сводка заказа ---------- */
  function summaryRow(label, value, className) {
    const row = document.createElement('div');
    row.className = className || 'summary-row';
    const left = document.createElement('span');
    left.textContent = label;
    row.appendChild(left);
    if (value) {
      const right = document.createElement('span');
      right.textContent = value;
      row.appendChild(right);
    }
    return row;
  }

  function renderSummary() {
    const body = byId('order-summary-body');
    if (!body) {
      return;
    }

    const itemName = hidden('item_name');
    const composition = hidden('composition');
    const hasItem = itemName !== '';
    const hasDelivery = hidden('delivery_price') !== '';
    const subscription = hidden('subscription') === 'office';

    if (!hasItem && !hasDelivery && !subscription) {
      return; // остаётся разметка по умолчанию: «Букет пока не выбран»
    }

    body.textContent = '';

    if (hasItem) {
      const price = Number(hidden('price')) || 0;
      body.appendChild(summaryRow(itemName, price > 0 ? formatPrice(price) : ''));

      if (composition) {
        const note = document.createElement('p');
        note.className = 'text-small text-muted mt-2';
        note.textContent = 'Состав: ' + composition;
        body.appendChild(note);
      }
    } else if (!subscription) {
      const note = document.createElement('p');
      note.className = 'text-small text-muted';
      note.textContent = 'Букет пока не выбран — опишите пожелания в комментарии или подберите его в каталоге.';
      body.appendChild(note);
    }

    if (hasDelivery) {
      let label = hidden('delivery_method') === 'pickup' ? 'Самовывоз из мастерской' : 'Доставка курьером';
      if (hidden('delivery_method') !== 'pickup' && ZONE_LABELS[hidden('delivery_zone')]) {
        label += ': ' + ZONE_LABELS[hidden('delivery_zone')];
      }
      if (hidden('delivery_urgency') === 'urgent') {
        label += ', срочно';
      }
      body.appendChild(summaryRow(label, formatPrice(Number(hidden('delivery_price')) || 0)));
    }

    if (hasItem || hasDelivery) {
      body.appendChild(summaryRow('Итого', formatPrice(orderValue()), 'summary-total'));
    }

    if (subscription) {
      const alert = document.createElement('p');
      alert.className = 'alert alert-info mt-4';
      alert.textContent = 'Вы оформляете подписку на букеты в офис. В комментарии укажите адрес офиса, удобный день и частоту доставки: раз в неделю или раз в две недели.';
      body.appendChild(alert);
    }
  }

  /* ---------- 2. Маска телефона ---------- */
  // Оставляем 10 цифр номера без кода страны (ведущие 7 или 8 отбрасываются один раз)
  function nationalDigits(raw) {
    let digits = raw.replace(/\D/g, '');
    if (digits.length && (digits.charAt(0) === '7' || digits.charAt(0) === '8')) {
      digits = digits.slice(1);
    }
    return digits.slice(0, 10);
  }

  function formatPhone(d) {
    let out = '+7';
    if (d.length > 0) { out += ' (' + d.slice(0, 3); }
    if (d.length > 3) { out += ') ' + d.slice(3, 6); }
    if (d.length > 6) { out += '-' + d.slice(6, 8); }
    if (d.length > 8) { out += '-' + d.slice(8, 10); }
    return out;
  }

  // Позиция курсора после перерисовки: сразу за тем же по счёту символом-цифрой
  function caretFor(formatted, digitsBefore) {
    if (digitsBefore <= 1) {
      return Math.min(formatted.length, 4);
    }
    let count = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted.charAt(i))) {
        count++;
      }
      if (count === digitsBefore) {
        return i + 1;
      }
    }
    return formatted.length;
  }

  fields.phone.addEventListener('input', function () {
    const input = fields.phone;
    const caret = input.selectionStart;
    const atEnd = caret === null || caret >= input.value.length;
    const digitsBefore = input.value.slice(0, caret === null ? 0 : caret).replace(/\D/g, '').length;

    const national = nationalDigits(input.value);
    const formatted = national.length ? formatPhone(national) : '';
    input.value = formatted;

    if (!atEnd && formatted) {
      const pos = caretFor(formatted, digitsBefore);
      input.setSelectionRange(pos, pos);
    }
  });

  fields.phone.addEventListener('focus', function () {
    if (fields.phone.value === '') {
      fields.phone.value = '+7 (';
      const end = fields.phone.value.length;
      // Курсор ставим после того, как браузер закончит собственную обработку фокуса
      setTimeout(function () { fields.phone.setSelectionRange(end, end); }, 0);
    }
  });

  fields.phone.addEventListener('blur', function () {
    if (nationalDigits(fields.phone.value).length === 0) {
      fields.phone.value = '';
    }
  });

  /* ---------- 3. Валидация ---------- */
  const validators = {
    name: function () {
      const value = fields.name.value.trim();
      if (!value) { return 'Введите ваше имя'; }
      return value.length < 2 ? 'Имя должно содержать минимум 2 символа' : '';
    },

    phone: function () {
      const length = nationalDigits(fields.phone.value).length;
      if (length === 0) { return 'Введите номер телефона'; }
      return length < 10 ? 'Введите номер полностью: 11 цифр, например +7 (999) 123-45-67' : '';
    },

    email: function () {
      const value = fields.email.value.trim();
      if (!value) { return 'Введите e-mail'; }
      return EMAIL_RE.test(value) ? '' : 'Проверьте e-mail: он должен выглядеть как name@example.ru';
    },

    address: function () {
      const value = fields.address.value.trim();
      if (!value) { return 'Введите адрес доставки'; }
      return value.length < 5 ? 'Адрес слишком короткий: укажите улицу, дом и квартиру' : '';
    },

    date: function () {
      const value = fields.date.value;
      if (!value) { return 'Выберите дату доставки'; }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) { return 'Выберите дату из календаря'; }

      const bounds = dateBounds();
      if (value < bounds.min) {
        return 'Выберите дату не раньше завтрашнего дня. Заказ на сегодня оформите по телефону';
      }
      return value > bounds.max ? 'Мы принимаем заказы не дальше чем на год вперёд' : '';
    },

    consent: function () {
      return fields.consent.checked ? '' : 'Отметьте согласие на обработку персональных данных';
    }
  };

  function setError(key, message) {
    const control = fields[key];
    const group = control.closest('.form-group');
    const errorEl = group ? group.querySelector('.form-error') : null;

    control.setAttribute('aria-invalid', message ? 'true' : 'false');
    control.classList.toggle('is-invalid', Boolean(message));
    if (group) {
      group.classList.toggle('has-error', Boolean(message));
    }
    if (errorEl) {
      errorEl.textContent = message;
    }
  }

  function validateField(key) {
    const message = validators[key]();
    setError(key, message);
    return message === '';
  }

  FIELD_ORDER.forEach(function (key) {
    const control = fields[key];

    // Проверяем поле, когда пользователь из него вышел
    control.addEventListener('blur', function () {
      if (key !== 'consent') {
        validateField(key);
      }
    });

    // Если ошибка уже показана — снимаем её сразу, как только поле исправлено
    control.addEventListener(key === 'consent' || key === 'date' ? 'change' : 'input', function () {
      if (key === 'consent' || control.getAttribute('aria-invalid') === 'true') {
        validateField(key);
      }
    });
  });

  function showStatus(message) {
    statusBox.textContent = message;
    statusBox.hidden = message === '';
  }

  /* ---------- 4. Отправка ---------- */
  function generateOrderId() {
    const year = new Date().getFullYear();
    let number;

    if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
      const buffer = new Uint32Array(1);
      window.crypto.getRandomValues(buffer);
      number = 1000 + (buffer[0] % 9000);
    } else {
      number = 1000 + Math.floor(Math.random() * 9000);
    }
    return 'M-' + year + '-' + number;
  }

  let submitting = false;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (submitting) {
      return;
    }

    let firstInvalid = null;
    FIELD_ORDER.forEach(function (key) {
      if (!validateField(key) && !firstInvalid) {
        firstInvalid = key;
      }
    });

    if (firstInvalid) {
      showStatus('Проверьте форму: исправьте поля, отмеченные красным.');
      fields[firstInvalid].focus();
      return;
    }

    showStatus('');
    submitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Оформляем заказ…';

    const orderId = generateOrderId();
    const params = { order_id: orderId, value: orderValue(), currency: 'RUB' };

    if (typeof window.trackEvent === 'function') {
      window.trackEvent('generate_lead', params);
    } else {
      window.dataLayer.push(Object.assign({ event: 'generate_lead' }, params));
    }

    // Короткая пауза, чтобы счётчик успел отправить событие до ухода со страницы
    setTimeout(function () {
      window.location.href = 'thanks.html?order=' + encodeURIComponent(orderId);
    }, 200);
  });

  // Возврат кнопкой «Назад»: страница восстановилась из кэша, форму снова можно отправить
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      submitting = false;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Оформить заказ';
    }
  });

  /* ---------- Старт ---------- */
  const bounds = dateBounds();
  fields.date.min = bounds.min;
  fields.date.max = bounds.max;

  fillHiddenFields();
  renderSummary();
})();
