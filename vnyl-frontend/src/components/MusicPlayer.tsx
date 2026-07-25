import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, Maximize2, Heart, ChevronDown, Rewind, FastForward } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import YouTube, { YouTubeProps } from 'react-youtube';
import { useNavigate, useLocation } from 'react-router-dom';
import Waveform from './Waveform';
import Navbar from './Navbar';

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
        playTrack,
        queue,
        playNext,
        playPrevious,
        setQueue
    } = usePlayer();

    const navigate = useNavigate();
    const location = useLocation();

    // Close player when route changes
    useEffect(() => {
        setIsExpanded(false);
    }, [location.pathname]);

    // Loop State: 'none' | 'all' | 'one'
    const [loopMode, setLoopMode] = useState<'none' | 'all' | 'one'>('none');

    // Up Next / Suggestions Logic
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'song' | 'video'>('song');

    // Fetch Suggestions (Similar Tracks)
    // Modified: Only fetch if empty to keep list stable and persistent
    useEffect(() => {
        if (isExpanded && suggestions.length === 0 && currentTrack) {
            fetch(`http://127.0.0.1:8000/api/tracks/random?limit=20`)
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        // Filter out current track if present in random list
                        const newSuggestions = data.tracks.filter((t: any) => t.id !== currentTrack.id);
                        setSuggestions(newSuggestions);
                    }
                })
                .catch(err => console.error("Failed to fetch suggestions", err));
        }
    }, [isExpanded]); // Removed currentTrack dependency to prevent re-shuffle

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
        if (currentTrack?.artist?.slug || currentTrack?.artist?.id) {
            setIsExpanded(false); // Close full screen if open
            navigate(`/artist/${currentTrack.artist.slug || currentTrack.artist.id}`);
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

    // Move shuffle state here
    const [isShuffle, setIsShuffle] = useState(false);

    const toggleShuffle = () => {
        setIsShuffle(!isShuffle);
        if (!isShuffle && queue.length > 0) {
            // Shuffle Logic
            const shuffled = [...queue].sort(() => 0.5 - Math.random());
            // Ensure current track is first or preserved? 
            // Usually we want to shuffle the REST of the queue.
            // But simplified: just shuffle and update.
            setQueue(shuffled);
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
            // Ended
            if (loopMode === 'one') {
                // Restart current track
                if (playerRef.current) {
                    playerRef.current.seekTo(0);
                    playerRef.current.playVideo();
                }
            } else if (loopMode === 'all') {
                // Check if last in queue, if so go to start
                const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
                if (currentIndex === queue.length - 1 && queue.length > 0) {
                    playTrack(queue[0]);
                } else {
                    playNext();
                }
            } else {
                // Normal Mode
                // Check if there is a next track in queue
                const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
                if (currentIndex >= 0 && currentIndex < queue.length - 1) {
                    playNext();
                } else {
                    // Queue finished or empty: Fallback to Similar Tracks (Auto-Flow)
                    if (suggestions.length > 0) {
                        // Play first suggestion and set it as new queue!
                        playTrack(suggestions[0], suggestions);
                    }
                }
            }
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

    // Use Suggestions (Similar Tracks) instead of Queue
    // Modified: sideList now derives from current QUEUE if available, to keep it stable
    const currentQueueIndex = queue.findIndex(t => t.id === currentTrack.id);

    // If we have a queue and the current track is in it, show the queue starting from current
    // Otherwise fallback to suggestions
    // MODIFIED: User wants to see previous tracks too, so we don't slice anymore.
    const sideList = (queue.length > 0 && currentQueueIndex !== -1)
        ? queue // Show FULL queue
        : suggestions;

    // ... (useEffect remains same)

    // ... (Scroll down to Rendering Loop)

    // In Rendering Loop:
    {
        sideList.map((track, i) => {
            const isCurrent = currentTrack?.id === track.id;
            return (
                <div
                    key={track.id}
                    onClick={(e) => {
                        e.stopPropagation();
                        playTrack(track, sideList);
                    }}
                    className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all group ${isCurrent ? 'bg-white/10' : 'hover:bg-white/5'}`}
                >
                    <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-[#222]">
                        <img
                            src={track.cover_image || (track.cover_path ? `http://127.0.0.1:8000/storage/${track.cover_path}` : "https://via.placeholder.com/64")}
                            className={`w-full h-full object-cover transition-opacity ${isCurrent ? 'opacity-40' : 'opacity-80 group-hover:opacity-100'}`}
                        />
                        <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} bg-black/40`}>
                            {isCurrent && isPlaying ? (
                                <div className="flex gap-[2px] items-end h-4">
                                    <span className="w-1 bg-[var(--accent)] animate-[music-bar_1s_ease-in-out_infinite] h-2"></span>
                                    <span className="w-1 bg-[var(--accent)] animate-[music-bar_1.2s_ease-in-out_infinite_0.1s] h-3"></span>
                                    <span className="w-1 bg-[var(--accent)] animate-[music-bar_0.8s_ease-in-out_infinite_0.2s] h-1"></span>
                                </div>
                            ) : (
                                <Play size={16} fill="white" className="text-white" />
                            )}
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className={`text-sm font-bold truncate transition-colors ${isCurrent ? 'text-[var(--accent)]' : 'text-white group-hover:text-[var(--accent)]'}`}>
                            {track.title}
                        </div>
                        <div className="text-xs text-white/50 truncate">{track.featured_artist || track.artist?.stage_name || track.user?.name || "Unknown Artist"}</div>
                    </div>
                    <span className="text-xs font-mono text-white/40">{track.duration ? formatTime(track.duration) : "--:--"}</span>
                </div>
            );
        })
    }

    // Fetch Suggestions (Similar Tracks) only if suggestions are empty or strictly needed


    // Toggle Loop Mode
    const toggleLoop = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (loopMode === 'none') setLoopMode('all');
        else if (loopMode === 'all') setLoopMode('one');
        else setLoopMode('none');
    };

    // Smart Previous Logic
    const handlePrevious = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentTime > 3) {
            seek(0);
            if (playerRef.current) playerRef.current.seekTo(0, true);
        } else {
            playPrevious();
        }
    };

    return (
        <>
            {/* Hidden YouTube Player */}
            <div className="hidden">
                {/* This seems to be where the YouTube component was mounted in the original file but hidden. 
                     Wait, looking at the original file lines 226-227, it said "Hidden YouTube Player".
                     But the actual YouTube player was inside the full screen overlay (line 418).
                     Ah, there might be a global hidden player needed if not expanded?
                     
                     Looking at original file (Line 418): The YouTube component is rendered inside the Full Screen Overlay.
                     But what if it is minimized?
                     
                     Line 428: `className="w-full h-full pointer-events-none"` for full screen.
                     Wait, if Full Screen is closed (isExpanded=false), that div is `translate-y-full`.
                     So the player is still mounted there. That's fine.
                     
                     However, in the original file, checking carefully lines 226-228...
                     There was comment `{/* Hidden YouTube Player * /}` and `{/* ... * /}`. 
                     Wait, did I miss something in `view_file`?
                     Line 227 and 228 were just comments in my previous `view_file` output?
                     Let me check the `view_file` output again.
                     Line 226: `{/* Hidden YouTube Player * /}`
                     Line 227: `{/* ... * /}`
                     Line 229: `{/* Bottom Player Bar ... * /}`
                     
                     Ah, it seems the original code might have had something there in previous versions or it was just a placeholder comment.
                     But wait, the `YouTube` component is ONLY in the expanded view (Line 418).
                     This means if I close the expanded view, does the music stop?
                     Line 358: `fixed inset-0 ... translate-y-full`. This moves it offscreen but KEEPS IT IN DOM.
                     So logic holds.
                 */}
            </div>

            {/* Bottom Player Bar */}
            <div
                className="fixed bottom-0 left-0 w-full h-20 md:h-24 bg-[#121212] border-t border-white/10 flex items-center justify-between px-4 md:px-6 z-[50] animate-in slide-in-from-bottom-5 fade-in duration-300 cursor-pointer hover:bg-[#1a1a1a] transition-colors"
                onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('a')) return;
                    setIsExpanded(!isExpanded);
                }}
            >
                {/* Track Info (Left) - Resilient on Mobile */}
                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 mr-4 md:mr-0 md:flex-none md:w-[30%] md:min-w-[200px]">
                    <img
                        src={coverUrl}
                        alt="Cover"
                        className="w-10 h-10 md:w-14 md:h-14 rounded-md object-cover bg-white/5 flex-shrink-0"
                    />
                    <div className="overflow-hidden min-w-0">
                        <h4 className="font-bold text-white text-sm truncate leading-tight">{currentTrack.title}</h4>
                        <p
                            className="text-xs text-white/50 truncate hover:text-[var(--accent)] hover:underline transition-colors cursor-pointer block"
                            onClick={handleArtistClick}
                        >
                            {currentTrack.featured_artist || currentTrack.artist?.stage_name || currentTrack.user?.name || "Unknown Artist"}
                        </p>
                    </div>
                    <button
                        className={`transition-colors ml-1 hidden md:block ${currentTrack.is_liked ? 'text-[var(--accent)]' : 'text-white/40 hover:text-white'}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleLike();
                        }}
                    >
                        <Heart size={18} fill={currentTrack.is_liked ? "currentColor" : "none"} />
                    </button>
                </div>

                {/* Mobile Controls (Visible only on small screens) */}
                <div className="flex items-center gap-4 md:hidden flex-shrink-0 z-20">
                    <button
                        className={`transition-colors ${currentTrack.is_liked ? 'text-[var(--accent)]' : 'text-white/40 hover:text-white'}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleLike();
                        }}
                    >
                        <Heart size={20} fill={currentTrack.is_liked ? "currentColor" : "none"} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            togglePlay();
                        }}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black"
                    >
                        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                    </button>
                </div>

                {/* Desktop Controls (Center) - Hidden on Mobile */}
                <div className="hidden md:flex flex-col items-center justify-center w-[40%] text-center z-20 mb-2">
                    <div className="flex items-center gap-6">
                        <button
                            className={`transition-colors relative ${isShuffle ? 'text-[var(--accent)]' : 'text-white/30 hover:text-white'}`}
                            onClick={(e) => { e.stopPropagation(); toggleShuffle(); }}
                        >
                            <Shuffle size={16} />
                            {isShuffle && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-current rounded-full" />}
                        </button>

                        <button
                            className="text-white/60 hover:text-white transition-colors hover:scale-110"
                            onClick={handlePrevious}
                        >
                            <SkipBack size={20} fill="currentColor" />
                        </button>

                        <button
                            className="text-white/40 hover:text-white transition-colors p-2 hover:scale-110"
                            onClick={(e) => { e.stopPropagation(); seek(currentTime - 10); if (playerRef.current) playerRef.current.seekTo(currentTime - 10, true); }}
                            title="-10s"
                        >
                            <Rewind size={18} fill="currentColor" />
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                togglePlay();
                            }}
                            className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform shadow-lg shadow-white/10"
                        >
                            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                        </button>

                        <button
                            className="text-white/40 hover:text-white transition-colors p-2 hover:scale-110"
                            onClick={(e) => { e.stopPropagation(); seek(currentTime + 10); if (playerRef.current) playerRef.current.seekTo(currentTime + 10, true); }}
                            title="+10s"
                        >
                            <FastForward size={18} fill="currentColor" />
                        </button>

                        <button
                            className="text-white/60 hover:text-white transition-colors hover:scale-110"
                            onClick={(e) => { e.stopPropagation(); playNext(); }}
                        >
                            <SkipForward size={20} fill="currentColor" />
                        </button>

                        {/* LOOP BUTTON */}
                        <button
                            className={`transition-colors relative ${loopMode !== 'none' ? 'text-[var(--accent)]' : 'text-white/30 hover:text-white'}`}
                            onClick={(e) => { e.stopPropagation(); toggleLoop(e); }}
                        >
                            <Repeat size={16} />
                            {loopMode === 'one' && (
                                <span className="absolute -top-[2px] -right-[6px] text-[8px] font-bold bg-[#121212] px-[2px] rounded-sm text-[var(--accent)]">1</span>
                            )}
                            {loopMode === 'all' && (
                                <span className="absolute -bottom-[4px] left-1/2 -translate-x-1/2 w-1 h-1 bg-current rounded-full"></span>
                            )}
                        </button>
                    </div>
                </div>

                {/* VISUAL Waveform Background (Non-Functional) */}
                <div className="absolute bottom-1 left-0 w-full h-8 opacity-40 pointer-events-none z-0">
                    <Waveform isPlaying={isPlaying} color="var(--accent)" />
                </div>

                {/* FUNCTIONAL Progress Line - Positioned at top for mobile, bottom for desktop? No, bottom is standard but touch target needs key */}
                <div
                    className="absolute top-0 md:top-auto md:bottom-0 left-0 w-full h-[2px] md:h-1 bg-white/10 cursor-pointer z-50 group/line hover:h-2 transition-all"
                    onClick={(e) => {
                        e.stopPropagation(); // Stop propagation explicitly
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const width = rect.width;
                        const percentage = x / width;
                        const newTime = percentage * (currentTrack.duration || duration || 100);
                        seek(newTime);
                        if (currentTrack.youtube_video_id && playerRef.current) {
                            playerRef.current.seekTo(newTime, true);
                        }
                    }}
                >
                    {/* The Fill Line */}
                    <div
                        className="h-full bg-[var(--accent)] relative"
                        style={{ width: `${(currentTime / (currentTrack.duration || duration || 1)) * 100}%` }}
                    >
                        {/* Handle Helper (Knob) */}
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/line:opacity-100 transition-opacity shadow-md" />
                    </div>

                </div>

                {/* Desktop Volume/Tools - Hidden on Mobile */}
                <div className="hidden md:flex items-center justify-end w-[30%] gap-4 min-w-[200px]">
                    {/* Time Display */}
                    <div className="text-xs font-mono text-white/40 tracking-wider">
                        {formatTime(Math.min(currentTime, currentTrack.duration || duration || currentTime))} <span className="text-white/20">/</span> {formatTime(currentTrack.duration || duration)}
                    </div>
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

            {/* Full Screen Player Overlay */}
            <div
                className={`fixed inset-0 bg-[#0a0a0a] z-[40] flex flex-col pb-24 transition-transform duration-[280ms] ease-out ${isExpanded ? 'translate-y-0' : 'translate-y-full'}`}
                style={{ transitionTimingFunction: isExpanded ? 'cubic-bezier(0.22, 1, 0.36, 1)' : 'cubic-bezier(0.32, 0, 0.67, 0)' }}
            >
                {/* Blurred Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
                    <img
                        src={coverUrl}
                        className="w-full h-full object-cover blur-[120px]"
                    />
                    <div className="absolute inset-0 bg-black/60" />
                </div>

                {/* Navbar (Custom Injected for Full Screen) */}
                <div className="relative z-50">
                    <Navbar />
                </div>

                {/* Close Button Row */}
                <div className="relative z-40 w-full flex justify-end items-center px-6 pt-4 pb-0">
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="bg-white/5 hover:bg-white/10 text-white/50 hover:text-white p-2 rounded-full transition-all"
                        title="Close Player"
                    >
                        <ChevronDown size={28} />
                    </button>
                </div>

                {/* Main Content Layout - Centered */}
                <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 md:px-12 pb-40 md:pb-32 pt-4 h-full overflow-y-auto md:overflow-hidden no-scrollbar">

                    {/* Center: Now Playing Focus */}
                    <div
                        className="col-span-1 lg:col-span-8 flex flex-col items-center justify-start h-full cursor-pointer pt-6 md:pt-4 lg:pt-14"
                        onClick={(e) => {
                            if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
                            togglePlay();
                        }}
                    >
                        {/* Toggle Song / Video */}
                        {
                            currentTrack.youtube_video_id && (
                                <div className="flex items-center gap-1 bg-white/10 p-1 rounded-full mb-6 relative z-30">
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
                            )
                        }

                        <div
                            className={`relative group mb-8 shrink-0 transition-all duration-500 ease-out shadow-2xl elevation-high rounded-lg overflow-hidden ${viewMode === 'video' ? 'w-full max-w-[90vw] aspect-video md:w-[90%] md:max-w-[50rem] max-h-[55vh]' : 'w-[80vw] aspect-square max-w-[320px] md:w-[50vh] md:max-w-[450px] md:max-h-[50vh]'}`}
                        >
                            {/* Video Layer */}
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

                            {/* Video Pause Overlay */}
                            <div
                                className={`absolute inset-0 z-20 flex items-center justify-center transition-opacity duration-300 overflow-hidden ${viewMode === 'video' && !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    togglePlay();
                                }}
                            >
                                <div className="absolute inset-0">
                                    <img
                                        src={coverUrl}
                                        alt="Paused Cover"
                                        className="w-full h-full object-cover blur-sm scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/60" />
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
                                {currentTrack.featured_artist || currentTrack.artist?.stage_name || currentTrack.user?.name || "Unknown Artist"}
                            </p>
                        </div>
                    </div>

                    {/* Right: Benzer Parçalar (was Queue) */}
                    <div className="col-span-4 h-full pl-8 border-l border-white/5 hidden lg:flex flex-col pt-14">
                        {/* Header */}
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white/90">
                                Benzer Parçalar
                            </h3>
                        </div>

                        {/* List - Using sideList (suggestions) */}
                        <div className="flex-1 max-h-[70vh] overflow-y-auto space-y-2 mask-linear-fade no-scrollbar -mr-2 pr-2">

                            {sideList.map((track, i) => {
                                const isCurrent = currentTrack?.id === track.id;
                                return (
                                    <div
                                        key={track.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            playTrack(track, sideList);
                                        }}
                                        id={isCurrent ? 'current-track-item' : undefined}
                                        className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all group ${isCurrent ? 'bg-white/10 ring-1 ring-white/5 shadow-lg scale-[1.02] my-2' : 'hover:bg-white/5'}`}
                                    >
                                        <div className={`relative rounded overflow-hidden flex-shrink-0 bg-[#222] ${isCurrent ? 'w-14 h-14' : 'w-12 h-12'}`}>
                                            <img
                                                src={track.cover_image || (track.cover_path ? `http://127.0.0.1:8000/storage/${track.cover_path}` : "https://via.placeholder.com/64")}
                                                className={`w-full h-full object-cover transition-opacity ${isCurrent ? 'opacity-40' : 'opacity-80 group-hover:opacity-100'}`}
                                            />
                                            <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} bg-black/40`}>
                                                {isCurrent && isPlaying ? (
                                                    <div className="flex gap-[2px] items-end h-4">
                                                        <span className="w-1 bg-[var(--accent)] animate-[music-bar_1s_ease-in-out_infinite] h-2"></span>
                                                        <span className="w-1 bg-[var(--accent)] animate-[music-bar_1.2s_ease-in-out_infinite_0.1s] h-3"></span>
                                                        <span className="w-1 bg-[var(--accent)] animate-[music-bar_0.8s_ease-in-out_infinite_0.2s] h-1"></span>
                                                    </div>
                                                ) : (
                                                    <Play size={16} fill="white" className="text-white" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-bold truncate transition-colors ${isCurrent ? 'text-[var(--accent)] text-base' : 'text-white text-sm group-hover:text-[var(--accent)]'}`}>
                                                {track.title}
                                            </div>
                                            <div className={`text-white/50 truncate ${isCurrent ? 'text-sm' : 'text-xs'}`}>{track.featured_artist || track.artist?.stage_name || track.user?.name || "Unknown Artist"}</div>
                                        </div>
                                        <span className="text-xs font-mono text-white/40">{track.duration ? formatTime(track.duration) : "--:--"}</span>
                                    </div>
                                );
                            })}

                            {sideList.length === 0 && (
                                <div className="text-center text-white/30 py-10 text-sm">
                                    Benzer parça bulunamadı.
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
