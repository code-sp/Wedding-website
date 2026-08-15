import { CalendarPlus } from 'lucide-react';
import { generateGoogleCalendarLink } from '../utils/calendar';

const AddToCalendar = ({ event, className = "", iconSize = 16, hideText = false }) => {
    const link = generateGoogleCalendarLink(event);

    return (
        <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-5 py-2.5 bg-white text-zinc-950 rounded-full shadow-lg hover:bg-zinc-200 hover:scale-105 transition-all font-bold text-[10px] uppercase tracking-widest ${className}`}
        >
            <CalendarPlus size={iconSize} />
            {!hideText && (
                <>
                    <span className="hidden sm:inline">Mark Your Calendar</span>
                    <span className="sm:hidden">Mark Calendar</span>
                </>
            )}
        </a>
    );
};

export default AddToCalendar;
