
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  ElementType, 
  Player, 
  Team, 
  BootstrapData, 
  SquadSlot,
  SquadState,
  Fixture
} from './types';
import { fetchBootstrapData, fetchFixtures } from './services/api';
import { 
  INITIAL_BANK, 
  INITIAL_SQUAD_STRUCTURE, 
  MAX_TEAM_PLAYERS,
  POSITION_LABELS 
} from './constants';
import { 
  Layout, 
  Trophy, 
  Wallet, 
  Zap, 
  ChevronRight, 
  AlertCircle,
  RefreshCw,
  Globe,
  Database,
  ArrowLeftRight,
  Sparkles,
  Save,
  BrainCircuit,
  TrendingUp,
  ArrowRight,
  Wifi,
  WifiOff,
  Loader2,
  Cpu,
  ShieldCheck,
  ZapOff,
  Layers,
  Activity,
  CheckCircle2,
  Sliders,
  Wand2,
  Trash2,
  BarChart3,
  Edit2,
  Info,
  Target,
  AlertTriangle,
  Table2
} from 'lucide-react';
import PlayerSlot from './components/PlayerSlot';
import TransferModal from './components/TransferModal';
import PlayerInfoModal from './components/PlayerInfoModal';
import StatsHub from './components/StatsHub';

type Tab = 'squad' | 'ai-transfers' | 'stats' | 'analytics' | 'about';
type ScoutMode = number | 'wildcard'; // 1-5 or 'wildcard'

interface TransferPack {
  out: SquadSlot[];
  in: Player[];
  gain: number;
  costDiff: number;
  isWildcard?: boolean;
  transferCount: number;
}

// Helper for combinations
function getCombinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length === 0) return [];
  const [first, ...rest] = arr;
  const withFirst = getCombinations(rest, k - 1).map(c => [first, ...c]);
  const withoutFirst = getCombinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

const App: React.FC = () => {
  const [data, setData] = useState<BootstrapData | null>(null);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [bootStep, setBootStep] = useState(0);
  
  const [squad, setSquad] = useState<SquadSlot[]>(() => {
    const saved = localStorage.getItem('architect_squad');
    return saved ? JSON.parse(saved) : INITIAL_SQUAD_STRUCTURE;
  });
  const [bank, setBank] = useState(() => {
    const saved = localStorage.getItem('architect_bank');
    return saved ? parseInt(saved) : INITIAL_BANK;
  });
  const [activeTab, setActiveTab] = useState<Tab>('squad');
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [transferSlotId, setTransferSlotId] = useState<string | null>(null);
  const [viewingPlayerId, setViewingPlayerId] = useState<number | null>(null);

  // Scout State
  const [scoutMode, setScoutMode] = useState<ScoutMode>(1);
  const [scoutResults, setScoutResults] = useState<TransferPack[]>([]);
  const [viewResultIndex, setViewResultIndex] = useState<number>(0);
  const [isScouting, setIsScouting] = useState(false);

  // Bank Edit State
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const bankInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async (isInitial = false) => {
    setLoading(true);
    
    // Parallel Fetching using Promise.all
    const [bootstrapResult, fixturesResult] = await Promise.all([
      fetchBootstrapData(),
      fetchFixtures()
    ]);

    setData(bootstrapResult.data);
    setFixtures(fixturesResult);
    setIsLive(bootstrapResult.isLive);
    setIsCached(!!bootstrapResult.isCached);
    setLoading(false);
    
    if (isInitial) {
      setBootStep(3);
      setTimeout(() => setBooting(false), 400);
    } else if (!bootstrapResult.isLive) {
      setErrorMsg("Sync failed. Using cache.");
      setTimeout(() => setErrorMsg(null), 2000);
    }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  useEffect(() => {
    localStorage.setItem('architect_squad', JSON.stringify(squad));
    localStorage.setItem('architect_bank', bank.toString());
  }, [squad, bank]);

  const stats = useMemo(() => {
    const starters = squad.filter(s => s.isStarter);
    const totalEP = starters
      .filter(s => s.player)
      .reduce((sum, s) => sum + parseFloat(s.player!.ep_next), 0);
    
    const teamCounts: Record<number, number> = {};
    const existingPlayerIds = new Set<number>();
    const posCounts = { [ElementType.GK]: 0, [ElementType.DEF]: 0, [ElementType.MID]: 0, [ElementType.FWD]: 0 };

    squad.forEach(s => {
      if (s.player) {
        teamCounts[s.player.team] = (teamCounts[s.player.team] || 0) + 1;
        existingPlayerIds.add(s.player.id);
        if (s.isStarter) posCounts[s.type]++;
      }
    });

    return { totalEP, teamCounts, existingPlayerIds, posCounts };
  }, [squad]);

  const analyticsData = useMemo(() => {
    if (!data) return { influence: [], threats: [] };
    
    // For Threats: Exclude anyone in the squad (bench included)
    const allSquadPlayers = squad.filter(s => s.player).map(s => s.player!);
    const allOwnedIds = new Set(allSquadPlayers.map(p => p.id));

    // For Influence: Only calculate for Starters
    const startingPlayers = squad.filter(s => s.player && s.isStarter).map(s => s.player!);
    
    // Influence: 100 - selected_by_percent
    // The less a player is owned, the more ground you gain if they score.
    const influence = startingPlayers.map(p => ({
      player: p,
      val: 100 - parseFloat(p.selected_by_percent)
    }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 5);
  
    // Threats: High EP players NOT in squad (15), sorted by ownership.
    // These are players that will hurt your rank most if they score.
    const threats = data.elements
      .filter(p => !allOwnedIds.has(p.id) && p.status === 'a')
      .sort((a, b) => parseFloat(b.ep_next) - parseFloat(a.ep_next)) // 1. Get Top Performers
      .slice(0, 5) // Take top 5 performers
      .sort((a, b) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent)) // 2. Sort by Ownership Threat
      .map(p => ({
        player: p,
        val: parseFloat(p.selected_by_percent)
      }));
      
      return { influence, threats };
  }, [squad, data]);

  const validateFormation = useCallback((newSquad: SquadSlot[]): { valid: boolean; error?: string } => {
    const starters = newSquad.filter(s => s.isStarter);
    if (starters.length !== 11) return { valid: false, error: "11 starters required" };
    const counts = { [ElementType.GK]: 0, [ElementType.DEF]: 0, [ElementType.MID]: 0, [ElementType.FWD]: 0 };
    starters.forEach(s => counts[s.type]++);
    if (counts[ElementType.GK] !== 1) return { valid: false, error: "1 GK required" };
    if (counts[ElementType.DEF] < 3 || counts[ElementType.DEF] > 5) return { valid: false, error: "3-5 DEF" };
    if (counts[ElementType.MID] < 2 || counts[ElementType.MID] > 5) return { valid: false, error: "2-5 MID" };
    if (counts[ElementType.FWD] < 1 || counts[ElementType.FWD] > 3) return { valid: false, error: "1-3 FWD" };
    return { valid: true };
  }, []);

  const optimizeSquad = useCallback(() => {
    setSquad(currentSquad => {
      let bestSquad = [...currentSquad];
      let changed = true;
      while (changed) {
        changed = false;
        let maxGain = 0;
        let swapPair: [number, number] | null = null;
        const starters = bestSquad.map((s, i) => ({ ...s, index: i })).filter(s => s.isStarter && s.player);
        const bench = bestSquad.map((s, i) => ({ ...s, index: i })).filter(s => !s.isStarter && s.player);
        for (const b of bench) {
          for (const s of starters) {
            const bEP = parseFloat(b.player!.ep_next);
            const sEP = parseFloat(s.player!.ep_next);
            const gain = bEP - sEP;
            if (gain > 0.001) {
              const testSquad = [...bestSquad];
              testSquad[s.index] = { ...testSquad[s.index], isStarter: false };
              testSquad[b.index] = { ...testSquad[b.index], isStarter: true };
              if (validateFormation(testSquad).valid) {
                if (gain > maxGain) {
                  maxGain = gain;
                  swapPair = [s.index, b.index];
                }
              }
            }
          }
        }
        if (swapPair) {
          const [sIdx, bIdx] = swapPair;
          const newSquad = [...bestSquad];
          newSquad[sIdx] = { ...newSquad[sIdx], isStarter: false };
          newSquad[bIdx] = { ...newSquad[bIdx], isStarter: true };
          bestSquad = newSquad;
          changed = true;
        }
      }
      return bestSquad;
    });
  }, [validateFormation]);

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 600);
  };

  const attemptSub = useCallback((slotAId: string, slotBId: string) => {
    setSquad(prev => {
      const newSquad = [...prev];
      const idxA = newSquad.findIndex(s => s.id === slotAId);
      const idxB = newSquad.findIndex(s => s.id === slotBId);
      const tempStatus = newSquad[idxA].isStarter;
      newSquad[idxA] = { ...newSquad[idxA], isStarter: newSquad[idxB].isStarter };
      newSquad[idxB] = { ...newSquad[idxB], isStarter: tempStatus };
      const validation = validateFormation(newSquad);
      if (!validation.valid) {
        setErrorMsg(validation.error || "Invalid Formation");
        setTimeout(() => setErrorMsg(null), 2000);
        return prev;
      }
      return newSquad;
    });
    setSelectedSlotId(null);
  }, [validateFormation]);

  const handleSlotClick = (id: string) => {
    if (!data) return;
    const slot = squad.find(s => s.id === id);
    if (!slot) return;
    
    if (!slot.player) {
      setTransferSlotId(id);
      setSelectedSlotId(null);
      return;
    }

    if (selectedSlotId && selectedSlotId !== id) {
      attemptSub(selectedSlotId, id);
      return;
    }

    setViewingPlayerId(slot.player.id);
  };

  const executeTransfer = useCallback((slotId: string, newPlayer: Player) => {
    setSquad(prev => {
      const newSquad = [...prev];
      const idx = newSquad.findIndex(s => s.id === slotId);
      if (idx === -1) return prev;
      const oldPlayer = newSquad[idx].player;
      const costDiff = newPlayer.now_cost - (oldPlayer?.now_cost || 0);
      setBank(b => b - costDiff);
      newSquad[idx] = { ...newSquad[idx], player: newPlayer };
      return newSquad;
    });
  }, []);

  const removePlayer = useCallback((slotId: string) => {
    setSquad(prev => {
      const newSquad = [...prev];
      const idx = newSquad.findIndex(s => s.id === slotId);
      if (idx !== -1 && newSquad[idx].player) {
        const p = newSquad[idx].player;
        setBank(b => b + (p?.now_cost || 0));
        newSquad[idx] = { ...newSquad[idx], player: null };
      }
      return newSquad;
    });
  }, []);

  const executeTransferPack = useCallback((pack: TransferPack) => {
    if (pack.isWildcard) {
      // Wildcard replace all
      setSquad(prev => {
        const newSquad = [...prev]; 
        const pool = [...pack.in];
        const assigned = newSquad.map(slot => {
           const pIdx = pool.findIndex(p => p.element_type === slot.type);
           if (pIdx !== -1) {
             const [p] = pool.splice(pIdx, 1);
             return { ...slot, player: p };
           }
           return slot;
        });
        return assigned;
      });
      setBank(b => b - pack.costDiff);
    } else {
      setSquad(prev => {
        const newSquad = [...prev];
        pack.out.forEach((outSlot, i) => {
          const idx = newSquad.findIndex(s => s.id === outSlot.id);
          if (idx !== -1) {
            newSquad[idx] = { ...newSquad[idx], player: pack.in[i] };
          }
        });
        return newSquad;
      });
      setBank(b => b - pack.costDiff);
    }
    setScoutResults([]);
  }, []);

  const getTeamShortName = (teamId?: number) => {
    if (!teamId || !data?.teams) return undefined;
    return data.teams.find(t => t.id === teamId)?.short_name;
  };

  // --- SCOUT ENGINE ---
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

    // We only care about optimization "candidates" if we are doing deep searches
    // Pruning: For depths > 2, only look at removing the worst 5 players to save CPU
    const pruneSearch = maxTransfers > 2;
    let slotsToConsider = filledSlots;
    
    if (pruneSearch) {
        slotsToConsider = [...filledSlots]
          .sort((a,b) => parseFloat(a.player!.ep_next) - parseFloat(b.player!.ep_next))
          .slice(0, 5); // Bottom 5
    }

    // Optimization: Pre-sort available players by EP to fail-fast
    // We only take top 15 per position for speed
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

        const currentTeamCounts = { ...stats.teamCounts };
        outSet.forEach(s => {
          if (s.player) currentTeamCounts[s.player.team] = (currentTeamCounts[s.player.team] || 0) - 1;
        });

        const findInPlayers = (
          idx: number, 
          currentBudget: number, 
          chosen: Player[], 
          chosenIds: Set<number>,
          teamCounts: Record<number, number>
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
            if (stats.existingPlayerIds.has(p.id) && !outIds.has(p.id)) continue;
            if ((teamCounts[p.team] || 0) >= 3) continue;

            teamCounts[p.team] = (teamCounts[p.team] || 0) + 1;
            
            const result = findInPlayers(
              idx + 1, 
              currentBudget - p.now_cost, 
              [...chosen, p], 
              new Set([...chosenIds, p.id]),
              teamCounts
            );

            teamCounts[p.team]--;

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
          // Optimization: Only consider it "Best" if it beats current depth best
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

      // --- STOP CONDITION & CURVE LOGIC ---
      if (bestForDepth && bestForDepth.gain > prevBestEP) {
        curveResults.push(bestForDepth);
        prevBestEP = bestForDepth.gain;
      } else {
        // If adding another transfer didn't yield a better result, stop searching.
        // The curve has plateaued.
        break; 
      }
      
      // Yield to UI between depth levels
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    setScoutResults(curveResults);
    
    // Heuristic: Auto-select the "sweet spot"
    // Prefer higher transfers ONLY if marginal gain is > 0.5 EP
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

  }, [data, squad, bank, stats, scoutMode]);

  const activeTransferSlot = squad.find(s => s.id === transferSlotId) || null;
  const viewingPlayer = data?.elements.find(p => p.id === viewingPlayerId) || null;
  const viewingSlotId = squad.find(s => s.player?.id === viewingPlayerId)?.id || null;
  const activeResult = scoutResults[viewResultIndex];

  if (booting) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 p-6">
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-green-500/10 blur-[60px] rounded-full animate-pulse" />
          <div className="relative bg-slate-900 p-8 rounded-3xl border border-white/5 shadow-2xl">
            <Trophy className="text-green-500" size={56} />
          </div>
        </div>
        <div className="w-40 h-1 bg-white/5 rounded-full overflow-hidden mb-6">
          <div className="h-full bg-green-500 animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: '40%' }} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 animate-pulse">Initializing... </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto h-[100dvh] w-full bg-slate-950 flex flex-col relative overflow-hidden select-none" onClick={() => setSelectedSlotId(null)}>
      {errorMsg && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-red-600/90 text-white px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-2xl border border-white/20 animate-in fade-in zoom-in">
          {errorMsg}
        </div>
      )}

      <header className="z-40 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 p-3 pt-[calc(0.75rem+env(safe-area-inset-top))] shadow-xl shrink-0">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-green-500 p-1.5 rounded-lg">
              <Trophy className="text-slate-900" size={14} />
            </div>
            <div>
              <h1 className="text-sm font-black italic uppercase leading-none tracking-tighter">Allsvenskan Architect</h1>
              <div className="flex items-center gap-1 mt-0.5">
                {loading ? <Loader2 size={8} className="text-green-500 animate-spin" /> : <Wifi size={8} className={isLive ? 'text-green-500' : 'text-orange-500'} />}
                <span className={`text-[7px] font-black uppercase tracking-widest ${isLive ? 'text-green-500/60' : 'text-orange-500'}`}>{isLive ? 'Live' : 'Cached'}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={() => loadData()} disabled={loading} className="p-2 bg-white/5 rounded-lg active:scale-90 text-white/40 hover:text-white transition-colors"><RefreshCw size={12} className={loading ? 'animate-spin' : ''} /></button>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsBankModalOpen(true)} className="flex-1 bg-white/5 rounded-xl px-3 py-2 border border-white/5 flex justify-between items-center hover:bg-white/10 active:scale-95 transition-all group">
            <span className="text-[8px] uppercase text-white/30 font-black tracking-widest flex items-center gap-1">Bank <Edit2 size={8} className="opacity-50 group-hover:opacity-100" /></span>
            <span className="text-sm font-black text-white">{(bank / 10).toFixed(1)}M</span>
          </button>
          <div className="flex-1 bg-white/5 rounded-xl px-3 py-2 border border-white/5 flex justify-between items-center">
            <span className="text-[8px] uppercase text-white/30 font-black tracking-widest">EP</span>
            <span className="text-sm font-black text-green-400">{stats.totalEP.toFixed(1)}</span>
          </div>
        </div>
      </header>

      <main className={`flex-1 no-scrollbar pb-0 ${activeTab === 'stats' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {activeTab === 'squad' && (
          <div className="p-2 space-y-3 pb-36">
            <div className="relative pitch-gradient rounded-[2rem] shadow-2xl border border-white/10 p-2 py-3 flex flex-col min-h-[360px] max-h-[400px]">
              <div className="absolute inset-x-0 top-0 h-1/2 pitch-line opacity-5" />
              <div className="relative flex-1 flex flex-col justify-between py-1">
                <div className="flex justify-around items-center px-4">{squad.filter(s => s.isStarter && s.type === ElementType.FWD).map(s => (
                  <PlayerSlot key={s.id} player={s.player} type={s.type} onClick={() => handleSlotClick(s.id)} isSelected={selectedSlotId === s.id} label="FWD" teamName={getTeamShortName(s.player?.team)} />
                ))}</div>
                <div className="flex justify-around items-center px-1">{squad.filter(s => s.isStarter && s.type === ElementType.MID).map(s => (
                  <PlayerSlot key={s.id} player={s.player} type={s.type} onClick={() => handleSlotClick(s.id)} isSelected={selectedSlotId === s.id} label="MID" teamName={getTeamShortName(s.player?.team)} />
                ))}</div>
                <div className="flex justify-around items-center px-1">{squad.filter(s => s.isStarter && s.type === ElementType.DEF).map(s => (
                  <PlayerSlot key={s.id} player={s.player} type={s.type} onClick={() => handleSlotClick(s.id)} isSelected={selectedSlotId === s.id} label="DEF" teamName={getTeamShortName(s.player?.team)} />
                ))}</div>
                <div className="flex justify-center">{squad.filter(s => s.isStarter && s.type === ElementType.GK).map(s => (
                  <PlayerSlot key={s.id} player={s.player} type={s.type} onClick={() => handleSlotClick(s.id)} isSelected={selectedSlotId === s.id} label="GK" teamName={getTeamShortName(s.player?.team)} />
                ))}</div>
              </div>
            </div>

            <section>
              <div className="flex items-center justify-between mb-1.5 px-2">
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/20 italic">Substitutes</span>
              </div>
              <div className="flex justify-around items-center p-2 bg-slate-900/40 rounded-2xl border border-white/5">
                {squad.filter(s => !s.isStarter).sort((a,b) => {
                  const order = { [ElementType.GK]: 1, [ElementType.DEF]: 2, [ElementType.MID]: 3, [ElementType.FWD]: 4 };
                  return order[a.type] - order[b.type];
                }).map(s => (
                  <PlayerSlot key={s.id} player={s.player} type={s.type} onClick={() => handleSlotClick(s.id)} isSelected={selectedSlotId === s.id} label={POSITION_LABELS[s.type]} isBench teamName={getTeamShortName(s.player?.team)} />
                ))}
              </div>
            </section>

            <div className="flex gap-2">
              <button onClick={optimizeSquad} className="flex-1 bg-slate-900 border border-yellow-500/10 text-yellow-500 py-3 rounded-xl font-black uppercase italic tracking-tighter text-[10px] active:scale-95 transition-all flex items-center justify-center gap-2"><Sparkles size={12} /> Optimize</button>
              <button onClick={handleSave} className={`flex-1 py-3 rounded-xl font-black uppercase italic tracking-tighter text-[10px] border flex items-center justify-center gap-2 ${saveStatus === 'saved' ? 'bg-green-600 border-white/10 text-white' : 'bg-green-500 border-white/10 text-slate-950'}`}>{saveStatus === 'saving' ? <RefreshCw className="animate-spin" size={12} /> : <Save size={12} />} {saveStatus === 'saved' ? 'Saved' : 'Save'}</button>
            </div>
          </div>
        )}

        {activeTab === 'ai-transfers' && (
          <div className="p-4 space-y-4 pb-36">
            <div className="bg-slate-900/60 p-5 rounded-3xl border border-white/5 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-purple-500/10 p-3 rounded-xl border border-purple-500/20"><BrainCircuit size={24} className="text-purple-400" /></div>
                <div><h2 className="text-sm font-black uppercase italic">AI Scout</h2><p className="text-[8px] text-white/30 font-black uppercase tracking-[0.2em] mt-0.5">Transfer Optimization</p></div>
              </div>
              
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[9px] font-black uppercase text-white/40 tracking-widest">Search Depth (Max)</span>
                  <span className="text-xs font-black text-purple-400">
                    {scoutMode === 'wildcard' ? 'Full Squad Rebuild' : `Up to ${scoutMode} Transfers`}
                  </span>
                </div>
                <div className="flex gap-1 mb-4 overflow-x-auto no-scrollbar">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button 
                      key={num} 
                      onClick={() => setScoutMode(num)}
                      className={`flex-1 min-w-[30px] py-2 rounded-lg font-black text-[10px] uppercase transition-all ${scoutMode === num ? 'bg-purple-500 text-slate-900' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}
                    >
                      {num}
                    </button>
                  ))}
                   <button 
                      onClick={() => setScoutMode('wildcard')}
                      className={`px-3 py-2 rounded-lg font-black text-[10px] uppercase transition-all flex items-center gap-1 ${scoutMode === 'wildcard' ? 'bg-yellow-500 text-slate-900' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}
                    >
                      <Wand2 size={10} /> WC
                    </button>
                </div>
                <button 
                  onClick={runScout} 
                  disabled={isScouting}
                  className={`w-full py-3 rounded-xl font-black uppercase italic tracking-tighter text-[10px] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${scoutMode === 'wildcard' ? 'bg-yellow-500 text-slate-950 hover:bg-yellow-400' : 'bg-purple-500 text-slate-950 hover:bg-purple-400'}`}
                >
                  {isScouting ? <Loader2 className="animate-spin" size={14} /> : (scoutMode === 'wildcard' ? <Wand2 size={14} /> : <Zap size={14} />)}
                  {isScouting ? 'Optimizing...' : (scoutMode === 'wildcard' ? 'Play Wildcard' : 'Run Scout Engine')}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {activeResult ? (
                <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden shadow-xl animate-in slide-in-from-bottom duration-500">
                  
                  {/* Value Curve Selector (Only for Transfer Mode) */}
                  {!activeResult.isWildcard && scoutResults.length > 0 && (
                     <div className="p-2 overflow-x-auto no-scrollbar border-b border-white/5">
                        <div className="flex gap-2">
                           {scoutResults.map((res, idx) => (
                              <button 
                                key={idx}
                                onClick={() => setViewResultIndex(idx)}
                                className={`flex-shrink-0 px-3 py-2 rounded-xl border flex flex-col items-center min-w-[80px] transition-all ${viewResultIndex === idx ? 'bg-white/10 border-green-500/50 shadow-lg' : 'bg-transparent border-white/5 hover:bg-white/5'}`}
                              >
                                 <span className={`text-[8px] font-black uppercase tracking-widest ${viewResultIndex === idx ? 'text-white' : 'text-white/30'}`}>{res.transferCount} Transfer{res.transferCount > 1 ? 's' : ''}</span>
                                 <div className="flex items-center gap-1 mt-1">
                                    <TrendingUp size={10} className={viewResultIndex === idx ? 'text-green-400' : 'text-white/20'} />
                                    <span className={`text-[10px] font-black ${viewResultIndex === idx ? 'text-green-400' : 'text-white/40'}`}>+{res.gain.toFixed(1)}</span>
                                 </div>
                              </button>
                           ))}
                        </div>
                     </div>
                  )}

                  <div className={`px-4 py-2 flex justify-between items-center border-b ${activeResult.isWildcard ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-white/5 border-white/5'}`}>
                    <div className="flex items-center gap-2">
                      {activeResult.isWildcard ? <Wand2 size={10} className="text-yellow-500" /> : <Layers size={10} className="text-purple-400" />}
                      <span className={`text-[8px] font-black uppercase tracking-widest ${activeResult.isWildcard ? 'text-yellow-500' : 'text-white/30'}`}>
                        {activeResult.isWildcard ? 'Wildcard Optimized' : 'Strategy Selected'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeResult.costDiff > 0 && <span className="text-[8px] font-black text-red-400/50">-{Math.abs(activeResult.costDiff / 10).toFixed(1)}m</span>}
                      {activeResult.costDiff <= 0 && <span className="text-[8px] font-black text-green-400/50">+{Math.abs(activeResult.costDiff / 10).toFixed(1)}m</span>}
                      <div className="bg-green-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 text-green-400">
                        <TrendingUp size={8} />
                        <span className="text-[9px] font-black tracking-widest">+{activeResult.gain.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {activeResult.isWildcard ? (
                    <div className="p-4 grid grid-cols-2 gap-2">
                       <div className="col-span-2 text-center text-[10px] font-black uppercase text-white/30 tracking-widest mb-2">New Squad Composition</div>
                       {activeResult.in.sort((a,b) => b.now_cost - a.now_cost).map((p, i) => (
                         <div key={i} className="flex justify-between items-center bg-white/5 rounded px-2 py-1">
                            <div className="flex items-center gap-2 overflow-hidden">
                               <span className="text-[7px] font-bold text-white/20 w-5">{POSITION_LABELS[p.element_type]}</span>
                               <span className="text-[9px] font-black text-green-400 truncate">{p.web_name}</span>
                            </div>
                            <span className="text-[8px] font-bold text-white/30">{p.ep_next}</span>
                         </div>
                       ))}
                    </div>
                  ) : (
                    <div className="p-4 grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
                       <div className="space-y-2">
                         <div className="text-[7px] font-black uppercase text-red-500/40 tracking-widest mb-1">Out</div>
                         {activeResult.out.map((slot, idx) => (
                           <div key={idx} className="flex flex-col">
                             <span className="text-[10px] font-black text-white italic truncate leading-none">{slot.player?.web_name}</span>
                             <span className="text-[7px] font-bold text-white/20 uppercase">{POSITION_LABELS[slot.type]}</span>
                           </div>
                         ))}
                       </div>

                       <div className="flex flex-col items-center justify-center text-white/10">
                         <ArrowRight size={14} />
                       </div>

                       <div className="space-y-2 text-right">
                         <div className="text-[7px] font-black uppercase text-green-500/40 tracking-widest mb-1">In</div>
                         {activeResult.in.map((player, idx) => (
                           <div key={idx} className="flex flex-col">
                             <span className="text-[10px] font-black text-green-400 italic truncate leading-none">{player.web_name}</span>
                             <span className="text-[7px] font-bold text-white/20 uppercase">{getTeamShortName(player.team)}</span>
                           </div>
                         ))}
                       </div>
                    </div>
                  )}

                  <button 
                    onClick={() => { executeTransferPack(activeResult); setActiveTab('squad'); }} 
                    className="w-full bg-green-500/10 hover:bg-green-500/20 py-3 text-green-500 text-[9px] font-black uppercase tracking-widest border-t border-white/5 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={12} /> Apply {activeResult.isWildcard ? 'Wildcard' : `${activeResult.transferCount} Transfer${activeResult.transferCount > 1 ? 's' : ''}`}
                  </button>
                </div>
              ) : (
                !isScouting && (
                  <div className="py-20 text-center flex flex-col items-center opacity-20">
                    <Sliders size={40} className="mb-4" />
                    <p className="text-[10px] font-black uppercase">Ready to Optimize</p>
                  </div>
                )
              )}
              {isScouting && (
                <div className="py-12 flex flex-col items-center justify-center opacity-50 space-y-4">
                  <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full animate-[loading_1s_ease-in-out_infinite] ${scoutMode === 'wildcard' ? 'bg-yellow-500' : 'bg-purple-500'}`} />
                  </div>
                  <p className="text-[8px] font-black uppercase tracking-widest animate-pulse">
                    {scoutMode === 'wildcard' ? 'Rebuilding Squad...' : 'Analyzing Value Curve...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STATS HUB VIEW */}
        {activeTab === 'stats' && (
           <div className="h-full">
             <StatsHub 
               teams={data?.teams || []} 
               fixtures={fixtures} 
               loading={loading} 
             />
           </div>
        )}

        {activeTab === 'analytics' && (
          <div className="p-4 space-y-4 pb-36">
             <div className="bg-slate-900/60 p-5 rounded-3xl border border-white/5 flex flex-col gap-4 animate-in slide-in-from-bottom duration-500">
                <div className="flex items-center gap-4">
                   <div className="bg-orange-500/10 p-3 rounded-xl border border-orange-500/20"><BarChart3 size={24} className="text-orange-400" /></div>
                   <div><h2 className="text-sm font-black uppercase italic">Rank Analytics</h2><p className="text-[8px] text-white/30 font-black uppercase tracking-[0.2em] mt-0.5">Ownership vs Risk</p></div>
                </div>

                <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 flex gap-3">
                   <Info size={16} className="text-white/30 shrink-0 mt-0.5" />
                   <p className="text-[9px] text-white/50 leading-relaxed font-medium">
                     <span className="text-green-400 font-bold">High Influence</span> players are your differentials. If they score, you gain ground on the pack. <br/>
                     <span className="text-red-400 font-bold">High Threat</span> players are popular assets you don't own. If they score, your rank drops.
                   </p>
                </div>

                <div className="space-y-4">
                  {/* Influence List */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                       <Target size={12} className="text-green-400" />
                       <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Top 5 Squad Influence</span>
                    </div>
                    <div className="bg-slate-950/30 rounded-2xl p-2 border border-white/5 space-y-1">
                      {analyticsData.influence.map((item, i) => (
                        <div key={item.player.id} className="flex flex-col px-3 py-2 bg-white/5 rounded-xl">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-black uppercase italic text-white">{item.player.web_name} <span className="text-white/20 text-[8px] ml-1 not-italic">{POSITION_LABELS[item.player.element_type]}</span></span>
                            <span className="text-[10px] font-bold text-green-400">{item.val.toFixed(1)}%</span>
                          </div>
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: `${item.val}%` }} />
                          </div>
                        </div>
                      ))}
                      {analyticsData.influence.length === 0 && <div className="text-center text-[9px] text-white/20 py-2">Add players to view analytics</div>}
                    </div>
                  </div>

                  {/* Threat List */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                       <AlertTriangle size={12} className="text-red-400" />
                       <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Top 5 Rank Threats</span>
                    </div>
                    <div className="bg-slate-950/30 rounded-2xl p-2 border border-white/5 space-y-1">
                      {analyticsData.threats.map((item, i) => (
                        <div key={item.player.id} className="flex flex-col px-3 py-2 bg-white/5 rounded-xl border-l-2 border-transparent hover:border-red-500/50 transition-colors">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-black uppercase italic text-white">{item.player.web_name} <span className="text-white/20 text-[8px] ml-1 not-italic">{POSITION_LABELS[item.player.element_type]}</span></span>
                            <span className="text-[10px] font-bold text-red-400">{item.val.toFixed(1)}%</span>
                          </div>
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500" style={{ width: `${item.val}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="p-4 space-y-4 pb-36">
             <div className="bg-slate-900/60 p-5 rounded-3xl border border-white/5 flex flex-col gap-4 animate-in slide-in-from-bottom duration-500">
                <div className="flex items-center gap-4">
                   <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20"><Info size={24} className="text-blue-400" /></div>
                   <div><h2 className="text-sm font-black uppercase italic">User Guide</h2><p className="text-[8px] text-white/30 font-black uppercase tracking-[0.2em] mt-0.5">How to use the Architect</p></div>
                </div>

                <div className="space-y-3">
                   {/* Step 1: Squad */}
                   <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-3 opacity-10"><Layout size={40} /></div>
                      <h3 className="text-[10px] font-black uppercase text-green-400 tracking-widest mb-2">1. Squad Management</h3>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <div className="mt-0.5 min-w-[4px] h-[4px] rounded-full bg-white/40" />
                          <p className="text-xs text-white/70 font-medium leading-tight">
                            <span className="text-white font-bold">Tap a player</span> to view detailed stats, make a substitution, or transfer them out.
                          </p>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="mt-0.5 min-w-[4px] h-[4px] rounded-full bg-white/40" />
                          <p className="text-xs text-white/70 font-medium leading-tight">
                            <span className="text-white font-bold">Tap 'Optimize'</span> to automatically select your strongest starting XI based on EP (Expected Points).
                          </p>
                        </li>
                      </ul>
                   </div>

                   {/* Step 2: Scout */}
                   <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-3 opacity-10"><BrainCircuit size={40} /></div>
                      <h3 className="text-[10px] font-black uppercase text-purple-400 tracking-widest mb-2">2. The AI Scout</h3>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <div className="mt-0.5 min-w-[4px] h-[4px] rounded-full bg-white/40" />
                          <p className="text-xs text-white/70 font-medium leading-tight">
                            Select a <span className="text-white font-bold">Search Depth (1-5)</span>. The engine will calculate the best possible transfer combinations to maximize points.
                          </p>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="mt-0.5 min-w-[4px] h-[4px] rounded-full bg-white/40" />
                          <p className="text-xs text-white/70 font-medium leading-tight">
                            Use the <span className="text-white font-bold">Value Curve</span> to see if making extra transfers is worth the cost.
                          </p>
                        </li>
                         <li className="flex items-start gap-2">
                          <div className="mt-0.5 min-w-[4px] h-[4px] rounded-full bg-white/40" />
                          <p className="text-xs text-white/70 font-medium leading-tight">
                            <span className="text-yellow-500 font-bold">WC (Wildcard)</span> mode rebuilds your entire squad from scratch within your budget.
                          </p>
                        </li>
                      </ul>
                   </div>

                   {/* Step 3: Bank & Rules */}
                   <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-950/50 p-3 rounded-2xl border border-white/5">
                         <div className="flex items-center gap-2 mb-2">
                            <Edit2 size={12} className="text-blue-400" />
                            <span className="text-[9px] font-black uppercase text-white/40">Budget</span>
                         </div>
                         <p className="text-[10px] text-white/60 leading-tight">
                            Tap the <span className="text-white font-bold">Bank</span> display in the header to manually adjust your available funds.
                         </p>
                      </div>
                       <div className="bg-slate-950/50 p-3 rounded-2xl border border-white/5">
                         <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck size={12} className="text-red-400" />
                            <span className="text-[9px] font-black uppercase text-white/40">Rules</span>
                         </div>
                         <p className="text-[10px] text-white/60 leading-tight">
                            Valid formations require 1 GK, 3-5 DEF, 2-5 MID, 1-3 FWD. Max 3 players per club.
                         </p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-2xl border-t border-white/5 px-4 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex justify-around max-w-md mx-auto z-40 shrink-0">
        <button onClick={() => setActiveTab('squad')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'squad' ? 'text-green-500' : 'text-white/60 hover:text-white'}`}>
          <Layout size={24} />
          <span className="text-[9px] font-black uppercase tracking-widest">Squad</span>
        </button>
        <button onClick={() => setActiveTab('analytics')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'analytics' ? 'text-orange-400' : 'text-white/60 hover:text-white'}`}>
          <BarChart3 size={24} />
          <span className="text-[9px] font-black uppercase tracking-widest">Rank</span>
        </button>
        <button onClick={() => setActiveTab('ai-transfers')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'ai-transfers' ? 'text-purple-400' : 'text-white/60 hover:text-white'}`}>
          <div className="relative">
            <BrainCircuit size={24} />
            {activeResult && !isScouting && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full border-2 border-slate-950" />}
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">AI Scout</span>
        </button>
        <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'stats' ? 'text-yellow-400' : 'text-white/60 hover:text-white'}`}>
          <Table2 size={24} />
          <span className="text-[9px] font-black uppercase tracking-widest">Table</span>
        </button>
        <button onClick={() => setActiveTab('about')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'about' ? 'text-blue-400' : 'text-white/60 hover:text-white'}`}>
          <Info size={24} />
          <span className="text-[9px] font-black uppercase tracking-widest">Guide</span>
        </button>
      </footer>

      {viewingPlayer && (
        <PlayerInfoModal 
          player={viewingPlayer}
          team={data?.teams.find(t => t.id === viewingPlayer.team)}
          onClose={() => setViewingPlayerId(null)}
          isOwned={true} // Pitch-clicked players are always owned
          onAction={(type) => {
            if (type === 'swap' && viewingSlotId) {
              setSelectedSlotId(viewingSlotId);
            } else if (type === 'transfer' && viewingSlotId) {
              removePlayer(viewingSlotId);
            }
            setViewingPlayerId(null);
          }}
        />
      )}

      {data && (
        <TransferModal
          isOpen={!!transferSlotId}
          onClose={() => setTransferSlotId(null)}
          onSelect={(newPlayer) => { if (transferSlotId) { executeTransfer(transferSlotId, newPlayer); setTransferSlotId(null); } }}
          currentSlotPlayer={activeTransferSlot?.player || null}
          bank={bank}
          players={data.elements}
          teams={data.teams}
          slotType={activeTransferSlot?.type || ElementType.GK}
          squadTeamCounts={stats.teamCounts}
          existingPlayerIds={stats.existingPlayerIds}
        />
      )}

      {isBankModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsBankModalOpen(false)} />
          <div className="relative bg-slate-900 border border-white/10 p-6 rounded-3xl w-full max-w-xs shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black uppercase italic tracking-tighter mb-4 text-center">Adjust Budget</h3>
            <div className="flex items-center gap-2 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 mb-4 focus-within:border-green-500/50 transition-colors">
              <span className="text-green-500 font-black text-lg">€</span>
              <input 
                ref={bankInputRef}
                type="number" 
                step="0.1"
                autoFocus
                className="bg-transparent text-white font-black text-xl outline-none w-full"
                defaultValue={(bank / 10).toFixed(1)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (bankInputRef.current) {
                      const val = parseFloat(bankInputRef.current.value);
                      if (!isNaN(val)) setBank(Math.round(val * 10));
                    }
                    setIsBankModalOpen(false);
                  }
                }}
              />
              <span className="text-white/30 font-black text-sm uppercase">M</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsBankModalOpen(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase text-white/50 transition-colors">Cancel</button>
              <button onClick={() => {
                if (bankInputRef.current) {
                  const val = parseFloat(bankInputRef.current.value);
                  if (!isNaN(val)) setBank(Math.round(val * 10));
                }
                setIsBankModalOpen(false);
              }} className="flex-1 py-3 bg-green-500 hover:bg-green-400 text-slate-950 rounded-xl text-xs font-black uppercase transition-colors">Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
