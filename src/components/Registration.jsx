import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import TableBooking from './TableBooking';
import RoomAllotment from './RoomAllotment';
import PageLayout from './PageLayout';
import Toast from './Toast';
import { useImageContext } from '../context/ImageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import Card from './common/Card';
import EditRSVPModal from './EditRSVPModal';
import StandardButton from './common/StandardButton';
import { Copy, Check, ChevronLeft, ChevronRight, Heart, ArrowRight, Frown } from 'lucide-react';

const Registration = () => {
    const { addRSVP, updateRSVP, rsvpSubmissions } = useImageContext();
    const { completeRegistration, loginWithCode, user, isRegistered, isAdmin, isClient, checkTokenStatus, logout, clientId } = useAuth();
    const navigate = useNavigate();
    
    const canEdit = isAdmin || isClient;
    const location = useLocation();
    
    // Check if we are in Client Registration flow
    const isClientRegFlow = location.state?.clientReg || (user?.role === 'client' && !user?.isRegistered && user?.access_code?.startsWith('REQ'));
    const tempUser = location.state?.tempUser || (isClientRegFlow ? user : null);

    const [step, setStep] = useState(1);
    const [showDetails, setShowDetails] = useState(false);
    const [showSeatingModal, setShowSeatingModal] = useState(false);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [formData, setFormData] = useState({
        guestDetails: [{ name: '', age: '', gender: '' }],
        accessToken: '',
        accommodation: '',
        name: tempUser?.name || user?.name || '', email: '', mobile: '', attending: 'yes', guests: 1
    });
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState({ message: null, type: 'success' });
    const [newAccessCode, setNewAccessCode] = useState(null);
    const [copied, setCopied] = useState(false);
    const [step2Errors, setStep2Errors] = useState({});
    const [seatingError, setSeatingError] = useState(false);

    const allOccupiedSeats = rsvpSubmissions.reduce((acc, submission) => {
        if (submission.seatNumbers && Array.isArray(submission.seatNumbers)) {
            let isCurrentUser = false;
            if (isRegistered) {
                if (user?.rsvpData?.id && submission.id === user.rsvpData.id) isCurrentUser = true;
                else if (user?.rsvpData?.email && submission.email === user.rsvpData.email) isCurrentUser = true;
                else if (formData.email && submission.email === formData.email) isCurrentUser = true;
            }
            if (isCurrentUser) return acc;
            return [...acc, ...submission.seatNumbers];
        }
        return acc;
    }, []);

    useEffect(() => {
        if (isRegistered && user?.rsvpData && !isAdmin) {
            setFormData(user.rsvpData);
            if (user.rsvpData.seatNumbers) setSelectedSeats(user.rsvpData.seatNumbers);
        }
    }, [isRegistered, user, isAdmin]);

    const validateStep1 = () => {
        const newErrors = {};
        const emailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/;
        
        if (!formData.name?.trim()) newErrors.name = "Required";
        
        const allowedDomains = [
            'gmail.com', 'yahoo.com', 'yahoo.co.in', 'outlook.com', 
            'hotmail.com', 'rediffmail.com', 'icloud.com', 'zoho.com', 'live.com'
        ];
        const match = formData.email?.toLowerCase().match(emailRegex);
        const domain = match ? match[1] : '';
        const isAllowedEmail = allowedDomains.includes(domain);
        
        if (!emailRegex.test(formData.email) || !isAllowedEmail) newErrors.email = "Invalid email";
        
        if (formData.attending === 'yes') {
            const isRepeating = /^(.)\1{9}$/.test(formData.mobile);
            const isSequence = /^(0123456789|1234567890|9876543210)$/.test(formData.mobile);
            if (!/^[6-9]\d{9}$/.test(formData.mobile) || isRepeating || isSequence) newErrors.mobile = "Invalid number";
        }

        if (isAdmin) {
            if (!formData.accessToken?.trim()) newErrors.accessToken = "Required";
            else {
                const status = checkTokenStatus(formData.accessToken.trim());
                if (!status.valid) newErrors.accessToken = status.message;
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setTimeout(() => setErrors({}), 1000);
            return false;
        }
        return true;
    };

    const handleGuestCountChange = (count) => {
        let val = parseInt(count);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 10) val = 10;
        const currentDetails = [...formData.guestDetails];
        while (currentDetails.length > val) currentDetails.pop();
        while (currentDetails.length < val) currentDetails.push({ name: '', age: '', gender: '' });
        setFormData({ ...formData, guests: val, guestDetails: currentDetails });
    };

    const validateStep2 = () => {
        if (selectedSeats.length !== formData.guests) {
            setSeatingError(true);
            setTimeout(() => setSeatingError(false), 1000);
            return false;
        }

        if (showDetails) {
            const newErrors = {};
            let hasError = false;
            formData.guestDetails.forEach((guest, index) => {
                if (!guest.name?.trim()) { newErrors[`${index}-name`] = true; hasError = true; }
                if (!guest.age) { newErrors[`${index}-age`] = true; hasError = true; }
                if (!guest.gender) { newErrors[`${index}-gender`] = true; hasError = true; }
            });

            if (hasError) {
                setStep2Errors(newErrors);
                setTimeout(() => setStep2Errors({}), 1000);
                return false;
            }
        }
        return true;
    };

    const handleGuestDetailChange = (index, field, value) => {
        const updatedDetails = [...formData.guestDetails];
        updatedDetails[index] = { ...updatedDetails[index], [field]: value };
        setFormData({ ...formData, guestDetails: updatedDetails });
    };

    const handleFinalSubmit = async () => {
        let finalData = { ...formData };
        let existingID = tempUser?.id || tempUser?._id || user?.id || user?._id;
        let generatedAccessCode = newAccessCode;

        console.log('[REGISTRATION] Initiating final submission for:', formData.name);

        if (isClientRegFlow && tempUser) {
            console.log('[REGISTRATION] Processing client registration flow...');
            try {
                const res = await api.completeClientRegistration(existingID, formData.name, finalData);
                if (res.success) {
                    generatedAccessCode = res.token;
                    console.log('[REGISTRATION] Client token generated successfully.');
                    setNewAccessCode(generatedAccessCode);
                    // Automatically log in the client with their new permanent code
                    await loginWithCode(generatedAccessCode, tempUser.clientId);
                } else {
                    console.error('[REGISTRATION] ERROR: Client registration failed', res.error);
                    setToast({ message: res.error || 'Client Registration failed', type: 'error' });
                    return;
                }
            } catch (e) {
                console.error('[REGISTRATION] CRITICAL ERROR during client registration', e);
                setToast({ message: 'Server error during client registration', type: 'error' });
                return;
            }
        } else if (!existingID && !isAdmin) {
            console.log('[REGISTRATION] No existing user ID, creating new guest profile...');
            try {
                const userRes = await api.createUser({
                    role: 'user',
                    name: formData.name,
                    clientId: clientId
                });

                if (userRes && userRes.success) {
                    existingID = userRes.user._id || userRes.user.id;
                    generatedAccessCode = userRes.user.access_code;
                    console.log('[REGISTRATION] Guest profile created. ID:', existingID);
                    setNewAccessCode(generatedAccessCode);
                } else {
                    console.error('[REGISTRATION] ERROR: Failed to create user', userRes?.error);
                    setToast({ message: 'Failed to create user. Please try again.', type: 'error' });
                    return;
                }
            } catch (e) {
                console.error('[REGISTRATION] CRITICAL ERROR during guest creation', e);
                setToast({ message: 'Network error. Please try again.', type: 'error' });
                return;
            }
        }

        if (!isClientRegFlow && existingID && !isAdmin) {
            if (generatedAccessCode) finalData.accessToken = generatedAccessCode;
            const existingRSVP = rsvpSubmissions.find(r => r.userId === existingID);

            if (existingRSVP) {
                console.log('[REGISTRATION] Updating existing RSVP for userId:', existingID);
                await updateRSVP(existingRSVP.id, { ...finalData, userId: existingID, timestamp: new Date().toISOString() });
            } else {
                console.log('[REGISTRATION] Submitting new RSVP for userId:', existingID);
                const addRes = await addRSVP(finalData, existingID);
                if (addRes && addRes._newAccessCode) {
                    generatedAccessCode = addRes._newAccessCode;
                }
            }
        } else if (!isClientRegFlow && isAdmin) {
            console.log('[REGISTRATION] Admin manual entry. Creating anonymous RSVP...');
            await addRSVP(finalData, null);
        }

        const isNewRegistrationFlow = isClientRegFlow || generatedAccessCode || (existingID && !isRegistered && !isAdmin);
        const finalAccessCode = generatedAccessCode || user?.access_code || user?.accessCode || newAccessCode;

        if (isNewRegistrationFlow) {
            console.log('[REGISTRATION] Moving to Success Step (Code Display).');
            if (finalAccessCode) setNewAccessCode(finalAccessCode);
            if (existingID && !isRegistered && !isClientRegFlow) {
                completeRegistration(finalData);
            }
            setStep(4);
        } else {
            console.log('[REGISTRATION] Persistence successful. Redirecting to home...');
            setToast({ message: isClientRegFlow ? 'Registration complete!' : (isRegistered ? 'Booking updated!' : 'RSVP submitted!'), type: 'success' });
            setTimeout(() => {
                navigate('/');
            }, 2000);

            if (isAdmin) {
                setTimeout(() => {
                    setFormData({ name: '', email: '', mobile: '', attending: 'yes', guests: 1, guestDetails: [{ name: '', age: '', gender: '' }], accessToken: '', accommodation: '' });
                    setSelectedSeats([]);
                    setStep(1);
                    setToast({ message: null, type: 'success' });
                }, 2000);
            }
        }
    };

    const handleLoginRedirect = async () => {
        // Just navigate to home, the user is already set in AuthContext/SecureStorage
        navigate('/');
    };

    const copyCode = () => {
        if (newAccessCode) {
            navigator.clipboard.writeText(newAccessCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSelfEditSave = async (updatedFormData) => {
        try {
            const existingRSVP = user?.rsvpData;
            if (existingRSVP) {
                const finalData = {
                    ...existingRSVP,
                    ...updatedFormData,
                    timestamp: new Date().toISOString()
                };
                
                await updateRSVP(existingRSVP.id, finalData);
                completeRegistration(finalData); // Sync local auth session
                setToast({ message: 'RSVP updated successfully!', type: 'success' });
            }
        } catch (e) {
            console.error(e);
            setToast({ message: 'Failed to update. Please try again.', type: 'error' });
        }
    };

    if (isRegistered && !isAdmin && step !== 4) {
        return (
            <PageLayout backgroundText="celebrate">
                <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, message: null })} />
                <div className="relative z-10 w-full min-h-[calc(100vh-80px)] py-10 px-4 md:px-8 overflow-y-auto flex items-center justify-center">
                    <div className="w-full max-w-4xl py-12">
                        <EditRSVPModal 
                            isOpen={true} 
                            isModal={false} 
                            isAdmin={false} 
                            rsvpData={user.rsvpData} 
                            onSave={handleSelfEditSave}
                            occupiedSeats={allOccupiedSeats}
                        />
                    </div>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout backgroundText="celebrate">
            <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, message: null })} />
            <div className="relative z-10 w-full h-full flex flex-col md:flex-row overflow-hidden">
                <div className="relative z-10 w-full md:w-[40%] shrink-0 p-4 md:p-8 flex flex-col justify-between md:border-r border-white/40 overflow-y-auto overflow-x-hidden">
                    <div className="flex flex-col">
                        <div className="mb-10 lg:mb-14 mt-4 px-1 max-w-full overflow-hidden">
                            <span className="inline-block py-1 px-4 rounded-full bg-white/50 backdrop-blur-md border border-white/80 text-brand-black/60 text-xs font-bold tracking-widest uppercase mb-6 shadow-sm">
                                Register
                            </span>
                            <h2 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-brand-black mb-4 leading-[1.05] tracking-tight break-words">
                                {isClientRegFlow ? 'Client' : 'User'}
                                <span className="block text-brand-accent italic font-light mt-1">Registration</span>
                            </h2>
                            <p className="text-brand-black/60 font-medium text-sm sm:text-base md:text-lg leading-relaxed max-w-xs md:max-w-sm mt-6 break-words">
                                We can't wait to celebrate with you.
                            </p>
                        </div>

                        <div className="relative space-y-12 pl-2 mt-8">
                            <div className="absolute left-[23px] top-6 bottom-6 w-[2px] bg-white/30" />
                            
                            {[
                                { num: 1, label: "Guest Details" },
                                { num: 2, label: "Reserve Seat" },
                                { num: 3, label: "Accommodation" }
                            ].filter(s => s.num <= step)
                             .map((s, idx) => {
                                const isCurrent = step === s.num;
                                const isCompleted = step > s.num;
                                
                                return (
                                    <div key={s.num} className="flex items-center gap-6 group relative z-10">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${isCurrent ? 'bg-brand-black shadow-[0_0_20px_rgba(0,0,0,0.15)] scale-110' : isCompleted ? 'bg-white text-brand-black' : 'bg-white/20'}`}>
                                            {isCompleted ? (
                                                <Check size={20} className="text-brand-black" strokeWidth={3} />
                                            ) : (
                                                <div className={`w-2.5 h-2.5 rounded-full ${isCurrent ? 'bg-white animate-pulse' : 'bg-brand-black/20'}`} />
                                            )}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className={`font-display font-bold text-xl tracking-tight transition-colors duration-500 truncate ${isCurrent ? 'text-brand-black' : isCompleted ? 'text-brand-black/70' : 'text-brand-black/30'}`}>
                                                {s.label}
                                            </span>
                                            {isCurrent && (
                                                <span className="text-xs font-bold text-brand-accent uppercase tracking-widest mt-1 animate-in fade-in slide-in-from-left-2 truncate">
                                                    Current Progress
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                             })}
                        </div>
                    </div>
                </div>

                <div className="relative z-10 w-full md:w-[60%] shrink-0 p-4 md:p-8 flex flex-col h-[calc(100vh-120px)] md:h-auto overflow-y-auto no-scrollbar scroll-smooth">
                    <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto w-full">
                        {step === 1 && (
                            <form onSubmit={(e) => { e.preventDefault(); if (validateStep1()) { if (formData.attending === 'no') handleFinalSubmit(); else setStep(2); } }} className="space-y-8">
                                {canEdit && (
                                    <div className="space-y-2 bg-amber-500/10 p-6 rounded-2xl border border-amber-500/20">
                                        <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider">Guest Entry Code (Admin Tools)</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. guest_code" 
                                            className={`w-full bg-transparent border-b text-lg font-mono text-brand-black focus:outline-none transition-all duration-300 ${errors.accessToken ? 'animate-shake border-red-500/50 shadow-[0_4px_10px_rgba(239,68,68,0.1)]' : 'border-amber-500/30'}`} 
                                            value={formData.accessToken} 
                                            onChange={(e) => { setFormData({ ...formData, accessToken: e.target.value }); setErrors({ ...errors, accessToken: null }); }} 
                                        />
                                        {errors.accessToken && <p className="text-xs text-red-500 font-bold">{errors.accessToken}</p>}
                                    </div>
                                )}

                                <div className="space-y-6">
                                    <div className="space-y-2 min-w-0">
                                        <label className="block text-xs font-bold text-brand-accent uppercase tracking-widest">Full Name</label>
                                        <input 
                                            type="text" 
                                            className={`w-full py-2 bg-transparent border-b outline-none text-2xl md:text-3xl font-display font-bold text-brand-black transition-all duration-300 ${errors.name ? 'animate-shake border-red-500/50' : 'border-brand-black/20 focus:border-brand-black'} placeholder-brand-black/20`} 
                                            placeholder="Your Name" 
                                            value={formData.name} 
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                                        />
                                    </div>
                                    <div className="space-y-2 min-w-0">
                                        <label className="block text-xs font-bold text-brand-accent uppercase tracking-widest">Email Address</label>
                                        <input 
                                            type="text" 
                                            className={`w-full py-2 bg-transparent border-b outline-none text-lg md:text-xl font-sans text-brand-black transition-all duration-300 ${errors.email ? 'animate-shake border-red-500/50' : 'border-brand-black/20 focus:border-brand-black'} placeholder-brand-black/20`} 
                                            placeholder="john@example.com" 
                                            value={formData.email} 
                                            onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setErrors({ ...errors, email: null }); }} 
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block text-xs font-bold text-brand-accent uppercase tracking-widest">Will you be attending?</label>
                                        <div className="relative w-full h-[72px] bg-white/20 backdrop-blur-3xl border border-white/60 rounded-full p-2 flex cursor-pointer overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.05)]" onClick={() => setFormData({ ...formData, attending: formData.attending === 'yes' ? 'no' : 'yes' })}>
                                            <div className={`absolute top-2 bottom-2 w-[calc(50%-10px)] bg-brand-black rounded-full shadow-2xl transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${formData.attending === 'no' ? 'left-[calc(50%+2px)]' : 'left-2'}`} />
                                            <div className={`flex-1 flex items-center justify-center relative z-20 font-bold text-sm md:text-base whitespace-nowrap px-4 tracking-wide transition-colors duration-500 uppercase ${formData.attending === 'yes' ? 'text-zinc-950' : 'text-white/60'}`}>
                                                Joyfully Accept
                                            </div>
                                            <div className={`flex-1 flex items-center justify-center relative z-20 font-bold text-sm md:text-base whitespace-nowrap px-4 tracking-wide transition-colors duration-500 uppercase ${formData.attending === 'no' ? 'text-zinc-950' : 'text-white/60'}`}>
                                                Regretfully Decline
                                            </div>
                                        </div>
                                    </div>
                                    {formData.attending === 'yes' && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-4">
                                            <label className="block text-xs font-bold text-brand-accent uppercase tracking-widest">Mobile Number</label>
                                            <input 
                                                type="tel" 
                                                maxLength={10} 
                                                className={`w-full py-2 bg-transparent border-b outline-none text-xl font-sans text-brand-black transition-all duration-300 ${errors.mobile ? 'animate-shake border-red-500/50' : 'border-brand-black/20 focus:border-brand-black'} placeholder-brand-black/20`} 
                                                placeholder="9876543210" 
                                                value={formData.mobile} 
                                                onChange={(e) => { 
                                                    let val = e.target.value.replace(/\D/g, '');
                                                    if (val.startsWith('0')) val = val.substring(1);
                                                    val = val.slice(0, 10);
                                                    setFormData({ ...formData, mobile: val });
                                                    setErrors({ ...errors, mobile: null });
                                                }} 
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-center w-full mt-8">
                                    <StandardButton 
                                        type="submit" 
                                        icon={formData.attending === 'yes' ? ChevronRight : Frown}

                                    >
                                        {formData.attending === 'yes' ? 'Continue' : (isClientRegFlow ? 'Register' : 'Submit RSVP')}
                                    </StandardButton>
                                </div>
                            </form>
                        )}

                        {step === 2 && (
                            <div className="space-y-8 flex flex-col items-center">
                                <h3 className="text-4xl font-display font-bold text-brand-black text-center">Seat Reservation</h3>
                                <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <div className="w-full bg-white/10 backdrop-blur-xl border border-white/30 rounded-3xl py-4 px-8 shadow-2xl relative overflow-hidden group/panel">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover/panel:bg-brand-accent/10 transition-colors duration-700" />
                                        
                                        <div className="flex justify-between items-center relative z-10">
                                            <div className="space-y-1">
                                                <label className="font-bold text-brand-black/80 uppercase tracking-widest text-xs">Total Guests</label>
                                                <div className="pt-2">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setShowDetails(!showDetails)} 
                                                        className="py-1.5 px-4 bg-brand-black text-white rounded-full text-[10px] font-bold tracking-[0.2em] shadow-lg hover:bg-brand-dark transition-all uppercase whitespace-nowrap mt-1"
                                                    >
                                                        {showDetails ? 'Hide Personalization' : 'PERSONALIZE THE CELEBRATION'}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-center bg-white/40 rounded-2xl p-1 border border-white/60 shadow-inner">
                                                <button onClick={() => handleGuestCountChange(formData.guests - 1)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/60 transition-colors text-brand-black/60 font-bold text-xl">-</button>
                                                <span className="w-12 text-center font-display font-bold text-2xl text-brand-black">{formData.guests}</span>
                                                <button onClick={() => handleGuestCountChange(formData.guests + 1)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/60 transition-colors text-brand-black/60 font-bold text-xl">+</button>
                                            </div>
                                        </div>
                                        
                                        {showDetails && (
                                            <div className="space-y-4 pt-6 animate-in fade-in zoom-in-95 duration-500 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                                                {formData.guestDetails.map((guest, index) => (
                                                    <div key={index} className="grid grid-cols-12 gap-4 items-center bg-white/20 p-4 rounded-2xl border border-white/40">
                                                        <div className="col-span-12 md:col-span-4 relative">
                                                            <input 
                                                                type="text" 
                                                                className={`w-full bg-white/40 backdrop-blur-md rounded-xl p-3 text-sm font-medium outline-none border transition-all duration-300 placeholder:text-brand-black/20 ${step2Errors[`${index}-name`] ? 'animate-shake border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-white/60 focus:border-brand-accent/40'}`}
                                                                placeholder="Guest Name"
                                                                value={guest.name}
                                                                onChange={(e) => handleGuestDetailChange(index, 'name', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="col-span-6 md:col-span-4 relative group/select">
                                                            <select className={`w-full bg-white/40 backdrop-blur-md rounded-xl p-3 text-sm font-medium outline-none border transition-all duration-300 appearance-none shadow-sm ${step2Errors[`${index}-age`] ? 'animate-shake border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-white/60 focus:border-brand-accent/40'}`} value={guest.age} onChange={(e) => handleGuestDetailChange(index, 'age', e.target.value)}>
                                                                <option value="">Select Age</option>
                                                                <option value="Child (2-12)">Child (2 - 12 Years)</option>
                                                                <option value="Teen (13-19)">Teen (13 - 19 Years)</option>
                                                                <option value="Adult (20-60)">Adult (20 - 60 Years)</option>
                                                                <option value="Senior (60+)">Senior Citizen (60+ Years)</option>
                                                            </select>
                                                        </div>
                                                        <div className="col-span-6 md:col-span-4 relative group/select">
                                                            <select className={`w-full bg-white/40 backdrop-blur-md rounded-xl p-3 text-sm font-medium outline-none border transition-all duration-300 appearance-none shadow-sm ${step2Errors[`${index}-gender`] ? 'animate-shake border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-white/60 focus:border-brand-accent/40'}`} value={guest.gender} onChange={(e) => handleGuestDetailChange(index, 'gender', e.target.value)}>
                                                                <option value="">Select Gender</option>
                                                                <option value="Male">Male</option>
                                                                <option value="Female">Female</option>
                                                                <option value="Other">Other</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button 
                                        onClick={() => setShowSeatingModal(true)} 
                                        className={`w-full group/panel relative bg-white/10 backdrop-blur-xl border rounded-3xl py-4 px-8 shadow-2xl transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] hover:-translate-y-1 overflow-hidden flex items-center justify-between gap-8 h-[140px] ${seatingError ? 'animate-shake border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'border-white/30'}`}
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover/panel:bg-brand-accent/10 transition-colors duration-700" />
                                        
                                        <div className="relative z-10 flex flex-col items-start gap-1 flex-1 overflow-hidden">
                                            <div className="space-y-0.5 text-left">
                                                <label className="font-bold text-brand-black/80 uppercase tracking-widest text-[10px] md:text-xs">Witness the Celebration</label>
                                                <h4 className="block font-display font-bold text-2xl md:text-3xl text-brand-black leading-tight truncate">
                                                    {selectedSeats.length > 0 ? 'Refine Your Seating' : 'Curate Your Comfort'}
                                                </h4>
                                            </div>
                                            <div className="pt-2">
                                                <div className={`py-1.5 px-4 rounded-full font-bold text-[10px] md:text-xs shadow-lg animate-in scale-in-95 tracking-[0.2em] uppercase transition-all duration-300 ${selectedSeats.length > 0 ? 'bg-brand-black text-white' : 'bg-brand-black/10 text-brand-black border border-brand-black/20'}`}>
                                                    {selectedSeats.length > 0 ? `${selectedSeats.length} ${selectedSeats.length === 1 ? 'Seat' : 'Seats'} Secured` : 'Secure Your Seat'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="relative z-10 shrink-0">
                                            <div className="w-20 h-20 bg-brand-black rounded-2xl flex items-center justify-center text-3xl shadow-2xl transition-all duration-500 group-hover/panel:scale-110 group-hover/panel:rotate-3">
                                                🛋️
                                            </div>
                                        </div>
                                    </button>

                                    <div className="flex gap-6 w-full pt-12 items-center justify-between">
                                        <StandardButton 
                                            onClick={() => setStep(1)} 
                                            variant="secondary"
                                            icon={ChevronLeft}
    
                                        >
                                            Back
                                        </StandardButton>

                                        <StandardButton 
                                            onClick={() => { if (validateStep2()) setStep(3); }} 
                                            icon={ChevronRight}
    
                                        >
                                            Next Step
                                        </StandardButton>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-8 w-full max-w-xl mx-auto">
                                <RoomAllotment value={formData.accommodation} onChange={(val) => setFormData({ ...formData, accommodation: val })} />
                                <div className="flex gap-6 w-full pt-12 items-center justify-between">
                                    <StandardButton 
                                        onClick={() => setStep(2)} 
                                        variant="secondary"
                                        icon={ChevronLeft}

                                    >
                                        Back
                                    </StandardButton>

                                    <StandardButton 
                                        onClick={handleFinalSubmit} 
                                        icon={Heart}

                                    >
                                        Confirm & Submit
                                    </StandardButton>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-8 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-700">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20 animate-pulse" />
                                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white shadow-2xl relative z-10 animate-in zoom-in spin-in-12 duration-1000">
                                        <Check size={48} strokeWidth={3} />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <h3 className="text-3xl sm:text-5xl font-display font-bold text-brand-black tracking-tight">
                                        {isClientRegFlow ? "Portal Activated!" : "You're on the list!"}
                                    </h3>
                                    <p className="text-brand-accent text-lg sm:text-xl font-medium max-w-md mx-auto">
                                        {isClientRegFlow 
                                            ? "Welcome, Host! Your permanent management token is ready."
                                            : "Thank you for RSVPing. Your unique celebration access code has been generated."}
                                    </p>
                                </div>

                                <div className="w-full max-w-md bg-white/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/80 shadow-2xl relative group overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent/5 rounded-full blur-2xl -mr-8 -mt-8" />
                                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-black/40 mb-4 relative z-10">
                                        {isClientRegFlow ? "Permanent Client Token" : "Personal Access Code"}
                                    </p>
                                    <div className="flex items-center gap-4 justify-center relative z-10 w-full">
                                        <div className="overflow-x-auto no-scrollbar py-2">
                                            <code className="text-3xl md:text-5xl font-mono font-bold text-brand-black tracking-[0.15em] drop-shadow-sm select-all whitespace-nowrap">
                                                {newAccessCode}
                                            </code>
                                        </div>
                                        <button 
                                            onClick={copyCode} 
                                            className={`p-3 rounded-full transition-all duration-300 shrink-0 ${copied ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-brand-black/5 hover:bg-brand-black/10 text-brand-black/60'}`}
                                        >
                                            {copied ? <Check size={24} /> : <Copy size={24} />}
                                        </button>
                                    </div>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-brand-accent/60 mt-6 pt-4 border-t border-brand-black/5">
                                        Please save this code to access the portal later.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-4 w-full max-w-sm pt-4">
                                    <StandardButton 
                                        onClick={handleLoginRedirect} 
                                        size="lg"
                                        icon={Heart}

                                        className="w-full py-5"
                                    >
                                        Enter Celebration 
                                    </StandardButton>
                                    
                                    {!isClientRegFlow && (
                                        <button 
                                            onClick={() => window.print()}
                                            className="text-xs font-bold uppercase tracking-[0.2em] text-brand-black/40 hover:text-brand-black transition-colors"
                                        >
                                            Download Invitation PDF
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
            <TableBooking isOpen={showSeatingModal} onClose={() => setShowSeatingModal(false)} onConfirm={(seats) => { setSelectedSeats(seats); setFormData({ ...formData, seatNumbers: seats }); setShowSeatingModal(false); }} maxSeats={formData.guests} initialSelectedSeats={selectedSeats} occupiedSeats={allOccupiedSeats} />
        </PageLayout>
    );
};

export default Registration;
