import { useState, useEffect, useMemo } from 'react';
import { api } from '../utils/api';

/**
 * Enterprise-grade hook for managing guest lists across different views.
 * Centralizes merging, filtering, and sorting logic.
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
            setDbUsers(users);
            setWhiteList(guests);
            setRsvpSubmissions(rsvps);
        } catch (e) {
            console.error("Fetch failed", e);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        if (clientId) {
            fetchData();
            const interval = setInterval(() => fetchData(true), 10000); // Polling
            return () => clearInterval(interval);
        }
    }, [clientId]);

    // Unified List Merging Logic
    const unifiedGuests = useMemo(() => {
        const list = [];
        const processedRSVPs = new Set();

        whiteList.forEach(guest => {
            const linkedUser = dbUsers.find(u => u.id === guest.claimedBy) ||
                (guest.isClaimed ? null : dbUsers.find(u => u.name?.toLowerCase() === guest.name?.toLowerCase()));

            const activeRSVP = rsvpSubmissions.find(r =>
                (linkedUser && (r.accessToken === linkedUser.access_code || r._code === linkedUser.access_code)) ||
                (r.name && guest.name && r.name.toLowerCase() === guest.name.toLowerCase())
            );

            if (activeRSVP) processedRSVPs.add(activeRSVP.id);

            let status = 'Pending';
            if (activeRSVP) status = 'Active';
            else if (linkedUser) status = 'Token Generated';

            list.push({
                id: guest._id,
                name: guest.name,
                status: status,
                accessCode: linkedUser?.access_code || activeRSVP?.accessToken || null,
                linkedUser: linkedUser,
                rsvp: activeRSVP || null,
                isWhitelist: true
            });
        });

        // Add self-registered users not in whitelist
        rsvpSubmissions.forEach(rsvp => {
            if (!processedRSVPs.has(rsvp.id)) {
                const linkedUser = dbUsers.find(u => u.access_code === rsvp.accessToken || (u.name && rsvp.name && u.name.toLowerCase() === rsvp.name.toLowerCase()));
                list.push({
                    id: `rsvp_${rsvp.id}`,
                    name: rsvp.name || 'Unknown Guest',
                    status: 'Active',
                    accessCode: rsvp.accessToken || linkedUser?.access_code || null,
                    linkedUser: linkedUser,
                    rsvp: rsvp,
                    isWhitelist: false
                });
            }
        });

        return list;
    }, [dbUsers, whiteList, rsvpSubmissions]);

    // Filter & Sort Logic
    const sortedGuests = useMemo(() => {
        let filtered = unifiedGuests;
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = unifiedGuests.filter(g => 
                g.name.toLowerCase().includes(lowerTerm) ||
                (g.accessCode && g.accessCode.toLowerCase().includes(lowerTerm)) ||
                (g.status.toLowerCase().includes(lowerTerm))
            );
        }

        return [...filtered].sort((a, b) => {
            if (!sortConfig.key) return 0;
            let aVal = '', bVal = '';

            switch (sortConfig.key) {
                case 'name':
                    aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
                case 'status':
                    const priority = { 'Active': 1, 'Token Generated': 2, 'Pending': 3 };
                    aVal = priority[a.status] || 99; bVal = priority[b.status] || 99;
                    break;
                case 'guests':
                    aVal = (a.rsvp && parseInt(a.rsvp.guests)) || 0;
                    bVal = (b.rsvp && parseInt(b.rsvp.guests)) || 0;
                    break;
                default: break;
            }

            if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
    }, [unifiedGuests, searchTerm, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
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
            active: unifiedGuests.filter(g => g.status === 'Active').length,
            pending: unifiedGuests.filter(g => g.status === 'Pending').length
        }
    };
};
