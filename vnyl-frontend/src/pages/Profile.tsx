import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Music, Heart, Trash2, Play, Pause, MoreVertical, ListPlus, Share2, User, ListMusic, X, Lock, Globe } from 'lucide-react';
import Swal from 'sweetalert2';
import { usePlayer } from '../context/PlayerContext';
import AddToPlaylistModal from '../components/AddToPlaylistModal';
import PlaylistModal from '../components/PlaylistModal';

const Profile = () => {
    const navigate = useNavigate();
    const { playTrack, currentTrack, isPlaying } = usePlayer();
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('likes'); // Default to Likes
    const [tracks, setTracks] = useState<any[]>([]); // Uploaded tracks
    const [likedTracks, setLikedTracks] = useState<any[]>([]); // Liked tracks
    const [playlists, setPlaylists] = useState<any[]>([]); // Playlists
    const [activeMenu, setActiveMenu] = useState<{ id: number, x: number, y: number, opensUp?: boolean, opensLeft?: boolean } | null>(null); // Track Menu State
    const [addToPlaylistTrackId, setAddToPlaylistTrackId] = useState<number | null>(null); // Add to Playlist Modal State
    const [isCreatePlaylistModalOpen, setIsCreatePlaylistModalOpen] = useState(false);

    const fetchTracks = async () => {
        try {
            let endpoint = '';
            if (activeTab === 'likes') endpoint = 'my-likes';
            else if (activeTab === 'my_tracks') endpoint = 'tracks';
            else if (activeTab === 'playlists') endpoint = 'playlists';
            else if (activeTab === 'vnyl_picks') endpoint = 'users/1/tracks'; // Fetching User 1 (VNYL) tracks for this tab

            if (!endpoint) return;

            const response = await fetch(`http://127.0.0.1:8000/api/${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (data.status === 'success') {
                if (activeTab === 'likes') {
                    setLikedTracks(data.tracks);
                } else if (activeTab === 'playlists') {
                    setPlaylists(data.playlists);
                } else {
                    setTracks(data.tracks);
                }
            }
        } catch (err) {
            console.error("Failed to fetch data", err);
        }
    };

    const handleCreatePlaylist = async (title: string, description: string, isPublic: boolean) => {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/playlists', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    description,
                    is_public: isPublic
                })
            });
            const data = await response.json();
            if (data.status === 'success') {
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000,
                    background: 'rgba(20, 20, 20, 0.9)',
                    color: '#fff',
                    customClass: { popup: 'backdrop-blur-md border border-white/10' }
                });
                Toast.fire({ icon: 'success', title: 'Playlist Created' });
                fetchTracks(); // Refresh
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddToPlaylist = (trackId: number) => {
        setAddToPlaylistTrackId(trackId);
        setActiveMenu(null);
    };



    useEffect(() => {
        // Load user from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                fetchTracks();
            } catch (e) {
                console.error("Failed to parse user data", e);
            }
        } else {
            navigate('/login');
        }
    }, [navigate, activeTab]);

    const handleToggleLike = async (trackId: number) => {


        try {
            const response = await fetch(`http://127.0.0.1:8000/api/tracks/${trackId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();

            if (data.status === 'success') {
                // Optimistic Update
                const updateList = (list: any[]) => list.map(t =>
                    t.id === trackId ? { ...t, is_liked: data.liked, likes_count: data.total_likes } : t
                );

                setTracks(prev => updateList(prev));
                setLikedTracks(prev => {
                    // If we unliked it and we are in likes tab, maybe remove it? 
                    // Or just keep it as unliked until refresh? "Simple" -> distinct heart state.
                    // The requirement says: "If (user_id, track_id) exists → delete it (unlike)". 
                    // If I am in 'Liked Tracks' tab and I unlike a song, it should probably disappear or just show unliked state?
                    // Standard behavior: show unliked state, disappear on refresh/re-visit.
                    return updateList(prev);
                });

                // If it was a like (true), and we are not in likes tab, we should probably add it to likedTracks?
                // Or just re-fetch is safer/easier. 
                if (data.liked && activeTab !== 'likes') {
                    // Optionally fetch/update liked tracks in background
                    // fetchTracks(); 
                } else if (!data.liked && activeTab === 'likes') {
                    // Removing from list instantly for snappy feel?
                    setLikedTracks(prev => prev.filter(t => t.id !== trackId));
                }
            }
        } catch (error) {
            console.error("Error toggling like", error);
        }
    };
    const handleDeleteAccount = async () => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this! Your profile and all data will be permanently deleted.",
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
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
                                }}
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
                                        Joined {user.joinedAt || user.joined_at || user.created_at ? new Date((user.joinedAt || user.joined_at || user.created_at).replace(' ', 'T')).toLocaleDateString() : 'Recently'}
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
                        <button
                            onClick={() => setActiveTab('vnyl_picks')}
                            className={`font-bold text-lg pb-4 -mb-4.5 transition-colors ${activeTab === 'vnyl_picks' ? 'text-white border-b-2 border-[var(--accent)]' : 'text-white/40 hover:text-white'}`}
                        >
                            VNYL Selections
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        {activeTab === 'likes' && (
                            likedTracks.length > 0 ? (
                                <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
                                    {likedTracks.map((track: any) => (
                                        <div
                                            key={track.id}
                                            className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:bg-white/10 transition-all group hover:-translate-y-2 hover:shadow-2xl hover:shadow-[var(--accent)]/10 cursor-pointer"
                                            onClick={() => playTrack(track)}
                                        >
                                            <div
                                                className="aspect-square bg-white/5 rounded-xl mb-4 relative overflow-hidden shadow-lg group-hover:shadow-2xl group-hover:shadow-black/50 transition-all transform-gpu"
                                            >
                                                {track.cover_image || track.cover_path ? (
                                                    <img src={track.cover_image || `http://127.0.0.1:8000/storage/${track.cover_path}`} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                                        <Music size={48} className="text-white/20" />
                                                    </div>
                                                )}

                                                {/* Gradient Overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                                                {/* Play Button - Lower Z, pointer-events-none container */}
                                                <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 z-10 pointer-events-none ${currentTrack?.id === track.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100'}`}>
                                                    <div className="w-14 h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-[18px] flex items-center justify-center shadow-2xl text-white hover:bg-white/20 hover:scale-105 transition-all cursor-pointer pointer-events-auto">
                                                        {currentTrack?.id === track.id && isPlaying ? (
                                                            <Pause size={22} fill="white" className="drop-shadow-lg" />
                                                        ) : (
                                                            <Play size={22} fill="white" className="ml-1 drop-shadow-lg" />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Like Button (Top Right) - Higher Z */}
                                                <button
                                                    className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-200 transform hover:scale-110 z-20 ${track.is_liked ? 'bg-red-500/20 text-red-500' : 'bg-black/20 text-white/70 hover:bg-black/40 hover:text-white'}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleLike(track.id);
                                                    }}
                                                >
                                                    <Heart size={18} fill={track.is_liked ? "currentColor" : "none"} className={`drop-shadow-md ${track.is_liked ? 'animate-in zoom-in spin-in-12 duration-300' : ''}`} />
                                                </button>

                                                {/* Duration (Bottom Right) */}
                                                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity delay-75 pointer-events-none">
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
                                                    {/* Context Menu Button - Simplified */}
                                                    <button className="text-white/20 hover:text-white transition-colors p-1" onClick={(e) => { e.stopPropagation(); /* Menu logic here if needed, or reuse */ }}>
                                                        <MoreVertical size={18} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs text-white/40 truncate flex-1 hover:text-white/60 transition-colors">{track.featured_artist || track.artist?.name || "Unknown Artist"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="col-span-full py-24 text-center flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 animate-pulse">
                                        <Heart size={32} className="text-white/20" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">No Liked Tracks</h3>
                                    <p className="text-white/40 max-w-sm mx-auto">Start exploring and like some tracks to see them here.</p>
                                </div>
                            )
                        )}

                        {activeTab === 'playlists' && (
                            <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                {/* Create New Playlist Card */}
                                <div
                                    onClick={() => setIsCreatePlaylistModalOpen(true)}
                                    className="aspect-square bg-white/5 border border-white/5 border-dashed rounded-2xl flex flex-col items-center justify-center hover:bg-white/10 transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-xl hover:shadow-[var(--accent)]/10"
                                >
                                    <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <ListPlus size={28} className="text-white/40 group-hover:text-white" />
                                    </div>
                                    <h3 className="font-bold text-white text-base">Create</h3>
                                    <p className="text-xs text-white/40 mt-0.5">New Playlist</p>
                                </div>

                                {/* Create Modal */}
                                <PlaylistModal
                                    mode="create"
                                    isOpen={isCreatePlaylistModalOpen}
                                    onClose={() => setIsCreatePlaylistModalOpen(false)}
                                    onSave={handleCreatePlaylist}
                                />

                                {/* Real Playlists */}
                                {playlists.map((playlist: any) => (
                                    <div key={playlist.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:bg-white/10 transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-xl hover:shadow-[var(--accent)]/10" onClick={() => navigate(`/playlists/${playlist.id}`)}>
                                        <div className="aspect-square bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden shadow-2xl">
                                            {/* Gradient Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />
                                            {/* Placeholder Art */}
                                            <div className="absolute inset-0 grid grid-cols-2 gap-0.5 opacity-50">
                                                <div className="bg-white/10"></div>
                                                <div className="bg-white/5"></div>
                                                <div className="bg-white/5"></div>
                                                <div className="bg-white/10"></div>
                                            </div>

                                            <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur-md z-20">
                                                {!playlist.is_public ? <Lock size={12} className="text-white/70" /> : <Globe size={12} className="text-white/70" />}
                                            </div>

                                            <span className="text-3xl font-black text-white/20 relative z-10 uppercase">{playlist.title.substring(0, 2)}</span>

                                            <div className="absolute bottom-3 right-3 w-10 h-10 bg-[var(--accent)] rounded-full flex items-center justify-center shadow-lg translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                                <Play size={18} fill="white" className="text-white" />
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-white text-base truncate group-hover:text-[var(--accent)] transition-colors">{playlist.title}</h3>
                                        <p className="text-xs text-white/40 mt-1">{playlist.tracks_count || 0} Songs</p>
                                    </div>
                                ))}
                            </div>
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
                                            <div
                                                key={track.id}
                                                className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:bg-white/10 transition-all group hover:-translate-y-2 hover:shadow-2xl hover:shadow-[var(--accent)]/10 cursor-pointer"
                                                onClick={() => playTrack(track)}
                                            >
                                                <div
                                                    className="aspect-square bg-white/5 rounded-xl mb-4 relative overflow-hidden shadow-lg group-hover:shadow-2xl group-hover:shadow-black/50 transition-all transform-gpu"
                                                >
                                                    {track.cover_image || track.cover_path ? (
                                                        <img src={track.cover_image || `http://127.0.0.1:8000/storage/${track.cover_path}`} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                                            <Music size={48} className="text-white/20" />
                                                        </div>
                                                    )}

                                                    {/* Gradient Overlay for Text Readability */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                                                    {/* Play Button - New Style (Glass Squircle) */}
                                                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 z-10 pointer-events-none ${currentTrack?.id === track.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100'}`}>
                                                        <div className="w-14 h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-[18px] flex items-center justify-center shadow-2xl text-white hover:bg-white/20 hover:scale-105 transition-all cursor-pointer pointer-events-auto">
                                                            {currentTrack?.id === track.id && isPlaying ? (
                                                                <Pause size={22} fill="white" className="drop-shadow-lg" />
                                                            ) : (
                                                                <Play size={22} fill="white" className="ml-1 drop-shadow-lg" />
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Like Button (Top Right) */}
                                                    <button
                                                        className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-200 transform hover:scale-110 z-20 ${track.is_liked ? 'bg-red-500/20 text-red-500' : 'bg-black/20 text-white/70 hover:bg-black/40 hover:text-white'}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleLike(track.id);
                                                        }}
                                                    >
                                                        <Heart size={18} fill={track.is_liked ? "currentColor" : "none"} className={`drop-shadow-md ${track.is_liked ? 'animate-in zoom-in spin-in-12 duration-300' : ''}`} />
                                                    </button>

                                                    {/* Bottom Left: BPM */}
                                                    <div className="absolute bottom-3 left-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity delay-75 pointer-events-none">
                                                        {track.analysis?.bpm && (
                                                            <span className="text-[10px] font-bold text-white/80 drop-shadow-md">
                                                                {Math.round(track.analysis.bpm)} BPM
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Bottom Right: Duration (New) */}
                                                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity delay-75 pointer-events-none">
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

                        {activeTab === 'vnyl_picks' && (
                            tracks.length > 0 ? (
                                <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
                                    {tracks.map((track: any) => (
                                        <div
                                            key={track.id}
                                            className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:bg-white/10 transition-all group hover:-translate-y-2 hover:shadow-2xl hover:shadow-[var(--accent)]/10 cursor-pointer"
                                            onClick={() => playTrack(track)}
                                        >
                                            <div
                                                className="aspect-square bg-white/5 rounded-xl mb-4 relative overflow-hidden shadow-lg group-hover:shadow-2xl group-hover:shadow-black/50 transition-all transform-gpu"
                                            >
                                                {track.cover_image || track.cover_path ? (
                                                    <img src={track.cover_image || `http://127.0.0.1:8000/storage/${track.cover_path}`} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                                        <Music size={48} className="text-white/20" />
                                                    </div>
                                                )}

                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                                                <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 z-10 pointer-events-none ${currentTrack?.id === track.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100'}`}>
                                                    <div className="w-14 h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-[18px] flex items-center justify-center shadow-2xl text-white hover:bg-white/20 hover:scale-105 transition-all cursor-pointer pointer-events-auto">
                                                        {currentTrack?.id === track.id && isPlaying ? (
                                                            <Pause size={22} fill="white" className="drop-shadow-lg" />
                                                        ) : (
                                                            <Play size={22} fill="white" className="ml-1 drop-shadow-lg" />
                                                        )}
                                                    </div>
                                                </div>

                                                <button
                                                    className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-200 transform hover:scale-110 z-20 ${track.is_liked ? 'bg-red-500/20 text-red-500' : 'bg-black/20 text-white/70 hover:bg-black/40 hover:text-white'}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleLike(track.id);
                                                    }}
                                                >
                                                    <Heart size={18} fill={track.is_liked ? "currentColor" : "none"} className={`drop-shadow-md ${track.is_liked ? 'animate-in zoom-in spin-in-12 duration-300' : ''}`} />
                                                </button>

                                                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity delay-75 pointer-events-none">
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
                                                    <button className="text-white/20 hover:text-white transition-colors p-1" onClick={(e) => { e.stopPropagation(); }}>
                                                        <MoreVertical size={18} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs text-white/40 truncate flex-1 hover:text-white/60 transition-colors">{track.featured_artist || "VNYL Selection"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="col-span-full py-24 text-center flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 animate-pulse">
                                        <Music size={32} className="text-white/20" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">No Selections Available</h3>
                                    <p className="text-white/40 max-w-sm mx-auto">VNYL hasn't selected any tracks yet. Check back soon.</p>
                                </div>
                            )
                        )}
                    </div>
                </div>

            </div>

            {/* Global Context Menu (Rendered at Root with Absolute Positioning) */}
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
                            {/* Find the track object to check like status */}
                            {(() => {
                                const menuTrack = (activeTab === 'likes' ? likedTracks : tracks).find(t => t.id === activeMenu.id);
                                if (!menuTrack) return null;

                                return (
                                    <button
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left"
                                        onClick={() => {
                                            handleToggleLike(menuTrack.id);
                                            setActiveMenu(null);
                                        }}
                                    >
                                        <Heart size={16} fill={menuTrack.is_liked ? "currentColor" : "none"} className={menuTrack.is_liked ? "text-red-500" : ""} />
                                        {menuTrack.is_liked ? "Remove from Queue" : "Like Song"}
                                    </button>
                                );
                            })()}

                            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left">
                                <ListPlus size={16} />
                                Add to Queue
                            </button>
                            <button
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left"
                                onClick={() => {
                                    if (activeMenu) {
                                        handleAddToPlaylist(activeMenu.id);
                                    }
                                }}
                            >
                                <ListMusic size={16} />
                                Add to Playlist
                            </button>
                            <div className="h-px bg-white/5 my-1" />
                            <button
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left"
                                onClick={() => {
                                    // Find track again or use passed ID
                                    const menuTrack = (activeTab === 'likes' ? likedTracks : tracks).find(t => t.id === activeMenu.id);
                                    if (menuTrack && menuTrack.artist?.slug) {
                                        navigate(`/artist/${menuTrack.artist.slug}`);
                                    } else if (menuTrack && menuTrack.user?.username) {
                                        // Fallback to user profile if no artist slug? Or just nothing.
                                        // Current logic suggests tracks have artist relation.
                                        console.warn("No artist slug found for track");
                                    }
                                    setActiveMenu(null);
                                }}
                            >
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

            {/* Custom Add to Playlist Modal */}
            <AddToPlaylistModal
                trackId={addToPlaylistTrackId}
                onClose={() => setAddToPlaylistTrackId(null)}
            />
        </div>
    );
};

export default Profile;
