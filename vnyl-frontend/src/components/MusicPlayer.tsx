import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, Mic2, Maximize2, MoreVertical, Heart, ChevronDown } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import YouTube, { YouTubeProps } from 'react-youtube';
import { useNavigate } from 'react-router-dom';

const MusicPlayer: React.FC = () => {
    const {
        currentTrack,
        isPlaying,
        isExpanded,
        currentTime,
        duration,
        volume,
        togglePlay,
        setIsExpanded,
        seek,
        setVolume,
        isVisible,
        toggleLike,
        setCurrentTime,
        playTrack // Added logic to play from queue
    } = usePlayer();

    const navigate = useNavigate();

    // Up Next / Suggestions Logic
    const [upNext, setUpNext] = useState<any[]>([]);

    useEffect(() => {
        if (isExpanded && upNext.length === 0) {
            // Fetch random suggestions
            fetch('http://127.0.0.1:8000/api/tracks/random?limit=10')
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        setUpNext(data.tracks);
                    }
                })
                .catch(err => console.error("Failed to fetch suggestions", err));
        }
    }, [isExpanded]);

    const handleArtistClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentTrack?.artist?.slug) {
            setIsExpanded(false); // Close full screen if open
            navigate(`/artist/${currentTrack.artist.slug}`);
        } else {
            console.warn("No artist slug available for navigation");
        }
    };

    // YouTube Player Ref
    const playerRef = useRef<any>(null);
    const progressInterval = useRef<any>(null);

    // --- YouTube API Handlers ---
    const onReady = (event: any) => {
        playerRef.current = event.target;
        playerRef.current.setVolume(volume * 100);
        if (isPlaying) {
            playerRef.current.playVideo();
        }
    };

    const onStateChange = (event: any) => {
        // 0 = Ended, 1 = Playing, 2 = Paused
        if (event.data === 0) {
            togglePlay(); // Stop playing when ended
        }
    };

    // Sync React State -> YouTube Player
    useEffect(() => {
        if (currentTrack?.youtube_video_id && playerRef.current) {
            if (isPlaying) {
                playerRef.current.playVideo();
            } else {
                playerRef.current.pauseVideo();
            }
        }
    }, [isPlaying, currentTrack]);

    // PROGRESS LOOP
    useEffect(() => {
        if (progressInterval.current) clearInterval(progressInterval.current);

        if (isPlaying && currentTrack?.youtube_video_id) {
            progressInterval.current = setInterval(() => {
                if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                    const time = playerRef.current.getCurrentTime();
                    setCurrentTime(time);
                }
            }, 500);
        }

        return () => {
            if (progressInterval.current) clearInterval(progressInterval.current);
        };
    }, [isPlaying, currentTrack, setCurrentTime]);

    const opts: YouTubeProps['opts'] = {
        height: '0',
        width: '0',
        playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
        },
    };

    // Spacebar to toggle play
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                const target = e.target as HTMLElement;
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
                e.preventDefault();
                togglePlay();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay]);

    if (!isVisible || !currentTrack) return null;

    const formatTime = (time: number) => {
        if (!time || isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        seek(time);

        if (currentTrack.youtube_video_id && playerRef.current) {
            playerRef.current.seekTo(time, true);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const vol = Number(e.target.value);
        setVolume(vol);
        if (playerRef.current) {
            playerRef.current.setVolume(vol * 100);
        }
    };

    // Determine Image Source (YouTube vs Local)
    const coverUrl = currentTrack.cover_image
        ? currentTrack.cover_image
        : currentTrack.cover_path
            ? `http://127.0.0.1:8000/storage/${currentTrack.cover_path}`
            : "https://via.placeholder.com/64";

    return (
        <>
            {/* Hidden YouTube Player */}
            {currentTrack.youtube_video_id && (
                <div className="absolute top-0 left-0 w-0 h-0 overflow-hidden opacity-0 pointer-events-none">
                    <YouTube
                        videoId={currentTrack.youtube_video_id}
                        opts={opts}
                        onReady={onReady}
                        onStateChange={onStateChange}
                    />
                </div>
            )}

            {/* Bottom Player Bar - Z Index 50 ensures it is above expanded view (Z Index 40) */}
            <div
                className="fixed bottom-0 left-0 w-full h-24 bg-[#121212] border-t border-white/10 flex items-center justify-between px-6 z-[50] animate-in slide-in-from-bottom-5 fade-in duration-300 cursor-pointer hover:bg-[#1a1a1a] transition-colors"
                onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('a')) return;
                    setIsExpanded(!isExpanded);
                }}
            >
                {/* Track Info (Left) */}
                <div className="flex items-center gap-4 w-[30%] min-w-[200px]">
                    <img
                        src={coverUrl}
                        alt="Cover"
                        className="w-14 h-14 rounded-md object-cover bg-white/5"
                    />
                    <div className="overflow-hidden">
                        <h4 className="font-bold text-white text-sm truncate">{currentTrack.title}</h4>
                        <p
                            className="text-xs text-white/50 truncate hover:text-[var(--accent)] hover:underline transition-colors cursor-pointer w-fit"
                            onClick={handleArtistClick}
                        >
                            {currentTrack.featured_artist || "Unknown Artist"}
                        </p>
                    </div>
                    <button
                        className={`transition-colors ml-2 ${currentTrack.is_liked ? 'text-[var(--accent)]' : 'text-white/40 hover:text-white'}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleLike();
                        }}
                    >
                        <Heart size={18} fill={currentTrack.is_liked ? "currentColor" : "none"} />
                    </button>
                </div>

                {/* Controls (Center) */}
                <div className="flex flex-col items-center justify-center w-[40%] max-w-2xl gap-2">
                    <div className="flex items-center gap-6">
                        <button className="text-white/60 hover:text-white transition-colors"><Shuffle size={18} /></button>
                        <button className="text-white/60 hover:text-white transition-colors"><SkipBack size={24} fill="currentColor" /></button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                togglePlay();
                            }}
                            className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform"
                        >
                            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                        </button>
                        <button className="text-white/60 hover:text-white transition-colors"><SkipForward size={24} fill="currentColor" /></button>
                        <button className="text-white/60 hover:text-white transition-colors"><Repeat size={18} /></button>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-3 w-full text-xs font-medium text-white/40">
                        <span className="min-w-[40px] text-right">{formatTime(currentTime)}</span>
                        <div className="relative flex-1 group" onClick={(e) => e.stopPropagation()}>
                            <input
                                type="range"
                                min={0}
                                max={currentTrack.duration || duration || 100} // Use track duration if known
                                value={currentTime}
                                onChange={handleSeek}
                                className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:opacity-0 group-hover:[&::-webkit-slider-thumb]:opacity-100 transition-all"
                                style={{
                                    background: `linear-gradient(to right, white ${(currentTime / (currentTrack.duration || duration || 1)) * 100}%, rgba(255,255,255,0.1) ${(currentTime / (currentTrack.duration || duration || 1)) * 100}%)`
                                }}
                            />
                        </div>
                        <span className="min-w-[40px]">{formatTime(currentTrack.duration || duration)}</span>
                    </div>
                </div>

                {/* Extra Controls (Right) */}
                <div className="flex items-center justify-end w-[30%] gap-4 min-w-[200px]">
                    <button className="text-white/60 hover:text-white"><Mic2 size={18} /></button>
                    <button
                        className="text-white/60 hover:text-white"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                    >
                        <Maximize2 size={18} />
                    </button>
                    <div className="flex items-center gap-2 group" onClick={(e) => e.stopPropagation()}>
                        <Volume2 size={18} className="text-white/60" />
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={volume}
                            onChange={handleVolumeChange}
                            className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:opacity-0 group-hover:[&::-webkit-slider-thumb]:opacity-100 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Full Screen Player Overlay - Always mounted, toggled via transform */}
            <div
                className={`fixed inset-0 bg-[#0a0a0a] z-[40] flex flex-col pb-24 transition-transform duration-[280ms] ease-out ${isExpanded ? 'translate-y-0' : 'translate-y-full'}`}
                style={{ transitionTimingFunction: isExpanded ? 'cubic-bezier(0.22, 1, 0.36, 1)' : 'cubic-bezier(0.32, 0, 0.67, 0)' }} // Fast out (ease-out), faster in
            >
                {/* Blurred Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
                    <img
                        src={coverUrl}
                        className="w-full h-full object-cover blur-[120px]"
                    />
                    <div className="absolute inset-0 bg-black/60" />
                </div>

                {/* Header / Close Button */}
                <div className="relative z-10 w-full flex justify-end p-6">
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="bg-white/5 hover:bg-white/10 text-white/50 hover:text-white p-2 rounded-full transition-all"
                        title="Close Player"
                    >
                        <ChevronDown size={28} />
                    </button>
                </div>

                {/* Main Content Layout */}
                <div className="relative z-10 flex-1 grid grid-cols-12 gap-8 px-12 pb-8 h-full">

                    {/* Center: Now Playing Focus */}
                    <div className="col-span-8 flex flex-col items-center justify-center h-full">
                        <div className="w-[45vh] max-w-[500px] aspect-square rounded-lg shadow-2xl elevation-high overflow-hidden relative group mb-8">
                            <img
                                src={coverUrl}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="text-center space-y-2 max-w-2xl">
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">{currentTrack.title}</h1>
                            <p
                                className="text-xl text-white/60 font-medium hover:text-[var(--accent)] hover:underline cursor-pointer transition-colors"
                                onClick={handleArtistClick}
                            >
                                {currentTrack.featured_artist || "Unknown Artist"}
                            </p>
                        </div>
                    </div>

                    {/* Right: Up Next / Suggestions */}
                    <div className="col-span-4 h-full pl-8 border-l border-white/5 hidden lg:flex flex-col">
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Sıradaki Parçalar</h3>
                            <button className="text-xs text-white/40 hover:text-white border border-white/10 px-3 py-1 rounded-full uppercase font-bold tracking-wider hover:bg-white/5 transition-all">Listeyi Kaydet</button>
                        </div>

                        {/* Queue List */}
                        <div className="flex-1 overflow-y-auto pr-2 space-y-2 mask-linear-fade">
                            {/* Current Playing (Sticky?) No, just list items */}

                            {upNext.map((track, i) => (
                                <div
                                    key={track.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        playTrack(track); // Use playTrack from context
                                    }}
                                    className="flex items-center gap-3 p-3 rounded-md bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 cursor-pointer transition-all group"
                                >
                                    <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-[#222]">
                                        <img
                                            src={track.cover_image || (track.cover_path ? `http://127.0.0.1:8000/storage/${track.cover_path}` : "https://via.placeholder.com/64")}
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                                            <Play size={16} fill="white" className="text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-white truncate group-hover:text-[var(--accent)] transition-colors">{track.title}</div>
                                        <div className="text-xs text-white/50 truncate">{track.featured_artist || "Unknown Artist"}</div>
                                    </div>
                                    {/* Duration might be undefined in map, handle safely */}
                                    <span className="text-xs font-mono text-white/40">{track.duration ? formatTime(track.duration) : "--:--"}</span>
                                </div>
                            ))}

                            {upNext.length === 0 && (
                                <div className="text-center text-white/30 py-10 text-sm">
                                    Öneri yükleniyor...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MusicPlayer;
