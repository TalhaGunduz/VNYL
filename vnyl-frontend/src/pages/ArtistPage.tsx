
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, ArrowLeft, MoreHorizontal, Heart, Check, Users, MapPin, Calendar, Music, Instagram, Youtube, Globe, Share2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import Swal from 'sweetalert2';

const ArtistPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();

    const [artist, setArtist] = useState<any>(null);
    const [tracks, setTracks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [visibleCount, setVisibleCount] = useState(10);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            try {
                setCurrentUser(JSON.parse(stored));
            } catch (e) { }
        }
    }, []);

    useEffect(() => {
        const fetchArtist = async () => {
            try {
                // Fetch Profile
                const res = await fetch(`http://127.0.0.1:8000/api/artists/${slug}`);
                const data = await res.json();

                if (data.status === 'success') {
                    setArtist(data.artist);
                    if (data.artist.user_id) {
                        checkFollowStatus(data.artist.user_id);
                        setFollowersCount(data.artist.user?.followers_count || 0);
                    }
                }

                // Fetch Tracks
                const token = localStorage.getItem('token');
                const resTracks = await fetch(`http://127.0.0.1:8000/api/artists/${slug}/tracks`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });
                const dataTracks = await resTracks.json();
                if (dataTracks.status === 'success') {
                    // Sort by plays descending
                    const sortedTracks = dataTracks.tracks.sort((a: any, b: any) => (b.plays || 0) - (a.plays || 0));

                    // Inject artist info into tracks so the Player context knows who the artist is
                    const tracksWithArtist = sortedTracks.map((t: any) => ({
                        ...t,
                        artist: t.artist || {
                            id: data.artist.id,
                            stage_name: data.artist.stage_name,
                            slug: data.artist.slug,
                            avatar: data.artist.avatar
                        }
                    }));

                    setTracks(tracksWithArtist);
                }
            } catch (err) {
                console.error("Failed to load artist", err);
            } finally {
                setLoading(false);
            }
        };

        if (slug) fetchArtist();
    }, [slug]);

    const checkFollowStatus = async (userId: number) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await fetch(`http://127.0.0.1:8000/api/users/${userId}/is-following`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status === 'success') {
                setIsFollowing(data.is_following);
            }
        } catch (e) {
            console.error("Failed to check follow status", e);
        }
    };

    const handleToggleLike = async (trackId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire({
                title: 'Giriş Gerekli',
                text: 'Şarkıları beğenmek için giriş yapmalısınız.',
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Giriş Yap',
                cancelButtonText: 'İptal',
                background: '#161616',
                color: '#fff',
                confirmButtonColor: '#FF6B00',
                cancelButtonColor: '#333',
                customClass: {
                    popup: 'rounded-[24px]',
                    confirmButton: 'rounded-full px-6 py-2',
                    cancelButton: 'rounded-full px-6 py-2'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    navigate('/login');
                }
            });
            return;
        }

        try {
            const res = await fetch(`http://127.0.0.1:8000/api/tracks/${trackId}/like`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.dispatchEvent(new Event('storage'));
                Swal.fire({
                    title: 'Giriş Gerekli',
                    text: 'Şarkıları beğenmek için giriş yapmalısınız.',
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonText: 'Giriş Yap',
                    cancelButtonText: 'İptal',
                    background: '#161616',
                    color: '#fff',
                    confirmButtonColor: '#FF6B00',
                    cancelButtonColor: '#333',
                    customClass: {
                        popup: 'rounded-[24px]',
                        confirmButton: 'rounded-full px-6 py-2',
                        cancelButton: 'rounded-full px-6 py-2'
                    }
                }).then((result) => {
                    if (result.isConfirmed) {
                        navigate('/login');
                    }
                });
                return;
            }

            const data = await res.json();
            if (data.status === 'success') {
                setTracks(prev => prev.map(t =>
                    t.id === trackId ? { ...t, is_liked: data.liked } : t
                ));
            }
        } catch (e) {
            console.error("Failed to toggle like", e);
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        // We could use a toast here, but simple alert for consistency with existing code
        alert('Artist link copied to clipboard!');
    };

    const handleToggleFollow = async () => {
        if (!artist?.user_id) return;

        // Optimistic UI update
        const prevFollowing = isFollowing;
        const prevCount = followersCount;

        setIsFollowing(!isFollowing);
        setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const method = isFollowing ? 'DELETE' : 'POST';
            const res = await fetch(`http://127.0.0.1:8000/api/users/${artist.user_id}/follow`, {
                method,
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await res.json();
            if (data.status !== 'success') {
                // Revert on failure
                setIsFollowing(prevFollowing);
                setFollowersCount(prevCount);
                if (data.message) {
                    alert(data.message);
                }
            } else {
                // Update count from server to be sure
                if (data.followers_count !== undefined) {
                    setFollowersCount(data.followers_count);
                }
            }
        } catch (e) {
            console.error("Failed to toggle follow", e);
            setIsFollowing(prevFollowing);
            setFollowersCount(prevCount);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <div className="text-white/50 animate-pulse font-medium">Loading Artist...</div>
        </div>
    );

    if (!artist) return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <div className="text-white font-bold text-xl">Artist Not Found</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0a] pb-32 font-['Inter'] selection:bg-[var(--accent)] selection:text-black">
            {/* Extended Header / Hero */}
            <div className="relative min-h-[500px] w-full flex items-end">
                {/* Background Image with Gradient */}
                <div
                    className="absolute inset-0 bg-cover bg-center parallax"
                    style={{
                        backgroundImage: `url(${artist.banner_image ? (artist.banner_image.startsWith('http') ? artist.banner_image : `http://127.0.0.1:8000/${artist.banner_image}`) : (artist.avatar || 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=3456&auto=format&fit=crop')})`,
                        backgroundAttachment: 'fixed'
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent" />
                </div>

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-8 left-8 w-10 h-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 hover:scale-105 transition-all z-20 group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                </button>

                {/* Artist Info */}
                <div className="relative w-full p-8 z-10">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-end gap-8 pb-8">
                        {/* Avatar (visible on mobile/tablet) */}
                        <div className="w-40 h-40 md:w-52 md:h-52 rounded-full overflow-hidden border-4 border-[#0a0a0a] shadow-2xl shrink-0 hidden md:block">
                            <img
                                src={artist.avatar ? (artist.avatar.startsWith('http') ? artist.avatar : `http://127.0.0.1:8000/${artist.avatar}`) : 'https://via.placeholder.com/400'}
                                className="w-full h-full object-cover"
                                alt={artist.stage_name}
                            />
                        </div>

                        <div className="flex flex-col gap-4 flex-1">
                            <div className="flex items-center gap-2 text-[var(--accent)] font-bold tracking-widest uppercase text-xs">
                                <span className="bg-[var(--accent)]/10 px-3 py-1 rounded-full border border-[var(--accent)]/20 flex items-center gap-1.5">
                                    <Check size={12} strokeWidth={3} /> Verified Artist
                                </span>
                            </div>

                            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white tracking-tighter leading-none shadow-xl">
                                {artist.stage_name}
                            </h1>

                            <div className="flex flex-wrap items-center gap-6 text-white/60 font-medium">
                                <div className="flex items-center gap-2">
                                    <Users size={18} />
                                    <span>{followersCount.toLocaleString()} Followers</span>
                                </div>
                                {artist.location && (
                                    <div className="flex items-center gap-2">
                                        <MapPin size={18} />
                                        <span>{artist.location}</span>
                                    </div>
                                )}
                            </div>

                            <p className="text-white/80 max-w-2xl text-lg font-light leading-relaxed line-clamp-2 md:line-clamp-none">
                                {artist.artist_bio || "No biography available."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Row */}
            <div className="sticky top-[72px] z-30 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 transition-all">
                <div className="max-w-7xl mx-auto px-8 py-4 flex items-center gap-6">
                    <button
                        onClick={() => tracks.length > 0 && playTrack(tracks[0], tracks)}
                        className="w-14 h-14 bg-[var(--accent)] rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform shadow-lg shadow-[var(--accent)]/40 hover:shadow-[var(--accent)]/60"
                        disabled={tracks.length === 0}
                    >
                        {isPlaying && currentTrack?.artist?.id === artist?.id ? (
                            <div className="w-14 h-14 flex items-center justify-center bg-white text-black rounded-full">
                                <span className="font-bold text-xs uppercase tracking-widest">Pause</span>
                            </div>
                        ) : (
                            <Play size={28} fill="currentColor" className="ml-1" />
                        )}
                    </button>

                    <button
                        onClick={handleToggleFollow}
                        className={`
                            px-8 py-3 rounded-full font-bold text-sm tracking-wide uppercase transition-all duration-300 border
                            ${isFollowing
                                ? 'bg-transparent border-white/20 text-white hover:border-red-500/50 hover:text-red-500'
                                : 'bg-white text-black border-transparent hover:scale-105'}
                        `}
                    >
                        {isFollowing ? 'Following' : 'Follow'}
                    </button>

                    <button
                        onClick={handleShare}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all group"
                        title="Share Artist"
                    >
                        <Share2 size={20} className="group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="max-w-7xl mx-auto px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Main Content: Tracks */}
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <Music className="text-[var(--accent)]" />
                                Popular Songs
                            </h2>

                            <div className="flex flex-col gap-1">
                                {tracks.slice(0, visibleCount).map((track, idx) => (
                                    <div
                                        key={track.id}
                                        onClick={() => playTrack(track, tracks)}
                                        className="group flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/5"
                                    >
                                        <div className="w-8 text-center flex justify-center text-white/50 font-mono text-sm">
                                            <span className="group-hover:hidden">{idx + 1}</span>
                                            <Play size={14} className="hidden group-hover:block text-white" fill="currentColor" />
                                        </div>

                                        <div className="relative w-12 h-12 rounded-lg overflow-hidden shadow-lg bg-gray-800">
                                            <img
                                                src={track.cover_image || (track.cover_path ? `http://127.0.0.1:8000/storage/${track.cover_path}` : artist.avatar)}
                                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                alt={track.title}
                                            />
                                            {currentTrack?.id === track.id && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                    <div className="w-3 h-3 bg-[var(--accent)] rounded-full animate-pulse" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className={`font-bold text-base truncate ${currentTrack?.id === track.id ? 'text-[var(--accent)]' : 'text-white'}`}>
                                                {track.title}
                                            </h3>
                                            <p className="text-sm text-white/40 truncate">{artist.stage_name}</p>
                                        </div>

                                        <div className="hidden md:block text-white/40 text-sm font-medium pr-4">
                                            {(track.plays || 0).toLocaleString()} plays
                                        </div>

                                        <button
                                            onClick={(e) => handleToggleLike(track.id, e)}
                                            className={`transition-all transform hover:scale-110 p-2 ${track.is_liked ? 'text-red-500' : 'text-white/40 hover:text-red-500'}`}
                                        >
                                            <Heart size={18} fill={track.is_liked ? "currentColor" : "none"} />
                                        </button>

                                        <div className="text-white/40 text-sm font-mono w-12 text-right">
                                            {track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : '3:45'}
                                        </div>
                                    </div>
                                ))}

                                {tracks.length === 0 && (
                                    <div className="text-white/30 text-center py-12 italic">
                                        No tracks released yet.
                                    </div>
                                )}
                            </div>

                            {visibleCount < tracks.length && (
                                <div className="mt-6 flex justify-center">
                                    <button
                                        onClick={() => setVisibleCount(prev => prev + 10)}
                                        className="px-6 py-2 rounded-full border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-all text-sm font-medium uppercase tracking-wider"
                                    >
                                        More Songs
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar: About, Similar Artists etc. */}
                    <div className="space-y-8">
                        <div className="bg-white/5 border border-white/5 p-6 rounded-2xl">
                            <h3 className="font-bold text-white mb-4 text-lg">About {artist.stage_name}</h3>
                            <div className="w-full h-48 bg-gray-800 rounded-lg mb-4 overflow-hidden">
                                <img
                                    src={artist.avatar || 'https://via.placeholder.com/400'}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <p className="text-white/60 leading-relaxed text-sm">
                                {artist.artist_bio || "An amazing artist on VNYL. Follow to get updates on new releases and events."}
                            </p>
                            {/* Social Links - Conditional for border symmetry */}
                            {(artist.user?.social_instagram || artist.user?.social_youtube || artist.user?.social_spotify || artist.user?.social_soundcloud || artist.user?.social_apple || artist.user?.website) && (
                                <div className="mt-4 pt-4 border-t border-white/10 flex gap-4">
                                    {artist.user?.social_instagram && (
                                        <a href={artist.user.social_instagram} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-pink-600 hover:text-white flex items-center justify-center transition-all group">
                                            <Instagram size={18} className="text-white/60 group-hover:text-white" />
                                        </a>
                                    )}
                                    {artist.user?.social_youtube && (
                                        <a href={artist.user.social_youtube} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all group">
                                            <Youtube size={18} className="text-white/60 group-hover:text-white" />
                                        </a>
                                    )}
                                    {(artist.user?.social_spotify || artist.user?.social_soundcloud || artist.user?.social_apple) && (
                                        <a href={artist.user?.social_spotify || artist.user?.social_soundcloud || artist.user?.social_apple} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-green-500 hover:text-white flex items-center justify-center transition-all group">
                                            <Music size={18} className="text-white/60 group-hover:text-white" />
                                        </a>
                                    )}
                                    {artist.user?.website && (
                                        <a href={artist.user.website} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all group">
                                            <Globe size={18} className="text-white/60 group-hover:text-white" />
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArtistPage;
