import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Enterprise-Grade Professional Button (V9)
 * Extreme Stability Pass: Optimized for high-performance and zero runtime overhead.
 * Design: High-contrast minimalist aesthetic.
 */
const StandardButton = ({ 
    children, 
    onClick, 
    type = 'button', 
    variant = 'primary', 
    size = 'md', 
    disabled = false,
    className = '',
    icon: Icon = null,
    loading = false,
    expandable = false,
    title = ''
}) => {
    const [isHovered, setIsHovered] = useState(false);

    const variants = {
        primary: "bg-zinc-200 text-zinc-950 border border-transparent hover:bg-zinc-300 shadow-md active:bg-zinc-400",
        secondary: "bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-850 hover:bg-zinc-800 shadow-sm",
        glass: "bg-white/10 backdrop-blur-2xl text-white border border-white/10 hover:bg-white/20 shadow-xl",
        danger: "bg-rose-500 text-white border border-transparent hover:bg-rose-600 shadow-sm",
        ghost: "bg-transparent text-white/40 border border-transparent hover:text-white hover:bg-white/5"
    };

    const sizes = {
        sm: "h-9 text-[10px]",
        md: "h-11 text-[11px]",
        lg: "h-14 text-xs"
    };

    const circleWidths = { sm: "w-9", md: "w-11", lg: "w-14" };
    const hoverWidths = { sm: "w-40 px-4", md: "w-48 px-5", lg: "w-56 px-6" };
    const iconSizes = { sm: 16, md: 18, lg: 22 };

    const currentIconSize = iconSizes[size] || 18;
    const initialCircleClass = circleWidths[size] || "w-11";

    return (
        <button
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
            type={type}
            disabled={disabled || loading}
            title={title}
            className={`
                relative inline-flex items-center justify-center overflow-hidden
                font-bold uppercase tracking-[0.25em] select-none
                transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]
                ${variants[variant] || variants.primary}
                ${sizes[size] || sizes.md}
                ${expandable ? (isHovered ? hoverWidths[size] : `p-0 ${initialCircleClass}`) : 'px-8'}
                ${(disabled || loading) ? 'opacity-40 cursor-not-allowed grayscale' : 'cursor-pointer active:scale-[0.97]'}
                rounded-full ${className}
            `}
        >
            {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
                <div className="flex items-center justify-center gap-2.5 w-full h-full">
                    {Icon && (
                        <div className={`shrink-0 flex items-center justify-center transition-transform duration-500 ${expandable && isHovered ? 'rotate-90 scale-110' : ''}`}>
                            <Icon size={currentIconSize} strokeWidth={2.5} />
                        </div>
                    )}

                    <AnimatePresence>
                        {children && (!expandable || isHovered) && (
                            <motion.span
                                initial={expandable ? { opacity: 0, x: -4, scale: 0.95 } : { opacity: 1 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={expandable ? { opacity: 0, x: -4, scale: 0.95 } : {}}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                className="whitespace-nowrap"
                            >
                                {children}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </button>
    );
};

export default StandardButton;
