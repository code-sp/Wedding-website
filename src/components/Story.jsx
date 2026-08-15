import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Upload, Plus, Edit2, Save, X, AlertCircle, Heart, Calendar, Info, 
    RotateCw, Trash2, ArrowRight, Star, Music, Camera, MapPin, 
    Sparkles, Infinity, Cake, Coffee, Utensils, GlassWater, 
    Waves, Mountain, Palmtree, Plane, Bike, Footprints, 
    Church, Gift, Tent, Sun
} from 'lucide-react';

const STORY_ICONS = {
    // Romance & Connection
    heart: Heart,
    infinity: Infinity,
    sparkles: Sparkles,
    star: Star,
    church: Church,
    gift: Gift,
    
    // Dining & Social
    utensils: Utensils,
    coffee: Coffee,
    glass: GlassWater,
    cake: Cake,
    
    // Adventure & Travel
    waves: Waves,
    mountain: Mountain,
    palmtree: Palmtree,
    plane: Plane,
    mappin: MapPin,
    tent: Tent,
    
    // Hobbies & Fun
    camera: Camera,
    music: Music,
    bike: Bike,
    footprints: Footprints,
    sun: Sun
};
import PageLayout from './PageLayout';
import { useImageContext } from '../context/ImageContext';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../utils/imageCompression';
import StandardButton from './common/StandardButton';
import AdminHUD from './common/AdminHUD';

// ── Helpers ──────────────────────────────────────────────────────────────────
const DRAFT_ID = '__draft__';

const parseToMMYYYY = (val) => {
    if (!val) return '';
    if (/^\d{2} \/ \d{4}$/.test(val)) return val;
    if (/^\d{2}\/\d{4}$/.test(val)) {
        const [m, y] = val.split('/');
        return `${m} / ${y}`;
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        return `${m} / ${y}`;
    }
    return val;
};

const formatLong = (val) => {
    const norm = parseToMMYYYY(val);
    const match = norm.match(/^(\d{2}) \/ (\d{4})$/);
    if (match) {
        const [, m, y] = match;
        return new Date(+y, +m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    return val;
};

// ── Components ───────────────────────────────────────────────────────────────
const ErrMsg = ({ msg }) => msg ? (
    <p className="flex items-center gap-1 text-red-500 text-[10px] font-bold uppercase tracking-wider mt-2 ml-1">
        <AlertCircle size={12} /> {msg}
    </p>
) : null;

const Story = () => {
    const { stories, updateContentData } = useImageContext();
    const { isAdmin, isClient } = useAuth();
    const canEdit = isAdmin || isClient;

    const [activeTabId, setActiveTabId] = useState(null);
    const [flippedId, setFlippedId] = useState(null);
    const [draft, setDraft] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editBuffer, setEditBuffer] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    const fileInputRef = useRef(null);
    const carouselRef = useRef(null);
    const wheelTimeout = useRef(null);
    const touchStartX = useRef(null);
    const touchStartY = useRef(null);

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
            setIsMobile(window.innerWidth < 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Initial load — if 3+ stories, start at index 1 for carousel symmetry
    useEffect(() => {
        if (!activeTabId && stories?.length > 0) {
            const startIdx = stories.length >= 3 ? 1 : 0;
            setActiveTabId(stories[startIdx].id);
        }
    }, [stories, activeTabId]);

    // Manual Wheel Scroll Event Listener with { passive: false } to prevent default scroll
    useEffect(() => {
        const carousel = carouselRef.current;
        if (!carousel) return;

        const handleWheelEvent = (e) => {
            if (editingId) return;

            // Block browser default scroll/bounce
            e.preventDefault();

            if (wheelTimeout.current) return;

            if (Math.abs(e.deltaY) > 3 || Math.abs(e.deltaX) > 3) {
                if (e.deltaY > 0 || e.deltaX > 0) {
                    if (stories?.length) {
                        const activeIndex = stories.findIndex(s => s.id === activeTabId);
                        if (activeIndex < stories.length - 1) {
                            setActiveTabId(stories[activeIndex + 1].id);
                            setFlippedId(null);
                        }
                    }
                } else {
                    if (stories?.length) {
                        const activeIndex = stories.findIndex(s => s.id === activeTabId);
                        if (activeIndex > 0) {
                            setActiveTabId(stories[activeIndex - 1].id);
                            setFlippedId(null);
                        }
                    }
                }
                wheelTimeout.current = setTimeout(() => { wheelTimeout.current = null; }, 400);
            }
        };

        carousel.addEventListener('wheel', handleWheelEvent, { passive: false });
        return () => carousel.removeEventListener('wheel', handleWheelEvent);
    }, [activeTabId, editingId, stories]);

    // ── Ordering ──────────────────────────────────────────────────────────────
    // Keep the user-defined order instead of sorting by date
    const sortedStories = [...(stories || [])];

    const activeStory = draft ? draft : (sortedStories.find(s => s.id === activeTabId) || sortedStories[0] || {});

    // Calculate dynamic values based on screen size
    const containerHeight = windowSize.height;
    const cardMaxHeight = Math.min(containerHeight * 0.65, isMobile ? 420 : 600);
    const cardMaxWidth = cardMaxHeight * 0.8; // Force 4:5 vertical rectangle ratio (wider)
    
    // Reduced offset to ensure neighbors 'peek' out from behind the center card
    const dynamicXOffset = isMobile ? windowSize.width * 0.35 : Math.min(windowSize.width * 0.2, 280);
    const dynamicPerspective = Math.max(1200, windowSize.width);

    // ── Scroll Navigation ─────────────────────────────────────────────────────
    const handleNext = () => {
        if (!sortedStories.length || editingId) return;
        const activeIndex = sortedStories.findIndex(s => s.id === activeTabId);
        if (activeIndex < sortedStories.length - 1) {
            setActiveTabId(sortedStories[activeIndex + 1].id);
            setFlippedId(null);
        }
    };

    const handlePrev = () => {
        if (!sortedStories.length || editingId) return;
        const activeIndex = sortedStories.findIndex(s => s.id === activeTabId);
        if (activeIndex > 0) {
            setActiveTabId(sortedStories[activeIndex - 1].id);
            setFlippedId(null);
        }
    };

    const handleWheel = (e) => {
        if (wheelTimeout.current || editingId) return;
        if (Math.abs(e.deltaY) > 3 || Math.abs(e.deltaX) > 3) {
            if (e.deltaY > 0 || e.deltaX > 0) handleNext();
            else handlePrev();
            wheelTimeout.current = setTimeout(() => { wheelTimeout.current = null; }, 400);
        }
    };

    const handleTouchStart = (e) => {
        if (editingId) return;
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
        if (touchStartX.current === null || touchStartY.current === null || editingId) return;
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchStartX.current - touchEndX;
        const diffY = touchStartY.current - touchEndY;

        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal swipe
            if (Math.abs(diffX) > 40) {
                if (diffX > 0) handleNext();
                else handlePrev();
            }
        } else {
            // Vertical swipe
            if (Math.abs(diffY) > 40) {
                if (diffY > 0) handleNext();
                else handlePrev();
            }
        }
        touchStartX.current = null;
        touchStartY.current = null;
    };

    // ── Actions ───────────────────────────────────────────────────────────────
    const handleAdd = () => {
        setDraft({ id: DRAFT_ID, title: '', year: '', description: '', image: '', icon: 'heart' });
        setEditingId(DRAFT_ID);
        setActiveTabId(DRAFT_ID);
        setFlippedId(null);
    };

    const handleStartEdit = () => {
        setEditBuffer({ ...activeStory, year: parseToMMYYYY(activeStory.year), icon: activeStory.icon || 'heart' });
        setEditingId(activeStory.id);
        setFlippedId(activeStory.id); // Auto flip to back so they can see inputs
    };

    const handleCancel = () => {
        if (draft) {
            setDraft(null);
            setActiveTabId(sortedStories[0]?.id || null);
        }
        setEditingId(null);
        setEditBuffer(null);
        setValidationErrors({});
        setFlippedId(null);
    };

    const validate = (d) => {
        const e = {};
        if (!d.image) e.image = "Photograph required";
        if (!d.title?.trim()) e.title = "Title required";
        if (!d.description?.trim()) e.description = "Details required";
        
        if (!d.year) {
            e.year = "Date required";
        } else {
            const m = d.year.match(/^(\d{2}) \/ (\d{4})$/);
            if (!m) e.year = "Format: MM / YYYY";
            else {
                const month = parseInt(m[1]), year = parseInt(m[2]);
                const now = new Date();
                if (month < 1 || month > 12) e.year = "Invalid month";
                if (year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth()+1)) e.year = "Past dates only";
            }
        }
        return e;
    };

    const handleSave = async () => {
        const data = draft || editBuffer;
        const errs = validate(data);
        if (Object.keys(errs).length > 0) {
            setValidationErrors(errs);
            if (errs.image && Object.keys(errs).length === 1) setFlippedId(null);
            else setFlippedId(data.id);
            return;
        }

        let newList;
        if (draft) {
            newList = [...stories, { ...draft, id: Date.now() }];
            setDraft(null);
            setActiveTabId(newList[newList.length-1].id);
        } else {
            newList = stories.map(s => s.id === editingId ? editBuffer : s);
        }

        await updateContentData('stories', newList);
        setEditingId(null);
        setEditBuffer(null);
        setValidationErrors({});
        setFlippedId(null);
    };

    const handleDelete = async (id) => {
        const newList = stories.filter(s => s.id !== id);
        await updateContentData('stories', newList);
        setActiveTabId(newList[0]?.id || null);
    };

    const updateValue = (field, val) => {
        let finalVal = val;
        if (field === 'year') {
            const d = val.replace(/\D/g, '').slice(0, 6);
            finalVal = d.length >= 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d;
        }

        if (draft) setDraft(prev => ({ ...prev, [field]: finalVal }));
        else setEditBuffer(prev => ({ ...prev, [field]: finalVal }));

        if (validationErrors[field]) {
            setValidationErrors(prev => {
                const n = { ...prev };
                delete n[field];
                return n;
            });
        }
    };

    const triggerUpload = () => fileInputRef.current?.click();

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const compressed = await compressImage(file, 1280);
            updateValue('image', compressed);
        } catch (err) { 
            alert("Upload failed"); 
        }
        e.target.value = '';
    };

    if (!stories?.length && !draft) {
        return (
            <PageLayout backgroundText="journey">
                <div className="h-full flex items-center justify-center">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center flex flex-col items-center p-12">
                        <h2 className="font-display font-bold text-5xl lg:text-7xl text-zinc-200 mb-4 max-w-full break-words">Our Story<span className="block text-zinc-400 italic font-light">Begins</span></h2>
                        <p className="text-zinc-400 text-lg mb-10 max-w-sm">Every timeline has a beginning. Start writing yours today.</p>
                        {canEdit && <StandardButton onClick={handleAdd} icon={Plus}>Add First Chapter</StandardButton>}
                    </motion.div>
                </div>
            </PageLayout>
        );
    }

    const displayStories = draft ? [...sortedStories, draft] : sortedStories;

    return (
        <PageLayout backgroundText="" className="!p-0">
            <div className="absolute inset-0 flex flex-col overflow-hidden">
                {canEdit && <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />}

                {/* Header Section */}
                <div className="w-full pt-8 md:pt-10 pb-2 flex flex-col items-center text-center relative z-30 shrink-0 pointer-events-none">
                    <span className="inline-block py-1.5 px-4 rounded-full bg-white/10 border border-white/15 text-white/50 text-[10px] font-bold tracking-[0.3em] uppercase mb-3 shadow-sm backdrop-blur-md">
                        The Narrative
                    </span>
                    <h2 className="font-display font-bold text-4xl lg:text-5xl text-white tracking-tighter mb-4">
                        Our <span className="text-white/50 italic font-light">Story</span>
                    </h2>
                    <p className="text-zinc-400 font-medium text-sm md:text-base leading-relaxed max-w-xl mx-auto font-serif italic px-4">
                        The chapters of our journey together.
                    </p>
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                    {displayStories.length === 2 ? (
                        /* ── Side-by-Side layout for exactly 2 stories ── */
                        <div className="flex-1 flex items-center justify-center px-6 md:px-12 pb-12 md:pb-20 gap-6 md:gap-10">
                            {displayStories.map((story) => {
                                const isFlipped = flippedId === story.id;
                                const isEditingThis = editingId === story.id;
                                const isActive = activeTabId === story.id;
                                const currentStory = isEditingThis ? (draft || editBuffer) : story;

                                return (
                                    <motion.div
                                        key={story.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                        className="flex-1 cursor-pointer"
                                        style={{
                                            maxWidth: `${cardMaxWidth}px`,
                                            height: `${cardMaxHeight}px`,
                                            transformStyle: 'preserve-3d',
                                            perspective: `${dynamicPerspective}px`
                                        }}
                                        onClick={() => {
                                            setActiveTabId(story.id);
                                            setFlippedId(isFlipped ? null : story.id);
                                        }}
                                    >
                                        <motion.div
                                            className={`w-full h-full relative rounded-[2.5rem] md:rounded-[3rem] group transition-shadow duration-500 ${
                                                isEditingThis
                                                    ? 'ring-2 ring-white/20 shadow-[0_0_50px_rgba(0,0,0,0.3)]'
                                                    : 'shadow-[0_20px_60px_rgba(0,0,0,0.4),0_40px_80px_rgba(0,0,0,0.3)]'
                                            }`}
                                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                            style={{ transformStyle: 'preserve-3d' }}
                                        >
                                            {/* FRONT FACE */}
                                            <div className="absolute inset-0 rounded-[2.5rem] md:rounded-[3rem] overflow-hidden bg-brand-gray select-none shadow-inner" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(0deg) translateZ(1px)' }}>
                                                <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-black/40 to-brand-cream/80 backdrop-blur-3xl" />
                                                {canEdit && !isEditingThis && (
                                                    <div className="absolute top-5 right-5 flex flex-col gap-2 z-[60] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setActiveTabId(story.id); handleStartEdit(); }}
                                                            className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md shadow-xl border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all transform hover:scale-110 active:scale-90"
                                                            title="Edit Chapter"
                                                        >
                                                            <Edit2 size={15} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(story.id); }}
                                                            className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md shadow-xl border border-white/10 flex items-center justify-center text-rose-400 hover:text-white hover:bg-rose-500 hover:border-rose-500 transition-all transform hover:scale-110 active:scale-90"
                                                            title="Delete Chapter"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                )}
                                                <div className="relative w-full h-full">
                                                    {currentStory.image ? (
                                                        <img src={currentStory.image} className="w-full h-full object-cover pointer-events-none" alt={currentStory.title} draggable="false" />
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center bg-black/5 gap-4">
                                                            <Upload size={48} className="text-white/20" />
                                                            <p className="font-bold text-xs uppercase tracking-widest text-white/30">Photograph Required</p>
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                                                    {!isEditingThis && (
                                                        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 pointer-events-none flex justify-between items-end">
                                                            <div>
                                                                <p className="text-white/70 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] mb-2">{formatLong(currentStory.year) || 'Date TBA'}</p>
                                                                <h3 className="text-white font-display text-3xl md:text-4xl font-bold leading-tight">{currentStory.title || 'Untitled Chapter'}</h3>
                                                            </div>
                                                            {!isFlipped && (
                                                                <div className="text-white/90 bg-black/40 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20 shadow-xl flex items-center text-[9px] font-bold tracking-[0.25em] uppercase hover:bg-white/10 transition-colors pointer-events-auto cursor-pointer">
                                                                    Read Story
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {isEditingThis && (
                                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer">
                                                            <StandardButton variant="secondary" icon={Upload} onClick={(e) => { e.stopPropagation(); triggerUpload(); }}>
                                                                {currentStory.image ? 'Change Photo' : 'Upload Photo'}
                                                            </StandardButton>
                                                            {validationErrors.image && <p className="text-red-400 font-bold mt-4 bg-white/90 px-4 py-2 rounded-full text-xs shadow-lg">{validationErrors.image}</p>}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* BACK FACE */}
                                            <div
                                                className="absolute inset-0 rounded-[2.5rem] md:rounded-[3rem] overflow-hidden bg-zinc-900 shadow-[inset_0_4px_20px_rgba(0,0,0,0.4)]"
                                                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg) translateZ(1px)' }}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/80 via-black/60 to-zinc-800/80 backdrop-blur-3xl" />
                                                <div className="relative h-full w-full flex flex-col items-center justify-center text-center p-8 md:p-12 z-10">
                                                    <div className="flex-1 overflow-y-auto w-full custom-scrollbar pb-4 flex flex-col justify-center gap-4">
                                                        {isEditingThis ? (
                                                            <div className="h-full flex flex-col gap-4">
                                                                <div className="w-full shrink-0">
                                                                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 mb-2 text-left ml-2">Choose Symbol</p>
                                                                    <div className="flex overflow-x-auto gap-2 pb-3 px-1 no-scrollbar snap-x">
                                                                        {Object.entries(STORY_ICONS).map(([name, Icon]) => (
                                                                            <button
                                                                                key={name}
                                                                                onClick={(e) => { e.stopPropagation(); updateValue('icon', name); }}
                                                                                className={`p-3 rounded-xl transition-all shrink-0 snap-start ${currentStory.icon === name ? 'bg-white text-zinc-900 shadow-lg scale-105' : 'bg-white/10 text-white/30 hover:bg-white/20'}`}
                                                                            >
                                                                                <Icon size={18} />
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <textarea
                                                                    value={currentStory.description}
                                                                    onChange={e => updateValue('description', e.target.value)}
                                                                    onClick={e => e.stopPropagation()}
                                                                    placeholder="Describe this beautiful moment..."
                                                                    className={`w-full flex-1 bg-transparent hover:bg-white/10 focus:bg-white/10 transition-all duration-300 rounded-2xl p-6 text-white/90 text-xl md:text-2xl font-serif italic outline-none resize-none text-center placeholder:text-white/20 ${validationErrors.description ? 'ring-2 ring-red-400' : ''}`}
                                                                />
                                                                <div className="w-full shrink-0 space-y-4 pt-4 border-t border-white/10">
                                                                    <input type="text" value={currentStory.title} onChange={e => updateValue('title', e.target.value)} onClick={e => e.stopPropagation()} placeholder="Chapter Title" className={`w-full bg-transparent hover:bg-white/10 focus:bg-white/10 transition-all duration-300 rounded-xl px-4 py-2 text-center font-display font-bold text-3xl md:text-4xl text-white outline-none placeholder:text-white/20 ${validationErrors.title ? 'ring-2 ring-red-400' : ''}`} />
                                                                    <input type="text" value={currentStory.year} onChange={e => updateValue('year', e.target.value)} onClick={e => e.stopPropagation()} placeholder="MM / YYYY" className={`w-full bg-transparent hover:bg-white/10 focus:bg-white/10 transition-all duration-300 rounded-xl px-4 py-2 text-center text-xs font-bold uppercase tracking-[0.4em] text-white/60 outline-none placeholder:text-white/20 ${validationErrors.year ? 'ring-2 ring-red-400' : ''}`} />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {(() => { const IconComp = STORY_ICONS[currentStory.icon] || Heart; return <IconComp size={40} strokeWidth={1.5} className="text-white/20 mx-auto mb-8 shrink-0" />; })()}
                                                                <p className="text-white/80 text-lg md:text-xl lg:text-2xl leading-relaxed font-serif italic break-words whitespace-pre-line">
                                                                    "{currentStory.description || 'No details provided for this chapter.'}"
                                                                </p>
                                                                <div className="w-full pt-6 mt-4 border-t border-white/10 shrink-0">
                                                                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-white/40">{currentStory.title}</p>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        /* ── 3D Carousel for 1 or 3+ stories ── */
                        <div
                            ref={carouselRef}
                            className="flex-1 relative w-full h-full flex items-center justify-center overflow-hidden pb-12 md:pb-20"
                            onTouchStart={handleTouchStart}
                            onTouchEnd={handleTouchEnd}
                            style={{
                                maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
                                WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)'
                            }}
                        >
                            {/* 3D Carousel */}
                            <div
                                className="relative w-full h-full flex items-center justify-center overflow-visible mt-4 md:mt-8"
                                style={{ perspective: `${dynamicPerspective}px` }}
                            >
                                {displayStories.map((story, i) => {
                                    const activeIndex = displayStories.findIndex(s => s.id === activeTabId);
                                    const diff = i - activeIndex;
                                    const isActive = diff === 0;
                                    const isFlipped = flippedId === story.id;
                                    const isEditingThis = editingId === story.id;
                                    const currentStory = isEditingThis ? (draft || editBuffer) : story;

                                    let xOffset, zOffset, rotateY;

                                    if (Math.abs(diff) <= 1) {
                                        xOffset = diff * dynamicXOffset;
                                        zOffset = -Math.abs(diff) * 150;
                                        rotateY = diff * -25;
                                    } else {
                                        const sign = Math.sign(diff);
                                        const extraDiff = Math.abs(diff) - 1;
                                        const extraOffsetX = isMobile ? 40 : 60;
                                        xOffset = sign * (dynamicXOffset + extraDiff * extraOffsetX);
                                        zOffset = -150 - extraDiff * 100;
                                        rotateY = sign * (25 + extraDiff * 5) * -1;
                                    }

                                    return (
                                        <motion.div
                                            key={story.id}
                                            initial={false}
                                            animate={{
                                                x: xOffset,
                                                z: zOffset,
                                                rotateY: rotateY,
                                                opacity: Math.abs(diff) >= 3 ? 0 : 1,
                                                scale: isActive ? 1 : 0.85
                                            }}
                                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                            className={`absolute top-1/2 left-1/2 cursor-pointer bg-transparent rounded-[2.5rem] md:rounded-[3rem] pointer-events-auto ${isActive ? '' : 'hover:scale-[0.98]'}`}
                                            style={{
                                                width: `${cardMaxWidth}px`,
                                                height: `${cardMaxHeight}px`,
                                                translateX: '-50%',
                                                translateY: '-50%',
                                                zIndex: 50 - Math.abs(diff),
                                                transformStyle: 'preserve-3d',
                                                perspective: `${dynamicPerspective}px`
                                            }}
                                        >
                                            <motion.div
                                                className={`w-full h-full relative rounded-[2.5rem] md:rounded-[3rem] group transition-shadow duration-500 ${
                                                        isActive && !isEditingThis
                                                            ? 'shadow-[0_20px_60px_rgba(0,0,0,0.4),0_40px_80px_rgba(0,0,0,0.3)]'
                                                            : (isEditingThis ? 'ring-2 ring-white/20 shadow-[0_0_50px_rgba(0,0,0,0.3)]' : 'shadow-xl')
                                                    }`}
                                                animate={{ rotateY: isFlipped ? 180 : 0 }}
                                                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                                style={{ transformStyle: 'preserve-3d' }}
                                                onClick={() => {
                                                    if (isActive) {
                                                        setFlippedId(isFlipped ? null : story.id);
                                                    } else {
                                                        setActiveTabId(story.id);
                                                        setFlippedId(null);
                                                    }
                                                }}
                                            >
                                                {/* FRONT FACE */}
                                                <div className="absolute inset-0 rounded-[2.5rem] md:rounded-[3rem] overflow-hidden bg-brand-gray select-none shadow-inner" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(0deg) translateZ(1px)' }}>
                                                    {/* Glossy Gradient Overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-black/40 to-brand-cream/80 backdrop-blur-3xl" />

                                                    {/* MANAGEMENT BUTTONS (TOP RIGHT) */}
                                                    {canEdit && isActive && !isEditingThis && (
                                                        <div className="absolute top-5 right-5 flex flex-col gap-2 z-[60] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleStartEdit(); }}
                                                                className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md shadow-xl border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all transform hover:scale-110 active:scale-90"
                                                                title="Edit Chapter"
                                                            >
                                                                <Edit2 size={15} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDelete(story.id); }}
                                                                className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md shadow-xl border border-white/10 flex items-center justify-center text-rose-400 hover:text-white hover:bg-rose-500 hover:border-rose-500 transition-all transform hover:scale-110 active:scale-90"
                                                                title="Delete Chapter"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    )}

                                                    <div className="relative w-full h-full">
                                                        {currentStory.image ? (
                                                            <img src={currentStory.image} className="w-full h-full object-cover pointer-events-none" alt={currentStory.title} draggable="false" />
                                                        ) : (
                                                            <div className="w-full h-full flex flex-col items-center justify-center bg-black/5 gap-4">
                                                                <Upload size={48} className="text-white/20" />
                                                                <p className="font-bold text-xs uppercase tracking-widest text-white/30">Photograph Required</p>
                                                            </div>
                                                        )}

                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                                                        {!isEditingThis && (
                                                            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 pointer-events-none flex justify-between items-end">
                                                                <div>
                                                                    <p className="text-white/70 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] mb-2">{formatLong(currentStory.year) || 'Date TBA'}</p>
                                                                    <h3 className="text-white font-display text-3xl md:text-4xl font-bold leading-tight">{currentStory.title || 'Untitled Chapter'}</h3>
                                                                </div>
                                                                {isActive && !isFlipped && (
                                                                    <div className="text-white/90 bg-black/40 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20 shadow-xl flex items-center text-[9px] font-bold tracking-[0.25em] uppercase hover:bg-white/10 transition-colors pointer-events-auto cursor-pointer">
                                                                        Read Story
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {isEditingThis && (
                                                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer">
                                                                <StandardButton variant="secondary" icon={Upload} onClick={(e) => { e.stopPropagation(); triggerUpload(); }}>
                                                                    {currentStory.image ? 'Change Photo' : 'Upload Photo'}
                                                                </StandardButton>
                                                                {validationErrors.image && <p className="text-red-400 font-bold mt-4 bg-white/90 px-4 py-2 rounded-full text-xs shadow-lg">{validationErrors.image}</p>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* BACK FACE */}
                                                <div
                                                    className="absolute inset-0 rounded-[2.5rem] md:rounded-[3rem] overflow-hidden bg-zinc-900 shadow-[inset_0_4px_20px_rgba(0,0,0,0.4)]"
                                                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg) translateZ(1px)' }}
                                                >
                                                    {/* Dark Glass Overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/80 via-black/60 to-zinc-800/80 backdrop-blur-3xl" />

                                                    <div className="relative h-full w-full flex flex-col items-center justify-center text-center p-8 md:p-12 z-10">
                                                        <div className="flex-1 overflow-y-auto w-full custom-scrollbar pb-4 flex flex-col justify-center gap-4">
                                                            {isEditingThis ? (
                                                                <div className="h-full flex flex-col gap-4">
                                                                    {/* Enhanced Icon Selector Gallery */}
                                                                    <div className="w-full shrink-0">
                                                                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 mb-2 text-left ml-2">Choose Symbol</p>
                                                                        <div className="flex overflow-x-auto gap-2 pb-3 px-1 no-scrollbar snap-x">
                                                                            {Object.entries(STORY_ICONS).map(([name, Icon]) => (
                                                                                <button
                                                                                    key={name}
                                                                                    onClick={(e) => { e.stopPropagation(); updateValue('icon', name); }}
                                                                                    className={`p-3 rounded-xl transition-all shrink-0 snap-start ${currentStory.icon === name ? 'bg-white text-zinc-900 shadow-lg scale-105' : 'bg-white/10 text-white/30 hover:bg-white/20'}`}
                                                                                >
                                                                                    <Icon size={18} />
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    <textarea
                                                                        value={currentStory.description}
                                                                        onChange={e => updateValue('description', e.target.value)}
                                                                        onClick={e => e.stopPropagation()}
                                                                        placeholder="Describe this beautiful moment..."
                                                                        className={`w-full flex-1 bg-transparent hover:bg-white/10 focus:bg-white/10 transition-all duration-300 rounded-2xl p-6 text-white/90 text-xl md:text-2xl font-serif italic outline-none resize-none text-center placeholder:text-white/20 ${validationErrors.description ? 'ring-2 ring-red-400' : ''}`}
                                                                    />
                                                                    <div className="w-full shrink-0 space-y-4 pt-4 border-t border-white/10">
                                                                        <input
                                                                            type="text"
                                                                            value={currentStory.title}
                                                                            onChange={e => updateValue('title', e.target.value)}
                                                                            onClick={e => e.stopPropagation()}
                                                                            placeholder="Chapter Title"
                                                                            className={`w-full bg-transparent hover:bg-white/10 focus:bg-white/10 transition-all duration-300 rounded-xl px-4 py-2 text-center font-display font-bold text-3xl md:text-4xl text-white outline-none placeholder:text-white/20 ${validationErrors.title ? 'ring-2 ring-red-400' : ''}`}
                                                                        />
                                                                        <input
                                                                            type="text"
                                                                            value={currentStory.year}
                                                                            onChange={e => updateValue('year', e.target.value)}
                                                                            onClick={e => e.stopPropagation()}
                                                                            placeholder="MM / YYYY"
                                                                            className={`w-full bg-transparent hover:bg-white/10 focus:bg-white/10 transition-all duration-300 rounded-xl px-4 py-2 text-center text-xs font-bold uppercase tracking-[0.4em] text-white/60 outline-none placeholder:text-white/20 ${validationErrors.year ? 'ring-2 ring-red-400' : ''}`}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    {(() => {
                                                                        const IconComp = STORY_ICONS[currentStory.icon] || Heart;
                                                                        return <IconComp size={40} strokeWidth={1.5} className="text-white/20 mx-auto mb-8 shrink-0" />;
                                                                    })()}
                                                                    <p className="text-white/80 text-lg md:text-xl lg:text-2xl leading-relaxed font-serif italic break-words whitespace-pre-line">
                                                                        "{currentStory.description || 'No details provided for this chapter.'}"
                                                                    </p>
                                                                    <div className="w-full pt-6 mt-4 border-t border-white/10 shrink-0">
                                                                        <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-white/40">
                                                                            {currentStory.title}
                                                                        </p>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <AdminHUD
                show={canEdit}
                isEditing={!!editingId}
                onAdd={handleAdd}
                onEdit={null} 
                onSave={handleSave}
                onCancel={handleCancel}
                onDelete={null} 
                addLabel="Add Chapter"
                editLabel="" 
            />
        </PageLayout>
    );
};

export default Story;
