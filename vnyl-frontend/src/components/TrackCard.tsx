import React, { useState } from 'react';
import { Play, Heart, MoreVertical, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TrackCardProps {
    track: any;
    onClick: () => void;
    onLike: () => void;
    onAddToPlaylist: () => void;
    onMenuClick: (e: React.MouseEvent) => void;
}

const TrackCard: React.FC<TrackCardProps> = ({ track, onClick, onLike, onMenuClick }) => {
    const [imgError, setImgError] = useState(false);
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
            navigate(`/artist/${track.artist.slug || track.artist.id}`);
        } else if (track.artist?.id) {
            navigate(`/artist/${track.artist.id}`);
        } else {
            console.warn("No artist linked for this track");
        }
    };

    return (
        <div
            className="group relative w-[220px] bg-[#161616] hover:bg-[#1f1f1f] p-3 rounded-[24px] transition-all duration-300 cursor-pointer border border-white/5 hover:border-white/10 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50"
            onClick={onClick}
        >
            {/* Uniquely Styled Image Container */}
            <div className="relative aspect-square w-full rounded-[16px] overflow-hidden bg-[#000] shadow-inner mb-4 flex items-center justify-center">
                {!imgError ? (
                    <img
                        src={imageUrl || fallbackUrl}
                        alt={track.title}
                        referrerPolicy="no-referrer"
                        onError={() => setImgError(true)}
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-white/20 group-hover:text-[var(--accent)] transition-colors">
                        <Music size={40} />
                    </div>
                )}

                {/* Play Button - Lower z-index than actions */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 pointer-events-none">
                    <div className="w-12 h-12 bg-[var(--accent)] text-black rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 pointer-events-auto">
                        <Play fill="currentColor" size={20} className="ml-0.5" />
                    </div>
                </div>

                {/* Heart Icon Overlay - Higher z-index to be clickable */}
                <button
                    className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all z-20 ${track.is_liked ? 'bg-red-500/20 text-red-500 backdrop-blur-md' : 'bg-black/30 text-white/50 hover:text-white backdrop-blur-md hover:bg-black/50'}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onLike();
                    }}
                >
                    <Heart size={14} fill={track.is_liked ? "currentColor" : "none"} />
                </button>
            </div>

            {/* Card Metadata */}
            <div className="px-1 pb-2 relative">
                <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-white text-[15px] leading-tight line-clamp-1" title={track.title}>
                        {track.title}
                    </h3>

                    {/* Context Menu Trigger - Now externally controlled */}
                    <button
                        data-menu-trigger="true"
                        className="text-white/30 hover:text-white transition-colors p-1 flex-shrink-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onMenuClick(e);
                        }}
                    >
                        <MoreVertical size={18} />
                    </button>
                </div>

                {/* Clickable Artist Name */}
                <p
                    className="text-white/40 text-[13px] font-medium mt-1 truncate hover:text-[var(--accent)] hover:underline transition-colors w-fit"
                    onClick={handleArtistClick}
                >
                    {track.featured_artist}
                </p>
                {track.description && (
                    <p className="text-white/30 text-[11px] truncate mt-0.5">{track.description}</p>
                )}
            </div>
        </div>
    );
};

export default TrackCard;
