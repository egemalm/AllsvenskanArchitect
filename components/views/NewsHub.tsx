
import React from 'react';
import { NewsItem } from '../../types';
import { Globe, ChevronRight, ExternalLink, RefreshCw } from 'lucide-react';

interface NewsHubProps {
  news: NewsItem[];
  loading: boolean;
  onRefresh: () => void;
  watchList: Set<string>; // Names of owned players + threats
}

const NewsHub: React.FC<NewsHubProps> = ({ news, loading, onRefresh, watchList }) => {
  
  // Helper to highlight squad members or threats in the text
  const renderHighlightedText = (text: string) => {
    if (watchList.size === 0) return text;
    
    // Create a regex from the set of names
    // We escape special characters and look for whole words or substantial partial matches
    const escapedNames = Array.from(watchList).map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (escapedNames.length === 0) return text;

    // Filter out very short names (less than 4 chars) to avoid noise unless they are exact matches
    const pattern = new RegExp(`\\b(${escapedNames.filter(n => n.length > 3).join('|')})\\b`, 'gi');
    
    const parts = text.split(pattern);
    
    return parts.map((part, i) => {
      if (watchList.has(part) || Array.from(watchList).some(w => w.toLowerCase() === part.toLowerCase())) {
        return <span key={i} className="text-green-400 font-black bg-green-500/10 px-1 rounded">{part}</span>;
      }
      return part;
    });
  };

  return (
    <div className="h-full flex flex-col">
       <div className="p-4 pt-6 bg-slate-900/60 border-b border-white/5 backdrop-blur-xl shrink-0">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20">
                <Globe size={20} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase italic">News Feed</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-[8px] text-white/40 font-black uppercase tracking-[0.2em]">Allsvenskan Live</p>
                </div>
              </div>
            </div>
            <button 
              onClick={onRefresh} 
              disabled={loading}
              className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all active:scale-95"
            >
              <RefreshCw size={14} className={`text-white/60 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3 pb-36">
          {loading && news.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
               <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
               <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Fetching latest stories...</p>
             </div>
          ) : news.length > 0 ? (
            news.map((item, idx) => (
              <a 
                key={idx} 
                href={item.link} 
                target="_blank" 
                rel="noreferrer"
                className="block bg-slate-900/50 border border-white/5 rounded-2xl p-4 active:scale-[0.99] transition-all hover:bg-slate-800/50 hover:border-white/10 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                   <ExternalLink size={12} className="text-white/30" />
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[8px] font-black uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded text-white/30">{item.source}</span>
                  <span className="text-[8px] font-bold text-white/20">{new Date(item.pubDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</span>
                </div>

                <h3 className="text-sm font-black text-white leading-tight mb-2 group-hover:text-blue-200 transition-colors">
                  {renderHighlightedText(item.title)}
                </h3>

                <p className="text-[10px] text-white/60 leading-relaxed font-medium line-clamp-2">
                  {renderHighlightedText(item.contentSnippet)}
                </p>
                
                <div className="mt-3 flex items-center gap-1 text-[9px] font-black uppercase text-blue-400/60 group-hover:text-blue-400 transition-colors">
                  Read Full Story <ChevronRight size={10} />
                </div>
              </a>
            ))
          ) : (
            <div className="py-20 text-center opacity-30">
              <Globe size={32} className="mx-auto mb-3" />
              <p className="text-[10px] font-black uppercase">No news available at the moment</p>
            </div>
          )}
          
          <div className="text-center py-4">
             <p className="text-[8px] text-white/10 font-black uppercase tracking-widest">Powered by SvenskaFans</p>
          </div>
       </div>
    </div>
  );
};

export default NewsHub;
