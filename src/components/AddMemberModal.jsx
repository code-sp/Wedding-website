import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const AddMemberModal = ({ isOpen, onClose, onSave, initialData = {}, nodes = [] }) => {
    const [formData, setFormData] = useState({
        name: '',
        gender: 'male',
        relation: '',
        relatedTo: '',
        relationshipType: 'child' // child, sibling, parent, partner
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: '',
                gender: 'male',
                relation: '',
                relatedTo: initialData.sourceId || '',
                relationshipType: initialData.relationType || 'child'
            });
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/20 backdrop-blur-md animate-in fade-in zoom-in duration-200">
            <div className="bg-white/80 backdrop-blur-3xl rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] w-full max-w-md overflow-hidden border border-white/60">
                <div className="flex items-center justify-between p-6 border-b border-white/40 bg-white/40 rounded-t-[2rem]">
                    <h3 className="font-display font-bold text-xl text-brand-black">Add Family Member</h3>
                    <button onClick={onClose} className="text-brand-black/40 hover:text-brand-black transition-colors bg-white/50 rounded-full p-2 hover:bg-white shadow-sm">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white/20">
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-black/60 tracking-wider mb-2">Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-white/60 bg-white/40 focus:bg-white/80 focus:border-brand-black outline-none transition-all text-brand-black font-medium text-sm placeholder:text-brand-black/30"
                            placeholder="Enter name"
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-brand-black/60 tracking-wider mb-2">Gender</label>
                            <select
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-white/60 bg-white/40 focus:bg-white/80 focus:border-brand-black outline-none transition-all text-brand-black font-medium text-sm"
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-brand-black/60 tracking-wider mb-2">Relation Title</label>
                            <input
                                type="text"
                                value={formData.relation}
                                onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-white/60 bg-white/40 focus:bg-white/80 focus:border-brand-black outline-none transition-all text-brand-black font-medium text-sm placeholder:text-brand-black/30"
                                placeholder="e.g. Son"
                            />
                        </div>
                    </div>

                    {!initialData.sourceId && (
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-brand-black/60 tracking-wider mb-2">Related To</label>
                            <select
                                required
                                value={formData.relatedTo}
                                onChange={(e) => setFormData({ ...formData, relatedTo: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-white/60 bg-white/40 focus:bg-white/80 focus:border-brand-black outline-none transition-all text-brand-black font-medium text-sm"
                            >
                                <option value="">Select a family member</option>
                                {nodes.map(node => (
                                    <option key={node.id} value={node.id}>{node.name} ({node.relation})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {!initialData.relationType && (
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-brand-black/60 tracking-wider mb-2">Relationship Type</label>
                            <select
                                value={formData.relationshipType}
                                onChange={(e) => setFormData({ ...formData, relationshipType: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-white/60 bg-white/40 focus:bg-white/80 focus:border-brand-black outline-none transition-all text-brand-black font-medium text-sm"
                            >
                                <option value="child">Child</option>
                                <option value="sibling">Sibling</option>
                                <option value="partner">Partner</option>
                                <option value="parent">Parent</option>
                            </select>
                        </div>
                    )}

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-full border border-white/60 text-brand-black/60 hover:text-brand-black hover:bg-white/40 transition-all font-bold text-xs uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 rounded-full bg-brand-black text-white hover:bg-brand-dark transition-all font-bold text-xs uppercase tracking-widest shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                            Add Member
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddMemberModal;
