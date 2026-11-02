import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Flame, Clock, Send, Trophy, ShieldCheck, Scale, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { getSocket } from '../services/socket';
import { getGuestIdentity } from '../services/guestIdentity';
import { api } from '../services/api';

export const StoryBattlePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomCode = searchParams.get('roomCode');

  const [socket, setSocket] = useState(null);
  const [guest] = useState(getGuestIdentity());
  const [movies, setMovies] = useState([]);

  // Setup state (for host)
  const [selectedMovieId, setSelectedMovieId] = useState('vikram-2022');
  const [scenarioPrompt, setScenarioPrompt] = useState('Sandhanam discovers the police commissioner is about to betray him.');
  const [isStarting, setIsStarting] = useState(false);

  // Battle state
  const [battleState, setBattleState] = useState('setup'); // 'setup' | 'writing' | 'revealed' | 'judged'
  const [battleInfo, setBattleInfo] = useState(null);
  const [myEntry, setMyEntry] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submittedPlayerIds, setSubmittedPlayerIds] = useState([]);
  const [revealedSubmissions, setRevealedSubmissions] = useState([]);
  const [judgeResult, setJudgeResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(90);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getMovies({ limit: 50 }).then(res => setMovies(res.data || []));
  }, []);

  useEffect(() => {
    const s = getSocket();
    setSocket(s);

    s.on('battle:started', (info) => {
      setBattleInfo(info);
      setBattleState('writing');
      setTimeLeft(info.timerSeconds || 90);
      setSubmitted(false);
      setSubmittedPlayerIds([]);
      setMyEntry('');
      setIsStarting(false);
    });

    s.on('battle:player_ready_state', ({ submittedPlayerIds: pids }) => {
      setSubmittedPlayerIds(pids);
    });

    s.on('battle:submissions_revealed', (data) => {
      setRevealedSubmissions(data.submissions || []);
      setBattleState('revealed');
    });

    s.on('battle:judging_complete', (data) => {
      setJudgeResult(data);
      setBattleState('judged');
    });

    s.on('error', (err) => {
      setError(err.message);
      setIsStarting(false);
    });

    return () => {
      s.off('battle:started');
      s.off('battle:player_ready_state');
      s.off('battle:submissions_revealed');
      s.off('battle:judging_complete');
      s.off('error');
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (battleState !== 'writing' || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit if not submitted
          if (!submitted && socket && myEntry.trim()) {
            socket.emit('battle:submit_entry', {
              roomCode,
              playerId: guest.guestId,
              playerName: guest.name,
              text: myEntry.trim(),
            });
            setSubmitted(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [battleState, timeLeft, submitted, socket, roomCode, guest.guestId, guest.name, myEntry]);

  // Start battle
  const handleStartBattle = (e) => {
    e.preventDefault();
    if (!socket || !selectedMovieId || !scenarioPrompt.trim()) return;

    setIsStarting(true);
    socket.emit('battle:start', {
      roomCode,
      movieId: selectedMovieId,
      scenarioPrompt: scenarioPrompt.trim(),
    });
  };

  // Submit private entry
  const handleSubmitEntry = (e) => {
    e.preventDefault();
    if (!socket || !myEntry.trim() || submitted) return;

    socket.emit('battle:submit_entry', {
      roomCode,
      playerId: guest.guestId,
      playerName: guest.name,
      text: myEntry.trim(),
    });
    setSubmitted(true);
  };

  const opponentSubmitted = submittedPlayerIds.some(id => id !== guest.guestId);

  return (
    <div className="w-full page-container-narrow py-10 space-y-8">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-[rgba(49,35,49,0.12)]">
        <div className="flex items-center gap-3">
          <Badge variant="multiverse" size="sm">
            <Flame className="w-3.5 h-3.5 text-[#A83842]" /> Story Battle
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
      {battleState === 'setup' && (
        <div className="editorial-card bg-[#E8E6E2] p-6 sm:p-8 rounded-2xl border border-[rgba(49,35,49,0.12)] space-y-6 shadow-sm">
          <div>
            <h2 className="font-editorial font-bold text-3xl text-[#200F22] mb-2">
              Launch Story Battle
            </h2>
            <p className="text-xs sm:text-sm text-[#654D63] leading-relaxed">
              Both storytellers will receive this exact starting scenario. Each writes a secret continuation under a 90-second countdown timer. An AI Grand Judge evaluates creativity, canon accuracy, and internal logic.
            </p>
          </div>

          <form onSubmit={handleStartBattle} className="space-y-5">
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
                Starting Dilemma
              </label>
              <textarea
                rows={3}
                value={scenarioPrompt}
                onChange={(e) => setScenarioPrompt(e.target.value)}
                placeholder="The shared dilemma both players must continue..."
                className="w-full p-3.5 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.18)] text-sm text-[#200F22] placeholder-[#7E6C7D] focus:outline-none focus:ring-2 focus:ring-[#30152F]/25 leading-relaxed"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isStarting}
            >
              Start Synchronized Battle Timer
            </Button>
          </form>
        </div>
      )}

      {/* WRITING PHASE */}
      {battleState === 'writing' && battleInfo && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Synchronized Timer & Scenario Card */}
          <div className="editorial-card bg-[#E8E6E2] p-6 rounded-2xl border border-[rgba(49,35,49,0.12)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-[#654D63] uppercase tracking-wider">
                {battleInfo.movieTitle} • Common Scenario
              </span>
              <h3 className="font-editorial font-bold text-xl text-[#200F22]">
                "{battleInfo.scenarioPrompt}"
              </h3>
            </div>

            {/* Timer Pill */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-lg shrink-0 ${
              timeLeft < 20 ? 'bg-[#A83842]/15 border-[#A83842] text-[#A83842] animate-pulse' : 'bg-[#F2F1EE] border-[rgba(49,35,49,0.15)] text-[#200F22]'
            }`}>
              <Clock className="w-5 h-5 text-[#654D63]" />
              <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>

          {/* Submission Status Indicator */}
          <div className="flex items-center justify-between text-xs text-[#654D63] font-mono bg-[#E8E6E2] p-3.5 rounded-xl border border-[rgba(49,35,49,0.12)]">
            <span>Opponent Status: <strong className="text-[#200F22]">{opponentSubmitted ? '✓ Opponent has submitted!' : 'Typing...'}</strong></span>
            <span>Your Status: <strong className="text-[#200F22]">{submitted ? '✓ Submitted (Locked)' : 'Drafting'}</strong></span>
          </div>

          {/* Private Submission Editor */}
          <div className="editorial-card bg-[#E8E6E2] p-6 sm:p-8 rounded-2xl border border-[rgba(49,35,49,0.12)] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[rgba(49,35,49,0.1)] pb-3">
              <span className="font-editorial font-bold text-xl text-[#200F22]">
                Your Secret Continuation
              </span>
              <span className="text-[11px] font-mono text-[#7E6C7D]">
                Encrypted until simultaneous reveal
              </span>
            </div>

            <form onSubmit={handleSubmitEntry} className="space-y-4">
              <textarea
                rows={6}
                value={myEntry}
                onChange={(e) => setMyEntry(e.target.value)}
                disabled={submitted}
                placeholder="Write your alternate continuation. Ground your writing in authentic character voices, weapon mechanics, and unforeseen consequences..."
                className="w-full p-4 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.18)] text-sm text-[#200F22] placeholder-[#7E6C7D] focus:outline-none focus:ring-2 focus:ring-[#30152F]/25 disabled:opacity-60 leading-relaxed"
                required
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-[#7E6C7D] font-mono">
                  {myEntry.length} characters written
                </span>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={submitted || !myEntry.trim()}
                  icon={Send}
                >
                  {submitted ? 'Submission Locked ✓' : 'Submit Private Entry'}
                </Button>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* REVEAL & AI JUDGE RESULTS PHASE */}
      {(battleState === 'revealed' || battleState === 'judged') && (
        <div className="space-y-8 animate-fadeIn">
          
          <div className="text-center">
            <Badge variant="multiverse" size="lg" className="mb-2">
              <Trophy className="w-4 h-4 text-[#30152F]" /> Simultaneous Reveal & AI Verdict
            </Badge>
            <h2 className="font-editorial text-4xl font-bold text-[#200F22]">
              The Grand Standoff
            </h2>
          </div>

          {/* Side by Side Submissions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {revealedSubmissions.map((sub) => {
              const isWinner = judgeResult?.winnerPlayerId === sub.playerId;
              const feedback = judgeResult?.judgeResult?.player1Feedback?.totalScore ? (
                judgeResult.winnerPlayerId === sub.playerId
                  ? (judgeResult.judgeResult.player1Feedback.totalScore >= judgeResult.judgeResult.player2Feedback.totalScore ? judgeResult.judgeResult.player1Feedback : judgeResult.judgeResult.player2Feedback)
                  : (judgeResult.judgeResult.player1Feedback.totalScore < judgeResult.judgeResult.player2Feedback.totalScore ? judgeResult.judgeResult.player1Feedback : judgeResult.judgeResult.player2Feedback)
              ) : null;

              return (
                <div
                  key={sub.playerId}
                  className={`editorial-card p-6 rounded-2xl border flex flex-col justify-between ${
                    isWinner
                      ? 'bg-[#E8E6E2] border-[#30152F] shadow-lg ring-1 ring-[#30152F]/20'
                      : 'bg-[#E8E6E2] border-[rgba(49,35,49,0.12)] shadow-sm'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[rgba(49,35,49,0.1)] pb-3">
                      <span className="font-editorial font-bold text-lg text-[#200F22]">
                        {sub.playerName}
                      </span>
                      {isWinner && (
                        <Badge variant="hypothetical" size="sm">
                          Winner 🏆
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-[#30152F] leading-relaxed bg-[#F2F1EE] p-4 rounded-xl border border-[rgba(49,35,49,0.08)]">
                      {sub.text}
                    </p>

                    {/* AI Feedback breakdown if judged */}
                    {feedback && (
                      <div className="p-3.5 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.12)] space-y-2 text-xs">
                        <div className="flex items-center justify-between font-mono text-[#200F22] font-bold">
                          <span>Judge Score: {feedback.totalScore}/30</span>
                          <span className="text-[11px] text-[#654D63]">
                            Creativity {feedback.creativityScore} • Canon {feedback.canonScore} • Logic {feedback.consistencyScore}
                          </span>
                        </div>
                        <p className="text-[#654D63] italic">{feedback.commentary}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Grand Judge Summary Card */}
          {judgeResult && (
            <div className="editorial-card p-6 sm:p-8 rounded-2xl bg-[#E8E6E2] border border-[rgba(49,35,49,0.12)] text-center space-y-3 shadow-sm">
              <Scale className="w-8 h-8 text-[#30152F] mx-auto" />
              <h3 className="font-editorial font-bold text-2xl text-[#200F22]">
                AI Grand Judge Proclamation
              </h3>
              <p className="text-xs sm:text-sm text-[#654D63] max-w-2xl mx-auto leading-relaxed">
                {judgeResult.judgeResult?.verdictSummary || 'Both storytellers demonstrated fierce mastery over the cinematic universe.'}
              </p>

              <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setBattleState('setup');
                    setJudgeResult(null);
                  }}
                >
                  Start New Battle
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => navigate('/lobby')}
                >
                  Back to Lobby
                </Button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default StoryBattlePage;
