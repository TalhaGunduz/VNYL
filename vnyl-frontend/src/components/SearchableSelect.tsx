import { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchableSelectProps {
    options: string[];
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
    label: string;
    disabled?: boolean;
    containerClassName?: string;
}

const SearchableSelect = ({
    options,
    value,
    onChange,
    placeholder,
    label,
    disabled,
    containerClassName = ""
}: SearchableSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={`space-y-1 relative ${disabled ? 'opacity-30 cursor-not-allowed' : ''} ${containerClassName}`}>
            <label className="block text-xs font-medium text-white/50">{label}</label>
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full bg-black/20 border ${isOpen ? 'border-[var(--accent)] shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)]' : 'border-white/10'} rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer transition-all hover:bg-black/30 group`}
            >
                <span className={value ? 'text-white font-medium' : 'text-white/20'}>
                    {value || placeholder}
                </span>
                <ChevronDown size={16} className={`text-white/30 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 w-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
                    >
                        <div className="p-2 border-b border-white/5">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-white/10"
                                />
                            </div>
                        </div>
                        <div className="max-h-56 overflow-y-auto custom-scrollbar p-1">
                            {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChange(opt);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${value === opt
                                        ? 'bg-[var(--accent)]/20 text-[var(--accent)] font-bold'
                                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    {opt}
                                </button>
                            )) : (
                                <div className="p-4 text-center text-xs text-white/20 italic">No matches found</div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
        </div>
    );
};

export default SearchableSelect;
