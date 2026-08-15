import { useState, useRef, useEffect } from 'react';
import { Plus, Upload, User, UserPlus, ArrowUp, ArrowRight, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { compressImage } from '../utils/imageCompression';

const QuickAddForm = ({ type, onSave, onCancel, position = 'top' }) => {
    const [name, setName] = useState('');
    const [gender, setGender] = useState('male');

    return (
        <motion.div
            initial={{ opacity: 0, y: position === 'top' ? 10 : -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: position === 'top' ? 10 : -10, scale: 0.95 }}
            className={`absolute left-1/2 -translate-x-1/2 bg-zinc-950 p-5 rounded-[2rem] shadow-2xl border border-white/10 w-64 z-[100] ${position === 'top' ? 'bottom-full mb-4' : 'top-full mt-4'}`}
            onClick={(e) => e.stopPropagation()}
        >
            <form onSubmit={(e) => { e.preventDefault(); if(name.trim()) onSave({ name, gender }); }} className="space-y-4">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] text-center">Add {type}</h4>
                <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Enter name..." 
                    autoFocus 
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-white/10 bg-white/5 focus:bg-white/10 focus:border-white/30 outline-none transition-all font-bold text-white placeholder-zinc-500" 
                />
                <div className="flex gap-1.5 bg-white/5 p-1 rounded-xl">
                    <button type="button" onClick={() => setGender('male')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${gender === 'male' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'}`}>Male</button>
                    <button type="button" onClick={() => setGender('female')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${gender === 'female' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'}`}>Female</button>
                </div>
                <div className="flex gap-2 pt-1">
                    <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-full border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest transition-all">Cancel</button>
                    <button type="submit" className="flex-1 py-2.5 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 text-[10px] font-bold uppercase tracking-widest shadow-lg transition-all">Add</button>
                </div>
            </form>
        </motion.div>
    );
};

const DeleteButton = ({ onDelete }) => {
    const [confirming, setConfirming] = useState(false);
    useEffect(() => {
        if (confirming) {
            const timer = setTimeout(() => setConfirming(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [confirming]);
    return (
        <button onClick={() => { if (confirming) { onDelete(); setConfirming(false); } else { setConfirming(true); } }} className={`p-1.5 rounded-full transition-all border ${confirming ? 'bg-red-600 border-red-500 text-white hover:bg-red-700' : 'bg-red-950/40 border-red-500/20 text-red-400 hover:bg-red-500/20'}`} title={confirming ? "Click to Confirm" : "Delete Member"}>
            <Trash2 size={14} />
        </button>
    );
};

const TreeNode = ({ node, onUpdate, onAddChild, onAddPartner, onAddParent, onAddSibling, onDelete, isRoot, canEdit }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isEditingRel, setIsEditingRel] = useState(false);
    const [activeAction, setActiveAction] = useState(null);
    const fileInputRef = useRef(null);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const compressed = await compressImage(file);
                onUpdate(node.id, { ...node, image: compressed });
            } catch (error) {
                console.error("Image upload failed:", error);
            }
        }
        e.target.value = '';
    };

    const handleActionClick = (action) => {
        setActiveAction(activeAction === action ? null : action);
    };

    const handleQuickAdd = (data) => {
        if (activeAction === 'child') onAddChild(data);
        if (activeAction === 'partner') onAddPartner(data);
        if (activeAction === 'sibling') onAddSibling(data);
        if (activeAction === 'parent') onAddParent(data);
        setActiveAction(null);
    };

    return (
        <div className="flex flex-col items-center w-[250px] relative group">
            {/* Upward Action (Add Parent) */}
            {canEdit && onAddParent && isRoot && (
                <div className="relative mb-6">
                    <button
                        onClick={() => handleActionClick('parent')}
                        className={`p-2 rounded-full transition-all shadow-lg border border-white/60 ${activeAction === 'parent' ? 'bg-brand-black text-white scale-110' : 'bg-white/80 text-brand-black/60 hover:text-brand-black hover:bg-white opacity-0 group-hover:opacity-100'}`}
                        title="Add Parent"
                    >
                        <ArrowUp size={16} />
                    </button>
                    <AnimatePresence>
                        {activeAction === 'parent' && (
                            <QuickAddForm type="Parent" onSave={handleQuickAdd} onCancel={() => setActiveAction(null)} position="bottom" />
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Avatar Circle */}
            <div className="relative mb-4">
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={`w-28 h-24 rounded-[2rem] border-2 shadow-2xl relative overflow-hidden transition-colors duration-500 ${
                        node.gender === 'female' 
                        ? 'border-pink-200 bg-pink-50' 
                        : 'border-blue-200 bg-blue-50'
                    }`}
                >
                    {node.image ? (
                        <img src={node.image} alt={node.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400">
                            <User size={48} strokeWidth={1.5} />
                        </div>
                    )}
                    {canEdit && (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 bg-zinc-900/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-[2px]"
                        >
                            <Upload className="text-white" size={24} />
                        </button>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                </motion.div>
                
                {/* Gender Indicator Dot */}
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-md ${node.gender === 'female' ? 'bg-pink-400' : 'bg-blue-400'}`} />
            </div>

            {/* Name Card */}
            <div className={`bg-white/60 backdrop-blur-xl p-4 rounded-3xl shadow-xl border border-white/80 min-w-[180px] text-center relative z-10 transition-all duration-500 ${canEdit ? 'hover:shadow-2xl hover:-translate-y-1' : ''}`}>
                <div className="space-y-1">
                    {isEditing ? (
                        <input
                            type="text"
                            value={node.name}
                            onChange={(e) => onUpdate(node.id, { ...node, name: e.target.value })}
                            onBlur={() => setIsEditing(false)}
                            autoFocus
                            className="w-full text-center border-b border-brand-black/10 focus:border-brand-black outline-none text-sm font-bold text-brand-black bg-transparent py-1"
                        />
                    ) : (
                        <h3
                            onClick={() => canEdit && setIsEditing(true)}
                            className={`font-display font-bold text-base text-brand-black tracking-tight truncate max-w-[160px] ${canEdit ? 'cursor-pointer hover:text-brand-accent' : ''}`}
                            title={node.name}
                        >
                            {node.name || "Add Name"}
                        </h3>
                    )}

                    {isEditingRel ? (
                        <input
                            type="text"
                            value={node.relation}
                            onChange={(e) => onUpdate(node.id, { ...node, relation: e.target.value })}
                            onBlur={() => setIsEditingRel(false)}
                            autoFocus
                            className="w-full text-center border-b border-brand-black/20 focus:border-brand-black outline-none text-[9px] text-brand-black/70 uppercase font-bold tracking-widest bg-transparent py-0.5"
                        />
                    ) : (
                        <p
                            onClick={() => canEdit && setIsEditingRel(true)}
                            className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-colors text-zinc-950 ${canEdit ? 'cursor-pointer hover:text-zinc-800' : ''}`}
                        >
                            {node.relation || 'Relative'}
                        </p>
                    )}
                </div>

                {/* Admin Actions Bar */}
                {canEdit && (
                    <div className={`flex justify-center gap-1.5 mt-3 pt-3 border-t border-brand-black/5 transition-all duration-500 ${activeAction ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'}`}>
                        {!node.partnerId && (
                            <div className="relative">
                                <button onClick={() => handleActionClick('partner')} className={`p-1.5 rounded-lg border transition-all ${activeAction === 'partner' ? 'bg-pink-600 border-pink-500 text-white shadow-lg' : 'bg-pink-100 border-pink-200 text-pink-700 hover:bg-pink-200'}`} title="Add Partner"><UserPlus size={14} /></button>
                                <AnimatePresence>{activeAction === 'partner' && <QuickAddForm type="Partner" onSave={handleQuickAdd} onCancel={() => setActiveAction(null)} />}</AnimatePresence>
                            </div>
                        )}
                        <div className="relative">
                            <button onClick={() => handleActionClick('child')} className={`p-1.5 rounded-lg border transition-all ${activeAction === 'child' ? 'bg-zinc-800 border-zinc-700 text-white shadow-lg' : 'bg-zinc-100 border-zinc-200 text-zinc-800 hover:bg-zinc-200'}`} title="Add Child"><Plus size={14} /></button>
                            <AnimatePresence>{activeAction === 'child' && <QuickAddForm type="Child" onSave={handleQuickAdd} onCancel={() => setActiveAction(null)} />}</AnimatePresence>
                        </div>
                        <div className="relative">
                            <button onClick={() => handleActionClick('sibling')} className={`p-1.5 rounded-lg border transition-all ${activeAction === 'sibling' ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-blue-100 border-blue-200 text-blue-700 hover:bg-blue-200'}`} title="Add Sibling"><ArrowRight size={14} /></button>
                            <AnimatePresence>{activeAction === 'sibling' && <QuickAddForm type="Sibling" onSave={handleQuickAdd} onCancel={() => setActiveAction(null)} />}</AnimatePresence>
                        </div>
                        <div className="ml-1 border-l border-white/5 pl-1.5">
                            <DeleteButton onDelete={() => onDelete(node.id)} />
                        </div>
                    </div>
                )}
            </div>
            
            {/* Connection Line Continuation */}
            <div className="absolute top-full left-1/2 w-px h-12 bg-gradient-to-b from-brand-black/10 to-transparent -translate-x-1/2 pointer-events-none" />
        </div>
    );
};

export default TreeNode;
