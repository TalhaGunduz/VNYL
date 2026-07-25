import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Upload,
    Save,
    Instagram,
    Globe,
    MessageCircle,
    Music,
    MapPin,
    User,
    Music2,
    Youtube,
    X,
    ChevronDown,
    Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import SearchableSelect from '../components/SearchableSelect';
import { GENRES, COUNTRIES, CITIES } from '../constants/profile-data';

const ArtistProfileSetup = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        stage_name: '',
        bio: '',
        location_city: '',
        location_country: '',
        primary_genre: '',
        secondary_genres: [] as string[],
        social_instagram: '',
        social_spotify: '',
        social_youtube: '',
        social_soundcloud: '',
        social_apple: ''
    });

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const response = await fetch('http://127.0.0.1:8000/api/user', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    const u = await response.json();
                    setUser(u);

                    // Prioritize Artist table data, fallback to User table
                    const artist = u.artist || {};

                    setFormData({
                        stage_name: artist.stage_name || u.stage_name || u.name || '',
                        bio: artist.artist_bio || artist.bio || u.artist_bio || '',
                        location_city: artist.location_city || u.location_city || '',
                        location_country: artist.location_country || u.location_country || '',
                        primary_genre: artist.primary_genre || u.primary_genre || '',
                        secondary_genres: artist.secondary_genres || u.secondary_genres || [],

                        social_instagram: artist.social_instagram || u.social_instagram || '',
                        social_spotify: artist.social_spotify || u.social_spotify || '',
                        social_youtube: artist.social_youtube || u.social_youtube || '',
                        social_soundcloud: artist.social_soundcloud || u.social_soundcloud || '',
                        social_apple: artist.social_apple || u.social_apple || ''
                    });
                    setAvatarPreview(artist.avatar || u.avatar || '');
                } else {
                    const stored = localStorage.getItem('user');
                    if (stored) {
                        const u = JSON.parse(stored);
                        setUser(u);
                        const artist = u.artist || {};
                        setFormData({
                            stage_name: artist.stage_name || u.stage_name || u.name || '',
                            bio: artist.artist_bio || artist.bio || u.artist_bio || '',
                            location_city: artist.location_city || u.location_city || '',
                            location_country: artist.location_country || u.location_country || '',
                            primary_genre: artist.primary_genre || u.primary_genre || '',
                            secondary_genres: artist.secondary_genres || u.secondary_genres || [],
                            social_instagram: artist.social_instagram || u.social_instagram || '',
                            social_spotify: artist.social_spotify || u.social_spotify || '',
                            social_youtube: artist.social_youtube || u.social_youtube || '',
                            social_soundcloud: artist.social_soundcloud || u.social_soundcloud || '',
                            social_apple: artist.social_apple || u.social_apple || ''
                        });
                        setAvatarPreview(artist.avatar || u.avatar || '');
                    }
                }
            } catch (error) {
                console.error("Failed to fetch user data", error);
            }
        };

        fetchUserData();
    }, [navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleGenreSelect = (genre: string) => {
        if (formData.secondary_genres.includes(genre)) {
            setFormData(prev => ({
                ...prev,
                secondary_genres: prev.secondary_genres.filter(g => g !== genre)
            }));
        } else if (formData.secondary_genres.length < 3) {
            setFormData(prev => ({
                ...prev,
                secondary_genres: [...prev.secondary_genres, genre]
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        data.append('stage_name', formData.stage_name);
        data.append('bio', formData.bio);
        data.append('location_city', formData.location_city);
        data.append('location_country', formData.location_country);
        data.append('primary_genre', formData.primary_genre);

        formData.secondary_genres.forEach((g, i) => data.append(`secondary_genres[${i}]`, g));

        data.append('socials[instagram]', formData.social_instagram);
        data.append('socials[spotify]', formData.social_spotify);
        data.append('socials[youtube]', formData.social_youtube);
        data.append('socials[soundcloud]', formData.social_soundcloud);
        data.append('socials[apple]', formData.social_apple);

        if (avatarFile) {
            data.append('avatar', avatarFile);
        }

        data.append('_method', 'PUT');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://127.0.0.1:8000/api/artist/profile', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: data
            });

            if (response.ok) {
                const result = await response.json();
                localStorage.setItem('user', JSON.stringify(result.user));
                window.dispatchEvent(new Event('storage'));

                Swal.fire({
                    icon: 'success',
                    title: 'Profile Updated!',
                    text: 'Your artist profile has been successfully updated.',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    navigate('/artist-panel');
                });
            } else {
                const err = await response.json();
                throw new Error(err.message || 'Failed to update');
            }
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    const availableCities = formData.location_country ? (CITIES[formData.location_country] || CITIES['Default']) : [];

    return (
        <div className="min-h-screen bg-[var(--bg)] text-white p-6 pb-20 md:p-10">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate('/artist-panel')} className="mb-6 flex items-center gap-2 text-white/50 hover:text-white transition-colors">
                    <ArrowLeft size={20} /> Back to Dashboard
                </button>

                <div className="bg-[#18181b] border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/5 rounded-full blur-[80px]" />

                    <div className="flex items-center gap-4 mb-10 relative">
                        <div className="p-3 bg-[var(--accent)]/10 text-[var(--accent)] rounded-2xl">
                            <User size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white">Complete Your Artist Identity</h1>
                            <p className="text-white/50">Maximize your visibility with a complete profile.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-12 relative">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center">
                            <div className="relative group w-32 h-32">
                                <div className="w-full h-full rounded-full overflow-hidden border-4 border-[var(--accent)]/30 shadow-2xl transition-transform group-hover:scale-105">
                                    <img
                                        src={avatarPreview || `https://ui-avatars.com/api/?name=${formData.stage_name}&background=random`}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                                    <Upload className="text-white" size={24} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                </label>
                            </div>
                            <p className="text-xs text-white/40 mt-3 font-bold uppercase tracking-wider">Change Profile Picture</p>
                        </div>

                        {/* Basic Information */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <span className="w-6 h-px bg-[var(--accent)]" /> 1. Essentials
                            </h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-white/50">Stage Name</label>
                                    <input
                                        type="text"
                                        name="stage_name"
                                        value={formData.stage_name}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)] transition-all"
                                        placeholder="Your artist name"
                                    />
                                </div>
                                <SearchableSelect
                                    label="Primary Genre"
                                    options={GENRES}
                                    value={formData.primary_genre}
                                    onChange={(val) => setFormData({ ...formData, primary_genre: val })}
                                    placeholder="Select Genre"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-white/50 mb-1">Artist Bio</label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    rows={5}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)] transition-all resize-none"
                                    placeholder="Tell your story to your fans..."
                                />
                                <div className="flex justify-between mt-1">
                                    <span className="text-[10px] text-white/20 italic">Pro-tip: Minimum 100 characters recommended for verification.</span>
                                    <span className="text-[10px] text-white/30 font-mono tracking-tighter">{formData.bio.length} chars</span>
                                </div>
                            </div>
                        </div>

                        {/* Musical Details */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <span className="w-6 h-px bg-[var(--accent)]" /> 2. Musical Style
                            </h3>
                            <SearchableSelect
                                label="Add Secondary Genres (Max 3)"
                                options={GENRES.filter(g => g !== formData.primary_genre)}
                                value=""
                                onChange={handleGenreSelect}
                                placeholder="Choose sub-genres..."
                            />
                            {formData.secondary_genres.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {formData.secondary_genres.map(genre => (
                                        <button
                                            key={genre}
                                            type="button"
                                            onClick={() => handleGenreSelect(genre)}
                                            className="group flex items-center gap-2 bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-[var(--accent)]/20 transition-all"
                                        >
                                            {genre}
                                            <X size={12} className="text-[var(--accent)]/50 group-hover:text-[var(--accent)]" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Location */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <span className="w-6 h-px bg-[var(--accent)]" /> 3. Origin
                            </h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <SearchableSelect
                                    label="Country"
                                    options={COUNTRIES}
                                    value={formData.location_country}
                                    onChange={(val) => setFormData({ ...formData, location_country: val, location_city: '' })}
                                    placeholder="Select Country"
                                />
                                <SearchableSelect
                                    label="City"
                                    options={availableCities}
                                    value={formData.location_city}
                                    onChange={(val) => setFormData({ ...formData, location_city: val })}
                                    placeholder="Select City"
                                    disabled={!formData.location_country}
                                />
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <span className="w-6 h-px bg-[var(--accent)]" /> 4. Connect
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="relative group">
                                    <Instagram size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[var(--accent)] transition-colors" />
                                    <input
                                        type="text"
                                        name="social_instagram"
                                        value={formData.social_instagram}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--accent)] transition-all"
                                        placeholder="Instagram username"
                                    />
                                </div>
                                <div className="relative group">
                                    <Music size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[var(--accent)] transition-colors" />
                                    <input
                                        type="text"
                                        name="social_spotify"
                                        value={formData.social_spotify}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--accent)] transition-all"
                                        placeholder="Spotify Artist URL"
                                    />
                                </div>
                                <div className="relative group">
                                    <Youtube size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[var(--accent)] transition-colors" />
                                    <input
                                        type="text"
                                        name="social_youtube"
                                        value={formData.social_youtube}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--accent)] transition-all"
                                        placeholder="YouTube Channel URL"
                                    />
                                </div>
                                <div className="relative group">
                                    <Music2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[var(--accent)] transition-colors" />
                                    <input
                                        type="text"
                                        name="social_soundcloud"
                                        value={formData.social_soundcloud}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--accent)] transition-all"
                                        placeholder="SoundCloud URL"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-8 border-t border-white/5">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-10 py-4 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white font-black rounded-2xl shadow-xl shadow-red-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 min-w-[240px]"
                            >
                                {loading ? (
                                    <>Saving Your Profile...</>
                                ) : (
                                    <>
                                        <Save size={20} strokeWidth={3} />
                                        COMPLETE SETUP
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ArtistProfileSetup;
