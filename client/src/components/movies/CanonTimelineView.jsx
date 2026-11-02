import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GitBranch, Sparkles, CheckCircle2 } from 'lucide-react';
import { Badge } from '../common/Badge';

export const CanonTimelineView = ({ events = [], movieId, movieTitle }) => {
  const navigate = useNavigate();

  if (!events || events.length === 0) {
    return (
      <div className="p-8 text-center bg-[#E8E6E2] rounded-2xl border border-[rgba(49,35,49,0.12)] text-[#654D63]">
        No canon timeline events indexed yet for this movie.
      </div>
    );
  }

  const sortedEvents = [...events].sort((a, b) => a.order - b.order);

  const handleLaunchWhatIf = (event) => {
    const defaultQuestion = event.suggestedWhatIf || `What if ${event.title.toLowerCase()} happened differently?`;
    navigate(`/creator?movieId=${movieId}&eventId=${event.eventId}&prompt=${encodeURIComponent(defaultQuestion)}`);
  };

  return (
    <div className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-[2px] before:bg-gradient-to-b before:from-[#30152F]/40 before:via-[rgba(49,35,49,0.2)] before:to-transparent">
      {sortedEvents.map((evt) => (
        <div key={evt.eventId} className="relative group">
          
          {/* Timeline node dot */}
          <div className="absolute -left-[30px] top-1.5 w-5 h-5 rounded-full bg-[#F2F1EE] border-2 border-[#30152F] flex items-center justify-center group-hover:scale-125 transition-transform">
            <div className="w-1.5 h-1.5 rounded-full bg-[#30152F]" />
          </div>

          {/* Event Content Card */}
          <div className="editorial-card bg-[#E8E6E2] p-6 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition-shadow">
            
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#30152F] bg-[#F2F1EE] px-2.5 py-0.5 rounded-md border border-[rgba(49,35,49,0.12)] font-semibold">
                  ACT {evt.order}
                </span>
                <h4 className="font-editorial font-bold text-xl text-[#200F22]">
                  {evt.title}
                </h4>
              </div>

              <Badge variant="canon" size="sm">
                <CheckCircle2 className="w-3 h-3" />
                {evt.significance || 'Canon Event'}
              </Badge>
            </div>

            <p className="text-sm text-[#654D63] leading-relaxed">
              {evt.description}
            </p>

            {/* Characters Involved */}
            {evt.charactersInvolved && evt.charactersInvolved.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs text-[#654D63]">
                <span className="text-[#7E6C7D] font-mono uppercase tracking-wider text-[10px]">Involved:</span>
                {evt.charactersInvolved.map((char) => (
                  <span key={char} className="px-2 py-0.5 rounded-md bg-[#F2F1EE] border border-[rgba(49,35,49,0.12)] text-[#30152F] font-medium text-xs">
                    {char}
                  </span>
                ))}
              </div>
            )}

            {/* What If Trigger Action */}
            {evt.canBeWhatIfTrigger && (
              <div className="pt-3 border-t border-[rgba(49,35,49,0.12)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-[#986421] italic flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#986421] shrink-0" />
                  <span>Divergence Opportunity: "{evt.suggestedWhatIf || `Change this event...`}"</span>
                </div>

                <button
                  onClick={() => handleLaunchWhatIf(evt)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#30152F] hover:bg-[#200F22] text-[#F2F1EE] font-semibold text-xs tracking-wider uppercase transition-transform active:scale-95 shadow-sm"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  What If?
                </button>
              </div>
            )}

          </div>
        </div>
      ))}
    </div>
  );
};
