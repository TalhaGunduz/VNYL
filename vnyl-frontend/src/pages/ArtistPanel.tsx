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
    Settings,
    Edit3,
    TrendingUp,
    Zap,
    ArrowUpRight,
    Activity, // Added
    Music,    // Added
    User      // Added
} from 'lucide-react';
import { motion } from 'framer-motion';
import VerificationModal from '../components/VerificationModal';
// import ArtistProfileModal from '../components/ArtistProfileModal'; // Removed

const ArtistPanel = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [isVerificationOpen, setIsVerificationOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [timeRange, setTimeRange] = useState<'daily' | 'monthly' | 'total'>('total');
    const [activity, setActivity] = useState<any[]>([]); // New State for activity

    useEffect(() => {
        const loadUser = async () => {
            const stored = localStorage.getItem('user');
            const token = localStorage.getItem('token');

            if (!stored || !token) {
                navigate('/login');
                return;
            }

            try {
                // First load from storage for instant UI
                const parsedUser = JSON.parse(stored);
                setUser(parsedUser);

                // Then fetch fresh from API to ensure completion bar is accurate
                const response = await fetch('http://127.0.0.1:8000/api/user', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    const freshUser = await response.json();
                    setUser(freshUser);
                    localStorage.setItem('user', JSON.stringify(freshUser));
                }
            } catch (error) {
                console.error("User data sync error", error);
            }
        };

        loadUser();
        window.addEventListener('storage', loadUser);
        return () => window.removeEventListener('storage', loadUser);
    }, [navigate]);

    const [stats, setStats] = useState<{ label: string, value: string, change: string | null, icon: any, color: string }[]>([
        { label: 'Total Streams', value: '0', change: '0%', icon: Play, color: 'text-blue-500' },
        { label: 'Listeners', value: '0', change: '0%', icon: Users, color: 'text-green-500' },
        { label: 'Followers', value: '0', change: '0%', icon: Heart, color: 'text-[var(--accent)]' },
    ]);
    const [graphData, setGraphData] = useState<{ label: string, value: number }[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:8000/api/artist/stats?range=${timeRange}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setStats([
                        {
                            label: timeRange === 'daily' ? 'Streams Today' : timeRange === 'monthly' ? 'Streams This Month' : 'Total Streams',
                            value: data.stats?.total_streams?.toLocaleString() || '0',
                            change: data.stats?.streams_growth !== null ? `${data.stats?.streams_growth > 0 ? '+' : ''}${data.stats?.streams_growth}%` : null,
                            icon: Play,
                            color: 'text-blue-500'
                        },
                        {
                            label: 'Listeners',
                            value: data.stats?.monthly_listeners?.toLocaleString() || '0',
                            change: data.stats?.listeners_growth !== null ? `${data.stats?.listeners_growth > 0 ? '+' : ''}${data.stats?.listeners_growth}%` : null,
                            icon: Users,
                            color: 'text-green-500'
                        },
                        {
                            label: timeRange === 'daily' ? 'New Followers' : timeRange === 'monthly' ? 'New Followers' : 'Followers',
                            value: data.stats?.followers?.toLocaleString() || '0',
                            change: data.stats?.followers_growth !== null ? `${data.stats?.followers_growth > 0 ? '+' : ''}${data.stats?.followers_growth}%` : null,
                            icon: Heart,
                            color: 'text-[var(--accent)]'
                        },
                    ]);
                    if (data.stats?.graph) {
                        setGraphData(data.stats.graph);
                    }
                }
            } catch (error) {
                console.error('Stats error:', error);
            }
        };
        fetchStats();
    }, [user, timeRange]);

    // Calculate max for graph scaling
    const maxGraphValue = Math.max(...graphData.map(d => d.value), 10); // Minimum 10 scale

    const [uploads, setUploads] = useState<any[]>([]);

    useEffect(() => {
        const fetchTracks = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/api/tracks', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUploads(data.tracks);
                }
            } catch (error) {
                console.error("Failed to fetch tracks", error);
            }
        };
        fetchTracks();
    }, [navigate]);

    const fetchActivity = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://127.0.0.1:8000/api/artist/activity`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status === 'success') {
                setActivity(data.activity);
            }
        } catch (err) {
            console.error("Failed to fetch activity", err);
        }
    };

    useEffect(() => {
        fetchActivity();
    }, []);

    // Helper for date formatting
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const diffDays = Math.ceil((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Today';
        if (diffDays === 2) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;

        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-white">
                Loading...
            </div>
        );
    }

    const isVerified = user.verification_status === 'verified';
    const isPending = user.verification_status === 'pending';

    // Calculate detailed completion percentage
    const calculateCompletion = () => {
        const artist = user.artist || {};
        let score = 0;
        const totalPoints = 12;
        const missing: string[] = [];

        // 1. Stage Name (1pt)
        if (artist.stage_name || user.stage_name || user.name) score += 1;
        else missing.push("Stage Name");

        // 2. Bio (1pt)
        if (artist.bio || artist.artist_bio || user.artist_bio || user.bio) score += 1;
        else missing.push("Bio");

        // 3. Primary Genre (1pt)
        if (artist.primary_genre || user.primary_genre) score += 1;
        else missing.push("Primary Genre");

        // 4. Secondary Genres (Up to 3pts)
        const secondary = (artist.secondary_genres || user.secondary_genres || []) as string[];
        if (secondary.length > 0) score += 1; else missing.push("Secondary Genre #1");
        if (secondary.length > 1) score += 1; else missing.push("Secondary Genre #2");
        if (secondary.length > 2) score += 1; else missing.push("Secondary Genre #3");

        // 5. Location (2pts: Country + City)
        if (artist.location_country || user.location_country) score += 1;
        else missing.push("Country");

        if (artist.location_city || user.location_city) score += 1;
        else missing.push("City");

        // 6. Connect / Socials (4pts)
        const s = artist.socials || {};

        // Instagram
        if (s.instagram || artist.social_instagram || user.social_instagram) score += 1;
        else missing.push("Instagram Link");

        // Spotify
        if (s.spotify || artist.social_spotify || user.social_spotify) score += 1;
        else missing.push("Spotify Link");

        // YouTube
        if (s.youtube || artist.social_youtube || user.social_youtube) score += 1;
        else missing.push("YouTube Link");

        // SoundCloud / Apple
        if (s.soundcloud || artist.social_soundcloud || user.social_soundcloud || s.apple || artist.social_apple || user.social_apple) score += 1;
        else missing.push("SoundCloud or Apple Link");

        // if (missing.length > 0) {
        //     console.log("Missing for 100% Artist Profile:", missing);
        // }

        return Math.round((score / totalPoints) * 100);
    };

    const completionPercent = calculateCompletion();




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
                            <div className="absolute -bottom-1 -right-1 bg-[var(--bg)] rounded-full border-[2px] border-[var(--bg)] flex items-center justify-center box-content">
                                <BadgeCheck size={24} className="text-white fill-blue-500" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">{user.stage_name || user.artist?.stage_name || user.name}</h1>
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
                    <button onClick={() => navigate('/edit-profile')} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-all">
                        <Settings size={18} />
                        Settings
                    </button>
                    <button
                        onClick={() => navigate('/upload')}
                        className="flex items-center gap-2 px-5 py-2 bg-[var(--accent)] hover:bg-red-600 hover:scale-105 active:scale-95 text-white rounded-xl font-bold shadow-lg shadow-red-900/20 transition-all"
                    >
                        <Upload size={18} />
                        New Release
                    </button>
                </div>
            </header>

            {/* 1. Stats Grid (HERO - Main Focus) */}
            {/* Dashboard Stats */}
            <div className="flex gap-2 mb-4">
                {(['daily', 'monthly', 'total'] as const).map((range) => (
                    <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all border ${timeRange === range
                            ? 'bg-white text-black border-white'
                            : 'bg-transparent text-white/50 border-white/10 hover:border-white/30 hover:text-white'
                            }`}
                    >
                        {range.charAt(0).toUpperCase() + range.slice(1)}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-[#18181b] border border-white/5 p-6 rounded-3xl relative overflow-hidden group hover:bg-white/5 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                            <stat.icon className={stat.color} size={28} />
                        </div>
                        <p className="text-white/40 text-sm font-medium mb-1 uppercase tracking-wider">{stat.label}</p>
                        <div className="flex items-end gap-3 z-10 relative">
                            <h2 className="text-4xl font-black text-white">{stat.value}</h2>
                            <span className="text-green-500 text-sm font-bold mb-2 bg-green-500/10 px-2 py-0.5 rounded-full">{stat.change}</span>
                        </div>
                        {/* Subtle background glow */}
                        <div className={`absolute -bottom-10 -left-10 w-32 h-32 ${stat.color.replace('text-', 'bg-')}/10 blur-3xl rounded-full pointer-events-none`} />
                    </div>
                ))}
            </div>


            {/* 2. Profile Completion (Always Visible) */}
            <div className={`mb-12 border ${completionPercent === 100 ? 'border-green-500/20 bg-green-500/5' : 'border-white/10 bg-gradient-to-r from-[#18181b] to-black'} rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden`}>
                {/* Decorative background */}
                <div className={`absolute top-0 right-0 w-64 h-full ${completionPercent === 100 ? 'bg-green-500/5' : 'bg-[var(--accent)]/5'} skew-x-12 pointer-events-none`} />

                <div className="relative z-10 flex items-center gap-4 w-full md:max-w-xl">
                    <div className={`w-12 h-12 rounded-full border-2 ${completionPercent === 100 ? 'border-green-500 text-green-500 bg-green-500/10' : 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10'} flex items-center justify-center font-bold shrink-0`}>
                        {completionPercent}%
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-white text-lg flex items-center gap-2">
                            {completionPercent === 100 ? 'Artist Profile Active' : 'Complete your profile'}
                            {completionPercent < 100 && <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded uppercase tracking-wider">Draft</span>}
                        </h3>
                        <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                            <div className={`h-full ${completionPercent === 100 ? 'bg-green-500' : 'bg-[var(--accent)]'} rounded-full`} style={{ width: `${completionPercent}%` }} />
                        </div>
                        <p className="text-xs text-white/40 mt-1.5">
                            {completionPercent === 100 ? 'Your profile is fully optimized for visibility.' : 'Add bio, genres, and socials to boost visibility.'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/artist/complete-profile')}
                    className="relative z-10 whitespace-nowrap px-6 py-2.5 bg-white text-black text-sm font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-lg shadow-white/5"
                >
                    <Edit3 size={16} />
                    {completionPercent === 100 ? 'Edit Details' : 'Continue Setup'}
                </button>
            </div>


            {/* 3. Content Section */}
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
                            <div
                                key={track.id}
                                onClick={() => navigate(`/artist/analytics/${track.id}`)}
                                className="flex items-center p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group cursor-pointer"
                            >
                                <div className="w-12 h-12 rounded-lg bg-cover bg-center shrink-0 mr-4 bg-[#1c1c1e] relative overflow-hidden">
                                    {track.cover_path ? (
                                        <img src={`http://127.0.0.1:8000/storage/${track.cover_path}`} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center w-full h-full text-white/20">
                                            <Music2 size={20} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-white truncate group-hover:text-[var(--accent)] transition-colors">{track.title}</h4>
                                    <p className="text-xs text-white/40 mb-1">{new Date(track.created_at).toLocaleDateString()}</p>
                                    {track.description && (
                                        <p className="text-xs text-white/60 truncate pr-4">{track.description}</p>
                                    )}
                                </div>
                                <div className="text-right flex items-center gap-6">
                                    <div className="hidden sm:block text-sm text-white/40 font-mono">{track.plays || 0} <span className="text-xs">plays</span></div>
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

                    <div className="bg-[#18181b] border border-white/5 rounded-3xl p-6 relative overflow-hidden group/insights transition-all hover:bg-white/5">
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <BarChart3 size={18} className="text-[var(--accent)]" />
                                Insights
                                <span className="text-[10px] bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded font-bold uppercase tracking-wider">7 Days</span>
                            </h3>
                        </div>

                        <div className="h-40 flex items-end gap-3 px-1 relative z-10">
                            {graphData.length > 0 ? graphData.map((d: any, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-3 group/bar h-full justify-end relative">
                                    {/* Bold Bar */}
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${Math.max((d.value / maxGraphValue) * 100, 10)}%` }}
                                        transition={{ duration: 1.2, delay: i * 0.05, ease: "circOut" }}
                                        className="w-full bg-gradient-to-t from-[var(--accent)] to-orange-400 rounded-t-lg relative group-hover/bar:from-orange-400 group-hover/bar:to-white transition-all duration-300 shadow-[0_4px_20px_rgba(var(--accent-rgb),0.3)] group-hover/bar:shadow-[0_4px_30px_rgba(var(--accent-rgb),0.5)]"
                                    >
                                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                                        <div className="absolute top-0 inset-x-0 h-1 bg-white/30 rounded-full blur-[1px]" />

                                        {/* Minimal Tooltip */}
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black px-2 py-1 rounded-md opacity-0 group-hover/bar:opacity-100 transition-all duration-200 whitespace-nowrap z-30 shadow-xl pointer-events-none">
                                            {d.value} plays
                                        </div>
                                    </motion.div>
                                    <span className="text-[9px] text-white/30 font-bold group-hover/bar:text-white transition-colors">{d.label.toUpperCase()}</span>
                                </div>
                            )) : (
                                <div className="w-full h-full flex items-center justify-center text-white/10 text-xs italic">
                                    Initializing analytics...
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-white/40">
                            <p className="text-[10px] font-bold uppercase tracking-widest">Global Activity</p>
                            <div className="flex gap-1">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-1 h-1 rounded-full bg-white/20" />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Removed old 'Finish your profile' box since we have the hero section now */}

                </div>
            </div>

            {/* Recent Activity Section */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Activity List */}
                <div className="bg-[#181818] rounded-xl p-6 border border-white/5">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <span className="bg-blue-500/20 text-blue-500 p-2 rounded-lg">
                            <Activity size={20} />
                        </span>
                        Recent Activity
                    </h3>

                    <div className="space-y-4">
                        {activity.length === 0 ? (
                            <div className="text-white/30 text-center py-8">No recent activity found.</div>
                        ) : (
                            activity.map((item, i) => (
                                <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors border border-white/5 hover:border-white/10">
                                    <img src={item.user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.user_name)}`}
                                        className="w-10 h-10 rounded-full object-cover" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white">
                                            <span className="font-bold hover:text-[var(--accent)] cursor-pointer">{item.user_name}</span>
                                            <span className="text-white/60">
                                                {item.type === 'like' ? ' liked your track ' : ' started following you'}
                                            </span>
                                            {item.type === 'like' && (
                                                <span className="font-medium text-[var(--accent)]">"{item.track_title}"</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-white/30 mt-1">
                                            {formatDate(item.created_at)}
                                        </p>
                                    </div>
                                    <div className={`p-2 rounded-full ${item.type === 'like' ? 'bg-pink-500/10 text-pink-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                        {item.type === 'like' ? <Heart size={16} fill="currentColor" /> : <User size={16} />}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Actions / Tips can go here if needed, or leave empty/expand chart */}
                <div className="bg-gradient-to-br from-[var(--accent)]/10 to-transparent rounded-xl p-6 border border-[var(--accent)]/20 flex flex-col justify-center items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-[var(--accent)]/20 rounded-full flex items-center justify-center text-[var(--accent)] mb-2">
                        <Music size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Upload New Music</h3>
                    <p className="text-white/60 max-w-sm">Keep your fans engaged by releasing new tracks regularly. Consistent uploads help you grow.</p>
                    <button
                        onClick={() => navigate('/upload')}
                        className="bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg hover:shadow-[var(--accent)]/30 scale-100 hover:scale-105"
                    >
                        Upload Now
                    </button>
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

            {/* Removed ArtistProfileModal */}

        </div>
    );
};

export default ArtistPanel;
