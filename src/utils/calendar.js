export const generateGoogleCalendarLink = (event) => {
    const { title, description, location, startTime, endTime, date, time } = event;

    let startObj, endObj;

    if (startTime && endTime) {
        startObj = new Date(startTime);
        endObj = new Date(endTime);
    } else if (date && time) {
        // Parse "Dec 12, 2025" and "11:00 AM"
        const dateStr = `${date} ${time}`;
        startObj = new Date(dateStr);
        // Default duration 2 hours if not specified
        endObj = new Date(startObj.getTime() + 2 * 60 * 60 * 1000);
    } else {
        // Fallback or error handling
        console.warn("Invalid event date format", event);
        return "#";
    }

    const formatDate = (date) => {
        if (isNaN(date.getTime())) return "";
        return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    };

    const start = formatDate(startObj);
    const end = formatDate(endObj);

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title,
        details: description,
        location: location,
        dates: `${start}/${end}`,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
