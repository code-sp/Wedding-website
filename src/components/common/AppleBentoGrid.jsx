import React, { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Apple-style Masonry Grid — true masonry via JS column packing.
 * Photos render at their natural aspect ratio, packed into N columns
 * (shortest-column-first), with elegant stagger animations.
 *
 * @param {Array}    items       - Array of objects with .id and passed to renderItem
 * @param {function} renderItem  - (item, index) => ReactNode
 * @param {number}   columns     - Column count (default: responsive via CSS)
 * @param {string}   gap         - Gap between items in px (default: "16")
 * @param {string}   className   - Extra classes on the root
 */
const AppleBentoGrid = ({
    items,
    renderItem,
    gap = 16,
    className = '',
    canDrag = false,
    draggedIndex = null,
    onDragStart,
    onDragOver,
    onDragEnd,
    onTouchStart,
    onTouchMove,
    onTouchEnd
}) => {
    const containerRef = useRef(null);
    const getInitialCols = () => {
        if (typeof window === 'undefined') return 2;
        const w = window.innerWidth;
        if (w >= 1280) return 4;
        if (w >= 1024) return 3;
        if (w >= 640)  return 2;
        return 1;
    };

    const [cols, setCols] = useState(getInitialCols);

    // Recalculate column count from container width if it changes
    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const compute = () => {
            const w = el.clientWidth;
            let count = 1;
            if (w >= 1280) count = 4;
            else if (w >= 1024) count = 3;
            else if (w >= 640)  count = 2;
            else                count = 1;
            setCols(count);
        };

        compute();
        const ro = new ResizeObserver(compute);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Build column arrays — shortest-column-first (true masonry)
    const colArrays = Array.from({ length: cols }, () => []);

    // We don't know image heights before render, so we distribute items
    // evenly across columns in a balanced round-robin pattern.
    // This gives a natural staggered look without JS image-load measurement.
    items.forEach((item, i) => {
        colArrays[i % cols].push({ item, originalIndex: i });
    });

    const colWidth = `calc((100% - ${gap * (cols - 1)}px) / ${cols})`;

    const itemVariant = {
        hidden: { opacity: 0, y: 24, scale: 0.96 },
        show: {
            opacity: 1, y: 0, scale: 1,
            transition: { type: 'spring', stiffness: 70, damping: 16 }
        }
    };

    return (
        <div
            ref={containerRef}
            className={`w-full flex items-start ${className}`}
            style={{ gap: `${gap}px` }}
        >
            {colArrays.map((colItems, colIndex) => (
                <div
                    key={colIndex}
                    className="flex flex-col"
                    style={{ width: colWidth, gap: `${gap}px`, flexShrink: 0 }}
                >
                    {colItems.map(({ item, originalIndex }) => (
                        <motion.div
                            layout
                            layoutId={item.id}
                            key={item.id}
                            draggable={canDrag}
                            onDragStart={canDrag ? (e) => onDragStart(e, originalIndex) : undefined}
                            onDragOver={canDrag ? (e) => onDragOver(e, originalIndex) : undefined}
                            onDragEnd={canDrag ? onDragEnd : undefined}
                            onTouchStart={canDrag ? (e) => onTouchStart(e, originalIndex) : undefined}
                            onTouchMove={canDrag ? onTouchMove : undefined}
                            onTouchEnd={canDrag ? onTouchEnd : undefined}
                            data-drag-index={originalIndex}
                            variants={itemVariant}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, margin: '-40px' }}
                            // Stagger entry animations, but keep layout swaps snappy without delays
                            transition={{
                                default: { delay: originalIndex * 0.06 },
                                layout: {
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30,
                                    mass: 0.8
                                }
                            }}
                            className={`relative w-full rounded-[1.5rem] md:rounded-[2rem] overflow-hidden
                                       bg-white/5 border relative group/item transition-colors duration-300
                                       shadow-[0_8px_32px_rgba(0,0,0,0.25)]
                                       hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)]
                                       ${draggedIndex === originalIndex ? 'is-dragging shadow-2xl' : 'border-white/10 hover:border-white/20'}
                                       ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''}`}
                            style={{ touchAction: canDrag ? 'none' : 'auto' }}
                        >
                            {/*
                             * No fixed aspect-ratio wrapper — the image inside
                             * (w-full h-auto) drives the height naturally.
                             */}
                            {renderItem(item, originalIndex)}
                        </motion.div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default AppleBentoGrid;
