import React from 'react';
import { motion } from 'framer-motion';
import PageLayout from './PageLayout';
import { useImageContext } from '../context/ImageContext';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../utils/imageCompression';
import { Camera, Save, X, Trash2 } from 'lucide-react';

const Home = () => {
    const { homeData, updateContentData } = useImageContext();
    const { isAdmin, isClient } = useAuth();
    const { weddingDate, heroImage } = homeData;
    const [isEditingDate, setIsEditingDate] = React.useState(false);

    const [isEditingContent, setIsEditingContent] = React.useState(false);
    const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
    const [contentBuffer, setContentBuffer] = React.useState({ 
        bride: homeData.brideName, 
        groom: homeData.groomName
    });

    const canEdit = isAdmin || isClient;

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    React.useEffect(() => {
        setContentBuffer({ 
            bride: homeData.brideName, 
            groom: homeData.groomName
        });
    }, [homeData.brideName, homeData.groomName]);

    const saveContent = () => {
        updateContentData('home_data', { 
            ...homeData, 
            brideName: contentBuffer.bride, 
            groomName: contentBuffer.groom
        });
        setIsEditingContent(false);
    };

    // Dynamic font sizing: elegant, nicely sized — not too big
    const getDynamicStyle = (bride = '', groom = '') => {
        const maxLen = Math.max(bride.length || 5, groom.length || 5);
        const calculatedVw = Math.min(10, 60 / (maxLen * 0.5));
        return {
            fontSize: `clamp(2.5rem, ${calculatedVw}vw, 7rem)`,
            lineHeight: 1.05,
            letterSpacing: '-0.02em'
        };
    };
    
    const isPng = heroImage?.startsWith('data:image/png') || heroImage?.toLowerCase().endsWith('.png');

    const handleImageUpload = async (e, key = 'heroImage') => {
        const file = e.target.files[0];
        if (file) {
            try {
                const compressed = await compressImage(file);
                updateContentData('home_data', { ...homeData, [key]: compressed });
            } catch (error) {
                alert("Failed to upload image.");
            }
        }
        e.target.value = '';
    };

    const ImageControls = ({ id, imageKey = 'heroImage' }) => (
        <div className="absolute top-4 right-4 flex gap-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
            <label htmlFor={id} className="cursor-pointer bg-white/90 p-2 rounded-full hover:bg-white text-zinc-950 shadow-lg" title="Replace Photo">
                <Camera size={18} />
                <input type="file" id={id} accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleImageUpload(e, imageKey)} />
            </label>
        </div>
    );
    return (
        <PageLayout>
            <div className="w-full h-full relative overflow-hidden flex flex-col justify-center rounded-[2.5rem] md:rounded-[3.5rem] z-10">
                {/* 1. FULL-SCREEN BACKGROUND HERO IMAGE */}
                {heroImage ? (
                    <div className="absolute inset-0 z-0 bg-black">
                        <img src={heroImage} alt="Couple" className="w-full h-full object-cover transition-transform duration-[1000ms] scale-100 hover:scale-105" draggable="false" />
                        {/* Center dark overlay for text readability */}
                        <div className="absolute inset-0 bg-black/15" />
                        {/* High-end cinematic radial vignette for smooth edge blending into pure black */}
                        <div className="absolute inset-0" style={{
                            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 20%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.75) 80%, rgba(0,0,0,1) 100%)'
                        }} />
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-transparent z-0 border border-white/5 rounded-[2.5rem] md:rounded-[3.5rem]" />
                )}

                {/* 2. OVERLAY DATA CONTENT - Centered & Massive */}
                <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 md:p-12 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full max-w-5xl mx-auto flex flex-col items-center gap-8"
                    >
                        {/* Compact Name Display - Unified for Edit/Static */}
                        <h2 
                            style={getDynamicStyle(
                                isEditingContent ? contentBuffer.bride : homeData.brideName, 
                                isEditingContent ? contentBuffer.groom : homeData.groomName
                            )}
                            className="font-display font-black text-white tracking-tight transition-all duration-500 origin-center max-w-full text-shadow-3d-dark select-none"
                        >
                            <div 
                                className={`flex flex-col gap-y-2 items-center text-center ${canEdit && !isEditingContent ? 'cursor-pointer group/names' : ''}`}
                                onClick={() => canEdit && !isEditingContent && setIsEditingContent(true)}
                            >
                                {isEditingContent ? (
                                    <div className="flex flex-col items-center gap-y-3 w-full max-w-xl" onClick={e => e.stopPropagation()}>
                                        <input 
                                            value={contentBuffer.bride} 
                                            onChange={e => setContentBuffer(p => ({ ...p, bride: e.target.value }))}
                                            className="w-full text-center font-display font-black text-white bg-black/50 border border-white/20 rounded-2xl px-4 py-2 focus:border-white outline-none focus:ring-0 text-3xl md:text-5xl shadow-lg backdrop-blur-md"
                                            placeholder="Bride"
                                            autoFocus
                                        />
                                        <span className="text-white/40 font-display font-light text-2xl">&</span>
                                        <input 
                                            value={contentBuffer.groom} 
                                            onChange={e => setContentBuffer(p => ({ ...p, groom: e.target.value }))}
                                            className="w-full text-center font-display font-black text-white bg-black/50 border border-white/20 rounded-2xl px-4 py-2 focus:border-white outline-none focus:ring-0 text-3xl md:text-5xl shadow-lg backdrop-blur-md"
                                            placeholder="Groom"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <span className="break-words group-hover/names:opacity-80 transition-opacity duration-300">{homeData?.brideName || 'Bride'}</span>
                                        <span className="text-white/30 font-display font-light my-1">&</span>
                                        <span className="break-words group-hover/names:opacity-80 transition-opacity duration-300">{homeData?.groomName || 'Groom'}</span>
                                        {canEdit && <span className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-sans font-medium mt-3 opacity-0 group-hover/names:opacity-100 transition-opacity duration-300">tap to edit</span>}
                                    </>
                                )}
                            </div>
                        </h2>

                        {/* Elegant White 3D Divider Line */}
                        <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />

                        {/* Wedding Date Display */}
                        {weddingDate && (
                            <div 
                                className={`flex flex-col items-center ${canEdit && !isEditingDate ? 'cursor-pointer select-none hover:opacity-85 transition-opacity duration-300' : ''}`}
                                onClick={() => canEdit && !isEditingDate && setIsEditingDate(true)}
                            >
                                {isEditingDate ? (
                                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="datetime-local"
                                            value={weddingDate}
                                            onChange={(e) => updateContentData('home_data', { ...homeData, weddingDate: e.target.value })}
                                            onBlur={() => setIsEditingDate(false)}
                                            className="bg-black/55 border border-white/25 text-white rounded-2xl px-3 py-2 outline-none focus:border-white font-display font-semibold text-sm transition-all shadow-lg backdrop-blur-md"
                                            autoFocus
                                        />
                                        <button onClick={() => setIsEditingDate(false)} className="bg-white text-zinc-950 px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-gray transition-all shadow-md">Done</button>
                                    </div>
                                ) : (
                                    <span className="text-sm md:text-base lg:text-lg font-display font-semibold uppercase tracking-[0.2em] text-white/90 hover:text-white/80 transition-colors duration-300">
                                        {new Date(weddingDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Save/Cancel Buttons */}
                        {isEditingContent && (
                            <div className="flex justify-center gap-3 mt-4 animate-in fade-in duration-300" onClick={e => e.stopPropagation()}>
                                <button onClick={saveContent} className="bg-white text-zinc-950 px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-gray transition-all shadow-md flex items-center gap-2">
                                    <Save size={12} /> Save Changes
                                </button>
                                <button onClick={() => setIsEditingContent(false)} className="bg-black/40 text-white px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-black/60 transition-all border border-white/20 flex items-center gap-2">
                                    <X size={12} /> Cancel
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* 3. IMAGE UPLOAD CONTROLS (Top-right, minimal) */}
                {canEdit && (
                    <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
                        {heroImage && (
                            <button
                                onClick={() => updateContentData('home_data', { ...homeData, heroImage: null })}
                                className="flex items-center justify-center w-8 h-8 bg-black/40 backdrop-blur-sm border border-white/15 text-white/60 hover:text-red-400 hover:border-red-400/30 hover:bg-black/60 rounded-full shadow-lg transition-all duration-300"
                                title="Remove Photo"
                            >
                                <Trash2 size={13} />
                            </button>
                        )}
                        <label
                            htmlFor="hero-upload-bg"
                            className="cursor-pointer flex items-center justify-center w-8 h-8 bg-black/40 backdrop-blur-sm border border-white/15 text-white/60 hover:text-white hover:bg-black/60 rounded-full shadow-lg transition-all duration-300"
                            title={heroImage ? "Change Photo" : "Add Photo"}
                        >
                            <Camera size={13} />
                            <input type="file" id="hero-upload-bg" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleImageUpload(e, 'heroImage')} />
                        </label>
                    </div>
                )}
            </div>
        </PageLayout>
    );
};

export default Home;