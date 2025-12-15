import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User as UserIcon, Mail, MapPin, Calendar } from 'lucide-react';
import Swal from 'sweetalert2';

const EditProfile = () => {
    const navigate = useNavigate();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [user, setUser] = useState<any | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        location: '',
        bio: '',
        website: ''
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
                bio: parsedUser.bio || '',
                website: parsedUser.website || ''
            });
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Update local storage
        const updatedUser = { ...user, ...formData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('storage')); // Notify other components

        // In a real app, you would also send a PUT request to the backend here
        // await fetch('/api/user', { method: 'PUT', body: JSON.stringify(formData) ... });

        Swal.fire({
            icon: 'success',
            title: 'Profile Updated',
            text: 'Your changes have been saved successfully.',
            timer: 1500,
            showConfirmButton: false
        }).then(() => {
            navigate('/profile');
        });
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

                        {/* Avatar Section (Read-only for now) */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="relative group cursor-pointer">
                                <img
                                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                                    alt="Profile"
                                    className="w-24 h-24 rounded-full border-4 border-white/10 object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs font-medium">Change</span>
                                </div>
                            </div>
                            <p className="text-xs text-white/40 mt-2">Avatar changing coming soon</p>
                        </div>

                        {/* Name */}
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
                                    placeholder="Your Name"
                                />
                            </div>
                        </div>

                        {/* Username */}
                        <div className="space-y-2">
                            <label className="text-sm text-white/60 font-medium">Username</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">@</span>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-8 pr-4 focus:outline-none focus:border-accent transition-colors"
                                    placeholder="username"
                                />
                            </div>
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
