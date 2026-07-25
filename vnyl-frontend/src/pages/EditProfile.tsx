import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Save,
    User as UserIcon,
    Mail,
    MapPin,
    Calendar,
    Music2,
    Globe,
    Instagram,
    Music,
    Search,
    ChevronDown,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import SearchableSelect from '../components/SearchableSelect';
import { GENRES, COUNTRIES, CITIES } from '../constants/profile-data';

const EditProfile = () => {
    const navigate = useNavigate();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [user, setUser] = useState<any | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        location: '',
        bio: '',
        website: '',
        // New Fields
        primary_genre: '',
        secondary_genres: [] as string[],
        location_city: '',
        location_country: '',
        social_instagram: '',
        social_spotify: '',
        social_youtube: '',
        social_soundcloud: '',
        social_apple: ''
    });

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            const parsedUser = JSON.parse(stored);
            setUser(parsedUser);
            setFormData({
                name: parsedUser.name || '',
                username: parsedUser.username || '',
                location: parsedUser.location || '',
                bio: parsedUser.artist_bio || parsedUser.bio || '',
                website: parsedUser.website || '',

                primary_genre: parsedUser.primary_genre || (parsedUser.artist?.primary_genre) || '',
                secondary_genres: parsedUser.secondary_genres || (parsedUser.artist?.secondary_genres) || [],
                location_city: parsedUser.location_city || '',
                location_country: parsedUser.location_country || '',

                social_instagram: parsedUser.social_instagram || '',
                social_spotify: parsedUser.social_spotify || '',
                social_youtube: parsedUser.social_youtube || '',
                social_soundcloud: parsedUser.social_soundcloud || '',
                social_apple: parsedUser.social_apple || ''
            });
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        let value = e.target.value;

        // Username constraints
        if (e.target.name === 'username') {
            value = value.toLowerCase()
                .replace(/\s+/g, '') // Remove spaces
                .replace(/[^a-z0-9_.]/g, ''); // Allow only a-z, 0-9, _, .
        }

        setFormData({ ...formData, [e.target.name]: value });
    };

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState('');

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const data = new FormData();
        data.append('name', formData.name);
        data.append('username', formData.username);
        data.append('location', formData.location);
        data.append('bio', formData.bio);
        // data.append('website', formData.website); // If website field exists

        if (avatarFile) {
            data.append('avatar', avatarFile);
        }

        // Append New Fields
        data.append('location_city', formData.location_city);
        data.append('location_country', formData.location_country);
        data.append('primary_genre', formData.primary_genre);

        // Handle array for secondary genres
        formData.secondary_genres.forEach((g, i) => data.append(`secondary_genres[${i}]`, g));

        data.append('social_instagram', formData.social_instagram);
        data.append('social_spotify', formData.social_spotify);
        data.append('social_youtube', formData.social_youtube);
        data.append('social_soundcloud', formData.social_soundcloud);
        data.append('social_apple', formData.social_apple);

        // LARAVEL PUT TRICK
        data.append('_method', 'PUT');

        try {
            // Retrieve token if stored (assuming localStorage or Context)
            const token = localStorage.getItem('token');

            const headers: HeadersInit = {
                'Accept': 'application/json', // Force JSON response from Laravel
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            // Note: Content-Type header for FormData is usually handled automatically by fetch to set boundary correctly.
            // Do NOT manually set Content-Type to multipart/form-data here.

            // Using /api/artist/profile as agreed for artist updates, or generic /api/update-profile as per user snippet
            // Let's use /api/update-profile to match user snippet exactly.
            const response = await fetch('http://127.0.0.1:8000/api/user/profile', {
                method: 'POST', // Important: POST for FormData
                headers: headers,
                credentials: 'include', // Important for Sanctum/Cookies
                body: data
            });

            if (response.ok) {
                const responseData = await response.json();

                // Update local storage with response data (source of truth)
                const updatedUser = { ...user, ...formData, ...responseData.user }; // Merge response
                if (avatarPreview) updatedUser.avatar = responseData.user.avatar || avatarPreview; // Optimistic update or use response url

                localStorage.setItem('user', JSON.stringify(updatedUser));
                window.dispatchEvent(new Event('storage'));

                Swal.fire({
                    icon: 'success',
                    title: 'Profile Updated',
                    text: 'Your changes have been saved successfully.',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    navigate('/profile');
                });
            } else {
                let errorMessage = 'Failed to update profile';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
                } catch (e) {
                    errorMessage = response.statusText;
                }
                throw new Error(errorMessage);
            }
        } catch (error: any) {
            console.error("Update failed", error);
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: error.message || 'Could not update profile. Please try again.',
                background: '#1a1a1a',
                color: '#fff'
            });
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-bg text-fg p-6">
            <div className="max-w-2xl mx-auto space-y-8 mt-10">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/profile')}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold">Edit Profile</h1>
                </div>

                {/* Main Form Card */}
                <div className="bg-[#1a1a1a]/60 border border-white/5 rounded-2xl p-8 backdrop-blur-xl">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Avatar Section */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="relative group cursor-pointer w-24 h-24">
                                <img
                                    src={avatarPreview || user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                                    alt="Profile"
                                    className="w-full h-full rounded-full border-4 border-white/10 object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs font-medium">Change</span>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Name (Display Name) */}
                        <div className="space-y-2">
                            <label className="text-sm text-white/60 font-medium">Display Name</label>
                            <div className="relative">
                                <UserIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-accent transition-colors"
                                    placeholder="e.g. Talha Gündüz"
                                />
                            </div>
                            <p className="text-xs text-white/30 ml-1">Your real name as it appears on your profile.</p>
                        </div>

                        {/* Username (Unique Handle) */}
                        <div className="space-y-2">
                            <label className="text-sm text-white/60 font-medium">Username</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">@</span>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-8 pr-4 focus:outline-none focus:border-accent transition-colors font-mono text-sm"
                                    placeholder="username"
                                />
                            </div>
                            <p className="text-xs text-white/30 ml-1 flex flex-col gap-0.5">
                                <span>Unique handle for mentions and friends.</span>
                                <span className="text-[var(--accent)]/70">• Lowercase only • No spaces • Unique</span>
                            </p>
                        </div>

                        {/* Location */}
                        <div className="space-y-2">
                            <label className="text-sm text-white/60 font-medium">Location</label>
                            <div className="relative">
                                <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-accent transition-colors"
                                    placeholder="City, Country"
                                />
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="space-y-2">
                            <label className="text-sm text-white/60 font-medium">Bio</label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                rows={3}
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-4 focus:outline-none focus:border-accent transition-colors resize-none"
                                placeholder="Tell us about yourself..."
                            />
                        </div>


                        {/* Genres Section */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Music2 size={14} /> Artist Details
                            </h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <SearchableSelect
                                    label="Primary Genre"
                                    placeholder="Select Main Genre"
                                    options={GENRES}
                                    value={formData.primary_genre}
                                    onChange={(val) => setFormData(prev => ({ ...prev, primary_genre: val }))}
                                />

                                <div className="space-y-2">
                                    <SearchableSelect
                                        label="Secondary Genres"
                                        placeholder="Add Sub-Genre..."
                                        options={GENRES.filter(g => g !== formData.primary_genre && !formData.secondary_genres.includes(g))}
                                        value=""
                                        onChange={(val) => {
                                            if (formData.secondary_genres.length < 3) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    secondary_genres: [...prev.secondary_genres, val]
                                                }));
                                            }
                                        }}
                                    />
                                    <div className="flex flex-wrap gap-2 mt-2 min-h-[28px]">
                                        {formData.secondary_genres.map(genre => (
                                            <button
                                                key={genre}
                                                type="button"
                                                onClick={() => setFormData(prev => ({
                                                    ...prev,
                                                    secondary_genres: prev.secondary_genres.filter(g => g !== genre)
                                                }))}
                                                className="flex items-center gap-1.5 px-3 py-1 bg-accent border border-accent/20 rounded-full text-[10px] font-bold text-white shadow-[0_2px_8px_rgba(var(--accent-rgb),0.3)] hover:scale-105 transition-transform"
                                            >
                                                {genre.toUpperCase()}
                                                <X size={10} />
                                            </button>
                                        ))}
                                        {formData.secondary_genres.length === 0 && (
                                            <span className="text-[10px] text-white/10 italic py-1">No sub-genres added (max 3)</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Location */}
                        <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                            <SearchableSelect
                                label="Country"
                                placeholder="Select Country"
                                options={COUNTRIES}
                                value={formData.location_country}
                                onChange={(val) => setFormData(prev => ({ ...prev, location_country: val, location_city: '' }))}
                            />
                            <SearchableSelect
                                label="City"
                                placeholder="Select City"
                                disabled={!formData.location_country}
                                options={CITIES[formData.location_country] || CITIES['Default']}
                                value={formData.location_city}
                                onChange={(val) => setFormData(prev => ({ ...prev, location_city: val }))}
                            />
                        </div>

                        {/* Socials Section */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-2 flex items-center gap-2">
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
                                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-pink-500 transition-colors"
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
                                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-green-500 transition-colors"
                                    />
                                </div>
                                <div className="relative">
                                    < Globe className="absolute top-1/2 -translate-y-1/2 left-3 text-red-500" size={18} />
                                    <input
                                        type="text"
                                        name="social_youtube"
                                        value={formData.social_youtube}
                                        onChange={handleChange}
                                        placeholder="YouTube URL"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-red-500 transition-colors"
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
                                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>


                        {/* Read Only Fields */}
                        <div className="flex gap-4 pt-4 border-t border-white/5">
                            <div className="flex-1 space-y-2 opacity-50">
                                <label className="text-sm text-white/40 font-medium">Email (Private)</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                    <input type="text" value={user.email} disabled className="w-full bg-black/10 border border-white/5 rounded-xl py-2 pl-10 pr-4 cursor-not-allowed" />
                                </div>
                            </div>
                            <div className="flex-1 space-y-2 opacity-50">
                                <label className="text-sm text-white/40 font-medium">Joined</label>
                                <div className="relative">
                                    <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                    <input type="text" value={user.joinedAt} disabled className="w-full bg-black/10 border border-white/5 rounded-xl py-2 pl-10 pr-4 cursor-not-allowed" />
                                </div>
                            </div>
                        </div>


                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-6">
                            <button
                                type="button"
                                onClick={() => navigate('/profile')}
                                className="px-6 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex items-center gap-2 px-6 py-2 bg-accent hover:bg-accent-hover rounded-xl text-sm font-medium text-white transition-colors shadow-lg shadow-accent/20"
                            >
                                <Save size={18} />
                                Save Changes
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditProfile;
