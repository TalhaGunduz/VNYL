
import { useEffect, useState, useRef } from 'react';
import { Play, Heart, MoreVertical, Compass, Music, ListPlus, ListMusic, User, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useNavigate } from 'react-router-dom';
import AddToPlaylistModal from '../components/AddToPlaylistModal';
import TrackCard from '../components/TrackCard';
import Swal from 'sweetalert2';
import { apiFetch } from '../utils/api';


const SectionCarousel = ({ title, subtitle, tracks, onPlay, onLike, onAddToPlaylist, onMenuClick }: any) => {
    const scrollContainer = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainer.current) {
            const scrollAmount = direction === 'left' ? -600 : 600;
            scrollContainer.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <section className="relative group/section">
            {/* Header */}
            <div className="flex items-end justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="h-8 w-1 bg-[var(--accent)] rounded-full" />
                    <div>
                        <h2 className="text-2xl font-bold">{title}</h2>
                        <p className="text-white/30 text-xs font-medium tracking-wider uppercase mt-1">{subtitle}</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4 opacity-0 group-hover/section:opacity-100 transition-opacity">
                    <button className="px-4 py-2 rounded-full border border-white/10 hover:border-white/30 text-sm font-bold text-white/70 hover:text-white transition-all">
                        Diğer
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={() => scroll('left')}
                            className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-30"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Carousel */}
            <div
                ref={scrollContainer}
                className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 scroll-smooth"
            >
                {tracks.map((track: any) => (
                    <div key={track.id} className="flex-shrink-0">
                        <TrackCard
                            track={track}
                            onClick={() => onPlay(track)}
                            onLike={() => onLike(track.id)}
                            onAddToPlaylist={() => onAddToPlaylist(track.id)}
                            onMenuClick={(e) => onMenuClick(e, track)}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
};

const Hub = () => {
    const [tracks, setTracks] = useState<any[]>([]);
    const [artists, setArtists] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { playTrack, currentTrack } = usePlayer();
    const navigate = useNavigate();

    // Sync local tracks state when currentTrack (and its like status) changes in player context
    useEffect(() => {
        if (currentTrack) {
            setTracks(prev => prev.map(t =>
                t.id === currentTrack.id ? { ...t, is_liked: currentTrack.is_liked, likes_count: currentTrack.likes_count } : t
            ));
        }
    }, [currentTrack]);

    // Add to Playlist Modal State
    const [addToPlaylistTrackId, setAddToPlaylistTrackId] = useState<number | null>(null);

    // Sections configuration
    const sections = [
        { title: "Curated For You", subtitle: "VNYL PICKS" },
        { title: "Trending This Week", subtitle: "SOCIAL" },
        { title: "Mood & Vibe", subtitle: "MOODS" },
    ];

    // Global Context Menu State
    const [activeMenu, setActiveMenu] = useState<{ id: number, x: number, y: number, opensUp: boolean, opensLeft: boolean } | null>(null);

    const handleMenuClick = (e: React.MouseEvent, track: any) => {
        e.stopPropagation();
        // Use closest('[data-menu-trigger]') for reliable positioning through prop chains
        const btn = (e.target as Element).closest('[data-menu-trigger]') as HTMLElement
            ?? (e.currentTarget as HTMLElement);
        const rect = btn.getBoundingClientRect();
        const menuWidth = 224;
        const menuHeight = 190;
        const isOnRightHalf = rect.left > window.innerWidth / 2;
        const isOnBottomHalf = rect.top > window.innerHeight * 0.6;
        setActiveMenu(prev => prev?.id === track.id ? null : {
            id: track.id,
            x: isOnRightHalf ? (rect.right - menuWidth) : rect.left,
            y: isOnBottomHalf ? (rect.top - menuHeight - 8) : (rect.bottom + 8),
            opensUp: isOnBottomHalf,
            opensLeft: isOnRightHalf
        });
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Element;
            if (target.closest('[data-menu-trigger]') || target.closest('[data-context-menu]')) return;
            setActiveMenu(null);
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Tracks
                const res = await apiFetch('/api/hub');
                const data = await res.json();
                if (data.status === 'success') {
                    setTracks(data.tracks.sort(() => 0.5 - Math.random()));
                }

                // Fetch Artists
                const resArtists = await apiFetch('/api/artists');
                const dataArtists = await resArtists.json();
                if (dataArtists.status === 'success') {
                    setArtists(dataArtists.artists);
                }
            } catch (error) {
                console.error("Failed to load hub data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleToggleLike = async (trackId: number) => {
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
                if (result.isConfirmed) { navigate('/login'); }
            });
            return;
        }
        try {
            const response = await apiFetch(`/api/tracks/${trackId}/like`, { method: 'POST' });
            if (response.status === 401) {
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
                    if (result.isConfirmed) { navigate('/login'); }
                });
                return;
            }
            const data = await response.json();
            if (data.status === 'success') {
                setTracks(prev => prev.map(t =>
                    t.id === trackId ? { ...t, is_liked: data.liked, likes_count: data.total_likes } : t
                ));
            }
        } catch (error) {
            console.error("Error toggling like", error);
        }
    };

    const handleAddToPlaylist = (trackId: number) => {
        setAddToPlaylistTrackId(trackId);
    };

    const getSectionTracks = (index: number) => {
        if (!tracks.length) return [];

        // Unique content for each section (3 sections * 15 tracks = 45 needed)
        // If we don't have enough, we'll just wrap around, but standard offset ensures variety
        const itemsPerSection = 15;
        const start = (index * itemsPerSection) % tracks.length;

        let result = tracks.slice(start, start + itemsPerSection);

        // If we hit the end, wrap around to start
        if (result.length < itemsPerSection) {
            result = [...result, ...tracks.slice(0, itemsPerSection - result.length)];
        }

        return result;
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
    );



    const handleArtistClick = (slug: string) => {
        navigate(`/artist/${slug}`);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[var(--accent)] selection:text-black pb-24 relative">

            {/* Unique VNYL Header */}
            <header className="pt-12 pb-8 px-6 md:px-12 border-b border-white/5 bg-gradient-to-b from-[#121212] to-[#0a0a0a]">
                <div className="flex items-center gap-3 mb-2 opacity-60">
                    <Compass size={18} className="text-[var(--accent)]" />
                    <span className="text-xs font-bold tracking-[0.2em] uppercase">Music Hub</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-2">
                    Discover the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-purple-500">Music Universe</span>.
                </h1>
                <p className="text-white/40 mt-4 max-w-lg text-lg leading-relaxed">
                    Tired of ordinary playlists? Dive deeper with VNYL's AI-powered curation.
                </p>
            </header>

            <div className="px-6 md:px-12 py-10 space-y-16">

                {/* Featured Artists Section */}
                {/* Featured Artists Section - Hidden as per user request (single artist looks bad) */}
                {/* 
                <section>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-8 w-1 bg-[var(--accent)] rounded-full" />
                        <div>
                            <h2 className="text-2xl font-bold">Featured Artists</h2>
                            <p className="text-white/30 text-xs font-medium tracking-wider uppercase mt-1">CURATED BY VNYL</p>
                        </div>
                    </div>
                    <div className="flex gap-8 overflow-x-auto pb-4 scrollbar-hide">
                        {artists.map((artist) => (
                            <div
                                key={artist.id}
                                onClick={() => navigate(`/artist/${artist.slug || artist.id}`)}
                                className="flex flex-col items-center gap-3 cursor-pointer group flex-shrink-0"
                            >
                                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-transparent group-hover:border-[var(--accent)] transition-all shadow-lg group-hover:shadow-[var(--accent)]/20">
                                    <img
                                        src={artist.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.stage_name)}&background=random`}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        alt={artist.stage_name}
                                    />
                                </div >
                                <span className="font-bold text-sm tracking-wide group-hover:text-[var(--accent)] transition-colors">
                                    {artist.stage_name}
                                </span>
                            </div >
                        ))}
                    </div >
                </section >
                */}

                {sections.map((section, idx) => (
                    <SectionCarousel
                        key={idx}
                        title={section.title}
                        subtitle={section.subtitle}
                        tracks={getSectionTracks(idx)}
                        onPlay={playTrack}
                        onLike={handleToggleLike}
                        onAddToPlaylist={handleAddToPlaylist}
                        onMenuClick={handleMenuClick}
                    />
                ))}
            </div >

            {/* Add to Playlist Modal */}
            <AddToPlaylistModal
                trackId={addToPlaylistTrackId}
                onClose={() => setAddToPlaylistTrackId(null)}
            />

            {/* Global Context Menu */}
            {activeMenu && (() => {
                const track = tracks.find(t => t.id === activeMenu.id);
                if (!track) return null;

                return (
                    <div
                        data-context-menu="true"
                        className="fixed z-[9999] w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                        style={{
                            top: activeMenu.y,
                            left: activeMenu.x,
                            transformOrigin: `${activeMenu.opensLeft ? 'right' : 'left'} ${activeMenu.opensUp ? 'bottom' : 'top'}`
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-3 transition-colors border-b border-white/5"
                            onClick={() => {
                                handleToggleLike(track.id);
                                setActiveMenu(null);
                            }}
                        >
                            <Heart size={16} className={track.is_liked ? "text-red-500 fill-current" : ""} />
                            {track.is_liked ? "Liked" : "Like Song"}
                        </button>
                        <button
                            className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-3 transition-colors"
                            onClick={() => {
                                handleAddToPlaylist(track.id);
                                setActiveMenu(null);
                            }}
                        >
                            <ListMusic size={16} />
                            Add to Playlist
                        </button>
                        <button
                            className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-3 transition-colors"
                            onClick={() => {
                                if (track.artist?.slug || track.artist?.id) {
                                    handleArtistClick(track.artist.slug || track.artist.id);
                                } else if (track.user?.username && track.user?.role === 'artist') {
                                    navigate(`/artist/${track.user.username}`);
                                } else if (track.featured_artist) {
                                    navigate(`/search?q=${encodeURIComponent(track.featured_artist)}`);
                                }
                                setActiveMenu(null);
                            }}
                        >
                            <User size={16} />
                            Go to Artist
                        </button>
                        <button
                            className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-3 transition-colors border-t border-white/5"
                            onClick={() => {
                                const shareUrl = `${window.location.origin}/track/${track.id}`;
                                navigator.clipboard.writeText(shareUrl);
                                const Toast = Swal.mixin({
                                    toast: true,
                                    position: 'top-end',
                                    showConfirmButton: false,
                                    timer: 2000,
                                    background: '#1a1a1a',
                                    color: '#fff'
                                });
                                Toast.fire({ icon: 'success', title: 'Link copied to clipboard' });
                                setActiveMenu(null);
                            }}
                        >
                            <Share2 size={16} />
                            Share
                        </button>
                    </div>
                );
            })()}
        </div >
    );
};

export default Hub;
