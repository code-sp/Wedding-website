import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Calendar1, Images, Users, MessageCircle, Camera, LogOut, ChevronLeft, ChevronRight, Globe, TreeDeciduous, UsersRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useImageContext } from '../context/ImageContext';
import { useState } from 'react';
import { Settings } from 'lucide-react';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAdmin, logout, isAuthenticated, isRegistered, clientId, clients, switchClient } = useAuth();
    const { settings } = useImageContext();
    const [showSwitcher, setShowSwitcher] = useState(false);
    const enabledTabs = settings?.enabledTabs || [];

    const [isExpanded, setIsExpanded] = useState(() => {
        return localStorage.getItem('navbarExpanded') === 'true';
    });

    const navLinks = [
        { id: 'home', name: 'Home', path: '/', icon: Home, public: true, protected: true },
        { id: 'story', name: 'Story', path: '/story', icon: BookOpen, public: true, protected: true },
        { id: 'events', name: 'Events', path: '/events', icon: Calendar1, public: true, protected: true },
        { id: 'gallery', name: 'Gallery', path: '/gallery', icon: Images, public: true, protected: true },
        { id: 'family_tree', name: 'Legacy', path: '/family-tree', icon: TreeDeciduous, public: true, protected: true },
        ...(settings?.customTabs || []).map((t, idx) => ({ 
            id: `custom_${idx}`, 
            name: t.name, 
            path: t.path, 
            icon: Globe, 
            isExternal: true, 
            public: true, 
            protected: true 
        })),
        { id: 'rsvp-list', name: 'Guests', path: '/rsvp-list', icon: UsersRound, clientOnly: true },
        { id: 'contact', name: 'Contact', path: '/contact', icon: MessageCircle, public: true, protected: true },
        { id: 'master-directory', name: 'Portals', path: '/master-directory', icon: Globe, adminOnly: true },
        { id: 'settings', name: 'Settings', path: '/settings', icon: Settings, adminOnly: true },
    ];
    const visibleLinks = navLinks.filter(link => {
        const isClient = user?.role === 'client';

        // Admin-only links: only show to admin
        if (link.adminOnly) return isAdmin;

        // Admin sees everything else (client tabs + public enabled tabs)
        if (isAdmin) {
            if (link.clientOnly) return true;
            if (link.public && (!enabledTabs.includes(link.id) && !link.isExternal)) return false;
            return true;
        }

        // Client sees: clientOnly tabs, adminOrClient tabs, and enabled public tabs
        if (isClient) {
            if (link.clientOnly || link.adminOrClient) return true;
            if (link.public && enabledTabs.includes(link.id)) return true;
            return false;
        }

        // Regular guest: only public enabled tabs
        if (link.clientOnly || link.adminOrClient) return false;
        if (link.public && !enabledTabs.includes(link.id) && !link.isExternal) return false;

        return true;
    });

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (!isAuthenticated) return null;

    const activeClient = clients.find(c => c._id === clientId);

    return (
        <>
            {/* Desktop Navigation (Collapsible Sidebar) */}
            <nav
                className={`hidden md:flex flex-col shrink-0 mr-4 lg:mr-8 sticky top-0 self-start z-50 transition-all duration-300 ${isExpanded ? 'w-64' : 'w-20'}`}
            >
                <div className="flex flex-col gap-4 py-4 h-full">
                    {/* Toggle Button */}
                    <button
                        onClick={() => {
                            const nextState = !isExpanded;
                            setIsExpanded(nextState);
                            localStorage.setItem('navbarExpanded', nextState);
                        }}
                        className="self-end p-2 mb-2 rounded-full bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-colors"
                        title={isExpanded ? "Collapse" : "Expand"}
                    >
                        {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                    </button>

                    {isAdmin && (
                         <div className="relative mx-2 mb-4">
                            <button 
                                onClick={() => setShowSwitcher(!showSwitcher)}
                                className={`w-full p-2 rounded-xl border border-brand-black/5 flex items-center gap-2 overflow-hidden bg-brand-black text-white hover:bg-brand-black/90 transition-all ${isExpanded ? 'px-4' : 'justify-center'}`} 
                                title={`Active Portal: ${activeClient?.name || 'System'}`}
                            >
                                <div className="shrink-0 w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                {isExpanded && (
                                    <div className="flex items-center justify-between w-full min-w-0">
                                        <span className="text-[10px] font-bold uppercase tracking-widest truncate flex-1 text-left">
                                            {activeClient?.name || 'Switch Portal'}
                                        </span>
                                        <ChevronRight size={10} className={`shrink-0 ml-2 transition-transform ${showSwitcher ? 'rotate-90' : ''}`} />
                                    </div>
                                )}
                            </button>

                            <AnimatePresence>
                                {showSwitcher && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        className={`absolute z-50 bg-white/90 backdrop-blur-xl border border-brand-black/10 rounded-2xl shadow-2xl p-2 min-w-[200px] ${isExpanded ? 'left-0 right-0' : 'left-full ml-2 top-0'}`}
                                    >
                                        <h4 className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-black/40 border-b border-brand-black/5 mb-1">
                                            Switch Portal
                                        </h4>
                                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                            {clients.map(c => (
                                                <button
                                                    key={c._id}
                                                    onClick={() => {
                                                        switchClient(c._id);
                                                        setShowSwitcher(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex flex-col gap-0.5 ${clientId === c._id ? 'bg-brand-black/5 border-l-2 border-brand-black' : 'hover:bg-brand-black/5'}`}
                                                >
                                                    <span className="text-xs font-bold text-brand-black line-clamp-1">{c.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        {visibleLinks.map((link) => {
                            const Icon = link.icon;
                            const isActive = location.pathname === link.path;
                            return (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className={`relative group p-3 rounded-xl transition-all duration-200 flex items-center gap-4 overflow-hidden ${isActive ? 'bg-white/10 text-white shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                                    title={link.name}
                                >
                                    <div className="shrink-0">
                                        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                    </div>

                                    <AnimatePresence mode='wait' initial={false}>
                                        {isExpanded && (
                                            <motion.span
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                transition={{ duration: 0.2 }}
                                                className="font-display font-medium text-sm tracking-wide whitespace-nowrap"
                                            >
                                                {link.name}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>

                                    {isActive && (
                                        <motion.div
                                            layoutId="desktopActiveSync"
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Logout Button */}
                    {isAuthenticated && (
                        <button
                            onClick={handleLogout}
                            className="relative group p-3 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-950/20 transition-all duration-200 flex items-center gap-4 mt-auto"
                            title="Logout"
                        >
                            <div className="shrink-0">
                                <LogOut size={22} />
                            </div>
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="font-display font-medium text-sm tracking-wide"
                                    >
                                        Logout
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </button>
                    )}
                </div>
            </nav>

            {/* Mobile Navigation (Floating Glass Hub) */}
            <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-2 flex items-center justify-between overflow-x-auto gap-4 custom-scrollbar">
                    {visibleLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.path;

                        return (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 min-w-[3.5rem] h-14 ${isActive ? 'text-white' : 'text-white/40 hover:text-white'
                                    }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-white/10 shadow-sm rounded-xl"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10 flex flex-col items-center gap-1">
                                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                </span>
                            </Link>
                        );
                    })}
                    {/* Mobile Logout */}
                    {isAuthenticated && (
                        <button
                            onClick={handleLogout}
                            className="relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 min-w-[3.5rem] h-14 text-white/40 hover:text-red-400"
                        >
                            <span className="relative z-10 flex flex-col items-center gap-1">
                                <LogOut size={24} />
                            </span>
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};

export default Navbar;
