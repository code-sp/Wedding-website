import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Plus, X, Image as ImageIcon } from 'lucide-react';
import PageLayout from '../PageLayout';
import DeleteButton from '../DeleteButton';
import { useAuth } from '../../context/AuthContext';
import { compressImage } from '../../utils/imageCompression';
import StandardButton from './StandardButton';

const MediaGridTemplate = ({ 
    title, 
    items, 
    onAdd, 
    onDelete, 
    renderItemCard, 
    emptyMessage, 
    allowMultipleUploads = false,
    requireUploaderName = false,
    customAction = null,
    masonry = true
}) => {
    const { isAdmin, isClient } = useAuth();
    const canEdit = isAdmin || isClient;
    const fileInputRef = useRef(null);
    
    // Lightbox / Modal state
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    
    // Custom specific modals (like Moments requirements)
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploaderName, setUploaderName] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);

    const handleFileChange = async (e) => {
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
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error("Error compressing image:", error);
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
            console.error("Error uploading photo:", error);
        }
    };

    const openLightbox = (item, index) => {
        setSelectedImage(item);
        setSelectedIndex(index);
    };

    const closeLightbox = () => setSelectedImage(null);

    return (
        <PageLayout title={title}>
            <div className="relative z-10 p-4 md:p-8 flex flex-col h-full">
                
                {/* Admin Controls / Upload Tools */}
                {canEdit && (
                    <div className="flex justify-between items-center mb-8 shrink-0">
                        <StandardButton
                            onClick={() => fileInputRef.current?.click()}
                            icon={allowMultipleUploads ? Plus : Upload}
                            expandable
                        >
                            {allowMultipleUploads ? 'Add Photos' : 'Upload Photo'}
                        </StandardButton>
                        {customAction}
                        
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                            multiple={allowMultipleUploads}
                        />
                    </div>
                )}

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {(!items || items.length === 0) ? (
                        <div className="h-full flex items-center justify-center">
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center flex flex-col items-center p-12">
                                <div className="w-24 h-24 bg-brand-black/5 rounded-full flex items-center justify-center mb-8 shadow-inner">
                                    <ImageIcon size={40} className="text-brand-black/20" />
                                </div>
                                <h2 className="font-display font-bold text-5xl lg:text-6xl text-brand-black mb-4 leading-[1.05] tracking-tight">
                                    No Visuals
                                    <span className="block text-brand-accent italic font-light mt-1">Yet</span>
                                </h2>
                                <p className="text-brand-black/50 font-medium text-base md:text-lg leading-relaxed max-w-sm mt-4 mb-10 opacity-80">
                                    {emptyMessage || (canEdit ? "Start building your gallery by adding your first beautiful memory!" : "Check back soon to see the shared memories.")}
                                </p>
                                {canEdit && (
                                    <StandardButton onClick={() => fileInputRef.current?.click()} icon={Plus}>Add First Photograph</StandardButton>
                                )}
                            </motion.div>
                        </div>
                    ) : (
                        <div className={masonry ? "columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}>
                            <AnimatePresence mode="popLayout">
                                {items.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ duration: 0.3 }}
                                        className={`relative group ${masonry ? "break-inside-avoid" : ""}`}
                                    >
                                        {renderItemCard(item, index, () => openLightbox(item, index))}
                                        
                                        {canEdit && onDelete && (
                                            <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <DeleteButton onDelete={() => onDelete(item.id)} />
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedImage && selectedImage.src && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-brand-black/95 flex items-center justify-center p-4 backdrop-blur-xl"
                        onClick={closeLightbox}
                    >
                         <button
                            onClick={closeLightbox}
                            className="absolute top-8 right-8 text-white/60 hover:text-white transition-colors z-50 bg-white/10 p-3 rounded-full hover:bg-white/20"
                        >
                            <X size={28} />
                        </button>
                        <motion.img
                            key={selectedImage.id}
                            src={selectedImage.src}
                            alt="Fullscreen view"
                            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Moments Specific Modal */}
            {showUploadModal && requireUploaderName && (
                <div className="fixed inset-0 bg-brand-black/60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/90 backdrop-blur-2xl rounded-[3rem] w-full max-w-md overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] border border-white/60"
                    >
                        <div className="p-8 border-b border-brand-black/5 flex justify-between items-center bg-white/40">
                            <h3 className="font-display font-bold text-2xl text-brand-black">Share Your Moment</h3>
                            <button onClick={() => setShowUploadModal(false)} className="text-brand-black/40 hover:text-brand-black transition-colors p-2 bg-white/50 rounded-full hover:bg-white">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-10">
                            <div className="mb-8 rounded-[2rem] overflow-hidden border border-brand-black/5 aspect-square flex-shrink-0 shadow-inner group/preview relative">
                                {selectedFile && <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover/preview:scale-110" />}
                            </div>
                            <form onSubmit={handleNamedUpload} className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-black/40 ml-1">Your Storyteller Name</label>
                                    <input
                                        type="text"
                                        value={uploaderName}
                                        onChange={(e) => setUploaderName(e.target.value)}
                                        placeholder="Enter your name (optional)"
                                        className="w-full px-6 py-4 rounded-2xl border border-brand-black/10 bg-white/60 focus:bg-white focus:border-brand-black outline-none transition-all font-bold text-brand-black placeholder:text-brand-black/20"
                                    />
                                </div>
                                <StandardButton type="submit" size="lg" className="w-full" icon={Upload}>
                                    Share Photograph
                                </StandardButton>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </PageLayout>
    );
};

export default React.memo(MediaGridTemplate);
