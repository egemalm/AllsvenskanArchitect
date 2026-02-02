
import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ElementType, 
  Player, 
  BootstrapData, 
  SquadSlot,
  TransferPack
} from '../types';
import { 
  INITIAL_BANK, 
  INITIAL_SQUAD_STRUCTURE,
  POSITION_LABELS
} from '../constants';

export const useSquadManager = (data: BootstrapData | null) => {
  const [squad, setSquad] = useState<SquadSlot[]>(() => {
    const saved = localStorage.getItem('architect_squad');
    return saved ? JSON.parse(saved) : INITIAL_SQUAD_STRUCTURE;
  });
  const [bank, setBank] = useState(() => {
    const saved = localStorage.getItem('architect_bank');
    return saved ? parseInt(saved) : INITIAL_BANK;
  });
  const [captainId, setCaptainId] = useState<number | null>(() => {
    const saved = localStorage.getItem('architect_captain');
    return saved ? parseInt(saved) : null;
  });
  const [viceCaptainId, setViceCaptainId] = useState<number | null>(() => {
    const saved = localStorage.getItem('architect_vice_captain');
    return saved ? parseInt(saved) : null;
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [localErrorMsg, setLocalErrorMsg] = useState<string | null>(null);

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [transferSlotId, setTransferSlotId] = useState<string | null>(null);
  const [viewingPlayerId, setViewingPlayerId] = useState<number | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('architect_squad', JSON.stringify(squad));
    localStorage.setItem('architect_bank', bank.toString());
    if (captainId) localStorage.setItem('architect_captain', captainId.toString());
    else localStorage.removeItem('architect_captain');
    if (viceCaptainId) localStorage.setItem('architect_vice_captain', viceCaptainId.toString());
    else localStorage.removeItem('architect_vice_captain');
  }, [squad, bank, captainId, viceCaptainId]);

  // Automatic Captaincy Enforcement
  useEffect(() => {
    const validStarters = squad
      .filter(s => s.isStarter && s.player)
      .map(s => s.player!)
      .sort((a, b) => parseFloat(b.ep_next) - parseFloat(a.ep_next));

    if (validStarters.length === 0) return;

    let newCapId = captainId;
    let newViceId = viceCaptainId;
    let changed = false;

    const isCapValid = newCapId && validStarters.some(p => p.id === newCapId);
    if (!isCapValid) {
      newCapId = validStarters[0].id;
      changed = true;
    }

    const validViceCandidates = validStarters.filter(p => p.id !== newCapId);
    const isViceValid = newViceId && validViceCandidates.some(p => p.id === newViceId);
    
    if (!isViceValid) {
       if (validViceCandidates.length > 0) {
         newViceId = validViceCandidates[0].id;
         changed = true;
       } else if (newViceId !== null) {
         newViceId = null; 
         changed = true;
       }
    }

    if (changed) {
      if (newCapId !== captainId) setCaptainId(newCapId);
      if (newViceId !== viceCaptainId) setViceCaptainId(newViceId);
    }
  }, [squad, captainId, viceCaptainId]);

  const stats = useMemo(() => {
    const starters = squad.filter(s => s.isStarter);
    
    const totalEP = starters
      .filter(s => s.player)
      .reduce((sum, s) => {
        let ep = parseFloat(s.player!.ep_next);
        if (s.player!.id === captainId) ep *= 2;
        return sum + ep;
      }, 0);
    
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
  }, [squad, captainId]);

  const analyticsData = useMemo(() => {
    if (!data) return { influence: [], threats: [] };
    
    const allSquadPlayers = squad.filter(s => s.player).map(s => s.player!);
    const allOwnedIds = new Set(allSquadPlayers.map(p => p.id));
    const startingPlayers = squad.filter(s => s.player && s.isStarter).map(s => s.player!);
    
    const influence = startingPlayers.map(p => ({
      player: p,
      val: 100 - parseFloat(p.selected_by_percent)
    }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 5);
  
    const threats = data.elements
      .filter(p => !allOwnedIds.has(p.id))
      .sort((a, b) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent))
      .slice(0, 5)
      .map(p => ({
        player: p,
        val: parseFloat(p.selected_by_percent)
      }));
      
      return { influence, threats };
  }, [squad, data]);

  const watchList = useMemo(() => {
    const names = new Set<string>();
    squad.forEach(s => {
      if (s.player) {
        names.add(s.player.web_name);
        names.add(s.player.second_name);
      }
    });
    analyticsData.threats.forEach(t => {
      names.add(t.player.web_name);
      names.add(t.player.second_name);
    });
    return names;
  }, [squad, analyticsData]);

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
    let bestSquad = [...squad];
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

    const activeStarters = bestSquad
      .filter(s => s.isStarter && s.player)
      .map(s => s.player!)
      .sort((a, b) => parseFloat(b.ep_next) - parseFloat(a.ep_next));

    if (activeStarters.length > 0) {
      setCaptainId(activeStarters[0].id);
      if (activeStarters.length > 1) {
        setViceCaptainId(activeStarters[1].id);
      } else {
        setViceCaptainId(null);
      }
    }

    setSquad(bestSquad);
  }, [squad, validateFormation]);

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
        setLocalErrorMsg(validation.error || "Invalid Formation");
        setTimeout(() => setLocalErrorMsg(null), 2000);
        return prev;
      }
      return newSquad;
    });
    setSelectedSlotId(null);
  }, [validateFormation]);

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
  }, []);

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 600);
  };

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

  // Centralized action handler replacing inline spaghetti in App.tsx
  const handlePlayerAction = (type: 'transfer' | 'swap' | 'buy' | 'captain' | 'vice', player: Player) => {
    const slot = squad.find(s => s.player?.id === player.id);
    const slotId = slot?.id;

    if (type === 'swap' && slotId) {
      setSelectedSlotId(slotId);
      setViewingPlayerId(null);
    } else if (type === 'transfer' && slotId) {
      removePlayer(slotId);
      setViewingPlayerId(null);
    } else if (type === 'captain') {
      setCaptainId(player.id);
      if (viceCaptainId === player.id) setViceCaptainId(null);
      setViewingPlayerId(null);
    } else if (type === 'vice') {
      setViceCaptainId(player.id);
      if (captainId === player.id) setCaptainId(null);
      setViewingPlayerId(null);
    } else if (type === 'buy') {
      const emptySlot = squad.find(s => s.type === player.element_type && s.player === null);
      if (emptySlot) {
         executeTransfer(emptySlot.id, player);
         setViewingPlayerId(null);
      } else {
        setLocalErrorMsg(`No empty ${POSITION_LABELS[player.element_type]} slots. Sell a player first.`);
        setTimeout(() => setLocalErrorMsg(null), 2000);
      }
    }
  };

  return {
    squad,
    bank,
    captainId,
    viceCaptainId,
    stats,
    analyticsData,
    watchList,
    saveStatus,
    errorMsg: localErrorMsg,
    setErrorMsg: setLocalErrorMsg,
    
    // UI State
    selectedSlotId,
    transferSlotId,
    viewingPlayerId,
    setSelectedSlotId,
    setTransferSlotId,
    setViewingPlayerId,
    setBank,
    setCaptainId,
    setViceCaptainId,

    // Actions
    handleSlotClick,
    handleSave,
    optimizeSquad,
    executeTransferPack,
    executeTransfer,
    removePlayer,
    handlePlayerAction
  };
};
