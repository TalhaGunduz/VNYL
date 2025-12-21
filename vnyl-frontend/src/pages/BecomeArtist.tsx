import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Mic2,
    Zap,
    BarChart3,
    Globe,
    ArrowRight,
    Star,
    Mail,
    BadgeCheck,
    CheckCircle2,
    Loader2,
    Upload as UploadIcon,
    X,
    MapPin,
    Link as LinkIcon,
    Instagram,
    Youtube,
    Music,
    Music2
} from 'lucide-react';
import Swal from 'sweetalert2';

const BecomeArtist = () => {
    const navigate = useNavigate();

    // Steps: landing -> verification -> form -> success
    const [step, setStep] = useState<'landing' | 'verification' | 'form' | 'success'>('landing');
    const [isLoading, setIsLoading] = useState(false);

    // User Data
    const [userEmail, setUserEmail] = useState('');
    const [userAvatar, setUserAvatar] = useState('');
    const [userName, setUserName] = useState('');

    // Verification State
    const [verificationCode, setVerificationCode] = useState('');
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    // Artist Form State
    const [stageName, setStageName] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const [primaryGenre, setPrimaryGenre] = useState('');
    const [secondaryGenres, setSecondaryGenres] = useState<string[]>([]);
    const [bio, setBio] = useState('');
    const [location, setLocation] = useState({ city: '', country: '' });
    const [socials, setSocials] = useState({
        spotify: '',
        apple: '',
        soundcloud: '',
        instagram: '',
        youtube: ''
    });
    const [careerStatus, setCareerStatus] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);

    const genres = [
        "Hip-Hop", "Pop", "Electronic", "Rock", "Indie",
        "Jazz", "R&B", "Latin", "Metal", "Classical",
        "Folk", "Reggae", "Alternative", "Country", "Blues"
    ];

    // Initialize User
    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            const parsed = JSON.parse(stored);
            setUserEmail(parsed.email || '');
            setUserAvatar(parsed.avatar || '');
            setUserName(parsed.name || '');
            setStageName(parsed.name || ''); // Default to username
            setAvatarPreview(parsed.avatar || '');
        }
    }, []);

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (step === 'verification' && timer > 0) {
            interval = setInterval(() => setTimer(t => t - 1), 1000);
        } else if (timer === 0) {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [step, timer]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // --- ACTIONS ---

    const handleSendCode = async () => {
        if (!userEmail) {
            Swal.fire('Error', 'User email not found. Please log in again.', 'error');
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch('http://127.0.0.1:8000/api/auth/send-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ email: userEmail })
            });

            if (response.ok) {
                setStep('verification');
                setTimer(60);
                setCanResend(false);
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Verification code sent to your email',
                    showConfirmButton: false,
                    timer: 3000,
                    background: '#18181b',
                    color: '#fff'
                });
            } else {
                let errorMessage = 'Failed to send code';
                try {
                    const data = await response.json();
                    errorMessage = data.message || data.detail || errorMessage;
                } catch (e) {
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }
        } catch (error: any) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Could not send verification code. Please try again.',
                background: '#18181b',
                color: '#fff'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (verificationCode.length !== 6) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Code',
                text: 'Please enter a valid 6-digit code.',
                background: '#18181b',
                color: '#fff'
            });
            return;
        }

        setIsLoading(true);
        try {
            // Call the new intermediate verification endpoint
            const response = await fetch('http://127.0.0.1:8000/api/auth/verify-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    email: userEmail,
                    code: verificationCode
                })
            });

            if (response.ok) {
                // Code is valid, proceed to form
                setStep('form');
            } else {
                const data = await response.json();
                throw new Error(data.message || 'Invalid verification code');
            }
        } catch (error: any) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Verification Failed',
                text: error.message || 'The code you entered is incorrect or expired.',
                background: '#18181b',
                color: '#fff'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveAvatar = () => {
        setAvatarFile(null);
        setAvatarPreview(''); // Show placeholder
    };

    const toggleSecondaryGenre = (g: string) => {
        if (secondaryGenres.includes(g)) {
            setSecondaryGenres(prev => prev.filter(item => item !== g));
        } else {
            if (secondaryGenres.length < 2) {
                setSecondaryGenres(prev => [...prev, g]);
            }
        }
    };

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!termsAccepted) {
            Swal.fire({
                icon: 'warning',
                title: 'Terms of Service',
                text: 'You must agree to the Terms & Conditions to proceed.',
                background: '#18181b',
                color: '#fff'
            });
            return;
        }

        if (!stageName || !primaryGenre || !careerStatus || !bio || bio.length < 10) {
            Swal.fire({
                icon: 'warning',
                title: 'Incomplete Form',
                text: 'Please fill in all required fields (Name, Genre, Status, Bio) and ensure bio is at least 10 characters.',
                background: '#18181b',
                color: '#fff'
            });
            return;
        }

        setIsLoading(true);
        try {
            // Prepare payload matching the backend requirements
            const payload = {
                email: userEmail,
                code: verificationCode,
                stage_name: stageName,
                bio,
                primary_genre: primaryGenre,
                secondary_genres: secondaryGenres, // Backend expects array/list
                location_city: location.city,
                location_country: location.country,
                socials,
                career_status: careerStatus,
                avatar: avatarPreview // Sending URL/DataURL. If file upload needed, logic changes.
            };

            const response = await fetch('http://127.0.0.1:8000/api/artist/verify-and-upgrade', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                // Update Local Storage
                const stored = localStorage.getItem('user');
                if (stored) {
                    const currentUser = JSON.parse(stored);
                    // The backend likely returns the updated user object
                    const updatedUserBackend = data.user || data;

                    const finalUser = {
                        ...currentUser,
                        ...updatedUserBackend,
                        role: 'artist', // Force ensure role is artist locally
                        verification_status: 'verified' // Assume verified for instant access flow
                    };
                    localStorage.setItem('user', JSON.stringify(finalUser));
                    window.dispatchEvent(new Event('storage'));
                }
                setStep('success');
            } else {
                throw new Error(data.message || 'Verification failed');
            }
        } catch (error: any) {
            console.error("Submission error:", error);
            Swal.fire({
                icon: 'error',
                title: 'Submission Failed',
                text: error.message || 'Could not create artist profile. Please try again.',
                background: '#18181b',
                color: '#fff'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg)] text-white relative overflow-hidden flex flex-col pt-20">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] left-[10%] w-[500px] h-[500px] bg-[var(--accent)]/10 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-6 relative z-10 flex flex-col items-center justify-center flex-1 py-12">
                <AnimatePresence mode="wait">

                    {/* --- STEP 1: LANDING --- */}
                    {step === 'landing' && (
                        <motion.div
                            key="landing"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="max-w-4xl w-full grid md:grid-cols-2 gap-12 items-center"
                        >
                            <div className="space-y-8">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[var(--accent)] text-xs font-bold uppercase tracking-wider shadow-lg shadow-[var(--accent)]/10">
                                    <Star size={12} fill="currentColor" />
                                    Artist Access
                                </div>
                                <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                                    Claim Your <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-purple-600">Artist Profile</span>
                                </h1>
                                <p className="text-white/60 text-lg leading-relaxed max-w-md">
                                    Join the verification program to unlock analytics, verified badge, and direct uploads on VNYL.
                                </p>

                                <div className="space-y-4">
                                    {[
                                        { label: "Global Distribution", icon: Globe },
                                        { label: "Advanced Analytics", icon: BarChart3 },
                                        { label: "Instant Payouts", icon: Zap },
                                        { label: "Artist Tools", icon: Mic2 },
                                    ].map((benefit, i) => (
                                        <div key={i} className="flex items-center gap-4 text-white/80">
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[var(--accent)]">
                                                <benefit.icon size={20} />
                                            </div>
                                            <span className="font-bold">{benefit.label}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handleSendCode}
                                    disabled={isLoading}
                                    className="group px-10 py-5 bg-white text-black font-black text-lg rounded-2xl hover:scale-105 transition-all shadow-xl shadow-white/10 flex items-center gap-3 disabled:opacity-70"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" /> : 'Claim Artist Profile'}
                                    <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>

                            {/* Hero Visual */}
                            <div className="relative hidden md:block perspective-1000">
                                {/* Decor Glow */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent)] to-purple-600 rounded-[2rem] opacity-30 blur-[60px] animate-pulse" />

                                {/* Mock Card */}
                                <motion.div
                                    initial={{ rotateY: 10, rotateX: 5 }}
                                    animate={{ rotateY: 0, rotateX: 0 }}
                                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                                    className="relative bg-gradient-to-br from-[#18181b] to-[#09090b] border border-white/10 p-6 rounded-[2rem] shadow-2xl"
                                >
                                    {/* Mock Header */}
                                    <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4">
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 p-0.5">
                                                <img src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80" alt="Mock Artist" className="w-full h-full rounded-full object-cover border-2 border-[#18181b]" />
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full border-2 border-[#18181b]">
                                                <BadgeCheck size={12} fill="currentColor" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">Your Name</h3>
                                            <p className="text-white/40 text-xs font-mono mb-1">@artist_handle</p>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-bold">VERIFIED ARTIST</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mock Stats */}
                                    <div className="grid grid-cols-3 gap-3 mb-6">
                                        {[
                                            { label: 'Listeners', val: '1.2M' },
                                            { label: 'Followers', val: '850K' },
                                            { label: 'Streams', val: '24M' }
                                        ].map((s, i) => (
                                            <div key={i} className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                                                <div className="text-sm font-bold text-white">{s.val}</div>
                                                <div className="text-[10px] text-white/40 uppercase">{s.label}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Mock Track */}
                                    <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-4 border border-white/5">
                                        <div className="w-12 h-12 rounded-lg bg-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)]">
                                            <Music size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="h-2 w-32 bg-white/20 rounded-full mb-2" />
                                            <div className="h-2 w-20 bg-white/10 rounded-full" />
                                        </div>
                                        <div className="text-white/40">
                                            <BarChart3 size={16} />
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Floating Badge */}
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute -top-6 -right-6 bg-white text-black font-black text-xs px-4 py-2 rounded-full shadow-xl flex items-center gap-2"
                                >
                                    <Zap size={14} className="text-[var(--accent)]" fill="currentColor" />
                                    <span>INSTANT ACCESS</span>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}

                    {/* --- STEP 2: VERIFICATION --- */}
                    {step === 'verification' && (
                        <motion.div
                            key="verification"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="max-w-md w-full"
                        >
                            <div className="bg-[#18181b] border border-white/10 p-8 rounded-3xl shadow-2xl text-center">
                                <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-[var(--accent)]">
                                    <Mail size={32} />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Verify Your Email</h2>
                                <p className="text-white/50 text-sm mb-8">
                                    We sent a 6-digit code to <span className="text-white font-mono">{userEmail}</span>
                                </p>

                                <form onSubmit={handleVerifyCode} className="space-y-6">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            maxLength={6}
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                                            className="w-full bg-black/40 border border-white/10 focus:border-[var(--accent)] rounded-2xl py-4 text-center text-3xl font-mono tracking-[0.5em] text-white placeholder:text-white/10 outline-none transition-all"
                                            placeholder="000000"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="flex items-center justify-between text-xs font-bold px-2">
                                        <span className="text-white/40">Expires in {formatTime(timer)}</span>
                                        {canResend && (
                                            <button
                                                type="button"
                                                onClick={handleSendCode}
                                                className="text-[var(--accent)] hover:underline"
                                            >
                                                Resend Code
                                            </button>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading || verificationCode.length !== 6}
                                        className="w-full bg-white text-black font-bold py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Verify & Continue'}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    )}

                    {/* --- STEP 3: ARTIST INFO FORM --- */}
                    {step === 'form' && (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="max-w-3xl w-full"
                        >
                            <div className="bg-[#18181b] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                                <div className="p-8 border-b border-white/5 bg-white/5">
                                    <h2 className="text-2xl font-bold">Artist Profile Details</h2>
                                    <p className="text-white/50 text-sm mt-1">Tell us about your artistry.</p>
                                </div>

                                <form onSubmit={handleFinalSubmit} className="p-8 space-y-8">

                                    {/* 1. Artist Name & Image */}
                                    <div className="grid md:grid-cols-[auto_1fr] gap-8 items-start">
                                        {/* Avatar Upload */}
                                        <div className="text-center group">
                                            <div className="relative w-32 h-32 rounded-full overflow-hidden bg-black border-2 border-white/10 mx-auto mb-3 shadow-lg">
                                                {avatarPreview ? (
                                                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-white/20">
                                                        <Mic2 size={32} />
                                                    </div>
                                                )}
                                                {/* Hover Overlay */}
                                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                    <UploadIcon size={24} className="mb-1" />
                                                    <span className="text-[10px] font-bold uppercase">Change</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleAvatarChange}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                            {avatarPreview && (
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveAvatar}
                                                    className="text-xs text-red-500 font-bold hover:underline"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                            {!avatarPreview && <span className="text-[10px] text-white/30 uppercase font-bold">Profile Image</span>}
                                        </div>

                                        {/* Name & Genre */}
                                        <div className="space-y-6 flex-1">
                                            <div>
                                                <label className="block text-xs font-bold text-white/40 mb-2 uppercase">Artist Name <span className="text-[var(--accent)]">*</span></label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={stageName}
                                                    onChange={(e) => setStageName(e.target.value)}
                                                    className="w-full bg-black/20 border border-white/10 focus:border-[var(--accent)] rounded-xl px-4 py-3 text-white font-bold text-lg outline-none transition-colors"
                                                    placeholder="Your Stage Name"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-white/40 mb-2 uppercase">Primary Genre <span className="text-[var(--accent)]">*</span></label>
                                                    <select
                                                        required
                                                        value={primaryGenre}
                                                        onChange={(e) => setPrimaryGenre(e.target.value)}
                                                        className="w-full bg-black/20 border border-white/10 focus:border-[var(--accent)] rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors appearance-none"
                                                    >
                                                        <option value="">Select Genre</option>
                                                        {genres.map(g => <option key={g} value={g} className="bg-[#18181b]">{g}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-white/40 mb-2 uppercase">Career Status</label>
                                                    <select
                                                        value={careerStatus}
                                                        onChange={(e) => setCareerStatus(e.target.value)}
                                                        className="w-full bg-black/20 border border-white/10 focus:border-[var(--accent)] rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors appearance-none"
                                                    >
                                                        <option value="">Select Status</option>
                                                        <option value="Independent" className="bg-[#18181b]">Independent</option>
                                                        <option value="Signed" className="bg-[#18181b]">Signed Label</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Bio */}
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <label className="text-xs font-bold text-white/40 uppercase">Artist Bio <span className="text-[var(--accent)]">*</span></label>
                                            <span className={`text-xs font-mono ${(bio.length > 0 && bio.length < 10) ? 'text-red-500' : 'text-white/30'}`}>
                                                {bio.length} / 300
                                            </span>
                                        </div>
                                        <textarea
                                            required
                                            rows={4}
                                            maxLength={300}
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 focus:border-[var(--accent)] rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none transition-colors resize-none"
                                            placeholder="Tell us a bit about yourself (min 10 chars)..."
                                        />
                                        {bio.length > 0 && bio.length < 10 && (
                                            <p className="text-red-500 text-[10px] mt-1 font-bold">Minimum 10 characters required.</p>
                                        )}
                                    </div>

                                    {/* 3. Secondary Genres (Chips) */}
                                    <div>
                                        <label className="block text-xs font-bold text-white/40 mb-3 uppercase">Secondary Genres (Max 2)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {genres.map(g => (
                                                <button
                                                    key={g}
                                                    type="button"
                                                    onClick={() => toggleSecondaryGenre(g)}
                                                    disabled={!secondaryGenres.includes(g) && secondaryGenres.length >= 2}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${secondaryGenres.includes(g)
                                                        ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                                                        : 'bg-transparent border-white/10 text-white/60 hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed'
                                                        }`}
                                                >
                                                    {g}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 4. Location & Links */}
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <label className="block text-xs font-bold text-white/40 uppercase border-b border-white/5 pb-2">Location</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="relative">
                                                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                                    <input
                                                        type="text"
                                                        value={location.city}
                                                        onChange={(e) => setLocation({ ...location, city: e.target.value })}
                                                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-white/30"
                                                        placeholder="City"
                                                    />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={location.country}
                                                    onChange={(e) => setLocation({ ...location, country: e.target.value })}
                                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-white/30"
                                                    placeholder="Country"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="block text-xs font-bold text-white/40 uppercase border-b border-white/5 pb-2">Socials</label>
                                            <div className="space-y-2">
                                                <div className="relative">
                                                    <Instagram size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                                    <input
                                                        type="text"
                                                        value={socials.instagram}
                                                        onChange={(e) => setSocials({ ...socials, instagram: e.target.value })}
                                                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-white/30"
                                                        placeholder="Instagram username"
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <Music2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                                    <input
                                                        type="text"
                                                        value={socials.spotify}
                                                        onChange={(e) => setSocials({ ...socials, spotify: e.target.value })}
                                                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-white/30"
                                                        placeholder="Spotify Artist URL"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    {/* Terms & Conditions */}
                                    <div className="pt-4 border-t border-white/5">
                                        <label className="flex items-start gap-3 cursor-pointer group">
                                            <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${termsAccepted ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-white/20 group-hover:border-white/40'}`}>
                                                {termsAccepted && <CheckCircle2 size={12} className="text-white" strokeWidth={4} />}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={termsAccepted}
                                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                            />
                                            <span className="text-xs text-white/50 leading-relaxed">
                                                I agree to the <span className="text-white hover:underline">Artist Terms & Conditions</span> and <span className="text-white hover:underline">Privacy Policy</span>. I confirm that I own the rights to the music I will upload.
                                            </span>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-end">
                                        <p className="text-[10px] text-white/30 mr-4">
                                            By submitting, you agree to VNYL's Artist Terms.
                                        </p>
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="px-8 py-3 bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white font-bold rounded-xl transition-all shadow-lg shadow-[var(--accent)]/20 disabled:opacity-50"
                                        >
                                            {isLoading ? 'Creating Profile...' : 'Complete Setup'}
                                        </button>
                                    </div>

                                </form>
                            </div>
                        </motion.div>
                    )}

                    {/* --- STEP 4: SUCCESS --- */}
                    {step === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center max-w-lg mx-auto"
                        >
                            <div className="bg-[#18181b] border border-white/10 p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                                    className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-black shadow-lg shadow-green-500/30"
                                >
                                    <CheckCircle2 size={48} strokeWidth={3} />
                                </motion.div>

                                <h2 className="text-3xl font-black mb-4">Welcome, {stageName}!</h2>
                                <p className="text-white/60 mb-8 leading-relaxed">
                                    Your artist profile has been successfully created. You can now access your dashboard and start uploading.
                                </p>

                                <button
                                    onClick={() => navigate('/artist-panel')}
                                    className="w-full bg-white text-black font-bold py-4 rounded-xl hover:scale-105 transition-transform shadow-xl"
                                >
                                    Go to Artist Dashboard
                                </button>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
};

export default BecomeArtist;
