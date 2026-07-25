import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Play,
    Heart,
    TrendingUp,
    Calendar,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    ListMusic,
    Zap,
    Trophy
} from 'lucide-react';
import { motion } from 'framer-motion';

interface DailyStat {
    date: string;
    plays: number;
}

interface TrackData {
    id: number;
    title: string;
    cover_path: string;
    plays: number;
    likes_count: number;
}

interface StatsData {
    total_plays: number;
    plays_today: number;
    plays_yesterday: number;
    growth: number;
    monthly_plays: number;
    peak_plays: number;
    peak_date: string | null;
    daily_history: DailyStat[];
    likes: number;
    playlist_additions: number;
}

const TrackAnalytics = () => {
    const { trackId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [track, setTrack] = useState<TrackData | null>(null);
    const [stats, setStats] = useState<StatsData | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:8000/api/tracks/${trackId}/stats`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setTrack(data.track);
                    setStats(data.stats);
                }
            } catch (error) {
                console.error('Failed to fetch track stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [trackId]);

    if (loading) return (
        <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-white/50 animate-pulse">
            Loading Real-time Analytics...
        </div>
    );

    if (!track || !stats) return (
        <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-white">
            Track data not found.
        </div>
    );

    const maxPlays = Math.max(...stats.daily_history.map(d => d.plays), 10);

    return (
        <div className="min-h-screen bg-[var(--bg)] text-white p-6 md:p-10 max-w-7xl mx-auto pb-32">
            {/* Header */}
            <header className="flex items-center gap-4 mb-10">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/5"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold tracking-tight">Track Analytics</h1>
            </header>

            {/* Track Hero Card */}
            <div className="bg-[#18181b] rounded-3xl p-8 mb-8 border border-white/5 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--accent)]/5 blur-[100px] rounded-full pointer-events-none" />

                <div className="w-48 h-48 rounded-2xl overflow-hidden shadow-2xl shrink-0 border border-white/10">
                    <img
                        src={track.cover_path ? `http://127.0.0.1:8000/storage/${track.cover_path}` : 'https://via.placeholder.com/400'}
                        className="w-full h-full object-cover"
                        alt={track.title}
                    />
                </div>

                <div className="flex-1 text-center md:text-left z-10">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] bg-[var(--accent)]/10 px-3 py-1 rounded-full border border-[var(--accent)]/10">
                            Verified Stats
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black mb-3 tracking-tighter">{track.title}</h2>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-white/40">
                        <div className="flex items-center gap-2">
                            <Calendar size={18} />
                            <span>Track Overview</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Play size={18} />
                            <span>{stats.total_plays.toLocaleString()} Lifetime Plays</span>
                        </div>
                        <div className="flex items-center gap-2 text-red-500">
                            <Heart size={18} fill="currentColor" />
                            <span>{stats.likes.toLocaleString()} Engagements</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Plays Today */}
                <div className="bg-[#18181b]/50 border border-white/5 p-6 rounded-3xl">
                    <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Zap size={14} className="text-yellow-500" /> Plays Today
                    </p>
                    <div className="flex items-end justify-between">
                        <h3 className="text-3xl font-black">{stats.plays_today.toLocaleString()}</h3>
                        <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${stats.growth >= 0 ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                            {stats.growth >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                            {Math.abs(stats.growth)}%
                        </div>
                    </div>
                </div>

                {/* Monthly Plays */}
                <div className="bg-[#18181b]/50 border border-white/5 p-6 rounded-3xl">
                    <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                        <TrendingUp size={14} className="text-[var(--accent)]" /> Last 7 Days
                    </p>
                    <h3 className="text-3xl font-black">{stats.monthly_plays.toLocaleString()}</h3>
                    <p className="text-white/20 text-[10px] mt-1">Total plays this week</p>
                </div>

                {/* Total Favorites */}
                <div className="bg-[#18181b]/50 border border-white/5 p-6 rounded-3xl">
                    <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Heart size={14} className="text-red-500" /> Favorites
                    </p>
                    <h3 className="text-3xl font-black">{stats.likes.toLocaleString()}</h3>
                    <p className="text-white/20 text-[10px] mt-1">Total hearts received</p>
                </div>

                {/* Playlist Count */}
                <div className="bg-[#18181b]/50 border border-white/5 p-6 rounded-3xl">
                    <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                        <ListMusic size={14} className="text-blue-500" /> Playlists
                    </p>
                    <h3 className="text-3xl font-black">{stats.playlist_additions.toLocaleString()}</h3>
                    <p className="text-white/20 text-[10px] mt-1">Added to collections</p>
                </div>
            </div>

            {/* Performance Highlight & Graph */}
            <div className="grid lg:grid-cols-3 gap-6 mb-12">
                <div className="lg:col-span-2 bg-[#18181b] border border-white/10 rounded-3xl p-8 relative overflow-hidden group/chart">
                    {/* Background Glow */}
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[var(--accent)]/5 blur-[100px] rounded-full pointer-events-none group-hover/chart:bg-[var(--accent)]/10 transition-all duration-1000" />

                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <div>
                            <h3 className="text-xl font-black flex items-center gap-2">
                                <TrendingUp className="text-[var(--accent)]" />
                                Participation History
                            </h3>
                            <p className="text-white/40 text-sm">Real-time daily engagement trends</p>
                        </div>
                        <div className="bg-white/5 px-4 py-1.5 rounded-xl border border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/60">
                            7 Day Overview
                        </div>
                    </div>

                    <div className="h-72 relative px-4">
                        {/* Horizontal Grid Lines */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 py-2">
                            {[100, 75, 50, 25, 0].map((percent) => (
                                <div key={percent} className="w-full border-t border-dashed border-white/10 relative">
                                    <span className="absolute -left-10 -top-2 text-[9px] font-mono text-white/20">{percent}%</span>
                                </div>
                            ))}
                        </div>

                        <div className="h-full flex items-end justify-center gap-4 md:gap-8 relative z-10">
                            {stats.daily_history.length > 0 ? stats.daily_history.map((d, i) => (
                                <div key={i} className="flex-1 max-w-[32px] h-full flex flex-col items-center justify-end gap-3 group relative transition-all duration-300">
                                    {/* Tooltip */}
                                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white text-black px-3 py-2 rounded-xl text-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-30 shadow-[0_10px_30px_rgba(255,255,255,0.3)] scale-75 group-hover:scale-100 mb-2 min-w-[110px]">
                                        <div className="text-[9px] font-bold text-black/40 uppercase tracking-widest leading-none mb-1">
                                            {new Date(d.date).toLocaleDateString('en-US', { weekday: 'long' })}
                                        </div>
                                        <div className="text-sm font-black flex items-center justify-center gap-1.5">
                                            <Play size={10} fill="black" /> {d.plays.toLocaleString()}
                                        </div>
                                        <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white rotate-45" />
                                    </div>

                                    {/* Bar Container */}
                                    <div
                                        className={`w-full relative rounded-full transition-all duration-500 overflow-hidden backdrop-blur-sm ${d.plays === stats.peak_plays && d.plays > 0
                                            ? 'bg-gradient-to-t from-[var(--accent)] via-[var(--accent)] to-[#ff8e8e] shadow-[0_0_30px_rgba(239,68,68,0.5)]'
                                            : 'bg-[var(--accent)]/15 group-hover:bg-[var(--accent)] shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                                            }`}
                                        style={{
                                            height: `${Math.max((d.plays / (maxPlays || 1)) * 100, 10)}%`,
                                        }}
                                    >
                                        {/* Glossy Overlay */}
                                        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

                                        {/* Animated Shine for Peak */}
                                        {d.plays === stats.peak_plays && d.plays > 0 && (
                                            <motion.div
                                                animate={{ y: [200, -200] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                                className="absolute inset-x-0 bg-gradient-to-t from-transparent via-white/40 to-transparent h-20"
                                            />
                                        )}
                                    </div>

                                    {/* Label */}
                                    <div className="h-8 flex flex-col items-center justify-center">
                                        <span className={`text-[10px] font-black tracking-widest ${d.plays === stats.peak_plays && d.plays > 0 ? 'text-[var(--accent)]' : 'text-white/20 group-hover:text-[var(--accent)]'} transition-all duration-300`}>
                                            {new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                                        </span>
                                        <span className={`text-[9px] font-mono mt-0.5 ${d.plays === stats.peak_plays && d.plays > 0 ? 'text-[var(--accent)]/50' : 'text-white/10 group-hover:text-white/30'}`}>
                                            {new Date(d.date).getDate().toString().padStart(2, '0')}
                                        </span>
                                    </div>
                                </div>
                            )) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-white/10 gap-4">
                                    <BarChart3 size={48} />
                                    <p className="font-black text-sm uppercase tracking-widest">No Activity Recorded</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Peak Performance Card */}
                <div className="bg-gradient-to-br from-[#18181b] to-black border border-white/5 p-8 rounded-3xl flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                        <Trophy size={48} className="text-[var(--accent)] opacity-10" />
                    </div>
                    <p className="text-white/40 text-sm font-bold uppercase tracking-wider mb-6">All-Time Peak</p>
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-5xl font-black text-white">{stats.peak_plays.toLocaleString()}</h4>
                            <p className="text-[var(--accent)] text-xs font-bold mt-1 uppercase tracking-widest">Plays in a single day</p>
                        </div>
                        <div className="pt-4 border-t border-white/5">
                            <p className="text-white/40 text-xs mb-1">Achieved on</p>
                            <p className="text-white font-bold">{stats.peak_date ? new Date(stats.peak_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrackAnalytics;
