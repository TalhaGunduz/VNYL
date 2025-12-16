import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Music, Heart, Trash2, Play, Pause, MoreVertical, ListPlus, Share2, User, ListMusic, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { usePlayer } from '../context/PlayerContext';

const Profile = () => {
    const navigate = useNavigate();
    const { playTrack, currentTrack, isPlaying } = usePlayer();
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('likes'); // Default to Likes
    const [tracks, setTracks] = useState<any[]>([]);
    const [activeMenu, setActiveMenu] = useState<{ id: number, x: number, y: number, opensUp?: boolean, opensLeft?: boolean } | null>(null); // Track Menu State

    useEffect(() => {
        // Load user from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);

                // Load tracks (Mock or real API)
                const fetchTracks = async () => {
                    try {
                        const response = await fetch('http://127.0.0.1:8000/api/my-tracks', {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            }
                        });
                        const data = await response.json();
                        if (data.status === 'success') {
                            setTracks(data.tracks);
                        }
                    } catch (err) {
                        console.error("Failed to fetch tracks", err);
                    }
                };
                fetchTracks();

            } catch (e) {
                console.error("Failed to parse user data", e);
            }
        } else {
            navigate('/login');
        }
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

                {/* Dynamic Banner Background */}
                <div className="relative w-full h-[350px] rounded-t-3xl overflow-hidden group">
                    <div className="absolute inset-0 bg-[#121212]" />
                    <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                        alt="Banner"
                        className="w-full h-full object-cover opacity-60 blur-3xl scale-125 group-hover:scale-110 transition-transform duration-[10s] ease-in-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#121212]/50 to-[#121212]" />

                    {/* Floating Decorative Elements */}
                    <div className="absolute top-10 right-10 w-32 h-32 bg-[var(--accent)]/20 rounded-full blur-[40px] animate-pulse" />
                </div>

                {/* Main Profile Info Container */}
                <div className="relative -mt-32 px-8 pb-8 z-10 flex flex-col md:flex-row items-end gap-10">

                    {/* Avatar Group */}
                    <div className="relative shrink-0">
                        {/* Avatar Halo */}
                        <div className="absolute -inset-2 bg-gradient-to-tr from-[var(--accent)] to-purple-500 rounded-full opacity-0 md:opacity-100 blur-md animate-pulse" />

                        <div className="relative w-40 h-40 md:w-52 md:h-52 rounded-full p-1.5 bg-[#121212]">
                            <img
                                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                                alt={user.name}
                                className="w-full h-full rounded-full object-cover border-4 border-[#121212] shadow-2xl bg-[#1a1a1a]"
                            />

                            {/* Verification Badge (Mock) */}
                            <div className="absolute bottom-4 right-4 w-10 h-10 bg-blue-500 rounded-full border-4 border-[#121212] flex items-center justify-center text-white shadow-lg" title="Verified Artist">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.498 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.491 4.491 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* User Text Info */}
                    <div className="flex-1 text-center md:text-left pb-4 min-w-0 w-full">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-2 drop-shadow-xl">{user.name}</h1>
                                <p className="text-white/50 font-medium text-xl flex items-center justify-center md:justify-start gap-2">
                                    @{user.username || user.name?.toLowerCase().replace(/\s/g, '') || 'member'}
                                    <span className="w-1 h-1 rounded-full bg-white/30" />
                                    <span className="text-[var(--accent)]">Artist</span>
                                </p>
                            </div>

                            {/* Action Buttons - Desktop */}
                            <div className="hidden md:flex items-center gap-4">
                                <button
                                    onClick={() => navigate('/edit-profile')}
                                    className="px-8 py-3 bg-white text-black font-bold rounded-full text-base hover:bg-gray-200 hover:scale-105 transition-all shadow-xl shadow-white/5"
                                >
                                    Edit Profile
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    className="p-3 bg-white/5 text-white/40 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all border border-white/5"
                                    title="Delete Account"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Bio & Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 border-t border-white/5 pt-8">

                            {/* Bio Section */}
                            <div className="md:col-span-2 space-y-4">
                                {user.bio ? (
                                    <p className="text-white/80 leading-relaxed text-lg font-light">
                                        "{user.bio}"
                                    </p>
                                ) : (
                                    <p className="text-white/30 italic">No bio available yet.</p>
                                )}

                                <div className="flex flex-wrap gap-4 mt-4">
                                    {user.location && (
                                        <div className="flex items-center gap-2 text-white/50 text-sm">
                                            <MapPin size={16} className="text-[var(--accent)]" />
                                            {user.location}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-white/50 text-sm">
                                        <Calendar size={16} className="text-[var(--accent)]" />
                                        Joined {user.joinedAt || user.joined_at || user.created_at ? new Date(user.joinedAt || user.joined_at || user.created_at).toLocaleDateString() : 'Recently'}
                                    </div>
                                </div>
                            </div>

                            {/* Stats Section (Mock) */}
                            <div className="flex justify-center md:justify-end gap-8">
                                <div className="text-center">
                                    <div className="text-3xl font-black text-white">1.2K</div>
                                    <div className="text-xs uppercase tracking-widest text-white/40 font-bold mt-1">Followers</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-black text-white">84</div>
                                    <div className="text-xs uppercase tracking-widest text-white/40 font-bold mt-1">Following</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-black text-white">{activeTab === 'my_tracks' ? tracks.length : 12}</div>
                                    <div className="text-xs uppercase tracking-widest text-white/40 font-bold mt-1">Tracks</div>
                                </div>
                            </div>

                        </div>

                        {/* Mobile Action Buttons */}
                        <div className="flex md:hidden items-center justify-center gap-4 mt-8">
                            <button
                                onClick={() => navigate('/edit-profile')}
                                className="flex-1 py-3 bg-white text-black font-bold rounded-xl text-sm"
                            >
                                Edit Profile
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                className="p-3 bg-white/5 text-red-500 rounded-xl border border-white/5"
                            >
                                <Trash2 size={20} />
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
                                <div key={item} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-all cursor-pointer group relative overflow-hidden">
                                    {/* Hover Gradient Glow */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/0 via-[var(--accent)]/5 to-[var(--accent)]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />

                                    <div className="w-14 h-14 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shrink-0 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform relative">
                                        <Music size={22} className="text-white/40 group-hover:text-white transition-colors" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                                            <Play size={16} fill="white" className="text-white" />
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-white text-base truncate group-hover:text-[var(--accent)] transition-colors">Liked Song #{item}</h3>
                                        <p className="text-sm text-white/40 truncate">Unknown Artist</p>
                                    </div>
                                    <button className="ml-auto w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-[var(--accent)] transition-all transform hover:scale-110 active:scale-95">
                                        <Heart size={20} fill="currentColor" />
                                    </button>
                                </div>
                            ))
                        )}

                        {activeTab === 'playlists' && (
                            // Mock Playlists
                            [1, 2, 3].map((item) => (
                                <div key={item} className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:bg-white/10 transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-xl hover:shadow-[var(--accent)]/10">
                                    <div className="aspect-square bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden shadow-2xl">
                                        {/* Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />
                                        <span className="text-4xl font-black text-white/20 relative z-10">#{item}</span>
                                        <div className="absolute bottom-3 right-3 w-10 h-10 bg-[var(--accent)] rounded-full flex items-center justify-center shadow-lg translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                            <Play size={18} fill="white" className="text-white" />
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-white text-lg truncate group-hover:text-[var(--accent)] transition-colors">Vibe Playlist #{item}</h3>
                                    <p className="text-sm text-white/40 mt-1">12 Songs • Updated yesterday</p>
                                </div>
                            ))
                        )}

                        {activeTab === 'my_tracks' && (
                            tracks.length > 0 ? (
                                // Wrapper for Grid Layout to override the parent's generic column layout if needed,
                                // OR simply render map items if the parent is already a grid.
                                // Looking at line 263: <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                // The parent is 3 cols on LG. User wants 4 or 5.
                                // We should probably Portal out or change the parent class dynamically?
                                // EASIER: Just use a nested full-width col-span-full grid here.
                                <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
                                    {tracks.length > 0 ? (
                                        tracks.map((track: any) => (
                                            <div key={track.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:bg-white/10 transition-all group hover:-translate-y-2 hover:shadow-2xl hover:shadow-[var(--accent)]/10 cursor-pointer">
                                                <div
                                                    className="aspect-square bg-white/5 rounded-xl mb-4 relative overflow-hidden shadow-lg group-hover:shadow-2xl group-hover:shadow-black/50 transition-all transform-gpu"
                                                    onClick={() => playTrack(track)}
                                                >
                                                    {track.cover_path ? (
                                                        <img src={`http://127.0.0.1:8000/storage/${track.cover_path}`} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                                            <Music size={48} className="text-white/20" />
                                                        </div>
                                                    )}

                                                    {/* Gradient Overlay for Text Readability */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                                                    {/* Play Button - New Style (Glass Squircle) */}
                                                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${currentTrack?.id === track.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100'}`}>
                                                        <div className="w-14 h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-[18px] flex items-center justify-center shadow-2xl text-white hover:bg-white/20 hover:scale-105 transition-all cursor-pointer">
                                                            {currentTrack?.id === track.id && isPlaying ? (
                                                                <Pause size={22} fill="white" className="drop-shadow-lg" />
                                                            ) : (
                                                                <Play size={22} fill="white" className="ml-1 drop-shadow-lg" />
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Top Right: Remove Genre Label (Requested) */}

                                                    {/* Bottom Left: BPM */}
                                                    <div className="absolute bottom-3 left-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity delay-75">
                                                        {track.analysis?.bpm && (
                                                            <span className="text-[10px] font-bold text-white/80 drop-shadow-md">
                                                                {Math.round(track.analysis.bpm)} BPM
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Bottom Right: Duration (New) */}
                                                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity delay-75">
                                                        <span className="text-xs font-medium text-white/90 tracking-wide drop-shadow-md font-mono">
                                                            {track.analysis?.duration ? new Date(track.analysis.duration * 1000).toISOString().substr(14, 5) : (track.duration_formatted || '03:42')}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="space-y-1 relative">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h3 className="font-bold text-white truncate text-base group-hover:text-[var(--accent)] transition-colors" title={track.title}>
                                                            {track.title}
                                                        </h3>

                                                        {/* Context Menu Button */}
                                                        <button
                                                            className={`text-white/20 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10 ${activeMenu?.id === track.id ? 'text-white opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                const menuWidth = 224; // w-56
                                                                const menuHeight = 190; // Approx height
                                                                const scrollX = window.scrollX;
                                                                const scrollY = window.scrollY;

                                                                const isOnRightHalf = rect.left > window.innerWidth / 2;
                                                                const isOnBottomHalf = rect.top > window.innerHeight * 0.6; // Bias slightly to bottom

                                                                setActiveMenu(activeMenu?.id === track.id ? null : {
                                                                    id: track.id,
                                                                    // X: If right side, align right edge. Else align left edge.
                                                                    x: isOnRightHalf ? (rect.right + scrollX - menuWidth) : (rect.left + scrollX),
                                                                    // Y: If bottom side, open upwards. Else open downwards.
                                                                    y: isOnBottomHalf ? (rect.top + scrollY - menuHeight - 8) : (rect.bottom + scrollY + 8),

                                                                    // Tracking direction for transform origin (optional but nice)
                                                                    opensUp: isOnBottomHalf,
                                                                    opensLeft: isOnRightHalf
                                                                });
                                                            }}
                                                        >
                                                            <MoreVertical size={18} />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {track.analysis?.explicit && (
                                                            <span className="text-[9px] border border-white/20 px-1 rounded text-white/50" title="Explicit">E</span>
                                                        )}
                                                        <p className="text-xs text-white/40 truncate flex-1 hover:text-white/60 transition-colors">{track.featured_artist || user.name}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-24 text-center flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
                                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 animate-pulse">
                                                <Music size={32} className="text-white/20" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-2">No Tracks Uploaded</h3>
                                            <p className="text-white/40 max-w-sm mx-auto mb-6">Your discography starts here. Upload your first masterpiece to show it to the world.</p>
                                            <button onClick={() => navigate('/upload')} className="px-8 py-3 bg-[var(--accent)] text-white font-bold rounded-xl hover:scale-105 transition-transform shadow-xl shadow-[var(--accent)]/10 hover:shadow-[var(--accent)]/30">
                                                Start Uploading
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="col-span-full py-20 text-center flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                        <Music size={32} className="text-white/20" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">No Tracks Yet</h3>
                                    <p className="text-white/40 max-w-sm mx-auto mb-6">Upload your first track to start building your discography.</p>
                                    <button onClick={() => navigate('/upload')} className="px-6 py-2.5 bg-[var(--accent)] text-white font-bold rounded-xl hover:scale-105 transition-transform shadow-lg shadow-[var(--accent)]/20">
                                        Upload Now
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                </div>

            </div>

            {/* Global Context Menu (Rendered at Root with Absolute Positioning) */}
            {activeMenu && (
                <>
                    <div className="fixed inset-0 z-[9998]" onClick={() => setActiveMenu(null)} />
                    <div
                        className="absolute z-[9999] w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                        style={{
                            top: activeMenu.y,
                            left: activeMenu.x,
                            transformOrigin: activeMenu.opensUp ? (activeMenu.opensLeft ? 'bottom right' : 'bottom left') : (activeMenu.opensLeft ? 'top right' : 'top left')
                        }}
                    >
                        <div className="p-1 space-y-0.5">
                            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left">
                                <ListPlus size={16} />
                                Add to Queue
                            </button>
                            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left">
                                <ListMusic size={16} />
                                Add to Playlist
                            </button>
                            <div className="h-px bg-white/5 my-1" />
                            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left">
                                <User size={16} />
                                Go to Artist
                            </button>
                            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left">
                                <Share2 size={16} />
                                Share
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Profile;
