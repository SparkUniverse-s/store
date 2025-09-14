// Simple product data (replace with fetch('/api/products') for real backend)
const PRODUCTS = [
  {
    id: 'book-1',
    title: 'Grimoire of Whispered Runes',
    price: 2500,
    description: 'A dense manual on rune invocation, practical and annotated.',
    cover: 'assests/grimoire.jpg'
  },
  {
    id: 'book-2',
    title: 'Invoking 90 Celestial Powers',
    price: 1800,
    description: 'Mantras for personal transformation and shieldwork.',
    cover: 'assests/celestial.png'
  },
  {
    id: 'book-3',
    title: 'Sacred Charm oF Protection And Prosperity',
    price: 3200,
    description: 'Advanced rituals and historical notes — for experienced practitioners.',
    cover: 'assests/charm.png'
  },
    {
    id: 'book-4',
    title: '33 Sacred Spells Of The Greeks',
    price: 3200,
    description: 'Advanced rituals and historical notes — for experienced practitioners.',
    cover: 'assests/greek.png'
  },
    {
    id: 'book-5',
    title: 'IF THEY ARE BACK',
    price: 3200,
    description: 'Advanced rituals and historical notes — for experienced practitioners.',
    cover: 'assests/ifTheyAreBack.png'
  },
    {
    id: 'book-6',
    title: 'The Lost Book Of Merlin Volume 1',
    price: 3200,
    description: 'Advanced rituals and historical notes — for experienced practitioners.',
    cover: 'assests/merlin1.png'
  },
    {
    id: 'book-7',
    title: 'The Lost Book Of Merlin Volume 2',
    price: 3200,
    description: 'Advanced rituals and historical notes — for experienced practitioners.',
    cover: 'assests/merlin2.png'
  },
    {
    id: 'book-8',
    title: 'The Power Of Ancient Psalms',
    price: 3200,
    description: 'Advanced Psalms For Wealth And Protection',
    cover: 'assests/psalm.png'
  },
    {
    id: 'book-9',
    title: 'The Codex Of The Ancient 12 Kings Of Babylon',
    price: 3200,
    description: 'Unveiling the forbidden reign of starborn monarchs and Celestial Thrones',
    cover: 'assests/thecodex.png'
  },
    {
    id: 'book-10',
    title: 'YESHUA KRISTUS AND THE 12 APOSTLES',
    price: 3200,
    description: 'Prayers To Invoke Yeshua And The 12 Apostles.',
    cover: 'assests/yeshua.png'
  },
    {
    id: 'book-11',
    title: 'A KING NAMED ZEUS ',
    price: 3200,
    description: 'A STORY ABOUT THE RISE OF OLYMPIAN',
    cover: 'assests/zeus.jpg'
  }


];

const state = {
  cart: {}
};

function money(n){ return '₦' + n.toLocaleString() }

function renderProducts() {
  const grid = document.getElementById('product-grid');
  grid.innerHTML = '';
  PRODUCTS.forEach(p => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <img src="${p.cover}" alt="${p.title}" />
      <h4>${p.title}</h4>
      <p>${p.description}</p>
      <div class="meta">
        <div class="price">${money(p.price)}</div>
        <div>
          <button class="add-btn" data-id="${p.id}">Add to cart</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function updateCartCount() {
  const countEl = document.getElementById('cart-count');
  const totalQty = Object.values(state.cart).reduce((s, i) => s + i.qty, 0);
  countEl.textContent = totalQty;
}

function addToCart(id){
  const prod = PRODUCTS.find(p=>p.id===id);
  if(!prod) return;
  if(!state.cart[id]) state.cart[id] = { ...prod, qty: 0 };
  state.cart[id].qty += 1;
  showToast(`${prod.title} added to cart`);
  updateCartCount();
  renderCart();
}

function renderCart(){
  const el = document.getElementById('cart-items');
  el.innerHTML = '';
  const items = Object.values(state.cart);
  if(items.length===0){
    el.innerHTML = '<p class="muted">Cart is empty</p>';
    document.getElementById('cart-total').textContent = money(0);
    return;
  }
  let total = 0;
  items.forEach(item=>{
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
document.addEventListener('click', (e)=>{
  const add = e.target.closest('.add-btn');
  if(add){ addToCart(add.dataset.id); return; }

  if(e.target.matches('#cart-toggle')) {
    toggleCart(true);
  }
  if(e.target.matches('#close-cart')) toggleCart(false);
  if(e.target.matches('.qty-incr')) {
    const id = e.target.dataset.id;
    state.cart[id].qty += 1;
    updateCartCount(); renderCart();
  }
  if(e.target.matches('.qty-decr')) {
    const id = e.target.dataset.id;
    state.cart[id].qty -= 1;
    if(state.cart[id].qty <= 0) delete state.cart[id];
    updateCartCount(); renderCart();
  }
  if(e.target.matches('#checkout-btn')) {
    handleCheckout();
  }
  if(e.target.matches('[data-bundle]')) {
    // Example: add two sample books as bundle
    const b = e.target.dataset.bundle;
    if(b === 'initiate'){
      addToCart('book-1'); addToCart('book-2');
      showToast('Initiate Pack added to cart');
    } else {
      addToCart('book-1'); addToCart('book-2'); addToCart('book-3');
      showToast('Sorcerer Collection added to cart');
    }
  }
  if(e.target.matches('#btn-circle')) {
    // Placeholder for email modal / subscription
    showToast('Circle signup coming — use email capture here.');
  }
});

function toggleCart(open){
  const drawer = document.getElementById('cart-drawer');
  drawer.classList.toggle('open', !!open);
  drawer.setAttribute('aria-hidden', !open);
}

/* Simple toast */
let toastTimer;
function showToast(text, ms=2200){
  const t = document.getElementById('toast');
  t.textContent = text; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> t.hidden = true, ms);
}

/* Checkout placeholder — integrate with Stripe or other provider here */
function handleCheckout(){
  const items = Object.values(state.cart);
  if(items.length === 0) { showToast('Cart is empty'); return; }
  // For now, show summary
  const total = items.reduce((s,i)=>s + i.price * i.qty, 0);
  if(confirm(`Proceed to checkout — total ${money(total)}? (This is a demo. Replace with Stripe/PayPal.)`)) {
    // TODO: Replace with fetch('/create-checkout-session', {method:'POST', body: JSON.stringify({items})})
    showToast('Checkout flow not connected. See README to integrate Stripe or PayPal.');
  }
}

/* init */
renderProducts();
updateCartCount();
renderCart();
