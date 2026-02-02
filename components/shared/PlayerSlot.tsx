
import React from 'react';
import { Player, ElementType } from '../../types';
import { User, Plus, ShieldBan } from 'lucide-react';
import { POSITION_LABELS } from '../../constants';

interface PlayerSlotProps {
  player: Player | null;
  type: ElementType;
  onClick: () => void;
  isSelected?: boolean;
  label?: string;
  isBench?: boolean;
  teamName?: string;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
}

const PlayerSlot: React.FC<PlayerSlotProps> = ({ 
  player, 
  type, 
  onClick, 
  isSelected, 
  label, 
  isBench,
  teamName,
  isCaptain,
  isViceCaptain
}) => {
  const isUnavailable = player && player.status !== 'a';
  const isDoubtful = player && player.status === 'd';

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`relative flex flex-col items-center justify-center transition-all duration-300 ${
        isBench ? 'w-14' : 'w-16 sm:w-20'
      } ${isSelected ? 'scale-105' : 'active:scale-95'}`}
    >
      {/* Bench Position Badge */}
      {isBench && player && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 bg-slate-900 text-white text-[7px] font-black px-1.5 py-0.5 rounded border border-white/20 uppercase tracking-widest shadow-lg whitespace-nowrap">
           {POSITION_LABELS[type]}
        </div>
      )}

      <div className={`relative rounded-full flex items-center justify-center transition-all duration-300 ${
        isBench ? 'w-8 h-8' : 'w-10 h-10 sm:w-12 sm:h-12'
      } ${
        player 
          ? 'bg-slate-100 shadow-xl border ' + (isSelected ? 'border-yellow-400 ring-2 ring-yellow-400/30' : 'border-green-600')
          /* UPDATED: High Contrast White for empty slots */
          : 'bg-white/20 border-2 border-dashed border-white/80 backdrop-blur-sm'
      }`}>
        {player ? (
          <User className={isSelected ? "text-yellow-600" : "text-green-800"} size={isBench ? 14 : 18} />
        ) : (
          /* UPDATED: Pure white Icon */
          <Plus className="text-white" size={isBench ? 12 : 14} strokeWidth={3} />
        )}
        
        {player && (
          <div className="absolute -bottom-1 -right-1 bg-green-600 text-white text-[6px] font-black px-0.5 rounded border border-white shadow-sm z-10">
            {(player.now_cost / 10).toFixed(1)}
          </div>
        )}

        {/* Status / Injury Badge */}
        {isUnavailable && (
          <div className={`absolute -bottom-1 -left-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-lg z-20 ${
            isDoubtful ? 'bg-orange-500 text-slate-900' : 'bg-red-600 text-white'
          }`}>
             {isDoubtful ? (
               <span className="text-[8px] font-black">!</span>
             ) : (
               <ShieldBan size={8} />
             )}
          </div>
        )}

        {/* Captaincy Badge */}
        {isCaptain && (
          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-yellow-500 text-slate-950 font-black text-[9px] flex items-center justify-center border-2 border-slate-900 shadow-lg z-20">
            C
          </div>
        )}
        {isViceCaptain && !isCaptain && (
          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-200 text-slate-950 font-black text-[9px] flex items-center justify-center border-2 border-slate-900 shadow-lg z-20">
            V
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
              /* UPDATED: High Contrast White text and border for empty labels */
              : 'text-white border border-dashed border-white/60 rounded-md px-1 py-0.5 bg-white/10'
          }`}>
            {player ? player.web_name : label || 'Add'}
          </div>
        </div>
      </div>
    </button>
  );
};

export default PlayerSlot;
