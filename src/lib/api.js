// This design repo is a fully static, backend-independent demo — every
// "API call" below is served from in-memory mock data (src/lib/mockData.js)
// instead of a real network request, so the app can be deployed as-is
// (e.g. to Vercel) with no server dependency.
import {
    MOCK_STORE_CONFIG,
    buildMockOrder,
    MOCK_EXCHANGE_CATALOG,
    buildVariantsForProduct,
    findExchangeVariantPrice,
    findOrderLineItem,
    mockDelay,
    randomRef,
} from './mockData'

export const API_URL = 'mock://local'

// Mirrors src/utilities/hooks/useEndpoint from the main consumer-workflow-v2 repo.
export const getEndpoints = (platform) => {
    let storeConfigEndpoint = 'ra/get_store_config'
    let validateOrderEndpoint = 'ecoreturns/validate'
    let fetchIncentiveEndpoint = 'fetch-incentive'
    let exchangeDataEndpoint = 'api/exchange/item'
    let paginatedExchangeDataEndpoint = 'api/exchange/item/get_paginated_exchange_items'
    let getVariantsEndpoint = 'api/exchange/item/get_variants'
    let uploadImageEndpoint = 'common/upload_image'
    let PaymentInfoEndpoint = 'ecoreturns/calculate/items'
    let submitItemsEndpoint = 'ecoreturns/submit/items'
    let confirmCheckoutStatusEndpoint = 'ra/refund_exchange_payment_status'

    if (platform && platform !== 'shopify') {
        fetchIncentiveEndpoint = 'ecoreturns/incentive/fetch'
        exchangeDataEndpoint = 'ecoreturns/exchange/items'
        paginatedExchangeDataEndpoint = 'ecoreturns/exchange/items/next'
        getVariantsEndpoint = 'ecoreturns/exchange/item/get_variants'
    }

    return {
        storeConfigEndpoint,
        validateOrderEndpoint,
        fetchIncentiveEndpoint,
        exchangeDataEndpoint,
        paginatedExchangeDataEndpoint,
        getVariantsEndpoint,
        uploadImageEndpoint,
        PaymentInfoEndpoint,
        submitItemsEndpoint,
        confirmCheckoutStatusEndpoint,
    }
}

export const resolveStoreUniqueId = async () => {
    await mockDelay(150)
    return MOCK_STORE_CONFIG.store_unique_id
}

// ---------------------------------------------------------------------------
// Mock request handlers, keyed off the same URL fragments the real endpoints
// used. `api.get(url)` / `api.post(url, body)` resolve to `{ data }`, so no
// other file in the app needs to change.
// ---------------------------------------------------------------------------
const handleGet = async (url) => {
    await mockDelay(300)
    if (url.includes('get_store_config')) {
        return { data: MOCK_STORE_CONFIG }
    }
    throw new Error(`No mock handler for GET ${url}`)
}

const handlePost = async (url, body = {}) => {
    await mockDelay()

    if (url.includes('account/store')) {
        return { data: { store_unique_id: MOCK_STORE_CONFIG.store_unique_id } }
    }

    if (url.includes('validate')) {
        const order = buildMockOrder({ orderNumber: body.order_number, email: body.customer_email })
        return { data: order }
    }

    if (url.includes('get_paginated_exchange_items')) {
        return { data: { other_options: MOCK_EXCHANGE_CATALOG, next_url: null, prev_url: null } }
    }

    if (url.includes('get_variants')) {
        const product = MOCK_EXCHANGE_CATALOG.find((p) => p.product_id === body.product_id)
        return { data: [{ variants: buildVariantsForProduct(product) }] }
    }

    if (url.includes('exchange/item')) {
        const search = (body.search_product_name || '').trim().toLowerCase()
        const options = search
            ? MOCK_EXCHANGE_CATALOG.filter((p) => p.name.toLowerCase().includes(search))
            : MOCK_EXCHANGE_CATALOG
        return {
            data: {
                currency: 'INR',
                exchange_options: { other_options: options, next_url: null, prev_url: null },
            },
        }
    }

    if (url.includes('upload_image')) {
        return { data: { urls: body.files || [], message: 'ok' } }
    }

    if (url.includes('calculate/items')) {
        return { data: calculatePaymentInfo(body) }
    }

    if (url.includes('submit/items')) {
        return { data: { ran: randomRef('RAN') } }
    }

    throw new Error(`No mock handler for POST ${url}`)
}

const mockOrderForPayload = buildMockOrder({})

const calculatePaymentInfo = (payload) => {
    const returnItems = payload.return_data || []
    const exchangeItems = payload.exchange_data || []

    const returnTotal = returnItems.reduce((acc, item) => {
        const lineItem = findOrderLineItem(mockOrderForPayload, item.line_item_id)
        const price = parseFloat(lineItem?.price) || 0
        return acc + price * (parseInt(item.quantity, 10) || 1)
    }, 0)

    // refund_to is 'store_credit' for BOTH the plain "Store Credit" option and
    // the "Store Credit + Bonus" option (see payload.js) — only incentive_type
    // tells them apart, so the bonus must be keyed off that, not refund_to.
    const bonusEligible = returnItems.some((item) => item.incentive_type === 'return')
    const totalReturnRefund = bonusEligible ? Math.round(returnTotal * 1.15 * 100) / 100 : returnTotal

    const totalExchangeDue = exchangeItems.reduce((acc, item) => {
        const lineItem = findOrderLineItem(mockOrderForPayload, item.line_item_id)
        const oldPrice = parseFloat(lineItem?.price) || 0
        const newPrice = findExchangeVariantPrice(item.selected_product_for_exchange, item.selected_variant_for_exchange)
        const diff = (newPrice - oldPrice) * (parseInt(item.quantity, 10) || 1)
        return acc + (diff > 0 ? diff : 0)
    }, 0)

    const reverseShipmentCharges = returnItems.length > 0 ? 49 : 0

    return {
        total_return_refund: Math.round(totalReturnRefund * 100) / 100,
        total_exchange_due: Math.round(totalExchangeDue * 100) / 100,
        reverse_shipment_charges: reverseShipmentCharges,
    }
}

export const api = {
    get: (url) => handleGet(url),
    post: (url, body) => handlePost(url, body),
}
