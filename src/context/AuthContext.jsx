import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const getInitialClientId = () => {
    if (typeof window === 'undefined') return 'default_client';
    const params = new URLSearchParams(window.location.search);
    return params.get('c') || params.get('clientId') || localStorage.getItem('activeClientId') || 'default_client';
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRegistered, setIsRegistered] = useState(false);
    const [activeClientId, setActiveClientId] = useState(getInitialClientId);
    const [clients, setClients] = useState([]);

    useEffect(() => {
        let cancelled = false;

        const hydrate = async () => {
            try {
                const result = await api.session();
                if (cancelled) return;
                setUser(result.user);
                setIsRegistered(Boolean(result.user?.isRegistered));
            } catch {
                if (!cancelled) {
                    setUser(null);
                    setIsRegistered(false);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        hydrate();
        return () => { cancelled = true; };
    }, []);

    const fetchClients = async () => {
        if (!user || user.role !== 'admin') {
            setClients([]);
            return [];
        }
        const data = await api.getClients();
        setClients(Array.isArray(data) ? data : []);
        return data;
    };

    useEffect(() => {
        if (user?.role === 'admin' && user?.profileComplete) {
            fetchClients();
        } else {
            setClients([]);
        }
    }, [user?.role, user?.profileComplete]);

    const loginWithCode = async (code, clientId = activeClientId) => {
        const result = await api.login(code, clientId);
        if (!result.success) return result;

        const userData = result.user;
        setUser(userData);
        setIsRegistered(Boolean(userData?.isRegistered));

        if (userData?.clientId && userData.role !== 'admin') {
            setActiveClientId(userData.clientId);
        }

        return {
            success: true,
            role: userData?.role,
            user: userData,
            requireClientRegistration: Boolean(
                (userData?.role === 'client' || userData?.role === 'admin') &&
                !userData?.profileComplete
            )
        };
    };

    const registerAndLogin = async (_name, invitationToken, clientId = activeClientId) => {
        const result = await api.login(invitationToken, clientId);
        if (!result.success) return result;
        setUser(result.user);
        setIsRegistered(Boolean(result.user?.isRegistered));
        return { success: true, role: result.user?.role, user: result.user };
    };

    const logout = async () => {
        try {
            await api.logout();
        } catch {
            // Clear local UI state even if the server session is already gone.
        }
        setUser(null);
        setIsRegistered(false);
        setClients([]);
        setActiveClientId('default_client');
        localStorage.removeItem('activeClientId');
    };

    const switchClient = (newId) => {
        if (user?.role !== 'admin' || !newId) return;
        setActiveClientId(newId);
        localStorage.setItem('activeClientId', newId);
    };

    const generateToken = async (role = 'user') => {
        const result = await api.createUser({
            role,
            name: role === 'client' ? 'Wedding Organiser' : 'Invited Guest',
            clientId: activeClientId
        });
        return result?.user?.accessCode || null;
    };

    const checkTokenStatus = async () => {
        try {
            const result = await api.session();
            return { valid: true, user: result.user };
        } catch {
            return { valid: false };
        }
    };

    const completeRegistration = (rsvpData) => {
        setIsRegistered(true);
        setUser(current => current ? { ...current, isRegistered: true, rsvpData } : current);
    };

    const value = useMemo(() => ({
        user,
        loading,
        isRegistered,
        loginWithCode,
        registerAndLogin,
        logout,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'admin',
        isClient: user?.role === 'client',
        isGuest: !user || user?.role === 'user',
        clientId: user?.role === 'admin' ? activeClientId : (user?.clientId || 'default_client'),
        activeClientId,
        switchClient,
        clients,
        refreshClients: fetchClients,
        generatedTokens: {},
        generateToken,
        checkTokenStatus,
        completeRegistration
    }), [user, loading, isRegistered, activeClientId, clients]);

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
