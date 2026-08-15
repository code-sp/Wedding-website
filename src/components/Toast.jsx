import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle, Info } from 'lucide-react';
import { useEffect } from 'react';
import ReactDOM from 'react-dom';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [message, duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success': return <Check className="w-5 h-5 text-green-500" />;
            case 'error': return <X className="w-5 h-5 text-red-500" />;
            case 'warning': return <AlertCircle className="w-5 h-5 text-amber-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const getBorderColor = () => {
        switch (type) {
            case 'success': return 'border-green-200';
            case 'error': return 'border-red-200';
            case 'warning': return 'border-amber-200';
            default: return 'border-blue-200';
        }
    };

    return ReactDOM.createPortal(
        <AnimatePresence>
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -50, x: "-50%", scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
                    exit={{ opacity: 0, y: -20, x: "-50%", scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className={`fixed top-10 left-1/2 z-[9999] flex items-center gap-3 px-6 py-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-card border ${getBorderColor()} min-w-[320px] max-w-sm`}
                    style={{ transform: "translateX(-50%)" }}
                >
                    <div className={`p-2 rounded-full bg-opacity-10 ${type === 'success' ? 'bg-green-100' : type === 'error' ? 'bg-red-100' : 'bg-blue-100'}`}>
                        {getIcon()}
                    </div>
                    <div className="flex-1">
                        <p className="font-sans text-brand-black font-medium text-sm md:text-base">{message}</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default Toast;
