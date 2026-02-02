
import React, { useState, useMemo } from 'react';
import { Player, Team, ElementType } from '../../types';
import { Search, X, TrendingUp, Info, AlertTriangle, Coins, Activity, Trophy, Users, Shield, Percent, ArrowUpDown } from 'lucide-react';
import PlayerInfoModal from './PlayerInfoModal';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (player: Player) => void;
  currentSlotPlayer: Player | null;
  bank: number;
  players: Player[];
  teams: Team[];
  slotType: ElementType;
  squadTeamCounts: Record<number, number>;
  existingPlayerIds: Set<number>;
}

type SortOption = 'ep' | 'price' | 'form' | 'total_points' | 'ppg' | 'ownership' | 'team';

const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentSlotPlayer,
  bank,
  players,
  teams,
  slotType,
  squadTeamCounts,
  existingPlayerIds
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingPlayerId, setViewingPlayerId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('ep');

  const potentialBudget = (currentSlotPlayer?.now_cost || 0) + bank;
  const isBudgetNegative = potentialBudget < 0;

  const suggestions = useMemo(() => {
    if (!isOpen) return [];

    return players
      .filter(p => {
        if (p.element_type !== slotType) return false;
        
        if (existingPlayerIds.has(p.id) && p.id !== currentSlotPlayer?.id) return false;
        
        const teamCount = squadTeamCounts[p.team] || 0;
        const isSameTeamAsOutgoing = currentSlotPlayer?.team === p.team;
        if (teamCount >= 3 && !isSameTeamAsOutgoing) return false;

        if (searchTerm && !p.web_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (p.id === currentSlotPlayer?.id) return false;
        
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price': return b.now_cost - a.now_cost;
          case 'form': return parseFloat(b.form) - parseFloat(a.form);
          case 'total_points': return b.total_points - a.total_points;
          case 'ppg': return parseFloat(b.points_per_game) - parseFloat(a.points_per_game);
          case 'ownership': return parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent);
          case 'team': {
            const teamA = teams.find(t => t.id === a.team)?.short_name || '';
            const teamB = teams.find(t => t.id === b.team)?.short_name || '';
            return teamA.localeCompare(teamB);
          }
          case 'ep':
          default: return parseFloat(b.ep_next) - parseFloat(a.ep_next);
        }
      });
  }, [players, currentSlotPlayer, slotType, squadTeamCounts, existingPlayerIds, searchTerm, isOpen, sortBy, teams]);

  const viewingPlayer = players.find(p => p.id === viewingPlayerId) || null;

  const getSortIcon = (option: SortOption) => {
    switch (option) {
      case 'ep': return <TrendingUp size={12} />;
      case 'price': return <Coins size={12} />;
      case 'form': return <Activity size={12} />;
      case 'total_points': return <Trophy size={12} />;
      case 'ppg': return <Percent size={12} />;
      case 'ownership': return <Users size={12} />;
      case 'team': return <Shield size={12} />;
      default: return <ArrowUpDown size={12} />;
    }
  };

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case 'ep': return 'Prediction';
      case 'price': return 'Price';
      case 'form': return 'Form';
      case 'total_points': return 'Points';
      case 'ppg': return 'PPG';
      case 'ownership': return 'Owned %';
      case 'team': return 'Team';
    }
  };

  const renderStatValue = (p: Player) => {
    switch (sortBy) {
      case 'price': return <span>{(p.now_cost / 10).toFixed(1)}m</span>;
      case 'form': return <span>{p.form}</span>;
      case 'total_points': return <span>{p.total_points}</span>;
      case 'ppg': return <span>{p.points_per_game}</span>;
      case 'ownership': return <span>{p.selected_by_percent}%</span>;
      case 'team': return <span className="text-xs">{teams.find(t => t.id === p.team)?.short_name}</span>;
      case 'ep':
      default: return <span>{p.ep_next}</span>;
    }
  };

  const sortOptions: SortOption[] = ['ep', 'price', 'form', 'total_points', 'ppg', 'ownership', 'team'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end" onClick={(e) => e.stopPropagation()}>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-slate-900 w-full max-h-[90vh] rounded-t-[3rem] shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300 border-t border-white/10">
        <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-black uppercase italic tracking-tighter">Scout Report</h2>
            <div className="flex gap-3 mt-1 items-center">
              <span className={`text-[10px] font-black uppercase tracking-tight flex items-center gap-1 ${isBudgetNegative ? 'text-red-500' : 'text-green-500'}`}>
                {isBudgetNegative && <AlertTriangle size={10} />}
                Budget: {(potentialBudget / 10).toFixed(1)}m
              </span>
              <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">{slotType === 1 ? 'GK' : slotType === 2 ? 'DEF' : slotType === 3 ? 'MID' : 'FWD'} Database</span>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 shrink-0 space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-green-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search for players..."
              className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-green-500 outline-none transition-all placeholder:text-white/10 text-lg font-black uppercase italic"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
             {sortOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => setSortBy(opt)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                    sortBy === opt 
                      ? 'bg-blue-500 text-slate-950 shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                      : 'bg-white/5 text-white/40 hover:bg-white/10'
                  }`}
                >
                  {getSortIcon(opt)}
                  {getSortLabel(opt)}
                </button>
             ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 no-scrollbar space-y-3 pb-24">
          {suggestions.length > 0 ? (
            suggestions.map((p) => {
              const team = teams.find(t => t.id === p.team);
              const currentEP = currentSlotPlayer ? parseFloat(currentSlotPlayer.ep_next) : 0;
              const newEP = parseFloat(p.ep_next);
              const epGain = newEP - currentEP;
              
              // Visual warning if over budget
              const willBeOverBudget = p.now_cost > potentialBudget;

              return (
                <div
                  key={p.id}
                  onClick={() => onSelect(p)}
                  className={`w-full p-4 pl-5 rounded-[2rem] flex items-center justify-between transition-all border active:scale-[0.98] cursor-pointer group ${willBeOverBudget ? 'bg-slate-800/20 hover:bg-slate-800/40 border-red-500/20' : 'bg-slate-800/30 hover:bg-slate-800/60 border-white/5'}`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center border border-white/10 group-hover:border-green-500/50 transition-colors">
                       {/* Contextual Icon based on Sort */}
                       {sortBy === 'ep' ? (
                          <TrendingUp size={16} className={epGain >= 0 ? 'text-green-500' : 'text-red-400'} />
                       ) : sortBy === 'price' ? (
                          <Coins size={16} className="text-yellow-500" />
                       ) : sortBy === 'form' ? (
                          <Activity size={16} className="text-blue-400" />
                       ) : sortBy === 'ownership' ? (
                          <Users size={16} className="text-purple-400" />
                       ) : (
                          <TrendingUp size={16} className="text-white/40" />
                       )}
                    </div>
                    <div>
                      <div className="font-black text-white text-sm leading-tight uppercase italic">{p.web_name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[8px] font-black bg-white/10 px-1.5 py-0.5 rounded text-white/50 uppercase">{team?.short_name}</span>
                        <span className={`text-[10px] font-black ${willBeOverBudget ? 'text-red-400' : 'text-green-400'}`}>{(p.now_cost / 10).toFixed(1)}m</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[7px] text-white/20 uppercase font-black tracking-widest mb-0.5">{getSortLabel(sortBy)}</div>
                      <div className="text-lg font-black text-white">
                        {renderStatValue(p)}
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingPlayerId(p.id);
                      }}
                      className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/30 hover:text-white transition-colors border border-white/5"
                    >
                      <Info size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-20 text-center flex flex-col items-center">
              <div className="p-6 bg-white/5 rounded-full mb-4">
                <AlertTriangle size={32} className="text-white/10" />
              </div>
              <p className="text-white/40 font-black uppercase tracking-widest text-[10px]">No compatible candidates found</p>
            </div>
          )}
        </div>
      </div>

      {viewingPlayer && (
        <PlayerInfoModal 
          player={viewingPlayer}
          team={teams.find(t => t.id === viewingPlayer.team)}
          onClose={() => setViewingPlayerId(null)}
          isOwned={false}
          onAction={(type) => {
            if (type === 'buy') {
              onSelect(viewingPlayer);
              setViewingPlayerId(null);
            }
          }}
        />
      )}
    </div>
  );
};

export default TransferModal;
