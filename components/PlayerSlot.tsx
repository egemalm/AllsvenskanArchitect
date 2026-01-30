
import React from 'react';
import { Player, ElementType } from '../types';
import { User, Plus } from 'lucide-react';

interface PlayerSlotProps {
  player: Player | null;
  type: ElementType;
  onClick: () => void;
  isSelected?: boolean;
  label?: string;
  isBench?: boolean;
  teamName?: string;
}

const PlayerSlot: React.FC<PlayerSlotProps> = ({ 
  player, 
  type, 
  onClick, 
  isSelected, 
  label, 
  isBench,
  teamName 
}) => {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex flex-col items-center justify-center transition-all duration-300 ${
        isBench ? 'w-14' : 'w-16 sm:w-20'
      } ${isSelected ? 'scale-105' : 'active:scale-95'}`}
    >
      <div className={`relative rounded-full flex items-center justify-center transition-all duration-300 ${
        isBench ? 'w-8 h-8' : 'w-10 h-10 sm:w-12 sm:h-12'
      } ${
        player 
          ? 'bg-slate-100 shadow-xl border ' + (isSelected ? 'border-yellow-400 ring-2 ring-yellow-400/30' : 'border-green-600')
          : 'bg-black/30 border border-dashed border-white/10'
      }`}>
        {player ? (
          <User className={isSelected ? "text-yellow-600" : "text-green-800"} size={isBench ? 14 : 18} />
        ) : (
          <Plus className="text-white/10" size={isBench ? 12 : 14} />
        )}
        
        {player && (
          <div className="absolute -bottom-1 -right-1 bg-green-600 text-[6px] font-black px-0.5 rounded border border-white shadow-sm">
            {(player.now_cost / 10).toFixed(1)}
          </div>
        )}
      </div>
      
      <div className="mt-1 w-full flex flex-col items-center">
        <div className={`flex flex-col items-center w-full rounded-md overflow-hidden ${
          player 
            ? isSelected ? 'bg-yellow-400' : 'bg-slate-900/80' 
            : ''
        }`}>
          {player && teamName && (
            <div className={`text-[6px] font-black w-full text-center py-0.5 uppercase tracking-tighter border-b ${
              isSelected ? 'bg-slate-900 text-yellow-400 border-yellow-400/20' : 'bg-green-600 text-white border-white/10'
            }`}>
              {teamName}
            </div>
          )}
          <div className={`text-[8px] font-black truncate px-1 py-0.5 w-full text-center uppercase tracking-tighter ${
            player 
              ? isSelected ? 'text-slate-900' : 'text-white' 
              : 'text-white/20 border border-dashed border-white/5 rounded-md px-1 py-0.5'
          }`}>
            {player ? player.web_name : label || 'Add'}
          </div>
        </div>
        
        {player && (
          <div className="text-[7px] text-green-400/80 font-black mt-0.5 tracking-tighter uppercase text-center w-full">
            {player.ep_next} EP
          </div>
        )}
      </div>
    </button>
  );
};

export default PlayerSlot;
