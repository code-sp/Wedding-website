import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Edit2, Save, Trash2, Plus, Info, MessageCircle, ExternalLink } from 'lucide-react';
import PageLayout from './PageLayout';
import { useAuth } from '../context/AuthContext';
import { useImageContext } from '../context/ImageContext';
import StandardButton from './common/StandardButton';
import AdminHUD from './common/AdminHUD';

const Contact = () => {
    const { isAdmin, isClient } = useAuth();
    const { contactData, updateContentData } = useImageContext();
    const [isEditing, setIsEditing] = useState(false);

    const canEdit = isAdmin || isClient;
    const [editBuffer, setEditBuffer] = useState(null);

    const data = isEditing ? editBuffer : contactData;

    const handleEdit = () => {
        console.log('[CONTACT] Entering edit mode.');
        setEditBuffer({ ...contactData });
        setIsEditing(true);
    };

    const handleSave = async () => {
        console.log('[CONTACT] Saving updated contact details...');
        await updateContentData('contact_data', editBuffer);
        console.log('[CONTACT] Save complete.');
        setIsEditing(false);
    };

    const handleCancel = () => {
        console.log('[CONTACT] Cancelled editing.');
        setIsEditing(false);
        setEditBuffer(null);
    };

    const updateField = (field, value) => {
        setEditBuffer(prev => ({ ...prev, [field]: value }));
    };

    const updateContactCard = (idx, field, value) => {
        const newCards = [...editBuffer.contactCards];
        newCards[idx] = { ...newCards[idx], [field]: value };
        setEditBuffer(prev => ({ ...prev, contactCards: newCards }));
    };

    const addContactCard = () => {
        console.log('[CONTACT] Adding new contact card.');
        setEditBuffer(prev => ({
            ...prev,
            contactCards: [...prev.contactCards, { title: "New Label", name: "New Contact", phone: "", email: "" }]
        }));
    };

    const removeContactCard = (idx) => {
        console.log('[CONTACT] Removing contact card at index:', idx);
        setEditBuffer(prev => ({
            ...prev,
            contactCards: prev.contactCards.filter((_, i) => i !== idx)
        }));
    };

    return (
        <PageLayout backgroundText="connect">
            <div className="relative z-10 w-full h-full overflow-y-auto custom-scrollbar">
                
                {/* HEADER SECTION */}
                <div className="w-full pt-8 md:pt-10 pb-2 flex flex-col items-center text-center relative z-30 shrink-0 pointer-events-none">
                    <span className="inline-block py-1.5 px-4 rounded-full bg-white/10 border border-white/15 text-white/50 text-[10px] font-bold tracking-[0.3em] uppercase mb-3 shadow-sm backdrop-blur-md">
                        Connect
                    </span>
                    <h2 className="font-display font-bold text-4xl lg:text-5xl text-white tracking-tighter mb-4">
                        Get In <span className="text-white/50 italic font-light">Touch</span>
                    </h2>
                    <p className="text-zinc-400 font-medium text-sm md:text-base leading-relaxed max-w-xl mx-auto font-serif italic px-4 mb-4">
                        We can't wait to celebrate with you. Reach out us
                    </p>
                </div>

                {/* CONTENT SECTION */}
                <div className="w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-20 pb-32">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20">
                    
                        {/* LEFT COLUMN - Direct Contacts */}
                        <div className="lg:col-span-5 space-y-10">
                            <div className="flex items-center gap-4">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30">Direct Contacts</h4>
                                <div className="h-px flex-1 bg-white/10" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                            {data.contactCards.map((contact, idx) => (
                                <div key={idx} className="relative group p-8 bg-white/5 backdrop-blur-md rounded-3xl shadow-xl border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all">
                                    {isEditing && (
                                        <button onClick={() => removeContactCard(idx)} className="absolute -top-3 -right-3 p-2 bg-rose-500/10 rounded-full text-rose-500 shadow-lg border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all z-10">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                    {isEditing ? (
                                        <div className="space-y-4">
                                            <input type="text" value={contact.title} onChange={e => updateContactCard(idx, 'title', e.target.value)} className="w-full bg-white/10 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white outline-none focus:border-white/40 border border-white/10 placeholder-white/30" placeholder="Label" />
                                            <input type="text" value={contact.name} onChange={e => updateContactCard(idx, 'name', e.target.value)} className="w-full bg-white/10 rounded-xl px-4 py-2 font-display font-bold text-xl text-white outline-none focus:border-white/40 border border-white/10 placeholder-white/30" placeholder="Name" />
                                            <div className="space-y-2">
                                                <input type="text" value={contact.phone} onChange={e => updateContactCard(idx, 'phone', e.target.value)} className="w-full bg-white/10 rounded-xl px-4 py-2 text-sm font-bold text-white outline-none focus:border-white/40 border border-white/10 placeholder-white/30" placeholder="Phone" />
                                                <input type="text" value={contact.email} onChange={e => updateContactCard(idx, 'email', e.target.value)} className="w-full bg-white/10 rounded-xl px-4 py-2 text-sm font-bold text-white outline-none focus:border-white/40 border border-white/10 placeholder-white/30" placeholder="Email" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">{contact.title}</p>
                                                <p className="font-display font-bold text-2xl text-white mt-1">{contact.name}</p>
                                            </div>
                                            <div className="flex gap-3 pt-2">
                                                <a href={`tel:${contact.phone}`} className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/20 transition-all text-xs font-bold uppercase tracking-widest text-white/80 hover:text-white">
                                                    <Phone size={14} /> Call
                                                </a>
                                                <a href={`mailto:${contact.email}`} className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/20 transition-all text-xs font-bold uppercase tracking-widest text-white/80 hover:text-white">
                                                    <Mail size={14} /> Email
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isEditing && (
                                <button onClick={addContactCard} className="w-full h-full min-h-[200px] flex flex-col items-center justify-center gap-2 bg-white/5 border-2 border-dashed border-white/20 rounded-3xl text-white/40 font-bold uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all">
                                    <Plus size={24} /> Add New Contact
                                </button>
                            )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN - Destination & FAQ */}
                        <div className="lg:col-span-7 space-y-16">

                            {/* Map & Venue */}
                            <div className="space-y-10">
                                <div className="flex items-center gap-4">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30">The Destination</h4>
                                    <div className="h-px flex-1 bg-white/10" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                            <div className="space-y-8">
                                {isEditing ? (
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 ml-1">Venue Name</label>
                                            <input type="text" value={data.venueName} onChange={e => updateField('venueName', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-display font-bold text-3xl text-white outline-none focus:border-white/40" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 ml-1">Full Address</label>
                                            <textarea rows={4} value={data.venueAddress} onChange={e => updateField('venueAddress', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-medium text-lg text-white leading-relaxed outline-none resize-none focus:border-white/40" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 ml-1">Google Maps Link</label>
                                            <input type="text" value={data.venueMapsLink} onChange={e => updateField('venueMapsLink', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-mono text-xs text-white/80 outline-none focus:border-white/40" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 ml-1">Embed Map Query (Plus Code)</label>
                                            <input type="text" value={data.venueMapQuery || ""} onChange={e => updateField('venueMapQuery', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-mono text-xs text-white/80 outline-none focus:border-white/40" placeholder="e.g. PFW8+2J New Delhi" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <h3 className="font-display font-bold text-5xl lg:text-6xl text-white tracking-tight leading-tight">{data.venueName}</h3>
                                        <p className="text-white/50 text-xl leading-relaxed whitespace-pre-line">{data.venueAddress}</p>
                                        <a href={data.venueMapsLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 text-white/60 font-bold uppercase tracking-widest text-xs border-b-2 border-white/20 pb-1 hover:border-white/60 transition-all">
                                            Get Directions <ExternalLink size={14} />
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div className="relative aspect-square lg:aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 bg-[#e5e3df]">
                                {/* 
                                    We make the iframe larger than the container and center it perfectly.
                                    This pushes the Google UI cards (top-left) and logos (bottom) outside the visible boundaries,
                                    leaving only the clean map and center pin! iwloc=near hides the speech bubble.
                                */}
                                <iframe
                                    src={`https://maps.google.com/maps?q=${encodeURIComponent(data.venueMapQuery || ((data.venueName || "") + " " + (data.venueAddress || "")))}&t=&z=14&ie=UTF8&iwloc=near&output=embed`}
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-0"
                                    style={{ width: 'calc(100% + 250px)', height: 'calc(100% + 250px)' }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Venue Location"
                                ></iframe>
                                {/* Protective inner shadow to make it feel deeply embedded */}
                                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.1)] rounded-[3rem]" />
                            </div>
                        </div>
                    </div>



                        </div>
                    </div>
                </div>
            </div>

            <AdminHUD
                show={canEdit}
                isEditing={isEditing}
                onEdit={handleEdit}
                onSave={handleSave}
                onCancel={handleCancel}
                editLabel="Edit Contact"
                editIcon={Edit2}
            />
        </PageLayout>
    );
};

export default Contact;
