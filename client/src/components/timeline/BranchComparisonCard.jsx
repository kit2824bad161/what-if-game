import React from 'react';
import { Check, AlertTriangle, ShieldCheck, Zap, UserCheck, Flame, GitBranch } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

export const BranchComparisonCard = ({
  branch,
  isSelected,
  onSelect,
  onContinue,
  isGenerating = false,
}) => {
  const isAlpha = branch.branchId?.includes('alpha') || false;

  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl p-5 sm:p-7 transition-all duration-300 border min-w-0 ${
        isSelected
          ? 'bg-[#E8E6E2] border-[#30152F] shadow-xl ring-2 ring-[#30152F]/20'
          : 'bg-[#E8E6E2] border-[rgba(49,35,49,0.12)] hover:border-[rgba(49,35,49,0.28)] shadow-sm'
      }`}
    >
      {/* Header Tag */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge variant={isAlpha ? 'multiverse' : 'hypothetical'} size="md">
            <GitBranch className="w-3.5 h-3.5" />
            {isAlpha ? 'Timeline Branch Alpha' : 'Timeline Branch Beta'}
          </Badge>

          {isSelected && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#287A59] bg-[#287A59]/10 border border-[#287A59]/25 px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider">
              <Check className="w-3.5 h-3.5" /> Selected Branch
            </span>
          )}
        </div>

        {/* Branch Title */}
        <h3 className="font-editorial font-bold text-2xl text-[#200F22] mb-3 leading-tight">
          {branch.title}
        </h3>

        {/* Story Narrative Summary */}
        <p className="text-sm text-[#30152F] leading-relaxed mb-6 bg-[#F2F1EE] p-5 rounded-xl border border-[rgba(49,35,49,0.12)]">
          {branch.summary}
        </p>

        {/* Section 1: Immediate Consequences */}
        <div className="space-y-4 mb-6">
          <div>
            <h4 className="text-[11px] font-bold font-mono uppercase tracking-[0.2em] text-[#986421] flex items-center gap-1.5 mb-2">
              <Zap className="w-3.5 h-3.5 text-[#986421]" />
              Immediate Consequences
            </h4>
            <ul className="space-y-1.5 text-xs text-[#654D63]">
              {branch.immediateConsequences?.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#986421] font-bold shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 2: Character Shifts */}
          {branch.characterConsequences && branch.characterConsequences.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold font-mono uppercase tracking-[0.2em] text-[#3C6E9E] flex items-center gap-1.5 mb-2">
                <UserCheck className="w-3.5 h-3.5 text-[#3C6E9E]" />
                Character Fate Shifts
              </h4>
              <div className="space-y-2">
                {branch.characterConsequences.map((c, idx) => (
                  <div key={idx} className="text-xs bg-[#F2F1EE] p-3 rounded-xl border border-[rgba(49,35,49,0.12)]">
                    <span className="font-semibold text-[#200F22]">{c.character}:</span>{' '}
                    <span className="text-[#654D63]">{c.change}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Plot Fallout */}
          {branch.plotConsequences && branch.plotConsequences.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold font-mono uppercase tracking-[0.2em] text-[#A83842] flex items-center gap-1.5 mb-2">
                <Flame className="w-3.5 h-3.5 text-[#A83842]" />
                Major Plot Fallout
              </h4>
              <ul className="space-y-1.5 text-xs text-[#654D63]">
                {branch.plotConsequences.map((plot, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#A83842] font-bold shrink-0">→</span>
                    <span>{plot}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Canon Facts Grounding Box */}
        {branch.canonFactsUsed && branch.canonFactsUsed.length > 0 && (
          <div className="p-3.5 rounded-xl bg-[#287A59]/8 border border-[#287A59]/20 mb-4 text-xs">
            <div className="flex items-center gap-1.5 font-mono text-[#287A59] font-semibold mb-1 text-[11px] uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              Retrieved Canon Anchors
            </div>
            <ul className="space-y-1 text-[#654D63] text-[11px]">
              {branch.canonFactsUsed.map((fact, idx) => (
                <li key={idx} className="line-clamp-2">
                  ✓ {fact}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Continuity Warnings if detected */}
        {branch.continuityWarnings && branch.continuityWarnings.length > 0 && (
          <div className="p-3.5 rounded-xl bg-[#A83842]/8 border border-[#A83842]/20 mb-4 text-xs">
            <div className="flex items-center gap-1.5 font-mono text-[#A83842] font-semibold mb-1 text-[11px] uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Continuity Observation
            </div>
            <ul className="space-y-1 text-[#A83842] text-[11px]">
              {branch.continuityWarnings.map((w, idx) => (
                <li key={idx}>
                  {typeof w === 'string' ? w : w.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-[rgba(49,35,49,0.12)] mt-4 flex items-center gap-3">
        {!isSelected ? (
          <Button
            variant="outline"
            size="md"
            className="w-full uppercase tracking-wider text-xs font-semibold py-3"
            onClick={onSelect}
          >
            Select This Timeline
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            className="w-full uppercase tracking-wider text-xs font-semibold py-3 shadow-md"
            onClick={onContinue}
          >
            Continue This Alternate Universe →
          </Button>
        )}
      </div>
    </div>
  );
};
