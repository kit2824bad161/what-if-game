import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Users, Copy, Check, Play, HelpCircle, BookOpen, Flame, Sparkles, User, AlertCircle } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { getSocket } from '../services/socket';
import { getGuestIdentity } from '../services/guestIdentity';

export const MultiplayerLobbyPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const defaultMode = searchParams.get('mode') || 'movieGuess';

  const [socket, setSocket] = useState(null);
  const [guest] = useState(getGuestIdentity());
  const [room, setRoom] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [selectedMode, setSelectedMode] = useState(defaultMode);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const s = getSocket();
    setSocket(s);

    const handleRoomUpdate = (updatedRoom) => {
      setRoom(updatedRoom);
      setLoading(false);

      // When the room transitions to playing or in_progress, automatically navigate both players to game
      if (updatedRoom.status === 'in_progress' || updatedRoom.status === 'playing') {
        if (updatedRoom.mode === 'movieGuess' || updatedRoom.mode === 'mysteryMovie') {
          navigate(`/game/guess?roomCode=${updatedRoom.roomCode}`);
        } else if (updatedRoom.mode === 'coOpStory') {
          navigate(`/game/coop?roomCode=${updatedRoom.roomCode}`);
        } else if (updatedRoom.mode === 'storyBattle') {
          navigate(`/game/battle?roomCode=${updatedRoom.roomCode}`);
        }
      }
    };

    s.on('room:created', (newRoom) => {
      setRoom(newRoom);
      setLoading(false);
      setError(null);
    });

    s.on('room:updated', handleRoomUpdate);
    s.on('room:game_started', handleRoomUpdate);

    s.on('error', (err) => {
      setError(err.message || 'Multiplayer error');
      setLoading(false);
    });

    s.on('connect_error', (err) => {
      setError('Real-time multiplayer server is currently unreachable. If deployed on Vercel Serverless, persistent WebSockets require a persistent backend host (such as Render or Railway).');
      setLoading(false);
    });

    // If roomCode is in URL, auto-sync with existing room
    const roomCodeParam = searchParams.get('roomCode');
    if (roomCodeParam) {
      s.emit('room:sync', {
        roomCode: roomCodeParam,
        playerId: guest.guestId,
        playerName: guest.name,
      });
    }

    return () => {
      s.off('room:created');
      s.off('room:updated', handleRoomUpdate);
      s.off('room:game_started', handleRoomUpdate);
      s.off('error');
      s.off('connect_error');
    };
  }, [navigate, searchParams, guest.guestId, guest.name]);

  const handleCreateRoom = () => {
    if (!socket) return;
    setLoading(true);
    setError(null);
    socket.emit('room:create', {
      hostId: guest.guestId,
      hostName: guest.name,
      mode: selectedMode,
    });
  };

  const handleJoinRoom = (e) => {
    if (e) e.preventDefault();
    if (!socket || !joinCode.trim()) return;
    setLoading(true);
    setError(null);
    socket.emit('room:join', {
      roomCode: joinCode.trim().toUpperCase(),
      playerId: guest.guestId,
      playerName: guest.name,
    });
  };

  const handleToggleReady = () => {
    if (!socket || !room) return;
    socket.emit('room:toggle_ready', {
      roomCode: room.roomCode,
      playerId: guest.guestId,
    });
  };

  const handleChangeMode = (mode) => {
    if (!socket || !room || room.hostId !== guest.guestId) return;
    socket.emit('room:set_mode', {
      roomCode: room.roomCode,
      hostId: guest.guestId,
      mode,
    });
  };

  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = () => {
    if (!room || !socket) return;
    setLoading(true);
    socket.emit('room:start_game', {
      roomCode: room.roomCode,
      hostId: guest.guestId,
    });
  };

  const isHost = room?.hostId === guest.guestId;
  const allReady = room?.players?.length >= 2 && room?.players?.every(p => p.isReady);

  return (
    <div className="w-full page-container-narrow py-10 sm:py-12 space-y-10">
      
      {/* Header */}
      <div className="text-center mb-12">
        <Badge variant="multiverse" size="sm" className="mb-2 font-mono uppercase tracking-widest text-[10px]">
          <Users className="w-3.5 h-3.5 text-[#30152F]" /> Synchronized Multiplayer
        </Badge>
        <h1 className="font-editorial text-4xl sm:text-5xl font-bold text-[#200F22] tracking-tight mb-3">
          Multiplayer Arena
        </h1>
        <p className="text-sm text-[#654D63] leading-relaxed">
          Play Movie Guess, Co-op Multiverse, or AI Judged Story Battles with another player.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-[#A83842]/10 border border-[#A83842]/25 text-[#A83842] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#A83842]" />
          <span>{error}</span>
        </div>
      )}

      {!room ? (
        /* SCREEN: Create or Join Room */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Create Room Card */}
          <div className="editorial-card bg-[#E8E6E2] p-6 sm:p-8 rounded-2xl space-y-6 flex flex-col justify-between shadow-sm">
            <div>
              <h2 className="font-editorial font-bold text-2xl text-[#200F22] mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#30152F]" />
                Create a New Room
              </h2>
              <p className="text-xs text-[#654D63] mb-6 leading-relaxed">
                You will be the host and receive a unique 6-character room code to invite a friend.
              </p>

              {/* Mode Selection */}
              <div className="space-y-3 mb-6">
                <label className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-[#654D63]">
                  Select Game Mode
                </label>

                <div
                  onClick={() => setSelectedMode('mysteryMovie')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedMode === 'mysteryMovie'
                      ? 'bg-[#F2F1EE] border-[#30152F] ring-1 ring-[#30152F]/30 shadow-sm'
                      : 'bg-[#F2F1EE]/60 border-[rgba(49,35,49,0.12)] hover:border-[rgba(49,35,49,0.25)]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-[#986421]" />
                    <span className="font-semibold text-xs text-[#200F22]">Mystery Movie Challenge</span>
                    <Badge variant="hypothetical" size="sm" className="ml-auto text-[10px] py-0 px-1.5 font-mono">New RAG Mode</Badge>
                  </div>
                  <p className="text-[11px] text-[#654D63] leading-relaxed">Host enters ONLY the movie title. AI creates an original mystery story using RAG for Player 2 to guess.</p>
                </div>

                <div
                  onClick={() => setSelectedMode('movieGuess')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedMode === 'movieGuess'
                      ? 'bg-[#F2F1EE] border-[#30152F] ring-1 ring-[#30152F]/30 shadow-sm'
                      : 'bg-[#F2F1EE]/60 border-[rgba(49,35,49,0.12)] hover:border-[rgba(49,35,49,0.25)]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <HelpCircle className="w-4 h-4 text-[#986421]" />
                    <span className="font-semibold text-xs text-[#200F22]">What If? Movie Guess</span>
                  </div>
                  <p className="text-[11px] text-[#654D63] leading-relaxed">Host writes a What-If divergence scenario to generate a secret timeline puzzle.</p>
                </div>

                <div
                  onClick={() => setSelectedMode('coOpStory')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedMode === 'coOpStory'
                      ? 'bg-[#F2F1EE] border-[#30152F] ring-1 ring-[#30152F]/30 shadow-sm'
                      : 'bg-[#F2F1EE]/60 border-[rgba(49,35,49,0.12)] hover:border-[rgba(49,35,49,0.25)]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4 text-[#287A59]" />
                    <span className="font-semibold text-xs text-[#200F22]">Co-op Story Room</span>
                  </div>
                  <p className="text-[11px] text-[#654D63] leading-relaxed">Take turns weaving an alternate movie timeline together in real-time.</p>
                </div>

                <div
                  onClick={() => setSelectedMode('storyBattle')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedMode === 'storyBattle'
                      ? 'bg-[#F2F1EE] border-[#30152F] ring-1 ring-[#30152F]/30 shadow-sm'
                      : 'bg-[#F2F1EE]/60 border-[rgba(49,35,49,0.12)] hover:border-[rgba(49,35,49,0.25)]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className="w-4 h-4 text-[#A83842]" />
                    <span className="font-semibold text-xs text-[#200F22]">Story Battle</span>
                  </div>
                  <p className="text-[11px] text-[#654D63] leading-relaxed">Write secret continuations against a timer. Judged 1-10 by Groq AI.</p>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full uppercase tracking-wider text-xs font-semibold py-3.5 shadow-md"
              isLoading={loading}
              onClick={handleCreateRoom}
            >
              Generate Room & Code
            </Button>
          </div>

          {/* Join Room Card */}
          <div className="editorial-card bg-[#E8E6E2] p-6 sm:p-8 rounded-2xl space-y-6 flex flex-col justify-between shadow-sm">
            <div>
              <h2 className="font-editorial font-bold text-2xl text-[#200F22] mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#30152F]" />
                Join Existing Room
              </h2>
              <p className="text-xs text-[#654D63] mb-6 leading-relaxed">
                Enter the 6-character room code shared by your friend to jump into the session.
              </p>

              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-semibold uppercase tracking-[0.2em] text-[#654D63] mb-2">
                    Room Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. WHAT42"
                    className="w-full p-4 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.15)] text-center text-3xl font-mono font-bold tracking-widest text-[#200F22] focus:outline-none focus:ring-2 focus:ring-[#30152F]/30"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full uppercase tracking-wider text-xs font-semibold py-3.5 shadow-md"
                  isLoading={loading}
                >
                  Join Room
                </Button>
              </form>
            </div>

            <div className="p-4 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.12)] text-xs text-[#654D63] space-y-1">
              <span className="font-mono text-[#7E6C7D] font-semibold text-[11px] uppercase tracking-wider">Your Guest Identity:</span>
              <p className="flex items-center gap-1.5 text-[#200F22] font-semibold">
                <User className="w-3.5 h-3.5 text-[#654D63]" /> {guest.name}
              </p>
            </div>
          </div>

        </div>
      ) : (
        /* SCREEN: Active Room Lobby (Screen 7) */
        <div className="editorial-card bg-[#E8E6E2] p-6 sm:p-8 rounded-2xl space-y-8 animate-fadeIn shadow-sm">
          
          {/* Room Code Display Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-6 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.14)] gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#654D63]">
                Share this Room Code with Player 2:
              </span>
              <div className="font-editorial text-4xl sm:text-5xl font-bold text-[#200F22] tracking-wider font-mono">
                {room.roomCode}
              </div>
            </div>

            <Button
              variant={copied ? 'secondary' : 'outline'}
              size="md"
              icon={copied ? Check : Copy}
              onClick={handleCopyCode}
              className="uppercase tracking-wider text-xs font-mono"
            >
              {copied ? 'Code Copied!' : 'Copy Room Code'}
            </Button>
          </div>

          {/* Mode Selector for Host */}
          {isHost ? (
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#654D63]">
                Selected Mode (Host Controlled)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'mysteryMovie', label: 'Mystery Challenge' },
                  { id: 'movieGuess', label: 'What If? Guess' },
                  { id: 'coOpStory', label: 'Co-op Story' },
                  { id: 'storyBattle', label: 'Story Battle' }
                ].map(({ id: m, label }) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleChangeMode(m)}
                    className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                      room.mode === m
                        ? 'bg-[#30152F] text-[#F2F1EE] border-[#30152F] shadow-sm'
                        : 'bg-[#F2F1EE] text-[#654D63] border-[rgba(49,35,49,0.12)] hover:border-[rgba(49,35,49,0.25)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-[#F2F1EE] text-xs text-[#654D63] border border-[rgba(49,35,49,0.12)]">
              Game Mode: <span className="font-semibold text-[#200F22] uppercase tracking-wider">{room.mode}</span> (Set by Host)
            </div>
          )}

          {/* Player Roster */}
          <div className="space-y-3">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#654D63]">
              Connected Players ({room.players.length}/2)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {room.players.map((p) => {
                const isMe = p.playerId === guest.guestId;
                return (
                  <div
                    key={p.playerId}
                    className="p-4 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.12)] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#30152F] text-[#F2F1EE] flex items-center justify-center font-bold text-sm">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-[#200F22] flex items-center gap-2">
                          {p.name}
                          {isMe && <span className="text-[10px] text-[#7E6C7D] font-mono">(You)</span>}
                        </div>
                        <span className="text-[11px] text-[#7E6C7D] font-mono uppercase">
                          {p.isHost ? 'Host' : 'Challenger'}
                        </span>
                      </div>
                    </div>

                    <Badge variant={p.isReady ? 'canon' : 'neutral'} size="sm">
                      {p.isReady ? 'Ready' : 'Waiting'}
                    </Badge>
                  </div>
                );
              })}

              {/* Waiting for player 2 slot */}
              {room.players.length < 2 && (
                <div className="p-4 rounded-xl border border-dashed border-[rgba(49,35,49,0.25)] flex items-center justify-center text-xs text-[#7E6C7D] font-mono">
                  Waiting for Player 2 to enter code...
                </div>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-6 border-t border-[rgba(49,35,49,0.12)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <Button
              variant="outline"
              size="md"
              onClick={handleToggleReady}
              className="uppercase tracking-wider text-xs font-mono"
            >
              Toggle Ready Status
            </Button>

            {isHost && (
              <Button
                variant="primary"
                size="lg"
                icon={Play}
                disabled={!allReady}
                onClick={handleStartGame}
                className="uppercase tracking-wider text-xs font-semibold px-8 shadow-sm"
              >
                {!allReady ? 'Waiting for both players to be Ready' : 'Start Match Now →'}
              </Button>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
