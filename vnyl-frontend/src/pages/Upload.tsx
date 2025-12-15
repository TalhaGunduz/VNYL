import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, Music, Image as ImageIcon, X, CheckCircle2, Mic2, Search, ChevronDown } from 'lucide-react';
import Swal from 'sweetalert2';

const GENRES = [
    "Pop", "Hip Hop", "Rap", "Rock", "Electronic", "R&B", "Indie", "Alternative",
    "K-Pop", "Country", "Classical", "Jazz", "Blues", "Soul", "Reggae",
    "Metal", "Punk", "Folk", "Latin", "Techno", "House", "Trance", "Dubstep",
    "Disco", "Funk", "Gospel", "Opera", "Ambient", "Trap", "Grunge", "Ska",
    "Lo-Fi", "Afrobeat", "Reggaeton", "Dancehall", "Drum & Bass", "Synthwave",
    "Arabesk", "Türkü (Turkish Folk)", "Turkish Pop", "Anatolian Rock",
    "Turkish Art Music (Sanat Müziği)", "Fantezi"
].sort();

const Upload = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    // Genre State
    const [genre, setGenre] = useState('');
    const [genreSearch, setGenreSearch] = useState('');
    const [isGenreOpen, setIsGenreOpen] = useState(false);

    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const coverInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const genreDropdownRef = useRef<HTMLDivElement>(null);

    const filteredGenres = useMemo(() => {
        return GENRES.filter(g => g.toLowerCase().includes(genreSearch.toLowerCase()));
    }, [genreSearch]);

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setCoverFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAudioFile(e.target.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(false);

        const files = Array.from(e.dataTransfer.files);

        // Simple logic to guess file type by extension/mime
        const audio = files.find(f => f.type.startsWith('audio/'));
        const image = files.find(f => f.type.startsWith('image/'));

        if (audio) setAudioFile(audio);
        if (image) {
            setCoverFile(image);
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverPreview(reader.result as string);
            };
            reader.readAsDataURL(image);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !audioFile || !coverFile || !genre) {
            Swal.fire({
                icon: 'error',
                title: 'Missing Info',
                text: 'Please provide a title, genre, cover art, and an audio file.',
                confirmButtonColor: '#d33'
            });
            return;
        }

        setIsUploading(true);

        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        setIsUploading(false);

        Swal.fire({
            icon: 'success',
            title: 'Track Published!',
            text: 'Your music is now live.',
            timer: 2000,
            showConfirmButton: false,
            background: '#1a1a1a',
            color: '#fff'
        }).then(() => {
            navigate('/profile');
        });
    };

    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] relative overflow-x-hidden">
            {/* Background Gradients */}
            <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#1a1a1a] to-transparent pointer-events-none" />
            <div className="fixed -top-[200px] -left-[200px] w-[600px] h-[600px] bg-[var(--accent)]/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-6xl mx-auto pt-32 px-6 pb-20 relative z-10" onClick={() => setIsGenreOpen(false)}>
                <div className="mb-12 text-center md:text-left">
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">Upload Music</h1>
                    <p className="text-white/40 text-lg">Share your sound with the world.</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-12" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>

                    {/* Left Column - Visuals */}
                    <div className="w-full lg:w-1/3 space-y-6">
                        <div
                            onClick={() => coverInputRef.current?.click()}
                            className={`aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden group shadow-2xl ${isDraggingOver ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-white/10 hover:border-white/30 bg-[var(--bg-card)]'}`}
                        >
                            {coverPreview ? (
                                <>
                                    <img src={coverPreview} alt="Cover Preview" className="absolute inset-0 w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-sm font-bold tracking-wide uppercase">
                                        Change Artwork
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-6 space-y-4">
                                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/20 group-hover:text-[var(--accent)] group-hover:scale-110 transition-all">
                                        <ImageIcon size={40} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white/80 text-lg">Upload Cover Art</p>
                                        <p className="text-xs text-white/40 mt-1 font-medium">Min 1400x1400px, PNG or JPG</p>
                                    </div>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={coverInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleCoverChange}
                            />
                        </div>

                        {/* Audio File Selection */}
                        <div
                            onClick={() => audioInputRef.current?.click()}
                            className={`p-6 rounded-2xl border border-white/5 bg-[var(--bg-card)] cursor-pointer hover:bg-white/5 transition-colors group ${audioFile ? 'border-green-500/30 bg-green-500/5' : ''}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${audioFile ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-white/5 text-white/40 group-hover:text-white'}`}>
                                    {audioFile ? <CheckCircle2 size={28} /> : <Music size={28} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white truncate text-lg">
                                        {audioFile ? audioFile.name : 'Choose Audio File'}
                                    </p>
                                    <p className="text-xs text-white/40 truncate font-medium">
                                        {audioFile ? `${(audioFile.size / (1024 * 1024)).toFixed(2)} MB` : 'MP3, M4A, WAV supported'}
                                    </p>
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={audioInputRef}
                                className="hidden"
                                accept="audio/*"
                                onChange={handleAudioChange}
                            />
                        </div>
                    </div>

                    {/* Right Column - Details */}
                    <div className="w-full lg:w-2/3 space-y-8">

                        <div className="space-y-8 bg-[var(--bg-card)]/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
                            <h2 className="text-2xl font-black text-white border-b border-white/5 pb-6">Track Details</h2>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">Title</label>
                                    <input
                                        type="text"
                                        className="w-full bg-black/40 border-0 rounded-xl px-5 py-4 text-white font-medium focus:ring-2 focus:ring-[var(--accent)] transition-all placeholder:text-white/20 text-lg"
                                        placeholder="Name your track"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Searchable Genre Select */}
                                    <div className="space-y-2 relative" onClick={e => e.stopPropagation()}>
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">Genre</label>
                                        <div
                                            className="relative cursor-pointer"
                                            onClick={() => setIsGenreOpen(!isGenreOpen)}
                                        >
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                                                {isGenreOpen ? <Search size={20} /> : <Music size={20} />}
                                            </div>

                                            {isGenreOpen ? (
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    placeholder="Search genre..."
                                                    className="w-full bg-black/40 border-0 rounded-t-xl px-5 py-4 pl-12 text-white font-medium focus:outline-none placeholder:text-white/40"
                                                    value={genreSearch}
                                                    onChange={(e) => setGenreSearch(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                <div className={`w-full bg-black/40 border-0 rounded-xl px-5 py-4 pl-12 flex justify-between items-center transition-colors ${genre ? 'text-white font-medium' : 'text-white/40'}`}>
                                                    <span>{genre || 'Select Genre'}</span>
                                                    <ChevronDown size={18} className="text-white/30" />
                                                </div>
                                            )}

                                            {isGenreOpen && (
                                                <div className="absolute z-50 w-full bg-[#1e1e24] border border-white/5 border-t-0 rounded-b-xl max-h-60 overflow-y-auto shadow-2xl ring-1 ring-white/5">
                                                    {filteredGenres.length > 0 ? (
                                                        filteredGenres.map(g => (
                                                            <div
                                                                key={g}
                                                                className="px-5 py-3 hover:bg-white/5 cursor-pointer text-sm text-white/80 transition-colors border-b border-white/5 last:border-0"
                                                                onClick={() => {
                                                                    setGenre(g);
                                                                    setGenreSearch('');
                                                                    setIsGenreOpen(false);
                                                                }}
                                                            >
                                                                {g}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="px-5 py-4 text-sm text-white/40 text-center">
                                                            No genres found.
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">Featured Artist</label>
                                        <div className="relative">
                                            <Mic2 size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                                            <input
                                                type="text"
                                                className="w-full bg-black/40 border-0 rounded-xl pl-12 pr-5 py-4 text-white font-medium focus:ring-2 focus:ring-[var(--accent)] transition-all placeholder:text-white/20"
                                                placeholder="Add collaborator (Optional)"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">Description</label>
                                    <textarea
                                        rows={4}
                                        className="w-full bg-black/40 border-0 rounded-xl px-5 py-4 text-white font-medium focus:ring-2 focus:ring-[var(--accent)] resize-none transition-all placeholder:text-white/20"
                                        placeholder="Describe your track, lyrics, or story..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Actions */}
                        <div className="flex items-center justify-end gap-6 pt-4">
                            <button
                                type="button"
                                onClick={() => navigate('/profile')}
                                className="px-8 py-4 rounded-xl text-sm font-bold text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isUploading}
                                className={`px-10 py-4 rounded-xl text-sm font-black bg-[var(--accent)] text-white shadow-xl shadow-[var(--accent)]/20 transition-all flex items-center gap-3 ${isUploading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 hover:brightness-110'}`}
                            >
                                {isUploading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <UploadIcon size={20} />
                                        PUBLISH TRACK
                                    </>
                                )}
                            </button>
                        </div>

                    </div>
                </form>
            </div>
        </div>
    );
};

export default Upload;
