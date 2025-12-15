import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, Mail, Calendar, MapPin, Settings, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';

const Profile = () => {
    const navigate = useNavigate();
    // Using 'any' for flexibility with backend fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [user, setUser] = useState<any | null>(null);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('user');

        if (stored) {
            try {
                const parsedUser = JSON.parse(stored);
                console.log('Profile Loaded User:', parsedUser); // Debug log
                setUser(parsedUser);
            } catch (e) {
                Swal.fire({
                    icon: 'error',
                    title: 'Oturum Hatası',
                    text: 'Kullanıcı bilgileri okunamadı, lütfen tekrar giriş yapın.',
                    showConfirmButton: false,
                    timer: 1500
                }).then(() => navigate('/login'));
            }
        } else {
            // Only redirect if we are SURE there is no user, but maybe give a small delay or check URL logic?
            // Actually, if simply navigating to /profile without login, silent redirect is standard. 
            // But if the user *thought* they were logged in, an alert is nice.
            Swal.fire({
                icon: 'warning',
                title: 'Giriş Yapmalısınız',
                text: 'Profilinizi görmek için lütfen giriş yapın.',
                showConfirmButton: false,
                timer: 1500
            }).then(() => navigate('/login'));
        }
        setIsLoading(false);
    }, [navigate]);

    if (isLoading) return <div className="min-h-screen bg-bg text-fg flex items-center justify-center">Loading...</div>;

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('storage'));
        navigate('/');
        window.location.reload();
    };

    const handleDeleteAccount = () => {
        Swal.fire({
            title: 'Are you absolutely sure?',
            text: "This action cannot be undone. This will permanently delete your account and remove your data from our servers.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete my account'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch('http://127.0.0.1:8000/api/delete-account', {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email: user?.email }),
                    });

                    if (response.ok) {
                        localStorage.removeItem('user');
                        window.dispatchEvent(new Event('storage'));
                        Swal.fire(
                            'Deleted!',
                            'Your account has been deleted.',
                            'success'
                        ).then(() => {
                            navigate('/login');
                        });
                    } else {
                        Swal.fire(
                            'Error!',
                            'Failed to delete account.',
                            'error'
                        );
                    }
                } catch (error) {
                    console.error('Delete account error:', error);
                    Swal.fire(
                        'Error!',
                        'Server connection failed.',
                        'error'
                    );
                }
            }
        });
    };

    const getAvatarUrl = () => {
        if (user?.avatar) return user.avatar;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random&size=200`;
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-bg text-fg pb-20">
            {/* Cover Image */}
            <div className="h-[250px] w-full bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514525253440-b393452e23f0?q=80&w=2874&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-bg to-transparent"></div>

                {/* Decorative Elements */}
                <div className="absolute top-10 right-10">
                    <Settings className="text-white/20 h-24 w-24" />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-8 -mt-24 relative z-10">
                <div className="flex flex-col md:flex-row gap-8">

                    {/* Sidebar / User Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full md:w-[350px] shrink-0 space-y-6"
                    >
                        <div className="bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                            <div className="flex flex-col items-center">
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-accent to-purple-600 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
                                    <img
                                        src={getAvatarUrl()}
                                        alt={user.name}
                                        className="relative w-32 h-32 rounded-full object-cover border-[6px] border-bg shadow-2xl"
                                    />
                                </div>

                                <h1 className="mt-4 text-2xl font-bold text-white tracking-tight">{user.name}</h1>
                                <p className="text-white/60 text-sm">@{user.username || user.name?.toLowerCase().replace(/\s/g, '') || 'member'}</p>

                                <div className="mt-6 flex gap-3 w-full">
                                    <button className="flex-1 py-2 bg-white text-bg font-semibold rounded-xl text-sm hover:bg-white/90 transition-colors">
                                        Edit Profile
                                    </button>
                                    <button className="p-2 border border-white/10 rounded-xl hover:bg-white/5 transition-colors text-white/70">
                                        <Settings size={20} />
                                    </button>
                                </div>

                                <div className="w-full h-px bg-white/10 my-6"></div>



                                <div className="w-full space-y-4">
                                    {/* E-posta Alanı */}
                                    <div className="flex items-center gap-3 text-sm text-white/80">
                                        <Mail size={16} className="text-white/40" />
                                        <span className="truncate">{user.email || 'No email provided'}</span>
                                    </div>

                                    {/* Konum Alanı (Varsa) */}
                                    <div className="flex items-center gap-3 text-sm text-white/80">
                                        <MapPin size={16} className="text-white/40" />
                                        <span>{user.location || 'Unknown Location'}</span>
                                    </div>

                                    {/* Katılma Tarihi Alanı */}
                                    <div className="flex items-center gap-3 text-sm text-white/80">
                                        <Calendar size={16} className="text-white/40" />
                                        {/* Backend'den 'joined_at' geliyor ama biz state'e 'joinedAt' olarak kaydettiysek: */}
                                        <span>Joined {user.joinedAt || 'Recently'}</span>
                                    </div>
                                </div>


                            </div>
                        </div>

                        {/* Additional Info / Gender / DOB */}
                        <div className="bg-[#1a1a1a]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                            <h3 className="font-semibold text-white/90 mb-4">Personal Information</h3>
                            <div className="space-y-4">
                                {user.gender && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-white/50">Gender</span>
                                        <span className="text-white/80 capitalize">{user.gender}</span>
                                    </div>
                                )}
                                {user.dob && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-white/50">Date of Birth</span>
                                        <span className="text-white/80">{user.dob}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-white/50">User ID</span>
                                    <span className="text-white/80 font-mono text-xs bg-white/5 px-2 py-1 rounded">{user.id || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Main Content Area */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex-1 space-y-8"
                    >
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Songs Liked', value: '1,284', icon: UserIcon, color: 'text-pink-500' },
                                { label: 'Playlists', value: '14', icon: UserIcon, color: 'text-violet-500' },
                                { label: 'Following', value: '248', icon: UserIcon, color: 'text-blue-500' },
                                { label: 'Followers', value: '892', icon: UserIcon, color: 'text-orange-500' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-[#1a1a1a]/60 border border-white/5 rounded-2xl p-5 hover:bg-white/5 transition-colors">
                                    <stat.icon size={24} className={`${stat.color} mb-3`} />
                                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                                    <div className="text-xs text-white/50 font-medium uppercase tracking-wider mt-1">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Recent Activity / Placeholders */}
                        <div>
                            <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
                            <div className="bg-[#1a1a1a]/40 border border-white/5 rounded-2xl p-8 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
                                    <UserIcon size={32} className="text-white/20" />
                                </div>
                                <h3 className="text-white font-medium">No recent activity</h3>
                                <p className="text-white/40 text-sm mt-2">Start listening to music to populate your feed.</p>
                            </div>
                        </div>

                        {/* Logout Zone */}
                        <div className="border-t border-white/5 pt-8">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm group"
                            >
                                <LogOut size={16} className="group-hover:scale-110 transition-transform" />
                                <span>Sign Out / Çıkış Yap</span>
                            </button>

                            <button
                                onClick={handleDeleteAccount}
                                className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-medium text-red-500/80 hover:text-red-500 hover:bg-red-500/10 transition-all text-sm group border border-transparent hover:border-red-500/20"
                            >
                                <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                                <span>Delete Account</span>
                            </button>
                        </div>

                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
