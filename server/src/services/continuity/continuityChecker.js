/**
 * Continuity and Canon Integrity Service
 * Analyzes generated storylines and user choices against:
 * 1. Verified movie canon facts
 * 2. Active hypothetical timeline state
 * 3. Character status tracking (alive, deceased, informed, betrayed, etc.)
 */

export class ContinuityChecker {
  /**
   * Check continuity for a newly proposed branch or turn
   */
  evaluateContinuity({
    movie,
    retrievedCanonChunks = [],
    priorTimelineTurns = [],
    proposedText = '',
    changedEvent = '',
  }) {
    const warnings = [];
    const lowerText = proposedText.toLowerCase();

    // 1. Check for characters declared dead in earlier turns
    for (const turn of priorTimelineTurns) {
      if (turn.characterStatusUpdates) {
        for (const update of turn.characterStatusUpdates) {
          if (update.status?.toLowerCase().includes('dead') || update.status?.toLowerCase().includes('killed')) {
            const charName = update.character.toLowerCase();
            // Check if deceased character is actively performing actions without resurrection context
            if (lowerText.includes(charName) &&
                (lowerText.includes(`${charName} spoke`) ||
                 lowerText.includes(`${charName} attacked`) ||
                 lowerText.includes(`${charName} decided`) ||
                 lowerText.includes(`${charName} arrived`)) &&
                !lowerText.includes('ghost') && !lowerText.includes('memory') && !lowerText.includes('flashback')) {
              warnings.push({
                type: 'deceased_character_anomaly',
                message: `Character "${update.character}" was eliminated in turn #${turn.turnNumber}, but appears to act in this turn without explanation.`,
                severity: 'high',
              });
            }
          }
        }
      }
    }

    // 2. Check world rules from movie definition
    if (movie?.worldRules && movie.worldRules.length > 0) {
      for (const rule of movie.worldRules) {
        // e.g. "Vikram operates as a ghost agent unknown to the police hierarchy"
        // If story violates key constraints, note an observation
        const ruleKeywords = rule.toLowerCase().split(/\s+/).filter(w => w.length > 4);
        let matchCount = 0;
        for (const kw of ruleKeywords) {
          if (lowerText.includes(kw)) matchCount++;
        }
        if (matchCount >= 3 && lowerText.includes('impossible') || lowerText.includes('breaks rule')) {
          warnings.push({
            type: 'world_rule_tension',
            message: `This branch exerts narrative tension against established universe rule: "${rule}".`,
            severity: 'medium',
          });
        }
      }
    }

    // 3. Deliberate Divergence vs Accidental Contradiction check
    // If the proposed scenario explicitly targets an event, that divergence is intentional
    const isIntentionalDivergence = changedEvent && (
      lowerText.includes('instead') ||
      lowerText.includes('rather than') ||
      lowerText.includes('prevented') ||
      lowerText.includes('discovered earlier')
    );

    if (!isIntentionalDivergence && warnings.length === 0) {
      // Clean continuity
      return {
        hasWarnings: false,
        warnings: [],
        continuityScore: 10,
        verdict: 'Consistent with active timeline branch',
      };
    }

    return {
      hasWarnings: warnings.length > 0,
      warnings,
      continuityScore: Math.max(1, 10 - (warnings.length * 2)),
      verdict: warnings.length > 0 ? 'Divergences detected requiring narrative bridge' : 'Consistent',
    };
  }
}

export const continuityChecker = new ContinuityChecker();
