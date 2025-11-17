import React, { useMemo, useRef, useState, MouseEvent, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, MotionValue } from 'framer-motion';
import { Compass, BarChart3, Upload, User, LogIn, Mic2, Twitter, Github, Dribbble, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import axios from 'axios';

import video1 from './1.mp4';
import video2 from './2.mp4';
import video3 from './3.mp4';
import video4 from './4.mp4';
import video5 from './5.mp4';
import video6 from './6.mp4';

const tracks = [
  { id: 1, title: 'Neon Dreams', artist: 'Luna Waves', gradient: 'from-[#1f1f1f] via-[#2b2b2b] to-[#3a3a3a]' },
  { id: 2, title: 'Midnight Echoes', artist: 'Caspian Vale', gradient: 'from-[#2a1f14] via-[#3b2a1f] to-[#4b372a]' },
  { id: 3, title: 'Quiet Streets', artist: 'Vesper', gradient: 'from-[#1a202c] via-[#222b3a] to-[#2d3a4a]' },
  { id: 4, title: 'Static Sun', artist: 'Amberline', gradient: 'from-[#241a1a] via-[#2f2222] to-[#3a2b2b]' },
  { id: 5, title: 'Glass Birds', artist: 'Mira', gradient: 'from-[#1a1f24] via-[#222a30] to-[#2a3540]' },
  { id: 6, title: 'Signal Fire', artist: 'Kite Club', gradient: 'from-[#1b1b1b] via-[#282828] to-[#353535]' },
  { id: 7, title: 'Soft Bloom', artist: 'Juniper', gradient: 'from-[#1e1a24] via-[#2a2230] to-[#352a3d]' },
  { id: 8, title: 'Over Water', artist: 'Kepler', gradient: 'from-[#1a2420] via-[#223028] to-[#2a3d34]' },
];

function Waveform({ bars = 28, color = '#FF6B00', isPlaying }: { bars?: number; color?: string; isPlaying: boolean }) {
  const heights = React.useMemo(
    () => Array.from({ length: bars }, (_, i) => 30 + Math.round(40 * Math.abs(Math.sin(i * 0.55)))),
    [bars]
  );

  return (
    <div className="flex items-end gap-[3px] h-20 w-full overflow-hidden">
      {heights.map((h, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-sm"
          style={{ backgroundColor: color }}
          initial={{ height: Math.max(8, h * 0.5), opacity: 0.6 }}
          animate={isPlaying ? { height: h, opacity: [0.6, 0.85, 0.6] } : { height: 10, opacity: 0.4 }}
          transition={isPlaying ? {
            duration: 1.8,
            repeat: Infinity,
            repeatType: 'mirror',
            delay: i * 0.03,
            ease: 'easeInOut',
          } : { duration: 0.4, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

const TrackCard = ({ track, idx }: { track: typeof tracks[0], idx: number }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 200, mass: 0.6 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const spotlightOpacity = useTransform(
    [smoothMouseX, smoothMouseY] as MotionValue<number>[],
    ([x, y]: [number, number]) => {
      if (!cardRef.current) return 0;
      const rect = cardRef.current.getBoundingClientRect();
      const isInside = x > rect.left && x < rect.right && y > rect.top && y < rect.bottom;
      return isInside ? 1 : 0;
    }
  );

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <motion.article
      ref={cardRef}
      key={track.id}
      className={`snap-start shrink-0 w-[78vw] sm:w-[420px] md:w-[520px] rounded-2xl bg-gradient-to-br border border-white/5 p-5 md:p-6 shadow-soft relative overflow-hidden ${track.gradient}`}
      whileHover={{ y: -6, transition: { type: 'spring', stiffness: 250, damping: 20, mass: 0.6 } }}
      initial={{ opacity: 0, x: 12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl"
        style={{
          background: useTransform(
            [smoothMouseX, smoothMouseY] as MotionValue<number>[],
            ([x, y]: [number, number]) => {
              if (!cardRef.current) return 'radial-gradient(400px at 0px 0px, rgba(255, 107, 0, 0.15), transparent 80%)';
              const rect = cardRef.current.getBoundingClientRect();
              return `radial-gradient(400px at ${x - rect.left}px ${y - rect.top}px, rgba(255, 107, 0, 0.15), transparent 80%)`;
            }
          ),
          opacity: spotlightOpacity,
        }}
      />
      <div className="flex items-center gap-4">
        <div className={`h-20 w-20 md:h-24 md:w-24 rounded-xl bg-gradient-to-br ${track.gradient} relative overflow-hidden border border-white/10`}>
          <div
            className="absolute inset-0 opacity-20 mix-blend-overlay"
            style={{ background: `radial-gradient(120% 120% at 20% 10%, #FF6B0030 0%, transparent 60%)` }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0)_40%,rgba(255,255,255,0.04)_100%)]" />
        </div>

        <div className="min-w-0">
          <h3 className="text-base md:text-lg font-semibold truncate">{track.title}</h3>
          <p className="text-sm md:text-base text-white/60 truncate">{track.artist}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-white/50">
            <span>Indie</span>
            <span className="text-white/20">•</span>
            <span>
              {3 + (idx % 3)}:{(idx * 23) % 60 < 10 ? '0' : ''}
              {(idx * 23) % 60}
            </span>
          </div>
        </div>

        <motion.button
          aria-label={`Play ${track.title} by ${track.artist}`}
          className="ml-auto h-12 w-12 rounded-full flex items-center justify-center shadow-inner bg-accent"
          onClick={() => setIsPlaying(!isPlaying)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.96 }}
        >
          {isPlaying ? <Pause size={20} className="text-bg" /> : <Play size={20} className="text-bg translate-x-[1px]" />}
        </motion.button>
      </div>

      <div className="mt-5 md:mt-6">
        <Waveform color="#FF6B00" isPlaying={isPlaying} />
      </div>

      <div
        className="pointer-events-none absolute -inset-[1px] rounded-2xl"
        style={{
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.06), 0 30px 60px -40px #FF6B0020`,
        }}
      />
    </motion.article>
  );
};

export default function App() {
  const accent = '#FF6B00';
  const bg = '#0e0e0e';
  const fg = '#f5f5f5';
  const logoUrl = new URL('../vnyl_logo.png', import.meta.url).href;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const videoList = useMemo(() => [video1, video2, video3, video4, video5, video6], []);
  const randomVideo = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * videoList.length);
    return videoList[randomIndex];
  }, [videoList]);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/tracks')
      .then(res => setTracks(res.data))
      .catch(console.error);
  }, []);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.offsetWidth * 0.8;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-bg text-fg font-sans relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, ${accent}10, transparent 40%)`,
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.02%22%20fill-rule%3D%22evenodd%22%3E%3Cpath%20d%3D%22M0%2040L40%200H20L0%2020M40%2040V20L20%2040%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-bg/60 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 md:px-8 h-16 flex items-center justify-between">
          <nav className="flex items-center gap-3 md:gap-6 text-sm md:text-base">
            <a className="text-white/80 hover:text-white transition-colors flex items-center gap-2" href="#discover">
              <Compass size={16} /> <span className="hidden md:inline">Discover</span>
            </a>
            <a className="text-white/60 hover:text-white transition-colors flex items-center gap-2" href="#charts">
              <BarChart3 size={16} /> <span className="hidden md:inline">Charts</span>
            </a>
            <a className="text-white/60 hover:text-white transition-colors flex items-center gap-2" href="#upload">
              <Upload size={16} /> <span className="hidden md:inline">Upload</span>
            </a>
            <a className="text-white/60 hover:text-white transition-colors flex items-center gap-2" href="#profile">
              <User size={16} /> <span className="hidden md:inline">Profile</span>
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <button
              className="px-3 py-2 rounded-xl border border-white/10 text-white/90 hover:text-white hover:border-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 flex items-center gap-2 text-sm"
              aria-label="Login"
            >
              <LogIn size={14} /> Login
            </button>
            <button
              className="px-3 py-2 rounded-xl text-bg font-medium shadow-sm bg-accent flex items-center gap-2 text-sm"
              aria-label="Create Account"
            >
              <Mic2 size={14} /> Create Account
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden">
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
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-8 text-center">
          <motion.img
            src={logoUrl}
            alt="vnyl logo"
            className="mx-auto w-[200px] md:w-[320px] select-none"
            style={{ filter: `drop-shadow(0 0 24px ${accent}20)` }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: [1, 1.04, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.3, ease: 'easeInOut' }}
          />
          <motion.p
            className="mt-6 text-center text-white/70 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Stream indie. Share ideas. Ride the waveform.
          </motion.p>
        </div>
      </section>

      {/* Featured Tracks */}
      <section className="mx-auto max-w-7xl w-full px-6 md:px-8 pb-10 md:pb-16">
        <motion.div
          className="flex items-center justify-between mb-4 md:mb-6"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-lg md:text-xl font-semibold">Featured tracks</h2>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => handleScroll('left')}
              className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft size={18} />
            </motion.button>
            <motion.button
              onClick={() => handleScroll('right')}
              className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight size={18} />
            </motion.button>
          </div>
        </motion.div>

        <div role="region" aria-label="Featured tracks" className="relative">
          <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-bg to-transparent pointer-events-none z-10" />
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-bg to-transparent pointer-events-none z-10" />

          <div ref={scrollContainerRef} className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide" tabIndex={0}>
            {tracks.map((t, idx) => (
              <TrackCard track={t} idx={idx} key={t.id} />
            ))}
          </div>
        </div>
      </section>

      {/* Feed preview */}
      <section className="mx-auto max-w-7xl w-full px-6 md:px-8 pb-16 md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 md:p-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Your feed</h3>
            <a className="text-sm text-white/60 hover:text-white transition-colors" href="#refresh">Refresh</a>
          </div>
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <img src="https://i.pravatar.cc/40?u=a" alt="User avatar" className="h-10 w-10 rounded-full" />
              <p className="text-sm text-white/80">
                <span className="font-semibold text-white">Caspian Vale</span> uploaded a new track: <span className="text-accent">"Midnight Echoes"</span>
              </p>
              <span className="ml-auto text-xs text-white/40">2h ago</span>
            </div>
            <div className="flex items-center gap-3">
              <img src="https://i.pravatar.cc/40?u=b" alt="User avatar" className="h-10 w-10 rounded-full" />
              <p className="text-sm text-white/80">
                <span className="font-semibold text-white">Luna Waves</span> liked <span className="text-accent">"Static Sun"</span> by Amberline
              </p>
              <span className="ml-auto text-xs text-white/40">5h ago</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 md:px-8 py-8 flex justify-between items-center">
          <p className="text-xs text-white/50">© 2025 vnyl. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-white/50 hover:text-accent transition-colors"><Twitter size={16} /></a>
            <a href="#" className="text-white/50 hover:text-accent transition-colors"><Github size={16} /></a>
            <a href="#" className="text-white/50 hover:text-accent transition-colors"><Dribbble size={16} /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
