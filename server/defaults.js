// Default Data to seed/fallback to if DB is empty

export const defaultEvents = [
    {
        id: 1,
        title: 'Lagan',
        date: 'Dec 12, 2025',
        time: '11:00 AM',
        location: 'The Rustic Barn, Tuscany',
        description: 'The beginning of our wedding rituals. Join us for the auspicious Lagan ceremony.',
        image: '/assets/images/event-lagan.png', // Note: Paths might need adjustment for backend serving or frontend public
        dressCode: 'Traditional Indian',
        mapLink: 'https://maps.google.com'
    },
    {
        id: 2,
        title: 'Mehndi',
        date: 'Dec 13, 2025',
        time: '2:00 PM',
        location: 'Villa Garden',
        description: 'A colorful afternoon of henna, music, and dance.',
        image: '/assets/images/event-mehndi.png',
        dressCode: 'Bright & Colorful',
        mapLink: 'https://maps.google.com'
    },
    {
        id: 3,
        title: 'Haldi',
        date: 'Dec 14, 2025',
        time: '10:00 AM',
        location: 'Poolside',
        description: 'A fun-filled ceremony with turmeric paste and flower showers.',
        image: '/assets/images/event-haldi.png',
        dressCode: 'Yellow',
        mapLink: 'https://maps.google.com'
    },
    {
        id: 4,
        title: 'The Wedding (Shadi)',
        date: 'Dec 15, 2025',
        time: '6:00 PM',
        location: 'Grand Ballroom',
        description: 'The moment we say "I do". Dinner and dancing to follow.',
        image: '/assets/images/event-shadi.png',
        dressCode: 'Formal / Black Tie',
        mapLink: 'https://maps.google.com'
    }
];

// Note: In the React app these were imports. Detailed paths assume the assets are in public or handled via URL.
// Since we are decoupling, we will assume these are path strings.
export const defaultGalleryPhotos = [
    { id: 1, src: '/assets/images/gallery-couple.png', alt: "Wedding Ceremony" },
    { id: 2, src: '/assets/images/gallery-ring.png', alt: "Couple Portrait" },
    { id: 3, src: '/assets/images/gallery-decor.png', alt: "Ring Exchange" },
    { id: 4, src: '/assets/images/gallery-party.png', alt: "Reception Party" },
    { id: 5, src: '/assets/images/gallery-food.png', alt: "Wedding Feast" },
    { id: 6, src: '/assets/images/gallery-dance.png', alt: "First Dance" }
];

export const defaultStories = [
    {
        id: 1,
        year: '2018',
        title: 'First Meeting',
        description: 'We met at a coffee shop in downtown Seattle. James spilled his latte, Sophia laughed, and the rest is history.',
        image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 2,
        year: '2020',
        title: 'The Proposal',
        description: 'On a sunset hike in the Dolomites, James got down on one knee. It was the easiest "Yes" of Sophia\'s life.',
        image: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 3,
        year: '2025',
        title: 'Forever Begins',
        description: 'We can\'t wait to celebrate our love with all of our favorite people in Tuscany.',
        image: '/forever_begins.png'
    }
];

export const defaultUsers = [
    { id: 'admin', role: 'admin', name: 'Admin', access_code: 'admin123' }
];

export const defaultHomeData = {
    weddingDate: '2025-12-12T11:00',
    heroImage: null,
    brideName: 'Bride',
    groomName: 'Groom'
};
