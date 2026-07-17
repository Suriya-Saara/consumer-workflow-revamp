export default function MobileFooter({ onBack, backLabel = 'Back', onContinue, continueLabel = 'Continue', canContinue = true, disabled = false }) {
    return (
        <div className="flex lg:hidden fixed w-full max-w-[440px] h-fit shrink-0 items-center left-1/2 -translate-x-1/2 bottom-0 z-10 bg-white border-t shadow-[0px_-6px_20px_rgba(15,42,30,0.06)] px-5 py-3.5 gap-3 border-t-[#e3e5f0]">
            {onBack && (
                <button type="button" onClick={onBack} disabled={disabled} className="flex h-[50px] shrink-0 justify-center items-center bg-white border rounded-[13px] px-[18px] py-0 gap-1.5 border-[#e3e5f0] disabled:opacity-50">
                    <svg className="size-[15px] text-[#55655c]" stroke="rgb(85, 101, 92)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    <div className="text-[#55655c] font-['Inter'] text-sm font-semibold">{backLabel}</div>
                </button>
            )}
            <button
                type="button"
                onClick={onContinue}
                disabled={disabled || !canContinue}
                className={`flex h-[50px] justify-center items-center flex-1 rounded-[13px] gap-2 transition-opacity ${canContinue && !disabled ? 'bg-[linear-gradient(90deg,_rgb(67,_56,_202)_0%,_rgb(99,_102,_241)_100%)] shadow-[0px_6px_16px_rgba(67,56,202,0.28)]' : 'bg-[#c7cadf] cursor-not-allowed'}`}
            >
                {disabled ? (
                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <svg className="size-4 text-white" stroke="rgb(255, 255, 255)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                )}
                <div className="text-white font-['Inter'] text-[15px] font-semibold">{continueLabel}</div>
            </button>
        </div>
    )
}
