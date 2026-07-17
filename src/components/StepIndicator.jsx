const STEPS = [
    {
        label: 'Find order',
        icon: (
            <>
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </>
        ),
    },
    {
        label: 'Your items',
        icon: (
            <>
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
            </>
        ),
    },
    {
        label: 'Refund',
        icon: (
            <>
                <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
                <path d="M13 11V9a2 2 0 0 0-2-2H7.5c-.8 0-1.5.3-2.1.8L2 10.5" />
                <path d="M7 21h10" />
                <circle cx="17" cy="8" r="4" />
            </>
        ),
    },
    {
        label: 'Review',
        icon: (
            <>
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <path d="M9 7h6" />
                <path d="m8.5 13 2 2 4-4" />
            </>
        ),
    },
]

export default function StepIndicator({ current }) {
    return (
        <div className="flex w-full items-start">
            {STEPS.map((step, i) => {
                const state = i < current ? 'done' : i === current ? 'active' : 'upcoming'
                const isLast = i === STEPS.length - 1
                return (
                    <div key={step.label} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
                        <div className="flex flex-col items-center gap-1.5">
                            <div
                                className={`size-9 shrink-0 flex items-center justify-center rounded-full border ${
                                    state === 'active'
                                        ? 'bg-[linear-gradient(135deg,_rgb(67,_56,_202)_0%,_rgb(99,_102,_241)_100%)] border-transparent'
                                        : state === 'done'
                                        ? 'bg-[#6366F1] border-transparent'
                                        : 'bg-white border-[#e3e5f0]'
                                }`}
                            >
                                <svg
                                    className="size-4"
                                    stroke={state === 'upcoming' ? '#9aa8a0' : '#ffffff'}
                                    fill="none"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    {step.icon}
                                </svg>
                            </div>
                            <div
                                className={`whitespace-nowrap font-['Inter'] text-[11px] ${
                                    state === 'active' ? 'text-[#4338CA] font-semibold' : state === 'done' ? 'text-[#0f172a] font-medium' : 'text-[#9aa8a0] font-medium'
                                }`}
                            >
                                {step.label}
                            </div>
                        </div>
                        {!isLast && (
                            <div
                                className={`h-px flex-1 mx-2 mb-[18px] ${
                                    i < current ? 'bg-[#6366F1]' : 'bg-[#e3e5f0]'
                                }`}
                            ></div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
