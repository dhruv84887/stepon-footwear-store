import { useEffect, useState } from 'react';
import { storeApi } from './lib/storeApi.js';
import { resolveAsset } from './lib/assets.js';
import {
  ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Bell, Check, ChevronDown,
  CircleHelp, ClipboardList, CreditCard, LayoutDashboard, Menu, Moon, MoreHorizontal,
  Package, Plus, Search, Settings, ShieldCheck, ShoppingBag, Sun,
  Sparkles, TrendingUp, Truck, Users, X,
} from 'lucide-react';

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const productImage = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=240&q=80`;

const seedProducts = [
  { id: 'ST-001', name: 'The Everyday Runner', category: 'Sneakers', audience: 'Men', price: 2490, compare: 3290, stock: 34, sizes: '6, 7, 8, 9, 10', color: 'Black / Amber', colorHex: '#c78219', state: 'Active', image: '/images/step-on-hero.webp' },
  { id: 'ST-002', name: 'Sunday Leather Slide', category: 'Slides', audience: 'Women', price: 1890, stock: 12, sizes: '5, 6, 7, 8, 9', color: 'Cognac', colorHex: '#9d603f', state: 'Active', image: productImage('photo-1603487742131-4160ec999306') },
  { id: 'ST-003', name: 'City Pace 02', category: 'Sneakers', audience: 'Women', price: 2790, compare: 3490, stock: 4, sizes: '5, 6, 7, 8', color: 'Cloud / Rose', colorHex: '#d9a1a0', state: 'Active', image: productImage('photo-1552346154-21d32810aba3') },
  { id: 'ST-004', name: 'The Weekender Boot', category: 'Boots', audience: 'Men', price: 3590, compare: 4290, stock: 0, sizes: '7, 8, 9, 10', color: 'Deep Brown', colorHex: '#594333', state: 'Draft', image: productImage('photo-1520639888713-7851133b1ed0') },
  { id: 'ST-005', name: 'Form & Function', category: 'Sneakers', audience: 'Men', price: 2990, stock: 21, sizes: '6, 7, 8, 9, 10, 11', color: 'Chalk', colorHex: '#ddd9cf', state: 'Active', image: productImage('photo-1495555961986-6d4c1ecb7be3') },
  { id: 'ST-006', name: 'Daylight Sandal', category: 'Sandals', audience: 'Women', price: 2190, compare: 2690, stock: 8, sizes: '5, 6, 7, 8', color: 'Sienna', colorHex: '#a86f4f', state: 'Active', image: productImage('photo-1543163521-1bf539c55dd2') },
  { id: 'ST-007', name: 'Off-Duty High Top', category: 'Sneakers', audience: 'Unisex', price: 3190, stock: 9, sizes: '6, 7, 8, 9, 10', color: 'Black / Ecru', colorHex: '#363633', state: 'Active', image: productImage('photo-1608231387042-66d1773070a5') },
  { id: 'ST-008', name: 'Easy Does It Mule', category: 'Slides', audience: 'Women', price: 1690, stock: 15, sizes: '5, 6, 7, 8', color: 'Soft Olive', colorHex: '#96977b', state: 'Active', image: productImage('photo-1600185365483-26d7a4cc7519') },
];

const seedOrders = [
  { id: '#STP-1048', customer: 'Aarav Mehta', email: 'aarav.m@example.com', date: 'Today, 10:42 am', items: 'The Everyday Runner · Size 9', total: 2490, status: 'Confirmed', initials: 'AM', tone: 'sand' },
  { id: '#STP-1047', customer: 'Diya Shah', email: 'diya.s@example.com', date: 'Today, 9:18 am', items: 'City Pace 02 · Size 7', total: 2790, status: 'Packed', initials: 'DS', tone: 'rose' },
  { id: '#STP-1046', customer: 'Kabir Patel', email: 'kabir.p@example.com', date: 'Yesterday, 6:34 pm', items: 'Sunday Leather Slide · Size 8', total: 1890, status: 'Shipped', initials: 'KP', tone: 'blue' },
  { id: '#STP-1045', customer: 'Mira Nair', email: 'mira.n@example.com', date: 'Yesterday, 2:06 pm', items: 'The Weekender Boot · Size 7', total: 3590, status: 'Delivered', initials: 'MN', tone: 'green' },
  { id: '#STP-1044', customer: 'Rohan Desai', email: 'rohan.d@example.com', date: '18 Oct, 11:21 am', items: 'Form & Function · Size 10', total: 2990, status: 'Confirmed', initials: 'RD', tone: 'lavender' },
  { id: '#STP-1043', customer: 'Anaya Rao', email: 'anaya.r@example.com', date: '17 Oct, 4:50 pm', items: 'Daylight Sandal · Size 6', total: 2190, status: 'Delivered', initials: 'AR', tone: 'peach' },
];

const readSaved = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch { return fallback; }
};

const sections = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ClipboardList, count: '04' },
  { id: 'customers', label: 'Customers', icon: Users },
];

function AdminLogin({ onEnter, onBack, theme, onToggleTheme, configured = false, onResetPassword, storeName = 'STEPON Footwear' }) {
  const displayName = String(storeName).replace(/\s+Footwear$/i, '').trim() || 'STEPON';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setError(''); setNotice(''); setBusy(true);
    try { await onEnter(email, password); }
    catch (cause) { setError(cause.message || 'Could not sign in. Please check your details.'); }
    finally { setBusy(false); }
  };
  return <main className="admin-login-page">
    <button className="admin-login-back" onClick={onBack}><ArrowLeft size={16} /> Back to {displayName}</button>
    <div className="admin-login-layout">
      <section className="admin-login-story"><div className="admin-brand-lockup"><span className="admin-brand-mark">{displayName[0].toLowerCase()}.</span><span>{displayName}<small>STORE STUDIO</small></span></div><div className="admin-login-art"><span className="admin-art-orbit admin-art-orbit--one" /><span className="admin-art-orbit admin-art-orbit--two" /><div className="admin-art-shoe"><img src={productImage('photo-1542291026-7eec264c27ff')} alt={`Featured ${displayName} sneaker`} /></div><span className="admin-art-tag">GOOD SHOES, GOOD DAYS <Sparkles size={14} /></span></div><div className="admin-login-story-copy"><span className="eyebrow">A LITTLE ROOM TO RUN THINGS</span><h1>Your store,<br /><em>in good hands.</em></h1><p>Keep an eye on orders, products and the everyday details that keep {displayName} moving.</p></div><div className="admin-login-story-foot"><span>01 / STORE STUDIO</span><span>MADE FOR THE LONG WAY HOME</span></div></section>
      <section className="admin-login-form-panel"><button className="admin-login-theme-toggle" onClick={onToggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>{theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}<span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span></button><div className="admin-login-form"><span className="admin-login-icon"><ShieldCheck size={22} /></span><span className="eyebrow">{displayName.toUpperCase()} STORE STUDIO</span><h2>Welcome in.</h2><p>Sign in with your store administrator account.</p><form onSubmit={submit}><label>Email address<input type="email" placeholder="you@stepon.store" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Password<input type="password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength="6" /></label>{error && <p className="auth-error" role="alert">{error}</p>}{notice && <p className="auth-message" role="status">{notice}</p>}<div className="admin-login-forgot"><span><span className="admin-check-square"><Check size={10} /></span> Remember me</span><button type="button" onClick={async () => { setError(''); setNotice(''); if (!email) { setError('Enter your email address first.'); return; } try { if (configured) await onResetPassword?.(email); setNotice(configured ? 'If an account exists for that email, a reset link is on its way.' : 'For preview mode, no password reset is needed.'); } catch (cause) { setError(cause.message || 'Could not send a reset email.'); } }}>Forgot password?</button></div><button className="admin-primary-button admin-login-submit" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Open the dashboard'} <ArrowRight size={16} /></button></form><div className="admin-demo-note"><Sparkles size={15} /><span><b>{configured ? 'Secure store access' : 'Preview mode'}</b><small>{configured ? `Only an account with the ${displayName} admin role can open this dashboard.` : 'This local preview accepts a demo sign-in. Add Supabase credentials to enable protected admin access.'}</small></span></div><button className="admin-back-store-link" onClick={onBack}>Back to the storefront <ArrowUpRight size={14} /></button></div><span className="admin-login-copyright">© 2026 {displayName} · A GOOD THING, WELL RUN.</span></section>
    </div>
  </main>;
}

function StatCard({ label, value, note, icon: Icon, trend, tone = 'amber' }) {
  return <article className="admin-stat-card"><div className="admin-stat-top"><span>{label}</span><span className={`admin-stat-icon admin-stat-icon--${tone}`}><Icon size={18} strokeWidth={1.8} /></span></div><div className="admin-stat-value">{value}</div><div className="admin-stat-note"><span className="admin-trend"><TrendingUp size={13} /> {trend}</span><span>{note}</span></div></article>;
}

function AdminTopbar({ title, subtitle, setMobileNav, onLogout, onSearch, onNotifications, theme, onToggleTheme }) {
  const dateLabel = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date()).toUpperCase();
  return <header className="admin-topbar"><div className="admin-topbar-title"><button className="admin-mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open dashboard menu"><Menu size={20} /></button><div><span className="eyebrow">{dateLabel} <i>·</i> GOOD DAY TO MAKE A GOOD DAY</span><h1>{title}</h1><p>{subtitle}</p></div></div><div className="admin-top-actions"><button className="admin-top-icon admin-search-button" aria-label="Search products" onClick={onSearch}><Search size={18} /></button><button className="admin-top-icon admin-theme-toggle" onClick={onToggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>{theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}</button><button className="admin-top-icon admin-notification-button" aria-label="Notifications" onClick={onNotifications}><Bell size={18} /><i /></button><span className="admin-top-divider" /><button className="admin-profile" onClick={onLogout}><span className="admin-avatar">S</span><span><b>Store owner</b><small>Administrator</small></span><ChevronDown size={14} /></button></div></header>;
}

function revenueBuckets(orders, period) {
  const now = new Date();
  const year = now.getFullYear();
  let buckets;
  if (period === 'This year') {
    buckets = Array.from({ length: 12 }, (_, month) => ({
      label: new Date(year, month, 1).toLocaleDateString('en-IN', { month: 'short' }),
      start: new Date(year, month, 1),
      end: new Date(year, month + 1, 1),
    }));
  } else {
    const step = period === 'Last 7 days' ? 1 : 3;
    const count = period === 'Last 7 days' ? 7 : 10;
    const totalDays = step * count;
    buckets = Array.from({ length: count }, (_, index) => {
      const start = new Date(year, now.getMonth(), now.getDate() - totalDays + 1 + index * step);
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + step);
      return {
        label: start.toLocaleDateString('en-IN', { day: 'numeric', ...(step > 1 ? { month: 'short' } : {}) }),
        dateLabel: start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        start,
        end,
      };
    });
  }
  const values = buckets.map(() => 0);
  orders.filter((order) => order.status !== 'Cancelled').forEach((order) => {
    const date = new Date(order.createdAt);
    if (!Number.isFinite(date.getTime())) return;
    const index = buckets.findIndex((bucket) => date >= bucket.start && date < bucket.end);
    if (index >= 0) values[index] += Number(order.total || 0);
  });
  return { labels: buckets.map((bucket) => bucket.label), dates: buckets.map((bucket) => bucket.dateLabel || bucket.label), values };
}

function RevenueChart({ orders, period, configured = false }) {
  const demoValues = [39, 54, 48, 70, 58, 84, 64, 53, 91, 74, 63, 86];
  const demoLabels = ['01', '03', '05', '07', '09', '11', '13', '15', '17', '19', '21', '23'];
  const live = configured ? revenueBuckets(orders, period) : null;
  const values = live?.values || demoValues;
  const labels = live?.labels || demoLabels;
  const peakValue = Math.max(...values, 0);
  const peakIndex = values.indexOf(peakValue);
  const axisMax = configured ? (peakValue ? Math.ceil(peakValue / 1000) * 1000 : 3000) : 30000;
  const axisLabels = [axisMax, axisMax * 2 / 3, axisMax / 3, 0];
  const shortMoney = (value) => value >= 1000 ? `₹${Number((value / 1000).toFixed(1)).toLocaleString('en-IN')}k` : `₹${Math.round(value)}`;
  const heightFor = (value) => configured ? (axisMax ? `${value / axisMax * 100}%` : '0%') : `${value}%`;
  const peakDate = live?.dates[peakIndex] || 'Oct 17';
  const peakLabel = configured ? money(peakValue) : '₹24,680';
  return <div className="admin-chart-wrap"><div className="admin-chart-ylabels">{axisLabels.map((value, index) => <span key={index}>{configured ? shortMoney(value) : ['₹30k', '₹20k', '₹10k', '₹0'][index]}</span>)}</div><div className="admin-chart-main"><div className="admin-chart-grid"><i /><i /><i /><i /></div><div className="admin-chart-bars" style={{ gridTemplateColumns: `repeat(${values.length},minmax(0,1fr))` }}>{values.map((value, index) => <div className="admin-chart-column" key={`${labels[index]}-${index}`}><div className={`admin-chart-bar ${value > 0 && index === peakIndex ? 'is-highlighted' : ''} ${configured && value === 0 ? 'is-zero' : ''}`} style={{ height: heightFor(value) }} /><span>{labels[index]}</span></div>)}</div>{peakValue > 0 && <div className="admin-chart-tooltip" style={{ left: `${Math.min(Math.max(((peakIndex + 0.5) / values.length) * 100, 8), 78)}%` }}><b>{peakLabel}</b><small>{peakDate}</small></div>}{configured && peakValue === 0 && <div className="admin-chart-empty">No orders in this period.</div>}</div></div>;
}

function OrderRows({ orders, onStatusChange, compact = false }) {
  const nextStatuses = { Pending: ['Pending', 'Confirmed', 'Cancelled'], Confirmed: ['Confirmed', 'Packed', 'Cancelled'], Packed: ['Packed', 'Shipped', 'Cancelled'], Shipped: ['Shipped', 'Delivered'], Delivered: ['Delivered'], Cancelled: ['Cancelled'] };
  const rows = compact ? orders.slice(0, 4) : orders;
  return <div className="admin-table-scroller"><table className="admin-table"><thead><tr><th>ORDER</th><th>CUSTOMER</th>{!compact && <th>ITEMS</th>}<th>DATE</th><th>AMOUNT</th><th>STATUS</th>{!compact && <th />}</tr></thead><tbody>{rows.map((order) => <tr key={order.id}><td><b className="admin-order-id">{order.id}</b></td><td><span className="admin-customer-cell"><span className={`admin-customer-avatar tone-${order.tone}`}>{order.initials}</span><span><b>{order.customer}</b><small>{order.email}</small></span></span></td>{!compact && <td className="admin-order-item">{order.items}</td>}<td className="admin-table-date">{order.date}</td><td><b>{money(order.total)}</b></td><td><select className={`admin-status-select status-${order.status.toLowerCase()}`} value={order.status} onChange={(event) => onStatusChange(order.id, event.target.value)} aria-label={`Update ${order.id} status`}>{(nextStatuses[order.status] || [order.status]).map((status) => <option key={status}>{status}</option>)}</select></td>{!compact && <td><button className="admin-row-more" aria-label={`More options for ${order.id}`}><MoreHorizontal size={18} /></button></td>}</tr>)}</tbody></table></div>;
}

function Overview({ products, orders, setSection, onStatusChange, configured = false, storeName = 'STEPON Footwear' }) {
  const displayName = String(storeName).replace(/\s+Footwear$/i, '').trim() || 'STEPON';
  const [period, setPeriod] = useState('Last 30 days');
  const activeCount = products.filter((product) => product.state === 'Active').length;
  const activeOrders = orders.filter((order) => order.status !== 'Cancelled');
  const sales = activeOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const customerCount = new Set(activeOrders.map((order) => order.email).filter(Boolean)).size;
  const displaySales = configured ? money(sales) : '₹1,84,290';
  const displayOrders = configured ? String(orders.length) : '128';
  const displayCustomers = configured ? String(customerCount) : '89';
  const productSales = new Map();
  activeOrders.forEach((order) => (order.cart || []).forEach((item) => {
    const id = String(item.id ?? item.adminId ?? item.sku ?? '');
    if (id) productSales.set(id, (productSales.get(id) || 0) + Number(item.qty || 0));
  }));
  const popularProducts = configured
    ? [...products].sort((a, b) => (productSales.get(String(b.id)) || 0) - (productSales.get(String(a.id)) || 0) || Number(b.popularity || 0) - Number(a.popularity || 0)).slice(0, 4)
    : products.slice(0, 4);
  const now = new Date();
  const weekday = now.toLocaleDateString('en-IN', { weekday: 'long' }).toUpperCase();
  const month = now.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
  const day = now.toLocaleDateString('en-IN', { day: '2-digit' });
  const shortWeekday = now.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase();
  return <div className="admin-overview admin-enter">
    <div className="admin-welcome-band"><div><span className="admin-welcome-tag"><Sparkles size={13} /> YOUR {weekday} STORE NOTE</span><h2>Looking good, {displayName}<span>.</span></h2><p>Here’s what’s happening across the store.</p></div><div className="admin-welcome-art"><img src={productImage('photo-1600185365483-26d7a4cc7519')} alt={`Sneaker from the ${displayName} collection`} /><span>THE EVERYDAY EDIT <ArrowUpRight size={13} /></span></div><div className="admin-welcome-date">{month}<br /><b>{day}</b><br />{shortWeekday}</div></div>
    <div className="admin-stats-grid"><StatCard label="Order value" value={displaySales} note={configured ? 'From active orders' : 'Demo store total'} trend={configured ? `${orders.length} orders` : '12.8%'} icon={CreditCard} /><StatCard label="Orders" value={displayOrders} note={configured ? 'Across the store' : 'Demo store count'} trend={configured ? 'Current total' : '8.4%'} icon={ShoppingBag} tone="blue" /><StatCard label="Products" value={products.length.toString().padStart(2, '0')} note={`${activeCount} pairs currently live`} trend="In your shop" icon={Package} tone="green" /><StatCard label="Customers" value={displayCustomers} note={configured ? 'With at least one order' : 'Demo store count'} trend={configured ? 'Current total' : '6.2%'} icon={Users} tone="rose" /></div>
    <div className="admin-overview-grid">
      <section className="admin-panel admin-revenue-panel"><div className="admin-panel-head"><div><span className="eyebrow">ORDER ACTIVITY</span><h3>Order value</h3></div><label className="admin-period-select"><select value={period} onChange={(event) => setPeriod(event.target.value)}><option>Last 30 days</option><option>Last 7 days</option><option>This year</option></select><ChevronDown size={13} /></label></div><div className="admin-revenue-total"><b>{displaySales}</b><span><TrendingUp size={13} /> {configured ? `${orders.length} orders` : '12.8%'}</span><small>{configured ? 'all-time active order value' : 'demo store total'}</small></div><RevenueChart orders={orders} period={period} configured={configured} /><div className="admin-chart-legend"><span><i /> {configured ? 'COD order value' : 'Demo data'}</span></div></section>
      <section className="admin-panel admin-products-panel"><div className="admin-panel-head"><div><span className="eyebrow">THE PAIRS GETTING NOTICED</span><h3>Popular products</h3></div><button className="admin-inline-link" onClick={() => setSection('products')}>View all <ArrowRight size={14} /></button></div><div className="admin-popular-list">{popularProducts.map((product, index) => <div className="admin-popular-item" key={product.id}><span className="admin-popular-rank">0{index + 1}</span><img src={resolveAsset(product.image)} alt="" /><span className="admin-popular-info"><b>{product.name}</b><small>{product.category} · {product.stock} in stock</small></span><span className="admin-popular-sales">{configured ? productSales.get(String(product.id)) || 0 : [42, 36, 29, 18][index]}<small>sold</small></span></div>)}{popularProducts.length === 0 && <p className="admin-chart-empty">Add products to see the collection here.</p>}</div><button className="admin-soft-button" onClick={() => setSection('products')}>Manage your collection <ArrowRight size={14} /></button></section>
    </div>
    <section className="admin-panel admin-recent-orders"><div className="admin-panel-head"><div><span className="eyebrow">A FEW GOOD THINGS ON THE MOVE</span><h3>Recent orders</h3></div><button className="admin-inline-link" onClick={() => setSection('orders')}>All orders <ArrowRight size={14} /></button></div><OrderRows orders={orders} onStatusChange={onStatusChange} compact /></section>
  </div>;
}

function ProductModal({ product, onClose, onSave, configured = false, saving = false }) {
  const [form, setForm] = useState(product || { name: '', category: 'Sneakers', audience: 'Unisex', price: '', compare: '', stock: '', sizes: '6, 7, 8, 9, 10', color: 'Black', colorHex: '#343832', state: 'Active', image: productImage('photo-1542291026-7eec264c27ff') });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  return <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="admin-product-modal admin-enter"><div className="admin-modal-head"><div><span className="eyebrow">{product ? 'A LITTLE PRODUCT REFRESH' : 'ADD SOMETHING GOOD'}</span><h2>{product ? 'Edit product' : 'New product'}</h2></div><button className="admin-top-icon" onClick={onClose} aria-label="Close dialog"><X size={19} /></button></div><form onSubmit={(event) => { event.preventDefault(); onSave({ ...form, price: Number(form.price), compare: Number(form.compare || 0), stock: Number(form.stock), audience: form.audience || 'Unisex' }); }}><label className="admin-field admin-field-wide">Product name<input autoFocus value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. The Everyday Runner" required /></label><label className="admin-field admin-field-wide">Description<textarea value={form.description || ''} onChange={(event) => update('description', event.target.value)} placeholder="What makes this pair feel special?" rows="3" /></label><div className="admin-field-grid"><label className="admin-field">Category<select value={form.category} onChange={(event) => update('category', event.target.value)}>{['Sneakers', 'Boots', 'Slides', 'Sandals', 'Shoes'].map((category) => <option key={category}>{category}</option>)}</select><ChevronDown size={14} /></label><label className="admin-field">Audience<select value={form.audience || 'Unisex'} onChange={(event) => update('audience', event.target.value)}>{['Men', 'Women', 'Unisex'].map((audience) => <option key={audience}>{audience}</option>)}</select><ChevronDown size={14} /></label><label className="admin-field">Status<select value={form.state} onChange={(event) => update('state', event.target.value)}><option>Active</option><option>Draft</option></select><ChevronDown size={14} /></label><label className="admin-field">Price<input type="number" min="0" value={form.price} onChange={(event) => update('price', event.target.value)} placeholder="2490" required /></label><label className="admin-field">Compare at<input type="number" min="0" value={form.compare || ''} onChange={(event) => update('compare', event.target.value)} placeholder="Optional" /></label><label className="admin-field">Stock on hand<input type="number" min="0" value={form.stock} onChange={(event) => update('stock', event.target.value)} placeholder="25" required /></label><label className="admin-field">Color name<input value={form.color || ''} onChange={(event) => update('color', event.target.value)} placeholder="Black / Amber" /></label><label className="admin-field">Color swatch<input type="color" value={form.colorHex || '#343832'} onChange={(event) => update('colorHex', event.target.value)} /></label></div><label className="admin-field admin-field-wide">Available sizes<input value={form.sizes} onChange={(event) => update('sizes', event.target.value)} placeholder="6, 7, 8, 9, 10" /></label><label className="admin-field admin-field-wide">Product image URL<input value={form.image} onChange={(event) => update('image', event.target.value)} placeholder="https://..." /></label>{configured && <label className="admin-field admin-field-wide">Or upload an image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; setUploadError(''); setUploading(true); try { update('image', await storeApi.uploadProductImage(file)); } catch (cause) { setUploadError(cause.message || 'Image upload failed.'); } finally { setUploading(false); event.target.value = ''; } }} />{uploading && <small>Uploading image…</small>}{uploadError && <small className="auth-error">{uploadError}</small>}</label>}<div className="admin-modal-actions"><button className="admin-quiet-button" type="button" onClick={onClose}>Cancel</button><button className="admin-primary-button" type="submit" disabled={saving || uploading}>{saving ? 'Saving…' : uploading ? 'Uploading…' : product ? 'Save changes' : 'Add product'} <ArrowRight size={15} /></button></div></form></section></div>;
}

function DeleteProductDialog({ product, onCancel, onConfirm, configured = false }) {
  return <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}><section className="admin-product-modal admin-confirm-delete" role="dialog" aria-modal="true" aria-labelledby="delete-product-title"><span className="admin-confirm-icon"><Package size={19} /></span><span className="eyebrow">A SMALL COLLECTION TIDY-UP</span><h2 id="delete-product-title">Remove this pair?</h2><p><b>{product.name}</b> will be removed from {configured ? 'your store' : 'this browser preview'} and the storefront catalog.</p><div className="admin-modal-actions"><button className="admin-quiet-button" onClick={onCancel}>Keep product</button><button className="admin-danger-button" onClick={onConfirm}>Remove product <ArrowRight size={14} /></button></div></section></div>;
}

function ProductsPage({ products, onAdd, onEdit, onDelete, configured = false }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All products');
  const visible = products.filter((product) => `${product.name} ${product.category} ${product.id}`.toLowerCase().includes(query.toLowerCase()) && (filter === 'All products' || filter === product.state || (filter === 'Low stock' && product.stock > 0 && product.stock < 6) || (filter === 'Out of stock' && product.stock === 0)));
  return <div className="admin-page-content admin-enter"><div className="admin-page-intro"><div><span className="eyebrow">A WELL-KEPT COLLECTION</span><h2>Products<span>.</span></h2><p>A good pair for every kind of day. Keep your collection in shape here.</p></div><button className="admin-primary-button" onClick={onAdd}><Plus size={17} /> Add product</button></div><div className="admin-product-kpis"><div><span>ALL PAIRS</span><b>{products.length.toString().padStart(2, '0')}</b></div><div><span>LIVE IN STORE</span><b>{products.filter((item) => item.state === 'Active').length.toString().padStart(2, '0')}</b></div><div><span>RUNNING LOW</span><b className="admin-low-stock-text">{products.filter((item) => item.stock > 0 && item.stock < 6).length.toString().padStart(2, '0')}</b></div><div><span>OUT OF STOCK</span><b>{products.filter((item) => item.stock === 0).length.toString().padStart(2, '0')}</b></div></div><section className="admin-panel admin-products-table-panel"><div className="admin-list-toolbar"><div className="admin-list-tabs">{['All products', 'Active', 'Draft', 'Low stock', 'Out of stock'].map((item) => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div><label className="admin-table-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a pair..." /></label></div><div className="admin-table-scroller"><table className="admin-table admin-products-table"><thead><tr><th>PRODUCT</th><th>SKU</th><th>STATUS</th><th>INVENTORY</th><th>PRICE</th><th>COLLECTION</th><th /></tr></thead><tbody>{visible.map((product) => <tr key={product.id}><td><span className="admin-product-cell"><img src={resolveAsset(product.image)} alt="" /><span><b>{product.name}</b><small>{product.sizes.split(',').length} sizes · {product.category}</small></span></span></td><td className="admin-sku">{product.sku || product.adminId || product.id}</td><td><span className={`admin-pill ${product.state === 'Active' ? 'pill-active' : 'pill-draft'}`}><i />{product.state}</span></td><td><span className={`admin-inventory ${product.stock < 6 ? 'inventory-low' : ''}`}>{product.stock === 0 ? 'Out of stock' : product.stock < 6 ? `Low · ${product.stock} left` : `${product.stock} in stock`}</span></td><td><b>{money(product.price)}</b></td><td><span className="admin-category-pill">{product.category}</span></td><td><div className="admin-product-actions"><button onClick={() => onEdit(product)}>Edit</button><button className="admin-delete-action" onClick={() => onDelete(product.id)} aria-label={`Delete ${product.name}`}><MoreHorizontal size={17} /></button></div></td></tr>)}</tbody></table>{visible.length === 0 && <div className="admin-empty-state"><Package size={22} /><b>No pairs in this little corner.</b><span>Try a different search or filter.</span></div>}</div><div className="admin-table-foot"><span>Showing <b>{visible.length}</b> of <b>{products.length}</b> products</span><span>{configured ? 'Inventory saved to Supabase' : 'Inventory saved in this browser'}</span></div></section></div>;
}

function OrdersPage({ orders, onStatusChange, configured = false }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All orders');
  const visible = orders.filter((order) => `${order.id} ${order.customer} ${order.email}`.toLowerCase().includes(query.toLowerCase()) && (filter === 'All orders' || order.status === filter));
  const total = orders.filter((order) => order.status !== 'Cancelled').reduce((sum, item) => sum + item.total, 0);
  return <div className="admin-page-content admin-enter"><div className="admin-page-intro"><div><span className="eyebrow">GOOD THINGS, ON THEIR WAY</span><h2>Orders<span>.</span></h2><p>From “just ordered” to “out enjoying their new pair”.</p></div><button className="admin-quiet-button admin-export-button" onClick={() => window.print()}><ArrowDownRight size={15} /> Export list</button></div><div className="admin-order-kpis"><div><span>ALL ORDERS</span><b>{orders.length.toString().padStart(2, '0')}</b></div><div><span>NEED A LITTLE LOVE</span><b>{orders.filter((order) => ['Pending', 'Confirmed'].includes(order.status)).length.toString().padStart(2, '0')}</b></div><div><span>ON THE WAY</span><b>{orders.filter((order) => order.status === 'Shipped').length.toString().padStart(2, '0')}</b></div><div><span>ORDER VALUE</span><b>{money(total)}</b></div></div><section className="admin-panel admin-orders-table-panel"><div className="admin-list-toolbar"><div className="admin-list-tabs">{['All orders', 'Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'].map((item) => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div><label className="admin-table-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Order or customer..." /></label></div><OrderRows orders={visible} onStatusChange={onStatusChange} /><div className="admin-table-foot"><span>Showing <b>{visible.length}</b> of <b>{orders.length}</b> orders</span><span>{configured ? 'Status changes are saved to Supabase' : 'Status changes are saved in this browser'}</span></div></section><div className="admin-order-note"><Truck size={17} /><span><b>Keep every pair moving.</b><small>Update an order's status from its menu. Customer notifications will be connected with order services later.</small></span><CircleHelp size={16} /></div></div>;
}

function CustomersPage({ orders, profiles = [], configured = false }) {
  const activeOrders = orders.filter((order) => order.status !== 'Cancelled');
  const totalOrderCount = activeOrders.length;
  const averageOrder = totalOrderCount ? activeOrders.reduce((sum, order) => sum + Number(order.total || 0), 0) / totalOrderCount : 0;
  const returningRate = totalOrderCount ? Math.round([...new Set(activeOrders.map((order) => order.email).filter(Boolean))].filter((email) => activeOrders.filter((order) => order.email === email).length > 1).length / Math.max(new Set(activeOrders.map((order) => order.email).filter(Boolean)).size, 1) * 100) : 0;
  const deliveredRate = totalOrderCount ? Math.round(activeOrders.filter((order) => order.status === 'Delivered').length / totalOrderCount * 100) : 0;
  const customerMap = new Map(profiles.map((profile) => [profile.email, { email: profile.email, customer: profile.full_name || profile.email?.split('@')[0] || 'Customer', phone: profile.phone, total: 0, count: 0, date: 'No orders yet', createdAt: profile.created_at, initials: (profile.full_name || profile.email || 'C').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(), tone: 'sand' }]));
  orders.forEach((order) => { const email = order.email || `guest-${order.id}`; const row = customerMap.get(email) || { email, customer: order.customer || 'Guest checkout', total: 0, count: 0, date: order.date, createdAt: order.createdAt, initials: (order.customer || 'G').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(), tone: 'sand' }; if (order.status !== 'Cancelled') { row.total += Number(order.total || 0); row.count += 1; } if (new Date(order.createdAt || 0) > new Date(row.lastOrderAt || 0)) { row.date = order.date; row.lastOrderAt = order.createdAt; } customerMap.set(email, row); });
  const customers = [...customerMap.values()];
  return <div className="admin-page-content admin-enter"><div className="admin-page-intro"><div><span className="eyebrow">THE PEOPLE BEHIND THE GOOD DAYS</span><h2>Customers<span>.</span></h2><p>A little snapshot of the people shopping STEPON.</p></div><button className="admin-quiet-button" onClick={() => window.print()}><ArrowDownRight size={15} /> Export list</button></div><div className="admin-stats-grid admin-customer-stats"><StatCard label="Customer profiles" value={String(customers.length)} note="Since the store began" trend={configured ? 'Saved profiles' : 'Growing'} icon={Users} tone="blue" /><StatCard label="Returning customers" value={`${returningRate}%`} note="Came back for another pair" trend={configured ? 'From orders' : '4.1%'} icon={TrendingUp} tone="green" /><StatCard label="Average order" value={money(averageOrder)} note="Across all orders" trend={configured ? 'Current average' : '6.4%'} icon={CreditCard} /><StatCard label={configured ? 'Delivered orders' : 'Customer happiness'} value={configured ? `${deliveredRate}%` : '4.9 / 5'} note={configured ? 'Of active orders' : 'Demo review score'} trend={configured ? 'From order status' : 'Demo data'} icon={Sparkles} tone="rose" /></div><section className="admin-panel admin-products-table-panel"><div className="admin-panel-head admin-customer-table-head"><div><span className="eyebrow">A FEW FAMILIAR NAMES</span><h3>Recent customers</h3></div><span className="admin-customer-count"><Users size={14} /> {customers.length} in this store</span></div><div className="admin-table-scroller"><table className="admin-table"><thead><tr><th>CUSTOMER</th><th>ORDERS</th><th>TOTAL SPENT</th><th>LAST ORDER</th><th>SEGMENT</th></tr></thead><tbody>{customers.map((customer, index) => <tr key={customer.email}><td><span className="admin-customer-cell"><span className={`admin-customer-avatar tone-${customer.tone}`}>{customer.initials}</span><span><b>{customer.customer}</b><small>{customer.email}</small></span></span></td><td>{customer.count} orders</td><td><b>{money(customer.total)}</b></td><td className="admin-table-date">{customer.date}</td><td><span className={`admin-pill ${customer.count > 1 ? 'pill-draft' : 'pill-active'}`}><i />{customer.count > 1 ? 'Returning' : customer.count === 1 ? 'First order' : 'No orders'}</span></td></tr>)}</tbody></table></div></section><div className="admin-order-note"><ShieldCheck size={17} /><span><b>Customer details stay private.</b><small>{configured ? 'Customer details come from orders saved in your Supabase store.' : 'Secure customer profiles and account tools connect when you add Supabase credentials.'}</small></span><CircleHelp size={16} /></div></div>;
}

function SettingsPage({ configured = false }) {
  const [settings, setSettings] = useState(() => { const stored = readSaved('stepon-store-settings', {}); return { storeName: stored.storeName || 'STEPON Footwear', storeEmail: stored.storeEmail || 'hello@stepon.store', freeDelivery: String(stored.freeDelivery ?? '2499').replace(/[^\d.]/g, ''), deliveryFee: String(stored.deliveryFee ?? '99').replace(/[^\d.]/g, ''), returnWindow: stored.returnWindow || '7 days' }; });
  const [savedKey, setSavedKey] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(configured);
  useEffect(() => {
    if (!configured) { setLoadingSettings(false); return undefined; }
    let active = true;
    setLoadingSettings(true);
    storeApi.getSettings().then((remote) => {
      if (active) setSettings({ ...remote, freeDelivery: String(remote.freeDelivery), deliveryFee: String(remote.deliveryFee) });
    }).catch((cause) => { if (active) setError(cause.message || 'Could not load settings.'); }).finally(() => { if (active) setLoadingSettings(false); });
    return () => { active = false; };
  }, [configured]);
  const update = (key, value) => setSettings((current) => ({ ...current, [key]: value }));
  const save = async (key) => { if (loadingSettings) return; setError(''); setSaving(true); try { if (configured) setSettings(await storeApi.saveSettings(settings)); else localStorage.setItem('stepon-store-settings', JSON.stringify(settings)); setSavedKey(key); window.dispatchEvent(new Event('stepon:settings-updated')); } catch (cause) { setError(cause.message || 'Could not save settings.'); } finally { setSaving(false); window.setTimeout(() => setSavedKey(''), 2400); } };
  return <div className="admin-page-content admin-enter"><div className="admin-page-intro"><div><span className="eyebrow">THE LITTLE DETAILS, SORTED</span><h2>Store settings<span>.</span></h2><p>Your shop's identity and everyday essentials.</p></div></div><div className="admin-settings-grid"><section className="admin-panel admin-settings-card"><span className="admin-settings-icon"><ShoppingBag size={19} /></span><span className="eyebrow">STORE PROFILE</span><h3>{settings.storeName}</h3><p>The name customers see across your storefront, order notes and account emails.</p><label className="admin-setting-line"><span>Store name</span><input required maxLength="80" value={settings.storeName} onChange={(event) => update('storeName', event.target.value)} disabled={loadingSettings} /></label><label className="admin-setting-line"><span>Store email</span><input type="email" required maxLength="254" value={settings.storeEmail} onChange={(event) => update('storeEmail', event.target.value)} disabled={loadingSettings} /></label><button className="admin-primary-button" disabled={saving || loadingSettings} onClick={() => save('profile')}>{loadingSettings ? 'Loading…' : savedKey === 'profile' ? 'Saved' : 'Save store details'} <ArrowRight size={14} /></button></section><section className="admin-panel admin-settings-card"><span className="admin-settings-icon settings-icon--green"><Truck size={19} /></span><span className="eyebrow">DELIVERY & RETURNS</span><h3>Good things, delivered.</h3><p>Set the basics customers will need before they choose their next pair.</p><label className="admin-setting-line"><span>Free delivery over (₹)</span><input type="number" min="0" required value={settings.freeDelivery} onChange={(event) => update('freeDelivery', event.target.value)} disabled={loadingSettings} /></label><label className="admin-setting-line"><span>Delivery fee (₹)</span><input type="number" min="0" required value={settings.deliveryFee ?? '99'} onChange={(event) => update('deliveryFee', event.target.value)} disabled={loadingSettings} /></label><label className="admin-setting-line"><span>Return window</span><input value={settings.returnWindow} onChange={(event) => update('returnWindow', event.target.value)} disabled={loadingSettings} /></label><button className="admin-primary-button" disabled={saving || loadingSettings} onClick={() => save('delivery')}>{loadingSettings ? 'Loading…' : savedKey === 'delivery' ? 'Saved' : 'Save delivery details'} <ArrowRight size={14} /></button></section>{error && <p className="auth-error" role="alert">{error}</p>}<section className="admin-preview-warning"><Sparkles size={17} /><span><b>{configured ? 'Store settings are connected' : 'A note about this preview'}</b><small>{configured ? 'Catalog, delivery rules and order records are saved to your Supabase project.' : 'These settings and products are saved in this browser preview. Connect Supabase to use shared store data.'}</small></span></section></div></div>;
}

export default function AdminPanel({ onBack, theme, onToggleTheme, configured = false, storeName = 'STEPON Footwear', adminUser = null, onAdminSignIn, onAdminSignOut, onResetPassword }) {
  const displayName = String(storeName).replace(/\s+Footwear$/i, '').trim() || 'STEPON';
  const [signedIn, setSignedIn] = useState(() => Boolean(adminUser?.role === 'admin'));
  const [section, setSection] = useState('overview');
  const [products, setProducts] = useState(() => configured ? [] : readSaved('stepon-admin-products', seedProducts));
  const [orders, setOrders] = useState(() => configured ? [] : readSaved('stepon-admin-orders', seedOrders));
  const [customerProfiles, setCustomerProfiles] = useState([]);
  const [mobileNav, setMobileNav] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);
  const pendingCount = orders.filter((order) => ['Pending', 'Confirmed'].includes(order.status)).length;
  const title = section === 'overview' ? 'Your store at a glance.' : section === 'settings' ? 'The details that make it yours.' : `Your ${section}.`;
  const subtitle = section === 'overview' ? 'A little pulse check on how the shop is doing.' : section === 'products' ? 'Keep your collection feeling just right.' : section === 'orders' ? 'A good pair is on its way to someone.' : section === 'customers' ? 'Good people, and the pairs they love.' : `The everyday essentials behind ${displayName}.`;

  const saveProducts = (next) => { setProducts(next); if (!configured) localStorage.setItem('stepon-admin-products', JSON.stringify(next)); window.dispatchEvent(new Event('stepon:products-updated')); };
  const saveOrders = (next) => { setOrders(next); localStorage.setItem('stepon-admin-orders', JSON.stringify(next)); const customerOrders = readSaved('stepon-customer-orders', []); const synchronizedCustomerOrders = customerOrders.map((order) => { const updated = next.find((item) => item.id === order.id); return updated ? { ...order, status: updated.status } : order; }); localStorage.setItem('stepon-customer-orders', JSON.stringify(synchronizedCustomerOrders)); window.dispatchEvent(new Event('stepon:orders-updated')); };
  useEffect(() => { setSignedIn(Boolean(adminUser?.role === 'admin')); }, [adminUser?.id, adminUser?.role]);
  useEffect(() => {
    if (!configured || !signedIn) return undefined;
    let active = true;
    const loadStoreData = () => Promise.all([storeApi.listProducts(), storeApi.listOrders(), storeApi.listCustomers()]).then(([nextProducts, nextOrders, nextCustomers]) => {
      if (!active) return;
      setProducts(nextProducts || []); setOrders(nextOrders || []); setCustomerProfiles(nextCustomers || []);
    }).catch((cause) => { if (active) setToast(cause.message || 'Could not load store data.'); });
    loadStoreData();
    const interval = window.setInterval(loadStoreData, 45000);
    window.addEventListener('focus', loadStoreData);
    return () => { active = false; window.clearInterval(interval); window.removeEventListener('focus', loadStoreData); };
  }, [configured, signedIn, adminUser?.id]);
  useEffect(() => { const syncOrders = async () => { if (configured) { try { setOrders(await storeApi.listOrders() || []); } catch { /* The active admin panel reports its own refresh errors. */ } } else setOrders(readSaved('stepon-admin-orders', seedOrders)); }; window.addEventListener('stepon:orders-updated', syncOrders); return () => window.removeEventListener('stepon:orders-updated', syncOrders); }, [configured]);
  const updateOrderStatus = async (id, status) => {
    try {
      if (configured) {
        const order = orders.find((item) => item.id === id);
        if (!order) throw new Error('Order not found. Refresh the list and try again.');
        const updated = await storeApi.setOrderStatus(order, status);
        const next = orders.map((item) => item.id === id ? updated : item); setOrders(next);
        if (status === 'Cancelled') setProducts(await storeApi.listProducts() || []);
        window.dispatchEvent(new Event('stepon:orders-updated'));
      } else {
        const currentOrder = orders.find((order) => order.id === id);
        const next = orders.map((order) => order.id === id ? { ...order, status } : order); saveOrders(next);
        if (status === 'Cancelled' && currentOrder?.status !== 'Cancelled') {
          const restoredBySku = new Map();
          (currentOrder?.cart || []).forEach((item) => {
            const sku = String(item.adminId || item.sku || (Number.isInteger(item.id) ? `ST-${String(item.id).padStart(3, '0')}` : item.id));
            restoredBySku.set(sku, (restoredBySku.get(sku) || 0) + Number(item.qty || 0));
          });
          saveProducts(products.map((product) => {
            const sku = String(product.sku || product.adminId || product.id);
            return restoredBySku.has(sku) ? { ...product, stock: Number(product.stock || 0) + restoredBySku.get(sku) } : product;
          }));
        }
      }
      setToast(`${id} is now ${status.toLowerCase()}.`);
    } catch (cause) { setToast(cause.message || 'Could not update this order.'); }
    window.setTimeout(() => setToast(''), 3200);
  };
  const saveProduct = async (product) => {
    const exists = products.some((item) => item.id === product.id);
    setSavingProduct(true);
    try {
      let next;
      if (configured) {
        const saved = await storeApi.saveProduct(product);
        next = exists ? products.map((item) => item.id === saved.id ? saved : item) : [saved, ...products];
      } else next = exists ? products.map((item) => item.id === product.id ? product : item) : [{ ...product, id: `ST-${String(Date.now()).slice(-4)}` }, ...products];
      saveProducts(next); setModalOpen(false); setEditing(null); setToast(exists ? 'Product details saved.' : 'A new pair has been added.');
    } catch (cause) { setToast(cause.message || 'Could not save this product.'); }
    finally { setSavingProduct(false); window.setTimeout(() => setToast(''), 3200); }
  };
  const requestDeleteProduct = (id) => setDeleteTarget(products.find((product) => product.id === id) || null);
  const deleteProduct = async () => { if (!deleteTarget) return; try { if (configured) await storeApi.deleteProduct(deleteTarget); saveProducts(products.filter((product) => product.id !== deleteTarget.id)); setDeleteTarget(null); setToast(configured ? 'Product removed from the store.' : 'Product removed from the preview.'); } catch (cause) { setToast(cause.message || 'Could not remove this product.'); } window.setTimeout(() => setToast(''), 3200); };
  const newProduct = () => { setEditing(null); setModalOpen(true); };
  const handleAdminSearch = () => { setSection('products'); window.setTimeout(() => document.querySelector('.admin-table-search input')?.focus(), 80); };
  const handleNotifications = () => { setToast(pendingCount ? `${pendingCount} orders could use your attention.` : 'You’re all caught up.'); window.setTimeout(() => setToast(''), 2600); };

  if (!signedIn) return <AdminLogin onEnter={async (email, password) => { if (configured) await onAdminSignIn?.(email, password); setSignedIn(true); }} onBack={onBack} theme={theme} onToggleTheme={onToggleTheme} configured={configured} onResetPassword={onResetPassword} storeName={storeName} />;

  return <div className="admin-shell">
    <div className={`admin-sidebar-scrim ${mobileNav ? 'visible' : ''}`} onClick={() => setMobileNav(false)} />
    <aside className={`admin-sidebar ${mobileNav ? 'admin-sidebar--open' : ''}`}><div className="admin-sidebar-brand"><span className="admin-brand-mark">{displayName[0].toLowerCase()}.</span><span>{displayName}<small>STORE STUDIO</small></span><button className="admin-mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={19} /></button></div><div className="admin-sidebar-shop"><span className="admin-shop-avatar">{displayName[0].toUpperCase()}</span><span><b>{storeName}</b><small><i /> {configured ? 'Live store' : 'Store preview'}</small></span><ChevronDown size={14} /></div><span className="admin-side-label">YOUR STORE</span><nav className="admin-side-nav">{sections.map(({ id, label, icon: Icon, count }) => <button key={id} className={section === id ? 'active' : ''} onClick={() => { setSection(id); setMobileNav(false); }}><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{id === 'orders' ? <b className="admin-side-count">{pendingCount}</b> : id === 'products' ? <small>{products.length.toString().padStart(2, '0')}</small> : count && <small>{count}</small>}{section === id && <i />}</button>)}</nav><span className="admin-side-label admin-side-label--tools">WORKSPACE</span><nav className="admin-side-nav admin-workspace-nav"><button className={section === 'settings' ? 'active' : ''} onClick={() => { setSection('settings'); setMobileNav(false); }}><Settings size={18} strokeWidth={1.8} /><span>Store settings</span>{section === 'settings' && <i />}</button><button onClick={() => setToast('Help and support will be available with the connected store account.')}><CircleHelp size={18} strokeWidth={1.8} /><span>Help & support</span></button></nav><div className="admin-sidebar-bottom"><div className="admin-side-tip"><span><Sparkles size={14} /></span><b>A little store note</b><p>A great product photo can make all the difference. Keep yours bright and clear.</p><button onClick={() => setSection('products')}>Tidy up products <ArrowRight size={13} /></button></div><button className="admin-back-to-store" onClick={onBack}><ArrowLeft size={16} /> <span>Back to storefront</span><ArrowUpRight size={13} /></button><div className="admin-sidebar-footer"><span>{displayName.toUpperCase()} STORE STUDIO</span><span>{configured ? 'LIVE STORE' : 'v0.1 PREVIEW'}</span></div></div></aside>
    <main className="admin-main"><AdminTopbar title={title} subtitle={subtitle} setMobileNav={setMobileNav} onLogout={async () => { if (configured) await onAdminSignOut?.(); else setSignedIn(false); }} onSearch={handleAdminSearch} onNotifications={handleNotifications} theme={theme} onToggleTheme={onToggleTheme} /><div className="admin-content">{section === 'overview' && <Overview products={products} orders={orders} setSection={setSection} onStatusChange={updateOrderStatus} configured={configured} storeName={storeName} />}{section === 'products' && <ProductsPage products={products} configured={configured} onAdd={newProduct} onEdit={(product) => { setEditing(product); setModalOpen(true); }} onDelete={requestDeleteProduct} />}{section === 'orders' && <OrdersPage orders={orders} onStatusChange={updateOrderStatus} configured={configured} />}{section === 'customers' && <CustomersPage orders={orders} profiles={customerProfiles} configured={configured} />}{section === 'settings' && <SettingsPage configured={configured} />}
      <footer className="admin-main-footer"><span>© 2026 {displayName} <i>·</i> GOOD SHOES, GOOD DAYS.</span><span>MADE WITH CARE <b>✳</b></span></footer>
    </div></main>
    {modalOpen && <ProductModal product={editing} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={saveProduct} configured={configured} saving={savingProduct} />}
    {deleteTarget && <DeleteProductDialog product={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={deleteProduct} configured={configured} />}
    {toast && <div className="admin-toast"><span><Check size={15} /></span>{toast}</div>}
  </div>;
}
