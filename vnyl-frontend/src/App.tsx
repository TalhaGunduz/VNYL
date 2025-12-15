import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import CreateAccount from './pages/CreateAccount';
import Navbar from './components/Navbar';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Upload from './pages/Upload';
import BecomeArtist from './pages/BecomeArtist'; // Added import for BecomeArtist
import ArtistPanel from './pages/ArtistPanel';

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/signup" element={<CreateAccount />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/become-artist" element={<BecomeArtist />} /> {/* Added BecomeArtist route */}
        <Route path="/artist-panel" element={<ArtistPanel />} />
      </Routes>
    </Router>
  );
}

