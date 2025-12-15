import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Save, Instagram, Globe, MessageCircle, Music, MapPin, User, Music2 } from 'lucide-react';
import Swal from 'sweetalert2';

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

                        // Socials priority: Artist table > User table
                        social_instagram: artist.social_instagram || u.social_instagram || '',
                        social_spotify: artist.social_spotify || u.social_spotify || '',
                        social_youtube: artist.social_youtube || u.social_youtube || '',
                        social_soundcloud: artist.social_soundcloud || u.social_soundcloud || '',
                        social_apple: artist.social_apple || u.social_apple || ''
                    });
                    setAvatarPreview(artist.avatar || u.avatar || '');
                } else {
                    // Fallback to local storage if API fails (though ideally we should handle error)
                    const stored = localStorage.getItem('user');
                    if (stored) {
                        const u = JSON.parse(stored);
                        setUser(u);
                        // ... same mapping logic ...
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

    const handleGenreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setFormData({ ...formData, secondary_genres: val.split(',').map(s => s.trim()).filter(s => s) });
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

    return (
        <div className="min-h-screen bg-[var(--bg)] text-white p-6 pb-20 md:p-10">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate('/artist-panel')} className="mb-6 flex items-center gap-2 text-white/50 hover:text-white transition-colors">
                    <ArrowLeft size={20} /> Back to Dashboard
                </button>

                <div className="bg-[#18181b] border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-[var(--accent)]/10 text-[var(--accent)] rounded-2xl">
                            <User size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white">Complete Artist Profile</h1>
                            <p className="text-white/50">Fill in all details to maximize your visibility.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center">
                            <div className="relative group w-32 h-32">
                                <div className="w-full h-full rounded-full overflow-hidden border-4 border-[var(--accent)]/30 shadow-2xl">
                                    <img
                                        src={avatarPreview || "https://ui-avatars.com/api/?background=random"}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                                    <Upload className="text-white" size={24} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                </label>
                            </div>
                            <p className="text-xs text-white/40 mt-3">Click to change profile picture</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Basic Info */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <User size={14} /> Basic Info
                                </h3>
                                <div>
                                    <label className="block text-xs font-medium text-white/50 mb-1">Stage Name</label>
                                    <input
                                        type="text"
                                        name="stage_name"
                                        value={formData.stage_name}
                                        onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
                                        placeholder="Your artist name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-white/50 mb-1">Bio (Min 100 chars)</label>
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        rows={6}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
                                        placeholder="Tell your story..."
                                    />
                                    <p className="text-[10px] text-right text-white/30">{formData.bio.length} characters</p>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <MapPin size={14} /> Details
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-white/50 mb-1">City</label>
                                        <input
                                            type="text"
                                            name="location_city"
                                            value={formData.location_city}
                                            onChange={handleChange}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-white/50 mb-1">Country</label>
                                        <input
                                            type="text"
                                            name="location_country"
                                            value={formData.location_country}
                                            onChange={handleChange}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-white/50 mb-1">Primary Genre</label>
                                    <select
                                        name="primary_genre"
                                        value={formData.primary_genre}
                                        onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)] transition-colors [&>option]:text-black"
                                    >
                                        <option value="">Select Genre</option>
                                        <option value="Pop">Pop</option>
                                        <option value="Rock">Rock</option>
                                        <option value="Hip Hop">Hip Hop</option>
                                        <option value="Electronic">Electronic</option>
                                        <option value="R&B">R&B</option>
                                        <option value="Indie">Indie</option>
                                        <option value="Jazz">Jazz</option>
                                        <option value="Classical">Classical</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-white/50 mb-1">Secondary Genres (comma separated)</label>
                                    <input
                                        type="text"
                                        name="secondary_genres_input"
                                        value={formData.secondary_genres.join(', ')}
                                        onChange={handleGenreChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
                                        placeholder="e.g. Trap, Soul, Lo-Fi"
                                    />
                                </div>
                            </div>
                        </div>

                        <hr className="border-white/5" />

                        {/* Socials */}
                        <div>
                            <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Globe size={14} /> Social Links
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <Instagram className="absolute top-1/2 -translate-y-1/2 left-3 text-pink-500" size={18} />
                                    <input
                                        type="text"
                                        name="social_instagram"
                                        value={formData.social_instagram}
                                        onChange={handleChange}
                                        placeholder="Instagram Username"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-pink-500 transition-colors"
                                    />
                                </div>
                                <div className="relative">
                                    <Music2 className="absolute top-1/2 -translate-y-1/2 left-3 text-green-500" size={18} />
                                    <input
                                        type="text"
                                        name="social_spotify"
                                        value={formData.social_spotify}
                                        onChange={handleChange}
                                        placeholder="Spotify Artist ID"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-green-500 transition-colors"
                                    />
                                </div>
                                <div className="relative">
                                    < Globe className="absolute top-1/2 -translate-y-1/2 left-3 text-red-500" size={18} />
                                    <input
                                        type="text"
                                        name="social_youtube"
                                        value={formData.social_youtube}
                                        onChange={handleChange}
                                        placeholder="YouTube Channel URL"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-red-500 transition-colors"
                                    />
                                </div>
                                <div className="relative">
                                    <Music className="absolute top-1/2 -translate-y-1/2 left-3 text-orange-500" size={18} />
                                    <input
                                        type="text"
                                        name="social_soundcloud"
                                        value={formData.social_soundcloud}
                                        onChange={handleChange}
                                        placeholder="SoundCloud URL"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-4 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white font-bold rounded-2xl shadow-lg shadow-red-900/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 min-w-[200px]"
                            >
                                {loading ? 'Saving...' : <><Save size={20} /> Save Changes</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ArtistProfileSetup;
