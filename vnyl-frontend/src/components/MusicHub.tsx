import { useEffect, useState } from 'react';
import { X, Play, RefreshCw, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayer } from '../context/PlayerContext';

interface MusicHubProps {
    isOpen: boolean;
    onClose: () => void;
}

const MusicHub = ({ isOpen, onClose }: MusicHubProps) => {
    const [tracks, setTracks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { playTrack } = usePlayer();

    const fetchRandomTracks = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://127.0.0.1:8000/api/tracks/random?limit=20');
            const data = await res.json();
            if (data.status === 'success') {
                setTracks(data.tracks);
            }
        } catch (error) {
            console.error('Failed to fetch discovery tracks', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && tracks.length === 0) {
            fetchRandomTracks();
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Drawer Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full md:w-[450px] bg-[#121212] border-l border-white/10 z-50 shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#121212]/95 backdrop-blur z-10">
                            <div className="flex items-center gap-3">
                                <Compass className="text-[var(--accent)]" size={24} />
                                <h2 className="text-xl font-bold text-white">Music Hub</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={fetchRandomTracks}
                                    className="p-2 hover:bg-white/5 rounded-full text-white/50 hover:text-white transition-colors"
                                    title="Shuffle"
                                >
                                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/5 rounded-full text-white/50 hover:text-white transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            <div className="grid grid-cols-2 gap-4">
                                {tracks.map((track) => (
                                    <motion.div
                                        key={track.id}
                                        layoutId={`hub-${track.id}`}
                                        className="group relative aspect-square rounded-2xl overflow-hidden bg-white/5 cursor-pointer"
                                        whileHover={{ scale: 0.98 }}
                                        onClick={() => playTrack(track)}
                                    >
                                        <img
                                            src={track.cover_image || track.cover_path || '/default-cover.png'}
                                            alt={track.title}
                                            className="w-full h-full object-cover group-hover:opacity-60 transition-opacity"
                                        />

                                        {/* Overlay Info */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                            <p className="font-bold text-white truncate">{track.title}</p>
                                            <p className="text-xs text-white/70 truncate">{track.featured_artist || track.user?.name || 'Artist'}</p>
                                        </div>

                                        {/* Play Icon */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                                            <div className="w-12 h-12 bg-[var(--accent)] rounded-full flex items-center justify-center shadow-lg text-black">
                                                <Play size={20} fill="currentColor" />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {tracks.length === 0 && !loading && (
                                <div className="text-center py-20 text-white/30">
                                    <p>No tracks found to discover.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default MusicHub;
