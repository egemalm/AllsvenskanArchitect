
import React from 'react';
import { Trophy, Loader2, Wifi, RefreshCw, Edit2 } from 'lucide-react';

interface AppHeaderProps {
  loading: boolean;
  isLive: boolean;
  bank: number;
  totalEP: number;
  onRefresh: () => void;
  onOpenBankModal: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ 
  loading, 
  isLive, 
  bank, 
  totalEP, 
  onRefresh, 
  onOpenBankModal 
}) => {
  return (
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
          <button onClick={onRefresh} disabled={loading} className="p-2 bg-white/5 rounded-lg active:scale-90 text-white/40 hover:text-white transition-colors"><RefreshCw size={12} className={loading ? 'animate-spin' : ''} /></button>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onOpenBankModal} className="flex-1 bg-white/5 rounded-xl px-3 py-2 border border-white/5 flex justify-between items-center hover:bg-white/10 active:scale-95 transition-all group">
          <span className="text-[8px] uppercase text-white/60 font-black tracking-widest flex items-center gap-1">Bank <Edit2 size={8} className="opacity-50 group-hover:opacity-100" /></span>
          <span className={`text-sm font-black ${bank < 0 ? 'text-red-500' : 'text-white'}`}>{(bank / 10).toFixed(1)}M</span>
        </button>
        <div className="flex-1 bg-white/5 rounded-xl px-3 py-2 border border-white/5 flex justify-between items-center">
          <span className="text-[8px] uppercase text-white/60 font-black tracking-widest">Excpected Points</span>
          <span className="text-sm font-black text-green-400">{totalEP.toFixed(1)}</span>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
