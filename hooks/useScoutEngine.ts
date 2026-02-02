
import { useState, useCallback } from 'react';
import { 
  Player, 
  BootstrapData, 
  SquadSlot,
  ScoutMode,
  TransferPack,
  ElementType
} from '../types';

// Helper for combinations (Pure function)
function getCombinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length === 0) return [];
  const [first, ...rest] = arr;
  const withFirst = getCombinations(rest, k - 1).map(c => [first, ...c]);
  const withoutFirst = getCombinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

export const useScoutEngine = (
  data: BootstrapData | null, 
  squad: SquadSlot[], 
  bank: number,
  teamCounts: Record<number, number>,
  existingPlayerIds: Set<number>
) => {
  const [scoutMode, setScoutMode] = useState<ScoutMode>(1);
  const [scoutResults, setScoutResults] = useState<TransferPack[]>([]);
  const [viewResultIndex, setViewResultIndex] = useState<number>(0);
  const [isScouting, setIsScouting] = useState(false);

  const runScout = useCallback(async () => {
    if (!data) return;
    setIsScouting(true);
    setScoutResults([]);
    setViewResultIndex(0);

    await new Promise(resolve => setTimeout(resolve, 50)); // Yield to UI

    const filledSlots = squad.filter(s => s.player !== null);
    const availablePlayers = data.elements.filter(p => p.status === 'a');

    // --- WILDCARD MODE ---
    if (scoutMode === 'wildcard') {
      const totalSellValue = filledSlots.reduce((sum, s) => sum + (s.player?.now_cost || 0), 0);
      const totalBudget = bank + totalSellValue;
      
      const sortedPool = [...availablePlayers].sort((a,b) => parseFloat(b.ep_next) - parseFloat(a.ep_next));
      const newSquad: Player[] = [];
      let currentCost = 0;
      let counts = { [ElementType.GK]: 0, [ElementType.DEF]: 0, [ElementType.MID]: 0, [ElementType.FWD]: 0 };
      let tCounts: Record<number, number> = {};

      const limits = { [ElementType.GK]: 2, [ElementType.DEF]: 5, [ElementType.MID]: 5, [ElementType.FWD]: 3 };

      // Greedy fill
      for (const p of sortedPool) {
        if (newSquad.length === 15) break;
        if (counts[p.element_type] < limits[p.element_type] && (tCounts[p.team] || 0) < 3) {
          newSquad.push(p);
          currentCost += p.now_cost;
          counts[p.element_type]++;
          tCounts[p.team] = (tCounts[p.team] || 0) + 1;
        }
      }

      // Budget Adjustment
      while (currentCost > totalBudget) {
        newSquad.sort((a,b) => parseFloat(a.ep_next) - parseFloat(b.ep_next));
        let swapped = false;
        for (let i = 0; i < newSquad.length; i++) {
          const pOut = newSquad[i];
          const cheapest = availablePlayers
            .filter(p => 
              p.element_type === pOut.element_type && 
              p.now_cost < pOut.now_cost &&
              !newSquad.find(s => s.id === p.id)
            )
            .sort((a,b) => a.now_cost - b.now_cost)[0];

          if (cheapest) {
            if ((tCounts[cheapest.team] || 0) < 3 || cheapest.team === pOut.team) {
              tCounts[pOut.team]--;
              tCounts[cheapest.team] = (tCounts[cheapest.team] || 0) + 1;
              currentCost = currentCost - pOut.now_cost + cheapest.now_cost;
              newSquad[i] = cheapest;
              swapped = true;
              break;
            }
          }
        }
        if (!swapped) break;
      }

      const totalNewEP = newSquad.reduce((sum, p) => sum + parseFloat(p.ep_next), 0);
      const totalOldEP = filledSlots.reduce((sum, s) => sum + parseFloat(s.player!.ep_next), 0);
      
      setScoutResults([{
        out: filledSlots,
        in: newSquad,
        gain: totalNewEP - totalOldEP,
        costDiff: currentCost - totalSellValue,
        isWildcard: true,
        transferCount: 15
      }]);
      setIsScouting(false);
      return;
    }

    // --- INCREMENTAL TRANSFER MODE (The Curve) ---
    const maxTransfers = scoutMode as number;
    const curveResults: TransferPack[] = [];
    let prevBestEP = 0;

    const pruneSearch = maxTransfers > 2;
    let slotsToConsider = filledSlots;
    
    if (pruneSearch) {
        slotsToConsider = [...filledSlots]
          .sort((a,b) => parseFloat(a.player!.ep_next) - parseFloat(b.player!.ep_next))
          .slice(0, 5); // Bottom 5
    }

    const candidateLimit = 15;
    const candidatesByPos: Record<number, Player[]> = {
      1: availablePlayers.filter(p => p.element_type === 1).sort((a,b) => parseFloat(b.ep_next) - parseFloat(a.ep_next)).slice(0, candidateLimit),
      2: availablePlayers.filter(p => p.element_type === 2).sort((a,b) => parseFloat(b.ep_next) - parseFloat(a.ep_next)).slice(0, candidateLimit),
      3: availablePlayers.filter(p => p.element_type === 3).sort((a,b) => parseFloat(b.ep_next) - parseFloat(a.ep_next)).slice(0, candidateLimit),
      4: availablePlayers.filter(p => p.element_type === 4).sort((a,b) => parseFloat(b.ep_next) - parseFloat(a.ep_next)).slice(0, candidateLimit),
    };

    // --- LOOP: 1 to MaxTransfers ---
    for (let depth = 1; depth <= maxTransfers; depth++) {
      
      const outCombinations = getCombinations(slotsToConsider, depth);
      let bestForDepth: TransferPack | null = null;
      let bestEPForDepth = -Infinity;

      for (const outSet of outCombinations) {
        const outCost = outSet.reduce((sum, s) => sum + (s.player?.now_cost || 0), 0);
        const budget = bank + outCost;
        const currentOutEP = outSet.reduce((sum, s) => sum + parseFloat(s.player?.ep_next || "0"), 0);
        const positionsNeeded = outSet.map(s => s.type);
        const outIds = new Set(outSet.map(s => s.player!.id));

        const currentTeamCounts = { ...teamCounts };
        outSet.forEach(s => {
          if (s.player) currentTeamCounts[s.player.team] = (currentTeamCounts[s.player.team] || 0) - 1;
        });

        const findInPlayers = (
          idx: number, 
          currentBudget: number, 
          chosen: Player[], 
          chosenIds: Set<number>,
          currentCounts: Record<number, number>
        ): { players: Player[], totalEP: number } | null => {
          if (idx === positionsNeeded.length) {
            return { 
              players: chosen, 
              totalEP: chosen.reduce((sum, p) => sum + parseFloat(p.ep_next), 0) 
            };
          }

          const typeNeeded = positionsNeeded[idx];
          const candidates = candidatesByPos[typeNeeded];
          let bestLocal: { players: Player[], totalEP: number } | null = null;

          for (const p of candidates) {
            if (p.now_cost > currentBudget) continue;
            if (chosenIds.has(p.id)) continue;
            if (existingPlayerIds.has(p.id) && !outIds.has(p.id)) continue;
            if ((currentCounts[p.team] || 0) >= 3) continue;

            currentCounts[p.team] = (currentCounts[p.team] || 0) + 1;
            
            const result = findInPlayers(
              idx + 1, 
              currentBudget - p.now_cost, 
              [...chosen, p], 
              new Set([...chosenIds, p.id]),
              currentCounts
            );

            currentCounts[p.team]--;

            if (result) {
              if (!bestLocal || result.totalEP > bestLocal.totalEP) {
                bestLocal = result;
              }
            }
          }
          return bestLocal;
        };

        const bestInSet = findInPlayers(0, budget, [], new Set(), { ...currentTeamCounts });

        if (bestInSet) {
          const gain = bestInSet.totalEP - currentOutEP;
          if (gain > bestEPForDepth) {
            const inCost = bestInSet.players.reduce((sum, p) => sum + p.now_cost, 0);
            bestEPForDepth = gain;
            bestForDepth = {
              out: outSet,
              in: bestInSet.players,
              gain: gain,
              costDiff: inCost - outCost,
              transferCount: depth
            };
          }
        }
      }

      if (bestForDepth && bestForDepth.gain > prevBestEP) {
        curveResults.push(bestForDepth);
        prevBestEP = bestForDepth.gain;
      } else {
        break; 
      }
      
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    setScoutResults(curveResults);
    
    let recommendedIdx = 0;
    for(let i=1; i<curveResults.length; i++) {
        const marginalGain = curveResults[i].gain - curveResults[i-1].gain;
        if (marginalGain > 0.5) {
            recommendedIdx = i;
        } else {
            break;
        }
    }
    setViewResultIndex(recommendedIdx);
    
    setIsScouting(false);

  }, [data, squad, bank, teamCounts, existingPlayerIds, scoutMode]);

  return {
    scoutMode,
    scoutResults,
    viewResultIndex,
    isScouting,
    setScoutMode,
    setViewResultIndex,
    runScout,
    setScoutResults
  };
};
