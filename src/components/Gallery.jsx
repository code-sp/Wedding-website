import React from 'react';
import SplitPageTemplate from './common/SplitPageTemplate';
import { useImageContext } from '../context/ImageContext';
import { useAuth } from '../context/AuthContext';

const Gallery = () => {
    const { galleryPhotos, updateContentData } = useImageContext();
    const { isAdmin, isClient } = useAuth();
    const canEdit = isAdmin || isClient;

    const handleAdd = (photos) => {
        const newArr = Array.isArray(photos) ? photos : [photos];
        const updated = [...newArr, ...(galleryPhotos || [])];
        updateContentData('gallery', updated);
    };

    const handleDelete = (id) => {
        const updated = (galleryPhotos || []).filter(p => p.id !== id);
        updateContentData('gallery', updated);
    };

    const handleReorder = (newArr) => {
        updateContentData('gallery', newArr);
    };

    return (
        <SplitPageTemplate
            backgroundText="memories"
            headerTag="Explore"
            titleNormal="Photo"
            titleItalic="Gallery"
            subtitle="Capturing the moments that matter most to us."
            emptyStateNormal="Capture"
            emptyStateItalic="Moment"
            items={galleryPhotos || []}
            onAdd={handleAdd}
            onDelete={handleDelete}
            onReorder={handleReorder}
            allowMultipleUploads={true}
            renderItem={(photo, index, onClick) => (
                <div onClick={onClick} className="relative w-full cursor-pointer overflow-hidden">
                    <img
                        src={photo.src}
                        alt={photo.alt || 'Gallery photo'}
                        loading="lazy"
                        className="w-full h-auto block transition-transform duration-[12s] ease-linear group-hover:scale-105"
                    />
                    {/* Interaction Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
            )}
        />
    );
};

export default React.memo(Gallery);
