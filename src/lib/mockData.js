// Fully static, in-memory demo data. No backend calls are made anywhere in
// this app — src/lib/api.js reads from here so the whole flow works on
// Vercel (or any static host) with zero server dependency.

const img = (id) => `https://images.unsplash.com/${id}?w=600&q=70&auto=format&fit=crop`

export const MOCK_STORE_CONFIG = {
    platform: 'shopify',
    store_unique_id: 'demo-fashion-co.myshopify.com',
    store_name: 'Demo Fashion Co.',
}

// ---------------------------------------------------------------------------
// Return reasons (shared shapes referenced by order line items)
// ---------------------------------------------------------------------------
const REASON_SIZE = {
    reason: { id: 1, name: "Doesn't fit" },
    allow_return: true,
    allow_exchange: true,
    picture_collection: 'none',
    min_images_required: 0,
    store_reasons: [
        { id: 101, name: 'Too small' },
        { id: 102, name: 'Too large' },
        { id: 103, name: 'Runs narrow' },
    ],
    subreasons_free_text: false,
    subreasons_free_text_optional: false,
    image_requirements: [],
}

const REASON_DAMAGED = {
    reason: { id: 2, name: 'Damaged or defective' },
    allow_return: true,
    allow_exchange: true,
    picture_collection: 'collect_one',
    min_images_required: 1,
    store_reasons: [],
    subreasons_free_text: true,
    subreasons_free_text_optional: false,
    image_requirements: [
        { caption: 'Damage close-up', description: 'A clear photo of the damaged area', is_required: true },
    ],
}

const REASON_CHANGED_MIND = {
    reason: { id: 3, name: 'Changed my mind' },
    allow_return: true,
    allow_exchange: false,
    picture_collection: 'none',
    min_images_required: 0,
    store_reasons: [],
    subreasons_free_text: true,
    subreasons_free_text_optional: true,
    image_requirements: [],
}

const REASON_WRONG_ITEM = {
    reason: { id: 4, name: 'Received the wrong item' },
    allow_return: true,
    allow_exchange: true,
    picture_collection: 'collect',
    min_images_required: 2,
    store_reasons: [],
    subreasons_free_text: false,
    subreasons_free_text_optional: false,
    image_requirements: [
        { caption: 'Item received', description: 'Photo of the item you actually received', is_required: true },
        { caption: 'Order label', description: 'Photo of the shipping label / packing slip', is_required: true },
    ],
}

const REASON_QUALITY = {
    reason: { id: 5, name: 'Not as described / quality issue' },
    allow_return: true,
    allow_exchange: true,
    picture_collection: 'collect_multiple',
    min_images_required: 1,
    store_reasons: [
        { id: 501, name: 'Fabric feels different' },
        { id: 502, name: 'Color mismatch' },
        { id: 503, name: 'Stitching issue' },
    ],
    subreasons_free_text: true,
    subreasons_free_text_optional: true,
    image_requirements: [
        { caption: 'Overall photo', description: 'Full view of the item', is_required: true },
    ],
}

// ---------------------------------------------------------------------------
// Mock order — returned for ANY order number / email combination typed into
// orderLookup, so the demo always "finds" an order.
// ---------------------------------------------------------------------------
export const buildMockOrder = ({ orderNumber, email }) => ({
    order_number: orderNumber || '#1094',
    order_created_date: '2026-06-28T10:15:00Z',
    currency: 'INR',
    test_mode: true,
    recent_order_id: 'demo-order-1001',
    customer_id: 'cust-demo-1001',
    payment_method: 'prepaid',
    customer_email: email || 'demo@example.com',
    customer_data: {
        customer_email: email || 'demo@example.com',
        name: 'Alex Morgan',
        phone: '+91 98765 43210',
    },
    order_data: [
        {
            line_item_id: 'li-1',
            variant_id: 'v-1',
            product_id: 'p-1',
            product_name: 'Classic Oxford Shirt — Blue',
            product_image: img('photo-1602810318383-e386cc2a3ccf'),
            price: 1499,
            quantity: 1,
            return_allowed: true,
            exchange_allowed: true,
            country_code: 'IN',
            line_item_location_id: 'loc-001',
            line_item_return_reason: [REASON_SIZE, REASON_DAMAGED, REASON_CHANGED_MIND],
        },
        {
            line_item_id: 'li-2',
            variant_id: 'v-2',
            product_id: 'p-2',
            product_name: 'Relaxed Fit Chino Trousers — Beige',
            product_image: img('photo-1541099649105-f69ad21f3246'),
            price: 2199,
            quantity: 1,
            return_allowed: true,
            exchange_allowed: true,
            line_item_location_id: 'loc-001',
            line_item_return_reason: [REASON_SIZE, REASON_QUALITY, REASON_WRONG_ITEM],
        },
        {
            line_item_id: 'li-3',
            variant_id: 'v-3',
            product_id: 'p-3',
            product_name: 'Everyday Crew Tee — Pack of 2',
            product_image: img('photo-1521572163474-6864f9cf17ab'),
            price: 799,
            quantity: 2,
            return_allowed: true,
            exchange_allowed: true,
            line_item_location_id: 'loc-001',
            line_item_return_reason: [REASON_CHANGED_MIND, REASON_QUALITY],
        },
        {
            line_item_id: 'li-4',
            variant_id: 'v-4',
            product_id: 'p-4',
            product_name: 'Premium Leather Belt — Tan',
            product_image: img('photo-1553062407-98eeb64c6a62'),
            price: 999,
            quantity: 1,
            return_allowed: true,
            exchange_allowed: true,
            line_item_location_id: 'loc-001',
            line_item_return_reason: [REASON_DAMAGED, REASON_WRONG_ITEM],
        },
    ],
})

// ---------------------------------------------------------------------------
// Exchange catalog — deliberately spans both cheaper and pricier options than
// the order items above, so the "get money back" / "pay a little more" /
// "same price" states in ExchangeModal are all reachable in the demo.
// ---------------------------------------------------------------------------
export const MOCK_EXCHANGE_CATALOG = [
    { product_id: 'ex-1', name: 'Everyday Crew Tee — Charcoal', price: 599, img_url: img('photo-1521572163474-6864f9cf17ab') },
    { product_id: 'ex-2', name: 'Slim Fit Denim Jeans', price: 2999, img_url: img('photo-1541099649105-f69ad21f3246') },
    { product_id: 'ex-3', name: 'Classic Oxford Shirt — White', price: 1499, img_url: img('photo-1602810318383-e386cc2a3ccf') },
    { product_id: 'ex-4', name: 'Canvas High-Top Sneakers', price: 3499, img_url: img('photo-1549298916-b41d501d3772') },
    { product_id: 'ex-5', name: 'Woven Leather Belt', price: 799, img_url: img('photo-1553062407-98eeb64c6a62') },
    { product_id: 'ex-6', name: 'Aviator Sunglasses', price: 1299, img_url: img('photo-1523381210434-271e8be1f52b') },
    { product_id: 'ex-7', name: 'Bomber Jacket — Olive', price: 4499, img_url: img('photo-1551028719-00167b16eac5') },
    { product_id: 'ex-8', name: 'Chrono Wrist Watch', price: 5999, img_url: img('photo-1524805444758-089113d48a6d') },
    { product_id: 'ex-9', name: 'Relaxed Chino Trousers — Sand', price: 1899, img_url: img('photo-1541099649105-f69ad21f3246') },
    { product_id: 'ex-10', name: 'Canvas Tote Bag', price: 449, img_url: img('photo-1590874103328-eac38a683ce7') },
    { product_id: 'ex-11', name: 'Merino Crew Sweater', price: 2599, img_url: img('photo-1516762689617-e1cffcef479d') },
    { product_id: 'ex-12', name: 'Everyday Crew Tee — White', price: 599, img_url: img('photo-1521572163474-6864f9cf17ab') },
]

const SIZES = ['S', 'M', 'L', 'XL']

// Deterministic pseudo-stock so the demo behaves the same on every run
// (some sizes always show as out of stock to exercise that state).
const stockFor = (productId, size) => {
    const seed = `${productId}-${size}`.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    return seed % 7 === 0 ? 0 : (seed % 5) + 2
}

export const buildVariantsForProduct = (product) => {
    if (!product) return []
    return SIZES.map((size) => ({
        variant_id: `${product.product_id}-${size}`,
        product_id: product.product_id,
        price: product.price,
        img_url: product.img_url,
        name: product.name,
        quantity: stockFor(product.product_id, size),
        tags: [],
        Size: size,
    }))
}

export const findExchangeVariantPrice = (productId, variantId) => {
    const product = MOCK_EXCHANGE_CATALOG.find((p) => p.product_id === productId)
    if (!product) return 0
    const variant = buildVariantsForProduct(product).find((v) => v.variant_id === variantId)
    return parseFloat((variant || product).price) || 0
}

export const findOrderLineItem = (order, lineItemId) =>
    (order?.order_data || []).find((i) => i.line_item_id === lineItemId)

// ---------------------------------------------------------------------------
// Simulated latency so loading states in the UI still feel real.
// ---------------------------------------------------------------------------
export const mockDelay = (ms = 450 + Math.round(Math.random() * 350)) =>
    new Promise((resolve) => setTimeout(resolve, ms))

export const randomRef = (prefix) =>
    `${prefix}-${Math.floor(100000 + Math.random() * 899999)}`
