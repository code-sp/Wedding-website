import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowUpDown, Save, X, Trash2 } from 'lucide-react';
import StandardButton from './StandardButton';

/**
 * Enterprise-Standard Floating Management HUD.
 * Minimalist, high-performance, and perfectly aligned.
 */
const AdminHUD = ({ 
    isEditing, 
    onEdit, 
    onSave, 
    onCancel, 
    onAdd, 
    onDelete,
    addLabel = "Add New",
    editLabel = "Edit Details",
    saveLabel = "Save Changes",
    editIcon = ArrowUpDown,
    show = true
}) => {
    if (!show) return null;

    return (
        <div className="fixed bottom-28 right-8 md:bottom-16 md:right-16 z-[100] flex flex-col items-end gap-3 pointer-events-none">
            <AnimatePresence mode="popLayout">
                {isEditing ? (
                    <motion.div
                        layout
                        key="cancel-btn"
                        initial={{ opacity: 0, scale: 0.8, x: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: 20 }}
                        className="pointer-events-auto"
                    >
                        <StandardButton
                            onClick={onCancel}
                            variant="secondary"
                            icon={X}
                            size="md"
                            className="!w-11 !h-11 !p-0 shadow-2xl"
                            title="Discard Changes"
                        />
                    </motion.div>
                ) : (
                    onDelete && (
                        <motion.div
                            layout
                            key="delete-btn"
                            initial={{ opacity: 0, scale: 0.8, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, x: 20 }}
                            className="pointer-events-auto"
                        >
                            <button
                                onClick={onDelete}
                                className="w-11 h-11 flex items-center justify-center bg-rose-500/10 backdrop-blur-xl border border-rose-500/20 text-rose-600 rounded-full shadow-lg hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                                title="Delete Entry"
                            >
                                <Trash2 size={18} strokeWidth={2.5} />
                            </button>
                        </motion.div>
                    )
                )}

                {((!isEditing && onEdit && editLabel) || isEditing) && (
                    <motion.div
                        layout
                        key="primary-action"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="pointer-events-auto"
                    >
                        <StandardButton
                            onClick={isEditing ? onSave : onEdit}
                            variant={isEditing ? 'primary' : 'secondary'}
                            icon={isEditing ? Save : editIcon}
                            expandable
                            size="md"
                            className="shadow-2xl"
                        >
                            {isEditing ? saveLabel : editLabel}
                        </StandardButton>
                    </motion.div>
                )}

                {!isEditing && onAdd && (
                    <motion.div
                        layout
                        key="add-action"
                        initial={{ opacity: 0, scale: 0.8, x: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: 20 }}
                        className="pointer-events-auto"
                    >
                        <StandardButton
                            onClick={onAdd}
                            variant="primary"
                            icon={Plus}
                            expandable
                            size="md"
                            className="shadow-2xl"
                        >
                            {addLabel}
                        </StandardButton>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminHUD;
