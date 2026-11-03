/**
 * catalog.js — каталог букетов: данные, рендер, фильтры, аналитика.
 * Подключается с defer после analytics.js и main.js.
 *
 * События:
 *   catalog_filter — { filter_type, filter_value[, filter_state] } при любом изменении фильтра
 *   view_item      — ecommerce, один раз на товар при попадании карточки в viewport
 *   select_item    — ecommerce, по клику на «Заказать»
 */
(function () {
  'use strict';

  window.dataLayer = window.dataLayer || [];

  /* ---------- Данные ---------- */
  const ITEMS = [
    /* Монобукеты */
    { id: 'b-101', name: 'Нежность утра', category: 'mono', color: 'pink', price: 3490,
      composition: '25 розовых тюльпанов, крафтовая бумага, атласная лента',
      img: 'img/bouquet-tulips-pink.jpg',
      alt: 'Букет «Нежность утра» из двадцати пяти розовых тюльпанов в крафтовой бумаге' },
    { id: 'b-107', name: 'Белый сад', category: 'mono', color: 'white', price: 4990,
      composition: '21 белая роза, крафтовая бумага, лента',
      img: 'img/catalog-white-garden.jpg',
      alt: 'Монобукет «Белый сад» из двадцати одной белой розы, перевязанный лентой' },
    { id: 'b-108', name: 'Рубиновый вечер', category: 'mono', color: 'red', price: 5890,
      composition: '15 красных роз, плёнка, атласная лента',
      img: 'img/catalog-ruby-evening.jpg',
      alt: 'Букет «Рубиновый вечер» из пятнадцати красных роз с атласной лентой' },
    { id: 'b-109', name: 'Лучики солнца', category: 'mono', color: 'yellow', price: 2790,
      composition: '11 жёлтых кустовых хризантем, крафт, джутовый шпагат',
      img: 'img/catalog-sunbeams.jpg',
      alt: 'Букет «Лучики солнца» из жёлтых кустовых хризантем в крафтовой бумаге' },
    { id: 'b-110', name: 'Нежность пионов', category: 'mono', color: 'pink', price: 8990,
      composition: '11 розовых пионов, крафтовая бумага, лента',
      img: 'img/catalog-peony-tenderness.jpg',
      alt: 'Монобукет «Нежность пионов» из одиннадцати розовых пионов' },
    { id: 'b-111', name: 'Облако', category: 'mono', color: 'white', price: 2500,
      composition: 'пышная белая гипсофила, крафтовая бумага, лента',
      img: 'img/catalog-cloud.jpg',
      alt: 'Воздушный букет «Облако» из белой гипсофилы в крафтовой бумаге' },

    /* Сборные букеты */
    { id: 'b-102', name: 'Тёплые объятия', category: 'mixed', color: 'pink', price: 4290,
      composition: 'кустовая роза, ранункулюс, эвкалипт, фисташка',
      img: 'img/bouquet-roses-eucalyptus.jpg',
      alt: 'Букет «Тёплые объятия» из кустовых роз, ранункулюсов и веточек эвкалипта' },
    { id: 'b-104', name: 'Лавандовый вечер', category: 'mixed', color: 'mix', price: 3990,
      composition: 'эустома, хризантема сантини, лаванда, эвкалипт',
      img: 'img/bouquet-lavender-evening.jpg',
      alt: 'Букет «Лавандовый вечер» из сиреневой эустомы, хризантем сантини и веточек лаванды' },
    { id: 'b-106', name: 'Осенний янтарь', category: 'mixed', color: 'yellow', price: 4690,
      composition: 'роза «Мандарин», хризантема, берграсс, зелень',
      img: 'img/bouquet-autumn-amber.jpg',
      alt: 'Букет «Осенний янтарь» из оранжевых роз, хризантем и декоративной травы' },
    { id: 'b-112', name: 'Бордовый бархат', category: 'mixed', color: 'red', price: 5290,
      composition: '5 красных роз, красные хризантемы, эвкалипт, крафт',
      img: 'img/catalog-burgundy-velvet.jpg',
      alt: 'Букет «Бордовый бархат» из красных роз и хризантем с эвкалиптом' },
    { id: 'b-113', name: 'Полевая симфония', category: 'mixed', color: 'mix', price: 3790,
      composition: 'ромашковые хризантемы, статица, эвкалипт, крафт',
      img: 'img/catalog-field-symphony.jpg',
      alt: 'Разноцветный букет «Полевая симфония» из ромашковых хризантем и статицы' },
    { id: 'b-114', name: 'Ванильное небо', category: 'mixed', color: 'white', price: 4590,
      composition: 'белая роза, эустома, гипсофила, эвкалипт',
      img: 'img/catalog-vanilla-sky.jpg',
      alt: 'Белый букет «Ванильное небо» из роз, эустомы и гипсофилы' },

    /* Букеты в коробке */
    { id: 'b-105', name: 'Белый шёлк', category: 'box', color: 'white', price: 5490,
      composition: 'белая роза, эустома, лизиантус, дизайнерская коробка',
      img: 'img/bouquet-white-box.jpg',
      alt: 'Коробка «Белый шёлк» с белыми розами, эустомой и лизиантусом' },
    { id: 'b-115', name: 'Розовая шкатулка', category: 'box', color: 'pink', price: 5990,
      composition: '9 розовых роз, диантус, эвкалипт, коробка',
      img: 'img/catalog-pink-casket.jpg',
      alt: 'Прямоугольная коробка «Розовая шкатулка» с розовыми розами и диантусом' },
    { id: 'b-116', name: 'Рубиновая коробка', category: 'box', color: 'red', price: 7490,
      composition: '15 красных роз, зелень, коробка с лентой',
      img: 'img/catalog-ruby-box.jpg',
      alt: 'Коробка «Рубиновая» с пятнадцатью красными розами и атласной лентой' },
    { id: 'b-117', name: 'Солнечная коробка', category: 'box', color: 'yellow', price: 4890,
      composition: 'жёлтые хризантемы, подсолнух, зелень, коробка',
      img: 'img/catalog-sunny-box.jpg',
      alt: 'Коробка «Солнечная» с жёлтыми хризантемами и подсолнухом' },
    { id: 'b-118', name: 'Конфетти', category: 'box', color: 'mix', price: 6290,
      composition: 'ранункулюс, роза, эустома, зелень, коробка',
      img: 'img/catalog-confetti.jpg',
      alt: 'Разноцветная цветочная коробка «Конфетти» с ранункулюсами, розами и эустомой' },
    { id: 'b-119', name: 'Утренняя пудра', category: 'box', color: 'pink', price: 6890,
      composition: 'пионовидные розы, маттиола, эвкалипт, коробка',
      img: 'img/catalog-morning-powder.jpg',
      alt: 'Коробка «Утренняя пудра» с пудрово-розовыми пионовидными розами и маттиолой' },

    /* Композиции в шляпной коробке */
    { id: 'b-103', name: 'Мамина любимая', category: 'hatbox', color: 'pink', price: 6790,
      composition: '15 пионовидных роз, лизиантус, зелень, шляпная коробка',
      img: 'img/bouquet-hatbox-peony-roses.jpg',
      alt: 'Композиция «Мамина любимая» из пятнадцати пионовидных роз в круглой шляпной коробке' },
    { id: 'b-120', name: 'Белая шляпка', category: 'hatbox', color: 'white', price: 7990,
      composition: '21 белая роза, эустома, зелень, шляпная коробка',
      img: 'img/catalog-white-hat.jpg',
      alt: 'Композиция «Белая шляпка» из белых роз и эустомы в круглой коробке' },
    { id: 'b-121', name: 'Красная королева', category: 'hatbox', color: 'red', price: 9490,
      composition: '25 красных роз, зелень, шляпная коробка',
      img: 'img/catalog-red-queen.jpg',
      alt: 'Композиция «Красная королева» из двадцати пяти красных роз в шляпной коробке' },
    { id: 'b-122', name: 'Золотая осень', category: 'hatbox', color: 'yellow', price: 8490,
      composition: 'подсолнухи, хризантемы, эвкалипт, шляпная коробка',
      img: 'img/catalog-golden-autumn.jpg',
      alt: 'Композиция «Золотая осень» из подсолнухов и жёлтых хризантем в шляпной коробке' },
    { id: 'b-123', name: 'Мамин праздник', category: 'hatbox', color: 'mix', price: 10990,
      composition: 'пионовидные розы, ранункулюс, гортензия, зелень, шляпная коробка',
      img: 'img/catalog-mama-holiday.jpg',
      alt: 'Яркая композиция «Мамин праздник» из пионовидных роз, ранункулюсов и гортензии в круглой коробке' },
    { id: 'b-124', name: 'Королевский сад', category: 'hatbox', color: 'pink', price: 12000,
      composition: '25 розовых пионов, ранункулюс, зелень, шляпная коробка',
      img: 'img/catalog-royal-garden.jpg',
      alt: 'Роскошная композиция «Королевский сад» из двадцати пяти розовых пионов в шляпной коробке' }
  ];

  const CATEGORY_BADGES = {
    mono: 'Монобукет',
    mixed: 'Сборный',
    box: 'В коробке',
    hatbox: 'Шляпная коробка'
  };

  const CATEGORY_NAMES = {
    mono: 'Монобукеты',
    mixed: 'Сборные букеты',
    box: 'Букеты в коробке',
    hatbox: 'Композиции в шляпной коробке'
  };

  const LIST_ID = 'catalog';
  const LIST_NAME = 'Каталог';

  /* ---------- Элементы ---------- */
  const form = document.getElementById('filters-form');
  const grid = document.getElementById('catalog-grid');
  const emptyBox = document.getElementById('catalog-empty');
  const countEl = document.getElementById('catalog-count');
  const toggleBtn = document.getElementById('filters-toggle');
  const toggleCount = document.getElementById('filters-active-count');
  const panel = document.getElementById('filters-panel');
  const fromInput = document.getElementById('price-from');
  const toInput = document.getElementById('price-to');
  const fromOut = document.getElementById('price-from-out');
  const toOut = document.getElementById('price-to-out');

  if (!form || !grid) {
    return;
  }

  const PRICE_MIN = Number(fromInput.min);
  const PRICE_MAX = Number(fromInput.max);

  /* ---------- Утилиты ---------- */
  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function formatPrice(value) {
    return Number(value).toLocaleString('ru-RU') + ' ₽';
  }

  function findItem(id) {
    return ITEMS.find(function (item) { return item.id === id; });
  }

  /* ---------- Аналитика ---------- */
  function pushEvent(name, params) {
    if (typeof window.trackEvent === 'function') {
      window.trackEvent(name, params);
    } else {
      window.dataLayer.push(Object.assign({ event: name }, params || {}));
    }
  }

  function pushEcommerce(name, item, position) {
    const payloadItem = {
      item_id: item.id,
      item_name: item.name,
      item_category: CATEGORY_NAMES[item.category],
      price: item.price,
      quantity: 1,
      index: position,
      item_list_id: LIST_ID,
      item_list_name: LIST_NAME
    };

    if (typeof window.trackEcommerce === 'function') {
      window.trackEcommerce(name, { currency: 'RUB', value: item.price, items: [payloadItem] });
    } else {
      window.dataLayer.push({ ecommerce: null });
      window.dataLayer.push({
        event: name,
        ecommerce: { currency: 'RUB', value: item.price, items: [payloadItem] }
      });
    }
  }

  /* ---------- Состояние фильтров (читается из формы) ---------- */
  function getChecked(name) {
    return Array.from(form.querySelectorAll('input[name="' + name + '"]:checked'))
      .map(function (input) { return input.value; });
  }

  function getState() {
    return {
      categories: getChecked('category'),
      colors: getChecked('color'),
      from: Number(fromInput.value),
      to: Number(toInput.value)
    };
  }

  function matches(item, state) {
    if (state.categories.length && state.categories.indexOf(item.category) === -1) {
      return false;
    }
    if (state.colors.length && state.colors.indexOf(item.color) === -1) {
      return false;
    }
    return item.price >= state.from && item.price <= state.to;
  }

  /* ---------- Рендер ---------- */
  function cardHtml(item, position) {
    const href = 'contacts.html?item_id=' + encodeURIComponent(item.id) +
      '&item_name=' + encodeURIComponent(item.name) +
      '&price=' + encodeURIComponent(item.price);

    return '' +
      '<article class="card" data-item-id="' + esc(item.id) + '" data-position="' + position + '">' +
        '<div class="card-media">' +
          '<img src="' + esc(item.img) + '" width="640" height="480" loading="lazy" alt="' + esc(item.alt) + '">' +
          '<span class="badge badge-primary">' + esc(CATEGORY_BADGES[item.category]) + '</span>' +
        '</div>' +
        '<div class="card-body">' +
          '<h3 class="card-title">' + esc(item.name) + '</h3>' +
          '<p class="card-text">Состав: ' + esc(item.composition) + '</p>' +
          '<p class="card-price">' + formatPrice(item.price) + '</p>' +
          '<div class="card-actions">' +
            '<a class="btn btn-primary" href="' + esc(href) + '"' +
              ' data-event="select_item" data-ecommerce data-item-id="' + esc(item.id) + '">Заказать</a>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  let observer = null;
  const viewedIds = new Set();

  function observeCards() {
    if (observer) {
      observer.disconnect();
    }

    const cards = Array.from(grid.querySelectorAll('.card[data-item-id]'));

    function markViewed(card) {
      const id = card.dataset.itemId;
      if (viewedIds.has(id)) {
        return;
      }
      viewedIds.add(id);
      const item = findItem(id);
      if (item) {
        pushEcommerce('view_item', item, Number(card.dataset.position));
      }
    }

    if (!('IntersectionObserver' in window)) {
      cards.forEach(markViewed);
      return;
    }

    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          markViewed(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    cards.forEach(function (card) {
      if (!viewedIds.has(card.dataset.itemId)) {
        observer.observe(card);
      }
    });
  }

  function updateActiveCount(state) {
    const priceChanged = state.from !== PRICE_MIN || state.to !== PRICE_MAX;
    const total = state.categories.length + state.colors.length + (priceChanged ? 1 : 0);

    if (toggleCount) {
      toggleCount.textContent = total ? String(total) : '';
      toggleCount.hidden = total === 0;
    }
  }

  function render() {
    const state = getState();
    const list = ITEMS.filter(function (item) { return matches(item, state); });

    grid.innerHTML = list.map(function (item, i) { return cardHtml(item, i + 1); }).join('');
    grid.hidden = list.length === 0;
    emptyBox.hidden = list.length !== 0;
    countEl.textContent = 'Показано букетов: ' + list.length + ' из ' + ITEMS.length;

    updateActiveCount(state);
    observeCards();
  }

  function updatePriceLabels() {
    fromOut.textContent = formatPrice(fromInput.value);
    toOut.textContent = formatPrice(toInput.value);
  }

  /* ---------- Обработчики фильтров ---------- */

  // Чекбоксы: категория и цвет
  form.addEventListener('change', function (e) {
    const input = e.target;

    if (input.matches('input[type="checkbox"]')) {
      render();
      pushEvent('catalog_filter', {
        filter_type: input.name,
        filter_value: input.value,
        filter_state: input.checked ? 'on' : 'off'
      });
      return;
    }

    // Ползунки: событие change срабатывает, когда пользователь отпустил ползунок
    if (input === fromInput || input === toInput) {
      pushEvent('catalog_filter', {
        filter_type: input === fromInput ? 'price_from' : 'price_to',
        filter_value: Number(input.value)
      });
    }
  });

  // Ползунки цены: перерисовка по ходу движения, «от» не может быть больше «до»
  [fromInput, toInput].forEach(function (range) {
    range.addEventListener('input', function () {
      if (Number(fromInput.value) > Number(toInput.value)) {
        if (range === fromInput) {
          toInput.value = fromInput.value;
        } else {
          fromInput.value = toInput.value;
        }
      }
      updatePriceLabels();
      render();
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
  });

  function resetFilters() {
    form.reset();
    updatePriceLabels();
    render();
    pushEvent('catalog_filter', { filter_type: 'reset', filter_value: 'all' });
  }

  document.querySelectorAll('[data-reset-filters]').forEach(function (btn) {
    btn.addEventListener('click', resetFilters);
  });

  // Раскрывающаяся панель фильтров на мобильных
  if (toggleBtn && panel) {
    toggleBtn.addEventListener('click', function () {
      const open = toggleBtn.getAttribute('aria-expanded') !== 'true';
      toggleBtn.setAttribute('aria-expanded', String(open));
      panel.classList.toggle('is-open', open);
    });
  }

  // Клик по «Заказать» — select_item (переход по ссылке продолжается как обычно)
  grid.addEventListener('click', function (e) {
    const link = e.target.closest('[data-ecommerce]');
    if (!link) {
      return;
    }
    const item = findItem(link.dataset.itemId);
    const card = link.closest('.card');
    if (item) {
      pushEcommerce('select_item', item, card ? Number(card.dataset.position) : undefined);
    }
  });

  /* ---------- Старт ---------- */

  // Переход с главной: catalog.html?cat=mono|mixed|box|hatbox
  function applyCategoryFromUrl() {
    let cat = '';
    try {
      cat = new URLSearchParams(window.location.search).get('cat') || '';
    } catch (e) {
      return;
    }

    const input = form.querySelector('input[name="category"][value="' + cat.replace(/[^a-z]/gi, '') + '"]');
    if (input) {
      input.checked = true;
    }
  }

  applyCategoryFromUrl();
  updatePriceLabels();
  render();
})();
