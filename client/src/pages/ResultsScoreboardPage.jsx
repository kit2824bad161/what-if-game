import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Trophy, Share2, Check, Sparkles, Scale } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const ResultsScoreboardPage = () => {
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get('roomCode') || 'MATCH1';
  const [copied, setCopied] = useState(false);

  const mockScores = [
    { name: 'Player 1 (Host)', score: 86, isWinner: true },
    { name: 'Player 2 (Challenger)', score: 78, isWinner: false },
  ];

  const handleShare = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    const text = `🏆 WHAT IF Movie Game Result (Room ${roomCode}):\nWinner: ${mockScores[0].name} with ${mockScores[0].score} pts!\nRewrite the story at ${origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full page-container-compact py-12 text-center space-y-6">
      
      {/* Trophy Icon */}
      <div className="w-16 h-16 rounded-2xl bg-[#E8E6E2] border border-[rgba(49,35,49,0.15)] text-[#30152F] flex items-center justify-center mx-auto shadow-sm">
        <Trophy className="w-8 h-8 text-[#30152F]" />
      </div>

      <div className="space-y-2">
        <Badge variant="multiverse" size="md">
          Match Final Scoreboard
        </Badge>
        <h1 className="font-editorial text-4xl sm:text-6xl font-bold text-[#200F22] tracking-tight">
          {mockScores[0].name} Takes the Crown!
        </h1>
        <p className="text-xs text-[#7E6C7D] font-mono">Room Session: {roomCode}</p>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
        {mockScores.map((p, i) => (
          <div
            key={i}
            className={`p-6 rounded-2xl border transition-all ${
              p.isWinner
                ? 'editorial-card bg-[#E8E6E2] border-[#30152F] shadow-lg ring-1 ring-[#30152F]/20'
                : 'editorial-card bg-[#E8E6E2] border-[rgba(49,35,49,0.12)] shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-sm text-[#200F22]">{p.name}</span>
              {p.isWinner && <Badge variant="canon" size="sm">Champion</Badge>}
            </div>
            <div className="font-editorial text-4xl sm:text-5xl font-bold text-[#200F22]">
              {p.score} <span className="text-xs text-[#7E6C7D] font-sans font-normal">pts</span>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
        <Button
          variant="primary"
          size="md"
          icon={copied ? Check : Share2}
          onClick={handleShare}
        >
          {copied ? 'Summary Copied to Clipboard!' : 'Share Match Results'}
        </Button>
        <Link to="/lobby">
          <Button variant="secondary" size="md">
            Return to Multiplayer Lobby
          </Button>
        </Link>
        <Link to="/creator">
          <Button variant="outline" size="md">
            Solo Timeline Simulator
          </Button>
        </Link>
      </div>

    </div>
  );
};

export default ResultsScoreboardPage;
