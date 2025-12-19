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
        setDuration,
        volume,
        togglePlay,
        setIsExpanded,
        seek,
        setVolume,
        isVisible,
        toggleLike,
        setCurrentTime,
        playTrack
    } = usePlayer();

    const navigate = useNavigate();

    // Up Next / Suggestions Logic
    const [upNext, setUpNext] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'song' | 'video'>('song');

    // Switch to video mode automatically if user explicitly toggles it, 
    // but maybe default to song. 
    // Actually, let's keep it simple: manual toggle.

    useEffect(() => {
        if (isExpanded && currentTrack) {
            // Fetch random suggestions whenever track changes (infinite loop effect)
            fetch(`http://127.0.0.1:8000/api/tracks/random?limit=20`)
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        // Filter out current track to avoid duplication
                        const suggestions = data.tracks.filter((t: any) => t.id !== currentTrack.id);
                        setUpNext(suggestions);
                    }
                })
                .catch(err => console.error("Failed to fetch suggestions", err));
        }
    }, [isExpanded, currentTrack?.id]);

    // Lock body scroll when player is expanded
    useEffect(() => {
        if (isExpanded) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
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
        // Safely set volume
        if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
            playerRef.current.setVolume(volume * 100);
        }

        // Auto-play if state says so (important for track changes)
        if (isPlaying && playerRef.current && typeof playerRef.current.playVideo === 'function') {
            playerRef.current.playVideo();
        }

        // FETCH DURATION FALLBACK
        if (playerRef.current && typeof playerRef.current.getDuration === 'function') {
            const ytDuration = playerRef.current.getDuration();
            // If track has no duration or 0, update context
            if ((!currentTrack?.duration || currentTrack.duration === 0) && ytDuration > 0) {
                setDuration(ytDuration);
            }
        }
    };

    const onStateChange = (event: any) => {
        // 0 = Ended, 1 = Playing, 2 = Paused
        if (event.data === 1) { // Playing
            // Try fetching duration again when playing starts (sometimes it's 0 on ready)
            if (playerRef.current && typeof playerRef.current.getDuration === 'function') {
                const ytDuration = playerRef.current.getDuration();
                if ((!currentTrack?.duration || currentTrack?.duration === 0) && ytDuration > 0) {
                    setDuration(ytDuration);
                }
            }
        }
        if (event.data === 0) {
            togglePlay(); // Stop playing when ended
        }
    };

    // Sync React State -> YouTube Player
    useEffect(() => {
        if (currentTrack?.youtube_video_id && playerRef.current && typeof playerRef.current.playVideo === 'function') {
            try {
                if (isPlaying) {
                    playerRef.current.playVideo();
                } else {
                    playerRef.current.pauseVideo();
                }
            } catch (e) {
                console.warn("YouTube Player error during sync", e);
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
            modestbranding: 1,
            rel: 0,
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
            {/* Hidden YouTube Player - MOVED to main container for seamless toggle */}{/* ... */}

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
                <div className="relative z-10 w-full flex justify-end items-center p-6">
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="bg-white/5 hover:bg-white/10 text-white/50 hover:text-white p-2 rounded-full transition-all"
                        title="Close Player"
                    >
                        <ChevronDown size={28} />
                    </button>
                </div>

                {/* Main Content Layout */}
                <div className="relative z-10 flex-1 grid grid-cols-12 gap-8 px-12 pb-32 pt-0 -mt-16 h-full overflow-hidden">

                    {/* Center: Now Playing Focus */}
                    <div
                        className="col-span-8 flex flex-col items-center justify-start h-full cursor-pointer"
                        onClick={(e) => {
                            if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
                            togglePlay();
                        }}
                    >
                        {/* Toggle Song / Video */}
                        {currentTrack.youtube_video_id && (
                            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-full mb-6">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setViewMode('song'); }}
                                    className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'song' ? 'bg-white text-black shadow-lg' : 'text-white/50 hover:text-white'}`}
                                >
                                    Şarkı
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setViewMode('video'); }}
                                    className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'video' ? 'bg-white text-black shadow-lg' : 'text-white/50 hover:text-white'}`}
                                >
                                    Video
                                </button>
                            </div>
                        )}

                        <div
                            className={`relative group mb-8 shrink-0 transition-all duration-500 ease-out shadow-2xl elevation-high rounded-lg overflow-hidden ${viewMode === 'video' ? 'w-[90%] max-w-[50rem] aspect-video max-h-[55vh]' : 'w-[50vh] max-w-[450px] max-h-[50vh] aspect-square'}`}
                        >
                            {/* Video Layer (Always active if exists, covered by Art in song mode) */}
                            {currentTrack.youtube_video_id && (
                                <div className="absolute inset-0 w-full h-full">
                                    <YouTube
                                        videoId={currentTrack.youtube_video_id}
                                        opts={{
                                            ...opts,
                                            height: '100%',
                                            width: '100%',
                                            playerVars: { ...opts.playerVars, controls: 0 }
                                        }} // Override dims
                                        onReady={onReady}
                                        onStateChange={onStateChange}
                                        className="w-full h-full pointer-events-none"
                                        iframeClassName="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            {/* Video Pause Overlay (Hides YouTube clutter) */}
                            <div
                                className={`absolute inset-0 z-20 flex items-center justify-center transition-opacity duration-300 overflow-hidden ${viewMode === 'video' && !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    togglePlay();
                                }}
                            >
                                {/* Background Image */}
                                <div className="absolute inset-0">
                                    <img
                                        src={coverUrl}
                                        alt="Paused Cover"
                                        className="w-full h-full object-cover blur-sm scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/60" /> {/* Dim overlay */}
                                </div>

                                <Play size={64} fill="white" className="text-white drop-shadow-lg scale-110 relative z-30" />
                            </div>

                            {/* Album Art Layer */}
                            <div
                                className={`absolute inset-0 transition-opacity duration-500 z-10 ${viewMode === 'video' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    togglePlay();
                                }}
                            >
                                <img
                                    src={coverUrl}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
                                    {isPlaying ? (
                                        <Pause size={48} fill="white" className="text-white drop-shadow-lg" />
                                    ) : (
                                        <Play size={48} fill="white" className="text-white drop-shadow-lg ml-2" />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="text-center space-y-2 max-w-2xl px-4">
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">{currentTrack.title}</h1>
                            <p
                                className="text-lg text-white/60 font-medium hover:text-[var(--accent)] hover:underline cursor-pointer transition-colors"
                                onClick={handleArtistClick}
                            >
                                {currentTrack.featured_artist || "Unknown Artist"}
                            </p>
                        </div>
                    </div>

                    {/* Right: Up Next / Suggestions */}
                    <div className="col-span-4 h-full pl-8 border-l border-white/5 hidden lg:flex flex-col pt-12">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white/90">Sıradaki Parçalar</h3>
                            <button className="text-xs text-white/40 hover:text-white transition-colors font-medium">Kaydet</button>
                        </div>

                        {/* Queue List */}
                        <div className="flex-1 max-h-[70vh] overflow-y-auto space-y-2 mask-linear-fade no-scrollbar -mr-2 pr-2">
                            {/* Current Playing (Sticky at top) */}
                            <div className="flex items-center gap-3 p-2 rounded-md bg-white/10 border border-[var(--accent)]/30 cursor-default transition-all group mb-2">
                                <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-[#222]">
                                    <img
                                        src={coverUrl}
                                        className="w-full h-full object-cover opacity-100"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                        <div className="w-3 h-3 bg-[var(--accent)] rounded-full animate-pulse shadow-[0_0_10px_var(--accent)]" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-[var(--accent)] truncate">{currentTrack.title}</div>
                                    <div className="text-xs text-white/50 truncate">{currentTrack.featured_artist || "Unknown Artist"}</div>
                                </div>
                                <span className="text-xs font-mono text-[var(--accent)]">Çalıyor</span>
                            </div>

                            {upNext.map((track, i) => (
                                <div
                                    key={track.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        playTrack(track); // Use playTrack from context
                                    }}
                                    className="flex items-center gap-3 p-2 rounded-md hover:bg-white/5 cursor-pointer transition-all group"
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
