'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/TopBar'
import StepIndicator from '@/components/StepIndicator'
import ImageUploader from '@/components/ImageUploader'
import ExchangeModal from '@/components/ExchangeModal'
import { useAppData } from '@/contexts/AppDataContext'

const currencySymbol = (currency) => (currency === 'INR' || !currency ? '₹' : currency + ' ')

const minRequiredFor = (reason) => {
    if (!reason) return 0
    if (reason.picture_collection === 'collect_one') return reason.min_images_required || 1
    if (reason.picture_collection === 'collect' || reason.picture_collection === 'collect_multiple') return reason.min_images_required || 0
    return reason.min_images_required || 0
}

export default function SelectItems() {
    const router = useRouter()
    const { orderDetails, storeConfigData, accessCode, selectedItemsList, setSelectedItemsList } = useAppData()

    const orderData = orderDetails?.order_data || []
    const currency = orderDetails?.currency

    const [selections, setSelections] = useState({})
    const [expanded, setExpanded] = useState({})
    const [exchangeModalItem, setExchangeModalItem] = useState(null)

    useEffect(() => {
        if (!orderDetails) {
            router.replace('/orderLookup')
        }
    }, [orderDetails, router])

    const getReasons = (item, mode) => {
        const reasons = item.line_item_return_reason || []
        return reasons.filter((r) => (mode === 'Exchange' ? r.allow_exchange : r.allow_return))
    }

    const getSelection = (lineItemId) =>
        selections[lineItemId] || { selected: false, mode: 'Return', reasonId: null, subReason: '', reasonNote: '', images: [], exchangeSelection: null }

    const updateSelection = (lineItemId, patch) => {
        setSelections((prev) => ({ ...prev, [lineItemId]: { ...getSelection(lineItemId), ...patch } }))
    }

    const toggleSelected = (item) => {
        const current = getSelection(item.line_item_id)
        if (current.selected) {
            updateSelection(item.line_item_id, { selected: false })
            setExpanded((prev) => ({ ...prev, [item.line_item_id]: false }))
            return
        }
        const mode = item.return_allowed === false && item.exchange_allowed !== false ? 'Exchange' : 'Return'
        const reasons = getReasons(item, mode)
        updateSelection(item.line_item_id, { selected: true, mode, reasonId: reasons[0]?.reason?.id ?? null, subReason: '', reasonNote: '', images: [], exchangeSelection: null })
        setExpanded((prev) => ({ ...prev, [item.line_item_id]: true }))
    }

    const toggleExpanded = (item) => {
        const sel = getSelection(item.line_item_id)
        if (!sel.selected) return
        setExpanded((prev) => ({ ...prev, [item.line_item_id]: !prev[item.line_item_id] }))
    }

    const setMode = (item, mode) => {
        const reasons = getReasons(item, mode)
        updateSelection(item.line_item_id, { mode, reasonId: reasons[0]?.reason?.id ?? null, subReason: '', exchangeSelection: null })
    }

    const setReason = (item, reasonId) => {
        updateSelection(item.line_item_id, { reasonId: Number(reasonId), subReason: '', images: [] })
    }

    const selectedItems = orderData.filter((item) => getSelection(item.line_item_id).selected)
    const selectedCount = selectedItems.length
    const returnValue = selectedItems.reduce((acc, item) => acc + (parseFloat(item.price) || 0) * (item.quantity || 1), 0)

    const isItemComplete = (item) => {
        const sel = getSelection(item.line_item_id)
        if (!sel.selected) return true
        const reasons = getReasons(item, sel.mode)
        const selectedReason = reasons.find((r) => r.reason?.id === sel.reasonId)
        const minRequired = minRequiredFor(selectedReason)
        const imagesOk = minRequired === 0 || sel.images.filter(Boolean).length >= minRequired
        const exchangeOk = sel.mode !== 'Exchange' || Boolean(sel.exchangeSelection)
        return imagesOk && exchangeOk
    }

    const canContinue = selectedCount > 0 && selectedItems.every(isItemComplete)

    const onBack = () => router.push('/orderLookup')

    const onContinue = () => {
        if (!canContinue) return

        const nextSelectedItemsList = selectedItems.map((item) => {
            const sel = getSelection(item.line_item_id)
            const isExchange = sel.mode === 'Exchange'
            return {
                qty: String(item.quantity || 1),
                reasonId: sel.reasonId,
                reasonNote: sel.reasonNote || '',
                subReason: sel.subReason || '',
                images: sel.images.filter(Boolean),
                lineItemId: item.line_item_id,
                variantId: item.variant_id,
                productId: item.product_id,
                exchangeOrReturn: sel.mode,
                newVariantId: isExchange ? sel.exchangeSelection?.newVariantId : null,
                newProductId: isExchange ? sel.exchangeSelection?.newProductId : null,
                newVariantDescription: isExchange ? sel.exchangeSelection?.newVariantDescription : null,
                incentive: null,
                _display: {
                    name: isExchange ? (sel.exchangeSelection?.newName || item.product_name) : item.product_name,
                    price: isExchange ? (sel.exchangeSelection?.newPrice ?? item.price) : item.price,
                    thumb: isExchange ? (sel.exchangeSelection?.newImage || item.product_image) : item.product_image,
                    qty: item.quantity || 1,
                    originalPrice: item.price,
                },
            }
        })

        setSelectedItemsList(nextSelectedItemsList)
        router.push('/chooseRefund')
    }

    const StatusChip = ({ item }) => {
        const sel = getSelection(item.line_item_id)
        if (!sel.selected) {
            return <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#f5f6fa] text-[#9aa8a0] font-['Inter'] text-[11px] font-semibold whitespace-nowrap">Not selected</div>
        }
        if (isItemComplete(item)) {
            return <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#eef2ff] text-[#4338CA] font-['Inter'] text-[11px] font-semibold whitespace-nowrap">Ready</div>
        }
        return <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#fff7ed] text-[#9a5b0c] font-['Inter'] text-[11px] font-semibold whitespace-nowrap">Needs detail</div>
    }

    const ItemRow = ({ item }) => {
        const sel = getSelection(item.line_item_id)
        const isExpanded = sel.selected && Boolean(expanded[item.line_item_id])
        const reasons = getReasons(item, sel.mode)
        const selectedReason = reasons.find((r) => r.reason?.id === sel.reasonId)
        const canReturn = item.return_allowed !== false
        const canExchange = item.exchange_allowed !== false
        const minRequired = minRequiredFor(selectedReason)
        const priceDiff = sel.exchangeSelection ? (parseFloat(sel.exchangeSelection.newPrice) || 0) - (parseFloat(item.price) || 0) : null
        const modeLabel = !sel.selected ? '—' : sel.mode === 'Exchange' ? 'Exchange selected' : 'Return selected'
        const hasRightContent = Boolean(selectedReason?.store_reasons?.length > 0 || selectedReason?.subreasons_free_text || minRequired > 0 || selectedReason?.image_requirements?.length > 0)

        return (
            <div className={`border-b border-[#e3e5f0] last:border-b-0 ${!sel.selected ? 'opacity-60' : ''}`}>
                <div
                    onClick={() => (sel.selected ? toggleExpanded(item) : toggleSelected(item))}
                    className="flex items-center gap-3 lg:gap-4 px-4 lg:px-5 py-3.5 lg:py-4 cursor-pointer hover:bg-[#fafbfa] transition-colors"
                >
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleSelected(item) }}
                        className={`size-5 flex shrink-0 justify-center items-center rounded-[6px] border-2 ${sel.selected ? 'bg-[#4338CA] border-[#4338CA]' : 'bg-white border-[#d3d7ea]'}`}
                        aria-label={sel.selected ? 'Deselect item' : 'Select item'}
                    >
                        {sel.selected && (
                            <svg className="size-3 text-white" stroke="currentColor" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        )}
                    </button>

                    <div
                        className="size-11 lg:size-12 shrink-0 bg-cover bg-center rounded-[10px] bg-[#eef0fa]"
                        style={item.product_image ? { backgroundImage: `url('${item.product_image}')` } : undefined}
                    ></div>

                    <div className="flex flex-col flex-1 min-w-0 gap-1">
                        <div className="text-[#0f172a] font-['Inter'] text-sm font-semibold leading-[1.3] truncate">{item.product_name}</div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 lg:hidden">
                            <div className="text-[#55655c] font-['Inter'] text-[12.5px]">{currencySymbol(currency)}{parseFloat(item.price || 0).toFixed(2)} · Qty {item.quantity || 1}</div>
                            <StatusChip item={item} />
                        </div>
                        <div className="hidden lg:block text-[#55655c] font-['Inter'] text-[12.5px]">Qty {item.quantity || 1}</div>
                    </div>

                    <div className="hidden lg:block w-[110px] shrink-0 text-[#55655c] font-['Inter'] text-[13px]">{orderDetails?.order_created_date || '—'}</div>
                    <div className="hidden lg:block w-[90px] shrink-0 text-[#0f172a] font-['Inter'] text-[13.5px]">{currencySymbol(currency)}{parseFloat(item.price || 0).toFixed(2)}</div>
                    <div className="hidden lg:block w-[110px] shrink-0"><StatusChip item={item} /></div>
                    <div className="hidden lg:block w-[140px] shrink-0 text-[#55655c] font-['Inter'] text-[13px] truncate">{modeLabel}</div>

                    <div className={`size-4 shrink-0 text-[#9aa8a0] transition-transform ${isExpanded ? 'rotate-180' : ''} ${!sel.selected ? 'invisible' : ''}`}>
                        <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                </div>

                {isExpanded && (
                    <div className="bg-[#fbfaf6] border-t border-[#e3e5f0] px-4 lg:px-6 py-5 lg:py-6">
                        <div className={`grid grid-cols-1 gap-6 lg:gap-10 ${hasRightContent ? 'lg:grid-cols-2' : ''}`}>
                            <div className="flex flex-col gap-5">
                                {(canReturn && canExchange) && (
                                    <div className="flex w-full flex-col gap-2">
                                        <div className="text-[#0f172a] font-['Inter'] text-xs font-semibold uppercase tracking-[0.04em]">What would you like?</div>
                                        <div className="flex w-full gap-2.5">
                                            <button type="button" onClick={() => setMode(item, 'Return')} className={`flex h-fit items-center justify-center flex-1 rounded-xl px-3 py-3 gap-2 ${sel.mode === 'Return' ? 'bg-[#4338CA] border-2 border-[#4338CA]' : 'bg-white border border-[#e3e5f0]'}`}>
                                                <svg className={`size-[18px] ${sel.mode === 'Return' ? 'text-white' : 'text-[#55655c]'}`} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><polyline points="9 14 4 9 9 4"></polyline><path d="M20 20v-7a4 4 0 0 0-4-4H4"></path></svg>
                                                <div className={`font-['Inter'] text-[13.5px] ${sel.mode === 'Return' ? 'text-white font-semibold' : 'text-[#55655c] font-medium'}`}>Return</div>
                                            </button>
                                            <button type="button" onClick={() => setMode(item, 'Exchange')} className={`flex h-fit items-center justify-center flex-1 rounded-xl px-3 py-3 gap-2 ${sel.mode === 'Exchange' ? 'bg-[#4338CA] border-2 border-[#4338CA]' : 'bg-white border border-[#e3e5f0]'}`}>
                                                <svg className={`size-[18px] ${sel.mode === 'Exchange' ? 'text-white' : 'text-[#55655c]'}`} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                                                <div className={`font-['Inter'] text-[13.5px] ${sel.mode === 'Exchange' ? 'text-white font-semibold' : 'text-[#55655c] font-medium'}`}>Exchange</div>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {sel.mode === 'Exchange' && (
                                    sel.exchangeSelection ? (
                                        <div className="flex w-full flex-col gap-2.5 bg-white border border-[#e3e5f0] rounded-2xl p-3">
                                            <div className="flex items-center gap-3">
                                                <div className="size-12 shrink-0 rounded-[10px] bg-[#eef0fa] bg-cover bg-center" style={sel.exchangeSelection.newImage ? { backgroundImage: `url('${sel.exchangeSelection.newImage}')` } : undefined}></div>
                                                <div className="flex flex-col flex-1 gap-0.5">
                                                    <div className="text-[#0f172a] font-['Inter'] text-[13px] font-semibold leading-[1.3]">{sel.exchangeSelection.newName}</div>
                                                    <div className="text-[#55655c] font-['Inter'] text-xs">{sel.exchangeSelection.newVariantDescription}</div>
                                                </div>
                                                <button type="button" onClick={() => setExchangeModalItem(item)} className="shrink-0 text-[#4338CA] font-['Inter'] text-xs font-semibold underline">Change</button>
                                            </div>
                                            {typeof priceDiff === 'number' && priceDiff !== 0 && (
                                                <div className="flex justify-between items-center pt-2 border-t border-[#e3e5f0]">
                                                    <div className="text-[#55655c] font-['Inter'] text-xs">{priceDiff > 0 ? 'Extra to pay at checkout' : 'Credited back to you'}</div>
                                                    <div className="text-[#0f172a] font-['Inter'] text-xs font-semibold">{currencySymbol(currency)}{Math.abs(priceDiff).toFixed(2)}</div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setExchangeModalItem(item)}
                                            className="flex w-full h-[46px] justify-center items-center bg-white border-2 border-dashed border-[#a5b4fc] rounded-xl gap-2 text-[#4338CA]"
                                        >
                                            <svg className="size-4" stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                                            <div className="font-['Inter'] text-sm font-semibold">Choose an item to exchange for</div>
                                        </button>
                                    )
                                )}

                                {reasons.length > 0 && (
                                    <div className="flex w-full flex-col gap-2">
                                        <div className="text-[#0f172a] font-['Inter'] text-xs font-semibold uppercase tracking-[0.04em]">Why are you returning this?</div>
                                        <div className="flex flex-col gap-2">
                                            {reasons.map((r) => {
                                                const checked = sel.reasonId === r.reason.id
                                                return (
                                                    <button
                                                        type="button"
                                                        key={r.reason.id}
                                                        onClick={() => setReason(item, r.reason.id)}
                                                        className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${checked ? 'bg-[#eef2ff] border-[#4338CA]' : 'bg-white border-[#e3e5f0] hover:border-[#a5b4fc]'}`}
                                                    >
                                                        <span className={`size-[18px] shrink-0 rounded-[5px] border-[1.5px] flex items-center justify-center ${checked ? 'bg-[#4338CA] border-[#4338CA]' : 'bg-white border-[#c7cadf]'}`}>
                                                            {checked && (
                                                                <svg className="size-3 text-white" stroke="currentColor" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                            )}
                                                        </span>
                                                        <span className={`font-['Inter'] text-[13.5px] ${checked ? 'text-[#0f172a] font-semibold' : 'text-[#55655c] font-medium'}`}>{r.reason.name}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {hasRightContent && (
                            <div className="flex flex-col gap-5 lg:border-l lg:border-[#e3e5f0] lg:pl-10">
                                {selectedReason?.store_reasons?.length > 0 && (
                                    <div className="flex w-full flex-col gap-2">
                                        <div className="text-[#0f172a] font-['Inter'] text-xs font-semibold">More detail</div>
                                        <select
                                            value={sel.subReason}
                                            onChange={(e) => updateSelection(item.line_item_id, { subReason: e.target.value })}
                                            className="flex w-full h-[46px] items-center bg-white border rounded-xl px-3.5 py-0 border-[#e3e5f0] text-[#0f172a] font-['Inter'] text-sm outline-none"
                                        >
                                            <option value="">Select one</option>
                                            {selectedReason.store_reasons.map((sr) => (
                                                <option key={sr.id} value={sr.name}>{sr.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {selectedReason?.subreasons_free_text && (
                                    <div className="flex w-full flex-col gap-2">
                                        <div className="flex flex-wrap items-baseline gap-x-[3px] text-[#0f172a] text-xs font-semibold">
                                            <div className="text-[#0f172a] font-['Inter'] text-xs font-semibold">Add a note</div>
                                            <div className="text-[#9aa8a0] font-['Inter'] text-xs">{selectedReason.subreasons_free_text_optional ? '(optional)' : ''}</div>
                                        </div>
                                        <textarea
                                            value={sel.reasonNote}
                                            onChange={(e) => updateSelection(item.line_item_id, { reasonNote: e.target.value })}
                                            placeholder="Tell us a little more…"
                                            className="flex w-full h-16 bg-white border rounded-xl px-3.5 py-2.5 border-[#e3e5f0] text-[#0f172a] font-['Inter'] text-sm outline-none resize-none placeholder:text-[#9aa8a0]"
                                        ></textarea>
                                    </div>
                                )}

                                {(minRequired > 0 || (selectedReason?.image_requirements?.length > 0)) && (
                                    <ImageUploader
                                        requirements={selectedReason?.image_requirements || []}
                                        minRequired={minRequired}
                                        images={sel.images}
                                        onChange={(images) => updateSelection(item.line_item_id, { images })}
                                        storeConfigData={storeConfigData}
                                        reasonId={sel.reasonId}
                                        productName={item.product_name}
                                    />
                                )}
                            </div>
                            )}
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setExpanded((prev) => ({ ...prev, [item.line_item_id]: false })) }}
                                className="bg-[#4338CA] text-white rounded-[10px] px-5 py-2.5 font-['Inter'] text-[13.5px] font-semibold"
                            >
                                Got it, save this
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    if (!orderDetails) return null

    return (
        <div className="w-full flex flex-col min-h-screen">
            <TopBar orderNumber={`Order ${orderDetails.order_number || ''}`} placedDate={orderDetails.order_created_date} />
            <div className="w-full flex-1 flex justify-center px-5 lg:px-8 pt-4 lg:pt-8 pb-24 lg:pb-14">
                <div className="w-full max-w-[1120px] flex flex-col gap-4 font-['Inter']">
                    <div className="flex h-fit shrink-0 items-center px-0 py-3">
                        <StepIndicator current={1} />
                    </div>

                    <div className="flex flex-wrap items-end justify-between gap-3 mt-1">
                        <div className="flex flex-col gap-2">
                            <div className="text-[#0f172a] font-['Space_Grotesk'] text-2xl lg:text-3xl font-bold tracking-[-0.6px] leading-tight">Which items are you sending back?</div>
                            <div className="text-[#55655c] font-['Inter'] text-sm">Pick what&apos;s going, tell us why, and we&apos;ll sort the fastest way to make it right.</div>
                        </div>
                        <div className="flex flex-col bg-white border rounded-full px-3.5 py-1.5 border-[#e3e5f0] shrink-0">
                            <div className="text-[#0f172a] font-['Inter'] text-xs font-semibold">Order {orderDetails.order_number}</div>
                        </div>
                    </div>

                    <div className="flex w-full h-fit shrink-0 items-start mt-1 mb-0 bg-[#fff7ed] border rounded-[14px] px-3.5 py-3 mx-0 gap-2.5 border-[#fed7aa]">
                        <div className="size-4 flex flex-col shrink-0 mt-px mb-0 text-[#d97706] mx-0">
                            <svg stroke="rgb(217, 119, 6)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                        </div>
                        <div className="text-[#9a5b0c] font-['Inter'] text-xs">You&apos;ve got 30 days from delivery to send things back, as long as they&apos;re in original condition — just tick off what&apos;s going.</div>
                    </div>

                    {orderData.length === 0 ? (
                        <div className="text-[#55655c] font-['Inter'] text-sm p-4">Hmm, we couldn&apos;t find anything returnable on this order.</div>
                    ) : (
                        <div className="w-full bg-white border border-[#e3e5f0] rounded-2xl overflow-hidden mt-1">
                            <div className="hidden lg:flex items-center gap-4 px-5 py-3 bg-[#f5f6fa] border-b border-[#e3e5f0]">
                                <div className="size-5 shrink-0"></div>
                                <div className="size-12 shrink-0"></div>
                                <div className="flex-1 text-[#55655c] font-['Inter'] text-[11px] font-semibold uppercase tracking-[0.06em]">Product</div>
                                <div className="w-[110px] shrink-0 text-[#55655c] font-['Inter'] text-[11px] font-semibold uppercase tracking-[0.06em]">Order date</div>
                                <div className="w-[90px] shrink-0 text-[#55655c] font-['Inter'] text-[11px] font-semibold uppercase tracking-[0.06em]">Price</div>
                                <div className="w-[110px] shrink-0 text-[#55655c] font-['Inter'] text-[11px] font-semibold uppercase tracking-[0.06em]">Status</div>
                                <div className="w-[140px] shrink-0 text-[#55655c] font-['Inter'] text-[11px] font-semibold uppercase tracking-[0.06em]">Details</div>
                                <div className="size-4 shrink-0"></div>
                            </div>
                            {orderData.map((item) => <ItemRow key={item.line_item_id} item={item} />)}
                        </div>
                    )}

                    <div className="hidden lg:flex items-center justify-between gap-4 mt-2 pb-2">
                        <div className="flex items-center gap-2 text-[#55655c] font-['Inter'] text-[13px]">
                            <svg className="size-4 shrink-0 text-[#4338CA]" stroke="rgb(67, 56, 202)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                            <span>Good news — <b className="text-[#0f172a]">return shipping&apos;s on us</b>. <b className="text-[#0f172a]">{selectedCount}</b> item{selectedCount === 1 ? '' : 's'} picked, worth <b className="text-[#0f172a]">{currencySymbol(currency)}{returnValue.toFixed(2)}</b></span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={onBack} className="flex h-[46px] justify-center items-center bg-white border rounded-[13px] px-5 gap-2 border-[#e3e5f0]">
                                <svg className="size-4 text-[#55655c]" stroke="rgb(85, 101, 92)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                                <div className="text-[#55655c] font-['Inter'] text-sm font-semibold">Back</div>
                            </button>
                            <button
                                type="button"
                                disabled={!canContinue}
                                onClick={onContinue}
                                className={`flex h-[46px] justify-center items-center rounded-[13px] px-6 gap-2 ${canContinue ? 'bg-[linear-gradient(90deg,_rgb(67,_56,_202)_0%,_rgb(99,_102,_241)_100%)] shadow-[0px_6px_16px_rgba(67,56,202,0.28)]' : 'bg-[#c7cadf] cursor-not-allowed'}`}
                            >
                                <div className="text-white font-['Inter'] text-[15px] font-semibold">On to your refund</div>
                                <svg className="size-4 text-white" stroke="rgb(255, 255, 255)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex lg:hidden fixed w-full max-w-[440px] h-fit shrink-0 items-center left-1/2 -translate-x-1/2 bottom-0 z-10 bg-white border-t shadow-[0px_-6px_20px_rgba(15,42,30,0.06)] px-5 py-3.5 gap-3 border-t-[#e3e5f0]">
                <div className="flex flex-col gap-px">
                    <div className="text-[#0f172a] font-['Inter'] text-[15px] font-bold">{selectedCount} item{selectedCount === 1 ? '' : 's'}</div>
                    <div className="text-[#55655c] font-['Inter'] text-[11px]">selected</div>
                </div>
                <button
                    type="button"
                    disabled={!canContinue}
                    onClick={onContinue}
                    className={`flex h-[50px] justify-center items-center flex-1 rounded-[13px] gap-2 ${canContinue ? 'bg-[linear-gradient(90deg,_rgb(67,_56,_202)_0%,_rgb(99,_102,_241)_100%)] shadow-[0px_6px_16px_rgba(67,56,202,0.28)]' : 'bg-[#c7cadf] cursor-not-allowed'}`}
                >
                    <div className="text-white font-['Inter'] text-[15px] font-semibold">Let&apos;s go</div>
                    <svg className="size-4 text-white" stroke="rgb(255, 255, 255)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
            </div>

            <ExchangeModal
                open={Boolean(exchangeModalItem)}
                onClose={() => setExchangeModalItem(null)}
                item={exchangeModalItem ? { ...exchangeModalItem, _display: { price: exchangeModalItem.price, currency } } : null}
                orderDetails={orderDetails}
                storeConfigData={storeConfigData}
                accessCode={accessCode}
                onConfirm={(selection) => {
                    if (exchangeModalItem) updateSelection(exchangeModalItem.line_item_id, { exchangeSelection: selection })
                }}
            />
        </div>
    )
}
