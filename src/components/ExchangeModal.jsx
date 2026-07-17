'use client'

import { useEffect, useState } from 'react'
import { api, getEndpoints } from '@/lib/api'

const currencySymbol = (currency) => (currency === 'INR' || !currency ? '₹' : currency + ' ')

const META_KEYS = new Set(['variant_id', 'product_id', 'price', 'img_url', 'name', 'quantity', 'tags'])

// Compares a candidate product/variant's price against what the customer already paid,
// so the emotional weight of "you'll get money back" vs "you'll owe a bit more" reads
// instantly on the card — before they even open the variant picker.
const comparePrice = (newPriceRaw, originalPriceRaw) => {
    const newPrice = parseFloat(newPriceRaw) || 0
    const originalPrice = parseFloat(originalPriceRaw) || 0
    const diff = Math.round((newPrice - originalPrice) * 100) / 100
    if (Math.abs(diff) < 0.01) return { type: 'same', amount: 0 }
    if (diff < 0) return { type: 'refund', amount: Math.abs(diff) }
    return { type: 'extra', amount: diff }
}

const PRICE_TAG_STYLES = {
    refund: {
        chip: 'bg-[#4338CA] text-white',
        rowText: 'text-[#4338CA]',
        cardWash: 'bg-[#eef2ff]',
        icon: (
            <svg className="size-3" stroke="currentColor" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><polyline points="19 12 12 19 5 12"></polyline><line x1="12" y1="19" x2="12" y2="5"></line></svg>
        ),
    },
    extra: {
        chip: 'bg-[#d97706] text-white',
        rowText: 'text-[#9a5b0c]',
        cardWash: 'bg-[#fffaf3]',
        icon: (
            <svg className="size-3" stroke="currentColor" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><polyline points="5 12 12 5 19 12"></polyline><line x1="12" y1="5" x2="12" y2="19"></line></svg>
        ),
    },
    same: {
        chip: 'bg-[#55655c] text-white',
        rowText: 'text-[#55655c]',
        cardWash: 'bg-white',
        icon: (
            <svg className="size-3" stroke="currentColor" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="9" x2="19" y2="9"></line><line x1="5" y1="15" x2="19" y2="15"></line></svg>
        ),
    },
}

const priceTagLabel = (cmp, currency) => {
    if (cmp.type === 'same') return 'Same price'
    if (cmp.type === 'refund') return `Get ${currencySymbol(currency)}${cmp.amount.toFixed(2)} back`
    return `Pay ${currencySymbol(currency)}${cmp.amount.toFixed(2)} more`
}

export default function ExchangeModal({ open, onClose, item, orderDetails, storeConfigData, accessCode, onConfirm }) {
    const [step, setStep] = useState('browse')
    const [searchInput, setSearchInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [options, setOptions] = useState([])
    const [pageInfo, setPageInfo] = useState({ nextUrl: null, prevUrl: null })
    const [currency, setCurrency] = useState(item?._display?.currency || orderDetails?.currency)

    const [selectedProduct, setSelectedProduct] = useState(null)
    const [variants, setVariants] = useState([])
    const [selections, setSelections] = useState({})
    const [variantLoading, setVariantLoading] = useState(false)

    const { exchangeDataEndpoint, paginatedExchangeDataEndpoint, getVariantsEndpoint } = getEndpoints(storeConfigData?.platform)

    const resetAndClose = () => {
        setStep('browse')
        setSelectedProduct(null)
        setVariants([])
        setSelections({})
        setSearchInput('')
        onClose()
    }

    const fetchOptions = async (search = '') => {
        setLoading(true)
        setError('')
        try {
            const response = await api.post(`/${exchangeDataEndpoint}/`, {
                shop: storeConfigData?.store_unique_id,
                variant_id: item.variant_id,
                product_id: item.product_id,
                order_id: orderDetails?.recent_order_id,
                line_item_id: item.line_item_id,
                line_item_location_id: item.line_item_location_id,
                order_country: orderDetails?.order_data?.[0]?.country_code,
                quantity: 1,
                access_code: accessCode,
                currency: orderDetails?.currency,
                search_product_name: search,
            })
            const data = response.data?.data || response.data
            setOptions(data?.exchange_options?.other_options || [])
            setPageInfo({ nextUrl: data?.exchange_options?.next_url || null, prevUrl: data?.exchange_options?.prev_url || null })
            setCurrency(data?.currency || currency)
        } catch (err) {
            setError('Could not load other products right now.')
            setOptions([])
        } finally {
            setLoading(false)
        }
    }

    const fetchPage = async (url) => {
        if (!url) return
        setLoading(true)
        try {
            const response = await api.post(`/${paginatedExchangeDataEndpoint}/`, {
                shop: storeConfigData?.store_unique_id,
                next_url: url,
                line_item_id: item.line_item_id,
                order_id: orderDetails?.recent_order_id,
                product_id: item.product_id,
                variant_id: item.variant_id,
            })
            const data = response.data?.data || response.data
            setOptions(data?.other_options || data?.exchange_options?.other_options || [])
            setPageInfo({ nextUrl: data?.next_url ?? pageInfo.nextUrl, prevUrl: data?.prev_url ?? pageInfo.prevUrl })
        } catch (err) {
            setError('Could not load that page.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (open) fetchOptions('')
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    const selectProduct = async (product) => {
        setSelectedProduct(product)
        setSelections({})
        setStep('variant')
        setVariantLoading(true)
        setError('')
        try {
            const response = await api.post(`/${getVariantsEndpoint}/`, {
                product_id: product.product_id,
                line_item_location_id: item.line_item_location_id,
                order_country: orderDetails?.order_data?.[0]?.country_code,
                shop: storeConfigData?.store_unique_id,
                old_item_price: item._display?.price,
            })
            setVariants(response.data?.[0]?.variants || [])
        } catch (err) {
            setError('Could not load variants for this product.')
            setVariants([])
        } finally {
            setVariantLoading(false)
        }
    }

    const optionNames = Array.from(
        variants.reduce((set, v) => {
            Object.keys(v).forEach((k) => { if (!META_KEYS.has(k)) set.add(k) })
            return set
        }, new Set())
    )

    const optionValues = (name) => Array.from(new Set(variants.map((v) => v[name]).filter(Boolean)))

    const isValueInStock = (name, value) => {
        const otherSelections = Object.entries(selections).filter(([k]) => k !== name)
        const matching = variants.filter((v) => {
            if (v[name] !== value) return false
            return otherSelections.every(([k, val]) => v[k] === val)
        })
        return matching.length > 0 && matching.some((v) => v.quantity > 0)
    }

    const matchedVariant = optionNames.length > 0 && optionNames.every((n) => selections[n])
        ? variants.find((v) => optionNames.every((n) => v[n] === selections[n]))
        : (variants.length === 1 ? variants[0] : null)

    const priceDiff = matchedVariant ? (parseFloat(matchedVariant.price) || 0) - (parseFloat(item._display?.price) || 0) : null

    const canConfirm = matchedVariant && matchedVariant.quantity > 0

    const onConfirmVariant = () => {
        if (!canConfirm) return
        const description = optionNames.map((n) => `${n}: ${selections[n]}`).join(' / ')
        onConfirm({
            newProductId: matchedVariant.product_id,
            newVariantId: matchedVariant.variant_id,
            newVariantDescription: description,
            newPrice: matchedVariant.price,
            newImage: matchedVariant.img_url || selectedProduct?.img_url,
            newName: matchedVariant.name || selectedProduct?.name,
        })
        resetAndClose()
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-[#0f172a]/50 backdrop-blur-[2px]" onClick={resetAndClose}></div>
            <div className="relative w-full max-w-[560px] max-h-[86vh] flex flex-col bg-white rounded-[22px] shadow-[0px_24px_64px_rgba(15,42,30,0.25)] overflow-hidden font-['Inter']">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#e3e5f0] shrink-0">
                    <div className="flex items-center gap-2">
                        {step === 'variant' && (
                            <button type="button" onClick={() => setStep('browse')} className="size-8 flex justify-center items-center rounded-full hover:bg-[#f5f6fa]" aria-label="Back to product list">
                                <svg className="size-4 text-[#55655c]" stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                            </button>
                        )}
                        <div className="text-[#0f172a] font-['Space_Grotesk'] text-lg font-bold tracking-[-0.3px]">
                            {step === 'browse' ? 'Exchange for another item' : 'Choose your variant'}
                        </div>
                    </div>
                    <button type="button" onClick={resetAndClose} aria-label="Close" className="size-8 flex justify-center items-center rounded-full hover:bg-[#f5f6fa]">
                        <svg className="size-4 text-[#55655c]" stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4">
                    {step === 'browse' && (
                        <>
                            <form
                                className="flex w-full items-center gap-2 mb-4"
                                onSubmit={(e) => { e.preventDefault(); fetchOptions(searchInput) }}
                            >
                                <div className="flex flex-1 items-center bg-[#f5f6fa] border border-[#e3e5f0] rounded-xl px-3.5 h-[46px] gap-2">
                                    <svg className="size-4 text-[#9aa8a0] shrink-0" stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                    <input
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        placeholder="Search products…"
                                        className="flex-1 bg-transparent outline-none text-sm text-[#0f172a] placeholder:text-[#9aa8a0]"
                                    />
                                </div>
                                <button type="submit" className="h-[46px] px-4 flex items-center justify-center rounded-xl bg-[#0f172a] text-white text-sm font-semibold">Search</button>
                            </form>

                            {error && (
                                <div className="mb-3 bg-[#fef2f2] border border-[#fecaca] rounded-[10px] px-3.5 py-2.5 text-[#b91c1c] text-xs">{error}</div>
                            )}

                            {loading ? (
                                <div className="flex justify-center py-10">
                                    <div className="size-6 border-2 border-[#4338CA] border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : options.length === 0 ? (
                                <div className="text-center text-[#55655c] text-sm py-10">No other products found.</div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {options.map((opt) => {
                                        const cmp = comparePrice(opt.price, item._display?.price)
                                        const style = PRICE_TAG_STYLES[cmp.type]
                                        return (
                                            <button
                                                key={opt.product_id}
                                                type="button"
                                                onClick={() => selectProduct(opt)}
                                                className={`flex flex-col text-left border border-[#e3e5f0] rounded-2xl overflow-hidden hover:border-[#4338CA] hover:shadow-[0px_6px_18px_rgba(67,56,202,0.12)] transition-all ${style.cardWash}`}
                                            >
                                                <div className="relative w-full aspect-square bg-[#eef0fa] bg-cover bg-center" style={opt.img_url ? { backgroundImage: `url('${opt.img_url}')` } : undefined}>
                                                    {cmp.type !== 'same' && (
                                                        <div className={`absolute top-2 right-2 flex items-center gap-0.5 rounded-full pl-1.5 pr-2 py-1 text-[11px] font-bold shadow-[0px_2px_6px_rgba(15,42,30,0.25)] ${style.chip}`}>
                                                            {style.icon}
                                                            {currencySymbol(currency)}{cmp.amount.toFixed(2)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-1 p-3">
                                                    <div className="text-[#0f172a] text-[13px] font-semibold leading-[1.3] line-clamp-2">{opt.name}</div>
                                                    <div className="text-[#0f172a]/70 text-[13px] font-bold">{currencySymbol(currency)}{parseFloat(opt.price || 0).toFixed(2)}</div>
                                                    <div className={`flex items-center gap-1 ${style.rowText}`}>
                                                        {style.icon}
                                                        <div className="text-[11px] font-semibold">{priceTagLabel(cmp, currency)}</div>
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}

                            {(pageInfo.nextUrl || pageInfo.prevUrl) && (
                                <div className="flex justify-center items-center gap-4 mt-4">
                                    <button type="button" disabled={!pageInfo.prevUrl} onClick={() => fetchPage(pageInfo.prevUrl)} className="size-8 flex justify-center items-center rounded-full border border-[#e3e5f0] disabled:opacity-30">
                                        <svg className="size-3.5" stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                    </button>
                                    <button type="button" disabled={!pageInfo.nextUrl} onClick={() => fetchPage(pageInfo.nextUrl)} className="size-8 flex justify-center items-center rounded-full border border-[#e3e5f0] disabled:opacity-30">
                                        <svg className="size-3.5" stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {step === 'variant' && (
                        <>
                            <div className="flex items-center gap-3 bg-[#f5f6fa] rounded-2xl p-3 mb-4">
                                <div className="size-14 shrink-0 rounded-[10px] bg-[#eef0fa] bg-cover bg-center" style={(matchedVariant?.img_url || selectedProduct?.img_url) ? { backgroundImage: `url('${matchedVariant?.img_url || selectedProduct?.img_url}')` } : undefined}></div>
                                <div className="flex flex-col gap-0.5 flex-1">
                                    <div className="text-[#0f172a] text-sm font-semibold">{matchedVariant?.name || selectedProduct?.name}</div>
                                    <div className="text-[#55655c] text-xs">{currencySymbol(currency)}{parseFloat((matchedVariant?.price ?? selectedProduct?.price) || 0).toFixed(2)}</div>
                                </div>
                            </div>

                            {error && (
                                <div className="mb-3 bg-[#fef2f2] border border-[#fecaca] rounded-[10px] px-3.5 py-2.5 text-[#b91c1c] text-xs">{error}</div>
                            )}

                            {variantLoading ? (
                                <div className="flex justify-center py-10">
                                    <div className="size-6 border-2 border-[#4338CA] border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {optionNames.map((name) => (
                                        <div key={name} className="flex flex-col gap-2">
                                            <div className="text-[#0f172a] text-xs font-semibold">{name}</div>
                                            <div className="flex flex-wrap gap-2">
                                                {optionValues(name).map((value) => {
                                                    const active = selections[name] === value
                                                    const inStock = isValueInStock(name, value)
                                                    return (
                                                        <button
                                                            key={value}
                                                            type="button"
                                                            disabled={!inStock}
                                                            onClick={() => setSelections((prev) => ({ ...prev, [name]: value }))}
                                                            className={`relative px-4 py-2 rounded-[10px] text-[13px] font-semibold ${active ? 'bg-[#eef2ff] border-2 border-[#4338CA] text-[#4338CA]' : 'bg-white border border-[#e3e5f0] text-[#0f172a]'} ${!inStock ? 'opacity-40 cursor-not-allowed' : ''}`}
                                                        >
                                                            {value}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}

                                    {optionNames.length > 0 && optionNames.every((n) => selections[n]) && !matchedVariant && (
                                        <div className="bg-[#fff7ed] border border-[#fed7aa] rounded-[10px] px-3.5 py-2.5 text-[#9a5b0c] text-xs">This combination isn't available.</div>
                                    )}
                                    {matchedVariant && matchedVariant.quantity <= 0 && (
                                        <div className="bg-[#fef2f2] border border-[#fecaca] rounded-[10px] px-3.5 py-2.5 text-[#b91c1c] text-xs">This variant is out of stock.</div>
                                    )}

                                    {matchedVariant && typeof priceDiff === 'number' && (() => {
                                        const cmp = comparePrice(matchedVariant.price, item._display?.price)
                                        const style = PRICE_TAG_STYLES[cmp.type]
                                        return (
                                            <div className={`flex justify-between items-center border rounded-2xl px-4 py-3 ${cmp.type === 'refund' ? 'bg-[#eef2ff] border-[#a5b4fc]' : cmp.type === 'extra' ? 'bg-[#fff7ed] border-[#fed7aa]' : 'bg-[#f5f6fa] border-[#e3e5f0]'}`}>
                                                <div className={`flex items-center gap-1.5 text-[13px] font-semibold ${style.rowText}`}>
                                                    <div className={`size-5 flex items-center justify-center rounded-full ${style.chip}`}>{style.icon}</div>
                                                    {cmp.type === 'refund' ? "You'll get this back as credit" : cmp.type === 'extra' ? 'Extra to pay at checkout' : 'No price difference'}
                                                </div>
                                                <div className={`text-[15px] font-bold ${style.rowText}`}>
                                                    {currencySymbol(currency)}{cmp.amount.toFixed(2)}
                                                </div>
                                            </div>
                                        )
                                    })()}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {step === 'variant' && (
                    <div className="shrink-0 border-t border-[#e3e5f0] p-4">
                        <button
                            type="button"
                            disabled={!canConfirm}
                            onClick={onConfirmVariant}
                            className={`flex w-full h-[48px] justify-center items-center rounded-[13px] gap-2 ${canConfirm ? 'bg-[linear-gradient(90deg,_rgb(67,_56,_202)_0%,_rgb(99,_102,_241)_100%)] shadow-[0px_6px_16px_rgba(67,56,202,0.28)]' : 'bg-[#c7cadf] cursor-not-allowed'}`}
                        >
                            <div className="text-white text-[15px] font-semibold">Confirm exchange item</div>
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
