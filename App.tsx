
import React, { useState } from 'react';
import { ElementType, Tab } from './types';
import { Trophy } from 'lucide-react';

// Modals
import TransferModal from './components/modals/TransferModal';
import PlayerInfoModal from './components/modals/PlayerInfoModal';
import BankModal from './components/modals/BankModal';

// Layout Components
import AppHeader from './components/layout/AppHeader';
import AppFooter from './components/layout/AppFooter';

// View Components
import SquadView from './components/views/SquadView';
import AiScoutView from './components/views/AiScoutView';
import AnalyticsView from './components/views/AnalyticsView';
import StatsHub from './components/views/StatsHub';
import NewsHub from './components/views/NewsHub';

// Hooks
import { useFantasyData } from './hooks/useFantasyData';
import { useSquadManager } from './hooks/useSquadManager';
import { useScoutEngine } from './hooks/useScoutEngine';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('squad');
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);

  // 1. Data Layer
  const {
    data,
    fixtures,
    news,
    booting,
    loading,
    newsLoading,
    isLive,
    errorMsg: dataError,
    loadData,
    loadNewsData,
    getTeamShortName
  } = useFantasyData();

  // 2. Squad Management Layer
  const {
    squad,
    bank,
    captainId,
    viceCaptainId,
    stats,
    analyticsData,
    watchList,
    saveStatus,
    errorMsg: squadError,
    setErrorMsg,
    selectedSlotId,
    transferSlotId,
    viewingPlayerId,
    setTransferSlotId,
    setViewingPlayerId,
    setBank,
    handleSlotClick,
    handleSave,
    optimizeSquad,
    executeTransferPack,
    executeTransfer,
    handlePlayerAction
  } = useSquadManager(data);

  // 3. Scout Engine Layer
  const {
    scoutMode,
    scoutResults,
    viewResultIndex,
    isScouting,
    setScoutMode,
    setViewResultIndex,
    runScout
  } = useScoutEngine(data, squad, bank, stats.teamCounts, stats.existingPlayerIds);

  const activeTransferSlot = squad.find(s => s.id === transferSlotId) || null;
  const viewingPlayer = data?.elements.find(p => p.id === viewingPlayerId) || null;
  const activeResult = scoutResults[viewResultIndex];
  const isViewingPlayerOwned = viewingPlayer ? squad.some(s => s.player?.id === viewingPlayer.id) : false;
  
  const displayError = dataError || squadError;

  if (booting) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 p-6">
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-green-500/10 blur-[60px] rounded-full animate-pulse" />
          <div className="relative bg-slate-900 p-8 rounded-3xl border border-white/5 shadow-2xl">
            <Trophy className="text-green-500" size={56} />
          </div>
        </div>
        <div className="w-40 h-1 bg-white/5 rounded-full overflow-hidden mb-6">
          <div className="h-full bg-green-500 animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: '40%' }} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 animate-pulse">Initializing... </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto h-[100dvh] w-full bg-slate-950 flex flex-col relative overflow-hidden select-none">
      {displayError && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-red-600/90 text-white px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-2xl border border-white/20 animate-in fade-in zoom-in">
          {displayError}
        </div>
      )}

      <AppHeader 
        loading={loading}
        isLive={isLive}
        bank={bank}
        totalEP={stats.totalEP}
        onRefresh={() => loadData()}
        onOpenBankModal={() => setIsBankModalOpen(true)}
      />

      <main className={`flex-1 no-scrollbar pb-0 ${activeTab === 'stats' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        
        {activeTab === 'squad' && (
          <SquadView 
            squad={squad}
            selectedSlotId={selectedSlotId}
            captainId={captainId}
            viceCaptainId={viceCaptainId}
            saveStatus={saveStatus}
            onSlotClick={handleSlotClick}
            onOptimize={optimizeSquad}
            onSave={handleSave}
            getTeamShortName={getTeamShortName}
          />
        )}

        {activeTab === 'ai-transfers' && (
          <AiScoutView 
            scoutMode={scoutMode}
            setScoutMode={setScoutMode}
            runScout={runScout}
            isScouting={isScouting}
            scoutResults={scoutResults}
            viewResultIndex={viewResultIndex}
            setViewResultIndex={setViewResultIndex}
            executeTransferPack={executeTransferPack}
            setActiveTab={setActiveTab}
            getTeamShortName={getTeamShortName}
          />
        )}

        {activeTab === 'stats' && (
           <div className="h-full">
             <StatsHub 
               teams={data?.teams || []} 
               fixtures={fixtures} 
               loading={loading} 
             />
           </div>
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView 
            analyticsData={analyticsData}
            setViewingPlayerId={setViewingPlayerId}
          />
        )}

        {activeTab === 'news' && (
          <div className="h-full">
            <NewsHub 
              news={news} 
              loading={newsLoading} 
              onRefresh={loadNewsData}
              watchList={watchList}
            />
          </div>
        )}
      </main>

      <AppFooter 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasActiveResult={!!activeResult}
        isScouting={isScouting}
      />

      {viewingPlayer && (
        <PlayerInfoModal 
          player={viewingPlayer}
          team={data?.teams.find(t => t.id === viewingPlayer.team)}
          onClose={() => setViewingPlayerId(null)}
          isOwned={isViewingPlayerOwned} 
          showTransferIn={activeTab !== 'analytics'}
          onAction={(type) => handlePlayerAction(type, viewingPlayer)}
        />
      )}

      {data && (
        <TransferModal
          isOpen={!!transferSlotId}
          onClose={() => setTransferSlotId(null)}
          onSelect={(newPlayer) => { if (transferSlotId) { executeTransfer(transferSlotId, newPlayer); setTransferSlotId(null); } }}
          currentSlotPlayer={activeTransferSlot?.player || null}
          bank={bank}
          players={data.elements}
          teams={data.teams}
          slotType={activeTransferSlot?.type || ElementType.GK}
          squadTeamCounts={stats.teamCounts}
          existingPlayerIds={stats.existingPlayerIds}
        />
      )}

      <BankModal 
        isOpen={isBankModalOpen}
        bank={bank}
        onClose={() => setIsBankModalOpen(false)}
        onUpdateBank={setBank}
      />
    </div>
  );
};

export default App;
