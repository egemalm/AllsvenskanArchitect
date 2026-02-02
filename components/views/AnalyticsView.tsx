
import React from 'react';
import { Player } from '../../types';
import { POSITION_LABELS } from '../../constants';
import { BarChart3, Info, Target, AlertTriangle } from 'lucide-react';

interface AnalyticsViewProps {
  analyticsData: {
    influence: { player: Player; val: number }[];
    threats: { player: Player; val: number }[];
  };
  setViewingPlayerId: (id: number) => void;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ 
  analyticsData, 
  setViewingPlayerId 
}) => {
  return (
    <div className="p-4 space-y-4 pb-36">
       <div className="bg-slate-900/60 p-5 rounded-3xl border border-white/5 flex flex-col gap-4 animate-in slide-in-from-bottom duration-500">
          <div className="flex items-center gap-4">
             <div className="bg-orange-500/10 p-3 rounded-xl border border-orange-500/20"><BarChart3 size={24} className="text-orange-400" /></div>
             <div><h2 className="text-sm font-black uppercase italic">Rank Analytics</h2><p className="text-[8px] text-white/60 font-black uppercase tracking-[0.2em] mt-0.5">Ownership vs Risk</p></div>
          </div>

          <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 flex gap-3">
             <Info size={16} className="text-white/60 shrink-0 mt-0.5" />
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
                {analyticsData.influence.map((item) => (
                  <div key={item.player.id} onClick={() => setViewingPlayerId(item.player.id)} className="flex flex-col px-3 py-2 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
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
                {analyticsData.threats.map((item) => (
                  <div key={item.player.id} onClick={() => setViewingPlayerId(item.player.id)} className="flex flex-col px-3 py-2 bg-white/5 rounded-xl border-l-2 border-transparent hover:border-red-500/50 hover:bg-white/10 transition-colors cursor-pointer">
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
  );
};

export default AnalyticsView;
