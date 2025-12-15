import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic2, Star } from 'lucide-react';
import Swal from 'sweetalert2';

interface ArtistSwitchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void; // Callback to update parent state/UI
}

const ArtistSwitchModal = ({ isOpen, onClose, onSuccess }: ArtistSwitchModalProps) => {
    const [stageName, setStageName] = useState('');
    const [bio, setBio] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stageName.trim()) {
            // Basic client-side validation
            return;
        }

        setIsSubmitting(true);

        // Simulate Backend API Call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // In a real app, we would POST to /api/upgrade-to-artist
        // For now, we manually update localStorage to simulate the backend effect
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            // Update role
            user.role = 'artist';
            // Save stage name if backend were doing it
            user.stage_name = stageName;
            user.artist_bio = bio;

            localStorage.setItem('user', JSON.stringify(user));
            // Dispatch storage event so other components update immediately
            window.dispatchEvent(new Event('storage'));
        }

        setIsSubmitting(false);
        onSuccess();
        onClose();

        Swal.fire({
            icon: 'success',
            title: 'Welcome, Artist!',
            text: 'You have successfully switched to an artist account.',
            background: '#1a1a1a',
            color: '#fff',
            timer: 2000,
            showConfirmButton: false
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        {/* Modal Container */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#18181b] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[var(--accent)]/10 rounded-lg text-[var(--accent)]">
                                        <Mic2 size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white leading-tight">Become an Artist</h2>
                                        <p className="text-white/40 text-xs">Unlock upload tools & analytics</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-white/40 hover:text-white transition-colors p-1"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/60 ml-1">Stage Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={stageName}
                                        onChange={(e) => setStageName(e.target.value)}
                                        placeholder="e.g. The Weeknd"
                                        className="w-full bg-black/40 border-0 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-[var(--accent)] placeholder:text-white/20 transition-all font-medium"
                                    />
                                    <p className="text-[11px] text-white/30 ml-1">This is how you'll appear to listeners.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/60 ml-1">Short Bio <span className="text-white/20 text-xs">(Optional)</span></label>
                                    <textarea
                                        rows={3}
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Tell us a bit about your style..."
                                        className="w-full bg-black/40 border-0 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-[var(--accent)] placeholder:text-white/20 resize-none transition-all"
                                    />
                                </div>

                                {/* Submit Button */}
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-3.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent)]/20"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Switching...
                                            </>
                                        ) : (
                                            <>
                                                <Star size={18} fill="currentColor" />
                                                Start My Artist Journey
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>

                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ArtistSwitchModal;
