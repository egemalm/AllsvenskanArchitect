
import React from 'react';
import { Player, Team } from '../../types';
import { X, TrendingUp, Zap, Shield, AlertCircle, Activity, ArrowRight, Trash2, Crown, Star } from 'lucide-react';

interface PlayerInfoModalProps {
  player: Player | null;
  team: Team | undefined;
  onClose: () => void;
  onAction?: (type: 'transfer' | 'swap' | 'buy' | 'captain' | 'vice') => void;
  isOwned?: boolean;
  showTransferIn?: boolean;
}

const StatItem = ({ label, value, subValue, highlight = false }: { label: string, value: string | number, subValue?: string, highlight?: boolean }) => (
  <div className="bg-slate-800/40 p-3 rounded-2xl border border-white/5">
    <div className="text-[8px] font-black uppercase text-white/30 tracking-widest mb-1">{label}</div>
    <div className={`text-sm font-black italic uppercase ${highlight ? 'text-green-400' : 'text-white'}`}>
      {value}
      {subValue && <span className="text-[8px] opacity-30 ml-1 font-bold">{subValue}</span>}
    </div>
  </div>
);

const PlayerInfoModal: React.FC<PlayerInfoModalProps> = ({ player, team, onClose, onAction, isOwned = true, showTransferIn = true }) => {
  if (!player) return null;

  const isInjured = player.status !== 'a';

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div 
        className="relative bg-slate-900 w-full max-h-[92vh] rounded-t-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 border-t border-white/10"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 shrink-0">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">{team?.name || 'Unknown Team'}</div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">
                {player.first_name} <span className="text-green-500">{player.second_name}</span>
              </h2>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-xl">
              <div className="text-[8px] font-black uppercase text-green-500/50 mb-0.5">Market Value</div>
              <div className="text-sm font-black text-green-400">{(player.now_cost / 10).toFixed(1)}M</div>
            </div>
            <div className="bg-white/5 px-3 py-1.5 rounded-xl">
              <div className="text-[8px] font-black uppercase text-white/40 mb-0.5">Ownership</div>
              <div className="text-sm font-black">{player.selected_by_percent}%</div>
            </div>
          </div>

          {isInjured && (
            <div className="mt-4 bg-orange-500/10 border border-orange-500/20 p-3 rounded-2xl flex items-start gap-3">
              <AlertCircle size={16} className="text-orange-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] font-black text-orange-500 uppercase">Availability Alert</div>
                <div className="text-xs text-white/70 font-medium mt-0.5">{player.news}</div>
                <div className="text-[10px] text-white/40 font-bold uppercase mt-1">Chance of playing: {player.chance_of_playing_next_round ?? 0}%</div>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Stats */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
          <section>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-green-500" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Fantasy Performance</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatItem label="Excpected Points" value={player.ep_next} subValue="EP" highlight />
              <StatItem label="Form Index" value={player.form} />
              <StatItem label="Points Per Match" value={player.points_per_game} />
              <StatItem label="Total Points" value={player.total_points} />
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <Activity size={14} className="text-blue-500" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Technical Analysis</h3>
            </div>
            <div className="bg-slate-800/20 rounded-2xl p-4 border border-white/5 space-y-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                  <span className="text-[9px] font-bold text-white/40 uppercase">Minutes Played</span>
                  <span className="text-xs font-black">{player.minutes}</span>
                </div>
                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                  <span className="text-[9px] font-bold text-white/40 uppercase">Key Passes</span>
                  <span className="text-xs font-black text-blue-400">{player.key_passes}</span>
                </div>
                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                  <span className="text-[9px] font-bold text-white/40 uppercase">CBI Rating</span>
                  <span className="text-xs font-black text-purple-400">{player.clearances_blocks_interceptions}</span>
                </div>
                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                  <span className="text-[9px] font-bold text-white/40 uppercase">Goals + Assists</span>
                  <span className="text-xs font-black">{player.goals_scored + player.assists}</span>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={14} className="text-red-500" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Discipline</h3>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-3 flex justify-between items-center">
                <span className="text-[9px] font-black text-yellow-500/60 uppercase">Yellow Cards</span>
                <span className="text-sm font-black text-yellow-500">{player.yellow_cards}</span>
              </div>
              <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-2xl p-3 flex justify-between items-center">
                <span className="text-[9px] font-black text-red-500/60 uppercase">Red Cards</span>
                <span className="text-sm font-black text-red-500">{player.red_cards}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-slate-900/80 backdrop-blur-xl border-t border-white/10 shrink-0 flex flex-col gap-3">
          {/* Captaincy Row */}
          {isOwned && (
            <div className="flex gap-2">
              <button 
                onClick={() => onAction?.('captain')}
                className="flex-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 py-3 rounded-xl font-black uppercase italic tracking-tighter text-[10px] border border-yellow-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Crown size={14} /> Make Captain
              </button>
              <button 
                onClick={() => onAction?.('vice')}
                className="flex-1 bg-slate-700/30 hover:bg-slate-700/50 text-white/70 py-3 rounded-xl font-black uppercase italic tracking-tighter text-[10px] border border-white/10 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Star size={14} /> Make Vice
              </button>
            </div>
          )}

          <div className="flex gap-3">
            {isOwned ? (
              <>
                <button 
                  onClick={() => onAction?.('swap')}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-black uppercase italic tracking-tighter text-xs border border-white/10 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Zap size={14} /> Substitute
                </button>
                <button 
                  onClick={() => onAction?.('transfer')}
                  className="flex-1 bg-red-600/10 hover:bg-red-600/20 text-red-500 py-4 rounded-2xl font-black uppercase italic tracking-tighter text-xs border border-red-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} /> Transfer Out
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={onClose}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-black uppercase italic tracking-tighter text-xs border border-white/10 transition-all active:scale-95"
                >
                  {showTransferIn ? 'Cancel' : 'Close'}
                </button>
                {showTransferIn && (
                  <button 
                    onClick={() => onAction?.('buy')}
                    className="flex-[2] bg-green-500 hover:bg-green-400 text-slate-950 py-4 rounded-2xl font-black uppercase italic tracking-tighter text-xs shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <ArrowRight size={14} /> Transfer In
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerInfoModal;
