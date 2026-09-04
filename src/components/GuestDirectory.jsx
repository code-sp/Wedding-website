import { useImageContext } from '../context/ImageContext';
import { useState } from 'react';
import PageLayout from './PageLayout';
import EditRSVPModal from './EditRSVPModal';
import { api } from '../utils/api';
import { Plus, Users, RefreshCw, Copy, Edit, X, Key, Share2 } from 'lucide-react';
import DeleteButton from './DeleteButton';
import { useAuth } from '../context/AuthContext';
import { useGuestList } from '../hooks/useGuestList';
import StandardButton from './common/StandardButton';

const GuestDirectory = () => {
    const { deleteRSVP, updateRSVP, settings } = useImageContext();
    const { clientId, isAdmin, isClient } = useAuth();
    const { 
        guests, 
        loading, 
        searchTerm, 
        setSearchTerm, 
        sortConfig, 
        requestSort, 
        refresh,
        stats 
    } = useGuestList(clientId);

    // UI State
    const [editingDetailsRSVP, setEditingDetailsRSVP] = useState(null);
    const [editingGuest, setEditingGuest] = useState(null); 
    const [newGuestName, setNewGuestName] = useState('');
    const [copied, setCopied] = useState(null);
    const [issuedInvite, setIssuedInvite] = useState(null);
    const [inviteError, setInviteError] = useState('');

    // --- ACTIONS ---
    const handleCopy = async (text, key = text) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(key);
            setTimeout(() => setCopied(null), 2000);
        } catch (error) {
            console.error('Clipboard write failed', error);
        }
    };

    const guestAppOrigin = () => {
        const configured = import.meta.env.VITE_GUEST_APP_ORIGIN;
        if (configured) return configured.replace(/\/$/, '');
        if (window.location.port === '5173') {
            return `${window.location.protocol}//${window.location.hostname}:3001`;
        }
        return window.location.origin;
    };

    const handleIssueInvitation = async (guest) => {
        setInviteError('');
        try {
            let response;
            if (guest.linkedUser?.id) {
                response = await api.createInvitation(guest.linkedUser.id, 72);
            } else {
                response = await api.createUser({
                    role: 'user',
                    name: guest.name,
                    clientId,
                    guestId: guest.id,
                    expiresInHours: 72
                });
            }

            const invitation = response?.invitation || response?.user?._invitation;
            if (!invitation?.token || !invitation?.loginFragment) {
                throw new Error(response?.error || 'Unable to issue invitation');
            }

            setIssuedInvite({
                guestName: guest.name,
                token: invitation.token,
                expiresAt: invitation.expiresAt,
                url: `${guestAppOrigin()}${invitation.loginFragment}`
            });
            await refresh();
        } catch (error) {
            setInviteError(error instanceof Error ? error.message : 'Unable to issue invitation');
        }
    };

    const handleAddGuest = async (e) => {
        e.preventDefault();
        if (!newGuestName.trim()) return;
        await api.addGuest(newGuestName.trim(), clientId);
        setNewGuestName('');
        refresh();
    };

    const handleDetailsUpdate = (updatedData) => {
        if (editingDetailsRSVP) {
            updateRSVP(editingDetailsRSVP.id, updatedData);
            setEditingDetailsRSVP(null);
            refresh();
        }
    };

    const handleGuestUpdate = async (e) => {
        e.preventDefault();
        if (!editingGuest || !editingGuest.name.trim()) return;
        await api.updateGuest(editingGuest.id, editingGuest.name.trim());
        setEditingGuest(null);
        refresh();
    };

    const executeDelete = async (id, type) => {
        try {
            if (type === 'rsvp') {
                await deleteRSVP(id);
            } else if (type === 'guest') {
                await api.deleteGuest(id);
            } else if (type === 'token_and_guest') {
                const { userId, guestId } = id;
                if (userId) {
                    const res = await api.deleteUser(userId);
                    if (!res.success) console.error('Failed to delete user', res);
                }
                if (guestId) {
                    const guestRes = await api.deleteGuest(guestId);
                    if (!guestRes.success && guestRes.error !== 'Guest not found') {
                        console.error('Failed to delete guest', guestRes);
                    }
                }
            }
        } catch (error) {
            console.error("Delete operation failed:", error);
        } finally {
            refresh();
        }
    };

    const getRoomName = (id) => {
        if (!id) return '-';
        const room = (settings?.rooms || []).find(r => r.id === parseInt(id));
        return room ? room.name : 'Unknown';
    };

    const getSortIndicator = (name) => {
        if (sortConfig.key !== name) return <span className="text-brand-black/20">↕</span>;
        return sortConfig.direction === 'ascending' ? <span>↑</span> : <span>↓</span>;
    };

    return (
        <PageLayout backgroundText="Guest">
            <div className="relative z-10 container mx-auto px-2 py-4 md:py-6 md:px-6 h-full flex flex-col">
                <div className="flex flex-col lg:flex-row justify-between items-center lg:items-end gap-6 mb-6 w-full max-w-7xl mx-auto">
                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                        <span className="inline-block py-1 px-4 rounded-full bg-white/50 backdrop-blur-md border border-white/80 text-brand-black/60 text-[10px] font-bold tracking-widest uppercase mb-6 shadow-sm">
                            Guest Management ({stats.active} RSVPs / {stats.total} Total)
                        </span>
                        <h2 className="font-display font-bold text-5xl md:text-6xl text-brand-black leading-[1.05] tracking-tight">
                            Guest
                            <span className="block text-brand-accent italic font-light mt-1">Directory</span>
                        </h2>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center">
                        <div className="relative w-full md:w-64">
                            <input
                                type="text"
                                placeholder="Search guest list..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-5 py-3 rounded-full border border-white/60 bg-white/50 backdrop-blur-md focus:outline-none focus:border-brand-black/40 font-medium text-sm pl-12 shadow-sm text-brand-black placeholder:text-brand-black/40 transition-all"
                            />
                            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-brand-black/40">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            </div>
                        </div>

                        <form onSubmit={handleAddGuest} className="bg-white/50 backdrop-blur-md border border-white/60 p-1.5 rounded-full flex gap-2 shadow-sm w-full md:w-auto">
                            <input
                                type="text"
                                placeholder="Add new guest..."
                                className="px-5 py-2 rounded-full bg-transparent focus:outline-none focus:bg-white/40 font-medium text-sm w-full md:w-48 text-brand-black placeholder:text-brand-black/40 transition-colors"
                                value={newGuestName}
                                onChange={(e) => setNewGuestName(e.target.value)}
                            />
                            <StandardButton
                                type="submit"
                                disabled={!newGuestName.trim()}
                                size="sm"
                                icon={Plus}
                                className="!p-2.5 rounded-full"
                                title="Add Guest"
                            />
                            <button type="button" onClick={refresh} className="p-2.5 text-brand-black/60 hover:bg-white/50 rounded-full transition-colors flex items-center justify-center shrink-0" title="Refresh">
                                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                            </button>
                        </form>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto flex flex-col flex-1 min-h-0 w-full animate-in fade-in duration-300 bg-white/20 backdrop-blur-xl rounded-[2rem] border border-white/50 shadow-xl overflow-hidden">
                    <div className="overflow-auto h-full w-full">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-20">
                                <tr className="text-brand-black/40 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-brand-black/10">
                                    <th className="p-5 font-bold cursor-pointer hover:bg-white/50 transition-colors bg-white/90 backdrop-blur-md sticky top-0" onClick={() => requestSort('name')}>
                                        Name {getSortIndicator('name')}
                                    </th>
                                    <th className="p-5 font-bold bg-white/90 backdrop-blur-md sticky top-0">Code</th>
                                    <th className="p-5 font-bold text-center cursor-pointer hover:bg-white/50 transition-colors min-w-[140px] bg-white/90 backdrop-blur-md sticky top-0" onClick={() => requestSort('status')}>
                                        Status {getSortIndicator('status')}
                                    </th>
                                    <th className="p-5 font-bold bg-white/90 backdrop-blur-md sticky top-0">Contact</th>
                                    <th className="p-5 font-bold text-center cursor-pointer hover:bg-white/50 transition-colors bg-white/90 backdrop-blur-md sticky top-0" onClick={() => requestSort('guests')}>
                                        Count {getSortIndicator('guests')}
                                    </th>
                                    <th className="p-5 font-bold min-w-[150px] bg-white/90 backdrop-blur-md sticky top-0">Member Details</th>
                                    <th className="p-5 font-bold cursor-pointer hover:bg-white/50 transition-colors bg-white/90 backdrop-blur-md sticky top-0" onClick={() => requestSort('accommodation')}>
                                        Accom. {getSortIndicator('accommodation')}
                                    </th>
                                    <th className="p-5 font-bold bg-white/90 backdrop-blur-md sticky top-0">Seats</th>
                                    <th className="p-5 font-bold text-center bg-white/90 backdrop-blur-md sticky top-0">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="font-display text-brand-black text-sm">
                                {guests.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="p-12 text-center text-brand-black/40 font-medium italic">
                                            No guests found.
                                        </td>
                                    </tr>
                                ) : (
                                    guests.map((guest) => {
                                        const rsvp = guest.rsvp || {};
                                        return (
                                            <tr key={guest.id} className="border-b border-brand-black/5 hover:bg-white/40 transition-colors group">
                                                <td className="p-5 font-display text-lg font-bold text-brand-black whitespace-nowrap max-w-[200px] truncate">
                                                    {guest.name}
                                                </td>

                                                <td className="p-5">
                                                    {guest.status === 'Active' ? (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg">
                                                            RSVP received
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleIssueInvitation(guest)}
                                                            className="text-[10px] bg-white/50 text-brand-black/60 px-2.5 py-1.5 rounded-lg border border-white/60 hover:bg-white hover:text-brand-black font-bold uppercase tracking-wider transition-all shadow-sm whitespace-nowrap"
                                                            title={guest.linkedUser ? 'Issue a fresh single-use invitation' : 'Create guest account and issue invitation'}
                                                        >
                                                            {guest.linkedUser ? 'Reissue Invite' : 'Issue Invite'}
                                                        </button>
                                                    )}
                                                </td>

                                                <td className="p-5 text-center align-middle whitespace-nowrap">
                                                    <div className="flex flex-col items-center justify-center gap-1.5 min-h-[44px]">
                                                        <span className={`px-3 py-1.5 rounded-full text-[9px] uppercase font-bold tracking-[0.2em] border flex items-center gap-1.5 shadow-sm whitespace-nowrap transition-all 
                                                            ${guest.status === 'Active' ? 'bg-green-500/10 text-green-700 border-green-500/20' :
                                                                guest.status === 'Invited' ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/20' :
                                                                    'bg-brand-black/5 text-brand-black/40 border-brand-black/10'
                                                            } `}>
                                                            {guest.status === 'Invited' && <Key size={10} className="mb-[1px]" />}
                                                            {guest.status}
                                                        </span>
                                                        {guest.status === 'Active' && rsvp.attending === 'no' && (
                                                            <span className="block text-[9px] text-red-500 font-bold uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded border border-red-100">Regret</span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="p-5 text-xs text-brand-black/70 max-w-[150px] truncate">
                                                    {rsvp.email && <div className="truncate" title={rsvp.email}>{rsvp.email}</div>}
                                                    {rsvp.mobile && <div>{rsvp.mobile}</div>}
                                                    {!rsvp.email && !rsvp.mobile && <span className="text-brand-black/20 font-bold">-</span>}
                                                </td>

                                                <td className="p-5 text-center font-bold">
                                                    {guest.status === 'Active' && rsvp.attending === 'yes' ? rsvp.guests : <span className="text-brand-black/20 font-normal">-</span>}
                                                </td>

                                                <td className="p-5 text-xs">
                                                    {rsvp.guestDetails && rsvp.guestDetails.length > 0 ? (
                                                        <div className="space-y-1">
                                                            {rsvp.guestDetails.map((g, i) => (
                                                                <div key={i} className="text-brand-black/70">
                                                                    <span className="font-bold mr-1 text-brand-black/40">#{i + 1}:</span>
                                                                    {[g.name, g.age, g.gender].filter(Boolean).join(', ')}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : <span className="text-brand-black/20 font-bold">-</span>}
                                                </td>

                                                <td className="p-5 text-xs font-medium">
                                                    {guest.status === 'Active' ? getRoomName(rsvp.accommodation) : <span className="text-brand-black/20 font-bold">-</span>}
                                                </td>

                                                <td className="p-5 text-xs font-mono text-brand-black/70 max-w-[120px] truncate">
                                                    {rsvp.seatNumbers && rsvp.seatNumbers.length > 0
                                                        ? rsvp.seatNumbers.map(s => s.split('-').pop()).join(', ')
                                                        : <span className="text-brand-black/20 font-bold font-sans">-</span>
                                                    }
                                                </td>

                                                <td className="p-5 text-center">
                                                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                        {guest.status === 'Active' ? (
                                                            <>
                                                                {rsvp.attending === 'yes' && (
                                                                    <button onClick={() => setEditingDetailsRSVP(rsvp)} className="p-2 text-brand-black/50 hover:text-brand-black hover:bg-white/60 rounded-full transition-all hover:scale-110" title="Edit Booking"><Edit size={16} /></button>
                                                                )}
                                                                <DeleteButton onDelete={() => executeDelete(rsvp.id, 'rsvp')} size={16} className="p-2 text-brand-black/50 hover:text-brand-black hover:bg-white/60 rounded-full transition-all hover:scale-110" title="Delete RSVP" />
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => setEditingGuest({ id: guest.id, name: guest.name })} className="p-2 text-brand-black/50 hover:text-brand-black hover:bg-white/60 rounded-full transition-all hover:scale-110" title="Edit Guest Name"><Edit size={16} /></button>
                                                                <DeleteButton onDelete={() => executeDelete(guest.status === 'Invited' ? { userId: guest.linkedUser?.id, guestId: guest.id } : guest.id, guest.status === 'Invited' ? 'token_and_guest' : 'guest')} size={16} className="p-2 text-brand-black/50 hover:text-brand-black hover:bg-white/60 rounded-full transition-all hover:scale-110" title="Remove Guest" />
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {issuedInvite && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-brand-black/30 backdrop-blur-md">
                    <div className="bg-white/95 rounded-[2rem] p-8 max-w-lg w-full shadow-2xl border border-white space-y-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent mb-2">Single-use invitation</p>
                                <h3 className="text-2xl font-display font-bold text-brand-black">{issuedInvite.guestName}</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIssuedInvite(null)}
                                className="p-2 rounded-full bg-brand-black/5 text-brand-black/50 hover:text-brand-black hover:bg-brand-black/10"
                                aria-label="Close invitation"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <p className="text-sm text-brand-black/60 leading-relaxed">
                            This link is shown only now. It expires and becomes unusable after the guest signs in successfully.
                        </p>
                        <div className="rounded-2xl bg-brand-black/5 border border-brand-black/10 p-4 break-all text-xs font-mono text-brand-black/70">
                            {issuedInvite.url}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={() => handleCopy(issuedInvite.url, 'invite-url')}
                                className="flex-1 py-3 rounded-full bg-brand-black text-white font-bold text-xs uppercase tracking-widest"
                            >
                                {copied === 'invite-url' ? 'Copied' : 'Copy Invitation Link'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const text = `Hi ${issuedInvite.guestName}! We'd love to have you at our wedding. Please RSVP here: ${issuedInvite.url}`;
                                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
                                }}
                                className="flex-1 py-3 rounded-full border border-brand-black/15 text-brand-black font-bold text-xs uppercase tracking-widest"
                            >
                                Share on WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {inviteError && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[130] max-w-md w-[calc(100%-2rem)] bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 shadow-xl text-sm font-semibold" role="alert">
                    {inviteError}
                </div>
            )}

            <EditRSVPModal
                isOpen={!!editingDetailsRSVP}
                onClose={() => setEditingDetailsRSVP(null)}
                rsvpData={editingDetailsRSVP}
                onSave={handleDetailsUpdate}
                isAdmin={isAdmin || isClient}
            />

            {editingGuest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/20 backdrop-blur-md animate-in fade-in zoom-in duration-200">
                    <div className="bg-white/80 backdrop-blur-3xl rounded-[2rem] p-8 max-w-sm w-full shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] space-y-6 border border-white/60">
                        <div className="flex justify-between items-center">
                            <h3 className="text-2xl font-display font-bold text-brand-black">Rename Guest</h3>
                            <button onClick={() => setEditingGuest(null)} className="text-brand-black/40 hover:text-brand-black transition-colors bg-white/50 rounded-full p-2 hover:bg-white shadow-sm"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleGuestUpdate} className="space-y-6">
                            <input type="text" className="w-full px-4 py-3 rounded-xl border border-white/60 bg-white/40 focus:bg-white/80 focus:border-brand-black outline-none transition-all text-brand-black font-medium text-sm" value={editingGuest.name} onChange={(e) => setEditingGuest({ ...editingGuest, name: e.target.value })} autoFocus />
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setEditingGuest(null)} className="flex-1 py-3 rounded-full border border-white/60 text-brand-black/60 hover:text-brand-black hover:bg-white/40 transition-all font-bold text-xs uppercase tracking-widest">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-brand-black text-white rounded-full hover:bg-brand-dark transition-all font-bold text-xs uppercase tracking-widest shadow-lg hover:shadow-xl hover:-translate-y-0.5">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </PageLayout >
    );
};

export default GuestDirectory;
