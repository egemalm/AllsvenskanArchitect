
import React, { useState, useMemo, useEffect } from 'react';
import { Team, Fixture } from '../types';
import { Table, CalendarDays, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { FDR_COLORS } from '../constants';

interface StatsHubProps {
  teams: Team[];
  fixtures: Fixture[];
  loading: boolean;
}

const StatsHub: React.FC<StatsHubProps> = ({ teams, fixtures, loading }) => {
  const [view, setView] = useState<'table' | 'fixtures'>('table');
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);

  // 1. Global Team Map (The Brain)
  const teamMap = useMemo(() => {
    const map = new Map<number, Team>();
    teams.forEach(t => map.set(t.id, t));
    return map;
  }, [teams]);

  // 2. League Table Logic
  const sortedTable = useMemo(() => {
    const isPreSeason = teams.every(t => t.position === 0);
    return [...teams].sort((a, b) => {
      if (isPreSeason || (a.position === 0 && b.position === 0)) {
        return a.name.localeCompare(b.name);
      }
      return a.position - b.position;
    });
  }, [teams]);

  // 3. Fixture Logic
  const gameweeks = useMemo(() => {
    if (fixtures.length === 0) return [];
    const events = new Set(fixtures.map(f => f.event).filter((e): e is number => e !== null));
    return Array.from(events).sort((a, b) => a - b);
  }, [fixtures]);

  // Default GW selection
  useEffect(() => {
    if (gameweeks.length > 0 && selectedEvent === null) {
      let targetGw = gameweeks[gameweeks.length - 1];
      for (const gw of gameweeks) {
        const hasUnfinishedFixture = fixtures.some(f => f.event === gw && !f.finished);
        if (hasUnfinishedFixture) {
          targetGw = gw;
          break;
        }
      }
      setSelectedEvent(targetGw);
    }
  }, [gameweeks, fixtures, selectedEvent]);

  const activeFixtures = useMemo(() => {
    if (!selectedEvent) return [];
    return fixtures.filter(f => f.event === selectedEvent);
  }, [fixtures, selectedEvent]);

  // Navigation Handlers
  const handlePrevGW = () => {
    if (selectedEvent === null) return;
    const idx = gameweeks.indexOf(selectedEvent);
    if (idx > 0) setSelectedEvent(gameweeks[idx - 1]);
  };

  const handleNextGW = () => {
    if (selectedEvent === null) return;
    const idx = gameweeks.indexOf(selectedEvent);
    if (idx < gameweeks.length - 1) setSelectedEvent(gameweeks[idx + 1]);
  };

  const currentGwIndex = selectedEvent ? gameweeks.indexOf(selectedEvent) : -1;
  const canGoPrev = currentGwIndex > 0;
  const canGoNext = currentGwIndex < gameweeks.length - 1;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 opacity-50">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-[10px] font-black uppercase tracking-widest text-white/30">Syncing Stats Data...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-white overflow-hidden">
      {/* 1. FIXED TOP TOGGLE BAR & HEADER (Shrink-0 to prevent scrolling) */}
      <div className="shrink-0 z-30 bg-slate-900/95 backdrop-blur-xl border-b border-white/5 flex flex-col shadow-2xl">
        <div className="px-4 pt-2 pb-2">
           <div className="flex bg-slate-950/50 p-1 rounded-xl border border-white/5">
             <button 
               onClick={() => setView('table')}
               className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg transition-all ${view === 'table' ? 'bg-slate-800 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
             >
               <Table size={14} />
               <span className="text-[10px] font-black uppercase tracking-widest">Table</span>
             </button>
             <button 
               onClick={() => setView('fixtures')}
               className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg transition-all ${view === 'fixtures' ? 'bg-slate-800 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
             >
               <CalendarDays size={14} />
               <span className="text-[10px] font-black uppercase tracking-widest">Fixtures</span>
             </button>
           </div>
        </div>

        {view === 'table' && (
           <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2">
              <h3 className="text-sm font-black uppercase italic text-white tracking-tight">Allsvenskan 2026 Standings</h3>
              <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider">2026 Season - Live Updates</p>
           </div>
        )}
      </div>

      {/* 2. FLEXIBLE SCROLLABLE CONTENT AREA with massive padding-bottom for mobile safety */}
      <div 
        className="flex-1 overflow-y-auto no-scrollbar touch-pan-y overscroll-contain bg-slate-950 pb-64"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        
        {/* VIEW: LEAGUE TABLE */}
        {view === 'table' && (
          <div className="flex flex-col min-h-full">
               {/* Table Card Container */}
               <div className="mx-2 mt-2 bg-slate-900/20 rounded-2xl border border-white/5 isolate">
                 {/* Sticky Header */}
                 <div className="sticky top-0 z-20 grid grid-cols-[10%_1fr_10%_10%_10%_10%_10%] bg-slate-900 border-b border-white/5 py-3 px-3 rounded-t-2xl shadow-lg">
                    <div className="text-[8px] font-black text-white/30 uppercase text-center">Pos</div>
                    <div className="text-[8px] font-black text-white/30 uppercase">Team</div>
                    <div className="text-[8px] font-black text-white/30 uppercase text-center">P</div>
                    <div className="text-[8px] font-black text-white/30 uppercase text-center">W</div>
                    <div className="text-[8px] font-black text-white/30 uppercase text-center">D</div>
                    <div className="text-[8px] font-black text-white/30 uppercase text-center">L</div>
                    <div className="text-[8px] font-black text-white/30 uppercase text-center">Pts</div>
                 </div>
                 
                 {/* Data Rows */}
                 {sortedTable.map((team, idx) => {
                    const effectivePos = team.position > 0 ? team.position : idx + 1;
                    const isEuro = effectivePos <= 3;
                    const isRelegation = effectivePos >= 14; 
                    
                    return (
                      <div 
                        key={team.id}
                        className={`grid grid-cols-[10%_1fr_10%_10%_10%_10%_10%] py-3 px-3 items-center border-b border-white/5 hover:bg-white/5 transition-colors ${
                          isEuro ? 'bg-green-500/5' : isRelegation ? 'bg-red-500/5' : ''
                        }`}
                      >
                        <div className="flex justify-center">
                           <div className={`w-5 h-5 flex items-center justify-center rounded text-[9px] font-black ${
                             isEuro ? 'bg-green-500/20 text-green-400' : 
                             isRelegation ? 'bg-red-500/20 text-red-400' : 
                             'text-white/40'
                           }`}>
                             {effectivePos}
                           </div>
                        </div>
                        <div className="text-[10px] font-black uppercase text-white truncate pr-2">
                          {team.short_name}
                        </div>
                        <div className="text-[10px] font-bold text-white/40 text-center">{team.played}</div>
                        <div className="text-[10px] font-bold text-white/40 text-center">{team.win}</div>
                        <div className="text-[10px] font-bold text-white/40 text-center">{team.draw}</div>
                        <div className="text-[10px] font-bold text-white/40 text-center">{team.loss}</div>
                        <div className="text-[10px] font-black text-white text-center">{team.points}</div>
                      </div>
                    );
                 })}
               </div>
          </div>
        )}

        {/* VIEW: FIXTURES */}
        {view === 'fixtures' && (
          <div className="flex flex-col min-h-full">
              {fixtures.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40">
                  <AlertTriangle size={48} className="mb-4" />
                  <p className="text-sm font-black uppercase italic leading-relaxed">
                    Fixtures for the 2026 season are currently being updated by the league.
                  </p>
                </div>
              ) : (
                <>
                  {/* Sticky GW Selector */}
                  <div className="sticky top-0 z-20 px-4 py-4 bg-slate-950/95 backdrop-blur-md border-b border-white/5 shadow-xl">
                    <div className="flex items-center justify-between bg-slate-900/80 rounded-xl p-2 border border-white/5">
                      <button 
                        onClick={handlePrevGW}
                        disabled={!canGoPrev}
                        className={`p-3 rounded-lg transition-all active:scale-95 ${
                          canGoPrev 
                            ? 'bg-slate-800 text-white hover:bg-slate-700 shadow-lg' 
                            : 'bg-transparent text-white/40 cursor-not-allowed'
                        }`}
                      >
                        <ChevronLeft size={18} />
                      </button>
                      
                      <div className="flex flex-col items-center">
                         <span className="text-[8px] font-black uppercase tracking-[0.2em] text-green-500/60">Gameweek</span>
                         <span className="text-xl font-black italic text-white leading-none">{selectedEvent}</span>
                      </div>

                      <button 
                        onClick={handleNextGW}
                        disabled={!canGoNext}
                        className={`p-3 rounded-lg transition-all active:scale-95 ${
                          canGoNext 
                            ? 'bg-slate-800 text-white hover:bg-slate-700 shadow-lg' 
                            : 'bg-transparent text-white/40 cursor-not-allowed'
                        }`}
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Fixture List */}
                  <div className="p-2 space-y-2">
                    {activeFixtures.map(fixture => {
                      const homeTeam = teamMap.get(fixture.team_h);
                      const awayTeam = teamMap.get(fixture.team_a);

                      if (!homeTeam || !awayTeam) return null;

                      return (
                        <div key={fixture.id} className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                          <div className="flex-1 flex items-center gap-3">
                            <div className={`w-1.5 h-8 rounded-full ${FDR_COLORS[fixture.team_h_difficulty] || 'bg-slate-500'}`} />
                            <div>
                               <div className="text-[11px] font-black uppercase text-white leading-tight">{homeTeam.short_name}</div>
                               <div className="text-[8px] text-white/30 font-bold uppercase tracking-wider">Home</div>
                            </div>
                          </div>

                          <div className="flex flex-col items-center justify-center w-16">
                            {fixture.finished ? (
                               <div className="bg-slate-950 px-3 py-1 rounded-lg border border-white/10 text-lg font-black text-white tracking-widest">
                                 {fixture.team_h_score}-{fixture.team_a_score}
                               </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[8px] font-black text-white/20">VS</div>
                            )}
                          </div>

                          <div className="flex-1 flex items-center justify-end gap-3 text-right">
                            <div>
                               <div className="text-[11px] font-black uppercase text-white leading-tight">{awayTeam.short_name}</div>
                               <div className="text-[8px] text-white/30 font-bold uppercase tracking-wider">Away</div>
                            </div>
                            <div className={`w-1.5 h-8 rounded-full ${FDR_COLORS[fixture.team_a_difficulty] || 'bg-slate-500'}`} />
                          </div>
                        </div>
                      );
                    })}
                    
                    {activeFixtures.length === 0 && (
                       <div className="text-center py-10 text-[9px] font-black uppercase tracking-widest text-white/20">
                         No fixtures scheduled for this Gameweek
                       </div>
                    )}
                  </div>
                </>
              )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsHub;
