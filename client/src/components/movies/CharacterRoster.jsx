import React from 'react';
import { User, Users } from 'lucide-react';
import { Badge } from '../common/Badge';

export const CharacterRoster = ({ characters = [] }) => {
  if (!characters || characters.length === 0) {
    return (
      <div className="p-8 text-center bg-[#E8E6E2] rounded-2xl border border-[rgba(49,35,49,0.12)] text-[#654D63]">
        No character dossiers indexed yet for this movie.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {characters.map((char) => (
        <div
          key={char.name}
          className="editorial-card bg-[#E8E6E2] p-6 rounded-2xl space-y-4 flex flex-col justify-between shadow-sm"
        >
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h4 className="font-editorial font-bold text-xl text-[#200F22] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#30152F]" />
                  {char.name}
                </h4>
                {char.actor && (
                  <p className="text-xs text-[#7E6C7D] pl-6">
                    Portrayed by <span className="text-[#30152F] font-semibold">{char.actor}</span>
                  </p>
                )}
              </div>
              <Badge variant="neutral" size="sm">
                {char.role || 'Key Figure'}
              </Badge>
            </div>

            <p className="text-xs text-[#654D63] leading-relaxed mt-2.5">
              {char.summary}
            </p>
          </div>

          <div className="pt-3 border-t border-[rgba(49,35,49,0.12)] space-y-2">
            {/* Traits */}
            {char.traits && char.traits.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                <span className="text-[#7E6C7D] font-mono uppercase text-[10px] tracking-wider">Traits:</span>
                {char.traits.map((trait) => (
                  <span key={trait} className="px-2 py-0.5 rounded-md bg-[#F2F1EE] text-[#30152F] border border-[rgba(49,35,49,0.12)] font-medium">
                    {trait}
                  </span>
                ))}
              </div>
            )}

            {/* Relationships */}
            {char.relationships && char.relationships.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs text-[#654D63]">
                <Users className="w-3.5 h-3.5 text-[#7E6C7D] shrink-0" />
                <span className="text-[#7E6C7D] font-mono uppercase text-[10px] tracking-wider">Dynamics:</span>
                <span>{char.relationships.join(' • ')}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
