
import { useEffect, useState } from 'react';
import { Play, Heart, MoreVertical, Compass, Music } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useNavigate } from 'react-router-dom';

const Hub = () => {
    const [tracks, setTracks] = useState<any[]>([]);
    const [artists, setArtists] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { playTrack } = usePlayer();
    const navigate = useNavigate();

    // Sections configuration
    const sections = [
        { title: "Sana Özel Seçkiler", subtitle: "VNYL KEŞİF" },
        { title: "Haftanın Trendleri", subtitle: "SOSYAL" },
        { title: "Ruh Halini Yansıt", subtitle: "MODLAR" },
    ];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Tracks
                const res = await fetch('http://127.0.0.1:8000/api/hub');
                const data = await res.json();
                if (data.status === 'success') {
                    setTracks(data.tracks);
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

    const getSectionTracks = (seed: number) => {
        if (!tracks.length) return [];
        const start = (seed * 6) % tracks.length;
        return tracks.slice(start, start + 5);
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[var(--accent)] selection:text-black pb-24">

            {/* Unique VNYL Header */}
            <header className="pt-12 pb-8 px-6 md:px-12 border-b border-white/5 bg-gradient-to-b from-[#121212] to-[#0a0a0a]">
                <div className="flex items-center gap-3 mb-2 opacity-60">
                    <Compass size={18} className="text-[var(--accent)]" />
                    <span className="text-xs font-bold tracking-[0.2em] uppercase">Müzik Merkezi</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-2">
                    Müzik <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-purple-500">Evrenini</span> Keşfet.
                </h1>
                <p className="text-white/40 mt-4 max-w-lg text-lg leading-relaxed">
                    Sıradan listelerden sıkıldın mı? VNYL'nin yapay zeka destekli kürasyonu ile daha derine in.
                </p>
            </header>

            <div className="px-6 md:px-12 py-10 space-y-16">

                {/* Featured Artists Section */}
                <section>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-8 w-1 bg-[var(--accent)] rounded-full" />
                        <div>
                            <h2 className="text-2xl font-bold">Öne Çıkan Sanatçılar</h2>
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

                {
                    sections.map((section, idx) => (
                        <section key={idx} className="relative">
                            {/* Section Title */}
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-8 w-1 bg-[var(--accent)] rounded-full" />
                                <div>
                                    <h2 className="text-2xl font-bold">{section.title}</h2>
                                    <p className="text-white/30 text-xs font-medium tracking-wider uppercase mt-1">{section.subtitle}</p>
                                </div>
                            </div>

                            {/* Custom Card Layout (Flex wrap for responsive) */}
                            <div className="flex flex-wrap gap-6">
                                {getSectionTracks(idx).map((track: any) => (
                                    <TrackCard key={track.id} track={track} onClick={() => playTrack(track)} />
                                ))}
                            </div>
                        </section>
                    ))
                }
            </div >
        </div >
    );
};



const TrackCard = ({ track, onClick }: { track: any, onClick: () => void }) => {
    const [imgError, setImgError] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
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
            // Fallback: search? or just do nothing for unlinked tracks
            console.warn("No artist linked for this track");
        }
    };

    return (
        <div
            className="group relative w-[220px] bg-[#161616] hover:bg-[#1f1f1f] p-3 rounded-[24px] transition-all duration-300 cursor-pointer border border-white/5 hover:border-white/10 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50"
            onClick={onClick}
            onMouseLeave={() => setShowMenu(false)} // Close menu on leave
        >
            {/* Uniquely Styled Image Container */}
            <div className="relative aspect-square w-full rounded-[16px] overflow-hidden bg-[#000] shadow-inner mb-4 flex items-center justify-center">
                {!imgError ? (
                    <img
                        src={imageUrl || fallbackUrl}
                        alt={track.title}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== fallbackUrl) {
                                target.src = fallbackUrl;
                            } else {
                                setImgError(true);
                            }
                        }}
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-white/20 group-hover:text-[var(--accent)] transition-colors">
                        <Music size={40} />
                    </div>
                )}

                {/* Heart Icon Overlay */}
                <button className="absolute top-3 right-3 w-8 h-8 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white/50 hover:text-red-500 hover:bg-black/50 transition-all z-10">
                    <Heart size={14} fill={track.is_liked ? "currentColor" : "none"} />
                </button>

                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                    <div className="w-12 h-12 bg-[var(--accent)] text-black rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100">
                        <Play fill="currentColor" size={20} className="ml-0.5" />
                    </div>
                </div>
            </div>

            {/* Card Metadata */}
            <div className="px-1 pb-2 relative">
                <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-white text-[15px] leading-tight line-clamp-1" title={track.title}>
                        {track.title}
                    </h3>

                    {/* Context Menu Trigger */}
                    <div className="relative">
                        <button
                            className="text-white/30 hover:text-white transition-colors p-1"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(!showMenu);
                            }}
                        >
                            <MoreVertical size={18} />
                        </button>

                        {/* Dropdown Menu */}
                        {showMenu && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                <button
                                    className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-2"
                                    onClick={handleArtistClick}
                                >
                                    <Music size={14} />
                                    Sanatçıya Git
                                </button>
                                {/* Future: Add to Playlist etc. */}
                            </div>
                        )}
                    </div>
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

export default Hub;
