let PRODUCTS = [];
let state = { cart: {} }; // ✅ one consistent cart state

// Format money helper
function money(amount) {
  return `$${amount.toFixed(2)}`;
}

// Fetch products from backend
document.addEventListener('DOMContentLoaded', function () {
  fetch("http://127.0.0.1:5000/products")
    .then(res => res.json())
    .then(data => {
      PRODUCTS = data;
      renderProducts();
    })
    .catch(err => console.error("Error loading products:", err));
});

const grid = document.getElementById('product-grid');

/* Show initial set of products */
let num = 4;
function renderProducts() {
  grid.innerHTML = '';
  for (let p = 0; p < Math.min(num, PRODUCTS.length); p++) {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <img src="${PRODUCTS[p].cover}" alt="${PRODUCTS[p].title}" />
      <h4>${PRODUCTS[p].title}</h4>
      <p>${PRODUCTS[p].description}</p>
      <div class="meta">
        <div class="price">${money(PRODUCTS[p].price)}</div>
        <div>
          <button class="add-btn" data-id="${PRODUCTS[p].id}">Add to cart</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  }

  // Show/hide continue button
  document.getElementById('continue').style.display =
    PRODUCTS.length > num ? 'grid' : 'none';
}

// Handle continue button
document.getElementById('continue').addEventListener('click', function () {
  if (num === 6) {
    document.getElementById('continue').innerText = 'Show All';
  }
  if (num < PRODUCTS.length) {
    num += 2;
    renderProducts();
  } else {
    window.location.href = 'store.html';
  }
});

/* Cart logic */
function updateCartCount() {
  const countEl = document.getElementById('cart-count');
  const totalQty = Object.values(state.cart).reduce((s, i) => s + i.qty, 0);
  countEl.textContent = totalQty;
}

function addToCart(id) {
  const prod = PRODUCTS.find(p => p.id === id);
  if (!prod) return;
  if (!state.cart[id]) state.cart[id] = { ...prod, qty: 0 };
  state.cart[id].qty += 1;
  showToast(`${prod.title} added to cart`);
  updateCartCount();
  renderCart();
}

function renderCart() {
  const el = document.getElementById('cart-items');
  el.innerHTML = '';
  const items = Object.values(state.cart);

  if (items.length === 0) {
    el.innerHTML = '<p class="muted">Cart is empty</p>';
    document.getElementById('cart-total').textContent = money(0);
    return;
  }

  let total = 0;
  items.forEach(item => {
    total += item.price * item.qty;
    const node = document.createElement('div');
    node.className = 'cart-item';
    node.innerHTML = `
      <img src="${item.cover}" alt="${item.title}" />
      <div style="flex:1">
        <strong>${item.title}</strong>
        <div style="font-size:0.9rem;color:var(--muted)">${money(item.price)} × ${item.qty}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
        <button data-id="${item.id}" class="qty-incr">＋</button>
        <button data-id="${item.id}" class="qty-decr">－</button>
      </div>
    `;
    el.appendChild(node);
  });

  document.getElementById('cart-total').textContent = money(total);
}

/* UI interactions */
document.addEventListener('click', (e) => {
  const add = e.target.closest('.add-btn');
  if (add) {
    addToCart(add.dataset.id);
    return;
  }

  if (e.target.matches('#cart-toggle')) toggleCart(true);
  if (e.target.matches('#close-cart')) toggleCart(false);

  if (e.target.matches('.qty-incr')) {
    const id = e.target.dataset.id;
    state.cart[id].qty += 1;
    updateCartCount(); renderCart();
  }
  if (e.target.matches('.qty-decr')) {
    const id = e.target.dataset.id;
    state.cart[id].qty -= 1;
    if (state.cart[id].qty <= 0) delete state.cart[id];
    updateCartCount(); renderCart();
  }

  if (e.target.matches('#checkout-btn')) handleCheckout();
});

/* Drawer toggle */
function toggleCart(open) {
  const drawer = document.getElementById('cart-drawer');
  drawer.classList.toggle('open', !!open);
  drawer.setAttribute('aria-hidden', !open);
}

/* Toast notifications */
let toastTimer;
function showToast(text, ms = 2200) {
  const t = document.getElementById('toast');
  t.textContent = text; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.hidden = true, ms);
}

/* Checkout placeholder */
function handleCheckout() {
  const items = Object.values(state.cart);
  if (items.length === 0) { showToast('Cart is empty'); return; }
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  if (confirm(`Proceed to checkout — total ${money(total)}?`)) {
    showToast('Checkout flow not connected. Integrate Paystack/Stripe here.');
  }
}

/* Init */
updateCartCount();
renderCart();
