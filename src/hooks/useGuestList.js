import { useState, useEffect, useMemo } from 'react';
import { api } from '../utils/api';

/**
 * Centralized guest-directory adapter.
 * Credentials are intentionally never persisted or reconstructed here.
 */
export const useGuestList = (clientId) => {
    const [dbUsers, setDbUsers] = useState([]);
    const [whiteList, setWhiteList] = useState([]);
    const [rsvpSubmissions, setRsvpSubmissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [users, guests, rsvps] = await Promise.all([
                api.getUsers(clientId),
                api.getGuests(clientId),
                api.getAllRSVPs(clientId)
            ]);
            setDbUsers(Array.isArray(users) ? users : []);
            setWhiteList(Array.isArray(guests) ? guests : []);
            setRsvpSubmissions(Array.isArray(rsvps) ? rsvps : []);
        } catch (error) {
            console.error('Guest directory fetch failed', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        if (!clientId) return undefined;
        fetchData();
        const interval = setInterval(() => fetchData(true), 10000);
        return () => clearInterval(interval);
    }, [clientId]);

    const unifiedGuests = useMemo(() => {
        const list = [];
        const processedRSVPs = new Set();

        whiteList.forEach((guest) => {
            const linkedUser =
                dbUsers.find((user) => user.id === guest.claimedBy) ||
                (!guest.isClaimed
                    ? dbUsers.find((user) => user.name?.toLowerCase() === guest.name?.toLowerCase())
                    : null);

            const activeRSVP = rsvpSubmissions.find((rsvp) =>
                (linkedUser && rsvp.userId === linkedUser.id) ||
                (rsvp.name && guest.name && rsvp.name.toLowerCase() === guest.name.toLowerCase())
            );

            if (activeRSVP) processedRSVPs.add(activeRSVP.id);

            list.push({
                id: guest._id,
                name: guest.name,
                status: activeRSVP ? 'Active' : linkedUser ? 'Invited' : 'Pending',
                linkedUser,
                rsvp: activeRSVP || null,
                isWhitelist: true
            });
        });

        rsvpSubmissions.forEach((rsvp) => {
            if (processedRSVPs.has(rsvp.id)) return;
            const linkedUser =
                dbUsers.find((user) => user.id === rsvp.userId) ||
                dbUsers.find((user) => user.name && rsvp.name && user.name.toLowerCase() === rsvp.name.toLowerCase());

            list.push({
                id: `rsvp_${rsvp.id}`,
                name: rsvp.name || linkedUser?.name || 'Unknown Guest',
                status: 'Active',
                linkedUser,
                rsvp,
                isWhitelist: false
            });
        });

        return list;
    }, [dbUsers, whiteList, rsvpSubmissions]);

    const sortedGuests = useMemo(() => {
        let filtered = unifiedGuests;
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = unifiedGuests.filter((guest) =>
                guest.name.toLowerCase().includes(lowerTerm) ||
                guest.status.toLowerCase().includes(lowerTerm)
            );
        }

        return [...filtered].sort((a, b) => {
            if (!sortConfig.key) return 0;
            let aVal = '';
            let bVal = '';

            switch (sortConfig.key) {
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case 'status': {
                    const priority = { Active: 1, Invited: 2, Pending: 3 };
                    aVal = priority[a.status] || 99;
                    bVal = priority[b.status] || 99;
                    break;
                }
                case 'guests':
                    aVal = (a.rsvp && parseInt(a.rsvp.guests, 10)) || 0;
                    bVal = (b.rsvp && parseInt(b.rsvp.guests, 10)) || 0;
                    break;
                case 'accommodation':
                    aVal = String(a.rsvp?.accommodation || '');
                    bVal = String(b.rsvp?.accommodation || '');
                    break;
                default:
                    break;
            }

            if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
    }, [unifiedGuests, searchTerm, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };

    return {
        guests: sortedGuests,
        loading,
        searchTerm,
        setSearchTerm,
        sortConfig,
        requestSort,
        refresh: () => fetchData(false),
        stats: {
            total: unifiedGuests.length,
            active: unifiedGuests.filter((guest) => guest.status === 'Active').length,
            pending: unifiedGuests.filter((guest) => guest.status !== 'Active').length
        }
    };
};
