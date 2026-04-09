import React from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import RoutinesPage from './pages/RoutinesPage';
import FeedPage from './pages/FeedPage';
import LogPage from './pages/LogPage';
import SessionPage from './pages/SessionPage';

function App() {
  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <nav className="p-4 bg-black flex justify-between items-center">
        <h1 className="text-orange-500 font-bold">Lifts</h1>
        <div className="flex gap-2">
          <Link to="/log" className="bg-orange-500 px-4 py-2 rounded text-white hover:bg-orange-600 transition duration-300">
            Log session
          </Link>
          <Link to="/routines" className="bg-orange-500 px-4 py-2 rounded text-white hover:bg-orange-600 transition duration-300">
            Routines
          </Link>
        </div>
      </nav>
      <main className="p-4">
        <Routes>
          <Route path="/" element={<FeedPage />} />
          <Route path="/log" element={<LogPage />} />
          <Route path="/routines" element={<RoutinesPage />} />
          <Route path="/session/:date" element={<SessionPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
