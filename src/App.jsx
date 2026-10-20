import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { storeApi } from './lib/storeApi.js';
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Camera, Check, ChevronDown,
  ChevronRight, Heart, Menu, Minus, Plus, Search,
  Grid2X2, House, Moon, ShieldCheck, ShoppingBag, SlidersHorizontal, Sparkles, Star, Sun, Truck, UserRound,
  X, MapPin, PackageCheck, Ruler, RotateCcw, LogOut, User, Clock3,
} from 'lucide-react';

const AdminPanel = lazy(() => import('./AdminPanel.jsx'));
const googleAuthEnabled = import.meta.env.VITE_SUPABASE_GOOGLE_AUTH_ENABLED === 'true';

const image = (id, width = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

const seedProducts = [
  { id: 1, name: 'The Everyday Runner', category: 'Sneakers', audience: 'Men', price: 2490, compare: 3290, rating: '4.9', reviews: 128, badge: 'BESTSELLER', color: 'Black / Amber', colorHex: '#c78219', image: '/images/step-on-hero.webp', sizes: [6, 7, 8, 9, 10], popularity: 98, isNew: true, stock: 34, state: 'Active' },
  { id: 2, name: 'Sunday Leather Slide', category: 'Slides', audience: 'Women', price: 1890, compare: 0, rating: '4.8', reviews: 86, badge: '', color: 'Cognac', colorHex: '#9d603f', image: image('photo-1603487742131-4160ec999306'), sizes: [5, 6, 7, 8, 9], popularity: 84, isNew: true, stock: 12, state: 'Active' },
  { id: 3, name: 'City Pace 02', category: 'Sneakers', audience: 'Women', price: 2790, compare: 3490, rating: '4.9', reviews: 53, badge: 'NEW ARRIVAL', color: 'Cloud / Rose', colorHex: '#d9a1a0', image: image('photo-1552346154-21d32810aba3'), sizes: [5, 6, 7, 8], popularity: 92, isNew: true, stock: 4, state: 'Active' },
  { id: 4, name: 'The Weekender Boot', category: 'Boots', audience: 'Men', price: 3590, compare: 4290, rating: '4.7', reviews: 41, badge: '', color: 'Deep Brown', colorHex: '#594333', image: image('photo-1520639888713-7851133b1ed0'), sizes: [7, 8, 9, 10], popularity: 78, isNew: false, stock: 0, state: 'Draft' },
  { id: 5, name: 'Form & Function', category: 'Sneakers', audience: 'Men', price: 2990, compare: 0, rating: '4.8', reviews: 69, badge: 'JUST LANDED', color: 'Chalk', colorHex: '#ddd9cf', image: image('photo-1495555961986-6d4c1ecb7be3'), sizes: [6, 7, 8, 9, 10, 11], popularity: 87, isNew: true, stock: 21, state: 'Active' },
  { id: 6, name: 'Daylight Sandal', category: 'Sandals', audience: 'Women', price: 2190, compare: 2690, rating: '4.9', reviews: 105, badge: '', color: 'Sienna', colorHex: '#a86f4f', image: image('photo-1543163521-1bf539c55dd2'), sizes: [5, 6, 7, 8], popularity: 90, isNew: false, stock: 8, state: 'Active' },
  { id: 7, name: 'Off-Duty High Top', category: 'Sneakers', audience: 'Unisex', price: 3190, compare: 0, rating: '4.7', reviews: 37, badge: 'LOW STOCK', color: 'Black / Ecru', colorHex: '#363633', image: image('photo-1608231387042-66d1773070a5'), sizes: [6, 7, 8, 9, 10], popularity: 81, isNew: false, stock: 9, state: 'Active' },
  { id: 8, name: 'Easy Does It Mule', category: 'Slides', audience: 'Women', price: 1690, compare: 0, rating: '4.6', reviews: 28, badge: '', color: 'Soft Olive', colorHex: '#96977b', image: image('photo-1600185365483-26d7a4cc7519'), sizes: [5, 6, 7, 8], popularity: 73, isNew: false, stock: 15, state: 'Active' },
];

const categories = [
  { name: 'Everyday sneakers', slug: 'Sneakers', note: 'Made for the long way home', image: image('photo-1460353581641-37baddab0fa2', 800), style: 'category-card--large' },
  { name: 'Sandals & slides', slug: 'Slides', note: 'Slow days, sorted', image: image('photo-1543163521-1bf539c55dd2', 700) },
  { name: 'Boots with a point', slug: 'Boots', note: 'A little extra ground', image: image('photo-1520639888713-7851133b1ed0', 700) },
];

const money = (value) => `₹${Number(value).toLocaleString('en-IN')}`;
const deliverySettingsFromBrowser = () => {
  const saved = readClientState('stepon-store-settings', {});
  const threshold = Number(String(saved.freeDelivery ?? '2499').replace(/[^\d.]/g, ''));
  const fee = Number(String(saved.deliveryFee ?? '99').replace(/[^\d.]/g, ''));
  return { storeName: saved.storeName || 'STEPON Footwear', storeEmail: saved.storeEmail || 'hello@stepon.store', freeDelivery: Number.isFinite(threshold) ? String(threshold) : '2499', deliveryFee: Number.isFinite(fee) ? fee : 99, returnWindow: saved.returnWindow || '7 days' };
};
const readClientState = (key, fallback) => {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
  catch { return fallback; }
};
const storefrontProductFromAdmin = (item, base) => ({
  ...(base || {}),
  id: base?.id ?? item.id,
  adminId: item.id,
  name: item.name || base?.name || 'New STEPON pair',
  category: item.category || base?.category || 'Sneakers',
  audience: item.audience || base?.audience || 'Unisex',
  price: Number(item.price ?? base?.price ?? 0),
  compare: Number(item.compare ?? base?.compare ?? 0),
  stock: Math.max(0, Number(item.stock ?? base?.stock ?? 24)),
  state: item.state || 'Active',
  sizes: (Array.isArray(item.sizes) ? item.sizes : String(item.sizes ?? base?.sizes?.join(',') ?? '6, 7, 8, 9, 10').split(',')).map((size) => Number(String(size).trim())).filter(Number.isFinite),
  color: item.color || base?.color || 'Black',
  colorHex: item.colorHex || base?.colorHex || '#343832',
  image: item.image || base?.image || '/images/step-on-hero.webp',
  rating: base?.rating || '4.8',
  reviews: base?.reviews || 0,
  badge: base?.badge || '',
  popularity: base?.popularity || 60,
  isNew: base?.isNew ?? true,
});
const loadStorefrontProducts = () => {
  const saved = readClientState('stepon-admin-products', null);
  if (!Array.isArray(saved) || !saved.length) return seedProducts.map((item) => ({ ...item, state: 'Active', stock: 24 }));
  const getSeedIndex = (item) => {
    const skuMatch = /^ST-00([1-8])$/.exec(String(item.id));
    if (skuMatch) return Number(skuMatch[1]) - 1;
    return seedProducts.findIndex((seed) => seed.name.toLowerCase() === String(item.name).toLowerCase());
  };
  const bySeed = new Map();
  saved.forEach((item) => { const index = getSeedIndex(item); if (index >= 0) bySeed.set(index, item); });
  const merged = seedProducts.flatMap((base, index) => bySeed.has(index) ? [storefrontProductFromAdmin(bySeed.get(index), base)] : []);
  const extras = saved.filter((item) => getSeedIndex(item) < 0).map((item) => storefrontProductFromAdmin(item));
  return [...merged, ...extras];
};

function Brand({ onClick, storeName = 'STEPON Footwear' }) {
  const wordmark = String(storeName).replace(/\s+Footwear$/i, '').trim() || 'STEPON';
  return <button className="brand" onClick={onClick} aria-label={`${wordmark} home`}><span className="brand-mark">{wordmark[0].toLowerCase()}<span>.</span></span><span className="brand-name">{wordmark}<small>FOOTWEAR, FOR EVERYWHERE</small></span></button>;
}

function Header({ page, setPage, cartCount, wishlistCount, openCart, openSearch, onCategory, mobileMenu, setMobileMenu, theme, onToggleTheme, customer, deliverySettings, storeName }) {
  return <>
    <div className="announcement"><span>Made for the everyday. <b>Free delivery on orders over {money(Number(deliverySettings?.freeDelivery ?? 2499))}.</b></span><span className="announcement-right">A little more comfort, every day <span>↗</span></span></div>
    <header className="site-header">
      <div className="nav-wrap">
        <button className="mobile-menu-button icon-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Open menu"><Menu size={21} /></button>
        <Brand onClick={() => setPage('home')} storeName={storeName} />
        <nav className={`main-nav ${mobileMenu ? 'main-nav--open' : ''}`}>
          <button className={page === 'home' ? 'nav-link active' : 'nav-link'} onClick={() => { setPage('home'); setMobileMenu(false); }}>Home</button>
          <button className={page === 'shop' ? 'nav-link active' : 'nav-link'} onClick={() => onCategory('All')}>Shop all</button>
          <button className="nav-link" onClick={() => onCategory('Sneakers')}>Sneakers</button>
          <button className="nav-link" onClick={() => onCategory('Slides')}>Sandals & slides</button>
          <button className="nav-link" onClick={() => onCategory('Boots')}>Boots</button>
          <button className="nav-link nav-link--sale" onClick={() => onCategory('Sale')}>The last pairs</button>
          <button className="nav-link mobile-account-link" onClick={() => { setPage(customer ? 'account' : 'login'); setMobileMenu(false); }}>My account</button>
        </nav>
        <div className="nav-actions">
          <button className="icon-button" aria-label="Search products" onClick={openSearch}><Search size={20} strokeWidth={1.7} /></button>
          <button className="icon-button theme-toggle" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} onClick={onToggleTheme}>{theme === 'light' ? <Moon size={18} strokeWidth={1.8} /> : <Sun size={18} strokeWidth={1.8} />}</button>
          <button className="icon-button account-icon" aria-label="My account" onClick={() => setPage(customer ? 'account' : 'login')}><UserRound size={20} strokeWidth={1.7} /></button>
          <button className="icon-button wishlist-nav" aria-label="Saved items" onClick={() => setPage('saved')}><Heart size={20} strokeWidth={1.7} />{wishlistCount > 0 && <span className="nav-count">{wishlistCount}</span>}</button>
          <button className="icon-button bag-button" aria-label="Shopping bag" onClick={openCart}><ShoppingBag size={20} strokeWidth={1.7} /><span className="nav-count">{cartCount}</span></button>
        </div>
      </div>
      <div className={`mobile-nav-scrim ${mobileMenu ? 'visible' : ''}`} onClick={() => setMobileMenu(false)} />
    </header>
  </>;
}

function ProductCard({ product, saved, onWishlist, onQuickView, onProduct }) {
  return <article className="product-card">
    <div className="product-image-wrap">
      <button className="product-image-open" onClick={() => onProduct(product)} aria-label={`View ${product.name}`}><img src={product.image} alt={product.name} className="product-image" loading="lazy" /></button>
      {product.badge && <span className={`product-badge ${product.badge.includes('STOCK') ? 'product-badge--muted' : ''}`}>{product.badge}</span>}
      <button className={`heart-button ${saved ? 'is-saved' : ''}`} aria-label={saved ? 'Remove from saved' : 'Save item'} onClick={(e) => { e.stopPropagation(); onWishlist(product.id); }}><Heart size={17} fill={saved ? 'currentColor' : 'none'} /></button>
      <button className="quick-add" disabled={product.stock <= 0} onClick={(e) => { e.stopPropagation(); onQuickView(product); }}>{product.stock <= 0 ? 'Out of stock' : 'Choose size'} {product.stock > 0 && <Plus size={15} />}</button>
    </div>
    <div className="product-info">
      <div className="product-title-row"><button onClick={() => onProduct(product)} className="product-name">{product.name}</button>{product.reviews > 0 && <span className="product-rating"><Star size={12} fill="currentColor" /> {product.rating}</span>}</div>
      <div className="product-meta"><span>{product.category} <i>·</i> {product.color}</span><div className="color-dot" style={{ background: product.colorHex }} /></div>
      <div className="product-price">{money(product.price)} {product.compare > product.price && <del>{money(product.compare)}</del>}</div>
    </div>
  </article>;
}

function ProductGrid({ items, wishlist, onWishlist, onQuickView, onProduct, emptyMessage = 'No pairs found. Try another filter.' }) {
  if (!items.length) return <div className="empty-products"><span>Nothing here yet.</span><p>{emptyMessage}</p></div>;
  return <div className="product-grid">{items.map((product) => <ProductCard key={product.id} product={product} saved={wishlist.includes(product.id)} onWishlist={onWishlist} onQuickView={onQuickView} onProduct={onProduct} />)}</div>;
}

function Home({ products, onCategory, wishlist, onWishlist, onQuickView, onProduct, setPage, storeEmail, storeName, configured = false, deliverySettings }) {
  const bestsellers = products.filter((product) => product.state !== 'Draft').sort((a, b) => b.popularity - a.popularity).slice(0, 4);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  return <main>
    <section className="hero">
      <img className="hero-photo" src="/images/step-on-hero.webp" fetchPriority="high" alt="Black and amber performance sneaker on a rain-darkened city track" />
      <div className="hero-grain" />
      <aside className="hero-rail" aria-label="Quick links">
        <button className="is-active" aria-label="Home" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><House size={20} /></button>
        <button aria-label="Shop all" onClick={() => onCategory('All')}><Grid2X2 size={19} /></button>
        <button aria-label="Sneakers" onClick={() => onCategory('Sneakers')}><ShoppingBag size={19} /></button>
        <button aria-label="Saved items" onClick={() => setPage('saved')}><Heart size={19} /></button>
        <button aria-label="My account" onClick={() => setPage('login')}><UserRound size={19} /></button>
      </aside>
      <div className="hero-content">
        <span className="eyebrow hero-eyebrow"><span className="eyebrow-line" />PREMIUM SNEAKERS</span>
        <h1>Step up<br /><em>your game.</em></h1>
        <p>Built for every move. Find your everyday pair with comfort that keeps up.</p>
        <button className="button button--dark hero-cta" onClick={() => onCategory('All')}>Shop collection <ArrowRight size={17} /></button>
        <span className="hero-footnote">01 — STEPON PERFORMANCE SERIES</span>
      </div>
      <div className="hero-side-note"><span>DESIGNED FOR THE LONG WAY HOME</span><ArrowDown size={14} /></div>
      <div className="hero-number">MOVE WITH INTENT <span>✳</span></div>
    </section>

    <section className="benefit-strip">
      <div className="benefit-item"><span className="benefit-icon"><Truck size={18} /></span><span><b>Free delivery</b><small>On orders over {money(Number(deliverySettings?.freeDelivery ?? 2499))}</small></span></div>
      <span className="benefit-divider" />
      <div className="benefit-item"><span className="benefit-icon"><ArrowLeft size={17} /></span><span><b>Returns within {deliverySettings?.returnWindow || '7 days'}</b><small>Try them on, take your time</small></span></div>
      <span className="benefit-divider" />
      <div className="benefit-item"><span className="benefit-icon"><ShieldCheck size={18} /></span><span><b>Made to last</b><small>Thoughtful quality, always</small></span></div>
      <div className="benefit-note">GOOD SHOES, GOOD DAYS. <span>✳</span></div>
    </section>

    <section className="section category-section" id="categories">
      <div className="section-head"><div><span className="eyebrow">A PLACE TO BEGIN</span><h2>What's your <em>pace?</em></h2></div><button className="text-link" onClick={() => onCategory('All')}>See all footwear <ArrowRight size={15} /></button></div>
      <div className="category-grid">{categories.map((item, i) => <button key={item.slug} className={`category-card ${item.style || ''}`} onClick={() => onCategory(item.slug)}>
        <img src={item.image} alt={item.name} loading="lazy" /><span className="category-index">0{i + 1}</span><span className="category-copy"><span>{item.note}</span><b>{item.name}</b></span><span className="category-arrow"><ArrowUpRight size={18} /></span>
      </button>)}</div>
    </section>

    <section className="section arrivals-section" id="new-arrivals">
      <div className="section-head"><div><span className="eyebrow">THE PAIRS EVERYONE'S AFTER</span><h2>Bestsellers<span className="title-period">.</span></h2></div><button className="text-link" onClick={() => onCategory('New')}>View all <ArrowRight size={15} /></button></div>
      <ProductGrid items={bestsellers} wishlist={wishlist} onWishlist={onWishlist} onQuickView={onQuickView} onProduct={onProduct} />
    </section>

    <section className="stats-band" aria-label="What makes STEPON different">
      <div className="stats-item"><span className="stats-index">01</span><span><b>LIGHTWEIGHT FEEL</b><small>Easy on your feet, all day.</small></span></div>
      <div className="stats-item"><span className="stats-index">02</span><span><b>BREATHABLE BY DESIGN</b><small>Room to move. Air to breathe.</small></span></div>
      <div className="stats-item"><span className="stats-index">03</span><span><b>BUILT FOR THE EVERYDAY</b><small>Grip that keeps up with you.</small></span></div>
      <div className="stats-item"><span className="stats-index">04</span><span><b>COMFORT, DIALED IN</b><small>Good fit. No second thoughts.</small></span></div>
    </section>

    <section className="story-banner">
      <img src="/images/step-on-hero.webp" alt="Black and amber performance sneaker built for everyday movement" loading="lazy" />
      <div className="story-overlay" />
      <div className="story-copy"><span className="eyebrow">MORE THAN JUST SHOES</span><h2>Comfort<br /><em>in every step.</em></h2><p>For early starts, long days and the miles that happen in between.</p><button className="button button--light" onClick={() => onCategory('All')}>Find your pair <ArrowRight size={16} /></button></div>
      <span className="story-caption">STEPON PERFORMANCE SERIES · 01</span>
    </section>

    {!configured && <section className="section love-section">
      <div className="love-heading"><span className="eyebrow">A FEW KIND WORDS</span><h2>Worn out there.<br /><em>Loved in here.</em></h2><p>Real people, real places, really good shoes.</p><div className="review-score"><span className="review-stars">★★★★★</span><b>4.9 / 5</b><small>from 1,200+ happy feet</small></div></div>
      <div className="review-card"><div className="review-card-top"><span className="review-stars">★★★★★</span><span>VERIFIED CUSTOMER</span></div><blockquote>“I ordered one pair to try and immediately came back for another. They feel broken-in from day one.”</blockquote><div className="review-author"><div className="author-avatar">AP</div><div><b>Ananya P.</b><small>City Pace 02 · Bengaluru</small></div><Check size={15} className="review-check" /></div></div>
      <div className="review-card review-card--offset"><div className="review-card-top"><span className="review-stars">★★★★★</span><span>VERIFIED CUSTOMER</span></div><blockquote>“Finally, shoes that look good after a whole day on my feet. The little things really matter.”</blockquote><div className="review-author"><div className="author-avatar author-avatar--green">RK</div><div><b>Rohan K.</b><small>The Everyday Runner · Pune</small></div><Check size={15} className="review-check" /></div></div>
      <span className="love-doodle">✳</span>
    </section>}

    <section className="newsletter-section"><div><span className="eyebrow">A GOOD THING IN YOUR INBOX</span><h2>First dibs, <em>good stuff.</em></h2><p>New pairs, little stories and the occasional surprise. Never the noise.</p></div><form className="newsletter-form" onSubmit={(e) => { e.preventDefault(); if (email.includes('@')) setSubscribed(true); }}><label className="sr-only" htmlFor="newsletter-email">Email address</label><input id="newsletter-email" type="email" placeholder="Your email address" value={email} onChange={(e) => setEmail(e.target.value)} required /><button aria-label="Subscribe" type="submit">{subscribed ? <Check size={18} /> : <ArrowRight size={19} />}</button><small>{subscribed ? 'You’re on the list — look out for a little something soon.' : 'By subscribing, you agree to receive STEPON updates.'}</small></form></section>
    <Footer onCategory={onCategory} setPage={setPage} storeEmail={storeEmail} storeName={storeName} />
  </main>;
}

function Shop({ products, category, setCategory, wishlist, onWishlist, onQuickView, onProduct, onSearch, setPage, storeEmail, storeName }) {
  const [sort, setSort] = useState('Featured');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sizeFilter, setSizeFilter] = useState(null);
  const [priceFilter, setPriceFilter] = useState('All prices');
  const [colorFilter, setColorFilter] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('');
  const categoriesList = ['All', 'Sneakers', 'Slides', 'Sandals', 'Boots'];
  const colorKeywords = { Black: ['black'], Brown: ['brown', 'cognac', 'sienna'], White: ['white', 'chalk', 'cloud', 'stone'], Olive: ['olive', 'moss'], Rose: ['rose'] };
  let items = products.filter((p) => p.state !== 'Draft' && (category === 'All' || (category === 'New' ? p.isNew : category === 'Sale' ? p.compare > p.price : category === 'Slides' ? ['Slides', 'Sandals'].includes(p.category) : p.category === category)));
  if (sizeFilter) items = items.filter((p) => p.sizes.includes(Number(sizeFilter)));
  if (priceFilter === 'Under ₹1,500') items = items.filter((p) => p.price < 1500);
  if (priceFilter === '₹1,500–₹2,500') items = items.filter((p) => p.price >= 1500 && p.price <= 2500);
  if (priceFilter === '₹2,500–₹3,500') items = items.filter((p) => p.price > 2500 && p.price <= 3500);
  if (priceFilter === 'Over ₹3,500') items = items.filter((p) => p.price > 3500);
  if (colorFilter) items = items.filter((p) => colorKeywords[colorFilter].some((keyword) => p.color.toLowerCase().includes(keyword)));
  if (audienceFilter) items = items.filter((p) => p.audience === audienceFilter || p.audience === 'Unisex');
  items = [...items];
  if (sort === 'Price: low to high') items.sort((a, b) => a.price - b.price);
  if (sort === 'Price: high to low') items.sort((a, b) => b.price - a.price);
  if (sort === 'Top rated') items.sort((a, b) => Number(b.rating) - Number(a.rating));
  if (sort === 'Newest') items.sort((a, b) => Number(b.isNew) - Number(a.isNew));
  if (sort === 'Most popular') items.sort((a, b) => b.popularity - a.popularity);
  return <main className="shop-page">
    <div className="breadcrumb"><button onClick={() => setCategory('All')}>Home</button><ChevronRight size={13} /> Shop <ChevronRight size={13} /> <b>{category === 'All' ? 'All footwear' : category === 'New' ? 'New arrivals' : category === 'Sale' ? 'The last pairs' : category}</b></div>
    <div className="shop-heading"><div><span className="eyebrow">GOOD THINGS, RIGHT THIS WAY</span><h1>{category === 'All' ? 'All the good ones.' : category === 'New' ? 'Fresh from the box.' : category === 'Sale' ? 'The last pairs.' : `${category}, your way.`}</h1><p>Thoughtful footwear for wherever today takes you.</p></div><span className="shop-scribble">✳</span></div>
    <div className="shop-toolbar"><div className="shop-tabs">{categoriesList.map((item) => <button key={item} className={category === item ? 'shop-tab active' : 'shop-tab'} onClick={() => setCategory(item)}>{item}</button>)}</div><div className="toolbar-actions"><span>{items.length} pairs</span><button className={`filter-trigger ${filtersOpen ? 'active' : ''}`} onClick={() => setFiltersOpen(!filtersOpen)}><SlidersHorizontal size={15} /> Filter <ChevronDown size={14} /></button><label className="sort-select"><span>Sort by</span><select value={sort} onChange={(e) => setSort(e.target.value)}><option>Featured</option><option>Newest</option><option>Most popular</option><option>Price: low to high</option><option>Price: high to low</option><option>Top rated</option></select><ChevronDown size={13} /></label></div></div>
    <div className="shop-layout">
      <aside className={`shop-filters ${filtersOpen ? 'shop-filters--open' : ''}`}>
        <div className="filter-group"><h3>Category</h3>{categoriesList.slice(1).map((item) => <button className="filter-option" key={item} onClick={() => setCategory(item)}><span className={`filter-check ${category === item ? 'checked' : ''}`}>{category === item && <Check size={11} />}</span>{item}<small>{products.filter((p) => p.state !== 'Draft' && (item === 'Slides' ? ['Slides', 'Sandals'].includes(p.category) : p.category === item)).length}</small></button>)}</div>
        <div className="filter-group"><h3>Size</h3><div className="size-filter">{[5, 6, 7, 8, 9, 10, 11].map((size) => <button className={sizeFilter === size ? 'selected' : ''} key={size} onClick={() => setSizeFilter(sizeFilter === size ? null : size)}>{size}</button>)}</div></div>
        <div className="filter-group"><h3>Price</h3>{['All prices', 'Under ₹1,500', '₹1,500–₹2,500', '₹2,500–₹3,500', 'Over ₹3,500'].map((price) => <button className="filter-option" key={price} onClick={() => setPriceFilter(price)}><span className={`filter-check ${priceFilter === price ? 'checked' : ''}`}>{priceFilter === price && <Check size={11} />}</span>{price}</button>)}</div>
        <div className="filter-group"><h3>Colour</h3>{['Black', 'Brown', 'White', 'Olive', 'Rose'].map((color) => <button className="filter-option" key={color} onClick={() => setColorFilter(colorFilter === color ? '' : color)}><span className={`filter-check ${colorFilter === color ? 'checked' : ''}`}>{colorFilter === color && <Check size={11} />}</span>{color}</button>)}</div>
        <div className="filter-group"><h3>For</h3>{['Men', 'Women'].map((audience) => <button className="filter-option" key={audience} onClick={() => setAudienceFilter(audienceFilter === audience ? '' : audience)}><span className={`filter-check ${audienceFilter === audience ? 'checked' : ''}`}>{audienceFilter === audience && <Check size={11} />}</span>{audience}</button>)}</div>
        <button className="clear-filters" onClick={() => { setCategory('All'); setSizeFilter(null); setPriceFilter('All prices'); setColorFilter(''); setAudienceFilter(''); }}>Clear all filters</button>
        <div className="filter-help"><Sparkles size={16} /><p>Need a hand finding your size?</p><button onClick={onSearch}>Ask us anything <ArrowRight size={13} /></button></div>
      </aside>
      <ProductGrid items={items} wishlist={wishlist} onWishlist={onWishlist} onQuickView={onQuickView} onProduct={onProduct} />
    </div>
    <Footer onCategory={setCategory} setPage={setPage} storeEmail={storeEmail} storeName={storeName} />
  </main>;
}

function ProductDetails({ product, products, wishlist, onWishlist, onProduct, onQuickView, onAdd, onBuyNow, onBack, configured = false, deliverySettings }) {
  const [size, setSize] = useState(null);
  const [pincode, setPincode] = useState('');
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const related = products.filter((item) => item.state !== 'Draft' && item.id !== product.id && (item.category === product.category || item.audience === product.audience)).slice(0, 4);
  const savings = product.compare > product.price ? Math.round((1 - product.price / product.compare) * 100) : 0;
  const checkDelivery = (event) => {
    event.preventDefault();
    setDeliveryMessage(/^[0-9]{6}$/.test(pincode) ? `PIN code format looks good. Our team will confirm serviceability for ${pincode} after your order.` : 'Enter a valid 6-digit PIN code to check delivery.');
  };
  return <main className="product-page">
    <div className="breadcrumb"><button onClick={onBack}>Shop</button><ChevronRight size={13} /><span>{product.category}</span><ChevronRight size={13} /><b>{product.name}</b></div>
    <section className="product-detail-layout">
      <div className="product-detail-gallery">
        <div className="product-detail-main-image"><img src={product.image} alt={product.name} /><span className="product-detail-note">STEPON · EVERYDAY SERIES</span>{product.badge && <span className="product-badge">{product.badge}</span>}</div>
        <div className="product-detail-thumbnails"><button className="selected" aria-label="View product image"><img src={product.image} alt="" /></button><div><span>DESIGNED TO MOVE</span><small>Thoughtful comfort for the everyday.</small></div><button className="product-detail-wishlist" onClick={() => onWishlist(product.id)} aria-label={wishlist.includes(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}><Heart size={18} fill={wishlist.includes(product.id) ? 'currentColor' : 'none'} /></button></div>
      </div>
      <div className="product-detail-copy">
        <span className="eyebrow">{product.audience.toUpperCase()} · {product.category.toUpperCase()}</span>
        <h1>{product.name}<span>.</span></h1>
        {product.reviews > 0 ? <div className="product-detail-rating"><span>★★★★★</span><b>{product.rating}</b><a href="#product-reviews">{product.reviews} reviews</a></div> : <p className="product-no-reviews">No customer reviews yet.</p>}
        <div className="product-detail-price"><b>{money(product.price)}</b>{product.compare > product.price && <><del>{money(product.compare)}</del><span>{savings}% off</span></>}</div>
        <p className="product-detail-description">{product.description || 'An everyday favourite, thoughtfully made for the miles you actually walk. Easy comfort, considered materials and a look that goes with just about everything.'}</p>
        <div className="product-detail-color"><span>Colour</span><b><i style={{ background: product.colorHex }} />{product.color}</b></div>
        <div className="product-detail-size-head"><b>Choose your size <span>*</span></b><button onClick={() => setSizeGuideOpen(true)}><Ruler size={14} /> Size guide</button></div>
        <div className="product-detail-sizes">{product.sizes.map((item) => <button key={item} disabled={product.stock <= 0} className={size === item ? 'selected' : ''} onClick={() => setSize(item)}>{item}</button>)}</div>
        <p className="product-size-help">{product.stock <= 0 ? 'This pair is out of stock right now.' : `${product.stock} pairs available · Between sizes? Go one size up for a little extra room.`}</p>
        <div className="product-detail-actions"><button className="button button--dark" disabled={!size || product.stock <= 0} onClick={() => size && onAdd(product, size)}>{product.stock <= 0 ? 'Out of stock' : size ? 'Add to bag' : 'Choose a size'} <ShoppingBag size={16} /></button><button className="button button--outline" disabled={!size || product.stock <= 0} onClick={() => size && onBuyNow(product, size)}>Buy now <ArrowRight size={16} /></button></div>
        <div className="product-detail-perks"><span><PackageCheck size={17} /><b>Ready to ship</b></span><span><RotateCcw size={17} /><b>Returns within {deliverySettings?.returnWindow || '7 days'}</b></span><span><ShieldCheck size={17} /><b>Secure checkout</b></span></div>
        <form className="delivery-check-form" onSubmit={checkDelivery}><MapPin size={17} /><label htmlFor="delivery-pin">Check delivery to your PIN code</label><div><input id="delivery-pin" inputMode="numeric" maxLength="6" value={pincode} onChange={(event) => { setPincode(event.target.value.replace(/\D/g, '')); setDeliveryMessage(''); }} placeholder="6-digit PIN code" /><button type="submit">Check</button></div>{deliveryMessage && <small className={deliveryMessage.startsWith('PIN code format') ? 'delivery-available' : 'delivery-error'}>{deliveryMessage}</small>}</form>
        <div className="product-detail-accordions"><details open><summary>Product details <ChevronDown size={15} /></summary><p>{product.description || `Made for everyday wear with a breathable upper, cushioned footbed and dependable rubber outsole. Colour: ${product.color}. Category: ${product.category}.`}</p></details><details><summary>Delivery & returns <ChevronDown size={15} /></summary><p>Complimentary delivery on orders over {money(Number(deliverySettings?.freeDelivery || 2499))}. Easy returns within {deliverySettings?.returnWindow || '7 days'} of delivery. Cash on delivery is {configured ? 'available' : 'shown in this preview'} at checkout.</p></details><details><summary>Care guide <ChevronDown size={15} /></summary><p>Brush off dry dirt after wear. Spot clean gently with a soft damp cloth and let air dry away from direct heat.</p></details></div>
      </div>
    </section>
    {!configured && <section className="product-detail-reviews" id="product-reviews"><div><span className="eyebrow">A LITTLE REAL-WORLD LOVE</span><h2>Good shoes, <em>good days.</em></h2><p><span>★★★★★</span> <b>{product.rating} / 5</b> · {product.reviews} preview reviews</p></div><blockquote>“Finally, a pair that feels good from the first walk. I've worn them all week.”<small>— STEPON preview customer</small></blockquote></section>}
    <section className="section product-related"><div className="section-head"><div><span className="eyebrow">GOOD COMPANY</span><h2>You might like these<span className="title-period">.</span></h2></div><button className="text-link" onClick={onBack}>Back to the collection <ArrowRight size={15} /></button></div><ProductGrid items={related} wishlist={wishlist} onWishlist={onWishlist} onQuickView={onQuickView} onProduct={onProduct} /></section>
    {sizeGuideOpen && <div className="size-guide-backdrop" onClick={() => setSizeGuideOpen(false)}><section className="size-guide-panel" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSizeGuideOpen(false)} aria-label="Close size guide"><X size={18} /></button><span className="eyebrow">A COMFORTABLE FIT</span><h2>Find your size.</h2><p>Measure your foot from heel to longest toe, then use this simple guide.</p><table><thead><tr><th>India / UK</th><th>EU</th><th>Foot length</th></tr></thead><tbody><tr><td>6</td><td>40</td><td>25.0 cm</td></tr><tr><td>7</td><td>41</td><td>25.8 cm</td></tr><tr><td>8</td><td>42</td><td>26.7 cm</td></tr><tr><td>9</td><td>43</td><td>27.5 cm</td></tr><tr><td>10</td><td>44</td><td>28.4 cm</td></tr><tr><td>11</td><td>45</td><td>29.2 cm</td></tr></tbody></table><button className="button button--dark" onClick={() => setSizeGuideOpen(false)}>Got it <Check size={15} /></button></section></div>}
  </main>;
}

function Login({ setPage, onSignIn, configured = false, googleEnabled = false }) {
  const [mode, setMode] = useState('login');
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setError(''); setMessage(''); setBusy(true);
    try {
      const response = await onSignIn({ mode, name, email, password });
      if (response?.requiresEmailConfirmation) { setMessage('Check your inbox to confirm your email, then come back to sign in.'); setSubmitted(true); }
      else if (!configured) setSubmitted(true);
    } catch (cause) { setError(cause.message || 'We could not sign you in. Please try again.'); }
    finally { setBusy(false); }
  };
  const forgot = async () => {
    setError(''); setMessage('');
    if (!email) { setError('Enter your email address first, then choose Forgot.'); return; }
    try { await onSignIn({ mode: 'reset', email }); setMessage('If an account exists for that email, a reset link is on its way.'); }
    catch (cause) { setError(cause.message || 'We could not send a reset link.'); }
  };
  return <main className="auth-page"><div className="auth-image"><img src={image('photo-1520256862855-398228c41684', 1100)} alt="A warm, sunlit weekend away" /><div className="auth-image-note"><span className="eyebrow">A GOOD PLACE TO START</span><p>Good days begin<br />with the right pair.</p><span>STEPON — EVERYDAY, EVERYWHERE</span></div></div><section className="auth-panel"><button className="back-link" onClick={() => setPage('home')}><ArrowLeft size={15} /> Back to the good stuff</button><div className="auth-form-wrap"><div className="auth-mark">s<span>.</span></div><span className="eyebrow">YOUR STEPON ACCOUNT</span><h1>{mode === 'login' ? 'Welcome back.' : 'Make yourself at home.'}</h1><p>{mode === 'login' ? 'Sign in to pick up right where you left off.' : 'A little home for all your favourite pairs.'}</p>
      {submitted ? <div className="auth-success"><span><Check size={22} /></span><b>{message ? 'One more little step.' : "You're on your way."}</b><p>{message || (configured ? 'Your account is ready.' : 'This is a local preview account. Connect Supabase to enable secure customer sign-in.')}</p>{message && <button className="text-link" onClick={() => { setSubmitted(false); setMode('login'); setMessage(''); }}>Back to sign in <ArrowRight size={15} /></button>}<button className="text-link" onClick={() => { setSubmitted(false); setPage('home'); }}>Back to the store <ArrowRight size={15} /></button></div> : <form onSubmit={submit} className="auth-form">{mode === 'register' && <label>Your name<input placeholder="How should we call you?" value={name} onChange={(event) => setName(event.target.value)} required /></label>}<label>Email address<input type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>{mode === 'login' && <label className="password-label">Password<input type="password" placeholder="Your password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength="6" /><button type="button" onClick={forgot}>Forgot?</button></label>}{mode === 'register' && <label>Password<input type="password" placeholder="At least 6 characters" value={password} onChange={(event) => setPassword(event.target.value)} required minLength="6" /></label>}{error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="auth-message" role="status">{message}</p>}<button className="button button--dark auth-submit" type="submit" disabled={busy}>{busy ? 'One moment…' : mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={16} /></button>{googleEnabled && <><div className="auth-or"><span />or<span /></div><button type="button" className="google-button" onClick={async () => { setError(''); setBusy(true); try { await onSignIn({ mode: 'google', email }); } catch (cause) { setError(cause.message || 'Google sign-in is not available right now.'); } finally { setBusy(false); } }}><span>G</span> Continue with Google</button></>}</form>}
      <div className="auth-switch">{mode === 'login' ? 'New around here?' : 'Already have an account?'} <button onClick={() => { setSubmitted(false); setMode(mode === 'login' ? 'register' : 'login'); }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></div><div className="auth-privacy"><ShieldCheck size={14} /> Your details are always kept safe and sound.</div></div></section></main>;
}

function PasswordRecovery({ onComplete }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return <main className="auth-page"><div className="auth-image"><img src={image('photo-1520256862855-398228c41684', 1100)} alt="A warm, sunlit weekend away" /><div className="auth-image-note"><span className="eyebrow">A FRESH START</span><p>Your account,<br />back in your hands.</p><span>STEPON — EVERYDAY, EVERYWHERE</span></div></div><section className="auth-panel"><div className="auth-form-wrap"><div className="auth-mark">s<span>.</span></div><span className="eyebrow">YOUR STEPON ACCOUNT</span><h1>Choose a new password.</h1><p>Use at least 8 characters and keep it somewhere safe.</p><form className="auth-form" onSubmit={async (event) => { event.preventDefault(); setError(''); if (password !== confirm) { setError('Those passwords do not match.'); return; } setBusy(true); try { await onComplete(password); } catch (cause) { setError(cause.message || 'We could not update your password. Open the reset link again and retry.'); } finally { setBusy(false); } }}><label>New password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength="8" autoComplete="new-password" /></label><label>Confirm new password<input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required minLength="8" autoComplete="new-password" /></label>{error && <p className="auth-error" role="alert">{error}</p>}<button className="button button--dark auth-submit" type="submit" disabled={busy}>{busy ? 'Updating…' : 'Save new password'} <ArrowRight size={16} /></button></form><div className="auth-privacy"><ShieldCheck size={14} /> Your new password is saved to your STEPON account.</div></div></section></main>;
}

function CustomerAccount({ customer, orders, wishlist, setPage, onLogout, onTrackOrder, onUpdateCustomer, configured = false, storeEmail, storeName }) {
  const [tab, setTab] = useState('overview');
  const [profileName, setProfileName] = useState(customer.name || '');
  const [profilePhone, setProfilePhone] = useState(customer.phone || '');
  const [savedNotice, setSavedNotice] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const myOrders = orders.filter((order) => order.email === customer.email);
  const addresses = [...new Map(myOrders.map((order) => [order.address, order])).values()].filter((order) => order.address);
  const tabs = [{ id: 'overview', label: 'Overview', icon: User }, { id: 'orders', label: 'My orders', icon: PackageCheck }, { id: 'addresses', label: 'Addresses', icon: MapPin }, { id: 'profile', label: 'Profile', icon: UserRound }];
  return <main className="customer-account-page"><div className="customer-account-head"><div><span className="eyebrow">YOUR LITTLE STEPON CORNER</span><h1>Hello, <em>{customer.name?.split(' ')[0] || 'there'}.</em></h1><p>Your pairs, orders and details, all in one place.</p></div><button className="account-logout" onClick={onLogout}><LogOut size={15} /> Sign out</button></div>
    <div className="customer-account-layout"><nav className="customer-account-nav" aria-label="Account sections">{tabs.map(({ id, label, icon: Icon }) => <button className={tab === id ? 'active' : ''} key={id} onClick={() => setTab(id)}><Icon size={17} />{label}{tab === id && <ChevronDown size={14} />}</button>)}<button onClick={() => setPage('saved')}><Heart size={17} />Saved pairs<span>{wishlist.length}</span></button></nav>
      <section className="customer-account-content">{tab === 'overview' && <><div className="account-welcome-card"><span className="account-welcome-icon"><Sparkles size={18} /></span><span className="eyebrow">A GOOD DAY, IN THE MAKING</span><h2>Everything in its<br /><em>happy place.</em></h2><p>Keep an eye on your orders and the pairs you've saved for later.</p><button className="button button--dark" onClick={() => setPage('shop')}>Find your next pair <ArrowRight size={15} /></button></div><div className="account-summary-grid"><button onClick={() => setTab('orders')}><PackageCheck size={18} /><b>{myOrders.length}</b><span>Orders placed</span><ArrowRight size={14} /></button><button onClick={() => setPage('saved')}><Heart size={18} /><b>{wishlist.length}</b><span>Saved pairs</span><ArrowRight size={14} /></button><button onClick={() => setTab('addresses')}><MapPin size={18} /><b>{addresses.length}</b><span>Saved addresses</span><ArrowRight size={14} /></button></div><div className="account-recent-head"><h3>Recent orders</h3><button onClick={() => setTab('orders')}>See all <ArrowRight size={14} /></button></div>{myOrders.slice(0, 2).map((order) => <AccountOrderCard key={order.id} order={order} onTrackOrder={onTrackOrder} />)}{myOrders.length === 0 && <div className="account-empty"><Clock3 size={20} /><b>No orders yet.</b><p>Your next favourite is just around the corner.</p><button onClick={() => setPage('shop')}>Explore the collection <ArrowRight size={14} /></button></div>}</>}
        {tab === 'orders' && <><div className="account-tab-head"><span className="eyebrow">GOOD THINGS, ON THEIR WAY</span><h2>My orders<span>.</span></h2><p>Follow each pair from checkout to your doorstep.</p></div>{myOrders.length ? myOrders.map((order) => <AccountOrderCard key={order.id} order={order} onTrackOrder={onTrackOrder} />) : <div className="account-empty"><PackageCheck size={22} /><b>Your order list is waiting.</b><p>When you find your pair, it will show up here.</p><button onClick={() => setPage('shop')}>Shop all footwear <ArrowRight size={14} /></button></div>}</>}
        {tab === 'addresses' && <><div className="account-tab-head"><span className="eyebrow">A GOOD PLACE TO LAND</span><h2>Saved addresses<span>.</span></h2><p>Delivery details from your recent orders.</p></div>{addresses.length ? addresses.map((order, index) => <article className="account-address-card" key={order.id}><span><MapPin size={18} /></span><div><b>{order.customer}</b><p>{order.address}<br />{order.city} · {order.pincode}</p><small>{index === 0 ? 'MOST RECENT' : 'USED FOR AN ORDER'}</small></div></article>) : <div className="account-empty"><MapPin size={22} /><b>No addresses saved yet.</b><p>Your address will be saved here the next time you place an order.</p><button onClick={() => setPage('shop')}>Find a pair <ArrowRight size={14} /></button></div>}</>}
        {tab === 'profile' && <><div className="account-tab-head"><span className="eyebrow">THE DETAILS THAT MAKE IT YOURS</span><h2>Your profile<span>.</span></h2><p>Keep your account details up to date.</p></div><form className="account-profile-form" onSubmit={async (event) => { event.preventDefault(); setProfileError(''); setSavingProfile(true); try { await onUpdateCustomer({ ...customer, name: profileName, phone: profilePhone }); setSavedNotice(true); window.setTimeout(() => setSavedNotice(false), 2200); } catch (cause) { setProfileError(cause.message || 'Could not save your profile.'); } finally { setSavingProfile(false); } }}><label>Full name<input value={profileName} onChange={(event) => setProfileName(event.target.value)} required /></label><label>Email address<input value={customer.email} type="email" disabled /></label><label>Mobile number<input value={profilePhone} onChange={(event) => setProfilePhone(event.target.value)} type="tel" /></label><p><ShieldCheck size={14} /> {configured ? 'Your profile is saved securely to your STEPON account.' : 'This preview keeps your profile on this device only.'}</p>{profileError && <p className="auth-error" role="alert">{profileError}</p>}<button className="button button--dark" disabled={savingProfile}>{savingProfile ? 'Saving…' : savedNotice ? 'Profile saved' : 'Save profile'} <Check size={15} /></button></form></>}
      </section>
    </div><Footer onCategory={() => setPage('shop')} setPage={setPage} storeEmail={storeEmail} storeName={storeName} /></main>;
}

function AccountOrderCard({ order, onTrackOrder }) {
  const leadItem = order.cart?.[0];
  return <article className="account-order-card"><div className="account-order-icon">{leadItem ? <img src={leadItem.image} alt="" /> : <PackageCheck size={20} />}</div><div className="account-order-info"><div><b>{order.id}</b><span>{order.date}</span></div><p>{order.cart?.map((item) => `${item.name} · Size ${item.size} × ${item.qty}`).join(', ') || order.items}</p><span className={`account-order-status status-${order.status.toLowerCase()}`}><i />{order.status}</span></div><div className="account-order-total"><b>{money(order.total)}</b><button onClick={() => onTrackOrder(order)}>Track order <ArrowRight size={13} /></button></div></article>;
}

function GuestOrderLookup({ onTrackOrder, onBack, onCategory, onSetPage, storeEmail, storeName }) {
  const [orderNumber, setOrderNumber] = useState(() => { try { return sessionStorage.getItem('stepon-last-guest-order') || ''; } catch { return ''; } });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <main className="saved-page"><div className="breadcrumb"><button onClick={onBack}>Home</button><ChevronRight size={13} /><b>Track an order</b></div><section className="guest-order-lookup"><span className="eyebrow">A GOOD THING, ON ITS WAY</span><h1>Find your order.</h1><p>Enter the STEPON order number from your confirmation. Guest tracking works in the browser where you placed the order.</p><form onSubmit={async (event) => { event.preventDefault(); setError(''); setBusy(true); try { const order = await storeApi.getGuestOrder(orderNumber.trim().toUpperCase()); if (!order) throw new Error('This browser does not have a private tracking link for that order. Open the order confirmation in the browser where you placed it.'); onTrackOrder(order); } catch (cause) { setError(cause.message || 'We could not find that order.'); } finally { setBusy(false); } }}><label htmlFor="guest-order-number">Order number</label><div><input id="guest-order-number" value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="STP-001001" required autoComplete="off" /><button className="button button--dark" type="submit" disabled={busy}>{busy ? 'Looking…' : 'Find my order'} <ArrowRight size={15} /></button></div>{error && <p className="auth-error" role="alert">{error}</p>}</form><button className="text-link" onClick={onBack}><ArrowLeft size={14} /> Back to the store</button></section><Footer onCategory={onCategory} setPage={onSetPage} storeEmail={storeEmail} storeName={storeName} /></main>;
}

function OrderTracking({ order, onBack, onCategory, onSetPage, storeEmail, storeName }) {
  const steps = ['Confirmed', 'Packed', 'Shipped', 'Delivered'];
  const isCancelled = order.status === 'Cancelled';
  const currentStep = steps.indexOf(order.status);
  return <main className="order-tracking-page"><div className="breadcrumb"><button onClick={onBack}>My account</button><ChevronRight size={13} /><b>Order {order.id}</b></div><section className="order-tracking-card">{isCancelled ? <span className="order-success-mark"><X size={22} /></span> : <span className="order-success-mark"><Check size={22} /></span>}<span className="eyebrow">THANK YOU FOR CHOOSING STEPON</span><h1>{isCancelled ? <>This order was <em>cancelled.</em></> : <>Your order is <em>in good hands.</em></>}</h1><p>Order <b>{order.id}</b> · Placed {order.date}</p>{!isCancelled && <div className="order-tracking-steps">{steps.map((step, index) => <div className={`${currentStep >= index ? 'complete' : ''} ${currentStep === index ? 'current' : ''}`} key={step}><span>{currentStep > index ? <Check size={14} /> : index + 1}</span><b>{step}</b></div>)}</div>}<div className="order-tracking-items">{order.cart?.map((item) => <div key={`${item.id}-${item.size}`}><img src={item.image} alt={item.name} /><span><b>{item.name}</b><small>{item.color} · Size {item.size} · Qty {item.qty}</small></span><strong>{money(item.price * item.qty)}</strong></div>)}</div><div className="order-tracking-summary"><span>Payment <b>Cash on delivery</b></span><span>Delivery to <b>{order.address}, {order.city}{order.state ? `, ${order.state}` : ''} · {order.pincode}</b></span><span>Total <b>{money(order.total)}</b></span></div><button className="button button--dark" onClick={onBack}>Back to my account <ArrowLeft size={15} /></button></section><Footer onCategory={onCategory} setPage={onSetPage} storeEmail={storeEmail} storeName={storeName} /></main>;
}

function SavedPage({ products, wishlist, onWishlist, onQuickView, onProduct, onAdd, setPage, storeEmail, storeName }) {
  const items = products.filter((p) => p.state !== 'Draft' && wishlist.includes(p.id));
  return <main className="saved-page"><div className="breadcrumb"><button onClick={() => setPage('home')}>Home</button><ChevronRight size={13} /><b>Saved for later</b></div><div className="saved-heading"><span className="eyebrow">A LITTLE LOVE LIST</span><h1>Keeping the good ones close.</h1><p>Pairs you've got your eye on, all in one happy place.</p></div>{items.length ? <ProductGrid items={items} wishlist={wishlist} onWishlist={onWishlist} onQuickView={onQuickView} onProduct={onProduct} /> : <div className="saved-empty"><Heart size={25} /><b>Nothing saved just yet.</b><p>Tap the little heart on anything that catches your eye.</p><button className="button button--dark" onClick={() => setPage('shop')}>Find your favourites <ArrowRight size={15} /></button></div>}<Footer onCategory={() => setPage('shop')} setPage={setPage} storeEmail={storeEmail} storeName={storeName} /></main>;
}

function Footer({ onCategory, setPage, storeEmail = 'hello@stepon.store', storeName = 'STEPON Footwear' }) {
  const displayName = String(storeName).replace(/\s+Footwear$/i, '').trim() || 'STEPON';
  return <footer className="site-footer"><div className="footer-main"><div className="footer-brand-col"><Brand onClick={() => setPage?.('home')} storeName={storeName} /><p>Good shoes, good days.<br />Thoughtful footwear for the everyday.</p><a className="instagram-link" href="https://instagram.com" target="_blank" rel="noreferrer"><Camera size={16} /> Come say hi <ArrowUpRight size={13} /></a></div><div className="footer-link-col"><b>Take a look</b><button onClick={() => onCategory('All')}>Shop all</button><button onClick={() => onCategory('Sneakers')}>Sneakers</button><button onClick={() => onCategory('Boots')}>Boots</button><button onClick={() => onCategory('Sale')}>The last pairs</button></div><div className="footer-link-col"><b>Here to help</b><a href={`mailto:${storeEmail}`}>Get in touch</a><a href={`mailto:${storeEmail}`}>Delivery & returns</a><a href={`mailto:${storeEmail}`}>Find your size</a><a href={`mailto:${storeEmail}`}>FAQs</a><button onClick={() => setPage?.('guest-track')}>Track an order</button></div><div className="footer-last"><div className="footer-seal">MADE FOR<br />THE LONG<br />WAY HOME<span>✳</span></div><p>Thoughtfully chosen.<br />Comfortably worn.</p></div></div><div className="footer-bottom"><span>© 2026 {displayName}. Good shoes, good days.</span><span>Privacy&nbsp;&nbsp;&nbsp; Terms&nbsp;&nbsp;&nbsp; India · INR</span><span>Made for the in-between moments <span className="footer-heart">♥</span></span></div><div className="footer-admin-link"><button onClick={() => setPage?.('admin')}>Store admin <ArrowUpRight size={12} /></button></div></footer>;
}

function QuickView({ product, onClose, onAdd, onProduct, deliverySettings }) {
  const [size, setSize] = useState(null);
  const [added, setAdded] = useState(false);
  useEffect(() => { const key = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, [onClose]);
  return <div className="modal-backdrop" onClick={onClose}><section className="quick-view" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={onClose} aria-label="Close"><X size={19} /></button><div className="quick-image"><img src={product.image} alt={product.name} /></div><div className="quick-details"><span className="eyebrow">THE STEPON EDIT</span><div className="quick-title-line"><h2>{product.name}</h2>{product.reviews > 0 && <span className="product-rating"><Star size={13} fill="currentColor" /> {product.rating} <small>({product.reviews})</small></span>}</div><p className="quick-price">{money(product.price)} {product.compare > product.price && <del>{money(product.compare)}</del>}</p><p className="quick-desc">Thoughtfully made for the everyday. Soft underfoot, easy on the eyes, and ready for wherever you end up.</p><button className="quick-view-full-link" onClick={() => onProduct(product)}>Details & size guide <ArrowRight size={14} /></button><div className="quick-color"><b>Colour</b><span><i style={{ background: product.colorHex }} />{product.color}</span></div><div className="size-heading"><b>Pick your size</b></div><div className="quick-sizes">{product.sizes.map((s) => <button key={s} className={size === s ? 'selected' : ''} onClick={() => { setSize(s); setAdded(false); }}>{s}</button>)}</div>{added ? <div className="added-confirm"><Check size={15} /> Added to your bag — a good choice.</div> : <button className="button button--dark quick-add-button" disabled={!size} onClick={() => { onAdd(product, size); setAdded(true); }}>{size ? 'Add to bag' : 'Choose a size'} <span>{money(product.price)}</span><ArrowRight size={16} /></button>}<div className="quick-delivery"><Truck size={16} /><span>Free delivery over {money(Number(deliverySettings?.freeDelivery ?? 2499))}</span><span className="quick-dot">·</span><span>Returns within {deliverySettings?.returnWindow || '7 days'}</span></div></div></section></div>;
}

function CartDrawer({ cart, onClose, onChange, onRemove, onCheckout, deliverySettings }) {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const freeThreshold = Number(deliverySettings?.freeDelivery || 2499);
  const delivery = subtotal >= freeThreshold || subtotal === 0 ? 0 : Number(deliverySettings?.deliveryFee ?? 99);
  return <div className="drawer-backdrop" onClick={onClose}><aside className="cart-drawer" onClick={(e) => e.stopPropagation()}><div className="drawer-heading"><div><span className="eyebrow">THE GOOD STUFF</span><h2>Your bag <small>({count})</small></h2></div><button className="icon-button" onClick={onClose} aria-label="Close bag"><X size={20} /></button></div>{cart.length ? <><div className="cart-items">{cart.map((item) => <article className="cart-item" key={`${item.id}-${item.size}`}><img src={item.image} alt={item.name} /><div className="cart-item-info"><b>{item.name}</b><span>{item.color} · Size {item.size}</span><div className="cart-qty"><button onClick={() => onChange(item.id, item.size, -1)} aria-label="Decrease quantity"><Minus size={12} /></button><span>{item.qty}</span><button onClick={() => onChange(item.id, item.size, 1)} aria-label="Increase quantity"><Plus size={12} /></button></div></div><div className="cart-item-right"><b>{money(item.price * item.qty)}</b><button onClick={() => onRemove(item.id, item.size)}>Remove</button></div></article>)}</div><div className="cart-footer"><div className="cart-progress"><span>{subtotal >= freeThreshold ? 'You’ve unlocked free delivery!' : `You’re ${money(freeThreshold - subtotal)} away from free delivery`}</span><div className="progress-track"><i style={{ width: `${Math.min(subtotal / Math.max(freeThreshold, 1) * 100, 100)}%` }} /></div></div><div className="cart-total-row"><span>Subtotal</span><b>{money(subtotal)}</b></div><div className="cart-total-row"><span>Delivery</span><b>{delivery ? money(delivery) : 'Complimentary'}</b></div><div className="cart-total-row cart-grand-total"><span>Total</span><b>{money(subtotal + delivery)}</b></div><button className="button button--dark checkout-button" onClick={onCheckout}>Go to checkout <ArrowRight size={16} /></button><p className="cart-secure"><ShieldCheck size={13} /> Secure checkout · returns within {deliverySettings?.returnWindow || '7 days'}</p></div></> : <div className="cart-empty"><span className="cart-empty-icon"><ShoppingBag size={24} /></span><b>Your next favourite is out there.</b><p>Fill your bag with a little everyday goodness.</p><button className="button button--dark" onClick={onClose}>Find your pair <ArrowRight size={15} /></button></div>}</aside></div>;
}

function SearchPanel({ products, onClose, onChoose }) {
  const [query, setQuery] = useState('');
  const matches = useMemo(() => query.trim() ? products.filter((p) => p.state !== 'Draft' && `${p.name} ${p.category} ${p.color} ${p.audience}`.toLowerCase().includes(query.toLowerCase())).slice(0, 4) : [], [products, query]);
  useEffect(() => { const key = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, [onClose]);
  return <div className="search-backdrop" onClick={onClose}><section className="search-panel" onClick={(e) => e.stopPropagation()}><div className="search-top"><span className="eyebrow">FIND YOUR NEXT FAVOURITE</span><button className="icon-button" onClick={onClose}><X size={19} /></button></div><label className="search-input-wrap"><Search size={22} /><input autoFocus placeholder="Try ‘everyday sneakers’..." value={query} onChange={(e) => setQuery(e.target.value)} /><button onClick={() => setQuery('')} aria-label="Clear search"><X size={16} /></button></label>{query ? <div className="search-results"><span className="search-result-caption">{matches.length ? `${matches.length} GOOD THINGS` : 'NOTHING JUST YET'}</span>{matches.length ? matches.map((p) => <button key={p.id} className="search-result" onClick={() => onChoose(p)}><img src={p.image} alt="" /><span><b>{p.name}</b><small>{p.category} · {p.color}</small></span><b>{money(p.price)}</b><ArrowRight size={15} /></button>) : <p>We couldn't find a match. Try “sneakers”, “slides” or “boots”.</p>}</div> : <div className="search-suggestions"><span className="search-result-caption">GOOD PLACES TO START</span>{['Everyday sneakers', 'Sandals & slides', 'New arrivals', 'The last pairs'].map((s) => <button key={s} onClick={() => onChoose(s)}>{s}<ArrowUpRight size={14} /></button>)}</div>}</section></div>;
}

function Checkout({ cart, customer, onClose, onPlaceOrder, onTrackOrder, deliverySettings }) {
  const [placed, setPlaced] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const freeThreshold = Number(deliverySettings?.freeDelivery || 2499);
  const shippingFee = total >= freeThreshold ? 0 : Number(deliverySettings?.deliveryFee ?? 99);
  return <div className="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}><section className="checkout-modal" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={onClose} aria-label="Close checkout" disabled={busy}><X size={19} /></button>{placed ? <div className="order-success"><span><Check size={26} /></span><span className="eyebrow">THAT'S A GOOD CHOICE</span><h2>Your order is in.</h2><p>{storeApi.configured ? 'Your order is saved. Here’s the little summary.' : 'We’ve saved your order in this preview. Here’s the little summary.'}</p><b className="checkout-order-number">ORDER · {placedOrder?.id}</b><div className="checkout-success-items">{placedOrder?.cart.map((item) => <span key={`${item.id}-${item.size}`}>{item.name} · Size {item.size} × {item.qty}</span>)}</div><div className="checkout-success-total"><span>Total · Cash on delivery</span><b>{money(placedOrder?.total || 0)}</b></div><button className="button button--dark" onClick={() => onTrackOrder(placedOrder)}>Track my order <ArrowRight size={15} /></button><button className="checkout-back-link" onClick={onClose}>Back to the store</button></div> : <><div className="checkout-header"><span className="eyebrow">ONE LAST LITTLE THING</span><h2>Make it yours.</h2><p>Where should we send your good things?</p></div><form className="checkout-form" onSubmit={async (event) => { event.preventDefault(); setBusy(true); setError(''); const details = Object.fromEntries(new FormData(event.currentTarget).entries()); try { setPlacedOrder(await onPlaceOrder(details)); setPlaced(true); } catch (cause) { setError(cause.message || 'We could not place the order. Please try again.'); } finally { setBusy(false); } }}><div className="checkout-fields"><label>Full name<input name="name" defaultValue={customer?.name || ''} required placeholder="Your name" /></label><label>Mobile number<input name="phone" defaultValue={customer?.phone || ''} required type="tel" pattern="[0-9+ -]{10,15}" placeholder="10-digit mobile number" /></label><label>Email address<input name="email" defaultValue={customer?.email || ''} type="email" required placeholder="you@example.com" /></label><label className="field-full">Delivery address<input name="address" required placeholder="House no., street, area" /></label><label>City<input name="city" required placeholder="City" /></label><label>State<input name="state" required placeholder="State" /></label><label>PIN code<input name="pincode" required inputMode="numeric" pattern="[0-9]{6}" placeholder="6-digit PIN" /></label></div><div className="payment-choice"><span className="checkout-radio"><Check size={11} /></span><span><b>Cash on delivery</b><small>Pay when your order arrives</small></span><span className="cod-label">AVAILABLE</span></div>{error && <p className="auth-error" role="alert">{error}</p>}<div className="checkout-total"><span>Total payable <small>{shippingFee ? `Includes ${money(shippingFee)} delivery` : 'Complimentary delivery'}</small></span><b>{money(total + shippingFee)}</b></div><button className="button button--dark checkout-button" type="submit" disabled={!cart.length || busy}>{busy ? 'Placing your order…' : 'Place my order'} <ArrowRight size={16} /></button><p className="cart-secure"><ShieldCheck size={13} /> {storeApi.configured ? 'Secure checkout · Cash on delivery' : 'Preview checkout · order details stay on this device.'}</p></form></>}</section></div>;
}

export default function App() {
  const [page, setPage] = useState('home');
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('stepon-theme') === 'dark' ? 'dark' : 'light'; } catch { return 'light'; } });
  const [catalog, setCatalog] = useState(() => storeApi.configured ? [] : loadStorefrontProducts());
  const [backendReady, setBackendReady] = useState(!storeApi.configured);
  const [backendError, setBackendError] = useState('');
  const [deliverySettings, setDeliverySettings] = useState(deliverySettingsFromBrowser);
  const storeEmail = deliverySettings?.storeEmail || 'hello@stepon.store';
  const storeName = deliverySettings?.storeName || 'STEPON Footwear';
  const [category, setCategory] = useState('All');
  const [wishlist, setWishlist] = useState(() => readClientState('stepon-wishlist', []));
  const [cart, setCart] = useState(() => readClientState('stepon-cart', []));
  const [orders, setOrders] = useState(() => storeApi.configured ? [] : readClientState('stepon-customer-orders', []));
  const [customer, setCustomer] = useState(() => storeApi.configured ? null : readClientState('stepon-customer', null));
  const [drawer, setDrawer] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [quickProduct, setQuickProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const persistCatalog = (next) => {
    setCatalog(next);
    if (storeApi.configured) return;
    const adminProducts = next.map((product) => ({ id: product.adminId || (typeof product.id === 'number' ? `ST-${String(product.id).padStart(3, '0')}` : product.id), name: product.name, category: product.category, audience: product.audience, price: product.price, compare: product.compare, stock: product.stock, sizes: product.sizes.join(', '), color: product.color, colorHex: product.colorHex, state: product.state || 'Active', image: product.image }));
    try { localStorage.setItem('stepon-admin-products', JSON.stringify(adminProducts)); } catch { /* The preview catalog still works during this visit. */ }
  };

  const goCategory = (next) => { setCategory(next); setPage('shop'); setMobileMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const toggleWishlist = (id) => setWishlist((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const openProduct = (product) => { setSelectedProduct(product); setPage('product'); setQuickProduct(null); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const addToCart = (product, size = product.sizes[Math.floor(product.sizes.length / 2)]) => {
    const available = Number(product.stock ?? 24);
    const found = cart.find((item) => item.id === product.id && item.size === size);
    if (available <= 0 || (found && found.qty >= available)) return;
    setCart((current) => { const found = current.find((item) => item.id === product.id && item.size === size); const available = Number(product.stock ?? 24); if (available <= 0 || (found && found.qty >= available)) return current; return found ? current.map((item) => item === found ? { ...item, qty: item.qty + 1 } : item) : [...current, { ...product, size, qty: 1 }]; });
    setQuickProduct(null); setDrawer(true);
  };
  const buyNow = (product, size) => { const available = Number(product.stock ?? 24); const found = cart.find((item) => item.id === product.id && item.size === size); if (available <= 0 || (found && found.qty >= available)) return; setCart((current) => { const currentItem = current.find((item) => item.id === product.id && item.size === size); return currentItem ? current.map((item) => item === currentItem ? { ...item, qty: item.qty + 1 } : item) : [...current, { ...product, size, qty: 1 }]; }); setQuickProduct(null); setDrawer(false); setCheckoutOpen(true); };
  const changeQuantity = (id, size, delta) => setCart((current) => current.map((item) => { if (item.id !== id || item.size !== size) return item; const maximum = Number(item.stock ?? 24); return { ...item, qty: Math.min(maximum, item.qty + delta) }; }).filter((item) => item.qty > 0));
  const removeFromCart = (id, size) => setCart((current) => current.filter((item) => !(item.id === id && item.size === size)));
  const showPage = (next) => { setPage(next); setMobileMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleCustomerAuth = async ({ mode, name, email, password }) => {
    if (mode === 'reset') return storeApi.sendPasswordReset(email);
    if (mode === 'google') {
      if (storeApi.configured) return storeApi.signInWithGoogle();
      const profile = { name: 'STEPON Guest', email: 'guest@stepon.store', phone: '', role: 'customer' };
      setCustomer(profile); showPage('account'); return { profile };
    }
    if (!storeApi.configured) {
      const profile = { name: name || email.split('@')[0], email, phone: '', role: 'customer' };
      setCustomer(profile); showPage('account'); return { profile };
    }
    if (mode === 'register') {
      try { sessionStorage.setItem('stepon-auth-return', 'account'); } catch { /* Email confirmation can still proceed without this navigation hint. */ }
      const result = await storeApi.signUp({ name, email, password });
      if (!result.session) return { requiresEmailConfirmation: true };
      const profile = await storeApi.getProfile(result.user);
      setCustomer(profile); showPage('account'); return { profile };
    }
    const result = await storeApi.signIn(email, password);
    const profile = await storeApi.getProfile(result.user);
    setCustomer(profile); showPage('account'); return { profile };
  };
  const handleAdminSignIn = async (email, password) => {
    if (!storeApi.configured) return true;
    try { sessionStorage.removeItem('stepon-auth-return'); } catch { /* Admin login remains usable without session storage. */ }
    const result = await storeApi.signIn(email, password);
    const profile = await storeApi.getProfile(result.user);
    if (profile?.role !== 'admin') {
      await storeApi.signOut();
      throw new Error('This account does not have STEPON admin access.');
    }
    setCustomer(profile);
    return true;
  };
  const handleLogout = async () => {
    if (storeApi.configured) await storeApi.signOut();
    setCustomer(null); setOrders([]); showPage('home');
  };
  const completePasswordReset = async (password) => {
    await storeApi.updatePassword(password);
    setPasswordRecovery(false);
  };
  const updateCustomer = async (profile) => {
    if (storeApi.configured) {
      await storeApi.updateProfile({ name: profile.name, phone: profile.phone || customer?.phone || '' });
      const updated = { ...customer, ...profile };
      setCustomer(updated);
      return updated;
    }
    setCustomer(profile);
    return profile;
  };
  const placeOrder = async (details) => {
    if (storeApi.configured) {
      const order = await storeApi.placeCodOrder(details, cart);
      setOrders((current) => [order, ...current.filter((item) => item.id !== order.id)]);
      setCart([]);
      try {
        const latest = await storeApi.listProducts();
        setCatalog(latest || []);
        if (customer) setOrders(await storeApi.listOrders());
      } catch (cause) { setBackendError(`Order placed; refresh the store data: ${cause.message}`); }
      return order;
    }
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const freeThreshold = Number(deliverySettings.freeDelivery || 2499);
    const shippingFee = subtotal >= freeThreshold ? 0 : Number(deliverySettings.deliveryFee ?? 99);
    const order = { id: `#STP-${Date.now().toString().slice(-6)}`, customer: details.name, email: details.email, phone: details.phone, address: details.address, city: details.city, state: details.state, pincode: details.pincode, date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }), cart: cart.map((item) => ({ ...item })), subtotal, shippingFee, total: subtotal + shippingFee, status: 'Confirmed' };
    setOrders((current) => [order, ...current]);
    try {
      localStorage.setItem('stepon-customer-orders', JSON.stringify([order, ...readClientState('stepon-customer-orders', [])]));
      const adminOrder = { ...order, items: order.cart.map((item) => `${item.name} · Size ${item.size} × ${item.qty}`).join(', '), initials: details.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(), tone: 'sand' };
      localStorage.setItem('stepon-admin-orders', JSON.stringify([adminOrder, ...readClientState('stepon-admin-orders', [])]));
      window.dispatchEvent(new Event('stepon:orders-updated'));
    } catch { /* The preview order remains visible in this visit if storage is unavailable. */ }
    const stockUpdates = cart.reduce((updates, item) => updates.set(item.id, (updates.get(item.id) || 0) + item.qty), new Map());
    persistCatalog(catalog.map((product) => stockUpdates.has(product.id) ? { ...product, stock: Math.max(0, Number(product.stock ?? 24) - stockUpdates.get(product.id)) } : product));
    setCart([]);
    return order;
  };
  const trackOrder = (order) => { if (!order) return; setSelectedOrder(order); setCheckoutOpen(false); setPage('order-detail'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const searchChoose = (choice) => { setSearchOpen(false); if (typeof choice === 'string') goCategory(choice.includes('sneakers') ? 'Sneakers' : choice.includes('slides') ? 'Slides' : choice.includes('arrivals') ? 'New' : choice.includes('pairs') ? 'Sale' : 'All'); else setQuickProduct(choice); };

  const refreshBackend = async () => {
    if (!storeApi.configured) return;
    setBackendReady(false); setBackendError('');
    try {
      const [products, settings] = await Promise.all([storeApi.listProducts(), storeApi.getSettings()]);
      setCatalog(products || []); setDeliverySettings(settings || { freeDelivery: '2499', deliveryFee: 99, returnWindow: '7 days' });
    } catch (cause) { setBackendError(cause.message || 'Could not connect to the store database.'); }
    finally { setBackendReady(true); }
  };

  useEffect(() => { if (storeApi.configured) refreshBackend(); }, []);
  useEffect(() => {
    const syncSettings = async () => { if (!storeApi.configured) { setDeliverySettings(deliverySettingsFromBrowser()); return; } try { setDeliverySettings(await storeApi.getSettings()); } catch (cause) { setBackendError(cause.message); } };
    window.addEventListener('stepon:settings-updated', syncSettings);
    return () => window.removeEventListener('stepon:settings-updated', syncSettings);
  }, []);
  useEffect(() => {
    if (!storeApi.configured) return undefined;
    let active = true;
    const hydrate = async (session, event) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true);
        try { sessionStorage.setItem('stepon-auth-return', 'account'); } catch { /* The account page can still be opened after password reset. */ }
      }
      if (!session?.user) { setCustomer(null); setOrders([]); return; }
      try {
        const profile = await storeApi.getProfile(session.user);
        if (!active) return;
        setCustomer(profile);
        try {
          if (sessionStorage.getItem('stepon-auth-return') === 'account') { sessionStorage.removeItem('stepon-auth-return'); showPage('account'); }
        } catch { /* The restored account remains usable from the header. */ }
        const userOrders = await storeApi.listOrders();
        if (active) setOrders(userOrders || []);
      } catch (cause) { if (active) setBackendError(cause.message || 'Could not load your account.'); }
    };
    storeApi.getSession().then(hydrate).catch((cause) => active && setBackendError(cause.message));
    const unsubscribe = storeApi.onAuthChange((session, event) => { window.setTimeout(() => hydrate(session, event), 0); });
    return () => { active = false; unsubscribe(); };
  }, []);

  useEffect(() => { document.body.classList.toggle('no-scroll', drawer || searchOpen || !!quickProduct || checkoutOpen); return () => document.body.classList.remove('no-scroll'); }, [drawer, searchOpen, quickProduct, checkoutOpen]);
  useEffect(() => { const key = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true); } }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#121511' : '#f7f5ef');
    try { localStorage.setItem('stepon-theme', theme); } catch { /* Theme still works for this visit. */ }
  }, [theme]);
  useEffect(() => { const displayName = String(storeName).replace(/\s+Footwear$/i, '').trim() || 'STEPON'; document.title = `${displayName} · Good shoes, good days`; }, [storeName]);
  useEffect(() => { try { localStorage.setItem('stepon-wishlist', JSON.stringify(wishlist)); } catch { /* Wishlist still works during this visit. */ } }, [wishlist]);
  useEffect(() => { try { localStorage.setItem('stepon-cart', JSON.stringify(cart)); } catch { /* Bag still works during this visit. */ } }, [cart]);
  useEffect(() => { if (storeApi.configured) return; try { localStorage.setItem('stepon-customer-orders', JSON.stringify(orders)); } catch { /* Orders still work during this visit. */ } }, [orders]);
  useEffect(() => { if (storeApi.configured) return; try { if (customer) localStorage.setItem('stepon-customer', JSON.stringify(customer)); else localStorage.removeItem('stepon-customer'); } catch { /* Account still works during this visit. */ } }, [customer]);
  useEffect(() => {
    const syncCatalog = async () => {
      if (!storeApi.configured) { setCatalog(loadStorefrontProducts()); return; }
      try { setCatalog(await storeApi.listProducts() || []); } catch (cause) { setBackendError(cause.message); }
    };
    const syncOrders = async () => {
      if (!storeApi.configured) {
        const savedOrders = readClientState('stepon-customer-orders', []); setOrders(savedOrders);
        setSelectedOrder((current) => current ? savedOrders.find((order) => order.id === current.id) || current : current); return;
      }
      if (customer) {
        try {
          const freshOrders = await storeApi.listOrders() || [];
          setOrders(freshOrders);
          setSelectedOrder((current) => current ? freshOrders.find((order) => order.id === current.id) || current : current);
        } catch (cause) { setBackendError(cause.message); }
      }
    };
    const refreshOnFocus = async () => {
      if (!storeApi.configured) return;
      try { const [freshProducts, freshSettings] = await Promise.all([storeApi.listProducts(), storeApi.getSettings()]); setCatalog(freshProducts || []); setDeliverySettings(freshSettings); }
      catch (cause) { setBackendError(cause.message || 'Could not refresh the store.'); }
    };
    window.addEventListener('stepon:products-updated', syncCatalog);
    window.addEventListener('stepon:orders-updated', syncOrders);
    window.addEventListener('focus', refreshOnFocus);
    return () => { window.removeEventListener('stepon:products-updated', syncCatalog); window.removeEventListener('stepon:orders-updated', syncOrders); window.removeEventListener('focus', refreshOnFocus); };
  }, [customer]);
  useEffect(() => {
    const targets = document.querySelectorAll('.benefit-strip, .section, .stats-band, .story-banner, .newsletter-section, .site-footer, .shop-heading, .shop-toolbar, .shop-layout, .saved-heading, .saved-page > .product-grid, .auth-page, .product-detail-reviews, .product-related, .customer-account-page, .order-tracking-card');
    if (!('IntersectionObserver' in window)) { targets.forEach((target) => target.classList.add('is-revealed')); return; }
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); observer.unobserve(entry.target); } }), { threshold: 0.08, rootMargin: '0px 0px -36px 0px' });
    targets.forEach((target) => { target.classList.add('scroll-reveal'); observer.observe(target); });
    return () => observer.disconnect();
  }, [page]);

  if (passwordRecovery) return <PasswordRecovery onComplete={completePasswordReset} />;
  if (storeApi.configured && !backendReady) return <div className="store-connect-state"><span className="auth-mark">s<span>.</span></span><p>Getting the STEPON store ready…</p></div>;
  if (storeApi.configured && backendError && !catalog.length) return <div className="store-connect-state"><span className="auth-mark">s<span>.</span></span><h1>One moment.</h1><p>The store database could not be reached: {backendError}</p><button className="button button--dark" onClick={refreshBackend}>Try again <ArrowRight size={15} /></button></div>;
  if (page === 'admin') return <Suspense fallback={<div className="store-connect-state"><span className="auth-mark">s<span>.</span></span><p>Opening the STEPON workspace…</p></div>}><AdminPanel onBack={() => showPage('home')} theme={theme} onToggleTheme={() => setTheme((current) => current === 'light' ? 'dark' : 'light')} configured={storeApi.configured} storeName={storeName} adminUser={customer?.role === 'admin' ? customer : null} onAdminSignIn={handleAdminSignIn} onAdminSignOut={handleLogout} onResetPassword={storeApi.sendPasswordReset} /></Suspense>;

  return <div className="app-shell"><Header page={page} setPage={showPage} cartCount={cartCount} wishlistCount={wishlist.length} openCart={() => setDrawer(true)} openSearch={() => setSearchOpen(true)} onCategory={goCategory} mobileMenu={mobileMenu} setMobileMenu={setMobileMenu} theme={theme} onToggleTheme={() => setTheme((current) => current === 'light' ? 'dark' : 'light')} customer={customer} deliverySettings={deliverySettings} storeName={storeName} />
    {page === 'home' && <Home products={catalog} onCategory={goCategory} wishlist={wishlist} onWishlist={toggleWishlist} onQuickView={setQuickProduct} onProduct={openProduct} setPage={showPage} storeEmail={storeEmail} storeName={storeName} configured={storeApi.configured} deliverySettings={deliverySettings} />}
    {page === 'shop' && <Shop products={catalog} category={category} setCategory={setCategory} wishlist={wishlist} onWishlist={toggleWishlist} onQuickView={setQuickProduct} onProduct={openProduct} onSearch={() => setSearchOpen(true)} setPage={showPage} storeEmail={storeEmail} storeName={storeName} />}
    {page === 'product' && selectedProduct && <ProductDetails key={selectedProduct.id} products={catalog} product={catalog.find((item) => item.id === selectedProduct.id) || selectedProduct} wishlist={wishlist} onWishlist={toggleWishlist} onProduct={openProduct} onQuickView={setQuickProduct} onAdd={addToCart} onBuyNow={buyNow} onBack={() => showPage('shop')} configured={storeApi.configured} deliverySettings={deliverySettings} />}
    {page === 'login' && <Login setPage={showPage} onSignIn={handleCustomerAuth} configured={storeApi.configured} googleEnabled={googleAuthEnabled && storeApi.configured} />}
    {page === 'account' && customer && <CustomerAccount customer={customer} orders={orders} wishlist={wishlist} setPage={showPage} onLogout={handleLogout} onTrackOrder={trackOrder} onUpdateCustomer={updateCustomer} configured={storeApi.configured} storeEmail={storeEmail} storeName={storeName} />}
    {page === 'order-detail' && selectedOrder && <OrderTracking order={selectedOrder} onBack={() => showPage(customer ? 'account' : 'home')} onCategory={goCategory} onSetPage={showPage} storeEmail={storeEmail} storeName={storeName} />}
    {page === 'guest-track' && <GuestOrderLookup onBack={() => showPage('home')} onTrackOrder={trackOrder} onCategory={goCategory} onSetPage={showPage} storeEmail={storeEmail} storeName={storeName} />}
    {page === 'saved' && <SavedPage products={catalog} wishlist={wishlist} onWishlist={toggleWishlist} onQuickView={setQuickProduct} onProduct={openProduct} onAdd={addToCart} setPage={showPage} storeEmail={storeEmail} storeName={storeName} />}
    {drawer && <CartDrawer cart={cart} onClose={() => setDrawer(false)} onChange={changeQuantity} onRemove={removeFromCart} onCheckout={() => { setDrawer(false); setCheckoutOpen(true); }} deliverySettings={deliverySettings} />}
    {searchOpen && <SearchPanel products={catalog} onClose={() => setSearchOpen(false)} onChoose={searchChoose} />}
    {quickProduct && <QuickView product={quickProduct} onClose={() => setQuickProduct(null)} onAdd={addToCart} onProduct={openProduct} deliverySettings={deliverySettings} />}
    {checkoutOpen && <Checkout cart={cart} customer={customer} onClose={() => setCheckoutOpen(false)} onPlaceOrder={placeOrder} onTrackOrder={trackOrder} deliverySettings={deliverySettings} />}
  </div>;
}
