export default function TopBar({ orderNumber, placedDate }) {
    return (
        <div className="w-full flex shrink-0 justify-center items-center h-14 lg:h-[68px] lg:bg-white lg:border-b lg:border-b-[#e3e5f0]">
            <div className="flex w-full max-w-[1120px] justify-between items-center px-5 lg:px-8">
                <div className="flex items-center gap-2">
                    <div className="size-[30px] lg:size-8 flex justify-center items-center bg-[linear-gradient(135deg,_rgb(67,_56,_202)_0%,_rgb(99,_102,_241)_100%)] rounded-[9px]">
                        <div className="text-white font-['Space_Grotesk'] text-[15px] lg:text-base font-bold">E</div>
                    </div>
                    <div className="text-[#0f172a] font-['Space_Grotesk'] text-base lg:text-lg font-bold tracking-[-0.4px]">Evergreen</div>
                </div>
                <div className="flex items-center gap-3">
                    {orderNumber && (
                        <div className="hidden lg:flex items-center bg-[#f5f6fa] rounded-full px-3 py-1.5 gap-1.5">
                            <div className="text-[#0f172a] font-['Inter'] text-[13px] font-semibold">{orderNumber}</div>
                            {placedDate && <div className="text-[#55655c] font-['Inter'] text-[13px]">· {placedDate}</div>}
                        </div>
                    )}
                    <div className="flex items-center bg-white border rounded-[10px] px-2.5 py-1.5 gap-1.5 border-[#e3e5f0]">
                        <div className="size-3.5 flex flex-col text-[#55655c]">
                            <svg stroke="rgb(85, 101, 92)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                        </div>
                        <div className="text-[#0f172a] font-['Inter'] text-[13px] font-medium">English</div>
                        <div className="size-[13px] hidden sm:flex flex-col text-[#55655c]">
                            <svg stroke="rgb(85, 101, 92)" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
