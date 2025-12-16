import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface Track {
    id: number;
    title: string;
    description?: string;
    cover_path?: string;
    file_path: string;
    featured_artist?: string;
    analysis?: {
        bpm?: number;
        key?: string;
        mode?: string;
        energy?: number;
        primary_genre?: string;
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
        '/settings', // Assuming settings route exists or will exist
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
            // Show player (but don't auto-resume unless we want to, likely just show bar)
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
            // logic for next track could go here
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
        if (!audioRef.current) return;
        const audio = audioRef.current;

        if (currentTrack?.id === track.id) {
            togglePlay();
            return;
        }

        // New track
        audio.src = `http://127.0.0.1:8000/storage/${track.file_path}`;
        audio.volume = volume;
        audio.play().then(() => {
            setIsPlaying(true);
        }).catch(e => console.error("Playback failed", e));

        setCurrentTrack(track);
    };

    // Helper to toggle play/pause
    const togglePlay = () => {
        if (!audioRef.current || !currentTrack) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
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
            isVisible
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
