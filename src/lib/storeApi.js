import { backendConfigured, supabase } from './supabase.js';

const numeric = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const asProduct = (row) => {
  const seededDemoReview = /^ST-00[1-8]$/.test(row.sku || '');
  return {
    id: row.id,
    adminId: row.sku,
    sku: row.sku,
    name: row.name,
    description: row.description || '',
    category: row.category,
    audience: row.audience || 'Unisex',
    price: numeric(row.price),
    compare: numeric(row.compare_price),
    stock: numeric(row.stock),
    sizes: Array.isArray(row.sizes) ? row.sizes.map(Number) : [],
    color: row.color || 'Black',
    colorHex: row.color_hex || '#343832',
    image: row.image_url || '/images/step-on-hero.webp',
    state: row.state || 'Active',
    badge: row.badge || '',
    rating: seededDemoReview ? '0.0' : numeric(row.rating).toFixed(1),
    reviews: seededDemoReview ? 0 : numeric(row.review_count),
    popularity: numeric(row.popularity, 50),
    isNew: Boolean(row.is_new),
  };
};

const asAdminProduct = (row) => {
  const product = asProduct(row);
  return { ...product, sizes: product.sizes.join(', ') };
};

const asCartItem = (row) => ({
  id: row.product_id || row.product_sku,
  adminId: row.product_sku,
  sku: row.product_sku,
  name: row.product_name,
  image: row.image_url,
  color: row.color,
  size: Number(row.size),
  qty: Number(row.quantity),
  price: numeric(row.unit_price),
});

const asOrder = (row) => {
  const cart = (row.order_items || row.items || []).map((item) => item.product_name ? asCartItem(item) : {
    id: item.product_id || item.sku,
    adminId: item.sku,
    sku: item.sku,
    name: item.name,
    image: item.image,
    color: item.color,
    size: Number(item.size),
    qty: Number(item.quantity),
    price: numeric(item.price),
  });
  const createdAt = row.created_at || new Date().toISOString();
  const initials = (row.customer_name || 'Customer').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  return {
    id: row.order_number,
    dbId: row.id,
    profileId: row.profile_id || null,
    orderNumber: row.order_number,
    customer: row.customer_name || '',
    initials,
    tone: 'sand',
    name: row.customer_name || '',
    email: row.customer_email || '',
    phone: row.customer_phone || '',
    address: row.shipping_address || '',
    city: row.shipping_city || '',
    state: row.shipping_state || '',
    pincode: row.shipping_pincode || '',
    date: new Date(createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
    createdAt,
    cart,
    items: cart.map((item) => `${item.name} · Size ${item.size} × ${item.qty}`).join(', '),
    subtotal: numeric(row.subtotal),
    shippingFee: numeric(row.shipping_fee),
    total: numeric(row.total),
    paymentMethod: row.payment_method || 'COD',
    status: row.status || 'Confirmed',
    guestToken: row.guest_token || undefined,
  };
};

const productPayload = (product) => {
  const enteredSizes = (Array.isArray(product.sizes) ? product.sizes : String(product.sizes || '').split(','))
    .map((size) => String(size).trim())
    .filter(Boolean)
    .map(Number);
  const sizes = [...new Set(enteredSizes)];
  if (!sizes.length || sizes.length > 20 || sizes.some((size) => !Number.isInteger(size) || size < 1 || size > 20)) {
    throw new Error('Add between 1 and 20 shoe sizes, using whole numbers from 1 to 20.');
  }
  return {
    sku: product.sku || product.adminId || (typeof product.id === 'string' && product.id.startsWith('ST-') ? product.id : `ST-${crypto.randomUUID().slice(0, 8).toUpperCase()}`),
    name: product.name.trim(),
    description: product.description || '',
    category: product.category,
    audience: product.audience || 'Unisex',
    price: numeric(product.price),
    compare_price: numeric(product.compare) > numeric(product.price) ? numeric(product.compare) : null,
    sizes,
    stock: Math.max(0, Math.trunc(numeric(product.stock))),
    color: product.color || 'Black',
    color_hex: /^#[\da-f]{6}$/i.test(product.colorHex || '') ? product.colorHex : '#343832',
    image_url: product.image || '/images/step-on-hero.webp',
    state: product.state || 'Active',
    badge: product.badge || '',
    rating: numeric(product.rating),
    review_count: numeric(product.reviews),
    popularity: numeric(product.popularity, 50),
    is_new: Boolean(product.isNew),
  };
};

const result = ({ data, error }) => {
  if (error) throw error;
  return data;
};

export const storeApi = {
  configured: backendConfigured,

  async getSession() {
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  onAuthChange(callback) {
    if (!supabase) return () => {};
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => callback(session, event));
    return () => subscription.unsubscribe();
  },

  async signIn(email, password) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    return data;
  },

  async signUp({ name, email, password, phone = '' }) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim(), phone: phone.trim() },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return data;
  },

  async signInWithGoogle() {
    if (!supabase) throw new Error('Supabase is not configured.');
    try { sessionStorage.setItem('stepon-auth-return', 'account'); } catch { /* OAuth can still complete without this navigation hint. */ }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
    return data;
  },

  async sendPasswordReset(email) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
    if (error) throw error;
  },

  async updatePassword(password) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },

  async signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getProfile(user) {
    if (!supabase || !user) return null;
    const { data, error } = await supabase.from('profiles').select('id, email, full_name, phone, role').eq('id', user.id).single();
    if (error) throw error;
    return { id: data.id, name: data.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || '', email: data.email || user.email || '', phone: data.phone || '', role: data.role };
  },

  async listCustomers() {
    if (!supabase) return null;
    const { data, error } = await supabase.from('profiles').select('id, email, full_name, phone, created_at').eq('role', 'customer').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async updateProfile({ name, phone = '' }) {
    if (!supabase) return null;
    const { data, error } = await supabase.rpc('update_customer_profile', { p_full_name: name, p_phone: phone });
    if (error) throw error;
    return data;
  },

  async listProducts() {
    if (!supabase) return null;
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(asProduct);
  },

  async saveProduct(product) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const payload = productPayload(product);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(product.id));
    const request = isUuid
      ? supabase.from('products').update(payload).eq('id', product.id).select('*').single()
      : supabase.from('products').insert(payload).select('*').single();
    return asAdminProduct(result(await request));
  },

  async deleteProduct(product) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.from('products').delete().eq('id', product.id);
    if (error) throw error;
  },

  async uploadProductImage(file) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const extensions = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
    if (!file || !extensions[file.type]) throw new Error('Choose a JPG, PNG, or WebP image.');
    if (file.size > 5 * 1024 * 1024) throw new Error('Product images must be 5 MB or smaller.');
    const path = `${crypto.randomUUID()}.${extensions[file.type]}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file, { cacheControl: '31536000', upsert: false, contentType: file.type });
    if (error) throw error;
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
  },

  async listOrders() {
    if (!supabase) return null;
    const { data, error } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(asOrder);
  },

  async placeCodOrder(customer, cart) {
    if (!supabase) return null;
    const { data, error } = await supabase.rpc('place_cod_order', {
      p_customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state || '',
        pincode: customer.pincode,
      },
      p_items: cart.map((item) => ({ product_id: item.id, size: Number(item.size), quantity: Number(item.qty) })),
    });
    if (error) throw error;
    const order = asOrder(data);
    if (data.guest_token) {
      try {
        sessionStorage.setItem(`stepon-guest-order:${order.orderNumber}`, data.guest_token);
        sessionStorage.setItem('stepon-last-guest-order', order.orderNumber);
      } catch { /* Current checkout can still show its receipt. */ }
    }
    return order;
  },

  async getGuestOrder(orderNumber) {
    if (!supabase) return null;
    let token = '';
    try { token = sessionStorage.getItem(`stepon-guest-order:${orderNumber}`) || ''; } catch { /* Guest tracking is limited to the current receipt. */ }
    if (!token) return null;
    const { data, error } = await supabase.rpc('get_guest_order', { p_order_number: orderNumber, p_token: token });
    if (error) throw error;
    return asOrder(data);
  },

  async setOrderStatus(order, status) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.rpc('set_order_status', { p_order_id: order.dbId, p_status: status });
    if (error) throw error;
    return { ...order, status: data.status };
  },

  async getSettings() {
    if (!supabase) return null;
    const { data, error } = await supabase.from('store_settings').select('*').eq('id', 1).single();
    if (error) throw error;
    return { storeName: data.store_name, storeEmail: data.store_email, freeDelivery: String(numeric(data.free_delivery_threshold)), deliveryFee: numeric(data.delivery_fee), returnWindow: `${data.return_window_days} days`, returnWindowDays: data.return_window_days };
  },

  async saveSettings(settings) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const storeName = String(settings.storeName || '').trim();
    const storeEmail = String(settings.storeEmail || '').trim();
    if (storeName.length < 2 || storeName.length > 80) throw new Error('Store name must be between 2 and 80 characters.');
    if (storeEmail.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(storeEmail)) throw new Error('Enter a valid store contact email.');
    const freeDelivery = numeric(String(settings.freeDelivery).replace(/[^\d.]/g, ''), 2499);
    const deliveryFee = numeric(String(settings.deliveryFee).replace(/[^\d.]/g, ''), 99);
    const returnWindowDays = Math.min(90, Math.max(0, Math.trunc(numeric(String(settings.returnWindow).replace(/\D/g, ''), 7))));
    const { data, error } = await supabase.from('store_settings').update({
      store_name: storeName,
      store_email: storeEmail,
      free_delivery_threshold: freeDelivery,
      delivery_fee: deliveryFee,
      return_window_days: returnWindowDays,
    }).eq('id', 1).select('*').single();
    if (error) throw error;
    return { storeName: data.store_name, storeEmail: data.store_email, freeDelivery: String(numeric(data.free_delivery_threshold)), deliveryFee: numeric(data.delivery_fee), returnWindow: `${data.return_window_days} days`, returnWindowDays: data.return_window_days };
  },
};
