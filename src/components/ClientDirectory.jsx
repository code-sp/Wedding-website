import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import PageLayout from './PageLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Trash2, ExternalLink, CheckCircle, XCircle,
    Layout, Copy, Phone, Key, Link, Loader, LogOut, Users, BarChart2
} from 'lucide-react';

const ClientDirectory = () => {
    const { logout, isAdmin } = useAuth();
    const [clients, setClients] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [newClient, setNewClient] = useState({ id: '', name: '' });
    const [creating, setCreating] = useState(false);
    const [status, setStatus] = useState(null); // { type, message, token, clientId }
    const [copiedKey, setCopiedKey] = useState(null); // track what was just copied

    useEffect(() => {
        loadAll();
    }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [clientRes, statsRes] = await Promise.all([
                api.getClients(),
                api.getGlobalStats()
            ]);

            // getClients returns a raw array
            if (Array.isArray(clientRes)) {
                setClients(clientRes);
            } else if (clientRes?.clients) {
                setClients(clientRes.clients);
            }

            // getGlobalStats returns { portals, totalRSVPs, totalUsers }
            if (statsRes && typeof statsRes.portals !== 'undefined') {
                setStats(statsRes);
            } else if (statsRes?.stats) {
                setStats(statsRes.stats);
            }
        } catch (e) {
            console.error('Failed to load clients/stats:', e);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text, key) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 2000);
        });
    };

    const getPortalUrl = (clientId) => `${window.location.origin}/?c=${clientId}`;

    const handleCreate = async (e) => {
        e.preventDefault();
        const name = newClient.name.trim();
        if (!name) return;

        // Auto-generate a slug ID if the admin left it blank
        const id = newClient.id.trim() ||
            name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') +
            '_' + Math.random().toString(36).substring(2, 6);

        setCreating(true);
        setStatus(null);

        try {
            const res = await api.createClient(id, name);
            if (res?.success) {
                setStatus({
                    type: 'success',
                    message: 'Portal created successfully!',
                    token: res.ownerToken,
                    loginFragment: res.ownerLoginFragment,
                    clientId: res.client?._id || res.client?.id || id
                });
                setNewClient({ id: '', name: '' });
                loadAll();
            } else {
                setStatus({ type: 'error', message: res?.error || 'Failed to create portal.' });
            }
        } catch (e) {
            setStatus({ type: 'error', message: 'Server error. Please try again.' });
        } finally {
            setCreating(false);
        }
    };

    const handleIssueInvite = async (client) => {
        if (!client?.ownerId) {
            setStatus({ type: 'error', message: 'This portal does not have an organiser account.' });
            return;
        }
        try {
            const res = await api.createInvitation(client.ownerId, 72);
            if (res?.invitation?.token) {
                setStatus({
                    type: 'success',
                    message: `New organiser invitation created for ${client.name}.`,
                    token: res.invitation.token,
                    loginFragment: res.invitation.loginFragment,
                    clientId: client._id || client.id
                });
                return;
            }
            setStatus({ type: 'error', message: res?.error || 'Unable to issue invitation.' });
        } catch (error) {
            setStatus({ type: 'error', message: 'Unable to issue invitation.' });
        }
    };

    const handleDelete = async (client) => {
        const confirmed = window.confirm(
            `Are you sure you want to permanently delete "${client.name}"?\n\nThis will remove the portal and ALL associated data. This action cannot be undone.`
        );
        if (!confirmed) return;

        try {
            const res = await api.deleteClient(client._id || client.id);
            if (res?.success) {
                loadAll();
            }
        } catch (e) {
            console.error('Delete failed:', e);
        }
    };

    if (!isAdmin) {
        return (
            <PageLayout backgroundText="restricted">
                <div className="flex items-center justify-center h-full">
                    <p className="text-white/40 font-display text-2xl italic">Access Restricted</p>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout backgroundText="system">
            <div className="w-full h-full overflow-y-auto custom-scrollbar relative z-10 p-6 md:p-12">
                <div className="max-w-6xl mx-auto space-y-10">

                    {/* ── Header ── */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <span className="inline-block py-1.5 px-4 rounded-full bg-white/10 border border-white/15 text-white/50 text-[10px] font-bold tracking-[0.3em] uppercase mb-4 shadow-sm backdrop-blur-md">
                                Global Administrator
                            </span>
                            <h2 className="font-display font-bold text-4xl lg:text-5xl text-white tracking-tighter">
                                Master <span className="text-white/50 italic font-light">Directory</span>
                            </h2>
                            <p className="text-white/40 text-sm mt-2 max-w-lg">
                                Manage all wedding portals, share client tokens, and track activity.
                            </p>
                        </div>
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                        >
                            <LogOut size={14} />
                            Logout
                        </button>
                    </div>

                    {/* ── Stats Row ── */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Total Portals', value: stats.portals ?? clients.length, icon: Layout },
                            { label: 'Total Users', value: stats.totalUsers ?? 0, icon: Users },
                            { label: 'Total RSVPs', value: stats.totalRSVPs ?? 0, icon: BarChart2 },
                        ].map(({ label, value, icon: Icon }) => (
                            <div key={label} className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-6 text-center">
                                <Icon size={18} className="text-white/30 mx-auto mb-2" />
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">{label}</h4>
                                <p className="text-3xl font-display font-bold text-white">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* ── Main Grid: Create Form + Client List ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                        {/* Create Portal Form */}
                        <div className="lg:col-span-1 space-y-4">
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-xl">
                                <h3 className="font-display font-bold text-xl text-white flex items-center gap-3 mb-6">
                                    <Plus size={20} className="text-white/50" />
                                    Create Portal
                                </h3>
                                <form onSubmit={handleCreate} className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 ml-1">
                                            Portal ID / Slug <span className="normal-case text-white/20">(optional, auto-generated)</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. priya_rahul_2025"
                                            className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white font-medium outline-none focus:border-white/40 transition-all placeholder-white/20 text-sm"
                                            value={newClient.id}
                                            onChange={e => setNewClient({ ...newClient, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 ml-1">
                                            Wedding / Client Name <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Priya & Rahul's Wedding"
                                            className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white font-medium outline-none focus:border-white/40 transition-all placeholder-white/20 text-sm"
                                            value={newClient.name}
                                            onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!newClient.name.trim() || creating}
                                        className="w-full py-3.5 bg-white text-black rounded-xl font-bold text-sm hover:bg-white/90 active:scale-[0.98] transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {creating ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
                                        {creating ? 'Creating…' : 'Generate Portal'}
                                    </button>
                                </form>

                                {/* Status / Success Banner */}
                                <AnimatePresence>
                                    {status && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            className={`mt-5 p-4 rounded-2xl border text-sm ${
                                                status.type === 'success'
                                                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                                                    : 'bg-red-500/10 border-red-500/25 text-red-300'
                                            }`}
                                        >
                                            <p className="font-bold flex items-center gap-2 mb-3">
                                                {status.type === 'success'
                                                    ? <CheckCircle size={15} />
                                                    : <XCircle size={15} />
                                                }
                                                {status.message}
                                            </p>

                                            {status.type === 'success' && status.token && (
                                                <div className="space-y-3 pt-3 border-t border-emerald-500/20">
                                                    {/* Token */}
                                                    <div>
                                                        <p className="text-[9px] uppercase tracking-widest text-emerald-400/60 font-bold mb-1.5">Single-use Organiser Invitation</p>
                                                        <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
                                                            <Key size={11} className="text-emerald-400/50 shrink-0" />
                                                            <code className="flex-1 font-mono text-xs font-bold tracking-wider text-emerald-200 truncate">{status.token}</code>
                                                            <button
                                                                onClick={() => copyToClipboard(status.token, 'new-token')}
                                                                className="p-1 rounded hover:bg-white/10 transition-colors shrink-0"
                                                                title="Copy token"
                                                            >
                                                                {copiedKey === 'new-token'
                                                                    ? <CheckCircle size={12} className="text-emerald-400" />
                                                                    : <Copy size={12} className="text-emerald-400/60" />
                                                                }
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {/* Portal URL */}
                                                    <div>
                                                        <p className="text-[9px] uppercase tracking-widest text-emerald-400/60 font-bold mb-1.5">Portal URL</p>
                                                        <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
                                                            <Link size={11} className="text-emerald-400/50 shrink-0" />
                                                            <code className="flex-1 font-mono text-[9px] text-emerald-200 truncate">{getPortalUrl(status.clientId)}</code>
                                                            <button
                                                                onClick={() => copyToClipboard(getPortalUrl(status.clientId), 'new-url')}
                                                                className="p-1 rounded hover:bg-white/10 transition-colors shrink-0"
                                                                title="Copy URL"
                                                            >
                                                                {copiedKey === 'new-url'
                                                                    ? <CheckCircle size={12} className="text-emerald-400" />
                                                                    : <Copy size={12} className="text-emerald-400/60" />
                                                                }
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p className="text-[9px] text-emerald-400/50 leading-relaxed">
                                                        Share this invitation once. It expires and cannot be reused after successful sign-in.
                                                    </p>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => setStatus(null)}
                                                className="mt-3 text-[10px] opacity-50 hover:opacity-80 transition-opacity underline"
                                            >
                                                Dismiss
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Active Portals List */}
                        <div className="lg:col-span-2">
                            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl shadow-xl overflow-hidden">
                                <div className="px-7 py-5 border-b border-white/10 flex items-center gap-3">
                                    <Layout size={18} className="text-white/40" />
                                    <h3 className="font-display font-bold text-lg text-white">Active Portals</h3>
                                    <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-white/30 bg-white/10 px-3 py-1 rounded-full">
                                        {clients.length} {clients.length === 1 ? 'Portal' : 'Portals'}
                                    </span>
                                </div>

                                <div className="divide-y divide-white/5 max-h-[620px] overflow-y-auto custom-scrollbar">
                                    {loading ? (
                                        <div className="p-12 flex justify-center">
                                            <Loader size={24} className="animate-spin text-white/30" />
                                        </div>
                                    ) : clients.length === 0 ? (
                                        <div className="p-12 text-center text-white/30 italic font-display text-xl">
                                            No portals yet. Create one!
                                        </div>
                                    ) : (
                                        clients.map((client, idx) => {
                                            const clientId = client._id || client.id;
                                            const portalUrl = getPortalUrl(clientId);
                                            return (
                                                <motion.div
                                                    key={clientId}
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.04 }}
                                                    className="p-5 hover:bg-white/5 transition-all group"
                                                >
                                                    {/* Top row: Name + actions */}
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="min-w-0">
                                                            <h4 className="font-display font-bold text-lg text-white truncate">
                                                                {client.name}
                                                            </h4>
                                                            <p className="text-white/30 font-mono text-[10px] mt-0.5 uppercase tracking-wider">
                                                                {clientId}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <a
                                                                href={portalUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/60 hover:text-white transition-all"
                                                                title="Open Portal"
                                                            >
                                                                <ExternalLink size={14} />
                                                            </a>
                                                            <button
                                                                onClick={() => handleDelete(client)}
                                                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-full transition-all"
                                                                title="Delete Portal"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Detail chips */}
                                                    <div className="mt-3 flex flex-wrap gap-2">

                                                        {/* Phone */}
                                                        {client.contactDetail && (
                                                            <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5 text-white/60 text-[11px]">
                                                                <Phone size={10} className="text-white/40" />
                                                                <span className="font-medium">{client.contactDetail}</span>
                                                            </div>
                                                        )}

                                                        {/* Status badge */}
                                                        <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium ${
                                                            client.isRegistered
                                                                ? 'bg-emerald-500/15 text-emerald-400'
                                                                : 'bg-amber-500/15 text-amber-400'
                                                        }`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${client.isRegistered ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                                            {client.isRegistered ? 'Registered' : 'Pending Setup'}
                                                        </div>
                                                    </div>

                                                    {/* Credential state — secrets are never returned in list responses */}
                                                    <div className="mt-3 flex items-center gap-2 bg-black/20 rounded-xl px-3 py-2.5">
                                                        <Key size={11} className="text-white/30 shrink-0" />
                                                        <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold mr-1 shrink-0">Credential</span>
                                                        <span className="flex-1 text-[10px] text-white/45 truncate">
                                                            {client.hasLegacyCredential ? 'Legacy credential retires on next login' : 'Secret not stored'}
                                                        </span>
                                                        {client.ownerId && (
                                                            <button
                                                                onClick={() => handleIssueInvite(client)}
                                                                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[9px] font-bold uppercase tracking-wider text-white/60 hover:text-white transition-colors shrink-0"
                                                                title="Issue a new single-use organiser invitation"
                                                            >
                                                                Issue Invite
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Portal URL row */}
                                                    <div className="mt-2 flex items-center gap-2 bg-black/10 rounded-xl px-3 py-2">
                                                        <Link size={10} className="text-white/25 shrink-0" />
                                                        <span className="text-[9px] uppercase tracking-widest text-white/25 font-bold mr-1 shrink-0">URL</span>
                                                        <code className="flex-1 font-mono text-[10px] text-white/40 truncate">{portalUrl}</code>
                                                        <button
                                                            onClick={() => copyToClipboard(portalUrl, `url-${clientId}`)}
                                                            className="p-1 rounded hover:bg-white/10 transition-colors shrink-0"
                                                            title="Copy URL"
                                                        >
                                                            {copiedKey === `url-${clientId}`
                                                                ? <CheckCircle size={12} className="text-emerald-400" />
                                                                : <Copy size={12} className="text-white/25" />
                                                            }
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

export default ClientDirectory;
