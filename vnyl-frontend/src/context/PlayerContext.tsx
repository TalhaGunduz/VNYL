import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';

interface Track {
    id: number;
    title: string;
    description?: string;
    cover_path?: string;
    file_path: string | null;
    youtube_video_id?: string | null;
    cover_image?: string | null;
    featured_artist?: string;
    analysis?: {
        bpm?: number;
        key?: string;
        mode?: string;
        energy?: number;
        primary_genre?: string;
        duration?: number;
    };
    is_liked?: boolean;
    likes_count?: number;
    duration?: number; // Added duration
    artist?: {
        id: number;
        slug: string;
        stage_name: string;
    };
    user?: {
        id: number;
        name: string;
    };
}

interface PlayerContextType {
    currentTrack: Track | null;
    isPlaying: boolean;
    isExpanded: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    queue: Track[]; // Added queue
    playTrack: (track: Track, queue?: Track[]) => void; // Updated signature
    playNext: () => void; // Added
    playPrevious: () => void; // Added
    togglePlay: () => void;
    setIsExpanded: (expanded: boolean) => void;
    seek: (time: number) => void;
    setVolume: (vol: number) => void;
    isVisible: boolean;
    toggleLike: () => void;
    setCurrentTime: (time: number) => void;
    setDuration: (duration: number) => void;
    setQueue: (queue: Track[]) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isVisible, setIsVisible] = useState(true);
    const [queue, setQueue] = useState<Track[]>([]); // Added queue state

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const location = useLocation();

    // Define restricted routes where player should be hidden/stopped
    const restrictedRoutes = [
        '/upload',
        '/edit-profile',
        '/settings',
        '/login',
        '/signup',
        '/create-account',
        '/become-artist',
        '/artist/complete-profile'
    ];

    // Monitor Route Changes
    useEffect(() => {
        const isRestricted = restrictedRoutes.some(route => location.pathname.startsWith(route));

        if (isRestricted) {
            // Stop playback and hide
            if (isPlaying && audioRef.current) {
                audioRef.current.pause();
                setIsPlaying(false);
            }
            setIsVisible(false);
            setIsExpanded(false); // Also collapse if expanded
        } else {
            // Show player
            setIsVisible(true);
        }
    }, [location.pathname]);

    // Initialize Audio
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
        }

        const audio = audioRef.current;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const onEnded = () => {
            // Auto-play next logic is handled in MusicPlayer or here
            // Ideally here for better abstraction, but MusicPlayer handles YouTube vs Audio
            // For now, let's trigger playNext if not YouTube, OR expose a callback.
            // Actually, simplest is to let MusicPlayer handle 'playNext' trigger on 'onEnded'
            setIsPlaying(false);
            playNext(); // Try to play next
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', onEnded);
        };
    }, [queue, currentTrack]); // Re-bind when queue changes

    // Helper to play a specific track
    const playTrack = (track: Track, newQueue?: Track[]) => {
        if (newQueue) {
            setQueue(newQueue);
        }

        // If it's a YouTube track, just set state and let the UI component handle the player
        if (track.youtube_video_id) {
            if (audioRef.current) {
                audioRef.current.pause(); // Stop any existing audio
                audioRef.current.currentTime = 0;
            }
            if (currentTrack?.id !== track.id) {
                // Increment Play Count
                fetch(`http://127.0.0.1:8000/api/tracks/${track.id}/play`, { method: 'POST' }).catch(e => console.error(e));
            }
            setCurrentTrack(track);
            setIsPlaying(true);
            return;
        }

        // Standard Audio File Logic
        if (!audioRef.current) return;
        const audio = audioRef.current;

        if (currentTrack?.id === track.id) {
            togglePlay();
            return;
        }

        // New local track - Use stream endpoint for Safari support (Range Requests)
        const filename = track.file_path ? track.file_path.replace('tracks/', '') : '';
        audio.src = `http://127.0.0.1:8000/api/tracks/stream/${filename}`;
        audio.volume = volume;
        audio.play().then(() => {
            setIsPlaying(true);
            // Increment Play Count
            fetch(`http://127.0.0.1:8000/api/tracks/${track.id}/play`, { method: 'POST' }).catch(e => console.error(e));
        }).catch(e => console.error("Playback failed", e));

        setCurrentTrack(track);
    };

    const playNext = () => {
        if (!queue.length || !currentTrack) return;
        const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
        if (currentIndex >= 0 && currentIndex < queue.length - 1) {
            playTrack(queue[currentIndex + 1]);
        } else {
            setIsPlaying(false); // End of queue
        }
    };

    const playPrevious = () => {
        if (!queue.length || !currentTrack) return;
        const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
        if (currentIndex > 0) {
            playTrack(queue[currentIndex - 1]);
        } else {
            // Optionally restart current track
            seek(0);
        }
    };


    // Helper to toggle play/pause
    const togglePlay = () => {
        // If YouTube, just toggle state (MusicPlayer will react)
        if (currentTrack?.youtube_video_id) {
            setIsPlaying(!isPlaying);
            return;
        }

        if (!audioRef.current || !currentTrack) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    // Toggle Like for Current Track
    const toggleLike = async () => {
        if (!currentTrack) return;

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
                    window.location.href = '/login';
                }
            });
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/tracks/${currentTrack.id}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

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
                    if (result.isConfirmed) {
                        window.location.href = '/login';
                    }
                });
                return;
            }

            const data = await response.json();

            if (data.status === 'success') {
                setCurrentTrack(prev => prev ? { ...prev, is_liked: data.liked, likes_count: data.total_likes } : null);
            }
        } catch (error) {
            console.error("Error toggling like", error);
        }
    };

    const seek = (time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handleVolumeChange = (vol: number) => {
        setVolume(vol);
        if (audioRef.current) {
            audioRef.current.volume = vol;
        }
    };

    return (
        <PlayerContext.Provider value={{
            currentTrack,
            isPlaying,
            isExpanded,
            currentTime,
            duration,
            volume,
            queue, // Expose
            playTrack,
            playNext, // Expose
            playPrevious, // Expose
            togglePlay,
            setIsExpanded,
            seek,
            setVolume: handleVolumeChange,
            isVisible,
            toggleLike,
            setCurrentTime, // Export this
            setDuration, // Export this
            setQueue
        }}>
            {children}
        </PlayerContext.Provider>
    );
};

export const usePlayer = () => {
    const context = useContext(PlayerContext);
    if (context === undefined) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
    return context;
};

