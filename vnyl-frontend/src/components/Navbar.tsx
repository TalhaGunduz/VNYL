import { Link } from 'react-router-dom';
import { Search, BarChart3, Upload, User, Compass, Play } from 'lucide-react';
import ProfileMenu from './ProfileMenu';
import { useState, useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { AnimatePresence, motion } from 'framer-motion';

const Navbar = () => {
  const [user, setUser] = useState<{ name: string, email: string, avatar?: string } | null>(null);

  // Search State
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>({ artists: [], tracks: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeout = useRef<any>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const { playTrack } = usePlayer();

  useEffect(() => {
    const checkUser = () => {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    checkUser();
    window.addEventListener('storage', checkUser);

    // Close search on click outside
    const handleClickOutside = (event: any) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('storage', checkUser);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search Logic
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (val.length < 1) {
      setSearchResults({ artists: [], tracks: [] });
      setShowResults(false);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      setShowResults(true);
      try {
        // Call Local Search Endpoint
        const res = await fetch(`http://127.0.0.1:8000/api/global-search?query=${val}`);
        const data = await res.json();

        if (data.status === 'success') {
          // data.artists, data.tracks
          setSearchResults(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms Debounce (Faster response)
  };

  const handleTrackClick = (track: any) => {
    playTrack(track);
    setShowResults(false);
    setQuery('');
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/5 bg-bg/60 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 md:px-8 h-16 flex items-center justify-between gap-4">

          {/* Left Nav */}
          <nav className="flex items-center gap-3 md:gap-6 text-sm md:text-base shrink-0">
            <Link className="text-white/80 hover:text-white transition-colors flex items-center gap-4" to="/">
              <img src="/assets/mini_logo.png" alt="vnyl logo" className="h-10" />
              <span className="hidden md:inline font-bold tracking-tight">VNYL</span>
            </Link>

            {/* Compass Icon for Hub (Link) */}
            <Link
              to="/hub"
              className="text-white/60 hover:text-[var(--accent)] transition-colors flex items-center gap-2 group"
            >
              <Compass size={20} className="group-hover:rotate-45 transition-transform duration-300" />
              <span className="hidden md:inline">Hub</span>
            </Link>
          </nav>

          {/* Center: Global Search Bar */}
          <div className="flex-1 max-w-lg relative" ref={searchRef}>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[var(--accent)] transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search songs, artists..."
                className="w-full bg-white/5 border border-white/5 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[var(--accent)]/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                value={query}
                onChange={handleSearch}
                onFocus={() => query.length >= 1 && setShowResults(true)}
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Search Dropdown */}
            <AnimatePresence>
              {showResults && (searchResults.artists?.length > 0 || searchResults.tracks?.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full mt-2 left-0 right-0 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-[70vh] overflow-y-auto"
                >

                  {/* ARTISTS SECTION */}
                  {searchResults.artists?.length > 0 && (
                    <div className="p-2">
                      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider px-2 py-1 mb-1">Artists</h3>
                      {searchResults.artists.map((artist: any) => (
                        <Link
                          to={`/artist/${artist.slug || artist.id}`}
                          key={artist.id}
                          onClick={() => { setShowResults(false); setQuery(''); }}
                          className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors"
                        >
                          <img src={artist.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                          <span className="text-sm font-medium text-white">{artist.stage_name}</span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Divider */}
                  {searchResults.artists?.length > 0 && searchResults.tracks?.length > 0 && (
                    <div className="h-px bg-white/5 mx-2 my-1"></div>
                  )}

                  {/* TRACKS SECTION */}
                  {searchResults.tracks?.length > 0 && (
                    <div className="p-2">
                      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider px-2 py-1 mb-1">Songs</h3>
                      {searchResults.tracks.map((track: any) => (
                        <div
                          key={track.id}
                          onClick={() => handleTrackClick(track)}
                          className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer group transition-colors"
                        >
                          <div className="relative w-10 h-10 shrink-0 rounded overflow-hidden">
                            <img src={track.cover_image || `http://127.0.0.1:8000/storage/${track.cover_path}`} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play size={12} className="text-white" fill="currentColor" />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate group-hover:text-[var(--accent)] transition-colors">
                              {track.title}
                            </p>
                            <p className="text-xs text-white/50 truncate">
                              {track.featured_artist || track.artist?.stage_name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Auth / Profile */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <ProfileMenu />
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-white hover:text-[var(--accent)] transition-colors text-sm font-medium">Login</Link>
                <Link to="/signup" className="hidden sm:block bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white px-5 py-2 rounded-full font-medium transition-all text-sm shadow-lg shadow-[var(--accent)]/20">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
