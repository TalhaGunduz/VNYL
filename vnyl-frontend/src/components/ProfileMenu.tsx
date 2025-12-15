import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User as UserIcon,
    Settings,
    LogOut,
    Mic2,
    ShieldCheck,
    LayoutDashboard,
    ChevronDown,
    BadgeCheck // Changed from Check
} from 'lucide-react';
import VerificationModal from './VerificationModal';

const ProfileMenu = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Modal States
    const [isVerificationOpen, setIsVerificationOpen] = useState(false);

    const loadUser = () => {
        const stored = localStorage.getItem('user');
        if (stored) {
            setUser(JSON.parse(stored));
        }
    };

    useEffect(() => {
        loadUser();
        window.addEventListener('storage', loadUser);

        // Click outside listener
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            window.removeEventListener('storage', loadUser);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('storage'));
        navigate('/');
        setIsOpen(false);
    };

    if (!user) return null;

    const isArtist = user.role === 'artist';
    const isVerified = user.verification_status === 'verified';
    const isVerificationPending = user.verification_status === 'pending';

    return (
        <div className="relative" ref={menuRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group"
            >
                <div className="relative">
                    <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                        alt="Profile"
                        className="w-9 h-9 rounded-full object-cover border-2 border-transparent group-hover:border-white/20 transition-all"
                    />
                    {isVerified && (
                        <div className="absolute -bottom-1 -right-1 bg-[var(--bg)] rounded-full border-[2px] border-[var(--bg)] flex items-center justify-center">
                            <BadgeCheck size={18} className="text-white fill-blue-500" />
                        </div>
                    )}
                </div>

                <span className="text-sm font-medium text-white/90 max-w-[100px] truncate hidden md:block">
                    {user.name}
                </span>
                <ChevronDown size={14} className={`text-white/40 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }} // Fast & punchy
                        className="absolute right-0 mt-3 w-64 bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2 z-50 origin-top-right"
                    >
                        {/* Header Section */}
                        <div className="px-4 py-3 border-b border-white/5 mb-1">
                            <p className="text-white font-bold truncate">{user.name}</p>
                            <p className="text-xs text-white/50 truncate">@{user.username || 'user'}</p>
                        </div>

                        {/* General Links */}
                        <div className="px-2 space-y-0.5">
                            <button onClick={() => { navigate('/profile'); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors text-left">
                                <UserIcon size={16} />
                                Profile
                            </button>
                            <button onClick={() => { navigate('/edit-profile'); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors text-left">
                                <Settings size={16} />
                                Settings
                            </button>
                        </div>

                        <div className="my-2 border-t border-white/5 mx-4" />

                        {/* Role Based Section */}
                        <div className="px-2 space-y-0.5">

                            {/* IF USER IS NOT ARTIST -> SWITCH */}
                            {!isArtist && (
                                <button
                                    onClick={() => { navigate('/become-artist'); setIsOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--accent)] bg-[var(--accent)]/5 hover:bg-[var(--accent)]/10 transition-colors text-left"
                                >
                                    <Mic2 size={16} />
                                    Become an Artist
                                </button>
                            )}

                            {/* IF USER IS ARTIST -> DASHBOARD */}
                            {isArtist && (
                                <button
                                    onClick={() => { navigate('/artist-panel'); setIsOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white hover:bg-white/5 transition-colors text-left"
                                >
                                    <LayoutDashboard size={16} />
                                    Artist Dashboard
                                </button>
                            )}

                            {/* IF ARTIST AND NOT VERIFIED -> GET VERIFIED */}
                            {isArtist && !isVerified && (
                                <button
                                    onClick={() => { setIsVerificationOpen(true); setIsOpen(false); }}
                                    disabled={isVerificationPending}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${isVerificationPending ? 'text-yellow-500/50 cursor-not-allowed' : 'text-blue-400 hover:bg-blue-500/10'}`}
                                >
                                    <ShieldCheck size={16} />
                                    {isVerificationPending ? 'Verification Pending' : 'Get Verified'}
                                </button>
                            )}
                        </div>

                        <div className="my-2 border-t border-white/5 mx-4" />

                        {/* Logout */}
                        <div className="px-2">
                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors text-left">
                                <LogOut size={16} />
                                Logout
                            </button>
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>

            {/* Integrated Modals */}
            <VerificationModal
                isOpen={isVerificationOpen}
                onClose={() => setIsVerificationOpen(false)}
                onSuccess={() => {
                    loadUser();
                }}
            />
        </div>
    );
};

export default ProfileMenu;
