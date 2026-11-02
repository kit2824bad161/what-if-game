import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { BookOpen, Send, Sparkles, User, Bookmark, CheckCircle, ShieldCheck, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { getSocket } from '../services/socket';
import { getGuestIdentity } from '../services/guestIdentity';
import { api } from '../services/api';

export const CoOpStoryPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomCode = searchParams.get('roomCode');

  const [socket, setSocket] = useState(null);
  const [guest] = useState(getGuestIdentity());
  const [movies, setMovies] = useState([]);

  // Setup state
  const [selectedMovieId, setSelectedMovieId] = useState('vikram-2022');
  const [initialPrompt, setInitialPrompt] = useState('What if Tina neutralized the assault team before Vikram arrived?');
  const [isInitializing, setIsInitializing] = useState(false);

  // Active Co-op state
  const [storyState, setStoryState] = useState(null);
  const [turnPrompt, setTurnPrompt] = useState('');
  const [isSubmittingTurn, setIsSubmittingTurn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getMovies({ limit: 50 }).then(res => setMovies(res.data || []));
  }, []);

  useEffect(() => {
    const s = getSocket();
    setSocket(s);

    s.on('coop:story_updated', (updatedStory) => {
      setStoryState(updatedStory);
      setIsInitializing(false);
      setIsSubmittingTurn(false);
      setTurnPrompt('');
    });

    s.on('error', (err) => {
      setError(err.message);
      setIsInitializing(false);
      setIsSubmittingTurn(false);
    });

    return () => {
      s.off('coop:story_updated');
      s.off('error');
    };
  }, []);

  // Host starts the collaborative story
  const handleStartCoop = (e) => {
    e.preventDefault();
    if (!socket || !selectedMovieId || !initialPrompt.trim()) return;

    setIsInitializing(true);
    socket.emit('coop:init_story', {
      roomCode,
      movieId: selectedMovieId,
      initialPrompt: initialPrompt.trim(),
    });
  };

  // Submit turn
  const handleSubmitTurn = (e) => {
    e.preventDefault();
    if (!socket || !turnPrompt.trim() || !storyState) return;

    setIsSubmittingTurn(true);
    socket.emit('coop:submit_turn', {
      roomCode,
      playerId: guest.guestId,
      whatIfFollowUp: turnPrompt.trim(),
    });
  };

  // Save collaborative timeline to MongoDB
  const handleSaveToDatabase = async () => {
    if (!storyState || isSaving) return;
    setIsSaving(true);
    try {
      await api.saveTimeline({
        guestId: guest.guestId,
        movieId: storyState.movieId,
        customTitle: `Co-op Multiverse: ${storyState.movieTitle}`,
        initialScenario: storyState.initialPrompt,
        turns: storyState.turns,
        isSaved: true,
        mode: 'coop',
      });
      setSaveSuccess(true);
    } catch (err) {
      setError('Failed to save to database.');
    } finally {
      setIsSaving(false);
    }
  };

  const isMyTurn = storyState?.currentTurnPlayerId === guest.guestId;

  return (
    <div className="w-full page-container-narrow py-10 space-y-8">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-6 border-b border-[rgba(49,35,49,0.12)]">
        <div className="flex items-center gap-3">
          <Badge variant="canon" size="sm">
            <BookOpen className="w-3.5 h-3.5" /> Co-op Story Room
          </Badge>
          <span className="text-xs font-mono text-[#654D63]">Room: {roomCode}</span>
        </div>

        <button
          onClick={() => navigate('/lobby')}
          className="text-xs font-mono uppercase tracking-wider text-[#654D63] hover:text-[#200F22] transition-colors"
        >
          Exit to Lobby →
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#A83842]/10 border border-[#A83842]/25 text-[#A83842] text-xs">
          {error}
        </div>
      )}

      {/* SETUP PHASE */}
      {!storyState ? (
        <div className="editorial-card bg-[#E8E6E2] p-6 sm:p-8 rounded-2xl border border-[rgba(49,35,49,0.12)] space-y-6 shadow-sm">
          <div>
            <h2 className="font-editorial font-bold text-3xl text-[#200F22] mb-2">
              Launch Co-op Story Chamber
            </h2>
            <p className="text-xs sm:text-sm text-[#654D63] leading-relaxed">
              Pick a movie universe and establish the opening divergence. Both players will alternately write subsequent chapters with real-time AI continuation.
            </p>
          </div>

          <form onSubmit={handleStartCoop} className="space-y-5">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-[#654D63] mb-2">
                Movie Universe
              </label>
              <select
                value={selectedMovieId}
                onChange={(e) => setSelectedMovieId(e.target.value)}
                className="w-full py-2.5 px-3.5 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.18)] text-sm text-[#200F22] focus:outline-none focus:ring-2 focus:ring-[#30152F]/25"
              >
                {movies.map((m) => (
                  <option key={m.movieId} value={m.movieId}>
                    {m.title} ({m.releaseYear} • {m.languageLabel})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-[#654D63] mb-2">
                Opening What-If Catalyst
              </label>
              <textarea
                rows={3}
                value={initialPrompt}
                onChange={(e) => setInitialPrompt(e.target.value)}
                placeholder="What initial event diverges from canon?"
                className="w-full p-3.5 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.18)] text-sm text-[#200F22] placeholder-[#7E6C7D] focus:outline-none focus:ring-2 focus:ring-[#30152F]/25 leading-relaxed"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isInitializing}
            >
              Weave Opening Act & Begin
            </Button>
          </form>
        </div>
      ) : (
        /* LIVE COLLABORATIVE TIMELINE PHASE */
        <div className="space-y-8 animate-fadeIn">
          
          {/* Active Turn Banner */}
          <div className="editorial-card bg-[#E8E6E2] p-5 rounded-2xl border border-[rgba(49,35,49,0.12)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase text-[#654D63]">Current Turn:</span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${isMyTurn ? 'bg-[#30152F] text-[#F2F1EE] shadow-sm' : 'bg-[#F2F1EE] text-[#654D63] border border-[rgba(49,35,49,0.12)]'}`}>
                  {isMyTurn ? 'YOUR TURN TO WRITE' : 'OPPONENT IS WRITING...'}
                </span>
              </div>
              <h2 className="font-editorial font-bold text-2xl text-[#200F22] mt-1">
                {storyState.movieTitle}
              </h2>
            </div>

            {saveSuccess ? (
              <span className="text-xs font-mono text-[#287A59] flex items-center gap-1.5 font-semibold">
                <CheckCircle className="w-4 h-4" /> Saved to Archive
              </span>
            ) : (
              <Button
                variant="outline"
                size="sm"
                icon={Bookmark}
                isLoading={isSaving}
                onClick={handleSaveToDatabase}
              >
                Save Universe
              </Button>
            )}
          </div>

          {/* Chapters List */}
          <div className="space-y-6 relative pl-6 before:absolute before:left-[11px] before:top-4 before:bottom-4 before:w-[2px] before:bg-gradient-to-b before:from-[#30152F]/40 via-[rgba(49,35,49,0.2)] to-transparent">
            {storyState.turns?.map((turn, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-[30px] top-2 w-5 h-5 rounded-full bg-[#F2F1EE] border-2 border-[#30152F] flex items-center justify-center">
                  <span className="text-[9px] font-bold text-[#30152F] font-mono">{turn.turnNumber}</span>
                </div>

                <div className="editorial-card bg-[#E8E6E2] rounded-2xl p-6 border border-[rgba(49,35,49,0.12)] shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-[rgba(49,35,49,0.1)] pb-2">
                    <span className="font-editorial font-bold text-xl text-[#200F22]">
                      Chapter {turn.turnNumber}: {turn.continuationTitle}
                    </span>
                    <span className="text-[11px] text-[#7E6C7D] font-mono">
                      By: <span className="text-[#30152F] font-semibold">{turn.contributedBy}</span>
                    </span>
                  </div>

                  <p className="text-xs text-[#30152F] italic bg-[#F2F1EE] p-3 rounded-xl border border-[rgba(49,35,49,0.08)]">
                    Prompt: "{turn.userPrompt}"
                  </p>

                  <p className="text-sm text-[#30152F] leading-relaxed">
                    {turn.narrativeText}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Turn Composer */}
          <div className="editorial-card bg-[#E8E6E2] p-6 rounded-2xl border border-[rgba(49,35,49,0.12)] space-y-4 shadow-sm">
            <h3 className="font-editorial font-bold text-xl text-[#200F22] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#30152F]" />
              Write Next Chapter ({storyState.turns.length + 1})
            </h3>

            {isMyTurn ? (
              <form onSubmit={handleSubmitTurn} className="space-y-4">
                <textarea
                  rows={3}
                  value={turnPrompt}
                  onChange={(e) => setTurnPrompt(e.target.value)}
                  placeholder="Propose the next twist, confrontation, or decision..."
                  className="w-full p-3.5 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.18)] text-sm text-[#200F22] placeholder-[#7E6C7D] focus:outline-none focus:ring-2 focus:ring-[#30152F]/25 leading-relaxed"
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  icon={Send}
                  isLoading={isSubmittingTurn}
                >
                  Submit & Weave Chapter
                </Button>
              </form>
            ) : (
              <div className="p-6 text-center bg-[#F2F1EE] rounded-xl border border-[rgba(49,35,49,0.1)] text-xs text-[#654D63] animate-pulse">
                Waiting for the other player to write their chapter... Your screen will update automatically.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default CoOpStoryPage;
