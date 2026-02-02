
import React from 'react';
import { ElementType, SquadSlot } from '../../types';
import { POSITION_LABELS } from '../../constants';
import { Sparkles, Save, RefreshCw } from 'lucide-react';
import PlayerSlot from '../shared/PlayerSlot';

interface SquadViewProps {
  squad: SquadSlot[];
  selectedSlotId: string | null;
  captainId: number | null;
  viceCaptainId: number | null;
  saveStatus: 'idle' | 'saving' | 'saved';
  onSlotClick: (id: string) => void;
  onOptimize: () => void;
  onSave: () => void;
  getTeamShortName: (teamId?: number) => string | undefined;
}

const SquadView: React.FC<SquadViewProps> = ({
  squad,
  selectedSlotId,
  captainId,
  viceCaptainId,
  saveStatus,
  onSlotClick,
  onOptimize,
  onSave,
  getTeamShortName
}) => {
  return (
    <div className="p-2 space-y-3 pb-36">
      <div className="relative pitch-gradient rounded-[2rem] shadow-2xl border border-white/10 p-2 py-3 flex flex-col min-h-[360px] max-h-[400px]">
        <div className="absolute inset-x-0 top-0 h-1/2 pitch-line opacity-5" />
        <div className="relative flex-1 flex flex-col justify-between py-1">
          <div className="flex justify-around items-center px-4">{squad.filter(s => s.isStarter && s.type === ElementType.FWD).map(s => (
            <PlayerSlot 
              key={s.id} 
              player={s.player} 
              type={s.type} 
              onClick={() => onSlotClick(s.id)} 
              isSelected={selectedSlotId === s.id} 
              label="FWD" 
              teamName={getTeamShortName(s.player?.team)}
              isCaptain={s.player?.id === captainId}
              isViceCaptain={s.player?.id === viceCaptainId}
            />
          ))}</div>
          <div className="flex justify-around items-center px-1">{squad.filter(s => s.isStarter && s.type === ElementType.MID).map(s => (
            <PlayerSlot 
              key={s.id} 
              player={s.player} 
              type={s.type} 
              onClick={() => onSlotClick(s.id)} 
              isSelected={selectedSlotId === s.id} 
              label="MID" 
              teamName={getTeamShortName(s.player?.team)}
              isCaptain={s.player?.id === captainId}
              isViceCaptain={s.player?.id === viceCaptainId}
            />
          ))}</div>
          <div className="flex justify-around items-center px-1">{squad.filter(s => s.isStarter && s.type === ElementType.DEF).map(s => (
            <PlayerSlot 
              key={s.id} 
              player={s.player} 
              type={s.type} 
              onClick={() => onSlotClick(s.id)} 
              isSelected={selectedSlotId === s.id} 
              label="DEF" 
              teamName={getTeamShortName(s.player?.team)}
              isCaptain={s.player?.id === captainId}
              isViceCaptain={s.player?.id === viceCaptainId}
            />
          ))}</div>
          <div className="flex justify-center">{squad.filter(s => s.isStarter && s.type === ElementType.GK).map(s => (
            <PlayerSlot 
              key={s.id} 
              player={s.player} 
              type={s.type} 
              onClick={() => onSlotClick(s.id)} 
              isSelected={selectedSlotId === s.id} 
              label="GK" 
              teamName={getTeamShortName(s.player?.team)}
              isCaptain={s.player?.id === captainId}
              isViceCaptain={s.player?.id === viceCaptainId}
            />
          ))}</div>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-1.5 px-2">
          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/60 italic">Substitutes</span>
        </div>
        <div className="flex justify-around items-center p-2 bg-slate-900/40 rounded-2xl border border-white/5">
          {squad.filter(s => !s.isStarter).sort((a,b) => {
            // GK always first
            if (a.type === ElementType.GK) return -1;
            if (b.type === ElementType.GK) return 1;
            
            // Sort others by EP (Highest first)
            const epA = a.player ? parseFloat(a.player.ep_next) : -Infinity;
            const epB = b.player ? parseFloat(b.player.ep_next) : -Infinity;
            
            return epB - epA;
          }).map(s => (
            <PlayerSlot 
              key={s.id} 
              player={s.player} 
              type={s.type} 
              onClick={() => onSlotClick(s.id)} 
              isSelected={selectedSlotId === s.id} 
              label={POSITION_LABELS[s.type]} 
              isBench 
              teamName={getTeamShortName(s.player?.team)}
              isCaptain={s.player?.id === captainId}
              isViceCaptain={s.player?.id === viceCaptainId}
            />
          ))}
        </div>
      </section>

      <div className="flex gap-2">
        <button onClick={onOptimize} className="flex-1 bg-slate-900 border border-yellow-500/10 text-yellow-500 py-3 rounded-xl font-black uppercase italic tracking-tighter text-[10px] active:scale-95 transition-all flex items-center justify-center gap-2"><Sparkles size={12} /> Optimize</button>
        <button onClick={onSave} className={`flex-1 py-3 rounded-xl font-black uppercase italic tracking-tighter text-[10px] border flex items-center justify-center gap-2 ${saveStatus === 'saved' ? 'bg-green-600 border-white/10 text-white' : 'bg-green-500 border-white/10 text-slate-950'}`}>{saveStatus === 'saving' ? <RefreshCw className="animate-spin" size={12} /> : <Save size={12} />} {saveStatus === 'saved' ? 'Saved' : 'Save'}</button>
      </div>
    </div>
  );
};

export default SquadView;
