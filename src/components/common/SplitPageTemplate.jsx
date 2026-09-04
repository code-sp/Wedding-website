import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Image as ImageIcon, Upload, GripVertical } from 'lucide-react';
import PageLayout from '../PageLayout';
import DeleteButton from '../DeleteButton';
import { useAuth } from '../../context/AuthContext';
import { compressImage } from '../../utils/imageCompression';
import StandardButton from './StandardButton';
import AdminHUD from './AdminHUD';
import AppleBentoGrid from './AppleBentoGrid';

// Responsive column count for CSS columns masonry
function useColumnCount() {
    const getInitialCols = () => {
        if (typeof window === 'undefined') return 2;
        const w = window.innerWidth;
        if (w >= 1280) return 4;
        if (w >= 1024) return 3;
        if (w >= 640)  return 2;
        return 1;
    };

    const [cols, setCols] = useState(getInitialCols);

    useLayoutEffect(() => {
        const update = () => {
            const w = window.innerWidth;
            if (w >= 1280) setCols(4);
            else if (w >= 1024) setCols(3);
            else if (w >= 640)  setCols(2);
            else                setCols(1);
        };
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);
    return cols;
}

const SplitPageTemplate = ({
    backgroundText, 
    headerTag, 
    titleNormal, 
    titleItalic, 
    subtitle, 
    emptyStateNormal, 
    emptyStateItalic, 
    items, 
    onAdd, 
    onDelete, 
    onReorder = null,
    renderItem, 
    allowMultipleUploads = false,
    requireUploaderName = false,
    customLeftContent = null,
    masonry = true
}) => {
    const { isAdmin, isClient } = useAuth();
    const canEdit = isAdmin || isClient;
    const fileInputRef = useRef(null);
    const masonryCols = useColumnCount();
    
    const [selectedImage, setSelectedImage] = useState(null);
    const [reorderItems, setReorderItems] = useState(items || []);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [isReorderMode, setIsReorderMode] = useState(false);
    const lastSwapTimeRef = useRef(0);
    // snapshot of order when entering reorder mode (for cancel)
    const reorderSnapshot = useRef(null);

    // Keep reorderItems in sync when items update from parent
    useEffect(() => {
        if (!items) {
            setReorderItems([]);
            return;
        }
        const sanitized = items.map((item, idx) => {
            const stableId = item.id || item.src || item.url || `item-stable-${idx}`;
            return {
                ...item,
                id: stableId
            };
        });
        setReorderItems(sanitized);
    }, [items]);

    const handleDragStart = (e, index) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));

        // Create a temporary unclipped clone to avoid clipped drag previews
        const media = e.currentTarget.querySelector('img, video');
        if (media) {
            const rect = media.getBoundingClientRect();
            const parentRect = e.currentTarget.getBoundingClientRect();
            const offsetX = e.clientX - parentRect.left;
            const offsetY = e.clientY - parentRect.top;

            const clone = media.cloneNode(true);
            clone.style.cssText = `position:fixed;top:0;left:0;width:${rect.width}px;height:${rect.height}px;z-index:-99999;pointer-events:none;border-radius:2rem;opacity:1;transition:none;transform:none;`;
            document.body.appendChild(clone);
            try { e.dataTransfer.setDragImage(clone, offsetX, offsetY); } catch (err) {}
            setTimeout(() => clone.remove(), 0);
        }

        setTimeout(() => setDraggedIndex(index), 0);
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        
        // Live magnetic snapping in uniform grid
        const now = Date.now();
        if (now - lastSwapTimeRef.current < 200) return;
        lastSwapTimeRef.current = now;

        const newItems = [...reorderItems];
        const draggedItem = newItems[draggedIndex];
        newItems.splice(draggedIndex, 1);
        newItems.splice(index, 0, draggedItem);

        setDraggedIndex(index);
        setReorderItems(newItems);
    };

    const handleDrop = (e, index) => {
        e.preventDefault();
        // Drop handled by live swapping during dragOver
        setDraggedIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const handleEnterReorder = () => {
        reorderSnapshot.current = [...reorderItems];
        setIsReorderMode(true);
    };

    const handleSaveReorder = () => {
        setIsReorderMode(false);
        if (onReorder) onReorder(reorderItems);
    };

    const handleCancelReorder = () => {
        if (reorderSnapshot.current) setReorderItems(reorderSnapshot.current);
        setIsReorderMode(false);
    };

    const handleTouchStart = (e, index) => {
        setDraggedIndex(index);
    };

    const handleTouchMove = (e) => {
        if (draggedIndex === null) return;
        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const itemEl = element?.closest('[data-drag-index]');
        if (itemEl) {
            const index = parseInt(itemEl.getAttribute('data-drag-index'), 10);
            if (index !== draggedIndex && !isNaN(index)) {
                const now = Date.now();
                if (now - lastSwapTimeRef.current < 200) return;
                lastSwapTimeRef.current = now;

                const newItems = [...reorderItems];
                const draggedItem = newItems[draggedIndex];
                newItems.splice(draggedIndex, 1);
                newItems.splice(index, 0, draggedItem);
                setDraggedIndex(index);
                setReorderItems(newItems);
            }
        }
    };

    const handleTouchEnd = () => {
        setDraggedIndex(null);
    };
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploaderName, setUploaderName] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [uploadError, setUploadError] = useState('');

    const [isDraggingOverFile, setIsDraggingOverFile] = useState(false);
    const dragCounter = useRef(0);

    useEffect(() => {
        if (!selectedFile) {
            setPreviewUrl('');
            return undefined;
        }
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [selectedFile]);

    useEffect(() => {
        if (!selectedImage && !showUploadModal) return undefined;
        const onKeyDown = (event) => {
            if (event.key !== 'Escape') return;
            setSelectedImage(null);
            setShowUploadModal(false);
            setSelectedFile(null);
            setUploaderName('');
            setUploadError('');
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [selectedImage, showUploadModal]);

    const handleDragEnterFile = (e) => {
        e.preventDefault();
        if (!canEdit) return;
        
        if (e.dataTransfer.types.includes('Files')) {
            dragCounter.current += 1;
            setIsDraggingOverFile(true);
        }
    };

    const handleDragLeaveFile = (e) => {
        e.preventDefault();
        if (!canEdit) return;
        
        if (e.dataTransfer.types.includes('Files')) {
            dragCounter.current = Math.max(0, dragCounter.current - 1);
            if (dragCounter.current === 0) {
                setIsDraggingOverFile(false);
            }
        }
    };

    const handleDragOverFile = (e) => {
        e.preventDefault();
        if (!canEdit) return;
        
        if (e.dataTransfer.types.includes('Files')) {
            e.dataTransfer.dropEffect = 'copy';
        }
    };

    const handleDropFile = async (e) => {
        e.preventDefault();
        if (!canEdit) return;
        
        dragCounter.current = 0;
        setIsDraggingOverFile(false);

        // Do not handle file upload drops if we are reordering items internally
        if (draggedIndex !== null) return;

        setUploadError('');
        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        if (imageFiles.length === 0) return;

        if (requireUploaderName) {
            setSelectedFile(imageFiles[0]);
            setShowUploadModal(true);
            return;
        }

        const newItems = [];
        for (const file of imageFiles) {
            try {
                const compressed = await compressImage(file);
                newItems.push({
                    id: Date.now() + Math.random(),
                    src: compressed,
                    alt: 'Uploaded Photo',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('[DROP_UPLOAD] Compression failed:', error);
                setUploadError(error instanceof Error ? error.message : 'Unable to upload image');
            }
        }
        
        if (newItems.length > 0) {
            onAdd(allowMultipleUploads ? newItems : newItems[0]);
        }
    };

    const handleFileChange = async (e) => {
        setUploadError('');
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        if (requireUploaderName) {
            setSelectedFile(files[0]);
            setShowUploadModal(true);
            e.target.value = '';
            return;
        }

        const newItems = [];
        for (const file of files) {
            try {
                const compressed = await compressImage(file);
                newItems.push({
                    id: Date.now() + Math.random(),
                    src: compressed,
                    alt: 'Uploaded Photo',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error(error);
                setUploadError(error instanceof Error ? error.message : 'Unable to upload image');
            }
        }
        
        if (newItems.length > 0) {
            onAdd(allowMultipleUploads ? newItems : newItems[0]);
        }
        e.target.value = '';
    };

    const handleNamedUpload = async (e) => {
        e.preventDefault();
        try {
            setUploadError('');
            if (!selectedFile) throw new Error('Choose an image first');
            const compressed = await compressImage(selectedFile);
            onAdd({
                id: Date.now(),
                src: compressed,
                uploaderName: uploaderName.trim() || 'Anonymous',
                timestamp: new Date().toISOString()
            });
            setShowUploadModal(false);
            setUploaderName('');
            setSelectedFile(null);
        } catch (error) {
            console.error(error);
            setUploadError(error instanceof Error ? error.message : 'Unable to upload image');
        }
    };

    return (
        <PageLayout backgroundText={backgroundText}>
            <div 
                className="relative z-10 w-full h-full flex flex-col overflow-y-auto custom-scrollbar"
                onDragEnter={canEdit ? handleDragEnterFile : undefined}
                onDragOver={canEdit ? handleDragOverFile : undefined}
                onDragLeave={canEdit ? handleDragLeaveFile : undefined}
                onDrop={canEdit ? handleDropFile : undefined}
            >
                <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/webp" multiple={allowMultipleUploads} onChange={handleFileChange} />

                <AnimatePresence>
                    {isDraggingOverFile && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/85 backdrop-blur-md border-4 border-dashed border-brand-accent/40 m-4 md:m-8 rounded-[2rem] md:rounded-[3rem] transition-all duration-300"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 15 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 15 }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="flex flex-col items-center text-center p-8 pointer-events-none"
                            >
                                <div className="p-6 bg-brand-accent/10 border border-brand-accent/20 rounded-full mb-6 text-brand-accent animate-bounce">
                                    <Upload size={48} />
                                </div>
                                <h3 className="font-display font-bold text-2xl md:text-3xl text-zinc-100 mb-2">Drop your photos here</h3>
                                <p className="text-zinc-400 text-sm max-w-xs leading-relaxed">
                                    Drop your image files to instantly upload them to this {backgroundText === 'memories' ? 'gallery' : 'community page'}.
                                </p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {(!items || items.length === 0) ? (
                    <div className="flex-grow flex items-center justify-center p-6 min-h-[70vh]">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            className="text-center flex flex-col items-center p-12"
                        >
                            <h2 className="font-display font-bold text-5xl lg:text-7xl text-zinc-200 mb-4 max-w-full break-words">
                                {emptyStateNormal}
                                <span className="block text-zinc-400 italic font-light mt-2">{emptyStateItalic}</span>
                            </h2>
                            <p className="text-zinc-400 text-lg mb-10 max-w-sm leading-relaxed">
                                {canEdit 
                                    ? "Every love story deserves a gallery. Start adding your most treasured photographs."
                                    : "Beautiful memories from this celebration will appear here soon."
                                }
                            </p>
                            {canEdit && (
                                <StandardButton onClick={() => fileInputRef.current?.click()} icon={Plus}>
                                    Add First Photo
                                </StandardButton>
                            )}
                        </motion.div>
                    </div>
                ) : (
                    <>
                        {/* HEADER SECTION - Cinematic Entrance */}
                        <div className="w-full pt-8 md:pt-12 pb-6 px-6 flex flex-col items-center text-center relative z-30 shrink-0">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                className="max-w-4xl mx-auto"
                            >
                                <span className="inline-block py-1.5 px-5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white/50 text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase mb-4 shadow-sm">
                                    {headerTag}
                                </span>
                                <h2 className="font-display font-bold text-5xl lg:text-6xl text-zinc-200 leading-[1.1] tracking-tighter mb-4 max-w-full break-words">
                                    {titleNormal} <span className="text-zinc-400 italic font-light">{titleItalic}</span>
                                </h2>
                                <p className="text-zinc-400 font-medium text-sm md:text-base leading-relaxed max-w-xl mx-auto font-serif italic">
                                    {subtitle}
                                </p>
                            </motion.div>
                            {customLeftContent}
                        </div>

                        {/* CONTENT SECTION */}
                        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-12 lg:px-20 pb-32">
                            {isReorderMode ? (
                                /* ARRANGE MODE CANVAS - Uniform Grid */
                                <motion.div 
                                    layout
                                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                                >
                                    {reorderItems.map((item, index) => (
                                        <motion.div
                                            layout
                                            layoutId={item.id}
                                            key={item.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, index)}
                                            onDragOver={(e) => handleDragOver(e, index)}
                                            onDrop={(e) => handleDrop(e, index)}
                                            onDragEnd={handleDragEnd}
                                            onTouchStart={(e) => handleTouchStart(e, index)}
                                            onTouchMove={handleTouchMove}
                                            onTouchEnd={handleTouchEnd}
                                            data-drag-index={index}
                                            className={`relative aspect-square rounded-[1.5rem] overflow-hidden bg-white/5 border cursor-grab active:cursor-grabbing transition-shadow duration-300 shadow-md ${
                                                draggedIndex === index ? 'opacity-50 border-brand-accent/50 shadow-2xl scale-95 z-50' : 'border-white/20 hover:border-white/40'
                                            }`}
                                            style={{ touchAction: 'none' }}
                                            transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
                                        >
                                            <img
                                                src={item.src || item.url}
                                                alt="Reorder item"
                                                className="w-full h-full object-cover pointer-events-none"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                                <div className="bg-black/60 backdrop-blur-md rounded-2xl px-4 py-3 flex items-center gap-2 text-white/80 shadow-xl border border-white/10">
                                                    <GripVertical size={18} />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">Drag</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            ) : masonry ? (
                                /* VIEWING MODE - Masonry Layout */
                                <motion.div layout style={{ columnCount: masonryCols, columnGap: '1.5rem', columnFill: 'auto' }}>
                                    {reorderItems.map((item, index) => (
                                        <motion.div
                                            layout
                                            layoutId={item.id}
                                            key={item.id}
                                            className="inline-block align-top w-full break-inside-avoid mb-4 md:mb-6 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 relative group/item transition-all duration-300"
                                            transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
                                        >
                                            {renderItem(item, index, () => setSelectedImage(item))}
                                            
                                            {/* Delete button */}
                                            {canEdit && onDelete && (
                                                <div className="absolute top-4 right-4 z-20 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                    <DeleteButton
                                                        onDelete={() => onDelete(item.id)}
                                                        size={11}
                                                        requireConfirm={false}
                                                        className="h-7 w-7 flex items-center justify-center bg-black/60 backdrop-blur-md rounded-full shadow-lg text-rose-400 hover:bg-rose-500 hover:text-white border border-white/10 transition-all hover:scale-110 active:scale-90"
                                                    />
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </motion.div>
                            ) : (
                                /* VIEWING MODE - Apple Bento Grid */
                                <AppleBentoGrid
                                    items={reorderItems}
                                    gap={16}
                                    canDrag={false}
                                    renderItem={(item, index) => (
                                        <div className="relative group/item">
                                            {renderItem(item, index, () => setSelectedImage(item))}
                                            {canEdit && onDelete && (
                                                <div className="absolute top-4 right-4 z-20 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                    <DeleteButton 
                                                        onDelete={() => onDelete(item.id)} 
                                                        size={11}
                                                        requireConfirm={false}
                                                        className="h-7 w-7 flex items-center justify-center bg-black/60 backdrop-blur-md rounded-full shadow-lg text-rose-400 hover:bg-rose-500 hover:text-white border border-white/10 transition-all hover:scale-110 active:scale-90" 
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                />
                            )}
                        </div>
                    </>
                )}
            </div>

            <AdminHUD
                show={canEdit && items && items.length > 0}
                onAdd={isReorderMode ? null : () => fileInputRef.current?.click()}
                addLabel="Upload Media"
                isEditing={isReorderMode}
                onEdit={onReorder ? handleEnterReorder : null}
                onSave={handleSaveReorder}
                onCancel={isReorderMode ? handleCancelReorder : null}
                editLabel="Reorder"
                saveLabel="Done"
            />

            {/* Lightbox - Pro Grade */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-brand-black/98 flex items-center justify-center backdrop-blur-3xl"
                        onClick={() => setSelectedImage(null)}
                    >
                        <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(event) => {
                                event.stopPropagation();
                                setSelectedImage(null);
                            }}
                            aria-label="Close photo preview"
                            className="absolute top-6 right-6 md:top-10 md:right-10 text-white/40 hover:text-white transition-all p-3 md:p-4 bg-white/5 rounded-full backdrop-blur-md border border-white/10"
                        >
                            <X size={32} />
                        </motion.button>
                        <motion.img
                            key={selectedImage.id}
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            src={selectedImage.src || selectedImage.url}
                            alt={selectedImage.alt || 'Gallery photo preview'}
                            className="max-w-[92vw] max-h-[85vh] object-contain rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/5"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Moments Specific Modal */}
            {showUploadModal && requireUploaderName && (
                <div className="fixed inset-0 bg-brand-black/60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/95 backdrop-blur-2xl rounded-[3rem] w-full max-w-md overflow-hidden shadow-2xl border border-white">
                        <div className="p-8 border-b border-brand-black/5 flex justify-between items-center">
                            <h3 className="font-display font-bold text-2xl text-brand-black">Share Your Moment</h3>
                            <button onClick={() => { setShowUploadModal(false); setSelectedFile(null); setUploadError(''); }} aria-label="Close upload dialog" className="text-brand-black/40 hover:text-brand-black transition-colors p-2 bg-brand-black/5 rounded-full">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-10">
                            <div className="mb-8 rounded-[2rem] overflow-hidden aspect-square shadow-inner">
                                {previewUrl && <img src={previewUrl} alt="Selected upload preview" className="w-full h-full object-cover" />}
                            </div>
                            <form onSubmit={handleNamedUpload} className="space-y-8">
                                {uploadError && <p role="alert" className="text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{uploadError}</p>}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-black/40 ml-1">Your Name</label>
                                    <input type="text" value={uploaderName} onChange={(e) => setUploaderName(e.target.value)} placeholder="Enter your name (optional)" className="w-full px-6 py-4 rounded-2xl border border-brand-black/10 bg-white/60 focus:bg-white focus:border-brand-black/20 outline-none transition-all font-bold text-brand-black" />
                                </div>
                                <StandardButton type="submit" size="lg" className="w-full" icon={Upload}>Share Photo</StandardButton>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </PageLayout>
    );
};

export default React.memo(SplitPageTemplate);

