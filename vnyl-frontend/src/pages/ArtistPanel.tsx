import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Music2,
    Upload,
    BarChart3,
    Users,
    Heart,
    MoreHorizontal,
    Play,
    ShieldCheck,
    AlertCircle,
    BadgeCheck,
    Settings
} from 'lucide-react';
import { motion } from 'framer-motion';
import VerificationModal from '../components/VerificationModal';

const ArtistPanel = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [isVerificationOpen, setIsVerificationOpen] = useState(false);

    useEffect(() => {
        const loadUser = () => {
            const stored = localStorage.getItem('user');
            if (stored) {
                try {
                    const parsedUser = JSON.parse(stored);
                    // Simple protection: redirect if not artist
                    if (parsedUser.role !== 'artist') {
                        // navigate('/profile'); // Commented out for testing/demo purposes
                        // return;
                        console.warn("Accessing Artist Panel as non-artist (Dev Mode)");
                    }
                    setUser(parsedUser);
                } catch (error) {
                    console.error("User data parse error", error);
                    localStorage.removeItem('user');
                    navigate('/login');
                }
            } else {
                navigate('/login');
            }
        };
        loadUser();
        window.addEventListener('storage', loadUser);
        return () => window.removeEventListener('storage', loadUser);
    }, [navigate]);

    const [stats, setStats] = useState([
        { label: 'Total Streams', value: '0', change: '0%', icon: Play, color: 'text-blue-500' },
        { label: 'Listeners', value: '0', change: '0%', icon: Users, color: 'text-green-500' },
        { label: 'Followers', value: '0', change: '0%', icon: Heart, color: 'text-[var(--accent)]' },
    ]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/api/artist/stats');
                if (response.ok) {
                    const data = await response.json();
                    setStats([
                        { label: 'Total Streams', value: data.total_streams?.toLocaleString() || '0', change: '+12%', icon: Play, color: 'text-blue-500' },
                        { label: 'Listeners', value: data.monthly_listeners?.toLocaleString() || '0', change: '+8%', icon: Users, color: 'text-green-500' },
                        { label: 'Followers', value: data.followers?.toLocaleString() || '0', change: '+24%', icon: Heart, color: 'text-[var(--accent)]' },
                    ]);
                }
            } catch (error) {
                console.error("Failed to fetch stats", error);
            }
        };
        fetchStats();

    }, [navigate]);

    if (!user) {
        return (
            <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-white">
                Loading...
            </div>
        );
    }

    const isVerified = user.verification_status === 'verified';
    const isPending = user.verification_status === 'pending';

    // Mock Uploads
    const uploads = [
        { id: 1, title: 'Midnight City', plays: '42,102', date: '2 days ago', image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800&auto=format&fit=crop&q=60' },
        { id: 2, title: 'Neon Lights', plays: '21,400', date: '1 week ago', image: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=800&auto=format&fit=crop&q=60' },
        { id: 3, title: 'Summer Vibes', plays: '12,850', date: '2 weeks ago', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60' },
    ];

    return (
        <div className="min-h-screen bg-[var(--bg)] text-white p-6 pb-20 md:p-10 max-w-7xl mx-auto">

            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl">
                            <img
                                src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=60"}
                                alt={user.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {isVerified && (
                            <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full border-4 border-[var(--bg)] shadow-lg" title="Verified Artist">
                                <BadgeCheck size={20} />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">{user.artist?.stage_name || user.name}</h1>
                            {isPending && (
                                <span className="bg-yellow-500/20 text-yellow-500 text-xs px-2 py-0.5 rounded font-bold border border-yellow-500/20">PENDING</span>
                            )}
                        </div>
                        <p className="text-white/40 flex items-center gap-2 text-sm font-medium">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Artist Dashboard
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-all">
                        <Settings size={18} />
                        Settings
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2 bg-[var(--accent)] hover:bg-red-600 hover:scale-105 active:scale-95 text-white rounded-xl font-bold shadow-lg shadow-red-900/20 transition-all">
                        <Upload size={18} />
                        New Release
                    </button>
                </div>
            </header>

            {/* Verification Banner (If not verified) */}
            {!isVerified && !isPending && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/20 p-6 rounded-2xl flex items-center justify-between gap-6 relative overflow-hidden"
                >
                    <div className="relative z-10 flex items-start gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                            <ShieldCheck size={28} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-1">Get Verified</h3>
                            <p className="text-white/60 text-sm max-w-lg">
                                Verified artists get improved visibility, exclusive tools, and the blue checkmark.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsVerificationOpen(true)}
                        className="relative z-10 whitespace-nowrap px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-900/20"
                    >
                        Apply Now
                    </button>
                    {/* Decor */}
                    <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-blue-600/10 to-transparent" />
                </motion.div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-[#18181b]/60 border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                            <stat.icon className={stat.color} size={24} />
                        </div>
                        <p className="text-white/40 text-sm font-medium mb-2">{stat.label}</p>
                        <div className="flex items-end gap-3">
                            <h2 className="text-3xl font-black text-white">{stat.value}</h2>
                            <span className="text-green-500 text-xs font-bold mb-1.5">{stat.change}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Section */}
            <div className="grid lg:grid-cols-3 gap-8">

                {/* Left: Recent Releases */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Music2 size={20} className="text-[var(--accent)]" />
                            Your Discography
                        </h2>
                        <button className="text-sm text-white/40 hover:text-white transition-colors">View All</button>
                    </div>

                    <div className="bg-[#18181b]/40 border border-white/5 rounded-2xl overflow-hidden">
                        {uploads.map((track, i) => (
                            <div key={track.id} className="flex items-center p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group">
                                <div className="w-12 h-12 rounded-lg bg-cover bg-center shrink-0 mr-4" style={{ backgroundImage: `url(${track.image})` }} />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-white truncate group-hover:text-[var(--accent)] transition-colors">{track.title}</h4>
                                    <p className="text-xs text-white/40">{track.date}</p>
                                </div>
                                <div className="text-right flex items-center gap-6">
                                    <div className="hidden sm:block text-sm text-white/40 font-mono">{track.plays} <span className="text-xs">plays</span></div>
                                    <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white">
                                        <MoreHorizontal size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {uploads.length === 3 && (
                            <div className="p-4 text-center border-t border-white/5">
                                <button className="text-xs font-bold text-white/30 uppercase tracking-widest hover:text-white transition-colors">Load More</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Quick Tools / Notifications */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <BarChart3 size={20} className="text-purple-500" />
                        Insights
                    </h2>

                    <div className="bg-gradient-to-br from-purple-900/10 to-transparent border border-purple-500/10 rounded-2xl p-6">
                        <h3 className="font-bold text-white mb-2">Audience Growth</h3>
                        <div className="h-32 flex items-end gap-2 mt-4">
                            {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
                                <div key={i} className="flex-1 bg-purple-500/20 hover:bg-purple-500 rounded-t-sm transition-all relative group" style={{ height: `${h}%` }}>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10">
                                        {h * 10} listeners
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-center text-xs text-white/30 mt-4 font-mono">LAST 7 DAYS</p>
                    </div>

                    <div className="bg-[#18181b]/60 border border-white/5 rounded-2xl p-6">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-yellow-500/10 rounded-full text-yellow-500 mt-1">
                                <AlertCircle size={16} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-sm">Finish your profile</h4>
                                <p className="text-xs text-white/50 mt-1 leading-relaxed">
                                    Add a bio and social links to increase your chances of getting verified.
                                </p>
                                <button className="text-xs font-bold text-[var(--accent)] mt-3 hover:underline">Edit Profile</button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Verification Modal Integration */}
            <VerificationModal
                isOpen={isVerificationOpen}
                onClose={() => setIsVerificationOpen(false)}
                onSuccess={() => {
                    // Force reload user
                    const stored = localStorage.getItem('user');
                    if (stored) {
                        setUser(JSON.parse(stored));
                    }
                }}
            />

        </div>
    );
};

export default ArtistPanel;
