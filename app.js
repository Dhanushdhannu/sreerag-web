// ==========================================
// API FETCH HELPERS
// ==========================================
export async function fetchProducts() {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Network response was not ok');
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch products:', err);
    return [];
  }
}

export async function fetchProductById(productId) {
  try {
    const res = await fetch(`/api/products/${productId}`);
    if (!res.ok) throw new Error('Product not found');
    return await res.json();
  } catch (err) {
    console.error(`Failed to fetch product ${productId}:`, err);
    return null;
  }
}

// ==========================================
// CART STATE MANAGEMENT
// ==========================================
export function getCart() {
  const cartJson = localStorage.getItem('Noolmade_cart');
  return cartJson ? JSON.parse(cartJson) : [];
}

export function saveCart(cart) {
  localStorage.setItem('Noolmade_cart', JSON.stringify(cart));
  updateCartBadge();
  // Dispatch custom event to let other pages know the cart updated
  window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
}

export async function addToCart(productId, size, color, quantity = 1) {
  const product = await fetchProductById(productId);
  if (!product) return false;

  const cart = getCart();

  // Search if item with same size and color already in cart
  const existingItemIndex = cart.findIndex(item => 
    item.productId === productId && 
    item.size === size && 
    item.color.name === color.name
  );

  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += quantity;
  } else {
    cart.push({
      productId,
      name: product.name,
      price: product.price,
      image: product.images[0],
      size,
      color,
      quantity
    });
  }

  saveCart(cart);
  showToast(`${product.name} (${size} / ${color.name}) added to cart!`);
  return true;
}

export function removeFromCart(index) {
  const cart = getCart();
  if (index >= 0 && index < cart.length) {
    const name = cart[index].name;
    cart.splice(index, 1);
    saveCart(cart);
    showToast(`${name} removed from cart.`);
  }
}

export function updateCartQuantity(index, quantity) {
  const cart = getCart();
  if (index >= 0 && index < cart.length && quantity > 0) {
    cart[index].quantity = quantity;
    saveCart(cart);
  }
}

export function clearCart() {
  saveCart([]);
}

export function getCartCount() {
  const cart = getCart();
  return cart.reduce((total, item) => total + item.quantity, 0);
}

export function getCartSubtotal() {
  const cart = getCart();
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// ==========================================
// TOAST NOTIFICATION UTILITY
// ==========================================
export function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.bottom = '30px';
    container.style.right = '30px';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.background = 'rgba(18, 18, 22, 0.95)';
  toast.style.backdropFilter = 'blur(8px)';
  toast.style.border = `1px solid ${type === 'success' ? 'var(--accent-gold)' : 'var(--error)'}`;
  toast.style.color = '#fff';
  toast.style.padding = '12px 24px';
  toast.style.borderRadius = '4px';
  toast.style.fontSize = '14px';
  toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '10px';
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(20px)';
  toast.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

  const icon = document.createElement('i');
  icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
  icon.style.color = type === 'success' ? 'var(--accent-gold)' : 'var(--error)';
  toast.appendChild(icon);

  const text = document.createElement('span');
  text.textContent = message;
  toast.appendChild(text);

  container.appendChild(toast);

  // Trigger reflow & animate
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 10);

  // Auto remove after 3.5s
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==========================================
// DYNAMIC COMPONENT RENDERERS
// ==========================================
function renderHeader() {
  const currentPath = window.location.pathname;
  const isHomePage = currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath === '';
  const isCatalogPage = currentPath.includes('products.html');
  const isCartPage = currentPath.includes('cart.html');

  const relativePath = './';

  const headerHtml = `
    <div class="container nav-container">
      <a href="${relativePath}index.html" class="logo">Noolmade<span>.</span></a>
      <nav class="nav-links">
        <a href="${relativePath}index.html" class="${isHomePage ? 'active' : ''}">Home</a>
        <a href="${relativePath}products.html" class="${isCatalogPage ? 'active' : ''}">Shop All</a>
        <a href="${relativePath}products.html?category=men">Men</a>
        <a href="${relativePath}products.html?category=women">Women</a>
        <a href="${relativePath}products.html?category=accessories">Accessories</a>
      </nav>
      <div class="nav-actions">
        <div class="search-box">
          <input type="text" id="global-search" placeholder="Search designs..." autocomplete="off">
          <i class="fas fa-search"></i>
        </div>
        <a href="${relativePath}cart.html" class="icon-btn" aria-label="Shopping Cart">
          <i class="fas fa-shopping-bag"></i>
          <span class="cart-badge" style="display: none;">0</span>
        </a>
        <button class="icon-btn mobile-menu-btn" aria-label="Toggle Menu">
          <i class="fas fa-bars"></i>
        </button>
      </div>
    </div>
  `;

  const header = document.createElement('header');
  header.innerHTML = headerHtml;
  document.body.prepend(header);

  // Render mobile nav drawer
  const mobileNavHtml = `
    <div class="mobile-nav-header">
      <a href="${relativePath}index.html" class="logo">Noolmade<span>.</span></a>
      <button class="icon-btn mobile-close-btn"><i class="fas fa-times"></i></button>
    </div>
    <div class="mobile-nav-links">
      <a href="${relativePath}index.html">Home</a>
      <a href="${relativePath}products.html">Shop All</a>
      <a href="${relativePath}products.html?category=men">Men</a>
      <a href="${relativePath}products.html?category=women">Women</a>
      <a href="${relativePath}products.html?category=accessories">Accessories</a>
      <a href="${relativePath}cart.html" style="color: var(--accent-gold);"><i class="fas fa-shopping-bag"></i> Bag</a>
    </div>
  `;
  
  const mobileNav = document.createElement('div');
  mobileNav.className = 'mobile-nav';
  mobileNav.innerHTML = mobileNavHtml;
  document.body.appendChild(mobileNav);

  const overlay = document.createElement('div');
  overlay.className = 'nav-overlay';
  document.body.appendChild(overlay);

  // Setup header scroll listener
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Mobile Drawer Functionality
  const menuBtn = header.querySelector('.mobile-menu-btn');
  const closeBtn = mobileNav.querySelector('.mobile-close-btn');
  
  const openMenu = () => {
    mobileNav.classList.add('open');
    overlay.classList.add('open');
  };

  const closeMenu = () => {
    mobileNav.classList.remove('open');
    overlay.classList.remove('open');
  };

  menuBtn.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);
  overlay.addEventListener('click', closeMenu);

  // Global Search Box Listener
  const searchInput = header.querySelector('#global-search');
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const q = e.target.value.trim();
      if (q) {
        window.location.href = `${relativePath}products.html?q=${encodeURIComponent(q)}`;
      }
    }
  });
}

function renderFooter() {
  const footerHtml = `
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col">
          <a href="index.html" class="logo" style="margin-bottom: 20px; display: inline-block;">Noolmade<span>.</span></a>
          <p>Redefining contemporary style through premium materials, ethical manufacturing, and clean minimalist aesthetics.</p>
          <div class="social-links">
            <a href="#" class="icon-btn"><i class="fab fa-instagram"></i></a>
            <a href="#" class="icon-btn"><i class="fab fa-pinterest"></i></a>
            <a href="#" class="icon-btn"><i class="fab fa-facebook-f"></i></a>
          </div>
        </div>
        <div class="footer-col">
          <h4>Collections</h4>
          <ul class="footer-links">
            <li><a href="products.html?category=men">Men's Apparel</a></li>
            <li><a href="products.html?category=women">Women's Apparel</a></li>
            <li><a href="products.html?category=accessories">Signature Accessories</a></li>
            <li><a href="products.html">New Arrivals</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Customer Care</h4>
          <ul class="footer-links">
            <li><a href="#">Shipping & Returns</a></li>
            <li><a href="#">Size Guides</a></li>
            <li><a href="#">Sustainability Statement</a></li>
            <li><a href="#">Contact Us</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Newsletter</h4>
          <p>Join the Noolmade circle. Subscribe for seasonal releases and exclusive early access.</p>
          <form class="newsletter-form" onsubmit="event.preventDefault(); alert('Thank you for subscribing to Noolmade!')">
            <input type="email" placeholder="Your email address" required>
            <button type="submit" class="btn btn-primary" style="padding: 0 16px;"><i class="fas fa-arrow-right"></i></button>
          </form>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 Noolmade Apparel. All Rights Reserved.</p>
        <p>Crafted for Excellence.</p>
      </div>
    </div>
  `;

  const footer = document.createElement('footer');
  footer.innerHTML = footerHtml;
  document.body.appendChild(footer);
}

function renderQuickViewModal() {
  const modalHtml = `
    <div class="modal-container">
      <div class="modal-close-btn"><i class="fas fa-times"></i></div>
      <div class="modal-body" id="modal-product-content">
        <!-- Dynamically injected product details -->
      </div>
    </div>
  `;

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'quick-view-modal';
  modal.innerHTML = modalHtml;
  document.body.appendChild(modal);

  const closeBtn = modal.querySelector('.modal-close-btn');
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('open');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('open');
    }
  });
}

// ==========================================
// CART BADGE UPDATER
// ==========================================
export function updateCartBadge() {
  const badges = document.querySelectorAll('.cart-badge');
  const count = getCartCount();
  
  badges.forEach(badge => {
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  });
}

// ==========================================
// QUICK VIEW ACTION BINDINGS
// ==========================================
export async function openQuickView(productId) {
  const product = await fetchProductById(productId);
  if (!product) return;

  const modal = document.getElementById('quick-view-modal');
  const container = document.getElementById('modal-product-content');

  // Build select option arrays
  let sizeOptionsHtml = product.sizes.map((size, idx) => `
    <button class="size-btn ${idx === 0 ? 'selected' : ''}" data-size="${size}">${size}</button>
  `).join('');

  let colorOptionsHtml = product.colors.map((color, idx) => `
    <button class="color-swatch-btn ${idx === 0 ? 'selected' : ''}" 
            data-name="${color.name}" 
            data-hex="${color.hex}" 
            style="background-color: ${color.hex}">
    </button>
  `).join('');

  let starsHtml = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(product.rating)) {
      starsHtml += '<i class="fas fa-star"></i>';
    } else if (i - 0.5 <= product.rating) {
      starsHtml += '<i class="fas fa-star-half-alt"></i>';
    } else {
      starsHtml += '<i class="far fa-star"></i>';
    }
  }

  container.innerHTML = `
    <div class="detail-gallery">
      <div class="detail-main-img">
        <img id="modal-main-img" src="${product.images[0]}" alt="${product.name}">
      </div>
      <div class="detail-thumbnails">
        ${product.images.map((img, idx) => `
          <div class="thumb-img ${idx === 0 ? 'active' : ''}" data-index="${idx}">
            <img src="${img}" alt="${product.name} view ${idx + 1}">
          </div>
        `).join('')}
      </div>
    </div>
    <div class="detail-info">
      <div class="product-cat">${product.category}</div>
      <h2 class="detail-title">${product.name}</h2>
      
      <div class="detail-meta">
        <div class="stars">${starsHtml}</div>
        <span>(${product.reviewsCount} verified reviews)</span>
      </div>

      <div class="detail-price">$${product.price}</div>
      <p class="detail-description">${product.description}</p>

      <div class="detail-selectors">
        <div>
          <div class="selector-title">Select Color: <span id="modal-color-name" style="color: var(--text-primary); text-transform: none; font-weight: 500;">${product.colors[0].name}</span></div>
          <div class="color-swatch-grid" id="modal-colors">
            ${colorOptionsHtml}
          </div>
        </div>

        <div>
          <div class="selector-title">Select Size</div>
          <div class="size-grid" id="modal-sizes">
            ${sizeOptionsHtml}
          </div>
        </div>

        <div>
          <div class="selector-title">Quantity</div>
          <div class="qty-picker">
            <button class="qty-btn" id="modal-qty-minus"><i class="fas fa-minus"></i></button>
            <input type="number" class="qty-input" id="modal-qty" value="1" min="1" readonly>
            <button class="qty-btn" id="modal-qty-plus"><i class="fas fa-plus"></i></button>
          </div>
        </div>
      </div>

      <div class="detail-actions">
        <button class="btn btn-primary" id="modal-add-to-cart-btn">Add to Bag</button>
        <a href="product-detail.html?id=${product.id}" class="btn btn-secondary">Full Details</a>
      </div>
    </div>
  `;

  // Bind thumbnails click
  const thumbnails = container.querySelectorAll('.thumb-img');
  const mainImg = container.querySelector('#modal-main-img');
  thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbnails.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      mainImg.src = product.images[thumb.dataset.index];
    });
  });

  // Bind color swatch selection
  const swatches = container.querySelectorAll('.color-swatch-btn');
  let selectedColor = product.colors[0];
  swatches.forEach((swatch, idx) => {
    swatch.addEventListener('click', () => {
      swatches.forEach(s => s.classList.remove('selected'));
      swatch.classList.add('selected');
      selectedColor = product.colors[idx];
      container.querySelector('#modal-color-name').textContent = selectedColor.name;
    });
  });

  // Bind size button selection
  const sizeBtns = container.querySelectorAll('.size-btn');
  let selectedSize = product.sizes[0];
  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedSize = btn.dataset.size;
    });
  });

  // Bind quantity controls
  const qtyInput = container.querySelector('#modal-qty');
  const qtyMinus = container.querySelector('#modal-qty-minus');
  const qtyPlus = container.querySelector('#modal-qty-plus');

  qtyMinus.addEventListener('click', () => {
    const val = Number(qtyInput.value);
    if (val > 1) qtyInput.value = val - 1;
  });

  qtyPlus.addEventListener('click', () => {
    const val = Number(qtyInput.value);
    qtyInput.value = val + 1;
  });

  // Bind Add to Cart
  const addBtn = container.querySelector('#modal-add-to-cart-btn');
  addBtn.addEventListener('click', () => {
    const qty = Number(qtyInput.value);
    addToCart(product.id, selectedSize, selectedColor, qty);
    modal.classList.remove('open');
  });

  modal.classList.add('open');
}

export function setupQuickViewTriggers() {
  document.querySelectorAll('[data-action="quick-view"]').forEach(btn => {
    // Clone node to clear previous listeners if catalog is re-rendered
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const pid = newBtn.dataset.productId;
      openQuickView(pid);
    });
  });
}

// ==========================================
// APPLICATION INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
  renderQuickViewModal();
  updateCartBadge();
  setupQuickViewTriggers();
});
