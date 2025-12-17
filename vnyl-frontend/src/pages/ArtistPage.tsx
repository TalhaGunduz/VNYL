
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, ArrowLeft, MoreHorizontal, Heart } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

const ArtistPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();

    const [artist, setArtist] = useState<any>(null);
    const [tracks, setTracks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArtist = async () => {
            try {
                // Fetch Profile
                const res = await fetch(`http://127.0.0.1:8000/api/artists/${slug}`);
                const data = await res.json();
                if (data.status === 'success') {
                    setArtist(data.artist);
                }

                // Fetch Tracks
                const resTracks = await fetch(`http://127.0.0.1:8000/api/artists/${slug}/tracks`);
                const dataTracks = await resTracks.json();
                if (dataTracks.status === 'success') {
                    setTracks(dataTracks.tracks);
                }
            } catch (err) {
                console.error("Failed to load artist", err);
            } finally {
                setLoading(false);
            }
        };

        if (slug) fetchArtist();
    }, [slug]);

    if (loading) return <div className="text-white p-10 font-bold">Loading Artist...</div>;
    if (!artist) return <div className="text-white p-10 font-bold">Artist Not Found</div>;

    return (
        <div className="min-h-screen bg-[#0a0a0a] pb-24 font-['Inter']">
            {/* Header / Hero */}
            <div className="relative h-[400px] w-full">
                {/* Background Image with Gradient */}
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${artist.avatar || 'https://via.placeholder.com/1200x500'})` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
                </div>

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-6 left-6 w-10 h-10 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all z-20"
                >
                    <ArrowLeft size={20} />
                </button>

                {/* Artist Info */}
                <div className="absolute bottom-0 left-0 p-8 w-full z-10">
                    <div className="flex items-end gap-6 max-w-7xl mx-auto">
                        <div className="flex flex-col gap-4">
                            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none shadow-xl">
                                {artist.stage_name}
                            </h1>
                            <p className="text-white/80 max-w-2xl text-lg font-medium line-clamp-2">
                                {artist.artist_bio || "No biography available."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Row */}
            <div className="max-w-7xl mx-auto px-8 py-6 flex items-center gap-6">
                <button
                    onClick={() => tracks.length > 0 && playTrack(tracks[0])}
                    className="w-14 h-14 bg-[var(--accent)] rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform shadow-lg shadow-[var(--accent)]/40"
                >
                    <Play size={28} fill="currentColor" className="ml-1" />
                </button>
                <button className="text-white/50 hover:text-white border border-white/20 px-4 py-2 rounded-full font-bold text-sm tracking-wide uppercase hover:bg-white/10 transition-all">
                    Follow
                </button>
                <button className="text-white/50 hover:text-white transition-colors">
                    <MoreHorizontal size={32} />
                </button>
            </div>

            {/* Tracks List */}
            <div className="max-w-7xl mx-auto px-8">
                <h2 className="text-2xl font-bold text-white mb-6">Popular</h2>

                <div className="flex flex-col gap-1">
                    {tracks.map((track, idx) => (
                        <div
                            key={track.id}
                            onClick={() => playTrack(track)}
                            className="group flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            <span className="text-white/50 w-6 text-center font-mono text-sm">{idx + 1}</span>

                            <img
                                src={track.cover_image || (track.cover_path ? `http://127.0.0.1:8000/storage/${track.cover_path}` : artist.avatar)}
                                className="w-10 h-10 rounded object-cover"
                                alt={track.title}
                            />

                            <div className="flex-1">
                                <h3 className={`font-bold text-sm ${currentTrack?.id === track.id ? 'text-[var(--accent)]' : 'text-white'}`}>
                                    {track.title}
                                </h3>
                            </div>

                            <div className="hidden md:block text-white/40 text-sm font-medium">
                                {track.views?.toLocaleString() || "1,000,000"} plays
                            </div>

                            <div className="text-white/40 text-sm font-mono w-12 text-right">
                                {track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : '-:-'}
                            </div>

                            <button className="opacity-0 group-hover:opacity-100 text-white/50 hover:text-white transition-opacity">
                                <Heart size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ArtistPage;
