import { Bed, Users } from 'lucide-react';
import { useImageContext } from '../context/ImageContext';

const RoomAllotment = ({ value, onChange }) => {
    const { settings } = useImageContext();
    const rooms = settings?.rooms || [];

    return (
        <div className="relative bg-white/10 backdrop-blur-2xl p-6 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-white/30 mt-8 overflow-hidden">
            {/* Glass sheen overlay */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-[2rem]" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-white/5 pointer-events-none rounded-[2rem]" />

            <h2 className="relative text-2xl font-display font-bold text-brand-black mb-6 text-center tracking-tight">Accommodation</h2>

            <div className="relative space-y-3">
                {rooms.length === 0 ? (
                    <div className="p-12 text-center text-brand-black/30 font-display italic">
                        No accommodation options configured.
                    </div>
                ) : (
                    rooms.map((room) => (
                        <div
                            key={room.id}
                            onClick={() => onChange && onChange(room.id)}
                            className={`relative p-4 rounded-2xl border cursor-pointer transition-all duration-300 flex items-center justify-between group overflow-hidden ${value === room.id
                                ? 'border-brand-black/40 bg-white/50 shadow-lg backdrop-blur-xl ring-1 ring-brand-black/20'
                                : 'border-white/30 bg-white/10 backdrop-blur-md hover:bg-white/25 hover:border-white/50 hover:shadow-md'
                                }`}
                        >
                            {/* Inner glass sheen on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />

                            <div className="relative flex items-center gap-4">
                                <div className={`p-3 rounded-xl transition-all duration-300 ${value === room.id ? 'bg-zinc-200 text-zinc-950 shadow-lg' : 'bg-white/40 text-brand-black/60 backdrop-blur-sm border border-white/50'}`}>
                                    <Bed size={24} />
                                </div>
                                <div>
                                    <h3 className="font-display font-bold text-brand-black">{room.name}</h3>
                                    <div className="flex items-center gap-4 text-xs font-medium text-brand-black/60 mt-1 uppercase tracking-wide">
                                        <span className="flex items-center gap-1"><Users size={14} /> {room.capacity} Guests</span>
                                        <span>{room.type}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="relative text-right">
                                <p className="font-bold text-brand-black text-lg">{room.price}</p>
                                <p className="text-xs text-brand-black/50 font-medium uppercase tracking-wide">{room.available} left</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RoomAllotment;

