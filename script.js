/* ==========================================================
   VYBE — script.js  (vanilla JavaScript, no libraries)
   1 Config & data · 2 Helpers · 3 State & storage · 4 Toasts
   5 Overlays (modal/drawer) · 6 Product discovery · 7 Quick view
   8 Cart · 9 Wishlist · 10 Info & newsletter · 11 Page UI · 12 Init
   ========================================================== */
(() => {
  'use strict';

  /* 1. CONFIG & DATA ---------------------------------------- */
  const CONFIG = {
    freeShippingThreshold: 4999, // demo policy
    flatShipping: 149,           // demo policy
    maxQty: 10,
    keys: { cart: 'vybe.cart.v1', wishlist: 'vybe.wishlist.v1' }
  };

  const SHOE = ['7', '8', '9', '10'];
  const APPAREL = ['S', 'M', 'L', 'XL'];
  const ONE = ['One Size'];

  // Single source of truth: grid, trending, quick view, cart and wishlist all read from here.
  const PRODUCTS = [
    { id: 1, name: 'Cloud Runner', category: 'Sneakers', price: 2499, image: 'images/sneaker-white.jpg', alt: 'Cloud Runner white everyday sneaker', description: 'A clean everyday sneaker with a versatile silhouette.', vibes: ['Minimal', 'Everyday'], sizes: SHOE, badge: 'BESTSELLER' },
    { id: 2, name: 'Night Shift', category: 'Sneakers', price: 2999, image: 'images/sneaker-black.jpg', alt: 'Night Shift black sneaker', description: 'A sleek all-black sneaker built for after-dark city miles.', vibes: ['Street', 'Bold'], sizes: SHOE, badge: 'NEW' },
    { id: 3, name: 'Retro Pulse', category: 'Sneakers', price: 3499, image: 'images/sneaker-retro.jpg', alt: 'Retro Pulse retro-style sneaker', description: 'Throwback paneling and a chunky sole with a colour-pop attitude.', vibes: ['Bold', 'Street'], sizes: SHOE, badge: 'BESTSELLER' },
    { id: 4, name: 'Shadow Hoodie', category: 'Streetwear', price: 1999, image: 'images/hoodie-black.jpg', alt: 'Shadow Hoodie in black', description: 'A heavyweight black hoodie with a relaxed, boxy fit.', vibes: ['Street', 'Everyday'], sizes: APPAREL, badge: 'BESTSELLER' },
    { id: 5, name: 'Plain Sight Tee', category: 'Streetwear', price: 899, image: 'images/tshirt-neutral.jpg', alt: 'Plain Sight Tee in a neutral tone', description: 'A soft, neutral tee that goes with everything.', vibes: ['Minimal', 'Everyday'], sizes: APPAREL },
    { id: 6, name: 'Block Jacket', category: 'Streetwear', price: 3799, image: 'images/jacket.jpg', alt: 'Block Jacket, a structured layering jacket', description: 'A structured layer with clean lines and room to move.', vibes: ['Street', 'Bold'], sizes: APPAREL, badge: 'NEW' },
    { id: 7, name: 'City Crossbody', category: 'Bags', price: 1799, image: 'images/bag-crossbody.jpg', alt: 'City Crossbody bag', description: 'A compact crossbody with space for the daily essentials.', vibes: ['Everyday', 'Minimal'], sizes: ONE },
    { id: 8, name: 'Market Tote', category: 'Bags', price: 1499, image: 'images/bag-tote.jpg', alt: 'Market Tote bag', description: 'A roomy, no-fuss tote for work, errands and everything between.', vibes: ['Minimal', 'Everyday'], sizes: ONE },
    { id: 9, name: 'Dash Sling', category: 'Bags', price: 1299, image: 'images/bag-sling.jpg', alt: 'Dash Sling bag', description: 'A slim sling that sits close to the body and moves with you.', vibes: ['Street', 'Bold'], sizes: ONE, badge: 'NEW' },
    { id: 10, name: 'Apex Cap', category: 'Accessories', price: 799, image: 'images/cap-black.jpg', alt: 'Apex Cap in black', description: 'A low-profile black cap with an adjustable fit.', vibes: ['Street', 'Everyday'], sizes: ONE },
    { id: 11, name: 'Link Bracelet', category: 'Accessories', price: 649, image: 'images/bracelet.jpg', alt: 'Link Bracelet', description: 'A simple link bracelet that adds a quiet finishing touch.', vibes: ['Minimal', 'Bold'], sizes: ONE },
    { id: 12, name: 'Solar Shades', category: 'Accessories', price: 1199, image: 'images/sunglasses.jpg', alt: 'Solar Shades sunglasses', description: 'Sharp-lined frames for bright days and bold looks.', vibes: ['Bold', 'Minimal'], sizes: ONE, badge: 'BESTSELLER' }
  ];
  const TRENDING_IDS = [3, 6, 2, 4, 12]; // first = large feature card

  const VIBE_COPY = {
    Minimal: ['KEEPING IT MINIMAL.', 'Clean lines, neutral tones and quiet confidence.'],
    Street: ['STRAIGHT FROM THE STREET.', 'Loud layers and city energy, built for movement.'],
    Bold: ['GO BOLD OR GO HOME.', 'Contrast, attitude and pieces that get noticed.'],
    Everyday: ['MADE FOR EVERY DAY.', 'Easy pieces you will reach for again and again.']
  };
  const DEFAULT_VIBE_COPY = ['WHAT\u2019S YOUR VYBE TODAY?', 'Pick a mood and we\u2019ll filter the collection to match.'];

  const PRODUCT_MAP = new Map(PRODUCTS.map((p) => [p.id, p]));
  const getProduct = (id) => PRODUCT_MAP.get(id);
  const needsSize = (p) => p.sizes.length > 1;

  /* 2. HELPERS ---------------------------------------------- */
  const money = new Intl.NumberFormat('en-IN');
  const formatPrice = (n) => '\u20B9' + money.format(n);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

  // Safe DOM builder: text always goes through textContent / text nodes, never innerHTML.
  function el(tag, props = {}, kids = []) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k === 'data') Object.assign(n.dataset, v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    n.append(...[].concat(kids));
    return n;
  }
  function icon(name) {
    const s = document.createElementNS(SVG_NS, 'svg');
    s.setAttribute('class', 'icon');
    s.setAttribute('aria-hidden', 'true');
    const u = document.createElementNS(SVG_NS, 'use');
    u.setAttribute('href', '#i-' + name);
    s.append(u);
    return s;
  }
  function createImage(p, eager = false) {
    return el('img', { src: p.image, alt: p.alt, width: 600, height: 750, loading: eager ? 'eager' : 'lazy', decoding: 'async', data: { name: p.name } });
  }
  // Graceful fallback when an image file is missing.
  function swapForPlaceholder(img) {
    const label = img.dataset.name || (img.closest('.category-card') && $('h3', img.closest('.category-card')).textContent) || 'VYBE';
    img.replaceWith(el('div', { class: 'img-placeholder', role: 'img', 'aria-label': img.alt || label, text: label }));
  }
  function bump(node) { node.classList.remove('bump'); void node.offsetWidth; node.classList.add('bump'); }

  const ui = {};
  ('productGrid emptyState resultsCount resetFilters emptyReset searchInput searchForm searchClear navSearchInput navSearchForm navSearchClose ' +
    'searchToggle searchBar sortSelect vibeHeading vibeText vibeReset trendingFeature trendingList cartToggle cartCount wishlistToggle wishlistCount ' +
    'cartDrawer cartItems cartEmpty cartFooter cartSubtotal cartShipping cartTotal shippingMessage shippingProgress shippingBar shippingPolicy checkoutBtn ' +
    'wishlistDrawer wishlistItems wishlistEmpty quickViewModal qvCategory qvTitle qvPrice qvDescription qvSizeGroup qvSizes qvSizeError qvQty qvQtyMinus ' +
    'qvQtyPlus qvAddToCart qvWishlist checkoutModal checkoutSummary checkoutTotal infoModal infoTitle infoBody overlay toastRegion newsletterForm ' +
    'newsletterEmail newsletterMessage siteHeader menuToggle primaryNav').split(' ').forEach((id) => { ui[id] = document.getElementById(id); });

  /* 3. STATE & STORAGE -------------------------------------- */
  const state = { search: '', category: 'All', vibe: null, sort: 'featured', cart: [], wishlist: [] };
  const isWished = (id) => state.wishlist.includes(id);
  const cartCount = () => state.cart.reduce((n, l) => n + l.qty, 0);
  const cartSubtotal = () => state.cart.reduce((s, l) => s + getProduct(l.id).price * l.qty, 0);
  const shippingFor = (sub) => (sub === 0 || sub >= CONFIG.freeShippingThreshold ? 0 : CONFIG.flatShipping);

  let storageWarned = false;
  function readStore(key) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch { return null; }
  }
  function writeStore(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {
      if (!storageWarned) { storageWarned = true; toast('Saving is unavailable in this browser, so your bag will reset on reload.'); }
    }
  }
  // Only ids/sizes/quantities are stored (never personal or payment data), and everything is validated on load.
  function sanitizeCart(raw) {
    if (!Array.isArray(raw)) return [];
    const out = [];
    for (const it of raw) {
      if (!it || typeof it !== 'object' || !Number.isInteger(it.id) || !Number.isInteger(it.qty) || it.qty < 1) continue;
      const p = getProduct(it.id);
      if (!p || typeof it.size !== 'string' || !p.sizes.includes(it.size)) continue;
      const qty = Math.min(CONFIG.maxQty, it.qty);
      const dup = out.find((l) => l.id === it.id && l.size === it.size);
      if (dup) dup.qty = Math.min(CONFIG.maxQty, dup.qty + qty);
      else out.push({ id: it.id, size: it.size, qty });
    }
    return out;
  }
  function sanitizeWishlist(raw) {
    if (!Array.isArray(raw)) return [];
    return [...new Set(raw.filter((id) => Number.isInteger(id) && getProduct(id)))];
  }
  const saveCart = () => writeStore(CONFIG.keys.cart, state.cart);
  const saveWishlist = () => writeStore(CONFIG.keys.wishlist, state.wishlist);

  /* 4. TOASTS ----------------------------------------------- */
  function toast(message) {
    const t = el('div', { class: 'toast', text: message });
    ui.toastRegion.append(t);
    while (ui.toastRegion.children.length > 3) ui.toastRegion.firstElementChild.remove();
    setTimeout(() => { t.classList.add('is-leaving'); setTimeout(() => t.remove(), 350); }, 3000);
  }

  /* 5. OVERLAYS: one modal or drawer open at a time ---------- */
  let layer = null; // { root, type, returnTo }

  function openLayer(root, type, returnTo) {
    if (layer) closeLayer(false);
    layer = { root, type, returnTo };
    document.body.classList.add('no-scroll');
    if (type === 'modal') {
      root.hidden = false;
      requestAnimationFrame(() => { root.classList.add('is-open'); $('.modal-panel', root).focus({ preventScroll: true }); });
    } else {
      ui.overlay.hidden = false;
      requestAnimationFrame(() => {
        ui.overlay.classList.add('is-visible');
        root.classList.add('is-open');
        root.setAttribute('aria-hidden', 'false');
        root.focus({ preventScroll: true });
      });
    }
  }
  function closeLayer(restoreFocus = true) {
    if (!layer) return;
    const { root, type, returnTo } = layer;
    layer = null;
    root.classList.remove('is-open');
    if (type === 'modal') {
      setTimeout(() => { if (!root.classList.contains('is-open')) root.hidden = true; }, 320);
    } else {
      root.setAttribute('aria-hidden', 'true');
      ui.overlay.classList.remove('is-visible');
      setTimeout(() => { if (!ui.overlay.classList.contains('is-visible')) ui.overlay.hidden = true; }, 320);
    }
    document.body.classList.remove('no-scroll');
    if (restoreFocus && returnTo && returnTo.isConnected && returnTo.getClientRects().length) returnTo.focus();
  }
  function trapTab(e) {
    const scope = layer.type === 'modal' ? $('.modal-panel', layer.root) : layer.root;
    const items = $$(FOCUSABLE, scope).filter((n) => n.getClientRects().length);
    if (!items.length) { e.preventDefault(); scope.focus(); return; }
    const first = items[0], last = items[items.length - 1], active = document.activeElement;
    if (e.shiftKey && (active === first || active === scope)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  }

  /* 6. PRODUCT DISCOVERY: search + category + vibe + sort ---- */
  function getVisibleProducts() {
    const q = state.search.trim().toLowerCase();
    const list = PRODUCTS.filter((p) =>
      (state.category === 'All' || p.category === state.category) &&
      (!state.vibe || p.vibes.includes(state.vibe)) &&
      (!q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)));
    if (state.sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (state.sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (state.sort === 'name-asc') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }
  const hasActiveFilters = () => !!(state.search.trim() || state.category !== 'All' || state.vibe || state.sort !== 'featured');

  function wishButton(p) {
    const b = el('button', { class: 'icon-btn wish-btn', type: 'button', data: { action: 'wish', id: p.id } }, [icon('heart')]);
    setWishState(b, p);
    return b;
  }
  function setWishState(btn, p) {
    const on = isWished(p.id);
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`);
  }
  function syncWishButtons() {
    $$('.wish-btn[data-id]').forEach((b) => setWishState(b, getProduct(Number(b.dataset.id))));
  }

  function createProductCard(p, feature = false) {
    const sized = needsSize(p);
    const media = el('div', { class: 'card-media' }, [createImage(p)]);
    if (p.badge) media.append(el('span', { class: 'badge', text: p.badge }));
    media.append(
      wishButton(p),
      el('button', { class: 'quick-btn', type: 'button', 'aria-label': `Quick view ${p.name}`, data: { action: 'quick', id: p.id } }, [icon('eye'), 'Quick view'])
    );
    const body = el('div', { class: 'card-body' }, [
      el('p', { class: 'card-cat', text: p.category }),
      el('h3', { class: 'card-name' }, [el('button', { class: 'card-link', type: 'button', data: { action: 'quick', id: p.id }, text: p.name })]),
      el('p', { class: 'card-price', text: formatPrice(p.price) }),
      el('button', { class: 'btn btn-outline btn-block', type: 'button', 'aria-label': `${p.name}: ${sized ? 'select size' : 'add to bag'}`, data: { action: 'add', id: p.id }, text: sized ? 'SELECT SIZE' : 'ADD TO BAG' })
    ]);
    return el(feature ? 'div' : 'li', { class: 'product-card' + (feature ? ' is-feature' : '') }, [media, body]);
  }

  let lastGridKey = null;
  function renderProducts() {
    const list = getVisibleProducts();
    const n = list.length;
    ui.resultsCount.textContent = `Showing ${n} of ${PRODUCTS.length} product${PRODUCTS.length === 1 ? '' : 's'}`;
    ui.emptyState.hidden = n > 0;
    ui.productGrid.hidden = n === 0;
    const key = list.map((p) => p.id).join(',');
    if (key === lastGridKey) return; // nothing changed, skip DOM work
    lastGridKey = key;
    ui.productGrid.replaceChildren(...list.map((p) => createProductCard(p)));
  }

  function renderTrending() {
    const [featureId, ...restIds] = TRENDING_IDS;
    ui.trendingFeature.replaceChildren(createProductCard(getProduct(featureId), true));
    ui.trendingList.replaceChildren(...restIds.map((id) => {
      const p = getProduct(id), sized = needsSize(p);
      return el('li', { class: 'trending-item' }, [
        el('div', { class: 'item-thumb' }, [createImage(p)]),
        el('div', { class: 'item-info' }, [
          el('h3', {}, [el('button', { class: 'card-link', type: 'button', data: { action: 'quick', id: p.id }, text: p.name })]),
          el('p', { text: `${p.category} \u2014 ${formatPrice(p.price)}` })
        ]),
        el('div', { class: 'item-actions' }, [
          wishButton(p),
          el('button', { class: 'btn btn-outline btn-sm', type: 'button', 'aria-label': `${p.name}: ${sized ? 'select size' : 'add to bag'}`, data: { action: 'add', id: p.id }, text: sized ? 'SELECT SIZE' : 'ADD TO BAG' })
        ])
      ]);
    }));
  }

  // Keeps every control in step with state, so clearing one filter never touches the others.
  function syncControls() {
    $$('.chips .chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.category === state.category)));
    $$('.vibe-tile').forEach((t) => t.setAttribute('aria-pressed', String(t.dataset.vibe === state.vibe)));
    const [title, text] = state.vibe ? VIBE_COPY[state.vibe] : DEFAULT_VIBE_COPY;
    ui.vibeHeading.textContent = title;
    ui.vibeText.textContent = text;
    ui.vibeReset.hidden = !state.vibe;
    if (ui.searchInput.value !== state.search) ui.searchInput.value = state.search;
    if (ui.navSearchInput.value !== state.search) ui.navSearchInput.value = state.search;
    ui.searchClear.hidden = !state.search;
    ui.sortSelect.value = state.sort;
    ui.resetFilters.hidden = !hasActiveFilters();
  }
  function applyFilters() { syncControls(); renderProducts(); }
  function resetFilters() { Object.assign(state, { search: '', category: 'All', vibe: null, sort: 'featured' }); applyFilters(); }
  function scrollToCollection() {
    document.getElementById('collection').scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
  }

  /* 7. QUICK VIEW ------------------------------------------- */
  const qv = { p: null, size: null, qty: 1 };

  function renderQty() {
    ui.qvQty.textContent = String(qv.qty);
    ui.qvQtyMinus.disabled = qv.qty <= 1;
    ui.qvQtyPlus.disabled = qv.qty >= CONFIG.maxQty;
  }
  function openQuickView(id, trigger) {
    const p = getProduct(id);
    if (!p) return;
    Object.assign(qv, { p, size: needsSize(p) ? null : p.sizes[0], qty: 1 });
    ui.qvCategory.textContent = p.category;
    ui.qvTitle.textContent = p.name;
    ui.qvPrice.textContent = formatPrice(p.price);
    ui.qvDescription.textContent = p.description;
    $('.qv-media').replaceChildren(createImage(p, true));
    ui.qvSizeGroup.hidden = !needsSize(p);
    ui.qvSizeError.hidden = true;
    ui.qvSizes.replaceChildren(...(needsSize(p) ? p.sizes.map((s) =>
      el('button', { class: 'size-btn', type: 'button', 'aria-pressed': 'false', data: { size: s }, text: s })) : []));
    ui.qvWishlist.dataset.id = p.id;
    setWishState(ui.qvWishlist, p);
    renderQty();
    const drawer = trigger && trigger.closest('.drawer');
    const returnTo = drawer ? (drawer.id === 'cartDrawer' ? ui.cartToggle : ui.wishlistToggle) : trigger;
    openLayer(ui.quickViewModal, 'modal', returnTo);
  }
  function bindQuickView() {
    ui.qvSizes.addEventListener('click', (e) => {
      const btn = e.target.closest('.size-btn');
      if (!btn) return;
      qv.size = btn.dataset.size;
      $$('.size-btn', ui.qvSizes).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      ui.qvSizeError.hidden = true;
    });
    ui.qvQtyMinus.addEventListener('click', () => { if (qv.qty > 1) { qv.qty -= 1; renderQty(); } });
    ui.qvQtyPlus.addEventListener('click', () => { if (qv.qty < CONFIG.maxQty) { qv.qty += 1; renderQty(); } });
    ui.qvWishlist.addEventListener('click', () => toggleWishlist(qv.p.id, ui.qvWishlist));
    ui.qvAddToCart.addEventListener('click', () => {
      if (!qv.p) return;
      if (needsSize(qv.p) && !qv.size) {
        ui.qvSizeError.hidden = false;
        const first = $('.size-btn', ui.qvSizes);
        if (first) first.focus();
        return;
      }
      addAndNotify(qv.p, qv.size, qv.qty);
      closeLayer();
    });
  }

  /* 8. CART ------------------------------------------------- */
  function addToCart(id, size, qty) {
    const p = getProduct(id);
    if (!p || !p.sizes.includes(size) || !Number.isInteger(qty) || qty < 1) return 0;
    const line = state.cart.find((l) => l.id === id && l.size === size);
    const before = line ? line.qty : 0;
    const after = Math.min(CONFIG.maxQty, before + qty);
    if (line) line.qty = after; else if (after > 0) state.cart.push({ id, size, qty: after });
    saveCart();
    renderCart();
    if (after > before) bump(ui.cartCount);
    return after - before;
  }
  function addAndNotify(p, size, qty) {
    const added = addToCart(p.id, size, qty);
    if (added === 0) toast(`Your bag already has the maximum of ${CONFIG.maxQty} ${p.name}`);
    else if (added < qty) toast(`Added ${added}. The limit is ${CONFIG.maxQty} per item`);
    else toast(qty > 1 ? `${qty} \u00D7 ${p.name} added to bag` : `${p.name} added to bag`);
  }
  function changeQty(id, size, delta, action) {
    const line = state.cart.find((l) => l.id === id && l.size === size);
    if (!line) return;
    const next = line.qty + delta;
    if (next < 1 || next > CONFIG.maxQty) return; // quantity never drops below 1 or exceeds the limit
    line.qty = next;
    saveCart();
    renderCart();
    const buttons = $$('[data-action]', ui.cartItems).filter((b) => Number(b.dataset.id) === id && b.dataset.size === size);
    const target = buttons.find((b) => b.dataset.action === action && !b.disabled) || buttons.find((b) => !b.disabled);
    if (target) target.focus();
  }
  function removeLine(id, size) {
    const p = getProduct(id);
    state.cart = state.cart.filter((l) => !(l.id === id && l.size === size));
    saveCart();
    renderCart();
    toast(`${p.name} removed from bag`);
    ui.cartDrawer.focus();
  }
  function createCartLine(l) {
    const p = getProduct(l.id);
    const d = { id: p.id, size: l.size };
    return el('li', { class: 'line-item' }, [
      el('div', { class: 'line-thumb' }, [createImage(p)]),
      el('div', {}, [
        el('p', { class: 'line-name', text: p.name }),
        el('p', { class: 'line-meta', text: l.size === 'One Size' ? p.category : `Size ${l.size}` }),
        el('p', { class: 'line-price', text: `${formatPrice(p.price)} each` }),
        el('div', { class: 'line-controls' }, [
          el('div', { class: 'qty-stepper', role: 'group', 'aria-label': `Quantity for ${p.name}` }, [
            el('button', { class: 'icon-btn', type: 'button', 'aria-label': `Decrease quantity of ${p.name}`, disabled: l.qty <= 1, data: { ...d, action: 'cart-dec' } }, [icon('minus')]),
            el('output', { text: String(l.qty) }),
            el('button', { class: 'icon-btn', type: 'button', 'aria-label': `Increase quantity of ${p.name}`, disabled: l.qty >= CONFIG.maxQty, data: { ...d, action: 'cart-inc' } }, [icon('plus')])
          ]),
          el('button', { class: 'link-btn', type: 'button', 'aria-label': `Remove ${p.name} from bag`, data: { ...d, action: 'cart-remove' }, text: 'Remove' })
        ])
      ])
    ]);
  }
  function renderCart() {
    const count = cartCount(), sub = cartSubtotal(), ship = shippingFor(sub), threshold = CONFIG.freeShippingThreshold;
    ui.cartItems.replaceChildren(...state.cart.map(createCartLine));
    ui.cartItems.hidden = count === 0;
    ui.cartEmpty.hidden = count > 0;
    ui.cartFooter.hidden = count === 0;
    ui.cartSubtotal.textContent = formatPrice(sub);
    ui.cartShipping.textContent = count === 0 ? formatPrice(0) : ship === 0 ? 'FREE' : formatPrice(ship);
    ui.cartTotal.textContent = formatPrice(sub + ship);
    const pct = Math.min(100, Math.round((sub / threshold) * 100));
    ui.shippingBar.style.width = pct + '%';
    ui.shippingProgress.setAttribute('aria-valuenow', String(pct));
    ui.shippingMessage.textContent = sub >= threshold ? 'You\u2019ve unlocked free shipping!'
      : sub === 0 ? `Free shipping on orders of ${formatPrice(threshold)} or more.`
      : `Add ${formatPrice(threshold - sub)} more for free shipping.`;
    ui.shippingPolicy.textContent = `Demo policy: free shipping on orders of ${formatPrice(threshold)} or more, otherwise ${formatPrice(CONFIG.flatShipping)}.`;
    ui.cartCount.textContent = String(count);
    ui.cartCount.classList.toggle('is-empty', count === 0);
    ui.cartToggle.setAttribute('aria-label', `Open shopping bag, ${count} ${count === 1 ? 'item' : 'items'}`);
  }
  function openCheckoutDemo() {
    if (!state.cart.length) return;
    const sub = cartSubtotal(), ship = shippingFor(sub);
    const row = (left, right) => el('li', {}, [el('span', { text: left }), el('span', { text: right })]);
    ui.checkoutSummary.replaceChildren(
      ...state.cart.map((l) => {
        const p = getProduct(l.id);
        return row(`${p.name}${l.size === 'One Size' ? '' : ` (${l.size})`} \u00D7 ${l.qty}`, formatPrice(p.price * l.qty));
      }),
      row('Shipping (estimate)', ship === 0 ? 'FREE' : formatPrice(ship))
    );
    ui.checkoutTotal.textContent = formatPrice(sub + ship);
    openLayer(ui.checkoutModal, 'modal', ui.cartToggle);
  }

  /* 9. WISHLIST --------------------------------------------- */
  function toggleWishlist(id, trigger) {
    const p = getProduct(id);
    if (!p) return;
    const adding = !isWished(id);
    state.wishlist = adding ? [...state.wishlist, id] : state.wishlist.filter((w) => w !== id);
    saveWishlist();
    syncWishButtons();
    renderWishlist();
    toast(adding ? `${p.name} saved to wishlist` : `${p.name} removed from wishlist`);
    if (trigger && trigger.classList.contains('wish-btn')) {
      trigger.classList.remove('pop'); void trigger.offsetWidth; trigger.classList.add('pop');
    }
    if (adding) bump(ui.wishlistCount);
  }
  function renderWishlist() {
    const n = state.wishlist.length;
    ui.wishlistItems.replaceChildren(...state.wishlist.map((id) => {
      const p = getProduct(id);
      return el('li', { class: 'line-item' }, [
        el('div', { class: 'line-thumb' }, [createImage(p)]),
        el('div', {}, [
          el('p', { class: 'line-name', text: p.name }),
          el('p', { class: 'line-meta', text: p.category }),
          el('p', { class: 'line-price', text: formatPrice(p.price) }),
          el('div', { class: 'line-controls' }, [
            el('button', { class: 'btn btn-outline btn-sm', type: 'button', 'aria-label': `${p.name}: add to bag`, data: { action: 'wish-add', id: p.id }, text: 'ADD TO BAG' }),
            el('button', { class: 'link-btn', type: 'button', 'aria-label': `Remove ${p.name} from wishlist`, data: { action: 'wish-remove', id: p.id }, text: 'Remove' })
          ])
        ])
      ]);
    }));
    ui.wishlistItems.hidden = n === 0;
    ui.wishlistEmpty.hidden = n > 0;
    ui.wishlistCount.textContent = String(n);
    ui.wishlistCount.classList.toggle('is-empty', n === 0);
    ui.wishlistToggle.setAttribute('aria-label', `Open wishlist, ${n} ${n === 1 ? 'item' : 'items'}`);
  }

  /* 10. INFO PAGES & NEWSLETTER ------------------------------ */
  const INFO = {
    shipping: ['Shipping (demo)', ['VYBE is a portfolio demo, so nothing is ever shipped.', `The bag uses a demo policy: free shipping on orders of ${formatPrice(CONFIG.freeShippingThreshold)} or more, otherwise a flat ${formatPrice(CONFIG.flatShipping)}.`]],
    returns: ['Returns (demo)', ['This page is a placeholder. A real store would explain its return window and process here.']],
    sizing: ['Size guide (demo)', ['Sneakers use sizes 7 to 10. Apparel uses S to XL. Bags, caps and accessories are one size.', 'These sizes are sample data for the demo and are not tied to real measurements.']],
    faq: ['FAQ (demo)', ['Is this a real store? No. VYBE is a fictional brand made for a developer portfolio.', 'Can I place an order? No. Checkout is a demo and no payment is taken.', 'Is my data saved? Your bag and wishlist are kept only in this browser using localStorage.']],
    about: ['About this demo', ['VYBE is a frontend-only project built with HTML, CSS and vanilla JavaScript.', 'Products, prices and contact details are placeholders. Real orders and payments need a secure backend and a payment provider.']],
    privacy: ['Privacy (demo)', ['This demo has no server. Your bag and wishlist live in your browser\u2019s localStorage and are never sent anywhere.', 'No payment or personal details are stored. A real store would need a proper privacy policy.']],
    terms: ['Terms (demo)', ['This is a placeholder page. No sales happen on this site, and a real store would publish its own terms here.']]
  };
  function openInfo(key, trigger) {
    const d = INFO[key];
    if (!d) return;
    ui.infoTitle.textContent = d[0];
    ui.infoBody.replaceChildren(...d[1].map((t) => el('p', { text: t })));
    openLayer(ui.infoModal, 'modal', trigger);
  }
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function setNewsletterMessage(text, kind) {
    ui.newsletterMessage.textContent = text;
    ui.newsletterMessage.className = 'form-message' + (kind ? ` is-${kind}` : '');
    ui.newsletterEmail.setAttribute('aria-invalid', String(kind === 'error'));
  }
  function bindNewsletter() {
    ui.newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = ui.newsletterEmail.value.trim();
      if (!email) return setNewsletterMessage('Enter your email address to subscribe.', 'error');
      if (!EMAIL_RE.test(email)) return setNewsletterMessage('That email doesn\u2019t look right. Check it and try again, for example you@example.com.', 'error');
      ui.newsletterEmail.value = '';
      setNewsletterMessage('Looks good! This is a demo, so nothing was sent or saved. Real newsletters need a backend or an email service.', 'success');
    });
    ui.newsletterEmail.addEventListener('input', () => { if (ui.newsletterMessage.textContent) setNewsletterMessage('', ''); });
  }

  /* 11. PAGE UI: nav, search, scroll effects, clicks --------- */
  function setMenu(open) {
    ui.primaryNav.classList.toggle('is-open', open);
    ui.menuToggle.setAttribute('aria-expanded', String(open));
    ui.menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  function setSearchBar(open, returnFocus = false) {
    ui.searchBar.hidden = !open;
    ui.searchToggle.setAttribute('aria-expanded', String(open));
    ui.searchToggle.setAttribute('aria-label', open ? 'Close search' : 'Open search');
    if (open) ui.navSearchInput.focus();
    else if (returnFocus) ui.searchToggle.focus();
  }
  function openCart() { renderCart(); openLayer(ui.cartDrawer, 'drawer', ui.cartToggle); }
  function openWishlist() { renderWishlist(); openLayer(ui.wishlistDrawer, 'drawer', ui.wishlistToggle); }

  function handleAction(btn) {
    const id = Number(btn.dataset.id), size = btn.dataset.size, action = btn.dataset.action;
    switch (action) {
      case 'quick': openQuickView(id, btn); break;
      case 'add':
      case 'wish-add': {
        const p = getProduct(id);
        if (needsSize(p)) openQuickView(id, btn); else addAndNotify(p, p.sizes[0], 1);
        break;
      }
      case 'wish': toggleWishlist(id, btn); break;
      case 'wish-remove': toggleWishlist(id); ui.wishlistDrawer.focus(); break;
      case 'cart-inc': changeQty(id, size, 1, action); break;
      case 'cart-dec': changeQty(id, size, -1, action); break;
      case 'cart-remove': removeLine(id, size); break;
    }
  }

  function bindEvents() {
    document.addEventListener('click', (e) => {
      const t = e.target;
      const actionEl = t.closest('[data-action]');
      if (actionEl) return handleAction(actionEl);
      const closeEl = t.closest('[data-close]');
      if (closeEl) return closeLayer();
      const infoEl = t.closest('[data-info]');
      if (infoEl) return openInfo(infoEl.dataset.info, infoEl);
      const vibeEl = t.closest('[data-vibe]');
      if (vibeEl) {
        state.vibe = state.vibe === vibeEl.dataset.vibe ? null : vibeEl.dataset.vibe; // click again to deselect
        applyFilters();
        if (state.vibe) scrollToCollection();
        return;
      }
      const catEl = t.closest('[data-category]');
      if (catEl) {
        const isLink = catEl.tagName === 'A';
        if (isLink) e.preventDefault();
        if (catEl.hasAttribute('data-reset-all')) { state.search = ''; state.vibe = null; state.sort = 'featured'; }
        state.category = catEl.dataset.category;
        applyFilters();
        setMenu(false);
        if (isLink) scrollToCollection();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (layer) closeLayer();
        else if (!ui.searchBar.hidden) setSearchBar(false, true);
        else if (ui.primaryNav.classList.contains('is-open')) { setMenu(false); ui.menuToggle.focus(); }
      } else if (e.key === 'Tab' && layer) trapTab(e);
    });
    ui.overlay.addEventListener('click', () => closeLayer());

    ui.cartToggle.addEventListener('click', openCart);
    ui.wishlistToggle.addEventListener('click', openWishlist);
    ui.checkoutBtn.addEventListener('click', openCheckoutDemo);
    ui.menuToggle.addEventListener('click', () => setMenu(!ui.primaryNav.classList.contains('is-open')));
    window.addEventListener('resize', () => { if (window.innerWidth > 900) setMenu(false); });

    ui.searchToggle.addEventListener('click', () => setSearchBar(ui.searchBar.hidden));
    ui.navSearchClose.addEventListener('click', () => setSearchBar(false, true));
    ui.navSearchForm.addEventListener('submit', (e) => { e.preventDefault(); setSearchBar(false); scrollToCollection(); });
    ui.searchForm.addEventListener('submit', (e) => e.preventDefault());
    const onSearch = (e) => { state.search = e.target.value; applyFilters(); };
    ui.searchInput.addEventListener('input', onSearch);
    ui.navSearchInput.addEventListener('input', onSearch);
    ui.searchClear.addEventListener('click', () => { state.search = ''; applyFilters(); ui.searchInput.focus(); });
    ui.sortSelect.addEventListener('change', () => { state.sort = ui.sortSelect.value; applyFilters(); });
    ui.vibeReset.addEventListener('click', () => { state.vibe = null; applyFilters(); });
    ui.resetFilters.addEventListener('click', resetFilters);
    ui.emptyReset.addEventListener('click', resetFilters);

    // Missing images fall back to a styled placeholder (error events don't bubble, so capture them).
    document.addEventListener('error', (e) => { if (e.target instanceof HTMLImageElement) swapForPlaceholder(e.target); }, true);

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ui.siteHeader.classList.toggle('is-scrolled', window.scrollY > 10); ticking = false; });
    }, { passive: true });
  }

  function initReveal() {
    const items = $$('[data-reveal]');
    if (!('IntersectionObserver' in window)) { items.forEach((s) => s.classList.add('is-visible')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } });
    }, { threshold: 0.06, rootMargin: '0px 0px -4% 0px' });
    items.forEach((s) => io.observe(s));
    setTimeout(() => items.forEach((s) => s.classList.add('is-visible')), 4000); // safety net: never leave content hidden
  }

  /* 12. INIT ------------------------------------------------ */
  function init() {
    state.cart = sanitizeCart(readStore(CONFIG.keys.cart));
    state.wishlist = sanitizeWishlist(readStore(CONFIG.keys.wishlist));
    // Images that already failed before this script ran
    $$('img[src]').forEach((img) => { if (img.getAttribute('src') && img.complete && img.naturalWidth === 0) swapForPlaceholder(img); });
    bindEvents();
    bindQuickView();
    bindNewsletter();
    syncControls();
    renderProducts();
    renderTrending();
    renderCart();
    renderWishlist();
    ui.siteHeader.classList.toggle('is-scrolled', window.scrollY > 10);
    initReveal();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
