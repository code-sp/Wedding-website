import fs from 'fs';

let momentsContent = `import React from 'react';
import { User, Calendar } from 'lucide-react';
import SplitPageTemplate from './common/SplitPageTemplate';
import { useImageContext } from '../context/ImageContext';

const formatTime = (timestamp) => {
    try {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return \`\${minutes}m ago\`;
        if (hours < 24) return \`\${hours}h ago\`;
        if (days < 7) return \`\${days}d ago\`;
        return date.toLocaleDateString();
    } catch {
        return 'Recently';
    }
};

const Moments = () => {
    const { momentsPhotos, updateContentData } = useImageContext();

    const handleAdd = (photoObj) => {
        const updated = [photoObj, ...(momentsPhotos || [])];
        updateContentData('moments', updated);
    };

    const handleDelete = (id) => {
        const updated = (momentsPhotos || []).filter(p => p.id !== id);
        updateContentData('moments', updated);
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
                    <div onClick={onClick} className="relative group rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border border-white/50 bg-white/20 aspect-square w-full cursor-pointer">
                        <img
                            src={photo.url || photo.src}
                            alt={\`Moment by \${photo.uploader || photo.uploaderName || 'Guest'}\`}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4 pointer-events-none">
                            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 space-y-2">
                                <div className="flex items-center gap-2 text-white">
                                    <User size={14} />
                                    <span className="text-sm font-bold">{photo.uploader || photo.uploaderName || 'Guest'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-white/70">
                                    <Calendar size={12} />
                                    <span className="text-xs">{formatTime(photo.timestamp)}</span>
                                </div>
                            </div>
                        </div>

                        {showNewBadge && (
                            <div className="absolute top-4 left-4 bg-brand-gold text-brand-black text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-md z-10 pointer-events-none">
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
`;

fs.writeFileSync('src/components/Moments.jsx', momentsContent, 'utf8');
console.log("Moments updated!");
