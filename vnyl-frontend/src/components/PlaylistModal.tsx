import React, { useState, useEffect } from 'react';
import { X, Check, Lock, Globe } from 'lucide-react';

interface PlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode?: 'create' | 'edit'; // Added Mode
    initialTitle?: string;
    initialDescription?: string;
    initialPublic?: boolean;
    onSave: (title: string, description: string, isPublic: boolean) => Promise<void>;
}

const PlaylistModal: React.FC<PlaylistModalProps> = ({
    isOpen,
    onClose,
    mode = 'edit', // Default is edit/new? Actually 'create' makes more sense as base, but we are extending Edit.
    initialTitle = '',
    initialDescription = '',
    initialPublic = true,
    onSave
}) => {
    const [title, setTitle] = useState(initialTitle);
    const [description, setDescription] = useState(initialDescription || '');
    const [isPublicState, setIsPublicState] = useState(initialPublic);
    const [saving, setSaving] = useState(false);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setTitle(initialTitle);
            setDescription(initialDescription || '');
            setIsPublicState(initialPublic);
        }
    }, [isOpen, initialTitle, initialDescription, initialPublic]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!title.trim()) return;
        setSaving(true);
        await onSave(title, description, isPublicState);
        setSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal - iOS Style */}
            <div className="relative w-full max-w-[360px] bg-[#1c1c1e] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/10">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#2c2c2e]/50 backdrop-blur-xl">
                    <button
                        onClick={onClose}
                        className="text-[15px] text-[var(--accent)] hover:opacity-80 transition-opacity"
                    >
                        Cancel
                    </button>
                    <span className="text-[15px] font-semibold text-white">{mode === 'create' ? 'New Playlist' : 'Edit Playlist'}</span>
                    <button
                        onClick={handleSave}
                        disabled={saving || !title.trim()}
                        className="text-[15px] text-[var(--accent)] font-bold hover:opacity-80 transition-opacity disabled:opacity-30"
                    >
                        {saving ? (mode === 'create' ? 'Creating...' : 'Saving...') : (mode === 'create' ? 'Create' : 'Done')}
                    </button>
                </div>

                {/* Content - Form Groups */}
                <div className="p-5 space-y-6">

                    {/* Cover Placeholder (Visual Only for now) */}
                    <div className="flex justify-center">
                        <div className="w-32 h-32 bg-[#2c2c2e] rounded-lg shadow-inner flex items-center justify-center border border-white/5">
                            <span className="text-4xl font-bold text-white/20 select-none">
                                {(title || 'PL').substring(0, 2).toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Group 1: Inputs */}
                        <div className="bg-[#2c2c2e] rounded-xl overflow-hidden border border-white/5">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Playlist Name"
                                className="w-full bg-transparent px-4 py-3 text-[15px] text-white placeholder-white/30 focus:outline-none border-b border-white/5"
                            />
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Description"
                                rows={3}
                                className="w-full bg-transparent px-4 py-3 text-[15px] text-white placeholder-white/30 focus:outline-none resize-none block"
                            />
                        </div>

                        {/* Group 2: Settings */}
                        <div className="bg-[#2c2c2e] rounded-xl overflow-hidden border border-white/5 px-4 py-3 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[15px] text-white font-medium">Public Playlist</span>
                                <span className="text-[11px] text-white/40">Visible on your profile</span>
                            </div>

                            {/* iOS Toggle Switch */}
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isPublicState}
                                    onChange={(e) => setIsPublicState(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-[#3a3a3c] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#34c759]"></div>
                            </label>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PlaylistModal;
