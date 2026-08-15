import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Armchair, Sofa, X, Check } from 'lucide-react';
import { useImageContext } from '../context/ImageContext';

const Seat = ({ seat, isSelected, isOccupied, onToggle, shouldShake }) => {
    return (
        <motion.button
            animate={shouldShake ? { x: [0, -4, 4, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
            disabled={isOccupied}
            onClick={onToggle}
            className={`relative group flex flex-col items-center justify-center transition-all duration-300 outline-none focus:outline-none focus-visible:ring-0 w-8 h-8 md:w-10 md:h-10 rounded-xl ${isOccupied ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:-translate-y-1'}`}
        >
            <div className={`w-full h-full rounded-xl flex items-center justify-center text-[8px] md:text-[10px] font-bold transition-all duration-300 shadow-sm ${isSelected
                ? 'bg-brand-black text-zinc-950 shadow-xl shadow-brand-black/20 scale-110 ring-2 ring-white/50'
                : isOccupied
                    ? 'bg-gray-200 text-gray-400 border border-gray-200'
                    : 'bg-white/60 border border-white/60 text-brand-black/60 hover:bg-white hover:border-white hover:text-brand-black hover:shadow-md'
                }`}>
                <span className={isOccupied ? 'opacity-0' : 'opacity-100'}>{seat.label}</span>
            </div>

            {!isOccupied && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-800 text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-xl font-bold uppercase tracking-widest">
                    {seat.type === 'sofa' ? 'VIP Sofa' : 'Seat'} #{seat.label}
                </div>
            )}
        </motion.button>
    );
}

const TableBooking = ({ isOpen, onClose, onConfirm, maxSeats = 1, initialSelectedSeats = [], occupiedSeats = [], allowGuestChange = false }) => {
    const [currentMaxSeats, setCurrentMaxSeats] = useState(maxSeats);
    const [selectedSeats, setSelectedSeats] = useState(initialSelectedSeats);
    const [shakeError, setShakeError] = useState(null);
    const [mounted, setMounted] = useState(false);
    const { settings } = useImageContext();

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setSelectedSeats(initialSelectedSeats);
            setCurrentMaxSeats(maxSeats);
        }
    }, [isOpen, initialSelectedSeats, maxSeats]);

    const handleGuestChange = (delta) => {
        const newCount = currentMaxSeats + delta;
        if (newCount >= 1 && newCount <= 10) {
            setCurrentMaxSeats(newCount);
            if (newCount < selectedSeats.length) {
                setSelectedSeats(prev => prev.slice(0, newCount));
            }
        }
    };

    const [seats, setSeats] = useState([]);

    useEffect(() => {
        const generatedSeats = [];
        let idCounter = 1;
        let currentRow = 0;

        const config = settings?.seatingConfig || [
            { id: "vip", name: "VIP Section", type: "sofa", rows: 3, colsPerSide: 9, price: 100 },
            { id: "general", name: "General Section", type: "chair", rows: 10, colsPerSide: 10, price: 50 }
        ];

        config.forEach(section => {
            const rCount = parseInt(section.rows) || 1;
            const cCount = parseInt(section.colsPerSide) || 1;
            for (let r = currentRow; r < currentRow + rCount; r++) {
                for (let c = 0; c < cCount; c++) {
                    generatedSeats.push({ id: `${section.name}-L-${idCounter}`, label: `${idCounter}`, type: section.type || 'chair', row: r, col: c, side: 'left', price: section.price || 50, sectionName: section.name });
                    idCounter++;
                }
                for (let c = 0; c < cCount; c++) {
                    generatedSeats.push({ id: `${section.name}-R-${idCounter}`, label: `${idCounter}`, type: section.type || 'chair', row: r, col: c, side: 'right', price: section.price || 50, sectionName: section.name });
                    idCounter++;
                }
            }
            currentRow += rCount;
        });
        setSeats(generatedSeats);
    }, [settings?.seatingConfig]);

    const toggleSeat = (seatId) => {
        if (selectedSeats.includes(seatId)) {
            setSelectedSeats(selectedSeats.filter(id => id !== seatId));
            setShakeError(null);
        } else {
            if (selectedSeats.length >= currentMaxSeats) {
                if (currentMaxSeats === 1) {
                    setSelectedSeats([seatId]);
                    return;
                }
                setShakeError(Date.now());
                setTimeout(() => setShakeError(null), 600);
                return;
            }
            setSelectedSeats([...selectedSeats, seatId]);
            setShakeError(null);
        }
    };

    const handleConfirm = () => {
        onConfirm(selectedSeats, currentMaxSeats);
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-brand-black/20 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-white/20 backdrop-blur-3xl rounded-[2.5rem] w-full max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col shadow-[0_32px_80px_-12px_rgba(0,0,0,0.25)] border border-white/40"
                    >
                        {/* Header */}
                        <div className="p-6 md:p-8 border-b border-white/30 flex justify-between items-center bg-white/20 z-10 backdrop-blur-2xl">
                            <div>
                                <h2 className="text-3xl font-display font-bold text-brand-black">Select Seats</h2>
                                {allowGuestChange ? (
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-brand-black/60 font-medium text-sm">Guests:</span>
                                        <div className="flex items-center bg-white/60 rounded-full border border-white/50 shadow-sm p-1">
                                            <button
                                                onClick={() => handleGuestChange(-1)}
                                                className="w-8 h-8 flex items-center justify-center text-brand-black hover:bg-white rounded-full transition-all disabled:opacity-30 font-bold"
                                                disabled={currentMaxSeats <= 1}
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center font-bold text-brand-black">{currentMaxSeats}</span>
                                            <button
                                                onClick={() => handleGuestChange(1)}
                                                className="w-8 h-8 flex items-center justify-center text-brand-black hover:bg-white rounded-full transition-all disabled:opacity-30 font-bold"
                                                disabled={currentMaxSeats >= 10}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-brand-black/60 font-medium mt-1 text-sm">
                                        Please select <span className="font-bold text-brand-black">{currentMaxSeats}</span> seat{currentMaxSeats > 1 ? 's' : ''} for your party.
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/50 rounded-full transition-colors text-brand-black/50 hover:text-brand-black"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Sticky Legend Bar */}
                        <div className="flex justify-center gap-6 md:gap-10 px-6 py-3 bg-white/10 backdrop-blur-xl border-b border-white/20 z-10">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-lg bg-white/50 border border-white/60 shadow-sm" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-black/60">Available</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-lg bg-brand-black shadow-lg shadow-brand-black/20" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-black/60">Selected</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-lg bg-gray-200/50 border border-gray-200/50 flex items-center justify-center">
                                    <div className="w-3 h-px bg-gray-300 rotate-45" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-black/60">Occupied</span>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="overflow-y-auto flex-1 pt-10 px-8 pb-10 bg-white/5 backdrop-blur-sm">

                            {/* Stage Area */}
                            <div className="w-full flex flex-col items-center mb-16">
                                <div className="w-2/3 md:w-1/2 h-24 bg-gradient-to-b from-white/80 to-white/20 rounded-t-[50%] border-t border-x border-white/60 flex items-end justify-center pb-4 shadow-xl backdrop-blur-sm">
                                    <span className="font-display font-bold text-brand-black/30 tracking-[0.5em] text-sm uppercase">Stage</span>
                                </div>
                                <div className="w-3/4 h-20 bg-gradient-to-t from-transparent via-white/40 to-transparent blur-2xl -mt-10 pointer-events-none"></div>
                            </div>

                            {/* Seating Grid */}
                            <div className="flex flex-col gap-12 items-center">

                                {/* VIP Section (Sofas) */}
                                <div className="flex flex-col items-center gap-4 w-full overflow-visible">
                                    <div className="w-full overflow-x-auto custom-scrollbar">
                                        <div className="flex gap-4 md:gap-16 justify-center min-w-max px-10 pt-16 pb-12 overflow-visible">
                                            {/* Left Side */}
                                            <div className="grid grid-cols-9 gap-2">
                                                {seats.filter(s => s.type === 'sofa' && s.side === 'left').map(seat => (
                                                    <Seat key={seat.id} seat={seat} isSelected={selectedSeats.includes(seat.id)} isOccupied={occupiedSeats.includes(seat.id)} onToggle={() => toggleSeat(seat.id)} shouldShake={selectedSeats.includes(seat.id) && shakeError} />
                                                ))}
                                            </div>
                                            {/* Aisle */}
                                            <div className="w-4 md:w-16 flex items-center justify-center"></div>
                                            {/* Right Side */}
                                            <div className="grid grid-cols-9 gap-2">
                                                {seats.filter(s => s.type === 'sofa' && s.side === 'right').map(seat => (
                                                    <Seat key={seat.id} seat={seat} isSelected={selectedSeats.includes(seat.id)} isOccupied={occupiedSeats.includes(seat.id)} onToggle={() => toggleSeat(seat.id)} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-brand-black/40 uppercase tracking-widest mt-2 bg-white/30 px-3 py-1 rounded-full backdrop-blur-sm">VIP Section</span>
                                </div>

                                {/* Divider */}
                                <div className="w-full max-w-2xl h-0.5 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>

                                {/* General Section (Chairs) */}
                                <div className="flex flex-col items-center gap-4 w-full overflow-visible">
                                    <div className="w-full overflow-x-auto custom-scrollbar">
                                        <div className="flex gap-4 md:gap-16 justify-center min-w-max px-10 pt-16 pb-12 overflow-visible">
                                            {/* Left Side */}
                                            <div className="grid grid-cols-10 gap-1.5 md:gap-2">
                                                {seats.filter(s => s.type === 'chair' && s.side === 'left').map(seat => (
                                                    <Seat key={seat.id} seat={seat} isSelected={selectedSeats.includes(seat.id)} isOccupied={occupiedSeats.includes(seat.id)} onToggle={() => toggleSeat(seat.id)} />
                                                ))}
                                            </div>
                                            {/* Aisle */}
                                            <div className="w-4 md:w-16"></div>
                                            {/* Right Side */}
                                            <div className="grid grid-cols-10 gap-1.5 md:gap-2">
                                                {seats.filter(s => s.type === 'chair' && s.side === 'right').map(seat => (
                                                    <Seat key={seat.id} seat={seat} isSelected={selectedSeats.includes(seat.id)} isOccupied={occupiedSeats.includes(seat.id)} onToggle={() => toggleSeat(seat.id)} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-brand-black/40 uppercase tracking-widest mt-2 bg-white/30 px-3 py-1 rounded-full backdrop-blur-sm">General Seating</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/30 bg-white/20 backdrop-blur-2xl flex justify-between items-center z-20">
                            <div className="flex flex-col">
                                <span className="font-bold text-brand-black font-display text-lg">{selectedSeats.length} of {currentMaxSeats} seats selected</span>
                                <AnimatePresence>
                                    {shakeError && (
                                        <motion.span
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="text-red-500 text-xs font-bold uppercase tracking-wide"
                                        >
                                            Please unselect a seat first
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-3 text-brand-black/60 hover:text-brand-black font-bold text-xs uppercase tracking-widest transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                     onClick={handleConfirm}
                                     disabled={selectedSeats.length !== currentMaxSeats}
                                     className={`px-8 py-3 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg ${selectedSeats.length === currentMaxSeats
                                         ? 'bg-zinc-200 text-zinc-950 hover:bg-zinc-300 hover:shadow-xl hover:-translate-y-0.5'
                                         : 'bg-zinc-800 text-zinc-600 cursor-not-allowed shadow-none'
                                         }`}
                                 >
                                     <Check size={16} />
                                     Confirm
                                 </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default TableBooking;
