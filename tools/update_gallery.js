import fs from 'fs';

const content = `import React from 'react';
import SplitPageTemplate from './common/SplitPageTemplate';
import { useImageContext } from '../context/ImageContext';

const Gallery = () => {
    const { galleryPhotos, updateContentData } = useImageContext();

    const handleAdd = (photos) => {
        const newArr = Array.isArray(photos) ? photos : [photos];
        const updated = [...newArr, ...(galleryPhotos || [])];
        updateContentData('gallery', updated);
    };

    const handleDelete = (id) => {
        const updated = (galleryPhotos || []).filter(p => p.id !== id);
        updateContentData('gallery', updated);
    };

    return (
        <SplitPageTemplate
            backgroundText="memories"
            headerTag="Explore"
            titleNormal="Photo"
            titleItalic="Gallery"
            subtitle="Capturing the moments that matter most to us."
            emptyStateNormal="No Photos"
            emptyStateItalic="Yet"
            items={galleryPhotos || []}
            onAdd={handleAdd}
            onDelete={handleDelete}
            allowMultipleUploads={true}
            renderItem={(photo, index, onClick) => (
                <div onClick={onClick} className="relative overflow-hidden rounded-2xl cursor-pointer group shadow-lg hover:shadow-2xl transition-all border border-white/50 bg-white/10 w-full mb-4 break-inside-avoid">
                    <img
                        src={photo.src}
                        alt={photo.alt || 'Gallery photo'}
                        loading="lazy"
                        className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
            )}
        />
    );
};

export default React.memo(Gallery);
`;

fs.writeFileSync('src/components/Gallery.jsx', content, 'utf8');
console.log("Gallery updated!");
