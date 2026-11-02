import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { HelpCircle, Sparkles, Send, Key, CheckCircle, AlertCircle, Eye, ArrowLeft, Trophy, Lock, ShieldCheck, Clock, Film, Search } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { getSocket } from '../services/socket';
import { getGuestIdentity } from '../services/guestIdentity';
import { api } from '../services/api';

export const MovieGuessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomCode = searchParams.get('roomCode');

  const [socket, setSocket] = useState(null);
  const [guest] = useState(getGuestIdentity());
  const [movies, setMovies] = useState([]);

  // Room & Role state
  const [room, setRoom] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [secretMovie, setSecretMovie] = useState(null);

  // Creator setup state
  const [selectedSecretMovieId, setSelectedSecretMovieId] = useState('vikram-2022');
  const [customMovieTitle, setCustomMovieTitle] = useState('');
  const [creatorPrompt, setCreatorPrompt] = useState('What if the protagonist refused to remain in hiding after the first attack?');
  const [isSettingUp, setIsSettingUp] = useState(false);

  // Active game state: 'loading' | 'setup' | 'waiting_host' | 'guessing' | 'host_active' | 'resolved'
  const [gameState, setGameState] = useState('loading');
  const [mysteryStory, setMysteryStory] = useState('');
  const [clues, setClues] = useState([]);
  const [totalCluesCount, setTotalCluesCount] = useState(3);
  const [hintsUnlocked, setHintsUnlocked] = useState(1);
  const [currentPoints, setCurrentPoints] = useState(100);
  const [guessInput, setGuessInput] = useState('');
  const [guessHistory, setGuessHistory] = useState([]);
  const [resolvedResult, setResolvedResult] = useState(null);
  const [ragDiagnostics, setRagDiagnostics] = useState(null);
  const [error, setError] = useState(null);

  // Check if current room is in Mystery Movie Challenge mode
  const activeMode = room?.mode || 'mysteryMovie';
  const isMysteryMode = (activeMode === 'mysteryMovie');

  // Fetch movies for creator selection
  useEffect(() => {
    api.getMovies({ limit: 50 })
      .then(res => setMovies(res.data || []))
      .catch(err => console.error(err));
  }, []);

  // Socket listeners and initial sync
  useEffect(() => {
    const s = getSocket();
    setSocket(s);

    if (!roomCode) {
      navigate('/lobby');
      return;
    }

    // Request authoritative room and round state
    s.emit('movie_guess:get_state', {
      roomCode,
      playerId: guest.guestId,
      playerName: guest.name,
    });

    s.on('movie_guess:state', (data) => {
      setRoom(data.room);
      setIsHost(data.isHost);
      setGameState(data.gameState);
      setIsSettingUp(data.isGenerating);
      setMysteryStory(data.mysteryStory || '');
      setClues(data.clues || []);
      setTotalCluesCount(data.totalCluesCount || 3);
      setHintsUnlocked(data.hintsUnlocked || 1);
      setCurrentPoints(data.currentPoints || 100);
      setGuessHistory(data.guessHistory || []);
      if (data.ragDiagnostics) {
        setRagDiagnostics(data.ragDiagnostics);
      }

      if (data.secretMovie) {
        setSecretMovie(data.secretMovie);
      }
      if (data.resolvedResult) {
        setResolvedResult(data.resolvedResult);
      }
    });

    s.on('movie_guess:generating', () => {
      setIsSettingUp(true);
      setError(null);
    });

    s.on('movie_guess:generation_failed', (data) => {
      setIsSettingUp(false);
      setError(data?.message || 'Generation failed.');
    });

    s.on('movie_guess:story_ready', (data) => {
      setMysteryStory(data.mysteryStory);
      setClues(data.clues || []);
      setTotalCluesCount(data.totalCluesCount || 3);
      setHintsUnlocked(data.hintsUnlocked || 1);
      setCurrentPoints(data.currentPoints || 100);
      setIsSettingUp(false);
      setError(null);

      // Role-specific screen transition
      setGameState((prev) => (isHost || prev === 'setup' ? 'host_active' : 'guessing'));
    });

    s.on('movie_guess:host_round_ready', (data) => {
      if (data.secretMovie) {
        setSecretMovie(data.secretMovie);
      }
      setGameState('host_active');
    });

    s.on('movie_guess:hint_unlocked', (data) => {
      setHintsUnlocked(data.hintsUnlocked);
      setClues(data.clues);
      setCurrentPoints(data.currentPoints);
    });

    s.on('movie_guess:incorrect_guess', (data) => {
      setCurrentPoints(data.remainingPoints);
      setGuessHistory(data.guessHistory);
    });

    s.on('movie_guess:round_resolved', (data) => {
      setResolvedResult(data);
      if (data.secretMovie) {
        setSecretMovie(data.secretMovie);
      }
      if (data.players) {
        setRoom(prev => prev ? { ...prev, players: data.players } : prev);
      }
      setGameState('resolved');
    });

    s.on('movie_guess:round_reset', () => {
      setMysteryStory('');
      setClues([]);
      setGuessHistory([]);
      setResolvedResult(null);
      setGuessInput('');
      setSecretMovie(null);
      setError(null);
      setGameState(isHost ? 'setup' : 'waiting_host');
    });

    s.on('room:updated', (updatedRoom) => {
      setRoom(updatedRoom);
      if (updatedRoom.status === 'lobby') {
        navigate(`/lobby?roomCode=${roomCode}`);
      }
    });

    s.on('error', (err) => {
      setError(err.message || 'An error occurred.');
      setIsSettingUp(false);
    });

    return () => {
      s.off('movie_guess:state');
      s.off('movie_guess:generating');
      s.off('movie_guess:generation_failed');
      s.off('movie_guess:story_ready');
      s.off('movie_guess:host_round_ready');
      s.off('movie_guess:hint_unlocked');
      s.off('movie_guess:incorrect_guess');
      s.off('movie_guess:round_resolved');
      s.off('movie_guess:round_reset');
      s.off('room:updated');
      s.off('error');
    };
  }, [roomCode, guest.guestId, guest.name, isHost, navigate]);

  // Creator starts the round
  const handleCreatorSubmit = (e) => {
    e.preventDefault();
    if (!socket || isSettingUp) return;

    setIsSettingUp(true);
    setError(null);

    if (isMysteryMode) {
      // Feature 2: Host provides ONLY movie title (no What-If prompt required)
      socket.emit('movie_guess:setup_round', {
        roomCode,
        movieId: selectedSecretMovieId,
        movieTitle: customMovieTitle.trim() || undefined,
        mode: 'mysteryMovie',
      });
    } else {
      // Feature 1: What If? mode with custom divergence prompt
      if (!creatorPrompt.trim()) {
        setError('Please enter a What-If scenario.');
        setIsSettingUp(false);
        return;
      }
      socket.emit('movie_guess:setup_round', {
        roomCode,
        movieId: selectedSecretMovieId,
        whatIfPrompt: creatorPrompt.trim(),
        mode: 'movieGuess',
      });
    }
  };

  // Guesser unlocks next clue
  const handleUnlockHint = () => {
    if (!socket || !roomCode) return;
    socket.emit('movie_guess:unlock_hint', { roomCode });
  };

  // Guesser submits title guess
  const handleSubmitGuess = (e) => {
    e.preventDefault();
    if (!socket || !guessInput.trim()) return;

    socket.emit('movie_guess:submit_guess', {
      roomCode,
      guessText: guessInput.trim(),
      guesserPlayerId: guest.guestId,
    });
    setGuessInput('');
  };

  // Host triggers another round
  const handlePlayAnotherRound = () => {
    if (!socket || !roomCode) return;
    socket.emit('movie_guess:next_round', { roomCode });
  };

  // Return both players to lobby
  const handleReturnToLobby = () => {
    if (socket && roomCode) {
      socket.emit('room:return_to_lobby', { roomCode });
    }
    navigate(`/lobby?roomCode=${roomCode}`);
  };

  return (
    <div className="w-full page-container-narrow py-10 space-y-8">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-[rgba(49,35,49,0.12)]">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
          <Badge variant={isMysteryMode ? 'multiverse' : 'hypothetical'} size="sm">
            {isMysteryMode ? <Sparkles className="w-3.5 h-3.5 text-[#30152F]" /> : <HelpCircle className="w-3.5 h-3.5 text-[#30152F]" />}
            {isMysteryMode ? 'Mystery Movie Challenge' : 'What If? Movie Guess'}
          </Badge>
          <span className="text-xs font-mono text-[#654D63]">Room: {roomCode}</span>
          <Badge variant={isHost ? 'canon' : 'neutral'} size="sm">
            {isHost ? '👑 Host' : '🕵️ Guesser'}
          </Badge>
        </div>

        <button
          onClick={handleReturnToLobby}
          className="text-xs font-mono uppercase tracking-wider text-[#654D63] hover:text-[#200F22] transition-colors flex items-center gap-1.5 shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Exit to Lobby
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#A83842]/10 border border-[#A83842]/25 text-[#A83842] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* LOADING STATE */}
      {gameState === 'loading' && (
        <div className="editorial-card bg-[#E8E6E2] p-12 rounded-2xl border border-[rgba(49,35,49,0.12)] text-center space-y-4 animate-pulse shadow-sm">
          <div className="w-12 h-12 rounded-full border-2 border-[#30152F] border-t-transparent animate-spin mx-auto" />
          <p className="text-sm font-mono text-[#654D63]">Synchronizing room state...</p>
        </div>
      )}

      {/* PHASE 1 (HOST): CREATOR SETUP SCREEN */}
      {isHost && (gameState === 'setup' || (gameState === 'loading' && isHost)) && (
        <div className="editorial-card bg-[#E8E6E2] p-6 sm:p-8 rounded-2xl border border-[rgba(49,35,49,0.12)] space-y-6 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[#654D63] uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#30152F]" />
              {isMysteryMode ? 'RAG-Powered Movie Mystery' : 'What-If Divergence Puzzle'}
            </div>
            <h2 className="font-editorial font-bold text-2xl sm:text-3xl text-[#200F22] mb-2">
              {isMysteryMode ? 'Setup Mystery Movie Challenge' : 'Setup Secret Movie Puzzle'}
            </h2>
            <p className="text-xs sm:text-sm text-[#654D63] leading-relaxed">
              {isMysteryMode
                ? 'Provide only the original movie title. The backend retrieves verified movie lore via RAG and generates an original mystery story in simple English for Player 2 to deduce.'
                : 'Choose a movie and write a hypothetical divergence. The server will sanitize titles and generate a spoiler-free mystery story for Player 2 to deduce.'}
            </p>
          </div>

          <form onSubmit={handleCreatorSubmit} className="space-y-5">
            {/* Movie Selection */}
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-[#654D63] mb-2">
                Select Original Movie (From Verified Multiverse Library)
              </label>
              <select
                value={selectedSecretMovieId}
                onChange={(e) => {
                  setSelectedSecretMovieId(e.target.value);
                  setCustomMovieTitle('');
                }}
                disabled={isSettingUp}
                className="w-full py-3 px-4 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.2)] text-sm text-[#200F22] focus:outline-none focus:border-[#30152F] disabled:opacity-50 mb-3"
              >
                {movies.map((m) => (
                  <option key={m.movieId} value={m.movieId} className="bg-[#F2F1EE] text-[#200F22]">
                    {m.title} ({m.releaseYear} • {m.languageLabel})
                  </option>
                ))}
              </select>

              {/* Direct title input for Mystery Mode */}
              {isMysteryMode && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-mono text-[#654D63]">
                      Or type a supported movie title:
                    </span>
                    <span className="text-[10px] text-[#654D63] font-mono">
                      (e.g. Vikram, Kaithi, Maanaadu)
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={customMovieTitle}
                      onChange={(e) => setCustomMovieTitle(e.target.value)}
                      placeholder="e.g. Maanaadu, Kaithi, Vikram..."
                      className="w-full py-2.5 px-4 pr-10 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.2)] text-xs text-[#200F22] placeholder-[#8F8A88] focus:outline-none focus:border-[#30152F]"
                    />
                    <Search className="w-4 h-4 text-[#8F8A88] absolute right-3 top-3 pointer-events-none" />
                  </div>

                  {/* Quick Pick Chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {['Vikram', 'Kaithi', 'Maanaadu', 'Nayakan', 'Baahubali: The Beginning'].map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          setCustomMovieTitle(name);
                          const match = movies.find(m => m.title.toLowerCase().includes(name.toLowerCase()));
                          if (match) setSelectedSecretMovieId(match.movieId);
                        }}
                        className="px-2.5 py-1 rounded-md bg-[#DFDCD7] hover:bg-[#D5D1CB] text-[11px] text-[#30152F] font-mono transition-colors border border-[rgba(49,35,49,0.15)]"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* What-If Scenario Input ONLY for What If Mode */}
            {!isMysteryMode && (
              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-[#654D63] mb-2">
                  What-If Scenario
                </label>
                <textarea
                  rows={3}
                  value={creatorPrompt}
                  onChange={(e) => setCreatorPrompt(e.target.value)}
                  disabled={isSettingUp}
                  placeholder="e.g. What if the hero knew the identity of the informant from the beginning?"
                  className="w-full p-4 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.2)] text-sm text-[#200F22] placeholder-[#8F8A88] focus:outline-none focus:border-[#30152F] leading-relaxed disabled:opacity-50"
                  required
                />
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isSettingUp}
            >
              {isSettingUp
                ? 'Retrieving RAG Lore & Generating in Simple English...'
                : isMysteryMode
                  ? 'Generate Mystery Challenge via RAG & Begin'
                  : 'Generate Mystery Puzzle & Begin'}
            </Button>
          </form>
        </div>
      )}

      {/* PHASE 1 (PLAYER 2): WAITING FOR HOST SCREEN */}
      {!isHost && (gameState === 'setup' || gameState === 'waiting_host') && (
        <div className="editorial-card bg-[#E8E6E2] p-8 sm:p-12 rounded-2xl border border-[rgba(49,35,49,0.12)] text-center space-y-6 animate-fadeIn shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#DFDCD7] border border-[rgba(49,35,49,0.15)] text-[#30152F] flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-[#30152F]" />
          </div>

          <div className="space-y-2">
            <Badge variant="hypothetical" size="md">
              Waiting for Host
            </Badge>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#200F22]">
              {isMysteryMode
                ? 'Host is Selecting the Secret Movie'
                : 'Host is Crafting the Mystery Alternate Universe'}
            </h2>
            <p className="text-xs sm:text-sm text-[#654D63] max-w-md mx-auto leading-relaxed">
              {isMysteryMode
                ? 'Player 1 is selecting an iconic movie. The AI will retrieve canon facts from the database via RAG and write an original mystery story in simple English for you to deduce!'
                : 'Player 1 is selecting a secret movie and setting up the What-If divergence. Once generated, your challenge will appear here automatically!'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.12)] max-w-sm mx-auto flex items-center justify-center gap-3 text-xs text-[#30152F] font-mono">
            <div className="w-2.5 h-2.5 rounded-full bg-[#30152F] animate-ping" />
            <span>Standing by for mystery transmission...</span>
          </div>
        </div>
      )}

      {/* PHASE 2 (HOST): HOST-SIDE MANAGEMENT SCREEN */}
      {isHost && gameState === 'host_active' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Host Control Header */}
          <div className="editorial-card bg-[#E8E6E2] p-5 rounded-2xl border border-[rgba(49,35,49,0.12)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#DFDCD7] border border-[rgba(49,35,49,0.15)] flex items-center justify-center text-[#30152F] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-mono uppercase text-[#654D63] font-semibold tracking-wider block">
                  Host Management Panel • {isMysteryMode ? 'Mystery Movie Mode' : 'What-If Mode'}
                </span>
                <div className="font-editorial text-lg font-bold text-[#200F22] flex items-center gap-2 truncate">
                  <span>Secret Movie:</span>
                  <span className="text-[#30152F] truncate">
                    {secretMovie?.title || 'Selected Secret Movie'} {secretMovie?.releaseYear ? `(${secretMovie.releaseYear})` : ''}
                  </span>
                </div>
              </div>
            </div>

            <Badge variant="canon" size="sm" className="shrink-0">
              <Lock className="w-3 h-3 mr-1" /> Hidden from Player 2
            </Badge>
          </div>

          {/* Points & Clue Progression */}
          <div className="editorial-card bg-[#E8E6E2] p-5 rounded-2xl border border-[rgba(49,35,49,0.12)] flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[11px] font-mono uppercase text-[#654D63]">Player 2 Current Points</span>
              <div className="font-editorial text-2xl sm:text-3xl font-bold text-[#200F22]">
                {currentPoints} Points
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-mono uppercase text-[#654D63]">Clues Unlocked</span>
              <div className="text-sm font-mono text-[#30152F] font-bold">
                {hintsUnlocked} / {totalCluesCount} Revealed
              </div>
            </div>
          </div>

          {/* Mystery Story (The simple English story Player 2 is reading) */}
          <div className="editorial-card bg-[#E8E6E2] p-6 sm:p-8 rounded-2xl border border-[rgba(49,35,49,0.12)] shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(49,35,49,0.12)] pb-3">
              <span className="font-editorial font-bold text-lg text-[#200F22]">
                {isMysteryMode ? 'Generated Mystery Challenge Narrative' : 'Generated Alternate Universe Narrative'}
              </span>
              <span className="text-[11px] font-mono text-[#2D6A4F] flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Simple English • Titles Redacted
              </span>
            </div>

            <p className="text-sm sm:text-base text-[#200F22] leading-relaxed bg-[#F2F1EE] p-5 rounded-xl border border-[rgba(49,35,49,0.12)] font-normal">
              {mysteryStory}
            </p>
          </div>

          {/* Unlocked Clues */}
          <div className="editorial-card bg-[#E8E6E2] p-6 rounded-2xl border border-[rgba(49,35,49,0.12)] space-y-3 shadow-sm">
            <h3 className="font-editorial font-bold text-base text-[#200F22] flex items-center gap-2">
              <Key className="w-4 h-4 text-[#30152F]" />
              Intelligence Clues Active for Player 2
            </h3>

            <div className="space-y-2">
              {clues.map((clue, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.12)] text-xs text-[#200F22]">
                  <span className="font-mono text-[#30152F] font-bold mr-2">Hint #{idx + 1}:</span>
                  {clue}
                </div>
              ))}
            </div>
          </div>

          {/* Live Player 2 Guess Feed */}
          <div className="editorial-card bg-[#E8E6E2] p-6 rounded-2xl border border-[rgba(49,35,49,0.12)] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-editorial font-bold text-base text-[#200F22] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#654D63]" />
                Player 2 Guess Feed (Live)
              </h3>
              <span className="text-xs text-[#654D63] font-mono">
                {guessHistory.length === 0 ? 'No guesses yet' : `${guessHistory.length} attempt(s)`}
              </span>
            </div>

            {guessHistory.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-[rgba(49,35,49,0.2)] text-center text-xs text-[#654D63]">
                Waiting for Player 2 to deduce the movie and submit a guess...
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 text-xs">
                {guessHistory.map((g, i) => (
                  <span
                    key={i}
                    className={`px-3 py-1.5 rounded-xl border font-mono ${
                      g.isCorrect
                        ? 'bg-[#2D6A4F]/15 text-[#2D6A4F] border-[#2D6A4F]/30 font-bold'
                        : 'bg-[#A83842]/15 text-[#A83842] border-[#A83842]/30 line-through'
                    }`}
                  >
                    {g.guess}
                  </span>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* PHASE 2 (PLAYER 2): GUESSING GAMEPLAY SCREEN */}
      {!isHost && gameState === 'guessing' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Mode Welcome Banner */}
          {isMysteryMode && (
            <div className="p-4 rounded-xl bg-[#DFDCD7] border border-[rgba(49,35,49,0.12)] flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[#30152F] shrink-0" />
              <p className="text-xs text-[#654D63] leading-relaxed">
                <strong className="font-semibold text-[#200F22]">Mystery Challenge:</strong> The story below is an original fiction inspired by a real movie's plot, relationships, and world rules. Read closely and deduce the original film!
              </p>
            </div>
          )}

          {/* Points & Progress Banner */}
          <div className="editorial-card bg-[#E8E6E2] p-5 rounded-2xl border border-[rgba(49,35,49,0.12)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div>
              <span className="text-[11px] font-mono uppercase text-[#654D63]">Round Potential</span>
              <div className="font-editorial text-2xl sm:text-3xl font-bold text-[#200F22]">
                {currentPoints} Points
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#654D63] font-mono">
                Clues Unlocked: {hintsUnlocked}/{totalCluesCount}
              </span>
              {hintsUnlocked < totalCluesCount && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={Key}
                  onClick={handleUnlockHint}
                >
                  Unlock Next Hint (-15 pts)
                </Button>
              )}
            </div>
          </div>

          {/* Mystery Story (Spoiler-Redacted & Simple English) */}
          <div className="editorial-card bg-[#E8E6E2] p-6 sm:p-8 rounded-2xl border border-[rgba(49,35,49,0.12)] shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(49,35,49,0.12)] pb-3">
              <span className="font-editorial font-bold text-lg text-[#200F22]">
                {isMysteryMode ? 'The Mystery Narrative' : 'The Alternate Reality Narrative'}
              </span>
              <span className="text-[11px] font-mono text-[#2D6A4F] flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Simple English • Leak-Checked
              </span>
            </div>

            <p className="text-sm sm:text-base text-[#200F22] leading-relaxed bg-[#F2F1EE] p-5 rounded-xl border border-[rgba(49,35,49,0.12)] font-normal">
              {mysteryStory}
            </p>
          </div>

          {/* Clues Box */}
          <div className="editorial-card bg-[#E8E6E2] p-6 rounded-2xl border border-[rgba(49,35,49,0.12)] space-y-3 shadow-sm">
            <h3 className="font-editorial font-bold text-base text-[#200F22] flex items-center gap-2">
              <Key className="w-4 h-4 text-[#30152F]" />
              Unlocked Intelligence Clues
            </h3>

            <div className="space-y-2">
              {clues.map((clue, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.12)] text-xs text-[#200F22]">
                  <span className="font-mono text-[#30152F] font-bold mr-2">Hint #{idx + 1}:</span>
                  {clue}
                </div>
              ))}
            </div>
          </div>

          {/* Guess Submission Form */}
          <div className="editorial-card bg-[#E8E6E2] p-6 rounded-2xl border border-[rgba(49,35,49,0.12)] space-y-4 shadow-sm">
            <h3 className="font-editorial font-bold text-base text-[#200F22]">
              Guess the Original Movie
            </h3>

            <form onSubmit={handleSubmitGuess} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                placeholder="Guess the movie title (e.g. Vikram, Kaithi, Maanaadu, Nayakan)..."
                className="flex-1 p-3.5 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.2)] text-sm text-[#200F22] placeholder-[#8F8A88] focus:outline-none focus:border-[#30152F] min-w-0"
                required
              />
              <Button type="submit" variant="primary" size="md" icon={Send} className="shrink-0">
                Submit Guess
              </Button>
            </form>

            {/* Guess History */}
            {guessHistory.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-mono text-[#654D63] block mb-1">Previous Guesses:</span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {guessHistory.map((g, i) => (
                    <span
                      key={i}
                      className={`px-2.5 py-1 rounded-md border font-mono ${
                        g.isCorrect
                          ? 'bg-[#2D6A4F]/15 text-[#2D6A4F] border-[#2D6A4F]/30'
                          : 'bg-[#A83842]/15 text-[#A83842] border-[#A83842]/30 line-through'
                      }`}
                    >
                      {g.guess}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* PHASE 3: ROUND RESOLUTION / SCOREBOARD SCREEN (BOTH PLAYERS) */}
      {gameState === 'resolved' && resolvedResult && (
        <div className="editorial-card bg-[#E8E6E2] p-6 sm:p-8 rounded-2xl border border-[rgba(49,35,49,0.12)] text-center space-y-6 animate-fadeIn shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#DFDCD7] border border-[rgba(49,35,49,0.15)] text-[#30152F] flex items-center justify-center mx-auto shadow-sm">
            <Trophy className="w-8 h-8 text-[#30152F]" />
          </div>

          <div>
            <Badge variant={resolvedResult.isCorrect ? 'canon' : 'warning'} size="lg" className="mb-2">
              {resolvedResult.isCorrect ? 'Puzzle Solved!' : 'Round Over'}
            </Badge>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#200F22]">
              The Secret Movie Was "{resolvedResult.secretMovie?.title}"
            </h2>
            {resolvedResult.secretMovie?.releaseYear && (
              <p className="text-xs text-[#654D63] font-mono mt-1">
                Released {resolvedResult.secretMovie.releaseYear} • Director {resolvedResult.secretMovie.director}
              </p>
            )}
          </div>

          {/* Movie Poster Display */}
          {resolvedResult.secretMovie?.posterUrl && (
            <div className="w-36 aspect-[2/3] mx-auto rounded-xl overflow-hidden shadow-md border border-[rgba(49,35,49,0.15)]">
              <img
                src={resolvedResult.secretMovie.posterUrl}
                alt={resolvedResult.secretMovie.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {resolvedResult.isCorrect && (
            <div className="p-4 rounded-xl bg-[#2D6A4F]/10 border border-[#2D6A4F]/30 text-[#2D6A4F] font-mono text-sm max-w-sm mx-auto">
              +{resolvedResult.pointsAwarded || 100} Points Awarded to Player 2!
            </div>
          )}

          {/* Player Scores */}
          {room?.players && (
            <div className="p-4 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.12)] max-w-md mx-auto space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#654D63] block mb-2">
                Room Scoreboard
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {room.players.map((p) => (
                  <div key={p.playerId} className="p-2.5 rounded-xl bg-[#E8E6E2] border border-[rgba(49,35,49,0.12)] flex items-center justify-between text-xs min-w-0">
                    <span className="font-medium text-[#200F22] truncate mr-2">{p.name}</span>
                    <span className="font-mono text-[#30152F] font-bold shrink-0">{p.score || 0} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            {isHost ? (
              <Button
                variant="primary"
                size="md"
                onClick={handlePlayAnotherRound}
              >
                Play Another Round
              </Button>
            ) : (
              <div className="text-xs text-[#654D63] font-mono flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#654D63]" />
                Waiting for Host to start next round...
              </div>
            )}

            <Button
              variant="outline"
              size="md"
              onClick={handleReturnToLobby}
            >
              Back to Lobby
            </Button>
          </div>
        </div>
      )}

    </div>
  );
};
