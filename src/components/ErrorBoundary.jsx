import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFBF7] p-8 text-center relative overflow-hidden">
                    {/* Background Blobs */}
                    <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#ff9a9e] rounded-full blur-[120px] opacity-40 animate-blob"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#a1c4fd] rounded-full blur-[100px] opacity-40 animate-blob animation-delay-2000"></div>

                    <div className="relative z-10 bg-white/30 backdrop-blur-xl p-12 rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] border border-white/60 max-w-2xl w-full">
                        <h1 className="font-display font-bold text-5xl text-brand-black mb-4">Something went wrong.</h1>
                        <p className="font-display text-brand-black/80 mb-8 text-lg">
                            We encountered an unexpected error. Please try reloading the page.
                        </p>
                        <div className="bg-white/40 p-6 rounded-2xl border border-red-200/50 mb-8 w-full shadow-inner text-left overflow-auto max-h-48">
                            <code className="text-xs text-red-500 font-mono block break-words">
                                {this.state.error && this.state.error.toString()}
                            </code>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-brand-black text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-brand-dark transition-all hover:scale-105 shadow-xl"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
