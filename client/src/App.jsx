import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { MovieExplorerPage } from './pages/MovieExplorerPage';
import { MovieDetailPage } from './pages/MovieDetailPage';
import { TimelineCreatorPage } from './pages/TimelineCreatorPage';
import { AlternateTimelineStoryPage } from './pages/AlternateTimelineStoryPage';
import { MultiplayerLobbyPage } from './pages/MultiplayerLobbyPage';
import { MovieGuessPage } from './pages/MovieGuessPage';
import { CoOpStoryPage } from './pages/CoOpStoryPage';
import { StoryBattlePage } from './pages/StoryBattlePage';
import { ResultsScoreboardPage } from './pages/ResultsScoreboardPage';
import { SavedTimelinesPage } from './pages/SavedTimelinesPage';
import { AdminConsolePage } from './pages/AdminConsolePage';
import { SettingsPage } from './pages/SettingsPage';

function AppLayout() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  React.useEffect(() => {
    if (isLandingPage) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      return () => {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      };
    }
  }, [isLandingPage]);

  return (
    <div
      className={`flex flex-col w-full bg-[#F2F1EE] text-[#30152F] selection:bg-[#30152F] selection:text-[#F2F1EE] ${
        isLandingPage
          ? 'h-screen h-[100dvh] overflow-hidden'
          : 'min-h-screen'
      }`}
    >
      <Navbar />
      <main
        className={`flex-1 w-full min-w-0 flex flex-col ${
          isLandingPage
            ? 'mt-20 h-[calc(100vh-5rem)] h-[calc(100dvh-5rem)] overflow-hidden'
            : 'pt-20'
        }`}
      >
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/movies" element={<MovieExplorerPage />} />
          <Route path="/movies/:movieId" element={<MovieDetailPage />} />
          <Route path="/creator" element={<TimelineCreatorPage />} />
          <Route path="/timeline/story" element={<AlternateTimelineStoryPage />} />
          <Route path="/lobby" element={<MultiplayerLobbyPage />} />
          <Route path="/game/guess" element={<MovieGuessPage />} />
          <Route path="/game/coop" element={<CoOpStoryPage />} />
          <Route path="/game/battle" element={<StoryBattlePage />} />
          <Route path="/results" element={<ResultsScoreboardPage />} />
          <Route path="/saved" element={<SavedTimelinesPage />} />
          <Route path="/admin" element={<AdminConsolePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isLandingPage && <Footer />}
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
