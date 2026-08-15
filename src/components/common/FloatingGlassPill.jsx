import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Apple-style Liquid Glass Capsule for state switching.
 * @param {Array} options - List of { id, label } objects
 * @param {string} activeId - Currently selected ID
 * @param {function} onSelect - Callback when an option is clicked
 */
const FloatingGlassPill = ({ options, activeId, onSelect, className = "" }) => {
    return (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full max-w-full px-6 flex justify-center ${className}`}>
            <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-full p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex items-center gap-1 pointer-events-auto overflow-x-auto max-w-full no-scrollbar"
            >
                {options.map((option) => {
                    const isActive = activeId === option.id;
                    return (
                        <button
                            key={option.id}
                            onClick={() => onSelect(option.id)}
                            className={`relative px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-500 min-w-[80px] ${
                                isActive ? 'text-brand-black' : 'text-brand-black/40 hover:text-brand-black'
                            }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="pillActive"
                                    className="absolute inset-0 bg-white shadow-sm rounded-full z-0"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <span className="relative z-10">{option.label}</span>
                        </button>
                    );
                })}
            </motion.div>
        </div>
    );
};

export default FloatingGlassPill;
