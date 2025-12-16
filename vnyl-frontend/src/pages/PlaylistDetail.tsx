import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, Clock, User, Heart, Lock, Globe, Plus, Music, MoreVertical, Settings } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import Swal from 'sweetalert2';
import PlaylistModal from '../components/PlaylistModal';

const PlaylistDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { playTrack, currentTrack, isPlaying } = usePlayer();
    const [playlist, setPlaylist] = useState<any>(null);
    const [suggestedTracks, setSuggestedTracks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchPlaylist = async () => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/playlists/${id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (data.status === 'success') {
                setPlaylist(data.playlist);
                setIsOwner(data.is_owner);
            } else {
                Swal.fire('Error', data.message || 'Failed to load playlist', 'error');
                navigate('/profile');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSuggestedTracks = async () => {
        // Fetch public tracks to suggest
        try {
            const res = await fetch('http://127.0.0.1:8000/api/public-tracks');
            const data = await res.json();
            if (data.status === 'success') {
                setSuggestedTracks(data.tracks);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchPlaylist();
        fetchSuggestedTracks();
    }, [id]);

    const savePlaylistChanges = async (title: string, description: string, isPublic: boolean) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/playlists/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    description,
                    is_public: isPublic
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setPlaylist(data.playlist); // Update local state
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000,
                    background: 'rgba(20, 20, 20, 0.9)',
                    color: '#fff',
                    customClass: { popup: 'backdrop-blur-md border border-white/10' }
                });
                Toast.fire({ icon: 'success', title: 'Start Settings Updated' });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddTrack = async (trackId: number) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/playlists/${id}/tracks`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ track_id: trackId })
            });
            const data = await res.json();
            if (data.status === 'success') {
                // Refresh playlist
                fetchPlaylist();
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 1500,
                    background: '#1a1a1a',
                    color: '#fff',
                    timerProgressBar: true,
                });
                Toast.fire({ icon: 'success', title: 'Added to playlist' });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleRemoveTrack = async (trackId: number) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/playlists/${id}/tracks`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ track_id: trackId })
            });
            const data = await res.json();
            if (data.status === 'success') {
                fetchPlaylist();
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="min-h-screen pt-24 text-center text-white">Loading...</div>;
    if (!playlist) return null;

    return (
        <div className="min-h-screen bg-bg text-fg font-sans pb-32">
            {/* Header */}
            <div className="pt-24 px-6 md:px-12 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row gap-8 items-end">
                    {/* Art */}
                    <div className="w-52 h-52 md:w-64 md:h-64 bg-[#1c1c1e] rounded-xl shadow-2xl flex items-center justify-center relative overflow-hidden group border border-white/5">
                        {playlist.tracks && playlist.tracks.filter((t: any) => t.cover_path).length >= 4 ? (
                            <div className="grid grid-cols-2 w-full h-full">
                                {playlist.tracks.filter((t: any) => t.cover_path).slice(0, 4).map((t: any, i: number) => (
                                    <img key={i} src={`http://127.0.0.1:8000/storage/${t.cover_path}`} className="w-full h-full object-cover" />
                                ))}
                            </div>
                        ) : playlist.tracks && playlist.tracks.find((t: any) => t.cover_path) ? (
                            <img src={`http://127.0.0.1:8000/storage/${playlist.tracks.find((t: any) => t.cover_path).cover_path}`} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-gray-900 flex items-center justify-center">
                                <Music size={64} className="text-white/20" />
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 mb-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-white/60 mb-3 uppercase tracking-wider">
                            {!playlist.is_public ? <><Lock size={12} /> Private Playlist</> : <><Globe size={12} /> Public Playlist</>}
                        </div>
                        <h1 className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tighter drop-shadow-2xl">{playlist.title}</h1>
                        {playlist.description && <p className="text-white/60 text-lg mb-6 line-clamp-2 font-medium">{playlist.description}</p>}

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
                                    <img
                                        src={playlist.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(playlist.user?.name || 'User')}&background=random`}
                                        alt={playlist.user?.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <span className="text-white font-bold text-sm hover:underline cursor-pointer">{playlist.user?.name}</span>
                            </div>
                            <span className="text-white/40">•</span>
                            <span className="text-white/60 text-sm font-medium">{playlist.tracks?.length || 0} songs</span>
                            {playlist.tracks?.length > 0 && (
                                <>
                                    <span className="text-white/40">•</span>
                                    <span className="text-white/60 text-sm font-medium">{Math.round(playlist.tracks.reduce((acc: number, t: any) => acc + (t.analysis?.duration || 0), 0) / 60)} min</span>
                                </>
                            )}
                        </div>

                        {/* Actions */}
                        {isOwner && (
                            <div className="mt-6 flex items-center gap-3">
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white rounded-full font-semibold text-sm transition-colors border border-white/5 hover:border-white/10 shadow-lg"
                                >
                                    <Settings size={16} />
                                    Edit Settings
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            <PlaylistModal
                mode="edit"
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                initialTitle={playlist.title}
                initialDescription={playlist.description}
                initialPublic={playlist.is_public === 1 || playlist.is_public === true}
                onSave={savePlaylistChanges}
            />

            {/* Content */}
            <div className="mt-12 px-6 md:px-12 max-w-7xl mx-auto">

                {/* Track List */}
                <div className="space-y-1 mb-16">
                    {playlist.tracks && playlist.tracks.length > 0 ? (
                        playlist.tracks.map((track: any, idx: number) => (
                            <div key={track.id} className="group flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                                <div className="w-8 text-center text-white/40 group-hover:hidden">{idx + 1}</div>
                                <div className="w-8 hidden group-hover:flex items-center justify-center">
                                    <button onClick={() => playTrack(track)}>
                                        {currentTrack?.id === track.id && isPlaying ? <Pause size={16} className="text-[var(--accent)]" /> : <Play size={16} className="text-white" />}
                                    </button>
                                </div>

                                <div className="w-12 h-12 bg-white/5 rounded-md overflow-hidden shrink-0">
                                    {track.cover_path && <img src={`http://127.0.0.1:8000/storage/${track.cover_path}`} className="w-full h-full object-cover" />}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="text-white font-bold truncate">{track.title}</div>
                                    <div className="text-white/40 text-sm truncate">{track.user?.name || track.featured_artist}</div>
                                </div>

                                <div className="text-white/40 text-sm w-24 text-right hidden md:block">
                                    {track.analysis?.bpm ? `${Math.round(track.analysis.bpm)} BPM` : '-'}
                                </div>
                                <div className="text-white/40 text-sm w-16 text-right">
                                    {track.analysis?.duration ? new Date(track.analysis.duration * 1000).toISOString().substr(14, 5) : '03:42'}
                                </div>

                                {/* Remove Action (if owner) */}
                                <button onClick={() => handleRemoveTrack(track.id)} className="opacity-0 group-hover:opacity-100 p-2 text-white/40 hover:text-red-500 transition-all">
                                    Remove
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="py-12 text-center text-white/30 border-b border-white/5">
                            Playlist is empty. Add songs below!
                        </div>
                    )}
                </div>

                {/* Suggested Tracks (Add Section) */}
                <div className="border-t border-white/10 pt-8">
                    <h3 className="text-xl font-bold text-white mb-6">Recommended Songs</h3>
                    <div className="space-y-1">
                        {suggestedTracks.filter(st => !playlist.tracks?.some((pt: any) => pt.id === st.id)).slice(0, 10).map((track) => (
                            <div key={track.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                                <div className="w-12 h-12 bg-white/5 rounded-md overflow-hidden shrink-0 relative group/img">
                                    {track.cover_path && <img src={`http://127.0.0.1:8000/storage/${track.cover_path}`} className="w-full h-full object-cover opacity-60 group-hover/img:opacity-100 transition-opacity" />}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                                        <button onClick={() => playTrack(track)}><Play size={16} fill="white" className="text-white drop-shadow-md" /></button>
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="text-white font-medium truncate">{track.title}</div>
                                    <div className="text-white/40 text-sm truncate">{track.user?.name || track.featured_artist}</div>
                                </div>

                                <button
                                    onClick={() => handleAddTrack(track.id)}
                                    className="px-4 py-1.5 rounded-full border border-white/20 text-white/60 text-sm font-medium hover:text-white hover:border-white hover:bg-white/5 transition-all flex items-center gap-2"
                                >
                                    Add
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PlaylistDetail;
