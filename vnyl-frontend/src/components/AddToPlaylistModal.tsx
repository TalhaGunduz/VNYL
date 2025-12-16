import React, { useEffect, useState } from 'react';
import { X, Music, Check, Plus, Lock, Globe } from 'lucide-react';
import Swal from 'sweetalert2';

interface AddToPlaylistModalProps {
    trackId: number | null;
    onClose: () => void;
}

const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({ trackId, onClose }) => {
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [addingTo, setAddingTo] = useState<number | null>(null);

    useEffect(() => {
        if (trackId) {
            fetchPlaylists();
        }
    }, [trackId]);

    const fetchPlaylists = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/playlists', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            if (data.status === 'success') {
                setPlaylists(data.playlists);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (playlistId: number) => {
        setAddingTo(playlistId);
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/playlists/${playlistId}/tracks`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ track_id: trackId })
            });
            const data = await res.json();

            if (data.status === 'success') {
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                    background: 'rgba(20, 20, 20, 0.9)',
                    color: '#fff',
                    customClass: {
                        popup: 'backdrop-blur-md border border-white/10'
                    }
                });
                Toast.fire({ icon: 'success', title: 'Added to Library' });
                onClose();
            } else if (data.message === 'Track already in playlist') {
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000,
                    background: 'rgba(20, 20, 20, 0.9)',
                    color: '#fff',
                    customClass: {
                        popup: 'backdrop-blur-md border border-white/10'
                    }
                });
                Toast.fire({ icon: 'info', title: 'Already in Library' });
                setAddingTo(null);
            }
        } catch (error) {
            console.error(error);
            setAddingTo(null);
        }
    };

    if (!trackId) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Apple-style Blur Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-md transition-all duration-300"
                onClick={onClose}
            />

            {/* Modal Content - Glassmorphism & Minimalist */}
            <div className="relative w-full max-w-[360px] bg-[#1c1c1e]/90 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 transform-gpu">

                {/* Header - Simple & Clean */}
                <div className="flex items-center justify-between px-5 pt-5 pb-2">
                    <h2 className="text-[17px] font-semibold text-white tracking-tight">Add to Playlist</h2>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-all"
                    >
                        <X size={14} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="px-5 pb-4">
                    <p className="text-[13px] text-white/40 font-medium">Choose a destination for your track</p>
                </div>

                {/* List - Minimalist Separators */}
                <div className="max-h-[340px] overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white/30"></div>
                        </div>
                    ) : playlists.length > 0 ? (
                        <div className="space-y-0.5 px-2 pb-2">
                            {playlists.map((playlist) => (
                                <button
                                    key={playlist.id}
                                    onClick={() => handleAdd(playlist.id)}
                                    disabled={addingTo === playlist.id}
                                    className="w-full flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-white/10 transition-colors group relative"
                                >
                                    {/* Minimalist Cover Art */}
                                    <div className="w-11 h-11 rounded-[8px] bg-[#2c2c2e] flex items-center justify-center shrink-0 shadow-sm border border-white/5 group-hover:scale-105 transition-transform duration-300">
                                        <Music size={18} className="text-white/20" />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 text-left flex flex-col justify-center h-full border-b border-white/5 pb-2.5 mb-[-10px] group-hover:border-transparent transition-colors">
                                        <div className="text-[15px] text-white font-medium truncate leading-tight">{playlist.title}</div>
                                        <div className="text-[12px] text-white/40 flex items-center gap-1.5 mt-0.5">
                                            {playlist.tracks_count || 0} songs
                                            {!playlist.is_public && <Lock size={9} className="text-white/30" />}
                                        </div>
                                    </div>

                                    {/* Action State */}
                                    <div className="pr-1">
                                        {addingTo === playlist.id ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white/50"></div>
                                        ) : (
                                            <Plus size={18} className="text-white/20 group-hover:text-[var(--accent)] transition-colors" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 px-6">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Music size={20} className="text-white/20" />
                            </div>
                            <p className="text-sm text-white/40 font-medium">No playlists found</p>
                            <button className="mt-3 text-[var(--accent)] text-[13px] font-semibold hover:opacity-80 transition-opacity">
                                Create New Playlist
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddToPlaylistModal;
