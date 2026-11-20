(function () {
  'use strict';

  var CATEGORIES = {
    cafe: { label: 'Cafés', one: 'Café', color: '#b45309' },
    food: { label: 'Food', one: 'Food', color: '#c2410c' },
    bar: { label: 'Bars', one: 'Bar', color: '#7e22ce' },
    park: { label: 'Parks', one: 'Park', color: '#15803d' },
    museum: { label: 'Museums', one: 'Museum', color: '#1d4ed8' },
    sight: { label: 'Sights', one: 'Sight', color: '#be123c' },
    study: { label: 'Study spots', one: 'Study spot', color: '#0f766e' }
  };
  var PRICE = ['Free', '€', '€€', '€€€'];
  var REVIEWS_KEY = 'yolo.reviews.v1';
  var SAVED_KEY = 'yolo.saved.v1';
  var CITY_KEY = 'yolo.city.v1';
  var MAX_REVIEW = 500;

  var $ = function (id) { return document.getElementById(id); };
  var el = function (tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  // ---------- storage (reviews and saved spots live in this browser) ----------
  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function store(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }

  var reviews = load(REVIEWS_KEY, {});
  var saved = load(SAVED_KEY, {});
  if (!reviews || typeof reviews !== 'object') reviews = {};
  if (!saved || typeof saved !== 'object') saved = {};

  var data = { cities: [], spots: [] };
  var state = { city: null, q: '', category: 'all', price: 'any', student: false, savedOnly: false };
  var openSpot = null;
  var map = null;
  var markerLayer = null;
  var markers = {};

  // ---------- helpers ----------
  function norm(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
  }
  function isStudentFriendly(s) { return s.price === 0 || s.studentDiscount; }
  function spotReviews(id) { return Array.isArray(reviews[id]) ? reviews[id] : []; }
  function average(list) {
    if (!list.length) return null;
    return list.reduce(function (a, r) { return a + r.rating; }, 0) / list.length;
  }
  function starText(n) {
    var r = Math.round(n);
    return '★★★★★'.slice(0, r) + '☆☆☆☆☆'.slice(0, 5 - r);
  }
  function filtered() {
    var q = norm(state.q.trim());
    return data.spots.filter(function (s) {
      if (s.city !== state.city) return false;
      if (q && norm(s.name).indexOf(q) === -1) return false;
      if (state.category !== 'all' && s.category !== state.category) return false;
      if (state.price !== 'any' && s.price > Number(state.price)) return false;
      if (state.student && !isStudentFriendly(s)) return false;
      if (state.savedOnly && !saved[s.id]) return false;
      return true;
    }).sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); });
  }
  var toastTimer = null;
  function toast(msg) {
    var t = $('toast');
    ($('detail').open ? $('detail') : document.body).appendChild(t);
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2200);
  }

  // ---------- rendering ----------
  function renderCities() {
    var box = $('cities');
    box.textContent = '';
    data.cities.forEach(function (c) {
      var b = el('button', 'city', c.name);
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(c.id === state.city));
      b.addEventListener('click', function () {
        state.city = c.id;
        store(CITY_KEY, c.id);
        renderCities();
        render(true);
      });
      box.appendChild(b);
    });
  }

  function renderCategories() {
    var box = $('categories');
    box.textContent = '';
    var inCity = {};
    data.spots.forEach(function (s) { if (s.city === state.city) inCity[s.category] = true; });
    if (state.category !== 'all' && !inCity[state.category]) state.category = 'all';
    var keys = ['all'].concat(Object.keys(CATEGORIES).filter(function (k) { return inCity[k]; }));
    keys.forEach(function (k) {
      var b = el('button', 'pill', k === 'all' ? 'All' : CATEGORIES[k].label);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(state.category === k));
      b.addEventListener('click', function () { state.category = k; render(); });
      box.appendChild(b);
    });
  }

  function badges(s) {
    var wrap = el('span', 'badges');
    wrap.appendChild(el('span', 'badge price', PRICE[s.price]));
    if (s.studentDiscount) wrap.appendChild(el('span', 'badge student', 'Student discount'));
    return wrap;
  }

  function saveButton(s, withLabel) {
    var on = !!saved[s.id];
    var b = el('button', 'savebtn' + (on ? ' on' : ''));
    b.type = 'button';
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', (on ? 'Remove from saved: ' : 'Save: ') + s.name);
    b.textContent = withLabel ? (on ? '★ Saved' : '☆ Save') : (on ? '★' : '☆');
    return b;
  }

  function toggleSave(s) {
    if (saved[s.id]) { delete saved[s.id]; toast('Removed from your list'); }
    else { saved[s.id] = new Date().toISOString(); toast('Saved to your list ✓'); }
    if (!store(SAVED_KEY, saved)) toast('Could not save in this browser');
    render();
    if (openSpot && openSpot.id === s.id) renderDetail();
  }

  function renderCards(list) {
    var ul = $('cards');
    ul.textContent = '';
    list.forEach(function (s) {
      var li = el('li', 'card');
      var main = el('button', 'cardmain');
      main.type = 'button';
      var dot = el('span', 'dot');
      dot.style.background = CATEGORIES[s.category].color;
      var title = el('span', 'cardtitle');
      title.appendChild(dot);
      title.appendChild(document.createTextNode(s.name));
      main.appendChild(title);
      main.appendChild(el('span', 'cardmeta', CATEGORIES[s.category].one + ' · ' + s.area));
      main.appendChild(el('span', 'cardtip', s.tip));
      var foot = el('span', 'cardfoot');
      foot.appendChild(badges(s));
      var rs = spotReviews(s.id);
      var avg = average(rs);
      foot.appendChild(el('span', 'rating', avg == null ? 'No reviews yet' : '★ ' + avg.toFixed(1) + ' (' + rs.length + ')'));
      main.appendChild(foot);
      main.addEventListener('click', function () { openDetail(s); });
      li.appendChild(main);

      var sb = saveButton(s, false);
      sb.addEventListener('click', function () { toggleSave(s); });
      li.appendChild(sb);
      ul.appendChild(li);
    });
  }

  function renderMap(list, recenter) {
    if (!map) return;
    markerLayer.clearLayers();
    markers = {};
    list.forEach(function (s) {
      var m = L.circleMarker([s.lat, s.lng], {
        radius: 9, weight: 2, color: '#ffffff', fillColor: CATEGORIES[s.category].color, fillOpacity: 1
      });
      var pop = el('div', 'pop');
      pop.appendChild(el('strong', null, s.name));
      pop.appendChild(el('span', 'popmeta', CATEGORIES[s.category].one + ' · ' + PRICE[s.price]));
      var btn = el('button', 'popbtn', 'Details');
      btn.type = 'button';
      btn.addEventListener('click', function () { openDetail(s); });
      pop.appendChild(btn);
      m.bindPopup(pop);
      m.bindTooltip(s.name);
      m.addTo(markerLayer);
      markers[s.id] = m;
    });
    if (recenter) {
      var c = data.cities.filter(function (x) { return x.id === state.city; })[0];
      if (list.length > 1) {
        map.fitBounds(L.latLngBounds(list.map(function (s) { return [s.lat, s.lng]; })).pad(0.15));
      } else if (c) {
        map.setView([c.lat, c.lng], c.zoom);
      }
    }
  }

  function render(recenter) {
    renderCategories();
    var list = filtered();
    renderCards(list);
    renderMap(list, recenter);
    var total = data.spots.filter(function (s) { return s.city === state.city; }).length;
    $('resultCount').textContent = list.length + ' of ' + total + ' spots';
    $('empty').hidden = list.length > 0;
    $('savedCount').textContent = Object.keys(saved).length;
  }

  // ---------- detail + reviews ----------
  function renderDetail() {
    var s = openSpot;
    if (!s) return;
    $('dTitle').textContent = s.name;
    var city = data.cities.filter(function (c) { return c.id === s.city; })[0];
    $('dMeta').textContent = CATEGORIES[s.category].one + ' · ' + s.area + ', ' + (city ? city.name : '');
    $('dTip').textContent = s.tip;
    var tags = $('dTags');
    tags.textContent = '';
    tags.appendChild(badges(s));
    $('dUnverified').hidden = s.verified !== false;

    var save = $('dSave');
    var on = !!saved[s.id];
    save.textContent = on ? '★ Saved' : '☆ Save';
    save.setAttribute('aria-pressed', String(on));
    $('dDirections').href = 'https://www.openstreetmap.org/directions?to=' + s.lat + '%2C' + s.lng;

    var rs = spotReviews(s.id).slice().sort(function (a, b) { return b.date < a.date ? -1 : 1; });
    var avg = average(rs);
    $('dReviewSummary').textContent = avg == null ? '' : '★ ' + avg.toFixed(1) + ' · ' + rs.length;
    $('dNoReviews').hidden = rs.length > 0;
    var ul = $('dReviews');
    ul.textContent = '';
    rs.forEach(function (r) {
      var li = el('li', 'review');
      var head = el('div', 'reviewhead');
      head.appendChild(el('strong', null, r.name));
      var st = el('span', 'stars-ro', starText(r.rating));
      st.setAttribute('aria-label', r.rating + ' out of 5');
      head.appendChild(st);
      head.appendChild(el('span', 'muted', new Date(r.date).toLocaleDateString()));
      li.appendChild(head);
      li.appendChild(el('p', null, r.text));
      var del = el('button', 'linkbtn', 'Delete');
      del.type = 'button';
      del.addEventListener('click', function () {
        reviews[s.id] = spotReviews(s.id).filter(function (x) { return x.id !== r.id; });
        if (!reviews[s.id].length) delete reviews[s.id];
        store(REVIEWS_KEY, reviews);
        renderDetail();
        render();
      });
      li.appendChild(del);
      ul.appendChild(li);
    });
  }

  function openDetail(s) {
    openSpot = s;
    $('reviewForm').reset();
    $('rCount').textContent = '0';
    $('rError').hidden = true;
    renderDetail();
    var d = $('detail');
    if (!d.open) d.showModal();
    d.scrollTop = 0;
  }

  function submitReview(e) {
    e.preventDefault();
    if (!openSpot) return;
    var name = $('rName').value.trim();
    var text = $('rText').value.trim();
    var picked = document.querySelector('input[name="rating"]:checked');
    var err = $('rError');
    var msg = '';
    if (!name) msg = 'Please enter your name.';
    else if (!picked) msg = 'Please choose a rating from 1 to 5.';
    else if (!text) msg = 'Please write a few words about the spot.';
    else if (text.length > MAX_REVIEW) msg = 'Reviews can be at most ' + MAX_REVIEW + ' characters.';
    if (msg) { err.textContent = msg; err.hidden = false; return; }
    err.hidden = true;

    var list = spotReviews(openSpot.id).slice();
    list.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name: name, rating: Number(picked.value), text: text, date: new Date().toISOString()
    });
    reviews[openSpot.id] = list;
    if (!store(REVIEWS_KEY, reviews)) {
      err.textContent = 'Your browser blocked local storage, so the review will be lost when you leave this page.';
      err.hidden = false;
    }
    $('reviewForm').reset();
    $('rCount').textContent = '0';
    renderDetail();
    render();
    toast('Thanks for sharing!');
  }

  function buildStars() {
    var box = $('rStars');
    for (var i = 1; i <= 5; i++) {
      var input = el('input');
      input.type = 'radio'; input.name = 'rating'; input.value = String(i); input.id = 'star' + i;
      var label = el('label', null, String(i) + ' ★');
      label.htmlFor = 'star' + i;
      box.appendChild(input);
      box.appendChild(label);
    }
  }

  // ---------- wiring ----------
  function setView(v) {
    document.querySelector('.layout').dataset.view = v;
    $('showList').setAttribute('aria-pressed', String(v === 'list'));
    $('showMap').setAttribute('aria-pressed', String(v === 'map'));
    if (v === 'map' && map) {
      map.invalidateSize();
      renderMap(filtered(), true);
    }
  }

  function initMap() {
    if (!window.L) { $('map').textContent = 'The map could not be loaded.'; return; }
    map = L.map('map', { scrollWheelZoom: true });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    markerLayer = L.layerGroup().addTo(map);
  }

  function init() {
    buildStars();
    $('search').addEventListener('input', function (e) { state.q = e.target.value; render(); });
    $('price').addEventListener('change', function (e) { state.price = e.target.value; render(); });
    $('student').addEventListener('change', function (e) { state.student = e.target.checked; render(); });
    $('savedOnly').addEventListener('change', function (e) { state.savedOnly = e.target.checked; render(); });
    $('reset').addEventListener('click', function () {
      state.q = ''; state.category = 'all'; state.price = 'any'; state.student = false; state.savedOnly = false;
      $('search').value = ''; $('price').value = 'any'; $('student').checked = false; $('savedOnly').checked = false;
      render();
    });
    $('showList').addEventListener('click', function () { setView('list'); });
    $('showMap').addEventListener('click', function () { setView('map'); });
    $('dClose').addEventListener('click', function () { $('detail').close(); });
    $('detail').addEventListener('click', function (e) { if (e.target === $('detail')) $('detail').close(); });
    $('detail').addEventListener('close', function () { openSpot = null; });
    $('dSave').addEventListener('click', function () { if (openSpot) toggleSave(openSpot); });
    $('rText').addEventListener('input', function (e) { $('rCount').textContent = e.target.value.length; });
    $('reviewForm').addEventListener('submit', submitReview);

    fetch('data/spots.json')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (json) {
        data = json;
        var remembered = load(CITY_KEY, null);
        var known = data.cities.some(function (c) { return c.id === remembered; });
        state.city = known ? remembered : data.cities[0].id;
        initMap();
        renderCities();
        render(true);
      })
      .catch(function () {
        $('resultCount').textContent = 'Could not load the spot list. If you opened the file directly, run a local web server instead (see README).';
      });
  }

  init();
})();
