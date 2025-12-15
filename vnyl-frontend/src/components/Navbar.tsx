import { Link } from 'react-router-dom';
import { Music2, Search, Upload, Menu, X, BarChart3, User, LogIn, Compass } from 'lucide-react';
import ProfileMenu from './ProfileMenu';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const [user, setUser] = useState<{ name: string, email: string, avatar?: string } | null>(null);

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
    // Listen for storage events (login/logout from other tabs or components)
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-bg/60 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 md:px-8 h-16 flex items-center justify-between">
        <nav className="flex items-center gap-3 md:gap-6 text-sm md:text-base">
          <Link className="text-white/80 hover:text-white transition-colors flex items-center gap-4" to="/">
            <img src="/assets/mini_logo.png" alt="vnyl logo" className="h-10" />
            <span className="hidden md:inline">Discover</span>
          </Link>
          <Link className="text-white/60 hover:text-white transition-colors flex items-center gap-2" to="/charts">
            <BarChart3 size={16} /> <span className="hidden md:inline">Charts</span>
          </Link>
          <Link className="text-white/60 hover:text-white transition-colors flex items-center gap-2" to="/upload">
            <Upload size={16} /> <span className="hidden md:inline">Upload</span>
          </Link>
          {user && (
            <Link className="text-white/60 hover:text-white transition-colors flex items-center gap-2" to="/profile">
              <User size={16} /> <span className="hidden md:inline">Profile</span>
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {/* Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center gap-6">
            {/* Removed redundant Upload link */}
          </div>

          {/* User Profile / Auth Buttons */}
          {user ? (
            <ProfileMenu />
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-white hover:text-[var(--accent)] transition-colors text-sm font-medium">Login</Link>
              <Link to="/signup" className="bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white px-5 py-2 rounded-full font-medium transition-all text-sm shadow-lg shadow-[var(--accent)]/20">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
