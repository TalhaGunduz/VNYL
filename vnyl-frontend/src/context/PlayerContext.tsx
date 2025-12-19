import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

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
}

interface PlayerContextType {
    currentTrack: Track | null;
    isPlaying: boolean;
    isExpanded: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    playTrack: (track: Track) => void;
    togglePlay: () => void;
    setIsExpanded: (expanded: boolean) => void;
    seek: (time: number) => void;
    setVolume: (vol: number) => void;
    isVisible: boolean;
    toggleLike: () => void;
    setCurrentTime: (time: number) => void;
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
            setIsPlaying(false);
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', onEnded);
        };
    }, []);

    // Helper to play a specific track
    const playTrack = (track: Track) => {
        // If it's a YouTube track, just set state and let the UI component handle the player
        if (track.youtube_video_id) {
            if (audioRef.current) {
                audioRef.current.pause(); // Stop any existing audio
                audioRef.current.currentTime = 0;
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

        // New local track
        audio.src = `http://127.0.0.1:8000/storage/${track.file_path}`;
        audio.volume = volume;
        audio.play().then(() => {
            setIsPlaying(true);
        }).catch(e => console.error("Playback failed", e));

        setCurrentTrack(track);
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

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/tracks/${currentTrack.id}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
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
            playTrack,
            togglePlay,
            setIsExpanded,
            seek,
            setVolume: handleVolumeChange,
            isVisible,
            toggleLike,
            setCurrentTime // Export this
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
