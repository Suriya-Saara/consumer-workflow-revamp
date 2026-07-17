'use client'

import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import TopBar from '@/components/TopBar'

const CARRIERS = ['Delhivery', 'Bluedart', 'Ecom Express', 'Xpressbees']
const ITEM_NAMES = ['The Collection Snowboard: Liquid', 'Alpine Touring Gloves', 'Trail Running Jacket', 'Everyday Backpack 24L']

const STEPS = [
    {
        key: 'requested',
        title: 'Return requested',
        icon: (
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
        ),
        done: 'We received your request and generated your prepaid label.',
        current: "We've received your request and are generating your prepaid label.",
    },
    {
        key: 'picked_up',
        title: 'Picked up by carrier',
        icon: (
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
        ),
        done: 'Your parcel was picked up and is on its way to us.',
        current: 'Our courier partner is scheduled to pick up your parcel.',
    },
    {
        key: 'in_transit',
        title: 'In transit',
        icon: (
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
        ),
        done: 'Your parcel is on the move.',
        current: 'Your parcel is moving through our courier network.',
    },
    {
        key: 'arrived',
        title: 'Arrived at warehouse',
        icon: (
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        ),
        done: 'We scanned your parcel in and it looks good.',
        current: "We're inspecting your parcel now — this usually takes under a day.",
    },
    {
        key: 'refund',
        title: 'Refund issued',
        icon: (
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>
        ),
        done: "You're all set — your refund has been sent.",
        current: 'Almost there — your refund goes out the moment inspection wraps up.',
    },
]

function hashString(str) {
    let h = 0
    for (let i = 0; i < str.length; i++) {
        h = (h << 5) - h + str.charCodeAt(i)
        h |= 0
    }
    return Math.abs(h)
}

function formatDate(date) {
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function TrackReturnContent() {
    const router = useRouter()
    const params = useSearchParams()
    const ref = (params.get('ref') || 'RAN-48213').trim()
    const contact = params.get('contact') || ''
    const [copied, setCopied] = useState(false)

    const data = useMemo(() => {
        const seed = hashString(ref.toUpperCase())
        const currentStep = seed % STEPS.length
        const carrier = CARRIERS[seed % CARRIERS.length]
        const trackingNumber = `${carrier.slice(0, 2).toUpperCase()}${(seed % 900000000 + 100000000)}IN`
        const itemCount = (seed % 2) + 1
        const items = Array.from({ length: itemCount }, (_, i) => ITEM_NAMES[(seed + i) % ITEM_NAMES.length])
        const price = 500 + (seed % 1200)
        const ran = ref.toUpperCase().startsWith('RAN') ? ref.toUpperCase() : `RAN-${(seed % 90000 + 10000)}`
        const orderNumber = ref.toUpperCase().startsWith('RAN') ? `#${1000 + (seed % 9000)}` : ref.replace(/^#/, '#')

        const today = new Date()
        const stepDates = STEPS.map((_, i) => {
            const offset = i - currentStep
            const d = new Date(today)
            d.setDate(d.getDate() + offset)
            return d
        })

        return { currentStep, carrier, trackingNumber, items, price, ran, orderNumber, stepDates }
    }, [ref])

    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText(data.trackingNumber)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch {
            // clipboard unavailable — no-op
        }
    }

    const statusLabel = data.currentStep === STEPS.length - 1 ? 'Refund issued' : STEPS[data.currentStep].title

    return (
        <div className="w-full flex flex-col min-h-screen">
            <TopBar orderNumber={data.orderNumber} />
            <div className="w-full flex-1 flex justify-center px-5 lg:px-8 py-8 lg:py-14">
                <div className="w-full max-w-[440px] lg:max-w-none lg:flex lg:items-start lg:justify-center lg:gap-8 font-['Inter']">
                    <div className="flex w-full lg:w-[620px] lg:shrink-0 h-fit flex-col gap-5">
                        <button type="button" onClick={() => router.push('/orderLookup')} className="flex items-center gap-1.5 self-start text-[#55655c] font-['Inter'] text-[13px] font-semibold">
                            <svg className="size-3.5" stroke="rgb(85, 101, 92)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                            Back to lookup
                        </button>

                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <div className="text-[#0f172a] font-['Space_Grotesk'] text-2xl lg:text-3xl font-bold tracking-[-0.6px] leading-tight">Here&apos;s where things stand</div>
                                <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#4338CA] text-white font-['Inter'] text-[10px] font-bold tracking-[0.03em] uppercase">Beta</div>
                            </div>
                            <div className="text-[#55655c] font-['Inter'] text-sm">Tracking return <b className="text-[#0f172a]">{data.ran}</b> from order <b className="text-[#0f172a]">{data.orderNumber}</b>{contact ? <> for <b className="text-[#0f172a]">{contact}</b></> : null}.</div>
                        </div>

                        <div className="flex w-full items-center bg-[#eef2ff] border border-[#a5b4fc] rounded-2xl px-4 py-3.5 gap-3">
                            <div className="size-10 flex shrink-0 justify-center items-center bg-white rounded-xl text-[#4338CA]">
                                <svg className="size-[18px]" stroke="rgb(67, 56, 202)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            </div>
                            <div className="flex flex-col flex-1 gap-0.5">
                                <div className="text-[#3730a3] font-['Inter'] text-[11px] font-semibold uppercase tracking-[0.04em]">Current status</div>
                                <div className="text-[#0f172a] font-['Inter'] text-[15px] font-bold">{statusLabel}</div>
                            </div>
                        </div>

                        <div className="flex w-full flex-col bg-white border border-[#e3e5f0] rounded-2xl p-5 lg:p-6">
                            {STEPS.map((step, i) => {
                                const state = i < data.currentStep ? 'done' : i === data.currentStep ? 'current' : 'upcoming'
                                const isLast = i === STEPS.length - 1
                                return (
                                    <div key={step.key} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={`size-9 shrink-0 flex justify-center items-center rounded-full border-2 ${
                                                state === 'done' ? 'bg-[#4338CA] border-[#4338CA] text-white' :
                                                state === 'current' ? 'bg-white border-[#4338CA] text-[#4338CA] shadow-[0_0_0_4px_rgba(67,56,202,0.12)]' :
                                                'bg-white border-[#e3e5f0] text-[#b9bfd6]'
                                            }`}>
                                                <div className="size-4">{step.icon}</div>
                                            </div>
                                            {!isLast && <div className={`w-[2px] flex-1 min-h-[28px] my-1 rounded-full ${state === 'done' ? 'bg-[#4338CA]' : 'bg-[#e3e5f0]'}`}></div>}
                                        </div>
                                        <div className={`flex flex-col gap-0.5 ${isLast ? 'pb-0' : 'pb-6'}`}>
                                            <div className="flex items-center gap-2">
                                                <div className={`font-['Inter'] text-[14.5px] font-semibold ${state === 'upcoming' ? 'text-[#9aa8a0]' : 'text-[#0f172a]'}`}>{step.title}</div>
                                                {state !== 'upcoming' && <div className="text-[#9aa8a0] font-['Inter'] text-[11.5px]">{formatDate(data.stepDates[i])}</div>}
                                            </div>
                                            <div className={`font-['Inter'] text-[13px] leading-[1.5] max-w-[420px] ${state === 'upcoming' ? 'text-[#b9bfd6]' : 'text-[#55655c]'}`}>
                                                {state === 'current' ? step.current : state === 'done' ? step.done : step.current}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="flex w-full lg:w-[360px] h-fit flex-col shrink-0 gap-4 mt-6 lg:mt-[76px]">
                        <div className="flex w-full flex-col bg-white border border-[#e3e5f0] rounded-2xl p-5 gap-3.5">
                            <div className="text-[#0f172a] font-['Inter'] text-[15px] font-semibold">In this return</div>
                            {data.items.map((name, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="size-10 shrink-0 rounded-[10px] bg-[#eef0fa]"></div>
                                    <div className="text-[#0f172a] font-['Inter'] text-[13px] font-medium flex-1 truncate">{name}</div>
                                </div>
                            ))}
                            <div className="flex w-full h-px bg-[#e3e5f0]"></div>
                            <div className="flex w-full justify-between items-center">
                                <div className="text-[#55655c] font-['Inter'] text-[13px]">Refund value</div>
                                <div className="text-[#0f172a] font-['Inter'] text-[15px] font-bold">₹{data.price.toFixed(2)}</div>
                            </div>
                        </div>

                        <div className="flex w-full flex-col bg-white border border-[#e3e5f0] rounded-2xl p-5 gap-3">
                            <div className="text-[#0f172a] font-['Inter'] text-[15px] font-semibold">Carrier details</div>
                            <div className="flex flex-col gap-0.5">
                                <div className="text-[#9aa8a0] font-['Inter'] text-[11px] font-medium uppercase tracking-[0.04em]">Courier partner</div>
                                <div className="text-[#0f172a] font-['Inter'] text-sm font-semibold">{data.carrier}</div>
                            </div>
                            <div className="flex w-full items-center bg-[#f5f6fa] border border-[#e3e5f0] rounded-xl px-3.5 py-2.5 gap-2">
                                <div className="flex flex-col flex-1 gap-0.5 min-w-0">
                                    <div className="text-[#9aa8a0] font-['Inter'] text-[10.5px] font-medium uppercase tracking-[0.04em]">Tracking number</div>
                                    <div className="text-[#0f172a] font-['Inter'] text-[13.5px] font-semibold truncate">{data.trackingNumber}</div>
                                </div>
                                <button type="button" aria-label="Copy tracking number" onClick={onCopy} className="size-8 flex shrink-0 justify-center items-center bg-white border border-[#e3e5f0] rounded-[9px]">
                                    {copied ? (
                                        <svg className="size-3.5 text-[#4338CA]" stroke="rgb(67, 56, 202)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    ) : (
                                        <svg className="size-3.5 text-[#4338CA]" stroke="rgb(67, 56, 202)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex w-full flex-col bg-white border border-[#e3e5f0] rounded-2xl p-5 gap-3">
                            <div className="flex items-center gap-2.5">
                                <div className="size-9 flex shrink-0 justify-center items-center bg-[#e0e7ff] rounded-[11px]">
                                    <svg className="size-4 text-[#4338CA]" stroke="rgb(67, 56, 202)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                </div>
                                <div className="text-[#0f172a] font-['Inter'] text-sm font-semibold">Need a hand?</div>
                            </div>
                            <div className="text-[#55655c] font-['Inter'] text-[13px] leading-[1.5]">Have your return ID handy and our team will sort it out fast.</div>
                            <button type="button" className="flex w-full h-[42px] justify-center items-center bg-[#f5f6fa] border border-[#e3e5f0] rounded-[11px] gap-1.5">
                                <div className="text-[#0f172a] font-['Inter'] text-[13px] font-semibold">Chat with support</div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function TrackReturn() {
    return (
        <Suspense fallback={null}>
            <TrackReturnContent />
        </Suspense>
    )
}
