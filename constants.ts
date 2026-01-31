
import { ElementType, SquadSlot } from './types';

export const INITIAL_BANK = 1000; // 100.0 * 10
export const MAX_TEAM_PLAYERS = 3;
export const TOTAL_SQUAD_SIZE = 15;

export const INITIAL_SQUAD_STRUCTURE: SquadSlot[] = [
  // Starters (11)
  { id: 's1', type: ElementType.GK, isStarter: true, player: null },
  { id: 's2', type: ElementType.DEF, isStarter: true, player: null },
  { id: 's3', type: ElementType.DEF, isStarter: true, player: null },
  { id: 's4', type: ElementType.DEF, isStarter: true, player: null },
  { id: 's5', type: ElementType.DEF, isStarter: true, player: null },
  { id: 's6', type: ElementType.MID, isStarter: true, player: null },
  { id: 's7', type: ElementType.MID, isStarter: true, player: null },
  { id: 's8', type: ElementType.MID, isStarter: true, player: null },
  { id: 's9', type: ElementType.MID, isStarter: true, player: null },
  { id: 's10', type: ElementType.FWD, isStarter: true, player: null },
  { id: 's11', type: ElementType.FWD, isStarter: true, player: null },
  // Bench (4)
  { id: 'b1', type: ElementType.GK, isStarter: false, player: null },
  { id: 'b2', type: ElementType.DEF, isStarter: false, player: null },
  { id: 'b3', type: ElementType.MID, isStarter: false, player: null },
  { id: 'b4', type: ElementType.FWD, isStarter: false, player: null },
];

export const POSITION_LABELS: Record<ElementType, string> = {
  [ElementType.GK]: 'GKP',
  [ElementType.DEF]: 'DEF',
  [ElementType.MID]: 'MID',
  [ElementType.FWD]: 'FWD',
};

export const FDR_COLORS: Record<number, string> = {
  1: 'bg-[#01fc7a] text-slate-900',
  2: 'bg-[#01fc7a] text-slate-900',
  3: 'bg-[#e7e7e7] text-slate-900',
  4: 'bg-[#ff1751] text-white',
  5: 'bg-[#80072d] text-white',
};
