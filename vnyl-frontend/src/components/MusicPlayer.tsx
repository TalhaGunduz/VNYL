import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, Mic2, Maximize2, MoreVertical, Heart, Music, ChevronDown } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

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
        toggleLike
    } = usePlayer();

    // Spacebar to toggle play
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                const target = e.target as HTMLElement;
                // Don't toggle if typing in an input
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

                e.preventDefault(); // Prevent scrolling
                togglePlay();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay]);

    if (!isVisible || !currentTrack) return null;

    const formatTime = (time: number) => {
        if (!time) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        seek(time);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const vol = Number(e.target.value);
        setVolume(vol);
    };

    return (
        <>
            {/* Bottom Player Bar - Z Index 50 ensures it is above expanded view (Z Index 40) */}
            <div
                className="fixed bottom-0 left-0 w-full h-24 bg-[#121212] border-t border-white/10 flex items-center justify-between px-6 z-[50] animate-in slide-in-from-bottom-5 fade-in duration-300 cursor-pointer hover:bg-[#1a1a1a] transition-colors"
                onClick={(e) => {
                    // Prevent expand when clicking specific controls
                    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
                    setIsExpanded(!isExpanded);
                }}
            >
                {/* Track Info (Left) */}
                <div className="flex items-center gap-4 w-[30%] min-w-[200px]">
                    <img
                        src={currentTrack.cover_path ? `http://127.0.0.1:8000/storage/${currentTrack.cover_path}` : "https://via.placeholder.com/64"}
                        alt="Cover"
                        className="w-14 h-14 rounded-md object-cover bg-white/5"
                    />
                    <div className="overflow-hidden">
                        <h4 className="font-bold text-white text-sm truncate">{currentTrack.title}</h4>
                        <p className="text-xs text-white/50 truncate hover:text-white transition-colors cursor-pointer">{currentTrack.featured_artist || "Unknown Artist"}</p>
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
                                max={duration || 100}
                                value={currentTime}
                                onChange={handleSeek}
                                className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:opacity-0 group-hover:[&::-webkit-slider-thumb]:opacity-100 transition-all"
                                style={{
                                    background: `linear-gradient(to right, white ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.1) ${(currentTime / (duration || 1)) * 100}%)`
                                }}
                            />
                        </div>
                        <span className="min-w-[40px]">{formatTime(duration)}</span>
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
                    <button className="text-white/60 hover:text-white"><MoreVertical size={18} /></button>
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
                        src={currentTrack.cover_path ? `http://127.0.0.1:8000/storage/${currentTrack.cover_path}` : "https://via.placeholder.com/64"}
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

                    {/* Center: Now Playing Focus (Cols 4-8) - Centered visually */}
                    <div className="col-span-8 flex flex-col items-center justify-center h-full">
                        <div className="w-[45vh] max-w-[500px] aspect-square rounded-lg shadow-2xl elevation-high overflow-hidden relative group mb-8">
                            <img
                                src={currentTrack.cover_path ? `http://127.0.0.1:8000/storage/${currentTrack.cover_path}` : "https://via.placeholder.com/500"}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="text-center space-y-2 max-w-2xl">
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">{currentTrack.title}</h1>
                            <p className="text-xl text-white/60 font-medium">{currentTrack.featured_artist || "Unknown Artist"}</p>
                        </div>
                    </div>

                    {/* Right: Up Next / Suggestions (Cols 9-12) */}
                    <div className="col-span-4 h-full pl-8 border-l border-white/5 hidden lg:flex flex-col">
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Up Next</h3>
                            <button className="text-xs text-white/40 hover:text-white border border-white/10 px-3 py-1 rounded-full uppercase font-bold tracking-wider hover:bg-white/5 transition-all">Save Queue</button>
                        </div>

                        {/* Mock Queue List */}
                        <div className="flex-1 overflow-y-auto pr-2 space-y-1 mask-linear-fade">
                            {/* Current Playing - Highlighted */}
                            <div className="flex items-center gap-3 p-3 rounded-md bg-white/10 border border-white/5">
                                <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                                    <img src={currentTrack.cover_path ? `http://127.0.0.1:8000/storage/${currentTrack.cover_path}` : "https://via.placeholder.com/40"} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <div className="w-3 h-3 bg-[var(--accent)] rounded-full animate-pulse" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-white truncate">{currentTrack.title}</div>
                                    <div className="text-xs text-white/50 truncate">{currentTrack.featured_artist || "Unknown Artist"}</div>
                                </div>
                                <span className="text-xs font-mono text-white/40">Playing</span>
                            </div>

                            {/* Mock Upcoming Items */}
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-md hover:bg-white/5 group transition-colors cursor-pointer">
                                    <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-white/5">
                                        <img src={`https://picsum.photos/seed/${i + 50}/100`} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-white/70 group-hover:text-white truncate">Random Track {i}</div>
                                        <div className="text-xs text-white/40 truncate">Unknown Artist</div>
                                    </div>
                                    <span className="text-xs font-mono text-white/20 group-hover:text-white/40">3:42</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
};

export default MusicPlayer;
