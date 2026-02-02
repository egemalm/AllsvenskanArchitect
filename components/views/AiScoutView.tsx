
import React from 'react';
import { ScoutMode, TransferPack, Tab } from '../../types';
import { POSITION_LABELS } from '../../constants';
import { BrainCircuit, Wand2, Zap, Loader2, TrendingUp, Layers, ArrowRight, CheckCircle2, Sliders } from 'lucide-react';

interface AiScoutViewProps {
  scoutMode: ScoutMode;
  setScoutMode: (mode: ScoutMode) => void;
  runScout: () => void;
  isScouting: boolean;
  scoutResults: TransferPack[];
  viewResultIndex: number;
  setViewResultIndex: (index: number) => void;
  executeTransferPack: (pack: TransferPack) => void;
  setActiveTab: (tab: Tab) => void;
  getTeamShortName: (teamId?: number) => string | undefined;
}

const AiScoutView: React.FC<AiScoutViewProps> = ({
  scoutMode,
  setScoutMode,
  runScout,
  isScouting,
  scoutResults,
  viewResultIndex,
  setViewResultIndex,
  executeTransferPack,
  setActiveTab,
  getTeamShortName
}) => {
  const activeResult = scoutResults[viewResultIndex];

  return (
    <div className="p-4 space-y-4 pb-36">
      <div className="bg-slate-900/60 p-5 rounded-3xl border border-white/5 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-purple-500/10 p-3 rounded-xl border border-purple-500/20"><BrainCircuit size={24} className="text-purple-400" /></div>
          <div><h2 className="text-sm font-black uppercase italic">AI Scout</h2><p className="text-[8px] text-white/60 font-black uppercase tracking-[0.2em] mt-0.5">Transfer Optimization</p></div>
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
                className={`flex-1 min-w-[30px] py-2 rounded-lg font-black text-[10px] uppercase transition-all ${scoutMode === num ? 'bg-purple-500 text-slate-900' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
              >
                {num}
              </button>
            ))}
             <button 
                onClick={() => setScoutMode('wildcard')}
                className={`px-3 py-2 rounded-lg font-black text-[10px] uppercase transition-all flex items-center gap-1 ${scoutMode === 'wildcard' ? 'bg-yellow-500 text-slate-900' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
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
                 <div className="col-span-2 text-center text-[10px] font-black uppercase text-white/60 tracking-widest mb-2">New Squad Composition</div>
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
            <div className="py-20 text-center flex flex-col items-center opacity-40">
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
  );
};

export default AiScoutView;
