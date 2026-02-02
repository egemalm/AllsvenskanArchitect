
import React from 'react';
import { Layout, BarChart3, BrainCircuit, Table2, Globe } from 'lucide-react';
import { Tab } from '../../types';

interface AppFooterProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  hasActiveResult: boolean;
  isScouting: boolean;
}

const AppFooter: React.FC<AppFooterProps> = ({ 
  activeTab, 
  setActiveTab, 
  hasActiveResult, 
  isScouting 
}) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-2xl border-t border-white/5 px-4 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex justify-around max-w-md mx-auto z-40 shrink-0">
      <button onClick={() => setActiveTab('squad')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'squad' ? 'text-green-500' : 'text-white/60 hover:text-white'}`}>
        <Layout size={24} />
        <span className="text-[9px] font-black uppercase tracking-widest">Squad</span>
      </button>
      <button onClick={() => setActiveTab('analytics')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'analytics' ? 'text-orange-400' : 'text-white/60 hover:text-white'}`}>
        <BarChart3 size={24} />
        <span className="text-[9px] font-black uppercase tracking-widest">Rank</span>
      </button>
      <button onClick={() => setActiveTab('ai-transfers')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'ai-transfers' ? 'text-purple-400' : 'text-white/60 hover:text-white'}`}>
        <div className="relative">
          <BrainCircuit size={24} />
          {hasActiveResult && !isScouting && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full border-2 border-slate-950" />}
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest">AI Scout</span>
      </button>
      <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'stats' ? 'text-yellow-400' : 'text-white/60 hover:text-white'}`}>
        <Table2 size={24} />
        <span className="text-[9px] font-black uppercase tracking-widest">Table</span>
      </button>
      <button onClick={() => setActiveTab('news')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'news' ? 'text-blue-400' : 'text-white/60 hover:text-white'}`}>
        <Globe size={24} />
        <span className="text-[9px] font-black uppercase tracking-widest">News</span>
      </button>
    </footer>
  );
};

export default AppFooter;
