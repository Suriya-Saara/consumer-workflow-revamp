'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/TopBar'
import StepIndicator from '@/components/StepIndicator'
import { useAppData } from '@/contexts/AppDataContext'
import { api, getEndpoints } from '@/lib/api'
import { buildRequestPayload } from '@/lib/payload'

const currencySymbol = (currency) => (currency === 'INR' || !currency ? '₹' : currency + ' ')

export default function ChooseRefund() {
    const router = useRouter()
    const { orderDetails, storeConfigData, customerInfo, accessCode, selectedItemsList, setRefundPaymentAccountInfo, paymentInfo, setPaymentInfo } = useAppData()

    const [method, setMethod] = useState('original_payment_method')
    const [accountNumber, setAccountNumber] = useState('')
    const [beneficiaryName, setBeneficiaryName] = useState('')
    const [ifscOrUpi, setIfscOrUpi] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const currency = orderDetails?.currency

    useEffect(() => {
        if (!orderDetails || selectedItemsList.length === 0) {
            router.replace('/selectItems')
        }
    }, [orderDetails, selectedItemsList, router])

    useEffect(() => {
        if (!orderDetails || selectedItemsList.length === 0) return
        let cancelled = false
        const fetchEstimate = async () => {
            setLoading(true)
            setError('')
            try {
                const payload = buildRequestPayload({
                    selectedItemsList,
                    orderDetails,
                    storeConfigData,
                    customerInfo,
                    accessCode,
                    paymentMethod: method,
                    refundPaymentAccountInfo: { accountNumber, beneficiaryName, ifsc: ifscOrUpi, upiId: ifscOrUpi },
                })
                const { PaymentInfoEndpoint } = getEndpoints(storeConfigData?.platform)
                const response = await api.post(`/${PaymentInfoEndpoint}/`, payload)
                if (!cancelled) setPaymentInfo(response.data)
            } catch (err) {
                if (!cancelled) setError(err.response?.data?.message || 'Could not calculate refund estimate.')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        fetchEstimate()
        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [method, orderDetails, selectedItemsList])

    const canContinue = Boolean(method) && !loading
    const onBack = () => router.push('/selectItems')
    const onContinue = () => {
        if (!canContinue) return
        setRefundPaymentAccountInfo({ paymentMethod: method, accountNumber, beneficiaryName, ifsc: ifscOrUpi, upiId: ifscOrUpi })
        router.push('/reviewRequest')
    }

    const itemValue = selectedItemsList
        .filter((i) => i.exchangeOrReturn === 'Return' || i.exchangeOrReturn === 'Return To Store')
        .reduce((acc, i) => acc + (parseFloat(i._display?.price) || 0) * (parseInt(i.qty, 10) || 1), 0)

    const totalReturnRefund = paymentInfo?.total_return_refund
    const bonusAmount = typeof totalReturnRefund === 'number' ? Math.max(0, totalReturnRefund - itemValue) : itemValue * 0.15

    const estimateLabel = loading
        ? 'Calculating…'
        : method === 'store_credit_additional_bonus'
        ? `${currencySymbol(currency)}${(typeof totalReturnRefund === 'number' ? totalReturnRefund : itemValue + bonusAmount).toFixed(2)} store credit`
        : method === 'store_credit'
        ? `${currencySymbol(currency)}${(typeof totalReturnRefund === 'number' ? totalReturnRefund : itemValue).toFixed(2)} store credit`
        : `${currencySymbol(currency)}${(typeof totalReturnRefund === 'number' ? totalReturnRefund : itemValue).toFixed(2)} to original payment`

    const radioDot = (active, gradient = true) => (
        <div className={`size-[22px] flex shrink-0 justify-center items-center rounded-full mt-px mb-0 mx-0 ${active ? (gradient ? 'bg-[linear-gradient(135deg,_rgb(67,_56,_202)_0%,_rgb(99,_102,_241)_100%)]' : '') : 'bg-white border-2 border-[#d3d7ea]'}`}>
            {active && <div className="size-2 flex flex-col bg-white rounded-full"></div>}
        </div>
    )

    if (!orderDetails || selectedItemsList.length === 0) return null

    return (
        <div className="w-full flex flex-col min-h-screen">
            <TopBar orderNumber={`Order ${orderDetails.order_number || ''}`} />
            <div className="w-full flex-1 flex justify-center px-5 lg:px-8 pt-4 lg:pt-8 pb-24 lg:pb-14">
                <div data-node-id="pen" data-node-label="Page - Choose Refund" className="w-full max-w-[440px] lg:max-w-none lg:flex lg:justify-center lg:items-start lg:gap-8 font-['Inter']">
                    <div className="flex w-full lg:w-[680px] lg:shrink-0 h-fit flex-col gap-4">
                        <div className="flex h-fit shrink-0 items-center px-0 py-3">
                            <StepIndicator current={2} />
                        </div>
                        <div className="flex h-fit flex-col shrink-0 mt-1 mb-2 mx-0 gap-1.5">
                            <div className="text-[#0f172a] font-['Space_Grotesk'] text-2xl lg:text-3xl font-bold tracking-[-0.6px] leading-tight">How would you like to get paid back?</div>
                            <div className="text-[#55655c] font-['Inter'] text-sm">Pick whatever works best for you — a couple of options even come with a little bonus.</div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={() => setMethod('store_credit_additional_bonus')}
                                className={`flex w-full h-fit flex-col text-left rounded-[18px] p-0.5 ${method === 'store_credit_additional_bonus' ? 'bg-[linear-gradient(135deg,_rgb(124,_58,_237)_0%,_rgb(168,_85,_247)_100%)] shadow-[0px_10px_28px_rgba(124,58,237,0.22)]' : 'bg-[#e3e5f0]'}`}
                            >
                                <div className="flex w-full flex-col bg-white rounded-2xl p-4 gap-2.5">
                                    <div className="flex w-full items-start gap-3">
                                        <div className={`size-[22px] flex shrink-0 justify-center items-center mt-px mb-0 rounded-full mx-0 ${method === 'store_credit_additional_bonus' ? 'bg-[linear-gradient(135deg,_rgb(124,_58,_237)_0%,_rgb(168,_85,_247)_100%)]' : 'bg-white border-2 border-[#d3d7ea]'}`}>
                                            {method === 'store_credit_additional_bonus' && (
                                                <svg className="size-[13px] text-white" stroke="rgb(255, 255, 255)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            )}
                                        </div>
                                        <div className="flex flex-col flex-1 gap-1">
                                            <div className="flex items-center gap-2">
                                                <div className="text-[#0f172a] font-['Inter'] text-[15px] font-bold">Store Credit + Bonus</div>
                                                <div className="flex items-center bg-[#f3eefe] rounded-full px-[7px] py-0.5 gap-[3px]">
                                                    <svg className="size-2.5 text-[#7c3aed]" stroke="rgb(124, 58, 237)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                                    <div className="text-[#7c3aed] font-['Inter'] text-[10px] font-bold tracking-[0.25px] uppercase">Best value</div>
                                                </div>
                                            </div>
                                            <div className="text-[#7c3aed] font-['Inter'] text-[15px] font-bold">Get {currencySymbol(currency)}{(itemValue + bonusAmount).toFixed(2)} in store credit</div>
                                            <div className="text-[#55655c] font-['Inter'] text-xs">Your full refund value plus an extra bonus, ready to spend instantly.</div>
                                        </div>
                                    </div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setMethod('store_credit')}
                                className={`flex w-full h-fit items-start bg-white rounded-2xl p-4 gap-3 text-left ${method === 'store_credit' ? 'border-2 border-[#4338CA]' : 'border border-[#e3e5f0]'}`}
                            >
                                {radioDot(method === 'store_credit')}
                                <div className="flex flex-col flex-1 gap-[3px]">
                                    <div className="text-[#0f172a] font-['Inter'] text-[15px] font-semibold">Store Credit</div>
                                    <div className="text-[#55655c] font-['Inter'] text-xs">Refunded as store credit within 5–6 days of approval.</div>
                                </div>
                            </button>

                            <div className={`flex w-full h-fit flex-col bg-white rounded-2xl overflow-clip ${method === 'original_payment_method' ? 'shadow-[0px_6px_18px_rgba(67,56,202,0.1)] border-2 border-[#4338CA]' : 'border border-[#e3e5f0]'}`}>
                                <button type="button" onClick={() => setMethod('original_payment_method')} className="flex w-full items-start p-4 gap-3 text-left">
                                    {radioDot(method === 'original_payment_method')}
                                    <div className="flex flex-col flex-1 gap-[3px]">
                                        <div className="flex items-center gap-2">
                                            <div className="text-[#0f172a] font-['Inter'] text-[15px] font-semibold">Original Payment Method</div>
                                            <div className="flex items-center bg-[#e0e7ff] rounded-full px-[7px] py-0.5 gap-[3px]">
                                                <svg className="size-2.5 text-[#4338CA]" stroke="rgb(67, 56, 202)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                                                <div className="text-[#4338CA] font-['Inter'] text-[10px] font-bold tracking-[0.25px] uppercase">Fastest</div>
                                            </div>
                                        </div>
                                        <div className="text-[#55655c] font-['Inter'] text-xs">Credited back to your original card within 5–6 days.</div>
                                    </div>
                                </button>
                                {method === 'original_payment_method' && orderDetails?.payment_method === 'cod' && (
                                    <div className="flex w-full flex-col pt-3.5 pb-4 bg-[#f5f6fe] border-t px-4 gap-2.5 border-t-[#e3e5f0]">
                                        <div className="flex items-center gap-2">
                                            <svg className="size-[15px] text-[#4338CA]" stroke="rgb(67, 56, 202)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                                            <div className="text-[#0f172a] font-['Inter'] text-xs font-semibold">Bank details for COD refund</div>
                                        </div>
                                        <input
                                            value={beneficiaryName}
                                            onChange={(e) => setBeneficiaryName(e.target.value)}
                                            placeholder="Beneficiary name"
                                            className="flex w-full h-[46px] items-center bg-white border rounded-xl px-3.5 py-0 border-[#e3e5f0] text-[#0f172a] font-['Inter'] text-sm outline-none placeholder:text-[#9aa8a0]"
                                        />
                                        <input
                                            value={accountNumber}
                                            onChange={(e) => setAccountNumber(e.target.value)}
                                            placeholder="Account number"
                                            className="flex w-full h-[46px] items-center bg-white border rounded-xl px-3.5 py-0 border-[#e3e5f0] text-[#0f172a] font-['Inter'] text-sm outline-none placeholder:text-[#9aa8a0]"
                                        />
                                        <input
                                            value={ifscOrUpi}
                                            onChange={(e) => setIfscOrUpi(e.target.value)}
                                            placeholder="IFSC / UPI ID"
                                            className="flex w-full h-[46px] items-center bg-white border rounded-xl px-3.5 py-0 border-[#e3e5f0] text-[#0f172a] font-['Inter'] text-sm outline-none placeholder:text-[#9aa8a0]"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        {error && (
                            <div className="flex w-full items-start bg-[#fef2f2] border rounded-[10px] px-3.5 py-2.5 gap-2 border-[#fecaca]">
                                <div className="text-[#b91c1c] font-['Inter'] text-xs leading-normal">{error}</div>
                            </div>
                        )}
                    </div>

                    <div className="hidden lg:flex w-[360px] h-fit flex-col shrink-0 gap-4 sticky top-8">
                        <div className="flex w-full flex-col bg-white border shadow-[0px_8px_24px_rgba(15,42,30,0.05)] rounded-2xl p-5 gap-4 border-[#e3e5f0]">
                            <div className="text-[#0f172a] font-['Space_Grotesk'] text-lg font-bold tracking-[-0.3px]">Your return</div>
                            <div className="flex flex-col gap-3">
                                {selectedItemsList.map((item) => (
                                    <div key={item.lineItemId} className="flex items-center gap-3">
                                        <div className="size-11 flex flex-col shrink-0 bg-cover bg-no-repeat rounded-[10px] bg-[#eef0fa]" style={item._display?.thumb ? { backgroundImage: `url('${item._display.thumb}')` } : undefined}></div>
                                        <div className="flex flex-col flex-1 gap-px">
                                            <div className="text-[#0f172a] font-['Inter'] text-[13px] font-semibold leading-[1.3]">{item._display?.name}</div>
                                            <div className="text-[#55655c] font-['Inter'] text-xs">{currencySymbol(currency)}{parseFloat(item._display?.price || 0).toFixed(2)} · Qty {item._display?.qty}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex w-full h-px flex-col bg-[#e3e5f0]"></div>
                            <div className="flex flex-col gap-1">
                                <div className="text-[#55655c] font-['Inter'] text-[11px] font-medium tracking-[0.25px] uppercase">You'll receive</div>
                                <div className="text-[#0f172a] font-['Space_Grotesk'] text-xl font-bold tracking-[-0.4px]">{estimateLabel}</div>
                            </div>
                            <button
                                type="button"
                                disabled={!canContinue}
                                onClick={onContinue}
                                className={`flex w-full h-[52px] justify-center items-center rounded-[13px] gap-2 ${canContinue ? 'bg-[linear-gradient(90deg,_rgb(67,_56,_202)_0%,_rgb(99,_102,_241)_100%)] shadow-[0px_6px_16px_rgba(67,56,202,0.28)]' : 'bg-[#c7cadf] cursor-not-allowed'}`}
                            >
                                <div className="text-white font-['Inter'] text-[15px] font-semibold">Review my request</div>
                                <svg className="size-4 text-white" stroke="rgb(255, 255, 255)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                            </button>
                            <button type="button" onClick={onBack} className="flex w-full h-[46px] justify-center items-center bg-white border rounded-[13px] gap-2 border-[#e3e5f0]">
                                <svg className="size-4 text-[#55655c]" stroke="rgb(85, 101, 92)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                                <div className="text-[#55655c] font-['Inter'] text-sm font-semibold">Back to items</div>
                            </button>
                        </div>
                        <div className="flex w-full items-center bg-[#eef2ff] border rounded-2xl p-4 gap-3 border-[#a5b4fc]">
                            <svg className="size-5 shrink-0 text-[#4338CA]" stroke="rgb(67, 56, 202)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                            <div className="text-[#3730a3] font-['Inter'] text-xs leading-[1.4]">Store credit is issued the moment we scan your return at the warehouse — no waiting on your bank.</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex lg:hidden fixed w-full max-w-[440px] h-fit shrink-0 items-center left-1/2 -translate-x-1/2 bottom-0 z-10 bg-white border-t shadow-[0px_-6px_20px_rgba(15,42,30,0.06)] px-5 py-3.5 gap-3 border-t-[#e3e5f0]">
                <button type="button" onClick={onBack} className="flex h-[50px] shrink-0 justify-center items-center bg-white border rounded-[13px] px-[18px] py-0 gap-1.5 border-[#e3e5f0]">
                    <svg className="size-[15px] text-[#55655c]" stroke="rgb(85, 101, 92)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    <div className="text-[#55655c] font-['Inter'] text-sm font-semibold">Back</div>
                </button>
                <button
                    type="button"
                    disabled={!canContinue}
                    onClick={onContinue}
                    className={`flex h-[50px] justify-center items-center flex-1 rounded-[13px] gap-2 ${canContinue ? 'bg-[linear-gradient(90deg,_rgb(67,_56,_202)_0%,_rgb(99,_102,_241)_100%)] shadow-[0px_6px_16px_rgba(67,56,202,0.28)]' : 'bg-[#c7cadf] cursor-not-allowed'}`}
                >
                    <div className="text-white font-['Inter'] text-[15px] font-semibold">Review request</div>
                    <svg className="size-4 text-white" stroke="rgb(255, 255, 255)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
            </div>
        </div>
    )
}
