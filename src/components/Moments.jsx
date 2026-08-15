import React from 'react';
import { User, Calendar } from 'lucide-react';
import SplitPageTemplate from './common/SplitPageTemplate';
import { useImageContext } from '../context/ImageContext';
import { useAuth } from '../context/AuthContext';

const formatTime = (timestamp) => {
    try {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    } catch {
        return 'Recently';
    }
};

const Moments = () => {
    const { momentsPhotos, updateContentData } = useImageContext();
    const { isAdmin, isClient } = useAuth();
    const canEdit = isAdmin || isClient;

    const handleAdd = (photoObj) => {
        const updated = [photoObj, ...(momentsPhotos || [])];
        updateContentData('moments', updated);
    };

    const handleDelete = (id) => {
        const updated = (momentsPhotos || []).filter(p => p.id !== id);
        updateContentData('moments', updated);
    };

    const handleReorder = (newArr) => {
        updateContentData('moments', newArr);
    };

    return (
        <SplitPageTemplate
            backgroundText="moments"
            headerTag="Community"
            titleNormal="Capture"
            titleItalic="the Love"
            subtitle="Share your favorite candid moments here with everyone."
            emptyStateNormal="No Photos"
            emptyStateItalic="Yet"
            items={momentsPhotos || []}
            onAdd={handleAdd}
            onDelete={handleDelete}
            onReorder={handleReorder}
            allowMultipleUploads={false}
            requireUploaderName={true}
            masonry={false}
            renderItem={(photo, index, onClick) => {
                let showNewBadge = false;
                try {
                    const diff = new Date() - new Date(photo.timestamp);
                    if (diff < 3600000) showNewBadge = true;
                } catch(e) {}
                
                return (
                    <div onClick={onClick} className="relative w-full h-full cursor-pointer overflow-hidden group/moment">
                        <img
                            src={photo.url || photo.src}
                            alt={`Moment by ${photo.uploader || photo.uploaderName || 'Guest'}`}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-[12s] ease-linear group-hover:scale-110"
                        />
                        
                        {/* Premium Information Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6 md:p-8">
                            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-[0.22, 1, 0.36, 1]">
                                <div className="flex items-center gap-2 text-white mb-2">
                                    <div className="p-1.5 bg-white/20 backdrop-blur-md rounded-full">
                                        <User size={14} className="text-white" />
                                    </div>
                                    <span className="text-sm md:text-base font-bold tracking-tight">{photo.uploader || photo.uploaderName || 'Guest'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-white/60 ml-1">
                                    <Calendar size={12} />
                                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">{formatTime(photo.timestamp)}</span>
                                </div>
                            </div>
                        </div>

                        {showNewBadge && (
                            <div className="absolute top-6 left-6 bg-brand-accent text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-xl z-10 border border-white/20 animate-pulse">
                                New
                            </div>
                        )}
                    </div>
                );
            }}
        />
    );
};

export default React.memo(Moments);
