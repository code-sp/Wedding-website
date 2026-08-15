import Countdown from './Countdown';

const CountdownShowcase = ({ targetDate, ...props }) => {
    // Default wedding date: December 12, 2025 at 11:00 AM
    const date = targetDate || '2025-12-12T11:00:00';

    return (
        <div className="w-full py-2">
            <Countdown targetDate={date} {...props} />
        </div>
    );
};

export default CountdownShowcase;
