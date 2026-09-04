import { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';

const ImageContext = createContext();

export const useImageContext = () => useContext(ImageContext);

export const ImageProvider = ({ children }) => {
    // State
    const [events, setEvents] = useState([]);
    const [galleryPhotos, setGalleryPhotos] = useState([]);
    const [momentsPhotos, setMomentsPhotos] = useState([]); // User uploads
    const [homeData, setHomeData] = useState({
        weddingDate: '2026-12-31T00:00',
        heroImage: null,
        brideName: 'Bride',
        groomName: 'Groom',
        welcomeMessage: 'We invite you to celebrate our love as we begin our greatest adventure together.'
    });
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({
        enabledTabs: ['home', 'story', 'events', 'moments', 'gallery', 'rsvp', 'contact', 'family_tree'],
        customTabs: [],
        rooms: [
            { id: 1, name: 'Deluxe Suite', type: 'King Bed', capacity: 2, price: '$200', available: 3 },
            { id: 2, name: 'Garden View', type: 'Queen Bed', capacity: 2, price: '$150', available: 5 },
            { id: 3, name: 'Family Room', type: '2 Queen Beds', capacity: 4, price: '$250', available: 2 },
        ],
        seatingConfig: [
            { id: "vip", name: "VIP Section", type: "sofa", rows: 3, colsPerSide: 9, price: 100 },
            { id: "general", name: "General Section", type: "chair", rows: 10, colsPerSide: 10, price: 50 }
        ]
    });

    const [contactData, setContactData] = useState({
        contactCards: [
            { title: "Bride's Family", name: "Family Member", phone: "+91 98765 43210", email: "bride@example.com" },
            { title: "Groom's Family", name: "Family Member", phone: "+91 98765 43211", email: "groom@example.com" }
        ],
        venueName: "Grand Palace Hall",
        venueAddress: "123 Wedding Street, City, State, 12345",
        venueMapsLink: "https://maps.google.com",
        faqs: [
            { q: "Is parking available?", a: "Yes, complimentary valet parking is available at the main venue entrances." },
            { q: "What's the dress code?", a: "Traditional formal or black-tie attire is highly recommended." },
            { q: "Can I bring a plus one?", a: "Please refer to your personal RSVP invite details for guest allowances." },
            { q: "Will there be food?", a: "A full banquet reception will follow the main ceremonies." }
        ]
    });

    // Family Tree
    const [people, setPeople] = useState([]);
    const [families, setFamilies] = useState([]);
    const [links, setLinks] = useState([]);
    const [groomPeople, setGroomPeople] = useState([]);
    const [groomFamilies, setGroomFamilies] = useState([]);
    const [groomLinks, setGroomLinks] = useState([]);

    // RSVP
    const [rsvpSubmissions, setRsvpSubmissions] = useState([]);
    const { clientId } = useAuth();

    // Initial Fetch
    useEffect(() => {
        setLoading(true);
        console.log('[IMAGE_CONTEXT] Initializing global content hydration for clientId:', clientId);
        
        // Clear previous state to prevent cross-contamination when switching portals
        setEvents([]);
        setGalleryPhotos([]);
        setMomentsPhotos([]);
        setStories([]);
        setPeople([]);
        setFamilies([]);
        setLinks([]);
        setGroomPeople([]);
        setGroomFamilies([]);
        setGroomLinks([]);
        setRsvpSubmissions([]);

        const loadAll = async () => {
            try {
                // Parallel fetching
                const [
                    e, g, m, h, s, c,
                    p, f, l,
                    gp, gf, gl,
                    rsvps,
                    setts
                ] = await Promise.all([
                    api.getContent('events', clientId),
                    api.getContent('gallery', clientId),
                    api.getContent('moments', clientId),
                    api.getContent('home_data', clientId),
                    api.getContent('stories', clientId),
                    api.getContent('contact_data', clientId),
                    api.getContent('family_people', clientId),
                    api.getContent('family_families', clientId),
                    api.getContent('family_links', clientId),
                    api.getContent('groom_family_people', clientId),
                    api.getContent('groom_family_families', clientId),
                    api.getContent('groom_family_links', clientId),
                    api.getAllRSVPs(clientId),
                    api.getContent('client_settings', clientId)
                ]);

                console.log('[IMAGE_CONTEXT] Fetch complete. Hydrating local state...');

                // Set State with fallbacks to empty arrays/objects to avoid cross-contamination
                setEvents(e || []);
                setGalleryPhotos(g || []);
                setMomentsPhotos(m || []);
                if (h) setHomeData(prev => ({ ...prev, ...h }));
                setStories(s || []);
                if (c) setContactData(prev => ({ ...prev, ...c }));
                if (setts) setSettings(setts);

                setPeople(p || []);
                setFamilies(f || []);
                setLinks(l || []);

                setGroomPeople(gp || []);
                setGroomFamilies(gf || []);
                setGroomLinks(gl || []);

                setRsvpSubmissions(rsvps || []);

                console.log('[IMAGE_CONTEXT] State hydration finished successfully.');

            } catch (err) {
                console.error("[IMAGE_CONTEXT] CRITICAL ERROR: Failed to load content", err);
            } finally {
                setLoading(false);
            }
        };
        loadAll();
    }, [clientId]);

    // --- Actions ---

    const applyContentState = (key, value) => {
        if (key === 'gallery') setGalleryPhotos(value);
        if (key === 'moments') setMomentsPhotos(value);
        if (key === 'events') setEvents(value);
        if (key === 'stories') setStories(value);
        if (key === 'home_data') setHomeData(value);
        if (key === 'contact_data') setContactData(value);
        if (key === 'client_settings') setSettings(value);
        if (key === 'family_people') setPeople(value);
        if (key === 'family_families') setFamilies(value);
        if (key === 'family_links') setLinks(value);
        if (key === 'groom_family_people') setGroomPeople(value);
        if (key === 'groom_family_families') setGroomFamilies(value);
        if (key === 'groom_family_links') setGroomLinks(value);
    };

    // Generic helper to update local state AND server, then reconcile asset URLs.
    const updateServerContent = async (key, data) => {
        console.log('[IMAGE_CONTEXT] Syncing', key, 'to server for clientId:', clientId);
        try {
            const result = await api.updateContent(key, data, clientId);
            if (result?.value !== undefined) applyContentState(key, result.value);
            return result;
        } catch (err) {
            console.error(`[IMAGE_CONTEXT] ERROR: Failed to sync ${key}`, err);
            return { success: false, error: err };
        }
    };

    // --- GENERALIZED SYNC METHOD (Optimistic + authoritative reconciliation) ---
    const updateContentData = async (key, payload) => {
        console.log('[IMAGE_CONTEXT] Triggering Optimistic Update for:', key);
        applyContentState(key, payload);

        try {
            const result = await api.updateContent(key, payload, clientId);
            if (result?.value !== undefined) applyContentState(key, result.value);
            console.log('[IMAGE_CONTEXT] Background sync successful for:', key);
            return result;
        } catch (error) {
            console.error(`[IMAGE_CONTEXT] ERROR: Failed to sync ${key} data to server:`, error);
            return { success: false, error };
        }
    };

    const addEvent = (newEvent) => {
        const updated = [...events, newEvent];
        setEvents(updated);
        updateServerContent('events', updated);
    };
    const updateEvent = (id, field, value) => {
        const updated = events.map(e => e.id === id ? { ...e, [field]: value } : e);
        setEvents(updated);
        updateServerContent('events', updated);
    };
    const deleteEvent = (id) => {
        const updated = events.filter(e => e.id !== id);
        setEvents(updated);
        updateServerContent('events', updated);
    };

    // Gallery
    const addGalleryPhoto = (newPhoto) => {
        const updated = [...galleryPhotos, newPhoto];
        setGalleryPhotos(updated);
        updateServerContent('gallery', updated);
    };
    const replaceGalleryPhoto = (id, newSrc) => {
        const updated = galleryPhotos.map(p => p.id === id ? { ...p, src: newSrc } : p);
        setGalleryPhotos(updated);
        updateServerContent('gallery', updated);
    };
    const deleteGalleryPhoto = (id) => {
        const updated = galleryPhotos.filter(p => p.id !== id);
        setGalleryPhotos(updated);
        updateServerContent('gallery', updated);
    };

    // Moments
    const addMomentsPhoto = (newPhoto) => {
        const updated = [newPhoto, ...momentsPhotos];
        setMomentsPhotos(updated);
        updateServerContent('moments', updated);
    };
    const deleteMomentsPhoto = (id) => {
        const updated = momentsPhotos.filter(p => p.id !== id);
        setMomentsPhotos(updated);
        updateServerContent('moments', updated);
    };

    // Home
    const updateHomeData = (field, value) => {
        const updated = { ...homeData, [field]: value };
        setHomeData(updated);
        updateServerContent('home_data', updated);
    };

    // Stories
    const sortStoriesHelper = (a, b) => {
        const parseDate = (val) => {
            if (!val) return null;
            // Native Date string (YYYY-MM or full date)
            const d = new Date(val);
            if (!isNaN(d.getTime())) return d;
            // Spaced MM / YYYY format
            if (/^\d{2} \/ \d{4}$/.test(val)) {
                const [m, y] = val.split(' / ');
                return new Date(+y, +m - 1, 1);
            }
            // MM/YYYY format
            if (/^\d{2}\/\d{4}$/.test(val)) {
                const [m, y] = val.split('/');
                return new Date(+y, +m - 1, 1);
            }
            return null;
        };

        const dateA = parseDate(a.year);
        const dateB = parseDate(b.year);

        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA.getTime() - dateB.getTime();
    };

    const addStory = (newStory) => {
        const updated = [...stories, newStory].sort(sortStoriesHelper);
        setStories(updated);
        updateServerContent('stories', updated);
    };
    const updateStory = (id, field, value) => {
        const updated = stories.map(s => s.id === id ? { ...s, [field]: value } : s).sort(sortStoriesHelper);
        setStories(updated);
        updateServerContent('stories', updated);
    };
    const replaceStory = (updatedStory) => {
        const updated = stories.map(s => s.id === updatedStory.id ? { ...updatedStory } : s).sort(sortStoriesHelper);
        setStories(updated);
        updateServerContent('stories', updated);
    };
    const deleteStory = (id) => {
        const updated = stories.filter(s => s.id !== id);
        setStories(updated);
        updateServerContent('stories', updated);
    };

    // Contact
    const updateContactData = (newData) => {
        setContactData(newData);
        updateServerContent('contact_data', newData);
    };

    // Client Settings (Feature Toggles)
    const updateSettings = (newSettings) => {
        setSettings(newSettings);
        updateServerContent('client_settings', newSettings);
    };

    // Family Tree - Smart Setters that handle functional updates (prev => ...)
    const updatePeople = (action) => {
        setPeople(prev => {
            const newVal = typeof action === 'function' ? action(prev) : action;
            updateServerContent('family_people', newVal);
            return newVal;
        });
    };
    const updateFamilies = (action) => {
        setFamilies(prev => {
            const newVal = typeof action === 'function' ? action(prev) : action;
            updateServerContent('family_families', newVal);
            return newVal;
        });
    };
    const updateLinks = (action) => {
        setLinks(prev => {
            const newVal = typeof action === 'function' ? action(prev) : action;
            updateServerContent('family_links', newVal);
            return newVal;
        });
    };

    const updateGroomPeople = (action) => {
        setGroomPeople(prev => {
            const newVal = typeof action === 'function' ? action(prev) : action;
            updateServerContent('groom_family_people', newVal);
            return newVal;
        });
    };
    const updateGroomFamilies = (action) => {
        setGroomFamilies(prev => {
            const newVal = typeof action === 'function' ? action(prev) : action;
            updateServerContent('groom_family_families', newVal);
            return newVal;
        });
    };
    const updateGroomLinks = (action) => {
        setGroomLinks(prev => {
            const newVal = typeof action === 'function' ? action(prev) : action;
            updateServerContent('groom_family_links', newVal);
            return newVal;
        });
    };

    // RSVPS
    // This is tricky. RSVP submission is usually "Upsert this user's RSVP".
    // But `addRSVP` was used by `RSVP.jsx` to... push to local array?
    // We should expose a method `submitRSVP`.
    const addRSVP = async (data, userId) => {
        // Fallback: check if userId is in data
        const uid = userId || data.userId;

        // Optimistic update
        const newRSVP = { id: Date.now(), ...data, userId: uid };
        setRsvpSubmissions(prev => [newRSVP, ...prev]);

        if (uid) {
            const res = await api.submitRSVP(uid, data, clientId);
            if (res && res.newAccessCode) {
                 newRSVP._newAccessCode = res.newAccessCode;
                 // Also immediately update the optimistic RSVP so RSVPList sees the right token?
                 // Optionally handled in polling, but we can do it here:
                 setRsvpSubmissions(prev => prev.map(r => r.id === newRSVP.id ? { ...r, accessToken: res.newAccessCode } : r));
            }
        } else {
            console.warn("No User ID provided to addRSVP, saving locally only");
        }
        return newRSVP;
    };

    const updateRSVP = async (id, updatedData) => {
        // Optimistic Update
        setRsvpSubmissions(prev => prev.map(r => r.id === id ? { ...r, ...updatedData } : r));

        // Sync to Server
        // We need userId. Try to find it in the existing state if not passed.
        const original = rsvpSubmissions.find(r => r.id === id);
        const uid = updatedData.userId || (original && original.userId);

        if (uid) {
            // Merge original + update to ensure we send complete data
            const mergedData = { ...original, ...updatedData };
            await api.submitRSVP(uid, mergedData, clientId);
        } else {
            console.warn("Could not find User ID for RSVP update, skipping server sync");
        }
    };

    const deleteRSVP = (id) => {
        setRsvpSubmissions(prev => prev.filter(r => r.id !== id));
        api.deleteRSVP(id).catch(err => console.error("Failed to delete RSVP on server", err));
    };

    const getTotalGuests = () => {
        return rsvpSubmissions.reduce((acc, curr) => {
            return acc + (curr.attending === 'yes' ? (parseInt(curr.guests) || 0) : 0);
        }, 0);
    };

    return (
        <ImageContext.Provider value={{
            loading,
            updateContentData,
            events, addEvent, updateEvent, deleteEvent,
            galleryPhotos, addGalleryPhoto, replaceGalleryPhoto, deleteGalleryPhoto,
            momentsPhotos, addMomentsPhoto, deleteMomentsPhoto,
            homeData, updateHomeData,
            stories, addStory, updateStory, replaceStory, deleteStory,
            contactData, updateContactData,

            // Expose logic to replace setters for Family Tree
            people, setPeople: updatePeople,
            families, setFamilies: updateFamilies,
            links, setLinks: updateLinks,
            groomPeople, setGroomPeople: updateGroomPeople,
            groomFamilies, setGroomFamilies: updateGroomFamilies,
            groomLinks, setGroomLinks: updateGroomLinks,

            rsvpSubmissions, addRSVP, updateRSVP, deleteRSVP, getTotalGuests,
            settings, updateSettings
        }}>
            {children}
        </ImageContext.Provider>
    );
};
