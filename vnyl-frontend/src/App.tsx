import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import CreateAccount from './pages/CreateAccount';
import Navbar from './components/Navbar';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Upload from './pages/Upload';
import PlaylistDetail from './pages/PlaylistDetail'; // Import
import BecomeArtist from './pages/BecomeArtist'; // Added import for BecomeArtist
import ArtistPanel from './pages/ArtistPanel';
import ArtistProfileSetup from './pages/ArtistProfileSetup';
import Hub from './pages/Hub';
import ArtistPage from './pages/ArtistPage';

import { PlayerProvider } from './context/PlayerContext';
import MusicPlayer from './components/MusicPlayer';

export default function App() {
  return (
    <Router>
      <PlayerProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/signup" element={<CreateAccount />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/playlists/:id" element={<PlaylistDetail />} />
          <Route path="/become-artist" element={<BecomeArtist />} />
          <Route path="/artist-panel" element={<ArtistPanel />} />
          <Route path="/artist/complete-profile" element={<ArtistProfileSetup />} />
          <Route path="/hub" element={<Hub />} />
          <Route path="/artist/:slug" element={<ArtistPage />} />
        </Routes>
        <MusicPlayer />
      </PlayerProvider>
    </Router>
  );
}


