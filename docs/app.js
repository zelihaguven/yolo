(function () {
  'use strict';

  var CATEGORIES = {
    cafe: { label: 'Cafes', one: 'Cafe', color: '#d97706', tint: '#fdf0dc', icon: '☕' },
    food: { label: 'Food', one: 'Food', color: '#ea580c', tint: '#fde8dc', icon: '🍽️' },
    bar: { label: 'Bars', one: 'Bar', color: '#6c56d6', tint: '#ebe7fb', icon: '🍹' },
    park: { label: 'Parks', one: 'Park', color: '#16a34a', tint: '#dff5e6', icon: '🌳' },
    museum: { label: 'Museums', one: 'Museum', color: '#2563eb', tint: '#e0eafc', icon: '🏛️' },
    sight: { label: 'Sights', one: 'Sight', color: '#e11d48', tint: '#fde3e9', icon: '📸' },
    study: { label: 'Study', one: 'Study', color: '#0d9488', tint: '#dcf3f1', icon: '📚' }
  };
  var PRICE = [
    { text: 'Free entry', cls: 'green' },
    { text: '€ · Low cost', cls: 'green' },
    { text: '€€ · Mid range', cls: 'yellow' },
    { text: '€€€ · Premium', cls: 'yellow' }
  ];
  var PRICE_SHORT = ['Free', '€', '€€', '€€€'];
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
  var state = { tab: 'explore', city: null, q: '', category: 'all', price: 'any', student: false };
  var openSpot = null;
  var map = null;
  var markerLayer = null;

  // ---------- helpers ----------
  function norm(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
  }
  function isStudentFriendly(s) { return s.price === 0 || s.studentDiscount; }
  function cityName(id) {
    var c = data.cities.filter(function (x) { return x.id === id; })[0];
    return c ? c.name : '';
  }
  function spotReviews(id) { return Array.isArray(reviews[id]) ? reviews[id] : []; }
  function average(list) {
    if (!list.length) return null;
    return list.reduce(function (a, r) { return a + r.rating; }, 0) / list.length;
  }
  function starText(n) {
    var r = Math.round(n);
    return '★★★★★'.slice(0, r) + '☆☆☆☆☆'.slice(0, 5 - r);
  }
  function savedCount() {
    return data.spots.filter(function (s) { return saved[s.id]; }).length;
  }
  function filtered() {
    var q = norm(state.q.trim());
    var list = data.spots.filter(function (s) {
      if (q && norm(s.name).indexOf(q) === -1) return false;
      if (state.tab === 'saved') return !!saved[s.id];
      if (s.city !== state.city) return false;
      if (state.category !== 'all' && s.category !== state.category) return false;
      if (state.price !== 'any' && s.price > Number(state.price)) return false;
      if (state.student && !isStudentFriendly(s)) return false;
      return true;
    });
    if (state.tab === 'saved') {
      return list.sort(function (a, b) { return saved[b.id] < saved[a.id] ? -1 : 1; });
    }
    return list.sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); });
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
        if (state.tab === 'saved') state.tab = 'explore';
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

  function chips(s) {
    var wrap = el('span', 'chiprow');
    var p = PRICE[s.price];
    wrap.appendChild(el('span', 'chip ' + p.cls, p.text));
    if (s.studentDiscount) wrap.appendChild(el('span', 'chip green', 'Student discount'));
    return wrap;
  }
  function tags(s, withCity) {
    var wrap = el('span', 'tagrow');
    wrap.appendChild(el('span', 'tag', CATEGORIES[s.category].one));
    wrap.appendChild(el('span', 'tag', withCity ? cityName(s.city) : s.area));
    return wrap;
  }
  function thumb(s, cls) {
    var t = el('span', cls, CATEGORIES[s.category].icon);
    t.style.background = CATEGORIES[s.category].tint;
    t.setAttribute('aria-hidden', 'true');
    if (s.photo) {
      var img = el('img');
      img.alt = '';
      img.loading = 'lazy';
      img.addEventListener('error', function () { img.remove(); });
      img.src = s.photo;
      t.appendChild(img);
    }
    return t;
  }

  // ---------- data checks: a typo in spots.json should hide one spot, not break the page ----------
  function isNum(n, min, max) { return typeof n === 'number' && isFinite(n) && n >= min && n <= max; }
  function isText(v) { return typeof v === 'string' && v.trim() !== ''; }
  function sanitize(json) {
    var out = { cities: [], spots: [] };
    var cityIds = {};
    var seen = {};
    (Array.isArray(json && json.cities) ? json.cities : []).forEach(function (c) {
      if (c && isText(c.id) && isText(c.name) && isNum(c.lat, -90, 90) && isNum(c.lng, -180, 180)) {
        if (!isNum(c.zoom, 1, 19)) c.zoom = 13;
        cityIds[c.id] = true;
        out.cities.push(c);
      } else {
        console.warn('YOLO data: skipped a city with missing fields', c);
      }
    });
    (Array.isArray(json && json.spots) ? json.spots : []).forEach(function (s) {
      var why = '';
      if (!s || !isText(s.id)) why = 'missing id';
      else if (seen[s.id]) why = 'duplicate id';
      else if (!isText(s.name)) why = 'missing name';
      else if (!cityIds[s.city]) why = 'unknown city "' + s.city + '"';
      else if (!CATEGORIES[s.category]) why = 'unknown category "' + s.category + '"';
      else if (!isNum(s.price, 0, 3) || Math.floor(s.price) !== s.price) why = 'price must be 0, 1, 2 or 3';
      else if (!isNum(s.lat, -90, 90) || !isNum(s.lng, -180, 180)) why = 'bad lat/lng';
      if (why) { console.warn('YOLO data: skipped spot (' + why + ')', s); return; }
      seen[s.id] = true;
      s.studentDiscount = s.studentDiscount === true;
      s.area = isText(s.area) ? s.area : '';
      s.tip = isText(s.tip) ? s.tip : '';
      s.address = isText(s.address) ? s.address : '';
      s.photoCredit = isText(s.photoCredit) ? s.photoCredit : '';
      // Photos must be files in docs/photos/ or full https links.
      s.photo = isText(s.photo) && /^(photos\/[\w.\-\/]+|https:\/\/\S+)$/.test(s.photo) ? s.photo : '';
      s.hours = (Array.isArray(s.hours) ? s.hours : []).filter(function (h) {
        return h && isText(h.days) && isText(h.time);
      });
      out.spots.push(s);
    });
    return out;
  }

  // ---------- shareable links: #/spot/<id> ----------
  function spotFromHash() {
    var m = /^#\/spot\/(.+)$/.exec(location.hash);
    if (!m) return null;
    var id;
    try { id = decodeURIComponent(m[1]); } catch (e) { return null; }
    return data.spots.filter(function (s) { return s.id === id; })[0] || null;
  }
  function spotUrl(s) {
    return location.origin + location.pathname + location.search + '#/spot/' + encodeURIComponent(s.id);
  }
  function setHash(hash) {
    try { history.replaceState(null, '', location.pathname + location.search + hash); } catch (e) { /* file:// */ }
  }
  function clearSpot() {
    openSpot = null;
    if (/^#\/spot\//.test(location.hash)) setHash('');
  }
  function closeDetail() {
    clearSpot();
    if ($('detail').open) $('detail').close();
  }
  function route() {
    var s = spotFromHash();
    if (s) {
      if (s.city !== state.city) {
        state.city = s.city;
        store(CITY_KEY, s.city);
        if (state.tab === 'saved') state.tab = 'explore';
        renderCities();
        render(true);
      }
      if (!openSpot || openSpot.id !== s.id) openDetail(s);
    } else {
      closeDetail();
    }
  }
  function share() {
    var s = openSpot;
    if (!s) return;
    var url = spotUrl(s);
    var copy = function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(
          function () { toast('Link copied ✓'); },
          function () { toast('Copy the link from the address bar'); }
        );
      } else {
        toast('Copy the link from the address bar');
      }
    };
    if (navigator.share) {
      navigator.share({ title: s.name + ' · YOLO', text: s.name + ' in ' + cityName(s.city), url: url })
        .catch(function (e) { if (!e || e.name !== 'AbortError') copy(); });
    } else {
      copy();
    }
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
      main.appendChild(thumb(s, 'thumb'));
      var body = el('span', 'cardbody');
      body.appendChild(el('span', 'cardtitle', s.name));
      body.appendChild(tags(s, state.tab === 'saved'));
      var foot = el('span', 'cardfoot');
      foot.appendChild(chips(s));
      var rs = spotReviews(s.id);
      var avg = average(rs);
      if (avg != null) {
        var r = el('span', 'rating');
        r.appendChild(el('span', 'star', '★'));
        r.appendChild(document.createTextNode(' ' + avg.toFixed(1)));
        r.setAttribute('aria-label', avg.toFixed(1) + ' out of 5 from ' + rs.length + ' reviews');
        foot.appendChild(r);
      }
      body.appendChild(foot);
      main.appendChild(body);
      main.addEventListener('click', function () { openDetail(s); });
      li.appendChild(main);

      var on = !!saved[s.id];
      var sb = el('button', 'savebtn' + (on ? ' on' : ''));
      sb.type = 'button';
      sb.setAttribute('aria-pressed', String(on));
      sb.setAttribute('aria-label', (on ? 'Remove from saved: ' : 'Save: ') + s.name);
      sb.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v17l-6-4-6 4V4Z"/></svg>';
      sb.addEventListener('click', function () { toggleSave(s); });
      li.appendChild(sb);
      ul.appendChild(li);
    });
  }

  function renderMap(list, recenter) {
    if (!map) return;
    markerLayer.clearLayers();
    list.forEach(function (s) {
      var m = L.circleMarker([s.lat, s.lng], {
        radius: 9, weight: 3, color: '#ffffff', fillColor: CATEGORIES[s.category].color, fillOpacity: 1
      });
      var pop = el('div', 'pop');
      pop.appendChild(el('strong', null, s.name));
      pop.appendChild(el('span', 'popmeta', CATEGORIES[s.category].one + ' · ' + PRICE_SHORT[s.price]));
      var btn = el('button', 'popbtn', 'Details');
      btn.type = 'button';
      btn.addEventListener('click', function () { openDetail(s); });
      pop.appendChild(btn);
      m.bindPopup(pop);
      m.bindTooltip(s.name);
      m.addTo(markerLayer);
    });
    if (recenter) {
      var c = data.cities.filter(function (x) { return x.id === state.city; })[0];
      if (list.length > 1) {
        map.fitBounds(L.latLngBounds(list.map(function (s) { return [s.lat, s.lng]; })).pad(0.15));
      } else if (list.length === 1) {
        map.setView([list[0].lat, list[0].lng], 15);
      } else if (c) {
        map.setView([c.lat, c.lng], c.zoom);
      }
    }
  }

  function render(recenter) {
    $('app').dataset.tab = state.tab;
    Array.prototype.forEach.call(document.querySelectorAll('.bottomnav button'), function (b) {
      if (b.dataset.tab === state.tab) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    Array.prototype.forEach.call(document.querySelectorAll('.city'), function (b) {
      b.setAttribute('aria-selected', String(state.tab !== 'saved' && b.textContent === cityName(state.city)));
    });
    renderCategories();
    var list = filtered();
    renderCards(list);
    renderMap(list, recenter);
    var n = savedCount();
    $('savedCount').textContent = n;
    $('savedLine').textContent = 'You have ' + n + ' saved location' + (n === 1 ? '' : 's');
    $('resultCount').textContent = 'Found ' + list.length + ' result' + (list.length === 1 ? '' : 's');
    $('empty').hidden = list.length > 0;
    var nothingSaved = state.tab === 'saved' && n === 0;
    $('emptyText').textContent = nothingSaved
      ? 'Nothing saved yet. Tap the bookmark on a spot to keep it here.'
      : 'No spots match your search.';
    $('reset').textContent = nothingSaved ? 'Explore spots' : 'Clear filters';
  }

  // ---------- detail + reviews ----------
  function renderDetail() {
    var s = openSpot;
    if (!s) return;
    var cat = CATEGORIES[s.category];
    $('dHero').style.background = 'linear-gradient(160deg, ' + cat.tint + ', ' + cat.color + ')';
    $('dHeroIcon').textContent = cat.icon;
    $('dTitle').textContent = s.name;
    $('dMeta').textContent = '📍 ' + (s.address || [s.area, cityName(s.city)].filter(Boolean).join(', '));

    var photo = $('dPhoto');
    photo.hidden = true;
    photo.removeAttribute('src');
    $('dCredit').hidden = true;
    if (s.photo) {
      photo.onload = function () {
        if (openSpot !== s) return;
        photo.hidden = false;
        $('dCredit').textContent = 'Photo: ' + s.photoCredit;
        $('dCredit').hidden = !s.photoCredit;
      };
      photo.onerror = function () { photo.hidden = true; };
      photo.src = s.photo;
    }

    var hours = $('dHours');
    hours.textContent = '';
    s.hours.forEach(function (h) {
      var closed = /^closed$/i.test(h.time.trim());
      hours.appendChild(el('dt', closed ? 'closed' : null, h.days));
      hours.appendChild(el('dd', closed ? 'closed' : null, h.time));
    });
    $('dHoursBlock').hidden = s.hours.length === 0;
    $('dTip').textContent = s.tip;
    var t = $('dTags'); t.textContent = ''; t.appendChild(tags(s, false));
    var c = $('dChips'); c.textContent = ''; c.appendChild(chips(s));
    $('dUnverified').hidden = s.verified !== false;

    var save = $('dSave');
    var on = !!saved[s.id];
    save.classList.toggle('on', on);
    save.setAttribute('aria-pressed', String(on));
    save.setAttribute('aria-label', on ? 'Remove from saved' : 'Save');
    $('dDirections').href = 'https://www.openstreetmap.org/directions?to=' + s.lat + '%2C' + s.lng;

    var rs = spotReviews(s.id).slice().sort(function (a, b) {
      return ((b.up || 0) - (a.up || 0)) || (b.date < a.date ? -1 : 1);
    });
    var avg = average(rs);
    $('dRating').textContent = avg == null ? 'New' : '★ ' + avg.toFixed(1);
    $('dReviewSummary').textContent = rs.length ? '(' + rs.length + ')' : '';
    $('dNoReviews').hidden = rs.length > 0;
    var ul = $('dReviews');
    ul.textContent = '';
    rs.forEach(function (r) {
      var li = el('li', 'review');
      var head = el('div', 'reviewhead');
      head.appendChild(el('span', 'avatar', r.name.charAt(0).toUpperCase()));
      var who = el('div', 'who');
      who.appendChild(el('strong', null, r.name));
      who.appendChild(el('span', null, new Date(r.date).toLocaleDateString()));
      head.appendChild(who);
      var st = el('span', 'stars-ro', starText(r.rating));
      st.setAttribute('aria-label', r.rating + ' out of 5');
      head.appendChild(st);
      li.appendChild(head);
      li.appendChild(el('p', null, '“' + r.text + '”'));
      var foot = el('div', 'reviewfoot');
      var up = el('button', 'upvote' + (r.up ? ' on' : ''), '👍 ' + (r.up || 0));
      up.type = 'button';
      up.setAttribute('aria-pressed', String(!!r.up));
      up.setAttribute('aria-label', 'Helpful, ' + (r.up || 0) + (r.up === 1 ? ' vote' : ' votes'));
      up.addEventListener('click', function () {
        spotReviews(s.id).forEach(function (x) { if (x.id === r.id) x.up = x.up ? 0 : 1; });
        store(REVIEWS_KEY, reviews);
        renderDetail();
      });
      foot.appendChild(up);
      var del = el('button', 'linkbtn', 'Delete');
      del.type = 'button';
      del.addEventListener('click', function () {
        reviews[s.id] = spotReviews(s.id).filter(function (x) { return x.id !== r.id; });
        if (!reviews[s.id].length) delete reviews[s.id];
        store(REVIEWS_KEY, reviews);
        renderDetail();
        render();
      });
      foot.appendChild(del);
      li.appendChild(foot);
      ul.appendChild(li);
    });
  }

  function openDetail(s) {
    openSpot = s;
    $('reviewForm').reset();
    $('rCount').textContent = '0';
    $('rError').hidden = true;
    paintStars();
    showForm(true);
    renderDetail();
    var d = $('detail');
    if (!d.open) d.showModal();
    d.scrollTop = 0;
    setHash('#/spot/' + encodeURIComponent(s.id));
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
    paintStars();
    showForm(false);
    renderDetail();
    render();
    $('rDone').scrollIntoView({ block: 'center' });
  }

  function paintStars() {
    var picked = document.querySelector('input[name="rating"]:checked');
    var n = picked ? Number(picked.value) : 0;
    Array.prototype.forEach.call(document.querySelectorAll('#rStars label'), function (l, i) {
      l.classList.toggle('on', i < n);
    });
  }
  function showForm(show) {
    $('reviewForm').hidden = !show;
    $('rDone').hidden = show;
  }

  function buildStars() {
    var box = $('rStars');
    for (var i = 1; i <= 5; i++) {
      var input = el('input');
      input.type = 'radio'; input.name = 'rating'; input.value = String(i); input.id = 'star' + i;
      var label = el('label', null, '★');
      label.htmlFor = 'star' + i;
      label.setAttribute('aria-label', i + (i === 1 ? ' star' : ' stars'));
      input.addEventListener('change', paintStars);
      box.appendChild(input);
      box.appendChild(label);
    }
  }

  // ---------- wiring ----------
  function setTab(tab) {
    state.tab = tab;
    render(true);
    if (map) {
      map.invalidateSize();
      renderMap(filtered(), true);
    }
    window.scrollTo(0, 0);
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
    $('reset').addEventListener('click', function () {
      state.q = ''; state.category = 'all'; state.price = 'any'; state.student = false;
      $('search').value = ''; $('price').value = 'any'; $('student').checked = false;
      if (state.tab === 'saved') setTab('explore'); else render();
    });
    $('mapLink').addEventListener('click', function () { setTab('map'); });
    Array.prototype.forEach.call(document.querySelectorAll('.bottomnav button'), function (b) {
      b.addEventListener('click', function () { setTab(b.dataset.tab); });
    });
    $('dClose').addEventListener('click', closeDetail);
    $('detail').addEventListener('click', function (e) { if (e.target === $('detail')) closeDetail(); });
    // Also fires for Esc and the phone's back gesture.
    $('detail').addEventListener('close', clearSpot);
    $('dShare').addEventListener('click', share);
    window.addEventListener('hashchange', route);
    $('dSave').addEventListener('click', function () { if (openSpot) toggleSave(openSpot); });
    $('rText').addEventListener('input', function (e) { $('rCount').textContent = e.target.value.length; });
    $('reviewForm').addEventListener('submit', submitReview);
    $('rBack').addEventListener('click', function () {
      showForm(true);
      $('dReviews').scrollIntoView({ block: 'start' });
    });

    fetch('data/spots.json', { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (json) {
        data = sanitize(json);
        if (!data.cities.length) throw new Error('no cities');
        var remembered = load(CITY_KEY, null);
        var known = data.cities.some(function (c) { return c.id === remembered; });
        state.city = known ? remembered : data.cities[0].id;
        initMap();
        renderCities();
        render(true);
        route();
      })
      .catch(function () {
        $('resultCount').textContent = 'Could not load the spot list. Check data/spots.json for a typo, or if you opened the file directly, run a local web server instead (see README).';
      });
  }

  init();
})();
