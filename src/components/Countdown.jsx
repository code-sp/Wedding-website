import { useState, useEffect } from 'react';
import { differenceInSeconds } from 'date-fns';

const Countdown = ({ targetDate, compact = false, blend = false }) => {
    const calculateTimeLeft = () => {
        const now = new Date();
        if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        const target = new Date(targetDate);
        if (isNaN(target.getTime())) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        const diff = differenceInSeconds(target, now);

        if (diff <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        const days = Math.floor(diff / (3600 * 24));
        const hours = Math.floor((diff % (3600 * 24)) / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;

        return { days, hours, minutes, seconds };
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

    useEffect(() => {
        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    const TimeBox = ({ value, label }) => (
        <div className="flex flex-col items-center">
            <span className={`block text-center ${compact ? 'text-2xl lg:text-3xl' : 'text-3xl md:text-5xl'} font-display font-bold ${blend ? 'text-white' : 'text-brand-black'} leading-none tabular-nums`}>
                {String(value).padStart(2, '0')}
            </span>
            <span className={`block text-center text-[10px] uppercase tracking-widest ${blend ? 'text-white/70' : 'text-brand-accent/60'} font-semibold mt-1`}>
                {label}
            </span>
        </div>
    );

    return (
        <div className="grid grid-cols-4 gap-2 w-full max-w-sm mx-auto">
            <TimeBox value={timeLeft.days} label="Days" />
            <TimeBox value={timeLeft.hours} label="Hrs" />
            <TimeBox value={timeLeft.minutes} label="Mins" />
            <TimeBox value={timeLeft.seconds} label="Secs" />
        </div>
    );
};

export default Countdown;
