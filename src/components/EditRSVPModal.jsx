import { useState, useEffect } from 'react';
import TableBooking from './TableBooking';
import { Armchair, Users, X } from 'lucide-react';
import { useImageContext } from '../context/ImageContext';

const EditRSVPModal = ({ isOpen, onClose, rsvpData, onSave, occupiedSeats = [], isAdmin = false, isModal = true }) => {
    const { settings } = useImageContext();
    const ROOMS = settings?.rooms || [];

    const [formData, setFormData] = useState({
        guests: 1,
        guestDetails: [],
        seatNumbers: [],
        accommodation: '',
        roomNumber: ''
    });

    const [showSeatingModal, setShowSeatingModal] = useState(false);
    const [isShaking, setIsShaking] = useState(false);
    const [showError, setShowError] = useState(false);

    useEffect(() => {
        if (rsvpData) {
            setFormData({
                guests: parseInt(rsvpData.guests) || 1,
                guestDetails: rsvpData.guestDetails || [],
                seatNumbers: rsvpData.seatNumbers || [],
                accommodation: rsvpData.accommodation || '',
                roomNumber: rsvpData.roomNumber || ''
            });
            setShowError(false);
        }
    }, [rsvpData]);

    useEffect(() => {
        if (showError) setShowError(false);
    }, [formData]);

    const handleGuestCountChange = (val) => {
        let newCount = parseInt(val);
        if (isNaN(newCount) || newCount < 1) newCount = 1;
        if (newCount > 10) newCount = 10;

        let updatedDetails = [...formData.guestDetails];
        const currentCount = updatedDetails.length;

        if (newCount > currentCount) {
            for (let i = 0; i < newCount - currentCount; i++) {
                updatedDetails.push({ age: '', gender: '' });
            }
        } else if (newCount < currentCount) {
            updatedDetails = updatedDetails.slice(0, newCount);
        }

        setFormData({ ...formData, guests: newCount, guestDetails: updatedDetails });
    };

    const handleGuestDetailChange = (index, field, value) => {
        const updatedDetails = [...formData.guestDetails];
        if (!updatedDetails[index]) updatedDetails[index] = { age: '', gender: '' };
        updatedDetails[index] = { ...updatedDetails[index], [field]: value };
        setFormData({ ...formData, guestDetails: updatedDetails });
    };

    const handleSave = () => {
        if (formData.seatNumbers.length > 0 && formData.seatNumbers.length !== formData.guests) {
            setIsShaking(true);
            setShowError(true);
            setTimeout(() => setIsShaking(false), 500);
            return;
        }
        onSave(formData);
        if (isModal) onClose();
    };

    if (!isOpen && isModal) return null;

    const Content = (
        <div className={`${isModal ? 'bg-white/80 backdrop-blur-3xl rounded-[2rem] w-full max-w-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] flex flex-col max-h-[85vh] border border-white/60' : 'w-full max-w-3xl mx-auto flex flex-col space-y-8'}`}>
            <div className={`p-8 border-b border-white/40 flex justify-between items-center bg-white/40 backdrop-blur-md shrink-0 ${isModal ? 'rounded-t-[2rem]' : 'rounded-3xl border shadow-xl'}`}>
                <div>
                    <h3 className="text-3xl font-display font-bold text-brand-black">{isAdmin ? 'Edit Booking' : 'Update Your RSVP'}</h3>
                    <p className="text-sm text-brand-black/60 font-medium mt-1">
                        {isAdmin ? 'Editing for: ' : 'Registry for: '}
                        <span className="font-bold text-brand-black">{rsvpData?.name}</span>
                    </p>
                </div>
                {isModal && (
                    <button onClick={onClose} className="text-brand-black/40 hover:text-brand-black transition-colors bg-white/50 rounded-full p-2 hover:bg-white shadow-sm">
                        <X size={20} />
                    </button>
                )}
            </div>

            <div className={`p-8 overflow-y-auto space-y-10 font-display flex-1 ${isModal ? 'bg-white/20' : 'bg-white/10 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl'}`}>

                {/* Section 1: Guest Count */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/40 p-6 rounded-2xl border border-white/50 shadow-sm backdrop-blur-sm">
                        <label className="block text-[10px] font-bold text-brand-black/60 uppercase tracking-widest mb-3">Total Guests</label>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white text-brand-black rounded-xl shadow-sm">
                                <Users size={24} />
                            </div>
                            <div className="flex items-center bg-white/40 rounded-xl p-1 border border-white/60">
                                <button onClick={() => handleGuestCountChange(formData.guests - 1)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-brand-black/60 font-bold text-xl">-</button>
                                <span className="w-12 text-center font-display font-bold text-2xl text-brand-black">{formData.guests}</span>
                                <button onClick={() => handleGuestCountChange(formData.guests + 1)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-brand-black/60 font-bold text-xl">+</button>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Seats */}
                    <div className="bg-white/40 p-6 rounded-2xl border border-white/50 shadow-sm backdrop-blur-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-2">
                            <label className="block text-[10px] font-bold text-brand-black/60 uppercase tracking-widest">Seats</label>
                            {formData.seatNumbers.length !== formData.guests && showError && (
                                <span className="text-[9px] bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold uppercase tracking-wide">Fix Required</span>
                            )}
                        </div>

                        <div className="flex items-center justify-between mt-2">
                            <div className="font-mono text-brand-black font-bold text-lg">
                                {formData.seatNumbers.length > 0 ? formData.seatNumbers.map(s => s.split('-').pop()).join(', ') : <span className="text-brand-black/30 font-normal text-sm italic">None selected</span>}
                            </div>
                            <button
                                onClick={() => setShowSeatingModal(true)}
                                className="flex items-center gap-2 bg-zinc-200 text-zinc-950 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-300 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            >
                                <Armchair size={14} /> {formData.seatNumbers.length > 0 ? 'Change Seats' : 'Select Seats'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Section 3: Member Details */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-brand-black/60 uppercase tracking-widest border-b border-white/30 pb-2">
                        Member Details
                    </h4>

                    <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {formData.guestDetails.map((guest, index) => (
                            <div key={index} className="flex gap-4 items-end bg-white/30 p-4 rounded-xl border border-white/40 shadow-sm backdrop-blur-sm">
                                <span className="font-display text-brand-black/40 min-w-[30px] pb-2 text-sm font-bold">#{index + 1}</span>
                                <div className="flex-1 space-y-1">
                                    <label className="text-[9px] uppercase text-brand-black/50 font-bold tracking-wider">Age Group</label>
                                    <select
                                        className="w-full bg-transparent border-b border-brand-black/10 focus:border-brand-black outline-none text-brand-black text-sm py-1 font-medium appearance-none"
                                        value={guest.age || ''}
                                        onChange={(e) => handleGuestDetailChange(index, 'age', e.target.value)}
                                    >
                                        <option value="">Select Age</option>
                                        <option value="Infant (0-2)">Infant (0-2)</option>
                                        <option value="Child (3-12)">Child (3-12)</option>
                                        <option value="Teen (13-19)">Teen (13-19)</option>
                                        <option value="Adult (20-60)">Adult (20-60)</option>
                                        <option value="Senior (60+)">Senior (60+)</option>
                                    </select>
                                </div>
                                <div className="flex-1 space-y-1">
                                    <label className="text-[9px] uppercase text-brand-black/50 font-bold tracking-wider">Gender</label>
                                    <select
                                        className="w-full bg-transparent border-b border-brand-black/10 focus:border-brand-black outline-none text-brand-black text-sm py-1 font-medium appearance-none"
                                        value={guest.gender || ''}
                                        onChange={(e) => handleGuestDetailChange(index, 'gender', e.target.value)}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 4: Accommodation */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-brand-black/60 uppercase tracking-widest border-b border-white/30 pb-2">
                        Accommodation
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${!formData.accommodation
                            ? 'border-white bg-zinc-900 shadow-md ring-1 ring-white'
                            : 'border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/25'
                            }`}>
                            <div className="flex items-center gap-4">
                                <input
                                    type="radio"
                                    name="accommodation"
                                    value=""
                                    checked={!formData.accommodation}
                                    onChange={() => setFormData({ ...formData, accommodation: '' })}
                                    className="hidden"
                                />
                                <div>
                                    <p className="font-bold text-brand-black text-sm">No Accommodation</p>
                                    <p className="text-[10px] text-brand-black/50 uppercase tracking-wider font-medium">Not required</p>
                                </div>
                            </div>
                        </label>

                        {ROOMS.map((room) => (
                            <label
                                key={room.id}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${formData.accommodation === room.id
                                    ? 'border-white bg-zinc-900 shadow-md ring-1 ring-white'
                                    : 'border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/25'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <input
                                        type="radio"
                                        name="accommodation"
                                        value={room.id}
                                        checked={formData.accommodation === room.id}
                                        onChange={() => setFormData({ ...formData, accommodation: room.id })}
                                        className="hidden"
                                    />
                                    <div>
                                        <p className="font-bold text-brand-black text-sm">{room.name}</p>
                                        <p className="text-[10px] text-brand-black/50 uppercase tracking-wider font-medium">{room.type} ({room.price})</p>
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Section 5: Room Allotment (Admin) */}
                {isAdmin && (
                    <div className="bg-white/40 p-6 rounded-2xl border border-white/50 shadow-sm backdrop-blur-sm">
                        <label className="block text-[10px] font-bold text-brand-black/60 uppercase tracking-widest mb-3">Room Number Allotment</label>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white text-brand-black rounded-xl shadow-sm">
                                <span className="font-bold text-lg">#</span>
                            </div>
                            <input
                                type="text"
                                placeholder="Assign Room (e.g. 101)"
                                className="flex-1 bg-white/50 border border-white/60 rounded-xl px-4 py-3 text-brand-black focus:border-brand-black focus:bg-white outline-none transition-all font-medium"
                                value={formData.roomNumber || ''}
                                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className={`p-8 border-t border-white/40 bg-white/40 backdrop-blur-md flex justify-between items-center shrink-0 ${isModal ? 'rounded-b-[2rem]' : 'rounded-3xl border shadow-xl'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${showError ? "text-red-500" : "text-brand-black/40"}`}>
                    {showError
                        ? "Action Required: Check seats."
                        : "Changes save immediately."}
                </p>
                <div className="flex gap-4">
                    {isModal && (
                        <button
                            onClick={onClose}
                            className="px-6 py-3 text-brand-black/60 hover:text-brand-black font-bold text-xs uppercase tracking-widest transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        className={`px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all font-bold text-xs uppercase tracking-widest ${isShaking ? 'animate-shake bg-red-600 text-white' : 'bg-zinc-200 text-zinc-950 hover:bg-zinc-300 hover:-translate-y-0.5'}`}
                    >
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Nested Seating Modal */}
            <TableBooking
                isOpen={showSeatingModal}
                onClose={() => setShowSeatingModal(false)}
                onConfirm={(seats) => {
                    setFormData({ ...formData, seatNumbers: seats });
                    setShowSeatingModal(false);
                }}
                maxSeats={formData.guests}
                initialSelectedSeats={formData.seatNumbers}
                occupiedSeats={occupiedSeats.filter(id => !formData.seatNumbers.includes(id))}
                allowGuestChange={false}
            />
        </div>
    );

    if (!isModal) return Content;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/20 backdrop-blur-md animate-in fade-in duration-200">
            {Content}
        </div>
    );
};

export default EditRSVPModal;
