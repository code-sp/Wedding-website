import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

const DeleteButton = ({ onDelete, size = 20, className = '', title = "Delete", requireConfirm = true }) => {
    const [confirming, setConfirming] = useState(false);
    const [timer, setTimer] = useState(null);

    // Clean up timer on unmount
    useEffect(() => {
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [timer]);

    const handleClick = (e) => {
        // Prevent event bubbling if needed, though usually handled by parent
        if (e) e.stopPropagation();

        if (!requireConfirm) {
            onDelete();
            return;
        }

        if (confirming) {
            onDelete();
            setConfirming(false);
            if (timer) clearTimeout(timer);
        } else {
            setConfirming(true);
            const t = setTimeout(() => setConfirming(false), 2000);
            setTimer(t);
        }
    };

    return (
        <button
            onClick={handleClick}
            className={
                className
                    ? `${className} transition-all duration-300 ${
                        confirming 
                            ? '!bg-red-600 !text-white !border-red-500 shadow-md scale-105' 
                            : ''
                      }`
                    : `p-2 rounded-full transition-colors ${
                        confirming
                            ? 'bg-red-600 text-white hover:bg-red-700 shadow-md transform scale-105'
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                      }`
            }
            title={confirming ? "Click again to confirm" : title}
            type="button" // Prevent form submission
        >
            <Trash2 size={size} />
        </button>
    );
};

export default DeleteButton;
