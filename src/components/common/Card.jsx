import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ children, className = '', hover = false, ...props }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            whileHover={hover ? { y: -5, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' } : {}}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            // Stronger glass effect: lower opacity background (30%), heavier blur, stronger white border
            className={`bg-white/30 backdrop-blur-md border border-white/60 rounded-[2rem] p-8 md:p-10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] ${className}`}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default Card;
