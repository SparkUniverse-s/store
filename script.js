let PRODUCTS = [];
let cart = [];
let total = 0;

document.addEventListener('DOMContentLoaded', function () {
  fetch("https://store-kqh0.onrender.com/products")
    .then(res => res.json())
    .then(data => {
      PRODUCTS = data;
      renderProducts(3); // show only 3 at first
      loadCart();
      setupSeeMore();
    })
    .catch(err => console.error("Error loading products:", err));
});

const grid = document.getElementById('product-grid');
const cartItemsContainer = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const badge = document.getElementById("cart-count");
const seeMoreBtn = document.getElementById("continue");

/* Show products */
function renderProducts(limit) {
  grid.innerHTML = '';
  PRODUCTS.slice(0, limit).forEach(p => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <img src="${p.cover}" alt="${p.title}" />
      <h4>${p.title}</h4>
      <p>${p.description}</p>
      <div class="meta">
        <div class="price">₦${p.price}</div>
        <div>
          <button class="add-btn" 
                  data-id="${p.title}" 
                  data-price="${p.price}"
                  data-book="${p.book}">
            Add to cart
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  // Attach add-to-cart events
  document.querySelectorAll(".add-btn").forEach(button => {
    button.addEventListener("click", () => {
      const name = button.dataset.id;
      const price = parseFloat(button.dataset.price);
      const book = button.dataset.book;

      const existing = cart.find(item => item.name === name);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ name, price, book, qty: 1 });
      }
      updateCart();
      showToast(`${name} added to cart`);
    });
  });
}

/* Setup See More button */
function setupSeeMore() {
  let state = 0;
  seeMoreBtn.style.display = "inline-block";

  seeMoreBtn.addEventListener("click", () => {
    if (state === 0) {
      renderProducts(5); // show 2 more
      state = 1;
      seeMoreBtn.textContent = "Open Full Store";
    } else {
      // Create overlay box
      const overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.background = "rgba(0,0,0,0.8)";
      overlay.style.display = "flex";
      overlay.style.justifyContent = "center";
      overlay.style.alignItems = "center";
      overlay.style.zIndex = "9999";

      const box = document.createElement("div");
      box.style.background = "#fff";
      box.style.padding = "30px";
      box.style.color = 'black';
      box.style.borderRadius = "12px";
      box.style.textAlign = "center";
      box.innerHTML = `
        <h3>Opening Store...</h3>
        <p>Redirecting you to the full store</p>
      `;

      overlay.appendChild(box);
      document.body.appendChild(overlay);

      setTimeout(() => {
        window.location.href = "store.html";
      }, 2000);
    }
  });
}

/* Update cart display */
function updateCart() {
  total = 0;
  cartItemsContainer.innerHTML = "";

  if (cart.length > 0) {
    badge.style.display = 'grid';
    badge.innerText = cart.reduce((sum, item) => sum + item.qty, 0);
  } else {
    badge.style.display = 'none';
  }

  cart.forEach((item, index) => {
    total += item.price * item.qty;

    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `
      <span>${item.name} (x${item.qty})</span>
      <span>₦${(item.price * item.qty).toFixed(2)}</span>
    `;

    // ❌ remove button
    const remove = document.createElement('span');
    remove.innerText = '❌';
    remove.style.color = "#be9131";
    remove.style.cursor = "pointer";
    remove.style.marginLeft = "10px";
    div.appendChild(remove);
    remove.addEventListener('click', () => {
      cart.splice(index, 1);
      updateCart();
    });

    // + / - controls
    const controls = document.createElement('div');
    controls.style.marginLeft = "10px";
    controls.innerHTML = `
      <button class="dec">-</button>
      <button class="inc">+</button>
    `;
    div.appendChild(controls);

    controls.querySelector('.dec').addEventListener('click', () => {
      if (item.qty > 1) {
        item.qty--;
      } else {
        cart.splice(index, 1);
      }
      updateCart();
    });

    controls.querySelector('.inc').addEventListener('click', () => {
      item.qty++;
      updateCart();
    });

    cartItemsContainer.appendChild(div);
  });

  cartTotal.textContent = `₦${total.toFixed(2)}`;
  saveCart();
}

/* Save & load cart */
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}
function loadCart() {
  const saved = localStorage.getItem("cart");
  if (saved) {
    cart = JSON.parse(saved);
    updateCart();
  }
}

/* Checkout flow */
document.getElementById('checkout-btn').addEventListener('click', function () {
  if (cart.length === 0) {
    showToast("Your cart is empty!");
    return;
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  const books = cart.map(item => item.book);
  fetch("https://store-kqh0.onrender.com/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ books, total })
  })
  .then(res => res.json())
  .then(data => {
    if (data.redirect) {
      window.location.href = data.redirect; // go to pay.html
    }
  })
  .catch(err => console.error("Checkout Error:", err));
});

/* Cart drawer toggle */
function toggleCart(open) {
  const drawer = document.getElementById('cart-drawer');
  drawer.classList.toggle('open', !!open);
  drawer.setAttribute('aria-hidden', !open);
}

document.getElementById('cart-toggle').addEventListener('click', () => toggleCart(true));
document.getElementById('close-cart').addEventListener('click', () => toggleCart(false));

/* Toast helper */
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.hidden = false;
  setTimeout(() => {
    toast.hidden = true;
  }, 2000);
}
