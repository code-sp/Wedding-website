import Navbar from './Navbar';

const PageLayout = ({ children, backgroundText, className = "" }) => {
    return (
        <div className="h-[100dvh] w-full bg-black p-2 md:p-6 flex flex-col items-center justify-center relative overflow-hidden">

            {/* 2. Main Glass Container */}
            <div className={`w-full max-w-[1600px] z-10 relative flex-1 min-h-0 overflow-hidden flex flex-col ${className}`}>
                
                {/* Backdrop Layer — frosted glass with white/glass outer highlight shadow and defined border */}
                <div className="absolute inset-0 bg-black/25 backdrop-blur-2xl rounded-[2.5rem] md:rounded-[3.5rem] border border-white/[0.28] shadow-[0_8px_32px_rgba(0,0,0,0.65),0_0_25px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.22)]" />

                {/* Large Background Typography */}
                {backgroundText && (
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 z-0 pointer-events-none select-none opacity-[0.04] mix-blend-overlay">
                        <h1 className="font-display font-bold text-[12vw] text-white leading-none tracking-tighter ml-[-1vw]">
                            {backgroundText}
                        </h1>
                    </div>
                )}

                {/* Content Layout */}
                <div className="flex-grow flex flex-col md:flex-row relative z-10 w-full min-h-0 overflow-hidden p-3 md:p-6">
                    <Navbar />
                    <div className={`flex-1 relative w-full min-w-0 overflow-y-auto overflow-x-hidden custom-scrollbar ${className.includes('!p-0') ? '-mr-4 md:-mr-8 -my-4 md:-my-8 ml-0' : ''}`}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PageLayout;
