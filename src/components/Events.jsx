import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Clock, Calendar, Plus, Edit2,
    Camera, Check, Shirt, Sparkles, ChevronUp, ChevronDown
} from 'lucide-react';
import AddToCalendar from './AddToCalendar';
import PageLayout from './PageLayout';
import DeleteButton from './DeleteButton';
import { useAuth } from '../context/AuthContext';
import { useImageContext } from '../context/ImageContext';
import { compressImage } from '../utils/imageCompression';
import StandardButton from './common/StandardButton';
import AdminHUD from './common/AdminHUD';

// ── Helpers ──────────────────────────────────────────────────────────────────
const DRAFT_ID = '__new_event__';

const ToggleSwitch = ({ isOn, onToggle }) => (
    <div
        className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${isOn ? 'bg-zinc-200' : 'bg-white/10 border border-white/20'}`}
        onClick={onToggle}
    >
        <div className={`w-4 h-4 rounded-full shadow-sm transform duration-300 ease-in-out ${isOn ? 'translate-x-4 bg-zinc-950' : 'bg-white'}`} />
    </div>
);

// Custom Frock / Dress Icon matching Lucide style
const FrockIcon = ({ size = 24, className = "" }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M9 3c-1.5 0-2 3-2 6 0 1 .5 1.5 1.5 1.5h7c1 0 1.5-.5 1.5-1.5 0-3-.5-6-2-6" />
        <path d="M9 3a3 3 0 0 0 6 0" />
        <path d="M8.5 10.5L4 21h16l-4.5-10.5" />
    </svg>
);

// Custom Coat / Blazer Icon matching Lucide style
const CoatIcon = ({ size = 24, className = "" }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        {/* Coat body outline */}
        <path d="M6 3h12l3 6-2 12H5L3 9z" />
        {/* Lapels / V-neck */}
        <path d="M6 3l6 10 6-10" />
        {/* Center seam */}
        <path d="M12 13v8" />
        {/* Buttons (drawn as elegant Lucide dot ticks) */}
        <path d="M12 16h.01M12 19h.01" />
    </svg>
);

const Events = () => {
    const { events, updateContentData } = useImageContext();
    const { isAdmin, isClient } = useAuth();
    const canEdit = isAdmin || isClient;

    const [activeEventId, setActiveEventId]   = useState(null);
    const [drawerOpen, setDrawerOpen]         = useState(false);
    const [editingId, setEditingId]           = useState(null);
    const [editBuffer, setEditBuffer]         = useState(null);
    const [validationErrors, setValidationErrors] = useState([]);
    const [isMobile, setIsMobile]             = useState(window.innerWidth < 768);
    const [windowSize, setWindowSize]         = useState({ width: window.innerWidth, height: window.innerHeight });

    const carouselRef  = useRef(null);
    const fileInputRef = useRef(null);
    const wheelTimeout = useRef(null);
    const touchStartX  = useRef(null);
    const touchStartY  = useRef(null);

    // ── Resize ────────────────────────────────────────────────────────────────
    useEffect(() => {
        const onResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
            setIsMobile(window.innerWidth < 768);
        };
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // ── Wheel scroll (passive: false to prevent jitter) ───────────────────────
    useEffect(() => {
        const el = carouselRef.current;
        if (!el) return;
        const handler = (e) => {
            if (editingId) return;
            e.preventDefault();
            if (wheelTimeout.current) return;
            if (Math.abs(e.deltaY) > 3 || Math.abs(e.deltaX) > 3) {
                const dir = (e.deltaY > 0 || e.deltaX > 0) ? 1 : -1;
                navigate(dir);
                wheelTimeout.current = setTimeout(() => { wheelTimeout.current = null; }, 600);
            }
        };
        el.addEventListener('wheel', handler, { passive: false });
        return () => el.removeEventListener('wheel', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeEventId, editingId, events]);

    // ── Sorting & active ──────────────────────────────────────────────────────
    const sortedEvents = [...(events || [])].sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(a.date) - new Date(b.date);
    });

    useEffect(() => {
        if (!activeEventId && sortedEvents.length > 0) setActiveEventId(sortedEvents[0].id);
    }, [sortedEvents, activeEventId]);

    const displayEvents = editingId === DRAFT_ID && editBuffer
        ? [...sortedEvents, editBuffer]
        : sortedEvents;

    const activeIndex = displayEvents.findIndex(e => e.id === activeEventId);
    const activeEvent = editingId && editBuffer
        ? editBuffer
        : (displayEvents[activeIndex] ?? displayEvents[0] ?? null);

    // ── Navigation ────────────────────────────────────────────────────────────
    const navigate = (dir) => {
        if (!displayEvents.length || editingId) return;
        const idx = displayEvents.findIndex(e => e.id === activeEventId);
        const next = displayEvents[idx + dir];
        if (next) { setActiveEventId(next.id); setDrawerOpen(false); }
    };

    const handleTouchStart = (e) => { 
        touchStartX.current = e.touches[0].clientX; 
        touchStartY.current = e.touches[0].clientY; 
    };
    const handleTouchEnd   = (e) => {
        if (touchStartX.current === null || touchStartY.current === null) return;
        const dx = touchStartX.current - e.changedTouches[0].clientX;
        const dy = touchStartY.current - e.changedTouches[0].clientY;
        
        // Use whichever swipe direction was stronger
        if (Math.abs(dy) > Math.abs(dx)) {
            if (Math.abs(dy) > 40) navigate(dy > 0 ? 1 : -1);
        } else {
            if (Math.abs(dx) > 40) navigate(dx > 0 ? 1 : -1);
        }
        
        touchStartX.current = null;
        touchStartY.current = null;
    };

    // ── CRUD ──────────────────────────────────────────────────────────────────
    const handleAdd = () => {
        const draft = { id: DRAFT_ID, title: '', date: '', time: '', location: '', description: '', image: '', dressCodeMale: '', dressCodeFemale: '', showAttireMale: true, showAttireFemale: true };
        setEditBuffer(draft);
        setEditingId(DRAFT_ID);
        setActiveEventId(DRAFT_ID);
        setDrawerOpen(false);
    };

    const handleStartEdit = () => {
        if (activeEvent) { setEditBuffer({ ...activeEvent }); setEditingId(activeEvent.id); setDrawerOpen(false); }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditBuffer(null);
        setValidationErrors([]);
        if (activeEventId === DRAFT_ID) setActiveEventId(sortedEvents[0]?.id ?? null);
    };

    const handleSave = async () => {
        const data = editBuffer;
        const errors = ['title', 'date', 'time', 'location'].filter(f => !data[f]);
        if (errors.length) { setValidationErrors(errors); setTimeout(() => setValidationErrors([]), 2000); return; }

        let newList, newId;
        if (editingId === DRAFT_ID) {
            newId = Date.now();
            newList = [...(events || []), { ...data, id: newId }];
        } else {
            newId = editingId;
            newList = (events || []).map(e => e.id === editingId ? data : e);
        }
        await updateContentData('events', newList);
        setEditingId(null); setEditBuffer(null); setActiveEventId(newId);
    };

    const handleDelete = async (id) => {
        const newList = (events || []).filter(e => e.id !== id);
        await updateContentData('events', newList);
        setActiveEventId(newList[0]?.id ?? null);
        setEditingId(null); setEditBuffer(null);
    };

    const updateValue = (f, v) => setEditBuffer(p => p ? { ...p, [f]: v } : null);
    const triggerUpload = () => fileInputRef.current?.click();
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try { updateValue('image', await compressImage(file, 1280)); } catch { alert('Upload failed'); }
        e.target.value = '';
    };

    // ── Card sizing — wide 16:9 landscape ─────────────────────────────────────
    const cardH = Math.min(windowSize.height * (isMobile ? 0.52 : 0.62), isMobile ? 320 : 520);
    const cardW = Math.min(cardH * (16 / 9), windowSize.width * (isMobile ? 0.88 : 0.72));
    const xStep = isMobile ? windowSize.width * 0.42 : Math.min(windowSize.width * 0.24, 340);
    const perspective = Math.max(1400, windowSize.width * 1.2);

    // ── Empty State ───────────────────────────────────────────────────────────
    if (!displayEvents.length) {
        return (
            <PageLayout backgroundText="celebration">
                <div className="h-full flex items-center justify-center">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center flex flex-col items-center p-12">
                        <h2 className="font-display font-bold text-5xl lg:text-7xl text-zinc-200 mb-4">Celebrate<span className="block text-zinc-400 italic font-light mt-2">Rituals</span></h2>
                        <p className="text-zinc-400 text-lg mb-10 max-w-sm leading-relaxed">Every great wedding has a timeline. Add your ceremonies, receptions, and rituals.</p>
                        {canEdit && <StandardButton onClick={handleAdd} icon={Plus}>Plan First Event</StandardButton>}
                    </motion.div>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout backgroundText="" className="!p-0">
            <div className="absolute inset-0 flex flex-col overflow-hidden">
                {canEdit && <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />}

                {/* ── Page Header ── */}
                <div className="w-full pt-8 md:pt-10 pb-2 flex flex-col items-center text-center relative z-30 shrink-0 pointer-events-none">
                    <span className="inline-block py-1.5 px-4 rounded-full bg-white/10 border border-white/15 text-white/50 text-[10px] font-bold tracking-[0.3em] uppercase mb-3 shadow-sm backdrop-blur-md">
                        The Timeline
                    </span>
                    <h2 className="font-display font-bold text-4xl lg:text-5xl text-white tracking-tighter mb-4">
                        Wedding <span className="text-white/50 italic font-light">Events</span>
                    </h2>
                    <p className="text-zinc-400 font-medium text-sm md:text-base leading-relaxed max-w-xl mx-auto font-serif italic px-4">
                        A curated timeline of the ceremonies and celebrations.
                    </p>
                </div>

                {/* ── 3D Carousel ── */}
                <div
                    ref={carouselRef}
                    className="flex-1 relative w-full flex items-center justify-center overflow-hidden"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >

                    {/* Cards */}
                    <div className="relative w-full h-full flex items-center justify-center" style={{ perspective: `${perspective}px` }}>
                        {displayEvents.map((event, i) => {
                            const diff       = i - activeIndex;
                            const isActive   = diff === 0;
                            const isEditing  = editingId === event.id;
                            const display    = isEditing ? editBuffer : event;

                            let xOffset = 0, yOffset = 0, zOffset = 0, rotateX = 0, opacity = 1, scale = 1;
                            
                            // Vertical spacing between cards
                            const yStep = isMobile ? cardH + 24 : cardH + 40;
                            
                            yOffset = diff * yStep;
                            
                            if (diff === 0) {
                                // Active card in center
                                scale = 1;
                                opacity = 1;
                                zOffset = 10; // Keep on top
                            } else {
                                // Inactive cards above and below
                                scale = 0.85;
                                opacity = Math.abs(diff) >= 2 ? 0 : 0.4;
                                zOffset = 0;
                            }

                            return (
                                <motion.div
                                    key={event.id}
                                    initial={false}
                                    animate={{
                                        x: xOffset, y: yOffset, z: zOffset, rotateX,
                                        opacity,
                                        scale,
                                        zIndex: 50 - Math.abs(diff),
                                    }}
                                    transition={{ type: "spring", stiffness: 100, damping: 20, mass: 0.8 }}
                                    onClick={() => { if (!isActive && !editingId) { setActiveEventId(event.id); setDrawerOpen(false); } }}
                                    style={{
                                        position: 'absolute', width: `${cardW}px`, height: `${cardH}px`,
                                        translateX: '-50%', translateY: '-50%',
                                        top: '50%', left: '50%',
                                        transformStyle: 'preserve-3d',
                                        cursor: isActive ? 'default' : 'pointer',
                                    }}
                                >
                                    {/* Card Shell */}
                                    <div className={`w-full h-full relative rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.6)] border group ${isActive ? 'border-white/20' : 'border-white/10'} transition-all duration-500`}>

                                        {/* ── Background Image ── */}
                                        <div className="absolute inset-0">
                                            {display?.image ? (
                                                <img src={display.image} alt={display.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
                                                    <span className="text-zinc-600 text-sm font-medium">No image</span>
                                                </div>
                                            )}
                                            {/* Deep gradient overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
                                        </div>

                                        {/* ── Edit Mode Overlay ── */}
                                        {isEditing && (
                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex flex-col overflow-y-auto custom-scrollbar p-6 md:p-8">
                                                <h3 className="text-white font-display font-bold text-xl mb-5">
                                                    {editingId === DRAFT_ID ? 'New Ceremony' : 'Edit Ceremony'}
                                                </h3>

                                                <div className="space-y-4 flex-1">
                                                    {/* Artwork upload */}
                                                    <button
                                                        type="button" onClick={triggerUpload}
                                                        className="w-full py-2.5 rounded-xl border border-dashed border-white/30 text-white/60 hover:text-white hover:border-white/50 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                                                    >
                                                        <Camera size={14} />
                                                        {editBuffer?.image ? 'Change Artwork' : 'Upload Artwork'}
                                                    </button>

                                                    {/* Name / Date / Time row */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                        {[
                                                            { label: 'Ceremony Name', field: 'title', type: 'text', placeholder: 'e.g. Sangeet Night' },
                                                            { label: 'Date', field: 'date', type: 'date', placeholder: '' },
                                                            { label: 'Time', field: 'time', type: 'time', placeholder: '' },
                                                        ].map(({ label, field, type, placeholder }) => (
                                                            <div key={field} className="space-y-1">
                                                                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">{label}</label>
                                                                <input
                                                                    type={type} value={editBuffer?.[field] ?? ''} placeholder={placeholder}
                                                                    onChange={e => updateValue(field, e.target.value)}
                                                                    className={`w-full bg-white/10 border rounded-xl px-3 py-2 outline-none focus:bg-white/15 text-white text-xs transition-all ${validationErrors.includes(field) ? 'border-rose-500' : 'border-white/20 focus:border-white/40'}`}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Location / Description */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Venue / Location</label>
                                                            <input type="text" value={editBuffer?.location ?? ''} placeholder="e.g. Grand Ballroom" onChange={e => updateValue('location', e.target.value)} className={`w-full bg-white/10 border rounded-xl px-3 py-2 outline-none focus:bg-white/15 text-white text-xs transition-all ${validationErrors.includes('location') ? 'border-rose-500' : 'border-white/20 focus:border-white/40'}`} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Description</label>
                                                            <textarea value={editBuffer?.description ?? ''} placeholder="Tell guests about this ceremony…" onChange={e => updateValue('description', e.target.value)} rows={2} className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 outline-none focus:bg-white/15 focus:border-white/40 text-white text-xs resize-none transition-all" />
                                                        </div>
                                                    </div>

                                                    {/* Attire */}
                                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {[
                                                            { label: 'Gentlemen', showKey: 'showAttireMale', codeKey: 'dressCodeMale', placeholder: 'e.g. Sherwani / Tuxedo' },
                                                            { label: 'Ladies', showKey: 'showAttireFemale', codeKey: 'dressCodeFemale', placeholder: 'e.g. Lehenga / Evening Gown' },
                                                        ].map(({ label, showKey, codeKey, placeholder }) => (
                                                            <div key={showKey} className="space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-xs font-semibold text-zinc-300">{label}</span>
                                                                    <ToggleSwitch isOn={!!editBuffer?.[showKey]} onToggle={() => updateValue(showKey, !editBuffer?.[showKey])} />
                                                                </div>
                                                                {editBuffer?.[showKey] && (
                                                                    <input type="text" value={editBuffer?.[codeKey] ?? ''} placeholder={placeholder} onChange={e => updateValue(codeKey, e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 outline-none text-white text-xs" />
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Save / Cancel */}
                                                <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-white/10 shrink-0">
                                                    <button type="button" onClick={handleCancel} className="px-5 py-2 rounded-full border border-white/15 text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-wider">Cancel</button>
                                                    <button type="button" onClick={handleSave} className="px-6 py-2.5 rounded-full bg-zinc-200 text-zinc-950 hover:bg-white font-bold text-xs uppercase tracking-widest shadow-lg transition-all flex items-center gap-1.5">
                                                        <Check size={14} /> Save
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* ── View Mode bottom info ── */}
                                        {!isEditing && isActive && (
                                            <>
                                                {/* Title block — Option D: Name only */}
                                                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-10 pointer-events-none">
                                                    {/* Big bold ceremony name */}
                                                    <h3 className="font-display font-bold text-3xl md:text-5xl text-white tracking-tight leading-none">
                                                        {display?.title || 'Untitled Ceremony'}
                                                    </h3>
                                                </div>

                                                {/* Admin controls — top-right, hidden when details drawer is open */}
                                                {canEdit && !drawerOpen && (
                                                    <div className="absolute top-5 right-5 z-20 flex gap-2">
                                                        <button
                                                            onClick={handleStartEdit}
                                                            className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/15 transition-all shadow-lg"
                                                            title="Edit Event"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <DeleteButton
                                                            onDelete={() => handleDelete(event.id)}
                                                            requireConfirm={false}
                                                            size={14}
                                                            className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-rose-400 hover:text-white hover:bg-rose-600 hover:border-rose-500 transition-all shadow-lg"
                                                        />
                                                    </div>
                                                )}

                                                {/* Drawer toggle — bottom right */}
                                                <AnimatePresence>
                                                    {drawerOpen ? (
                                                        <motion.div
                                                            key="drawer"
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                            transition={{ duration: 0.3 }}
                                                            className="absolute inset-0 z-20 bg-gradient-to-t from-black via-black/95 to-black/30 flex flex-col"
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            {/* Close button (Fixed at top-right of the drawer overlay) */}
                                                            <button
                                                                onClick={() => setDrawerOpen(false)}
                                                                className="absolute top-6 right-6 z-30 px-3 py-1.5 rounded-full bg-black/50 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-all shadow-md"
                                                            >
                                                                ✕ Close
                                                            </button>

                                                            {/* Scrollable container */}
                                                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                                                <div className="min-h-full flex flex-col justify-end p-6 md:p-8 pt-20">
                                                                    {/* Content wrapper */}
                                                                    <motion.div
                                                                        initial={{ y: 24, opacity: 0 }}
                                                                        animate={{ y: 0, opacity: 1 }}
                                                                        exit={{ y: 24, opacity: 0 }}
                                                                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                                                        className="w-full space-y-6"
                                                                    >
                                                                        {/* Ceremony Title inside the drawer */}
                                                                        <h4 className="font-display font-bold text-2xl md:text-3xl text-white tracking-tight leading-tight pr-16 pb-2">
                                                                            {display?.title || 'Ceremony Details'}
                                                                        </h4>

                                                                        {/* Description */}
                                                                        {display?.description && (
                                                                            <div className="pt-2">
                                                                                <p className="text-zinc-300 text-sm leading-relaxed font-medium italic font-serif">
                                                                                    {display.description}
                                                                                </p>
                                                                            </div>
                                                                        )}

                                                                        {/* Attire details (Inline layout, custom styling) */}
                                                                        {(display?.showAttireMale || display?.showAttireFemale) && (
                                                                            <div className="pt-2 space-y-3">
                                                                                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">
                                                                                    Dress Code & Attire
                                                                                </p>
                                                                                <div className="flex flex-col gap-2 text-sm">
                                                                                    {display?.showAttireMale && (
                                                                                        <div className="flex items-center gap-2">
                                                                                            <CoatIcon size={14} className="text-zinc-400 shrink-0" />
                                                                                            <span className="font-semibold text-zinc-300">Gentlemen:</span>
                                                                                            <span className="italic font-serif text-zinc-400">{display.dressCodeMale || 'Formal'}</span>
                                                                                        </div>
                                                                                    )}
                                                                                    {display?.showAttireFemale && (
                                                                                        <div className="flex items-center gap-2">
                                                                                            <FrockIcon size={14} className="text-zinc-400 shrink-0" />
                                                                                            <span className="font-semibold text-zinc-300">Ladies:</span>
                                                                                            <span className="italic font-serif text-zinc-400">{display.dressCodeFemale || 'Evening'}</span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Action Row */}
                                                                        <div className="border-t border-white/20 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                                            {/* Date, Time, Venue in a single clean horizontal line */}
                                                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-zinc-300 text-xs font-semibold">
                                                                                {display?.date && (
                                                                                    <span className="flex items-center gap-1.5">
                                                                                        <Calendar size={13} className="text-zinc-400 shrink-0" />
                                                                                        {new Date(display.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                                                    </span>
                                                                                )}
                                                                                {display?.date && display?.time && <span className="text-white/20 hidden sm:inline">•</span>}
                                                                                {display?.time && (
                                                                                    <span className="flex items-center gap-1.5">
                                                                                        <Clock size={13} className="text-zinc-400 shrink-0" />
                                                                                        {display.time}
                                                                                    </span>
                                                                                )}
                                                                                {display?.time && display?.location && <span className="text-white/20 hidden sm:inline">•</span>}
                                                                                {display?.location && (
                                                                                    <span className="flex items-center gap-1.5 max-w-[220px] truncate" title={display.location}>
                                                                                        <MapPin size={13} className="text-zinc-400 shrink-0" />
                                                                                        {display.location}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="shrink-0 flex justify-start sm:justify-end">
                                                                                <AddToCalendar event={display} iconSize={14} />
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ) : (
                                                        <motion.button
                                                            key="drawer-btn"
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                            onClick={() => setDrawerOpen(true)}
                                                            className="absolute bottom-6 right-6 z-20 flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/50 backdrop-blur-lg border border-white/20 text-white/80 hover:text-white hover:bg-white/10 transition-all text-[10px] font-bold uppercase tracking-widest shadow-xl"
                                                        >
                                                            <Sparkles size={12} />
                                                            Details & Attire
                                                        </motion.button>
                                                    )}
                                                </AnimatePresence>
                                            </>
                                        )}

                                        {/* Hover indicator for non-active cards */}
                                        {!isActive && !editingId && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 pointer-events-none">
                                                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest text-center px-4">
                                                    {event.title || 'Ceremony'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Scroll UI Indicators ── */}
                {!editingId && displayEvents.length > 1 && (
                    <>


                        {/* Right Side Up/Down Arrows */}
                        <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className={`p-2.5 rounded-full backdrop-blur-md border transition-all shadow-xl ${activeIndex > 0 ? 'bg-black/50 border-white/20 text-white hover:bg-white/20 hover:scale-110 active:scale-95 cursor-pointer' : 'bg-black/20 border-white/5 text-white/20 cursor-default pointer-events-none'}`}
                                disabled={activeIndex <= 0}
                                title="Previous Event"
                            >
                                <ChevronUp size={16} />
                            </button>
                            <button
                                onClick={() => navigate(1)}
                                className={`p-2.5 rounded-full backdrop-blur-md border transition-all shadow-xl ${activeIndex < displayEvents.length - 1 ? 'bg-black/50 border-white/20 text-white hover:bg-white/20 hover:scale-110 active:scale-95 cursor-pointer' : 'bg-black/20 border-white/5 text-white/20 cursor-default pointer-events-none'}`}
                                disabled={activeIndex >= displayEvents.length - 1}
                                title="Next Event"
                            >
                                <ChevronDown size={16} />
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Admin HUD - only when not editing inline */}
            {!editingId && (
                <AdminHUD
                    show={canEdit}
                    onAdd={handleAdd}
                    addLabel="Add Event"
                    isEditing={false}
                />
            )}
        </PageLayout>
    );
};

export default Events;
