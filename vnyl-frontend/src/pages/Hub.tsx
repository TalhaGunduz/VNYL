
import { useEffect, useState, useRef } from 'react';
import { Play, Heart, MoreVertical, Compass, Music, ListPlus, ListMusic, User, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useNavigate } from 'react-router-dom';
import AddToPlaylistModal from '../components/AddToPlaylistModal';

const TrackCard = ({ track, onClick, onLike, onAddToPlaylist, onMenuClick }: { track: any, onClick: () => void, onLike: () => void, onAddToPlaylist: () => void, onMenuClick: (e: React.MouseEvent) => void }) => {
    const [imgError, setImgError] = useState(false);
    const navigate = useNavigate();

    // Resolve Image URL
    const getImageUrl = () => {
        if (track.cover_image) return track.cover_image; // YouTube URL
        if (track.cover_path) return `http://127.0.0.1:8000/storage/${track.cover_path}`; // Local Storage URL
        return null;
    };

    const imageUrl = getImageUrl();
    // Fallback text avatar if no image
    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(track.title)}&background=random&color=fff&size=512`;

    const handleArtistClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (track.artist?.slug) {
            navigate(`/artist/${track.artist.slug}`);
        } else {
            console.warn("No artist linked for this track");
        }
    };

    return (
        <div
            className="group relative w-[220px] bg-[#161616] hover:bg-[#1f1f1f] p-3 rounded-[24px] transition-all duration-300 cursor-pointer border border-white/5 hover:border-white/10 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50"
            onClick={onClick}
        >
            {/* Uniquely Styled Image Container */}
            <div className="relative aspect-square w-full rounded-[16px] overflow-hidden bg-[#000] shadow-inner mb-4 flex items-center justify-center">
                {!imgError ? (
                    <img
                        src={imageUrl || fallbackUrl}
                        alt={track.title}
                        referrerPolicy="no-referrer"
                        onError={() => setImgError(true)}
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-white/20 group-hover:text-[var(--accent)] transition-colors">
                        <Music size={40} />
                    </div>
                )}

                {/* Play Button - Lower z-index than actions */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 pointer-events-none">
                    <div className="w-12 h-12 bg-[var(--accent)] text-black rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 pointer-events-auto">
                        <Play fill="currentColor" size={20} className="ml-0.5" />
                    </div>
                </div>

                {/* Heart Icon Overlay - Higher z-index to be clickable */}
                <button
                    className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all z-20 ${track.is_liked ? 'bg-red-500/20 text-red-500 backdrop-blur-md' : 'bg-black/30 text-white/50 hover:text-white backdrop-blur-md hover:bg-black/50'}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onLike();
                    }}
                >
                    <Heart size={14} fill={track.is_liked ? "currentColor" : "none"} />
                </button>
            </div>

            {/* Card Metadata */}
            <div className="px-1 pb-2 relative">
                <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-white text-[15px] leading-tight line-clamp-1" title={track.title}>
                        {track.title}
                    </h3>

                    {/* Context Menu Trigger - Now externally controlled */}
                    <button
                        className="text-white/30 hover:text-white transition-colors p-1"
                        onClick={onMenuClick}
                    >
                        <MoreVertical size={18} />
                    </button>
                </div>

                {/* Clickable Artist Name */}
                <p
                    className="text-white/40 text-[13px] font-medium mt-1 truncate hover:text-[var(--accent)] hover:underline transition-colors w-fit"
                    onClick={handleArtistClick}
                >
                    {track.featured_artist}
                </p>
            </div>
        </div>
    );
};

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
    const { playTrack } = usePlayer();
    const navigate = useNavigate();

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

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveMenu(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Tracks
                const res = await fetch('http://127.0.0.1:8000/api/hub', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}` // Ensure auth for like status
                    }
                });
                const data = await res.json();
                if (data.status === 'success') {
                    // Shuffle tracks once on load
                    setTracks(data.tracks.sort(() => 0.5 - Math.random()));
                }

                // Fetch Artists
                const resArtists = await fetch('http://127.0.0.1:8000/api/artists');
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



    const handleMenuClick = (e: React.MouseEvent, track: any) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const menuWidth = 224;
        const menuHeight = 190;

        const isOnRightHalf = rect.left > window.innerWidth / 2;
        const isOnBottomHalf = rect.top > window.innerHeight * 0.6;

        setActiveMenu(activeMenu?.id === track.id ? null : {
            id: track.id,
            x: isOnRightHalf ? (rect.right - menuWidth) : rect.left,
            y: isOnBottomHalf ? (rect.top - menuHeight - 8) : (rect.bottom + 8),
            opensUp: isOnBottomHalf,
            opensLeft: isOnRightHalf
        });
    };

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
                                onClick={() => navigate(`/artist/${artist.slug}`)}
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
                            {track.is_liked ? "Remove from Queue" : "Like Song"}
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
                                if (track.artist?.slug) {
                                    handleArtistClick(track.artist.slug);
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
                                // Share logic
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
