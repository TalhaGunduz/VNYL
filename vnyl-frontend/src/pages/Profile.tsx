import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, MapPin, Calendar, Music, Heart, Share2, Mail, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Load user from localStorage
        const loadUser = () => {
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                try {
                    setUser(JSON.parse(savedUser));
                } catch (e) {
                    console.error("Failed to parse user data", e);
                }
            } else {
                navigate('/login');
            }
        };

        loadUser();

        // Listen for updates
        window.addEventListener('storage', loadUser);
        return () => window.removeEventListener('storage', loadUser);
    }, [navigate]);

    const handleDeleteAccount = async () => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this! Your profile and all data will be permanently deleted.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            background: '#1a1a1a',
            color: '#fff'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch('http://127.0.0.1:8000/api/delete-account', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: user.email })
                });

                if (response.ok) {
                    localStorage.removeItem('user');
                    window.dispatchEvent(new Event('storage'));

                    await Swal.fire({
                        title: 'Deleted!',
                        text: 'Your account has been deleted.',
                        icon: 'success',
                        background: '#1a1a1a',
                        color: '#fff'
                    });

                    navigate('/login');
                } else {
                    throw new Error('Failed to delete');
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to delete account. Please try again.',
                    background: '#1a1a1a',
                    color: '#fff'
                });
            }
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] relative overflow-x-hidden">
            {/* Background Gradients */}
            <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#1a1a1a] to-transparent pointer-events-none" />
            <div className="fixed -top-[200px] -right-[200px] w-[600px] h-[600px] bg-[var(--accent)]/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-5xl mx-auto pt-32 px-6 pb-20 relative z-10">

                {/* Profile Header Card */}
                <div className="bg-[var(--bg-card)]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 shadow-2xl">

                    {/* Avatar Group */}
                    <div className="relative group shrink-0">
                        <div className="absolute -inset-1 bg-gradient-to-br from-[var(--accent)] to-purple-600 rounded-full opacity-70 blur group-hover:opacity-100 transition-opacity duration-500" />
                        <img
                            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                            alt={user.name}
                            className="relative w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-[#121212] shadow-2xl"
                        />
                        {/* Status Indicator (Mock) */}
                        <div className="absolute bottom-2 right-2 w-6 h-6 bg-[var(--accent)] rounded-full border-4 border-[#121212] z-20" title="Online" />
                    </div>

                    {/* User Info */}
                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-1">{user.name}</h1>
                            <p className="text-white/40 font-medium text-lg">@{user.username || user.name?.toLowerCase().replace(/\s/g, '') || 'member'}</p>
                        </div>

                        {/* Bio Box */}
                        {user.bio && (
                            <div className="max-w-md mx-auto md:mx-0">
                                <p className="text-white/80 leading-relaxed italic text-sm md:text-base border-l-2 border-[var(--accent)] pl-4 py-1">
                                    "{user.bio}"
                                </p>
                            </div>
                        )}

                        {/* Metadata Pills */}
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                            {user.location && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs font-medium text-white/60">
                                    <MapPin size={14} className="text-[var(--accent)]" />
                                    {user.location}
                                </div>
                            )}
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs font-medium text-white/60">
                                <Calendar size={14} className="text-[var(--accent)]" />
                                Joined {user.joinedAt || user.joined_at || user.created_at ? new Date(user.joinedAt || user.joined_at || user.created_at).toLocaleDateString() : 'Recently'}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
                            <button
                                onClick={() => navigate('/edit-profile')}
                                className="px-6 py-2.5 bg-white text-black font-bold rounded-xl text-sm hover:bg-gray-200 transition-colors shadow-lg shadow-white/5"
                            >
                                Edit Profile
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                className="px-6 py-2.5 bg-red-500/10 text-red-500 font-bold rounded-xl text-sm border border-red-500/20 hover:bg-red-500/20 transition-all"
                            >
                                <div className="flex items-center gap-2">
                                    <Trash2 size={16} />
                                    Delete Account
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Tabs (Mock) */}
                <div className="mt-12">
                    <div className="flex items-center gap-8 border-b border-white/10 pb-4 mb-8">
                        <button className="text-white font-bold text-lg border-b-2 border-[var(--accent)] pb-4 -mb-4.5">Top Tracks</button>
                        <button className="text-white/40 font-medium text-lg hover:text-white transition-colors pb-4">Playlists</button>
                        <button className="text-white/40 font-medium text-lg hover:text-white transition-colors pb-4">Likes</button>
                    </div>

                    {/* Empty State / Placeholder */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="bg-[var(--bg-card)]/40 border border-white/5 rounded-2xl p-4 hover:bg-white/5 transition-all group cursor-pointer">
                                <div className="aspect-square bg-white/5 rounded-xl mb-4 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Music className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/10 group-hover:text-white/30 transition-colors" size={48} />
                                </div>
                                <h3 className="font-bold text-white truncate">Untitled Track #{item}</h3>
                                <p className="text-xs text-white/40 mt-1">Uploaded 2 days ago</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Profile;
