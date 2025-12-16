import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Music, Heart, Trash2, Play, Pause } from 'lucide-react';
import Swal from 'sweetalert2';
import { usePlayer } from '../context/PlayerContext';

const Profile = () => {
    const navigate = useNavigate();
    const { playTrack, currentTrack, isPlaying } = usePlayer();
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('likes'); // Default to Likes
    const [tracks, setTracks] = useState<any[]>([]);

    useEffect(() => {
        // Load user from localStorage
        const loadUser = async () => {
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                try {
                    const parsedUser = JSON.parse(savedUser);
                    setUser(parsedUser);

                    // Fetch tracks
                    const response = await fetch('http://127.0.0.1:8000/api/my-tracks');
                    const data = await response.json();
                    if (data.status === 'success') {
                        setTracks(data.tracks);
                    }
                } catch (e) {
                    console.error("Failed to parse user data or fetch tracks", e);
                }
            } else {
                navigate('/login');
            }
        };

        loadUser();

        // Listen for updates
        window.addEventListener('storage', loadUser);
        return () => window.removeEventListener('storage', loadUser);
    }, [navigate]);

    const handleDeleteAccount = async () => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this! Your profile and all data will be permanently deleted.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            background: '#1a1a1a',
            color: '#fff'
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://127.0.0.1:8000/api/delete-account', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ email: user.email })
                });

                if (response.ok) {
                    localStorage.removeItem('user');
                    window.dispatchEvent(new Event('storage'));

                    await Swal.fire({
                        title: 'Deleted!',
                        text: 'Your account has been deleted.',
                        icon: 'success',
                        background: '#1a1a1a',
                        color: '#fff'
                    });

                    navigate('/login');
                } else {
                    throw new Error('Failed to delete');
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to delete account. Please try again.',
                    background: '#1a1a1a',
                    color: '#fff'
                });
            }
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] relative overflow-x-hidden">
            {/* Background Gradients */}
            <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#1a1a1a] to-transparent pointer-events-none" />
            <div className="fixed -top-[200px] -right-[200px] w-[600px] h-[600px] bg-[var(--accent)]/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-5xl mx-auto pt-32 px-6 pb-20 relative z-10">

                {/* Profile Header Card */}
                <div className="bg-[var(--bg-card)]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 shadow-2xl">

                    {/* Avatar Group */}
                    <div className="relative group shrink-0">
                        <div className="absolute -inset-1 bg-gradient-to-br from-[var(--accent)] to-purple-600 rounded-full opacity-70 blur group-hover:opacity-100 transition-opacity duration-500" />
                        <img
                            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                            alt={user.name}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null; // Prevent infinite loop
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
                            }}
                            className="relative w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-[#121212] shadow-2xl bg-[#121212]"
                        />
                        {/* Status Indicator (Mock) */}
                        <div className="absolute bottom-2 right-2 w-6 h-6 bg-[var(--accent)] rounded-full border-4 border-[#121212] z-20" title="Online" />
                    </div>

                    {/* User Info */}
                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-1">{user.name}</h1>
                            <p className="text-white/40 font-medium text-lg">@{user.username || user.name?.toLowerCase().replace(/\s/g, '') || 'member'}</p>
                        </div>

                        {/* Bio Box */}
                        {user.bio && (
                            <div className="max-w-md mx-auto md:mx-0">
                                <p className="text-white/80 leading-relaxed italic text-sm md:text-base border-l-2 border-[var(--accent)] pl-4 py-1">
                                    "{user.bio}"
                                </p>
                            </div>
                        )}

                        {/* Metadata Pills */}
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                            {user.location && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs font-medium text-white/60">
                                    <MapPin size={14} className="text-[var(--accent)]" />
                                    {user.location}
                                </div>
                            )}
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs font-medium text-white/60">
                                <Calendar size={14} className="text-[var(--accent)]" />
                                Joined {user.joinedAt || user.joined_at || user.created_at ? new Date(user.joinedAt || user.joined_at || user.created_at).toLocaleDateString() : 'Recently'}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
                            <button
                                onClick={() => navigate('/edit-profile')}
                                className="px-6 py-2.5 bg-white text-black font-bold rounded-xl text-sm hover:bg-gray-200 transition-colors shadow-lg shadow-white/5"
                            >
                                Edit Profile
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                className="px-6 py-2.5 bg-red-500/10 text-red-500 font-bold rounded-xl text-sm border border-red-500/20 hover:bg-red-500/20 transition-all"
                            >
                                <div className="flex items-center gap-2">
                                    <Trash2 size={16} />
                                    Delete Account
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Tabs */}
                <div className="mt-12">
                    <div className="flex items-center gap-8 border-b border-white/10 pb-4 mb-8">
                        <button
                            onClick={() => setActiveTab('likes')}
                            className={`font-bold text-lg pb-4 -mb-4.5 transition-colors ${activeTab === 'likes' ? 'text-white border-b-2 border-[var(--accent)]' : 'text-white/40 hover:text-white'}`}
                        >
                            Liked Songs
                        </button>
                        <button
                            onClick={() => setActiveTab('playlists')}
                            className={`font-bold text-lg pb-4 -mb-4.5 transition-colors ${activeTab === 'playlists' ? 'text-white border-b-2 border-[var(--accent)]' : 'text-white/40 hover:text-white'}`}
                        >
                            Playlists
                        </button>
                        <button
                            onClick={() => setActiveTab('my_tracks')}
                            className={`font-bold text-lg pb-4 -mb-4.5 transition-colors ${activeTab === 'my_tracks' ? 'text-white border-b-2 border-[var(--accent)]' : 'text-white/40 hover:text-white'}`}
                        >
                            My Tracks
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        {activeTab === 'likes' && (
                            // Mock Likes
                            [1, 2, 3, 4, 5].map((item) => (
                                <div key={item} className="bg-[var(--bg-card)]/40 border border-white/5 rounded-2xl p-4 flex items-center gap-4 opacity-50 hover:bg-white/5 transition-all cursor-pointer group">
                                    <div className="w-12 h-12 bg-white/10 rounded-lg shrink-0 flex items-center justify-center">
                                        <Music size={20} className="text-white/20 group-hover:text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-sm">Liked Song #{item}</h3>
                                        <p className="text-xs text-white/40">Unknown Artist</p>
                                    </div>
                                    <Heart size={16} className="ml-auto text-[var(--accent)] fill-[var(--accent)]" />
                                </div>
                            ))
                        )}

                        {activeTab === 'playlists' && (
                            // Mock Playlists
                            [1, 2, 3].map((item) => (
                                <div key={item} className="bg-[var(--bg-card)]/40 border border-white/5 rounded-2xl p-4 opacity-70 hover:opacity-100 transition-all cursor-pointer grayscale hover:grayscale-0 group">
                                    <div className="aspect-square bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl mb-4 flex items-center justify-center group-hover:scale-[1.02] transition-transform">
                                        <span className="text-2xl font-bold text-white/20">#{item}</span>
                                    </div>
                                    <h3 className="font-bold text-white">Vibe Playlist #{item}</h3>
                                    <p className="text-xs text-white/40 mt-1">12 Songs • Updated yesterday</p>
                                </div>
                            ))
                        )}

                        {activeTab === 'my_tracks' && (
                            tracks.length > 0 ? (
                                tracks.map((track: any) => (
                                    <div key={track.id} className="bg-[var(--bg-card)]/40 border border-white/5 rounded-2xl p-4 hover:bg-white/5 transition-all group">
                                        <div
                                            className="aspect-square bg-white/5 rounded-xl mb-4 relative overflow-hidden cursor-pointer"
                                            onClick={() => playTrack(track)}
                                        >
                                            {track.cover_path ? (
                                                <img src={`http://127.0.0.1:8000/storage/${track.cover_path}`} alt={track.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                                    <Music size={48} className="text-white/20" />
                                                </div>
                                            )}

                                            {/* Play Overlay */}
                                            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${currentTrack?.id === track.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                <div className="w-12 h-12 bg-[var(--accent)] rounded-full flex items-center justify-center shadow-lg text-white hover:scale-110 transition-transform">
                                                    {currentTrack?.id === track.id && isPlaying ? (
                                                        <Pause size={20} fill="currentColor" />
                                                    ) : (
                                                        <Play size={20} fill="currentColor" className="ml-1" />
                                                    )}
                                                </div>
                                            </div>

                                            <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-xs font-bold bg-black/50 px-2 py-1 rounded backdrop-blur-md text-white">{track.analysis?.bpm ? Math.round(track.analysis.bpm) : '--'} BPM</span>
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-white truncate">{track.title}</h3>
                                        <p className="text-xs text-white/40 mt-1">{track.featured_artist || user.name}</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/5">
                                                {track.analysis?.primary_genre || 'Unknown'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-12 text-center text-white/30 italic">
                                    No tracks uploaded yet. Start by uploading your music!
                                </div>
                            )
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Profile;
