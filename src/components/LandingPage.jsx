import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, Loader, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import StandardButton from './common/StandardButton';

const LandingPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { loginWithCode, registerAndLogin } = useAuth();
    const urlClientId = searchParams.get('c') || searchParams.get('clientId') || 'default_client';

    // Auth State
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [showNameInput, setShowNameInput] = useState(false);
    const [pendingCode, setPendingCode] = useState('');

    const [clToken, setClToken] = useState('');
    const [isClientReg, setIsClientReg] = useState(false);
    const [tempUser, setTempUser] = useState(null);

    // Magic Link Logic
    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            handleMagicLogin(token);
        }
    }, [searchParams]);

    const handleMagicLogin = async (token) => {
        setIsUnlocking(true);
        // Small delay to make it feel like "Magic" (and allow UI to render)
        await new Promise(r => setTimeout(r, 800));

        const result = await loginWithCode(token, urlClientId);
        if (result.success) {
            if (result.requireName) {
                // Global Passcode used -> Ask for Name
                setPendingCode(token);
                setShowNameInput(true);
                setIsUnlocking(false); // Stop loading to show input
            } else if (result.requireClientRegistration) {
                navigate('/registration', { state: { clientReg: true, tempUser: result.user } });
            } else if (result.role === 'admin') {
                navigate(searchParams.get('c') ? '/' : '/master-directory');
            } else {
                navigate('/');
            }
        } else {
            setError(result.error || 'Invalid Magic Link');
            setIsUnlocking(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsUnlocking(true);

        const result = await loginWithCode(code, urlClientId);
        if (result.success) {
            if (result.requireName) {
                setPendingCode(code);
                setShowNameInput(true);
                setIsUnlocking(false);
            } else if (result.requireClientRegistration) {
                navigate('/registration', { state: { clientReg: true, tempUser: result.user } });
            } else if (result.role === 'admin') {
                navigate(searchParams.get('c') ? '/' : '/master-directory');
            } else {
                navigate('/');
            }
        } else {
            setError(result.error);
            setIsUnlocking(false);
        }
    };

    const handleNameSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsUnlocking(true);

        const result = await registerAndLogin(name, pendingCode, urlClientId);
        if (result.success) {
            if (result.role === 'admin') {
                navigate(searchParams.get('c') ? '/' : '/master-directory');
            } else {
                navigate('/');
            }
        } else {
            setError(result.error || 'Registration failed');
            setIsUnlocking(false);
        }
    };

    const handleClientRegSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsUnlocking(true);
        try {
            const res = await api.completeClientRegistration(tempUser.id, name || tempUser.name);
            if (res.success) {
                setClToken(res.token);
                setIsUnlocking(false);
            } else {
                setError(res.error || 'Registration failed');
                setIsUnlocking(false);
            }
        } catch (e) {
            setError('Server error');
            setIsUnlocking(false);
        }
    };

    // UI Render Helper
    const renderForm = () => {
        if (clToken) {
            return (
                <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <User className="text-green-600" size={32} />
                    </div>
                    <h3 className="font-display font-bold text-2xl text-brand-black">Portal Activated!</h3>
                    <p className="text-brand-black/60 font-medium">Your permanent Client Access Token is:</p>
                    <div className="bg-white/60 border border-brand-black/10 py-4 px-6 rounded-2xl font-mono text-2xl font-bold tracking-widest text-brand-black shadow-inner">
                        {clToken}
                    </div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-brand-black/40 pt-4">Please save this code to manage your portal.</p>
                    <StandardButton
                        onClick={() => navigate('/')}
                        size="lg"
                        className="w-full"
                    >
                        Enter Dashboard
                    </StandardButton>
                </div>
            );
        }

        if (isClientReg) {
            return (
                <form onSubmit={handleClientRegSubmit} className="space-y-6 max-w-xs mx-auto">
                    <h3 className="font-display font-bold text-xl text-brand-black">Finalize Portal Registration</h3>
                    <p className="font-display font-medium text-brand-black/80 text-sm">Welcome! Please confirm or enter your wedding name to activate your permanent access token.</p>
                    <div className="relative">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={tempUser.name}
                            className="w-full px-6 py-4 rounded-2xl border border-white/60 focus:border-brand-black/50 outline-none transition-all bg-white/40 backdrop-blur-sm text-center font-display text-lg text-brand-black placeholder:text-brand-black/30"
                            autoFocus
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-black/40">
                            <User size={18} />
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
                    <StandardButton
                        type="submit"
                        size="lg"
                        className="w-full"
                        icon={ArrowRight}
                    >
                        Activate Portal
                    </StandardButton>
                </form>
            );
        }

        if (showNameInput) {
            return (
                <form onSubmit={handleNameSubmit} className="space-y-6 max-w-xs mx-auto">
                    <p className="font-display font-medium text-brand-black/80 mb-4">Welcome! Please enter your full name to join us.</p>
                    <div className="relative">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your Full Name"
                            className="w-full px-6 py-4 rounded-2xl border border-white/60 focus:border-brand-black/50 outline-none transition-all bg-white/40 backdrop-blur-sm text-center font-display text-lg text-brand-black placeholder:text-brand-black/30"
                            autoFocus
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-black/40">
                            <User size={18} />
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
                    <StandardButton
                        type="submit"
                        size="lg"
                        className="w-full"
                        icon={ArrowRight}
                    >
                        Join Wedding
                    </StandardButton>
                </form>
            );
        }

        return (
            <form onSubmit={handleSubmit} className="space-y-6 max-w-xs mx-auto">
                <div className="relative">
                    <input
                        type="password"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Enter Access Code"
                        className="w-full px-6 py-4 rounded-2xl border border-white/60 focus:border-brand-black/50 outline-none transition-all bg-white/40 backdrop-blur-sm text-center font-display text-lg tracking-widest placeholder:tracking-normal placeholder:text-brand-black/30 text-brand-black"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-black/40">
                        <Lock size={18} />
                    </div>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-red-500 text-sm font-medium"
                    >
                        {error}
                    </motion.div>
                )}

                <StandardButton
                    type="submit"
                    size="lg"
                    className="w-full"
                    icon={ArrowRight}
                >
                    Enter Celebration
                </StandardButton>


            </form>
        );
    };

    return (
        <div className="h-[100dvh] w-full relative overflow-hidden flex items-center justify-center p-4">
            {/* Background Blobs - Responsive & Animated */}
            <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-[#ff9a9e] rounded-full blur-[120px] opacity-40 animate-pulse mix-blend-multiply" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-[#a1c4fd] rounded-full blur-[100px] opacity-40 animate-pulse animation-delay-2000 mix-blend-multiply" />
            <div className="absolute top-[40%] left-[40%] w-[50vw] h-[50vw] bg-[#fad0c4] rounded-full blur-[100px] opacity-30 animate-pulse animation-delay-4000 mix-blend-multiply" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="p-8 md:p-16 w-full max-w-lg text-center relative z-10"
            >
                <div className="mb-10">
                    <h1 className="font-display font-bold text-5xl md:text-6xl text-brand-black mb-2 tracking-tight">Welcome</h1>
                    <p className="font-display text-brand-black/60 text-lg uppercase tracking-widest">to our wedding celebration</p>
                </div>

                {isUnlocking ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            className="text-brand-black/50 mb-6"
                        >
                            <Loader size={48} />
                        </motion.div>
                        <p className="font-display text-brand-black/70 text-lg animate-pulse uppercase tracking-wide">Unlocking...</p>
                    </div>
                ) : renderForm()}
            </motion.div>
        </div>
    );
};

export default LandingPage;
