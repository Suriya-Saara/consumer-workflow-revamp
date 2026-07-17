'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/TopBar'
import StepIndicator from '@/components/StepIndicator'
import { useAppData } from '@/contexts/AppDataContext'
import { api, getEndpoints } from '@/lib/api'
import { buildRequestPayload } from '@/lib/payload'

const currencySymbol = (currency) => (currency === 'INR' || !currency ? '₹' : currency + ' ')

export default function ReviewRequest() {
    const router = useRouter()
    const {
        orderDetails, storeConfigData, customerInfo, accessCode,
        selectedItemsList, refundPaymentAccountInfo, paymentInfo,
        setRequestSubmissionResponse,
    } = useAppData()

    const [openReturn, setOpenReturn] = useState(true)
    const [openRefund, setOpenRefund] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const currency = orderDetails?.currency

    const getReasonName = (item) => {
        const orderItem = (orderDetails?.order_data || []).find((oi) => oi.line_item_id === item.lineItemId)
        const reasons = orderItem?.line_item_return_reason || []
        return reasons.find((r) => r.reason?.id === item.reasonId)?.reason?.name || ''
    }

    useEffect(() => {
        if (!orderDetails || selectedItemsList.length === 0 || !refundPaymentAccountInfo) {
            router.replace('/selectItems')
        }
    }, [orderDetails, selectedItemsList, refundPaymentAccountInfo, router])

    const onBack = () => router.push('/chooseRefund')

    const onSubmit = async () => {
        if (submitting) return
        setSubmitting(true)
        setError('')
        try {
            const payload = buildRequestPayload({
                selectedItemsList,
                orderDetails,
                storeConfigData,
                customerInfo,
                accessCode,
                paymentMethod: refundPaymentAccountInfo?.paymentMethod,
                refundPaymentAccountInfo,
                forSubmit: true,
            })
            const { submitItemsEndpoint } = getEndpoints(storeConfigData?.platform)
            const response = await api.post(`/${submitItemsEndpoint}/`, payload)
            setRequestSubmissionResponse(response.data)
            router.push('/confirmation')
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Something went wrong while submitting your request.')
        } finally {
            setSubmitting(false)
        }
    }

    const chevron = (open) => (
        <svg className="size-[18px] text-[#55655c]" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} stroke="rgb(85, 101, 92)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><polyline points="18 15 12 9 6 15"></polyline></svg>
    )

    const totalReturnRefund = paymentInfo?.total_return_refund
    const totalExchangeDue = paymentInfo?.total_exchange_due
    const reverseShipping = paymentInfo?.reverse_shipment_charges
    const total = typeof totalReturnRefund === 'number' ? totalReturnRefund : selectedItemsList.reduce((acc, i) => acc + (parseFloat(i._display?.price) || 0) * (parseInt(i.qty, 10) || 1), 0)

    const refundSummary = (
        <>
            {selectedItemsList.filter((i) => i.exchangeOrReturn === 'Return' || i.exchangeOrReturn === 'Return To Store').map((item) => (
                <div key={item.lineItemId} className="flex w-full justify-between items-center">
                    <div className="text-[#55655c] font-['Inter'] text-[13px]">{item._display?.name}</div>
                    <div className="text-[#0f172a] font-['Inter'] text-[13px] font-medium">{currencySymbol(currency)}{parseFloat(item._display?.price || 0).toFixed(2)}</div>
                </div>
            ))}
            {typeof reverseShipping === 'number' && reverseShipping > 0 && (
                <div className="flex w-full justify-between items-center">
                    <div className="text-[#55655c] font-['Inter'] text-[13px]">Reverse shipping</div>
                    <div className="text-[#0f172a] font-['Inter'] text-[13px] font-medium">−{currencySymbol(currency)}{reverseShipping.toFixed(2)}</div>
                </div>
            )}
            {typeof totalExchangeDue === 'number' && totalExchangeDue > 0 && (
                <div className="flex w-full justify-between items-center">
                    <div className="text-[#55655c] font-['Inter'] text-[13px]">Exchange amount due</div>
                    <div className="text-[#0f172a] font-['Inter'] text-[13px] font-medium">{currencySymbol(currency)}{totalExchangeDue.toFixed(2)}</div>
                </div>
            )}
        </>
    )

    if (!orderDetails || selectedItemsList.length === 0 || !refundPaymentAccountInfo) return null

    return (
        <div className="w-full flex flex-col min-h-screen">
            <TopBar orderNumber={`Order ${orderDetails.order_number || ''}`} />
            <div className="w-full flex-1 flex justify-center px-5 lg:px-8 pt-4 lg:pt-8 pb-24 lg:pb-14">
                <div data-node-id="guy" data-node-label="Page - Review Request" className="w-full max-w-[440px] lg:max-w-none lg:flex lg:justify-center lg:items-start lg:gap-8 font-['Inter']">
                    <div className="flex w-full lg:w-[680px] lg:shrink-0 h-fit flex-col gap-4">
                        <div className="flex h-fit shrink-0 items-center px-0 py-3">
                            <StepIndicator current={3} />
                        </div>
                        <div className="flex h-fit flex-col shrink-0 mt-1 mb-2 mx-0 gap-1.5">
                            <div className="text-[#0f172a] font-['Space_Grotesk'] text-2xl lg:text-3xl font-bold tracking-[-0.6px] leading-tight">Just one last look</div>
                            <div className="text-[#55655c] font-['Inter'] text-sm">Make sure everything&apos;s right, then we&apos;ll get moving on it straight away.</div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="flex w-full h-fit flex-col bg-white border rounded-2xl overflow-clip border-[#e3e5f0]">
                                <button type="button" onClick={() => setOpenReturn((v) => !v)} className="flex w-full items-center px-4 py-3.5 gap-2.5 text-left">
                                    <div className="size-8 flex shrink-0 justify-center items-center bg-[#e0e7ff] rounded-[10px]">
                                        <svg className="size-4 text-[#4338CA]" stroke="rgb(67, 56, 202)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                                    </div>
                                    <div className="text-[#0f172a] font-['Inter'] text-[15px] font-semibold flex-1">Return summary</div>
                                    {chevron(openReturn)}
                                </button>
                                {openReturn && (
                                    <div className="flex w-full flex-col pt-0.5 pb-4 border-t px-4 gap-3 border-t-[#eef0f7]">
                                        {selectedItemsList.map((item) => {
                                            const isExchange = item.exchangeOrReturn === 'Exchange'
                                            const reasonName = getReasonName(item)
                                            const photoCount = (item.images || []).filter(Boolean).length
                                            return (
                                                <div key={item.lineItemId} className="flex w-full flex-col mt-3 gap-3 pb-3 border-b border-[#eef0f7] last:border-b-0 last:pb-0">
                                                    <div className="flex w-full items-center gap-3">
                                                        <div className="size-12 flex flex-col shrink-0 bg-cover bg-no-repeat rounded-[10px] bg-[#eef0fa]" style={item._display?.thumb ? { backgroundImage: `url('${item._display.thumb}')` } : undefined}></div>
                                                        <div className="flex flex-col flex-1 gap-0.5 min-w-0">
                                                            <div className="text-[#0f172a] font-['Inter'] text-sm font-semibold truncate">{item._display?.name}</div>
                                                            <div className="text-[#55655c] font-['Inter'] text-xs">Qty {item.qty} · {currencySymbol(currency)}{parseFloat(item._display?.price || 0).toFixed(2)}</div>
                                                        </div>
                                                        <div className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full font-['Inter'] text-[11px] font-semibold whitespace-nowrap ${isExchange ? 'bg-[#fdf4ff] text-[#a21caf]' : 'bg-[#eef2ff] text-[#4338CA]'}`}>{isExchange ? 'Exchange' : 'Return'}</div>
                                                    </div>
                                                    <div className="flex flex-col gap-1.5 pl-[60px]">
                                                        {reasonName && (
                                                            <div className="flex items-start gap-1.5">
                                                                <div className="text-[#9aa8a0] font-['Inter'] text-xs shrink-0 w-14">Reason</div>
                                                                <div className="text-[#0f172a] font-['Inter'] text-xs font-medium">{reasonName}{item.subReason ? ` — ${item.subReason}` : ''}</div>
                                                            </div>
                                                        )}
                                                        {item.reasonNote && (
                                                            <div className="flex items-start gap-1.5">
                                                                <div className="text-[#9aa8a0] font-['Inter'] text-xs shrink-0 w-14">Note</div>
                                                                <div className="text-[#55655c] font-['Inter'] text-xs italic leading-[1.4]">&ldquo;{item.reasonNote}&rdquo;</div>
                                                            </div>
                                                        )}
                                                        {photoCount > 0 && (
                                                            <div className="flex items-start gap-1.5">
                                                                <div className="text-[#9aa8a0] font-['Inter'] text-xs shrink-0 w-14">Photos</div>
                                                                <div className="text-[#55655c] font-['Inter'] text-xs">{photoCount} attached</div>
                                                            </div>
                                                        )}
                                                        {isExchange && item.newVariantDescription && (
                                                            <div className="flex items-start gap-1.5">
                                                                <div className="text-[#9aa8a0] font-['Inter'] text-xs shrink-0 w-14">Getting</div>
                                                                <div className="text-[#0f172a] font-['Inter'] text-xs font-medium">{item.newVariantDescription}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                            <div className="flex w-full h-fit items-center bg-white border rounded-2xl px-4 py-3.5 gap-2.5 border-[#e3e5f0]">
                                <div className="size-8 flex shrink-0 justify-center items-center bg-[#e0e7ff] rounded-[10px]">
                                    <svg className="size-4 text-[#4338CA]" stroke="rgb(67, 56, 202)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                                </div>
                                <div className="flex flex-col flex-1 gap-px">
                                    <div className="text-[#0f172a] font-['Inter'] text-[15px] font-semibold">Contact details</div>
                                    <div className="text-[#55655c] font-['Inter'] text-xs">{customerInfo?.customer_email || orderDetails?.customer_email}</div>
                                </div>
                                <button type="button" onClick={onBack} className="flex shrink-0 items-center bg-[#f5f6fa] border rounded-[9px] px-2.5 py-1.5 gap-1 border-[#e3e5f0]">
                                    <svg className="size-3 text-[#4338CA]" stroke="rgb(67, 56, 202)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                    <div className="text-[#4338CA] font-['Inter'] text-xs font-semibold">Edit</div>
                                </button>
                            </div>
                            <div className="flex lg:hidden w-full h-fit flex-col bg-white border rounded-2xl overflow-clip border-[#e3e5f0]">
                                <button type="button" onClick={() => setOpenRefund((v) => !v)} className="flex w-full items-center px-4 py-3.5 gap-2.5 text-left">
                                    <div className="size-8 flex shrink-0 justify-center items-center bg-[#e0e7ff] rounded-[10px]">
                                        <svg className="size-4 text-[#4338CA]" stroke="rgb(67, 56, 202)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                                    </div>
                                    <div className="text-[#0f172a] font-['Inter'] text-[15px] font-semibold flex-1">Refund summary</div>
                                    {chevron(openRefund)}
                                </button>
                                {openRefund && (
                                    <div className="flex w-full flex-col pt-3.5 pb-4 border-t px-4 gap-2.5 border-t-[#eef0f7]">
                                        {refundSummary}
                                        <div className="flex w-full h-px flex-col bg-[#e3e5f0] mx-0 my-0.5"></div>
                                        <div className="flex w-full justify-between items-end">
                                            <div className="text-[#0f172a] font-['Inter'] text-sm font-semibold">Total</div>
                                            <div className="text-[#4338CA] font-['Space_Grotesk'] text-2xl font-bold tracking-[-0.6px]">{currencySymbol(currency)}{total.toFixed(2)}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {error && (
                                <div className="flex w-full items-start bg-[#fef2f2] border rounded-[10px] px-3.5 py-2.5 gap-2 border-[#fecaca]">
                                    <div className="text-[#b91c1c] font-['Inter'] text-xs leading-normal">{error}</div>
                                </div>
                            )}
                            <div className="flex w-full items-center bg-[#e0e7ff] rounded-xl px-3.5 py-2.5 gap-2">
                                <svg className="size-[15px] shrink-0 text-[#4338CA]" stroke="rgb(67, 56, 202)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                <div className="text-[#3730a3] font-['Inter'] text-xs">Your credit is issued the moment we scan your return at the warehouse.</div>
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:flex w-[360px] h-fit flex-col shrink-0 gap-4 sticky top-8">
                        <div className="flex w-full flex-col bg-white border shadow-[0px_8px_24px_rgba(15,42,30,0.05)] rounded-2xl p-5 gap-4 border-[#e3e5f0]">
                            <div className="text-[#0f172a] font-['Space_Grotesk'] text-lg font-bold tracking-[-0.3px]">Refund summary</div>
                            <div className="flex flex-col gap-2.5">{refundSummary}</div>
                            <div className="flex w-full h-px flex-col bg-[#e3e5f0]"></div>
                            <div className="flex w-full justify-between items-end">
                                <div className="text-[#0f172a] font-['Inter'] text-sm font-semibold">Total</div>
                                <div className="text-[#4338CA] font-['Space_Grotesk'] text-2xl font-bold tracking-[-0.6px]">{currencySymbol(currency)}{total.toFixed(2)}</div>
                            </div>
                            <button
                                type="button"
                                onClick={onSubmit}
                                disabled={submitting}
                                className="flex w-full h-[52px] justify-center items-center bg-[linear-gradient(90deg,_rgb(67,_56,_202)_0%,_rgb(99,_102,_241)_100%)] shadow-[0px_6px_16px_rgba(67,56,202,0.28)] rounded-[13px] gap-2 disabled:opacity-70"
                            >
                                {submitting ? (
                                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <svg className="size-4 text-white" stroke="rgb(255, 255, 255)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                )}
                                <div className="text-white font-['Inter'] text-[15px] font-semibold">{submitting ? 'Sending it your way…' : 'Yes, send my return'}</div>
                            </button>
                            <button type="button" onClick={onBack} disabled={submitting} className="flex w-full h-[46px] justify-center items-center bg-white border rounded-[13px] gap-2 border-[#e3e5f0] disabled:opacity-50">
                                <svg className="size-4 text-[#55655c]" stroke="rgb(85, 101, 92)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                                <div className="text-[#55655c] font-['Inter'] text-sm font-semibold">Back to refund method</div>
                            </button>
                        </div>
                        <div className="flex w-full items-center bg-white border rounded-2xl p-4 gap-3 border-[#e3e5f0]">
                            <svg className="size-5 shrink-0 text-[#4338CA]" stroke="rgb(67, 56, 202)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            <div className="text-[#55655c] font-['Inter'] text-xs leading-[1.4]">Your details are encrypted and only used to process this return.</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex lg:hidden fixed w-full max-w-[440px] h-fit shrink-0 items-center left-1/2 -translate-x-1/2 bottom-0 z-10 bg-white border-t shadow-[0px_-6px_20px_rgba(15,42,30,0.06)] px-5 py-3.5 gap-3 border-t-[#e3e5f0]">
                <button type="button" onClick={onBack} disabled={submitting} className="flex h-[50px] shrink-0 justify-center items-center bg-white border rounded-[13px] px-[18px] py-0 gap-1.5 border-[#e3e5f0] disabled:opacity-50">
                    <svg className="size-[15px] text-[#55655c]" stroke="rgb(85, 101, 92)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    <div className="text-[#55655c] font-['Inter'] text-sm font-semibold">Back</div>
                </button>
                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={submitting}
                    className="flex h-[50px] justify-center items-center bg-[linear-gradient(90deg,_rgb(67,_56,_202)_0%,_rgb(99,_102,_241)_100%)] shadow-[0px_6px_16px_rgba(67,56,202,0.28)] flex-1 rounded-[13px] gap-2 disabled:opacity-70"
                >
                    {submitting ? (
                        <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <svg className="size-4 text-white" stroke="rgb(255, 255, 255)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    )}
                    <div className="text-white font-['Inter'] text-[15px] font-semibold">{submitting ? 'Sending it your way…' : 'Yes, send my return'}</div>
                </button>
            </div>
        </div>
    )
}
