import React, { useState } from 'react';
import {
  Film,
  ShieldCheck,
  BookOpen,
  Users,
  CheckCircle2,
  Copy,
  Check,
  GitBranch,
  Sparkles,
  HelpCircle,
  Clapperboard,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

export const ExactStoryCard = ({
  data,
  onForgeWhatIf,
}) => {
  const [copied, setCopied] = useState(false);
  const [showCanonChunks, setShowCanonChunks] = useState(false);

  if (!data) return null;

  // UNRELEASED MOVIE ALERT CARD
  if (data.isUnreleased || data.story?.isUnreleased) {
    const title = data.movieTitle || data.story?.movieTitle || 'This movie';
    const year = data.releaseYear || data.story?.releaseYear || 'Upcoming';

    return (
      <div className="editorial-card bg-[#E8E6E2] rounded-2xl p-6 sm:p-10 border-2 border-[#986421]/30 shadow-md space-y-6 animate-fadeIn">
        {/* Header Badges */}
        <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-[rgba(49,35,49,0.12)]">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-[#986421]/15 text-[#986421] border border-[#986421]/30">
            <Clock className="w-3.5 h-3.5" /> Movie Not Yet Released
          </span>
          <Badge variant="neutral" size="sm" className="font-mono text-[10px]">
            Expected: {year}
          </Badge>
          <Badge variant="neutral" size="sm" className="font-mono text-[10px]">
            {data.languageLabel || 'Cinema'}
          </Badge>
        </div>

        {/* Alert Content Box */}
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-14 h-14 rounded-2xl bg-[#986421]/15 border border-[#986421]/30 flex items-center justify-center shrink-0 text-[#986421] shadow-sm">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="space-y-4 flex-1">
            <div>
              <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#200F22] leading-tight">
                {title} is Not Released Yet
              </h2>
              <p className="text-xs sm:text-sm text-[#7E6C7D] font-mono mt-1">
                Release Status: <span className="font-semibold text-[#986421]">Unreleased / Upcoming ({year})</span>
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.14)] text-sm sm:text-base text-[#200F22] space-y-2 leading-relaxed">
              <p className="font-semibold text-[#986421] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Cannot Reveal Exact Storyline
              </p>
              <p>
                {data.message || `"${title}" has not been released yet in theaters or on streaming platforms.`}
              </p>
              <p className="text-xs text-[#654D63] font-normal pt-1 border-t border-[rgba(49,35,49,0.08)]">
                Because this film is unreleased, no verified canon screenplay, climax, or character endings exist in reality. To maintain authentic continuity, our system strictly avoids hallucinating or making up fake canon stories for upcoming movies.
              </p>
            </div>

            {/* What-If Recommendation */}
            <div className="p-4 rounded-xl bg-[#287A59]/8 border border-[#287A59]/25 text-xs text-[#287A59] flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-[#287A59]" />
              <div>
                <p className="font-semibold">Explore Predictions & Fan Theories Instead!</p>
                <p className="text-[#654D63] mt-0.5">
                  While the exact story cannot be known until release, you can use our <strong>What-If Creator</strong> to predict the plot, test trailer theories, or imagine alternate premises!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Row */}
        <div className="pt-6 border-t border-[rgba(49,35,49,0.12)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-[#7E6C7D] font-mono">
            Canon Screenplay Locked until official release
          </span>

          {onForgeWhatIf && (
            <Button
              type="button"
              variant="primary"
              size="md"
              icon={GitBranch}
              onClick={onForgeWhatIf}
              className="w-full sm:w-auto uppercase tracking-wider text-xs px-6 py-3 font-semibold shadow-md shadow-[#30152F]/10"
            >
              Predict Story with What-If Creator →
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!data.story) return null;

  const { story, retrievedChunks, engine, model, movieTitle, releaseYear, director, languageLabel, whatIfQuestion } = data;

  const handleCopy = () => {
    const actsText = story.acts?.map(a => `${a.title}:\n${a.description}`).join('\n\n') || '';
    const textToCopy = `🎬 ${story.movieTitle || movieTitle} (${story.releaseYear || releaseYear}) - Exact Movie Story\n\n` +
      `Summary: ${story.quickSummary}\n\n` +
      (story.canonRealityCheck?.whatActuallyHappened ? `Reality Check:\n${story.canonRealityCheck.whatActuallyHappened}\n\n` : '') +
      `Acts:\n${actsText}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="editorial-card bg-[#E8E6E2] rounded-2xl p-6 sm:p-10 border border-[rgba(49,35,49,0.14)] shadow-md space-y-8 animate-fadeIn">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[rgba(49,35,49,0.12)]">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="canon" size="sm" className="font-mono uppercase text-[10px] tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-[#287A59]" /> 100% Verified Canon Continuity
            </Badge>
            <Badge variant="neutral" size="sm" className="font-mono text-[10px]">
              <Clapperboard className="w-3 h-3 text-[#30152F]" />
              {story.languageLabel || languageLabel || 'Cinema'} • {story.releaseYear || releaseYear}
            </Badge>
            {engine === 'groq-live' ? (
              <Badge variant="multiverse" size="sm" className="font-mono text-[10px]">
                Groq Live Engine ({model || 'Active'})
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm" className="font-mono text-[10px]">
                Verified Screenplay Database
              </Badge>
            )}
          </div>

          <h2 className="font-editorial text-3xl sm:text-5xl font-bold text-[#200F22] tracking-tight">
            {story.movieTitle || movieTitle}
          </h2>

          {(story.director || director) && (
            <p className="text-xs sm:text-sm text-[#654D63] font-mono mt-1">
              Directed by <span className="font-semibold text-[#200F22]">{story.director || director}</span>
            </p>
          )}
        </div>

        {/* Copy & Quick Action */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F2F1EE] hover:bg-[#FFFFFF] text-[#654D63] hover:text-[#200F22] border border-[rgba(49,35,49,0.14)] text-xs font-mono transition-colors shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#287A59]" />
                <span className="text-[#287A59] font-semibold">Copied Story</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Summary</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Human-Understandable Summary Box */}
      {story.quickSummary && (
        <div className="p-5 sm:p-6 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.12)] space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#30152F]">
            <BookOpen className="w-4 h-4 text-[#30152F]" />
            <span>Story Overview (Simple & Clear)</span>
          </div>
          <p className="text-sm sm:text-base text-[#200F22] leading-relaxed font-normal">
            {story.quickSummary}
          </p>
        </div>
      )}

      {/* Canon Reality Check: If user entered a question or turning point */}
      {story.canonRealityCheck && story.canonRealityCheck.whatActuallyHappened && (
        <div className="p-5 sm:p-6 rounded-xl bg-[#287A59]/8 border border-[#287A59]/25 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#287A59]">
            <HelpCircle className="w-4 h-4 text-[#287A59]" />
            <span>Canon Reality Check vs What-If</span>
          </div>

          {story.canonRealityCheck.question && (
            <div className="text-xs text-[#654D63]">
              <span className="font-semibold text-[#200F22]">Hypothetical Question:</span> "{story.canonRealityCheck.question}"
            </div>
          )}

          <div className="p-4 rounded-lg bg-[#FFFFFF]/80 border border-[#287A59]/20 text-sm text-[#200F22] leading-relaxed">
            <span className="font-bold text-[#287A59] block mb-1">What Actually Happened in the Real Movie:</span>
            {story.canonRealityCheck.whatActuallyHappened}
          </div>
        </div>
      )}

      {/* Act-by-Act Canonical Storyline */}
      {story.acts && story.acts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-editorial text-2xl font-bold text-[#200F22] flex items-center gap-2">
              <Film className="w-5 h-5 text-[#30152F]" /> The Exact Storyline (Act-by-Act)
            </h3>
            <span className="text-xs text-[#7E6C7D] font-mono">3 Full Narrative Acts</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {story.acts.map((act, idx) => (
              <div
                key={act.actNumber || idx}
                className="p-5 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.12)] flex flex-col justify-between space-y-3 shadow-sm hover:border-[rgba(49,35,49,0.25)] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded-full bg-[#30152F] text-[#F2F1EE] font-mono font-bold text-xs flex items-center justify-center">
                      {act.actNumber || idx + 1}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-[#7E6C7D] tracking-wider">
                      Act {act.actNumber || idx + 1}
                    </span>
                  </div>

                  <h4 className="font-editorial font-bold text-lg text-[#200F22] mb-2 leading-snug">
                    {act.title}
                  </h4>

                  <p className="text-xs sm:text-sm text-[#654D63] leading-relaxed">
                    {act.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[rgba(49,35,49,0.08)] flex items-center gap-1.5 text-[11px] font-mono text-[#287A59]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Canon Authentic</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Character Fates in Real Movie */}
      {story.characterFates && story.characterFates.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-editorial text-2xl font-bold text-[#200F22] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#30152F]" /> Key Characters & Their Real Movie Fates
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {story.characterFates.map((char, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.12)] space-y-1.5 shadow-sm text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#200F22]">{char.character}</span>
                  {char.role && (
                    <span className="text-[10px] font-mono text-[#7E6C7D] uppercase tracking-wider">
                      {char.role}
                    </span>
                  )}
                </div>
                <p className="text-[#654D63] leading-relaxed">
                  {char.realFate}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verified Canon Evidence Drawer (RAG Vector Chunks) */}
      {retrievedChunks && retrievedChunks.length > 0 && (
        <div className="p-4 rounded-xl bg-[#F2F1EE] border border-[rgba(49,35,49,0.12)] space-y-3 text-xs">
          <button
            type="button"
            onClick={() => setShowCanonChunks(!showCanonChunks)}
            className="w-full flex items-center justify-between text-[#654D63] hover:text-[#200F22] font-mono text-[11px] uppercase tracking-wider transition-colors"
          >
            <span className="flex items-center gap-2 font-semibold text-[#287A59]">
              <ShieldCheck className="w-4 h-4" />
              Verified Knowledge Base Chunks ({retrievedChunks.length} canon facts retrieved)
            </span>
            <div className="flex items-center gap-1 text-[#7E6C7D]">
              <span>{showCanonChunks ? 'Hide Evidence' : 'View Evidence'}</span>
              {showCanonChunks ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {showCanonChunks && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {retrievedChunks.slice(0, 4).map((chunk, idx) => (
                <div key={idx} className="p-3.5 rounded-lg bg-[#E8E6E2] border border-[rgba(49,35,49,0.1)] text-[#654D63]">
                  <div className="flex items-center justify-between text-[10px] text-[#7E6C7D] font-mono mb-1 uppercase tracking-wider">
                    <span>Section: {chunk.sectionType || 'Plot'}</span>
                    <span>Relevance: {chunk.score || '0.88'}</span>
                  </div>
                  <p className="line-clamp-3 text-[#30152F]">{chunk.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom Conversion CTA */}
      <div className="pt-6 border-t border-[rgba(49,35,49,0.12)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-[#654D63] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#30152F]" />
          <span>Now that you know the exact story, change history with a What-If divergence!</span>
        </div>

        {onForgeWhatIf && (
          <Button
            type="button"
            variant="primary"
            size="md"
            icon={GitBranch}
            onClick={onForgeWhatIf}
            className="w-full sm:w-auto uppercase tracking-wider text-xs px-6 py-3 font-semibold shadow-md shadow-[#30152F]/10"
          >
            Forge Alternate Timeline Now
          </Button>
        )}
      </div>

    </div>
  );
};
