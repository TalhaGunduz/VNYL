import React, { useMemo, useRef, useState, MouseEvent, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Twitter, Github, Dribbble, ChevronLeft, ChevronRight, Play, Compass, Heart, ListMusic, User, Share2 } from 'lucide-react';
import Swal from 'sweetalert2';
import TrackCard from '../components/TrackCard';
import { usePlayer } from '../context/PlayerContext';
import { useNavigate } from 'react-router-dom';
import AddToPlaylistModal from '../components/AddToPlaylistModal';
import { apiFetch } from '../utils/api';

// Shared logic from Hub (simplified)
const SectionHeader = ({ title, subtitle, onScrollLeft, onScrollRight }: any) => (
  <div className="flex items-end justify-between mb-6 md:mb-8">
    <div className="flex items-center gap-4">
      <div className="h-8 w-1 bg-[var(--accent)] rounded-full" />
      <div>
        <h2 className="text-xl md:text-2xl font-bold">{title}</h2>
        <p className="text-white/30 text-xs font-medium tracking-wider uppercase mt-1">{subtitle}</p>
      </div>
    </div>
    <div className="flex gap-2">
      <button
        onClick={onScrollLeft}
        className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={onScrollRight}
        className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  </div>
);

export default function Home() {
  const accent = '#FF6B00';
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { playTrack } = usePlayer();
  const navigate = useNavigate();

  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addToPlaylistTrackId, setAddToPlaylistTrackId] = useState<number | null>(null);
  const [activeMenu, setActiveMenu] = useState<{ id: number, x: number, y: number, opensUp: boolean, opensLeft: boolean } | null>(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target.closest('[data-menu-trigger]') || target.closest('[data-context-menu]')) return;
      setActiveMenu(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const videoList = useMemo(() => ['/assets/1.mp4', '/assets/2.mp4', '/assets/3.mp4', '/assets/4.mp4', '/assets/5.mp4', '/assets/6.mp4'], []);
  const randomVideo = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * videoList.length);
    return videoList[randomIndex];
  }, [videoList]);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    apiFetch('/api/public-tracks')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setTracks(data.tracks.sort(() => 0.5 - Math.random()).slice(0, 10));
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  // Scroll Handler
  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Track Actions
  const handleToggleLike = async (trackId: number) => {
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire({
        title: 'Giriş Gerekli',
        text: 'Şarkıları beğenmek için giriş yapmalısınız.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Giriş Yap',
        cancelButtonText: 'İptal',
        background: '#161616',
        color: '#fff',
        confirmButtonColor: '#FF6B00',
        cancelButtonColor: '#333',
        customClass: {
          popup: 'rounded-[24px]',
          confirmButton: 'rounded-full px-6 py-2',
          cancelButton: 'rounded-full px-6 py-2'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/login');
        }
      });
      return;
    }
    try {
      const response = await apiFetch(`/api/tracks/${trackId}/like`, { method: 'POST' });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('storage'));
        Swal.fire({
          title: 'Giriş Gerekli',
          text: 'Şarkıları beğenmek için giriş yapmalısınız.',
          icon: 'info',
          showCancelButton: true,
          confirmButtonText: 'Giriş Yap',
          cancelButtonText: 'İptal',
          background: '#161616',
          color: '#fff',
          confirmButtonColor: '#FF6B00',
          cancelButtonColor: '#333',
          customClass: {
            popup: 'rounded-[24px]',
            confirmButton: 'rounded-full px-6 py-2',
            cancelButton: 'rounded-full px-6 py-2'
          }
        }).then((result) => {
          if (result.isConfirmed) {
            navigate('/login');
          }
        });
        return;
      }

      const data = await response.json();
      if (data.status === 'success') {
        setTracks(prev => prev.map(t =>
          t.id === trackId ? { ...t, is_liked: data.liked } : t
        ));
      }
    } catch (error) {
      console.error("Error toggling like", error);
    }
  };

  const handleAddToPlaylist = (trackId: number) => {
    if (!localStorage.getItem('token')) {
      Swal.fire('Login Required', 'You need to login to add to playlists.', 'info');
      return;
    }
    setAddToPlaylistTrackId(trackId);
  };

  const handleMenuClick = (e: React.MouseEvent, track: any) => {
    e.stopPropagation();
    // Use closest('[data-menu-trigger]') for reliable positioning through prop chains
    const btn = (e.target as Element).closest('[data-menu-trigger]') as HTMLElement
      ?? (e.currentTarget as HTMLElement);
    const rect = btn.getBoundingClientRect();
    const menuWidth = 224;
    const menuHeight = 190;
    const isOnRightHalf = rect.left > window.innerWidth / 2;
    const isOnBottomHalf = rect.top > window.innerHeight * 0.6;
    setActiveMenu(prev => prev?.id === track.id ? null : {
      id: track.id,
      x: isOnRightHalf ? (rect.right - menuWidth) : rect.left,
      y: isOnBottomHalf ? (rect.top - menuHeight - 8) : (rect.bottom + 8),
      opensUp: isOnBottomHalf,
      opensLeft: isOnRightHalf
    });
  };

  // Auth Logic (Keep existing)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loginSuccess = params.get('login_success');
    const token = params.get('token');
    const error = params.get('error');

    if (loginSuccess === 'true') {
      if (token) {
        localStorage.setItem('token', token);
        fetch('http://127.0.0.1:8000/api/user', {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        })
          .then(res => res.json())
          .then(userData => {
            localStorage.setItem('user', JSON.stringify(userData));
            window.dispatchEvent(new Event('storage'));
            Swal.fire({ title: 'Welcome!', icon: 'success', timer: 2000, showConfirmButton: false });
            window.history.replaceState({}, document.title, window.location.pathname);
          })
          .catch(err => console.error(err));
      }
    } else if (error) {
      Swal.fire('Error', 'Login failed.', 'error');
    }
  }, []);

  return (
    <div
      className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] font-sans relative overflow-x-hidden selection:bg-[var(--accent)] selection:text-black"
      onMouseMove={handleMouseMove}
    >
      {/* Background Effects */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, ${accent}08, transparent 40%)`,
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.02%22%20fill-rule%3D%22evenodd%22%3E%3Cpath%20d%3D%22M0%2040L40%200H20L0%2020M40%2040V20L20%2040%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />


      {/* Hero */}
      <section className="relative h-[55vh] md:h-[65vh] flex items-center justify-center overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 z-0">
          <video
            key={randomVideo}
            src={randomVideo}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <img
              src="/assets/vnyl_logo.png"
              alt="vnyl logo"
              className="mx-auto w-[220px] md:w-[340px] select-none drop-shadow-2xl"
            />
          </motion.div>

          <motion.p
            className="mt-6 text-center text-white/80 max-w-2xl mx-auto text-lg md:text-xl font-light tracking-wide"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Stream music. Share ideas. Ride the waveform.
          </motion.p>

          <motion.div
            className="mt-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={() => {
                const hubSection = document.getElementById('featured');
                hubSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-3 rounded-full bg-white text-black font-bold tracking-wide hover:scale-105 transition-transform flex items-center gap-2 mx-auto"
            >
              <Play size={18} fill="black" /> START LISTENING
            </button>
          </motion.div>
        </div>
      </section>

      {/* Featured Tracks */}
      <section id="featured" className="mx-auto max-w-7xl w-full px-6 md:px-8 py-16">
        <SectionHeader
          title="Featured Tracks"
          subtitle="DISCOVER NEW SOUNDS"
          onScrollLeft={() => handleScroll('left')}
          onScrollRight={() => handleScroll('right')}
        />

        <div className="relative">
          <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#0a0a0a] to-transparent pointer-events-none z-10" />
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#0a0a0a] to-transparent pointer-events-none z-10" />

          {loading ? (
            <div className="flex gap-6 overflow-hidden">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-[220px] h-[300px] bg-white/5 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div ref={scrollContainerRef} className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x">
              {tracks.map((t) => (
                <div key={t.id} className="snap-start shrink-0">
                  <TrackCard
                    track={t}
                    onClick={() => playTrack(t)}
                    onLike={() => handleToggleLike(t.id)}
                    onAddToPlaylist={() => handleAddToPlaylist(t.id)}
                    onMenuClick={(e) => handleMenuClick(e, t)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#121212]">
        <div className="mx-auto max-w-7xl px-6 md:px-8 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 opacity-50">
            <Compass size={24} />
            <span className="font-bold tracking-widest">VNYL</span>
          </div>
          <p className="text-sm text-white/30">© 2025 vnyl. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-white/30 hover:text-white transition-colors"><Twitter size={20} /></a>
            <a href="#" className="text-white/30 hover:text-white transition-colors"><Github size={20} /></a>
            <a href="#" className="text-white/30 hover:text-white transition-colors"><Dribbble size={20} /></a>
          </div>
        </div>
      </footer>

      <AddToPlaylistModal
        trackId={addToPlaylistTrackId}
        onClose={() => setAddToPlaylistTrackId(null)}
      />

      {/* Global Context Menu */}
      {activeMenu && (() => {
        const track = tracks.find(t => t.id === activeMenu.id);
        if (!track) return null;
        return (
          <div
            data-context-menu="true"
            className="fixed z-[9999] w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
            style={{
              top: activeMenu.y,
              left: activeMenu.x,
              transformOrigin: `${activeMenu.opensLeft ? 'right' : 'left'} ${activeMenu.opensUp ? 'bottom' : 'top'}`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-3 transition-colors border-b border-white/5"
              onClick={() => { handleToggleLike(track.id); setActiveMenu(null); }}
            >
              <Heart size={16} className={track.is_liked ? 'text-red-500 fill-current' : ''} />
              {track.is_liked ? 'Liked' : 'Like Song'}
            </button>
            <button
              className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-3 transition-colors"
              onClick={() => { handleAddToPlaylist(track.id); setActiveMenu(null); }}
            >
              <ListMusic size={16} />
              Add to Playlist
            </button>
            <button
              className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-3 transition-colors"
              onClick={() => {
                if (track.artist?.slug || track.artist?.id) {
                  navigate(`/artist/${track.artist.slug || track.artist.id}`);
                } else if (track.featured_artist) {
                  navigate(`/search?q=${encodeURIComponent(track.featured_artist)}`);
                }
                setActiveMenu(null);
              }}
            >
              <User size={16} />
              Go to Artist
            </button>
            <button
              className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-3 transition-colors border-t border-white/5"
              onClick={() => {
                const shareUrl = `${window.location.origin}/track/${track.id}`;
                navigator.clipboard.writeText(shareUrl);
                const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, background: '#1a1a1a', color: '#fff' });
                Toast.fire({ icon: 'success', title: 'Link copied to clipboard' });
                setActiveMenu(null);
              }}
            >
              <Share2 size={16} />
              Share
            </button>
          </div>
        );
      })()}
    </div>
  );
}
