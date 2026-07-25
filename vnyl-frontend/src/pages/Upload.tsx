import { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, Music, Image as ImageIcon, X, CheckCircle2, Mic2, Search, ChevronDown } from 'lucide-react';
import Swal from 'sweetalert2';

import SearchableSelect from '../components/SearchableSelect';
import { GENRES } from '../constants/profile-data';

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});

const Upload = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    // Genre State
    const [analysisResult, setAnalysisResult] = useState<any>(null); // Store analysis data
    const [tempPath, setTempPath] = useState<string | null>(null); // Store temp file path from backend

    // Genre State
    const [genre, setGenre] = useState('');
    const [user, setUser] = useState<any>(null);
    const [featuredArtist, setFeaturedArtist] = useState('');
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const coverInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);

    // Load User
    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            const parsed = JSON.parse(stored);
            setUser(parsed);
            if (parsed.stage_name) {
                setFeaturedArtist(parsed.stage_name);
            }
        }
    }, []);

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

    // Auto-Upload & Analyze Logic (Step 1)
    const analyzeAudio = async (file: File) => {
        setIsUploading(true);
        Swal.fire({
            title: 'Analyzing...',
            text: 'Extracting metadata and analyzing audio...',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => Swal.showLoading(),
            background: '#1a1a1a',
            color: '#fff',
            toast: true,
            position: 'bottom-end'
        });

        try {
            const formData = new FormData();
            formData.append('file', file);

            const token = localStorage.getItem('token');
            const headers: HeadersInit = {
                'Accept': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('http://127.0.0.1:8000/api/analyze', {
                method: 'POST',
                headers: headers,
                body: formData,
            });

            const responseText = await response.text();
            let data;

            try {
                data = JSON.parse(responseText);
            } catch (e) {
                // If JSON parse fails, implies it's HTML or raw text error
                console.error("Failed to parse JSON:", responseText.substring(0, 100));
                throw new Error(responseText); // Pass raw text to catch block for HTML detection
            }

            if (data.status === 'success') {
                if (data.analysis && data.analysis.error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Analysis Failed',
                        text: data.analysis.error,
                        footer: 'Please ensure FFmpeg is installed on the server.'
                    });
                    setIsUploading(false);
                    return;
                }

                setAnalysisResult(data.analysis);
                setTempPath(data.temp_path);

                // Auto-fill form
                if (data.metadata) {
                    setTitle(data.metadata.title || file.name.replace(/\.[^/.]+$/, ""));

                    // Prioritize User Stage Name, then Metadata Artist, then empty
                    // The user requested: "artist profile name... not profile name but artist name"
                    if (user?.stage_name) {
                        setFeaturedArtist(user.stage_name);
                    } else {
                        setFeaturedArtist(data.metadata.artist || '');
                    }

                    // Set Cover Art if available
                    if (data.metadata.cover_art) {
                        setCoverPreview(data.metadata.cover_art);
                        // We need to handle this on submit. If no file is selected but preview exists, 
                        // we should trust the backend to use the extracted one?
                        // Or better: convert base64 to File object.
                        fetch(data.metadata.cover_art)
                            .then(res => res.blob())
                            .then(blob => {
                                const file = new File([blob], "cover_art.jpg", { type: "image/jpeg" });
                                setCoverFile(file);
                            });
                    }
                } else {
                    setTitle(file.name.replace(/\.[^/.]+$/, ""));
                }

                // Show success
                Toast.fire({
                    icon: 'success',
                    title: 'Analysis Complete'
                });
                if (data.analysis?.primary_genre) {
                    setGenre(data.analysis.primary_genre);
                }


            } else {
                let errorMessage = data.message || 'Analysis failed';
                if (data.errors) {
                    errorMessage = Object.values(data.errors).flat().join('\n');
                }
                throw new Error(errorMessage);
            }
        } catch (error: any) {
            console.error(error);
            setAudioFile(null); // Reset

            let errorTitle = 'Analysis Failed';
            let errorMessage = error.message || 'Unknown error occurred.';

            // Check if error is HTML (common for 413 Payload Too Large or 500 Server Error from default Laravel pages)
            if (errorMessage.includes('<!DOCTYPE html>') || errorMessage.includes('<html>') || errorMessage.includes('413')) {
                errorTitle = 'Upload Failed';
                if (errorMessage.includes('413') || errorMessage.includes('Too Large')) {
                    errorMessage = 'File is too large. Max limit is 100MB.';
                } else {
                    errorMessage = 'Server connection error. Check if backend is running.';
                }
            } else if (errorMessage === 'The file failed to upload.') {
                // Laravel's default message when upload_max_filesize is exceeded
                errorTitle = 'File Too Large';
                errorMessage = 'The file exceeds the server upload limit (2MB default). Please update "upload_max_filesize" in your php.ini.';
            }

            Swal.fire({
                icon: 'error',
                title: errorTitle,
                text: errorMessage,
                background: '#1a1a1a',
                color: '#fff'
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            analyzeAudio(e.target.files[0]);
        }
    };

    const handleReset = () => {
        setAnalysisResult(null);
        setTempPath(null);
        setAudioFile(null);
        setTitle('');
        setFeaturedArtist('');
        setGenre('');
        if (audioInputRef.current) audioInputRef.current.value = '';
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

        if (audio && !tempPath) analyzeAudio(audio);
        if (image) {
            setCoverFile(image);
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverPreview(reader.result as string);
            };
            reader.readAsDataURL(image);
        }
    };

    // Final Publish Logic (Step 2)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !tempPath || !genre) {
            Swal.fire({
                icon: 'error',
                title: 'Missing Info',
                text: 'Please wait for analysis to complete.',
                confirmButtonColor: '#d33'
            });
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('temp_path', tempPath);
            formData.append('title', title);
            formData.append('featured_artist', featuredArtist);
            formData.append('description', description);
            formData.append('genre', genre);

            // Pass full analysis data back to be saved
            // We need to stringify it if we're sending as FormData, 
            // but Laravel validation 'required|array' might tricky with FormData directly if not careful.
            // Better to append individual fields OR send as JSON request. 
            // BUT we have a 'cover' file possibly. So FormData is must.
            // Laravel handles arrays in FormData if appended like analysis[bpm]...
            // OR simpler: send analysis data as separate fields or JSON string and decode in backend?
            // Let's use array notation loop.
            Object.entries(analysisResult).forEach(([key, value]) => {
                if (typeof value === 'object' && value !== null) {
                    formData.append(`analysis[${key}]`, JSON.stringify(value)); // For nested like genre_distribution
                } else {
                    formData.append(`analysis[${key}]`, String(value));
                }
            });

            if (coverFile) {
                formData.append('cover', coverFile);
            }

            const token = localStorage.getItem('token');
            const headers: HeadersInit = {
                'Accept': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('http://127.0.0.1:8000/api/publish', {
                method: 'POST',
                headers: headers,
                body: formData,
            });

            const data = await response.json();

            if (data.status === 'success') {
                Swal.fire({
                    icon: 'success',
                    title: 'Published!',
                    text: 'Your track is live.',
                    background: '#1a1a1a',
                    color: '#fff'
                }).then(() => {
                    navigate('/profile');
                });
            } else {
                throw new Error(data.message || 'Publish failed');
            }
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Save Failed',
                text: error.message,
                background: '#1a1a1a',
                color: '#fff'
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] relative overflow-x-hidden">
            {/* Background Gradients */}
            <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#1a1a1a] to-transparent pointer-events-none" />
            <div className="fixed -top-[200px] -left-[200px] w-[600px] h-[600px] bg-[var(--accent)]/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-6xl mx-auto pt-32 px-6 pb-20 relative z-10">
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
                            onClick={() => !tempPath && audioInputRef.current?.click()}
                            className={`p-6 rounded-2xl border border-white/5 bg-[var(--bg-card)] cursor-pointer transition-colors group ${tempPath ? 'border-green-500/30 bg-green-500/5 cursor-default' : 'hover:bg-white/5'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${tempPath ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-white/5 text-white/40 group-hover:text-white'}`}>
                                    {tempPath ? <CheckCircle2 size={28} /> : (isUploading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Music size={28} />)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white truncate text-lg">
                                        {tempPath ? (title || audioFile?.name) : 'Choose Audio File'}
                                    </p>
                                    <p className="text-xs text-white/40 truncate font-medium">
                                        {tempPath ? 'Analyzed & Ready' : 'MP3, M4A, WAV supported'}
                                    </p>

                                    {analysisResult && (
                                        <div className="mt-2 text-xs text-green-400 font-mono">
                                            {analysisResult.bpm} BPM • {analysisResult.primary_genre}
                                        </div>
                                    )}
                                </div>

                                {tempPath && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleReset(); }}
                                        className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-full transition-colors"
                                        title="Remove & Select Different"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
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
                                    {/* Edit: Genre Convertible to Dropdown */}
                                    <SearchableSelect
                                        label="Genre"
                                        options={GENRES}
                                        value={genre}
                                        onChange={(val) => setGenre(val)}
                                        placeholder="Select Genre"
                                    />

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">Artist Name</label>
                                        <div className="relative opacity-60 cursor-not-allowed">
                                            <Mic2 size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                                            <input
                                                readOnly
                                                disabled
                                                type="text"
                                                className="w-full bg-black/40 border-0 rounded-xl pl-12 pr-5 py-4 text-white font-medium focus:ring-0 cursor-not-allowed placeholder:text-white/20"
                                                placeholder="Enter Artist Name"
                                                value={featuredArtist}
                                            />
                                            {/* Locked Shield Icon to indicate read-only */}
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--accent)]">
                                                <CheckCircle2 size={16} />
                                            </div>
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
                                disabled={isUploading || !tempPath}
                                className={`px-10 py-4 rounded-xl text-sm font-black bg-[var(--accent)] text-white shadow-xl shadow-[var(--accent)]/20 transition-all flex items-center gap-3 ${isUploading || !tempPath ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 hover:brightness-110'}`}
                            >
                                {isUploading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
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
