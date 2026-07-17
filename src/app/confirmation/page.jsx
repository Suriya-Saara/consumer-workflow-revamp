'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/TopBar'
import { useAppData } from '@/contexts/AppDataContext'

export default function Confirmation() {
    const router = useRouter()
    const { orderDetails, customerInfo, requestSubmissionResponse, paymentInfo } = useAppData()
    const [countdown, setCountdown] = useState(10)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (!requestSubmissionResponse) {
            router.replace('/orderLookup')
        }
    }, [requestSubmissionResponse, router])

    useEffect(() => {
        if (countdown === 0) {
            router.push('/orderLookup')
            return
        }
        const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
        return () => clearTimeout(t)
    }, [countdown, router])

    const ran = requestSubmissionResponse?.ran
        || (Array.isArray(requestSubmissionResponse?.ids) && requestSubmissionResponse.ids.length > 0
            ? `REQ-${requestSubmissionResponse.ids.join('-')}`
            : 'Pending')

    const customerName = customerInfo?.first_name || customerInfo?.customer_name || 'there'
    const totalAmount = paymentInfo?.total_return_refund

    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText(String(ran))
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch {
            // clipboard unavailable — no-op
        }
    }

    const whatsNext = (
        <>
            <div className="flex w-full items-start gap-2.5">
                <div className="size-[22px] flex shrink-0 justify-center items-center bg-[#e0e7ff] rounded-full">
                    <div className="text-[#4338CA] font-['Inter'] text-[11px] font-bold">1</div>
                </div>
                <div className="text-[#55655c] font-['Inter'] text-[13px] flex-1">Print the label and drop your parcel at any partner location.</div>
            </div>
            <div className="flex w-full items-start gap-2.5">
                <div className="size-[22px] flex shrink-0 justify-center items-center bg-[#e0e7ff] rounded-full">
                    <div className="text-[#4338CA] font-['Inter'] text-[11px] font-bold">2</div>
                </div>
                <div className="text-[#55655c] font-['Inter'] text-[13px] flex-1">
                    {typeof totalAmount === 'number'
                        ? `We scan it in and issue your ₹${totalAmount.toFixed(2)} refund instantly.`
                        : 'We scan it in and issue your refund instantly.'}
                </div>
            </div>
        </>
    )

    if (!requestSubmissionResponse) return null

    return (
        <div className="w-full flex flex-col min-h-screen">
            <TopBar />
            <div className="w-full flex-1 flex justify-center px-5 lg:px-8 py-8 lg:py-14">
                <div className="w-full max-w-[440px] lg:max-w-none lg:flex lg:items-start lg:justify-center lg:gap-10 xl:gap-14">
                    <div data-node-id="kay" data-node-label="Page - Confirmation" className="flex w-full lg:w-[440px] lg:shrink-0 h-fit flex-col font-['Inter']">
                        <div className="flex h-fit flex-col shrink-0 items-center pt-6 pb-2 px-0 gap-3.5">
                            <div className="size-[84px] flex justify-center items-center bg-[#e0e7ff] rounded-full">
                                <div className="size-[60px] flex justify-center items-center bg-[linear-gradient(135deg,_rgb(67,_56,_202)_0%,_rgb(99,_102,_241)_100%)] shadow-[0px_8px_20px_rgba(67,56,202,0.35)] rounded-full">
                                    <svg className="size-[30px] text-white" stroke="rgb(255, 255, 255)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                            </div>
                            <div className="flex flex-col items-center px-3 py-0 gap-1.5">
                                <div className="text-[#0f172a] font-['Space_Grotesk'] text-[26px] font-bold leading-[1.2] tracking-[-0.65px] text-center">You're all set, {customerName}!</div>
                                <div className="max-w-[300px] text-[#55655c] font-['Inter'] text-sm leading-[1.55] text-center">Your return request is confirmed. We've emailed you a prepaid shipping label.</div>
                            </div>
                        </div>
                        <div className="flex w-full h-fit shrink-0 items-center mt-2 mb-0 bg-white border shadow-[0px_1px_3px_rgba(0,0,0,0.04),0px_8px_20px_rgba(15,42,30,0.05)] rounded-2xl p-4 mx-0 gap-3 border-[#e3e5f0]">
                            <div className="size-10 flex shrink-0 justify-center items-center bg-[#e0e7ff] rounded-xl">
                                <svg className="size-[19px] text-[#4338CA]" stroke="rgb(67, 56, 202)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                            </div>
                            <div className="flex flex-col flex-1 gap-0.5">
                                <div className="text-[#55655c] font-['Inter'] text-[11px] font-medium tracking-[0.275px] uppercase">Return authorization</div>
                                <div className="text-[#0f172a] font-['Space_Grotesk'] text-[22px] font-bold tracking-[-0.55px]">{ran}</div>
                            </div>
                            <button type="button" aria-label="Copy return authorization number" onClick={onCopy} className="size-[38px] flex shrink-0 justify-center items-center bg-[#f5f6fa] border rounded-[11px] border-[#e3e5f0]">
                                {copied ? (
                                    <svg className="size-4 text-[#4338CA]" stroke="rgb(67, 56, 202)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                ) : (
                                    <svg className="size-4 text-[#4338CA]" stroke="rgb(67, 56, 202)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                )}
                            </button>
                        </div>
                        <div className="flex lg:hidden w-full flex-col mt-3 mb-0 bg-white border rounded-2xl p-4 mx-0 gap-3 border-[#e3e5f0]">
                            <div className="text-[#0f172a] font-['Inter'] text-[13px] font-semibold">What happens next</div>
                            {whatsNext}
                        </div>
                        <div className="flex w-full h-fit shrink-0 justify-center items-center mt-3.5 mb-0 mx-0 gap-[7px]">
                            <svg className="size-[13px] text-[#9aa8a0]" stroke="rgb(154, 168, 160)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            <div className="flex flex-wrap items-baseline gap-x-[3px] text-[#9aa8a0] text-xs">
                                <div className="text-[#9aa8a0] font-['Inter'] text-xs">Redirecting to store in</div>
                                <div className="text-[#55655c] font-['Inter'] text-xs font-semibold">{countdown}s</div>
                            </div>
                        </div>
                        <div className="flex w-full h-fit flex-col shrink-0 mt-4 mb-0 mx-0 gap-2.5">
                            <button type="button" onClick={() => router.push('/orderLookup')} className="flex w-full h-[52px] justify-center items-center bg-[linear-gradient(90deg,_rgb(67,_56,_202)_0%,_rgb(99,_102,_241)_100%)] shadow-[0px_6px_16px_rgba(67,56,202,0.28)] rounded-[13px] gap-2">
                                <svg className="size-4 text-white" stroke="rgb(255, 255, 255)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                                <div className="text-white font-['Inter'] text-[15px] font-semibold">Continue shopping</div>
                            </button>
                            <div className="flex w-full gap-2.5">
                                <button type="button" onClick={() => router.push('/orderLookup')} className="flex h-[46px] justify-center items-center bg-white border flex-1 rounded-xl gap-1.5 border-[#e3e5f0]">
                                    <svg className="size-3.5 text-[#55655c]" stroke="rgb(85, 101, 92)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                                    <div className="text-[#55655c] font-['Inter'] text-[13px] font-semibold">Return more</div>
                                </button>
                                <button type="button" onClick={() => router.push('/orderLookup')} className="flex h-[46px] justify-center items-center bg-white border flex-1 rounded-xl border-[#e3e5f0]">
                                    <div className="text-[#55655c] font-['Inter'] text-[13px] font-semibold">Back to store</div>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:flex flex-col w-[380px] shrink-0 gap-4 pt-6">
                        <div className="flex w-full flex-col bg-white border rounded-2xl p-5 mx-0 gap-3.5 border-[#e3e5f0] shadow-[0px_1px_3px_rgba(0,0,0,0.03)]">
                            <div className="text-[#0f172a] font-['Inter'] text-[15px] font-semibold">What happens next</div>
                            {whatsNext}
                        </div>
                        <div className="flex w-full flex-col bg-white border rounded-2xl p-5 gap-3 border-[#e3e5f0]">
                            <div className="flex items-center gap-2.5">
                                <div className="size-9 flex shrink-0 justify-center items-center bg-[#e0e7ff] rounded-[11px]">
                                    <svg className="size-4 text-[#4338CA]" stroke="rgb(67, 56, 202)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                </div>
                                <div className="text-[#0f172a] font-['Inter'] text-sm font-semibold">Need help with your return?</div>
                            </div>
                            <div className="text-[#55655c] font-['Inter'] text-[13px] leading-[1.5]">Our support team typically replies within an hour. Have your RAN handy when you reach out.</div>
                            <button type="button" className="flex w-full h-[42px] justify-center items-center bg-[#f5f6fa] border rounded-[11px] gap-1.5 border-[#e3e5f0]">
                                <div className="text-[#0f172a] font-['Inter'] text-[13px] font-semibold">Chat with support</div>
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.push(`/trackReturn?ref=${encodeURIComponent(String(ran))}&contact=${encodeURIComponent(customerInfo?.customer_email || orderDetails?.customer_email || '')}`)}
                            className="flex w-full items-center bg-[#eef2ff] border rounded-2xl p-4 gap-3 border-[#a5b4fc] text-left hover:bg-[#e5e9ff] transition-colors"
                        >
                            <svg className="size-5 shrink-0 text-[#4338CA]" stroke="rgb(67, 56, 202)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                            <div className="text-[#3730a3] font-['Inter'] text-xs leading-[1.4] flex-1">Track this return anytime using RAN {ran}. <span className="font-semibold underline">Track now →</span></div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
