import { Link } from 'react-router-dom';
import { Compass, BarChart3, Upload, User, LogIn, Mic2 } from 'lucide-react';
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
          {user ? (
            <Link className="text-white/80 hover:text-white transition-colors flex items-center gap-2" to="/profile">
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`}
                alt={user.name}
                className="h-8 w-8 rounded-full object-cover border border-white/10"
              />
              <span className="font-medium">{user.name}</span>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-2 rounded-xl border border-white/10 text-white/90 hover:text-white hover:border-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 flex items-center gap-2 text-sm"
                aria-label="Login"
              >
                <LogIn size={14} /> Login
              </Link>
              <Link
                to="/create-account"
                className="px-3 py-2 rounded-xl text-bg font-medium shadow-sm bg-accent hover:bg-accent-hover transition-colors duration-200 flex items-center gap-2 text-sm"
                aria-label="Create Account"
              >
                <Mic2 size={14} /> Create Account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
