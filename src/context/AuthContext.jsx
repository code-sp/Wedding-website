import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
// We still use SecureStorage to persist the "User ID/Token" locally so refresh works, or we can just use localStorage directly.
// But technically we should persist the *result* of login.
import SecureStorage from '../utils/secureStorage';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    // Note: We removed the dependency on useImageContext!
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRegistered, setIsRegistered] = useState(false);
    const getInitialClientId = () => {
        const params = new URLSearchParams(window.location.search);
        const urlId = params.get('c') || params.get('clientId');
        const finalId = urlId || SecureStorage.getItem('activeClientId') || 'default_client';
        if (urlId && urlId !== SecureStorage.getItem('activeClientId')) {
            SecureStorage.setItem('activeClientId', urlId);
        }
        return finalId;
    };

    const [activeClientId, setActiveClientId] = useState(getInitialClientId());

    // For Invite Links (admin only)
    const [generatedTokens, setGeneratedTokens] = useState({});
    const [clients, setClients] = useState([]);

    useEffect(() => {
        // Hydrate session on load
        console.log('[AUTH_CONTEXT] Initializing session hydration...');
        const storedUser = SecureStorage.getItem('currentUser');
        if (storedUser) {
            console.log('[AUTH_CONTEXT] Found stored session for:', storedUser.name, 'Role:', storedUser.role);
            setUser(storedUser);
            setIsRegistered(storedUser.isRegistered);
        } else {
            console.log('[AUTH_CONTEXT] No active session found.');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (user?.role === 'admin') {
            console.log('[AUTH_CONTEXT] Admin detected, fetching global client list...');
            fetchClients();
        }
    }, [user]);

    const fetchClients = async () => {
        try {
            const data = await api.getClients();
            console.log('[AUTH_CONTEXT] Successfully fetched', data.length, 'clients.');
            setClients(data);
        } catch (e) {
            console.error('[AUTH_CONTEXT] ERROR: Failed to fetch clients', e);
        }
    };

    const loginWithCode = async (code, clientId) => {
        console.log('[AUTH_CONTEXT] Attempting login with code for clientId:', clientId);
        try {
            const res = await api.login(code, clientId);
            if (res.success) {
                console.log('[AUTH_CONTEXT] Login successful. Role:', res.user?.role);
                // If special global code, it might require name registration
                if (res.requireName) {
                    console.log('[AUTH_CONTEXT] Login requires name registration.');
                    return { success: true, requireName: true };
                }

                const userData = res.user;

                // Restrict unregistered clients from accessing the main site
                if (userData.role === 'client' && !userData.isRegistered && userData.access_code?.startsWith('REQ')) {
                    console.log('[AUTH_CONTEXT] Client registration pending.');
                    return { success: true, requireClientRegistration: true, user: userData };
                }

                setUser(userData);
                setIsRegistered(userData.isRegistered);
                SecureStorage.setItem('currentUser', userData);
                
                return { success: true, role: userData.role };
            } else {
                console.warn('[AUTH_CONTEXT] Login failed:', res.error);
                return { success: false, error: res.error || 'Invalid code' };
            }
        } catch (e) {
            console.error('[AUTH_CONTEXT] CRITICAL ERROR: Network/Server failure during login', e);
            return { success: false, error: 'Network error' };
        }
    };

    const registerAndLogin = async (name, globalCode, clientId) => {
        console.log('[AUTH_CONTEXT] Registering guest:', name, 'under clientId:', clientId);
        try {
            const res = await api.registerGuest(name, globalCode, clientId);
            if (res.success) {
                console.log('[AUTH_CONTEXT] Guest registration successful.');
                const userData = res.user;
                setUser(userData);
                setIsRegistered(false);
                SecureStorage.setItem('currentUser', userData);
                return { success: true, role: userData.role };
            }
            console.warn('[AUTH_CONTEXT] Registration failed:', res.error);
            return { success: false, error: res.error };
        } catch (e) {
            console.error('[AUTH_CONTEXT] ERROR during guest registration', e);
            return { success: false, error: 'Registration failed' };
        }
    };

    const logout = () => {
        console.log('[AUTH_CONTEXT] Logging out user:', user?.name);
        setUser(null);
        setIsRegistered(false);
        setClients([]);
        setActiveClientId('default_client');
        SecureStorage.removeItem('currentUser');
        SecureStorage.removeItem('activeClientId');
    };

    const switchClient = (newId) => {
        if (user?.role === 'admin') {
            console.log('[AUTH_CONTEXT] Admin switching active client context to:', newId);
            setActiveClientId(newId);
            SecureStorage.setItem('activeClientId', newId);
        }
    };

    // Generate Token (Async now)
    const generateToken = async (role = 'user') => {
        const res = await api.createUser({ role, name: 'Invited Guest' });
        if (res.success) {
            return res.user.access_code;
        }
        return null;
    };

    // Check Status placeholder
    const checkTokenStatus = () => {
        return { valid: true }; // Backend handles this now in login
    };

    // Complete Registration (Client-side optimistic update for route guards)
    const completeRegistration = (rsvpData) => {
        if (user) {
            const updated = { ...user, isRegistered: true, rsvpData };
            setUser(updated);
            setIsRegistered(true);
            SecureStorage.setItem('currentUser', updated);
        }
    };

    const value = {
        user,
        loading,
        isRegistered,
        loginWithCode,
        registerAndLogin,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isClient: user?.role === 'client',
        isGuest: !user || user?.role === 'user',
        clientId: user?.role === 'admin' ? activeClientId : (user?.clientId || 'default_client'),
        activeClientId,
        switchClient,
        clients,
        refreshClients: fetchClients,
        generatedTokens,
        generateToken,
        checkTokenStatus,
        completeRegistration
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
