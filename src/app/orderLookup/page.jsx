'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/TopBar'
import StepIndicator from '@/components/StepIndicator'
import { api, getEndpoints, resolveStoreUniqueId } from '@/lib/api'
import { useAppData } from '@/contexts/AppDataContext'

export default function OrderLookup() {
    const router = useRouter()
    const { setStoreConfigData, setOrderDetails, setCustomerInfo, setAccessCode } = useAppData()
    const [mode, setMode] = useState('return')
    const [orderNumber, setOrderNumber] = useState('#1094')
    const [email, setEmail] = useState('')
    const [showTooltip, setShowTooltip] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [trackRef, setTrackRef] = useState('')
    const [trackContact, setTrackContact] = useState('')
    const [trackLoading, setTrackLoading] = useState(false)

    const canContinue = orderNumber.trim().length > 0 && email.trim().length > 0 && !loading
    const canTrack = trackRef.trim().length > 0 && trackContact.trim().length > 0 && !trackLoading

    const onTrack = () => {
        if (!canTrack) return
        setTrackLoading(true)
        setTimeout(() => {
            router.push(`/trackReturn?ref=${encodeURIComponent(trackRef.trim())}&contact=${encodeURIComponent(trackContact.trim())}`)
        }, 500)
    }

    const onContinue = async () => {
        if (!canContinue) return
        setLoading(true)
        setError('')
        try {
            const storeUniqueId = await resolveStoreUniqueId()

            const configResponse = await api.get(`/${getEndpoints().storeConfigEndpoint}/${storeUniqueId}`)
            const storeConfigData = configResponse.data
            setStoreConfigData(storeConfigData)

            const { validateOrderEndpoint } = getEndpoints(storeConfigData?.platform)
            const params = new URLSearchParams(window.location.search)
            const accessCode = params.get('access_code')
            setAccessCode(accessCode)

            const orderResponse = await api.post(`/${validateOrderEndpoint}/`, {
                is_ajax: true,
                customer_email: email,
                order_number: orderNumber,
                shop: storeUniqueId,
                access_code: accessCode,
            })

            setOrderDetails(orderResponse.data)
            setCustomerInfo(orderResponse.data?.customer_data)
            router.push('/selectItems')
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'We could not find that order. Check the details and try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full flex flex-col min-h-screen">
            <TopBar />
            <div className="w-full flex-1 flex flex-col items-center px-5 lg:px-8 py-8 lg:py-14">
                <div className="w-full max-w-[1120px] flex h-fit shrink-0 items-center px-0 py-3 mb-2">
                    <StepIndicator current={0} />
                </div>
                <div className="w-full max-w-[440px] flex flex-col items-center">
                    <div data-node-id="see" data-node-label="Page - Order Lookup" className="flex w-full h-fit flex-col font-['Inter']">
                        <div className="flex w-full items-center bg-[#eef0f7] rounded-[14px] p-1 gap-1 mb-4">
                            <button
                                type="button"
                                onClick={() => setMode('return')}
                                className={`flex flex-1 h-10 justify-center items-center rounded-xl gap-1.5 transition-colors ${mode === 'return' ? 'bg-white shadow-[0px_1px_3px_rgba(15,42,30,0.08)]' : ''}`}
                            >
                                <div className={`font-['Inter'] text-[13.5px] font-semibold ${mode === 'return' ? 'text-[#0f172a]' : 'text-[#55655c]'}`}>Start a return</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('track')}
                                className={`flex flex-1 h-10 justify-center items-center rounded-xl gap-1.5 transition-colors ${mode === 'track' ? 'bg-white shadow-[0px_1px_3px_rgba(15,42,30,0.08)]' : ''}`}
                            >
                                <div className={`font-['Inter'] text-[13.5px] font-semibold ${mode === 'track' ? 'text-[#0f172a]' : 'text-[#55655c]'}`}>Track a return</div>
                                <div className="inline-flex items-center px-1.5 py-[1px] rounded-full bg-[#4338CA] text-white font-['Inter'] text-[9px] font-bold tracking-[0.03em] uppercase">Beta</div>
                            </button>
                        </div>
                        {mode === 'return' ? (
                        <div data-node-id="see.had" data-node-label="Lookup Card" className="flex flex-col mt-0 mb-0 bg-white border shadow-[0px_1px_3px_rgba(0,0,0,0.04),0px_10px_24px_rgba(15,42,30,0.06)] lg:shadow-[0px_2px_6px_rgba(0,0,0,0.04),0px_20px_44px_rgba(15,42,30,0.09)] rounded-[20px] p-6 lg:p-7 mx-0 gap-5 border-[#e3e5f0]">
                            <div className="flex w-full h-fit flex-col gap-2">
                                <div className="text-[#0f172a] font-['Space_Grotesk'] text-[26px] lg:text-[28px] font-bold leading-[1.15] tracking-[-0.65px]">Hey, let&apos;s find your order</div>
                                <div className="text-[#55655c] font-['Inter'] text-sm leading-[1.55]">Pop in your order number along with the email or mobile you used at checkout, and we&apos;ll pull it right up.</div>
                                <div className="flex items-center mt-0.5 mb-0 mx-0 gap-1.5">
                                    <div className="size-3.5 flex flex-col text-[#4338CA]">
                                        <svg stroke="rgb(67, 56, 202)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                    </div>
                                    <a href="#" className="text-[#4338CA] font-['Inter'] text-[13px] font-semibold underline decoration-black underline-offset-2">Read our return policy</a>
                                </div>
                            </div>
                            <div data-node-id="see.top" data-node-label="Order Number Field" className="flex w-full h-fit flex-col gap-1.5">
                                <label htmlFor="orderNumber" className="text-[#0f172a] font-['Inter'] text-xs font-semibold">Order number</label>
                                <div className="flex w-full h-[52px] items-center bg-[#f5f6fa] border rounded-xl px-3.5 py-0 gap-2.5 border-[#e3e5f0]">
                                    <input
                                        id="orderNumber"
                                        type="text"
                                        value={orderNumber}
                                        onChange={(e) => setOrderNumber(e.target.value)}
                                        className="text-[#0f172a] font-['Inter'] text-[15px] leading-normal flex-1 bg-transparent outline-none"
                                    />
                                    <button
                                        type="button"
                                        aria-label="Order number help"
                                        onClick={() => setShowTooltip((v) => !v)}
                                        className="size-6 flex shrink-0 justify-center items-center bg-[#e0e7ff] rounded-full"
                                    >
                                        <div className="size-[13px] flex flex-col text-[#4338CA]">
                                            <svg stroke="rgb(67, 56, 202)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                                        </div>
                                    </button>
                                </div>
                                {showTooltip && (
                                    <div className="flex w-full items-start bg-[#0f172a] rounded-[10px] px-3 py-2.5 gap-2">
                                        <div className="size-3.5 flex flex-col shrink-0 mt-px mb-0 text-[#818cf8] mx-0">
                                            <svg stroke="rgb(129, 140, 248)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                                        </div>
                                        <div className="text-white font-['Inter'] text-xs leading-normal">Your order number is in your confirmation email, e.g. #1094. Tap to reveal on mobile.</div>
                                    </div>
                                )}
                            </div>
                            <div data-node-id="see.tba" data-node-label="Email Field" className="flex w-full h-fit flex-col gap-1.5">
                                <label htmlFor="emailOrMobile" className="text-[#0f172a] font-['Inter'] text-xs font-semibold">Email or mobile number</label>
                                <div className="flex w-full h-[52px] items-center bg-[#f5f6fa] border rounded-xl px-3.5 py-0 border-[#e3e5f0]">
                                    <input
                                        id="emailOrMobile"
                                        type="text"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="text-[#0f172a] font-['Inter'] text-[15px] leading-normal flex-1 bg-transparent outline-none placeholder:text-[#9aa8a0]"
                                    />
                                </div>
                            </div>
                            {error && (
                                <div className="flex w-full items-start bg-[#fef2f2] border rounded-[10px] px-3.5 py-2.5 gap-2 border-[#fecaca]">
                                    <div className="text-[#b91c1c] font-['Inter'] text-xs leading-normal">{error}</div>
                                </div>
                            )}
                            <button
                                type="button"
                                disabled={!canContinue}
                                onClick={onContinue}
                                className={`flex w-full h-[52px] justify-center items-center rounded-[13px] gap-2 transition-opacity ${canContinue ? 'bg-[linear-gradient(90deg,_rgb(67,_56,_202)_0%,_rgb(99,_102,_241)_100%)] shadow-[0px_6px_16px_rgba(67,56,202,0.28)]' : 'bg-[#c7cadf] cursor-not-allowed'}`}
                            >
                                <div className="text-white font-['Inter'] text-[15px] font-semibold">{loading ? 'Finding your order…' : "Find my order"}</div>
                                {loading ? (
                                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <div className="size-5 flex justify-center items-center bg-[#ffffff33] rounded-full">
                                        <div className="size-[13px] flex flex-col text-white">
                                            <svg stroke="rgb(255, 255, 255)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                        </div>
                                    </div>
                                )}
                            </button>
                        </div>
                        ) : (
                        <div data-node-id="see.track" data-node-label="Track Card" className="flex flex-col mt-0 mb-0 bg-white border shadow-[0px_1px_3px_rgba(0,0,0,0.04),0px_10px_24px_rgba(15,42,30,0.06)] lg:shadow-[0px_2px_6px_rgba(0,0,0,0.04),0px_20px_44px_rgba(15,42,30,0.09)] rounded-[20px] p-6 lg:p-7 mx-0 gap-5 border-[#e3e5f0]">
                            <div className="flex w-full h-fit flex-col gap-2">
                                <div className="text-[#0f172a] font-['Space_Grotesk'] text-[26px] lg:text-[28px] font-bold leading-[1.15] tracking-[-0.65px]">Where&apos;s my return?</div>
                                <div className="text-[#55655c] font-['Inter'] text-sm leading-[1.55]">Pop in your return authorization number (or order number) and the contact you used, and we&apos;ll show you exactly where things stand.</div>
                            </div>
                            <div className="flex w-full h-fit flex-col gap-1.5">
                                <label htmlFor="trackRef" className="text-[#0f172a] font-['Inter'] text-xs font-semibold">Return ID or order number</label>
                                <div className="flex w-full h-[52px] items-center bg-[#f5f6fa] border rounded-xl px-3.5 py-0 border-[#e3e5f0]">
                                    <input
                                        id="trackRef"
                                        type="text"
                                        value={trackRef}
                                        onChange={(e) => setTrackRef(e.target.value)}
                                        placeholder="e.g. RAN-48213 or #1094"
                                        className="text-[#0f172a] font-['Inter'] text-[15px] leading-normal flex-1 bg-transparent outline-none placeholder:text-[#9aa8a0]"
                                    />
                                </div>
                            </div>
                            <div className="flex w-full h-fit flex-col gap-1.5">
                                <label htmlFor="trackContact" className="text-[#0f172a] font-['Inter'] text-xs font-semibold">Email or mobile number</label>
                                <div className="flex w-full h-[52px] items-center bg-[#f5f6fa] border rounded-xl px-3.5 py-0 border-[#e3e5f0]">
                                    <input
                                        id="trackContact"
                                        type="text"
                                        value={trackContact}
                                        onChange={(e) => setTrackContact(e.target.value)}
                                        placeholder="you@example.com"
                                        className="text-[#0f172a] font-['Inter'] text-[15px] leading-normal flex-1 bg-transparent outline-none placeholder:text-[#9aa8a0]"
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                disabled={!canTrack}
                                onClick={onTrack}
                                className={`flex w-full h-[52px] justify-center items-center rounded-[13px] gap-2 transition-opacity ${canTrack ? 'bg-[linear-gradient(90deg,_rgb(67,_56,_202)_0%,_rgb(99,_102,_241)_100%)] shadow-[0px_6px_16px_rgba(67,56,202,0.28)]' : 'bg-[#c7cadf] cursor-not-allowed'}`}
                            >
                                <div className="text-white font-['Inter'] text-[15px] font-semibold">{trackLoading ? 'Pulling up your return…' : 'Track my return'}</div>
                                {trackLoading ? (
                                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <div className="size-5 flex justify-center items-center bg-[#ffffff33] rounded-full">
                                        <div className="size-[13px] flex flex-col text-white">
                                            <svg stroke="rgb(255, 255, 255)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                        </div>
                                    </div>
                                )}
                            </button>
                        </div>
                        )}
                        <div className="flex h-fit shrink-0 justify-center items-center px-0 py-4 gap-1.5">
                            <div className="flex items-center bg-white border rounded-full px-2.5 py-[5px] gap-[5px] border-[#e3e5f0]">
                                <div className="size-3 flex flex-col text-[#4338CA]">
                                    <svg stroke="rgb(67, 56, 202)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                                <div className="flex flex-wrap items-baseline gap-x-[2.75px] text-[#55655c] text-[11px]">
                                    <div className="text-[#55655c] font-['Inter'] text-[11px]">Powered by</div>
                                    <div className="text-[#4338CA] font-['Inter'] text-[11px] font-semibold">EcoReturns</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
