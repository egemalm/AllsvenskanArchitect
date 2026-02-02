
import { useState, useEffect, useCallback } from 'react';
import { BootstrapData, Fixture, NewsItem, Team } from '../types';
import { fetchBootstrapData, fetchFixtures, fetchNews } from '../services/api';

export const useFantasyData = () => {
  const [data, setData] = useState<BootstrapData | null>(null);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadNewsData = async () => {
    setNewsLoading(true);
    const newsItems = await fetchNews();
    setNews(newsItems);
    setNewsLoading(false);
  };

  const loadData = useCallback(async (isInitial = false) => {
    setLoading(true);
    
    const [bootstrapResult, fixturesResult] = await Promise.all([
      fetchBootstrapData(),
      fetchFixtures()
    ]);
    
    if (isInitial) {
       loadNewsData();
    }

    setData(bootstrapResult.data);
    
    const sortedFixtures = [...fixturesResult].sort((a, b) => {
      const timeA = a.kickoff_time ? new Date(a.kickoff_time).getTime() : 0;
      const timeB = b.kickoff_time ? new Date(b.kickoff_time).getTime() : 0;
      return timeA - timeB;
    });
    setFixtures(sortedFixtures);

    setIsLive(bootstrapResult.isLive);
    setIsCached(!!bootstrapResult.isCached);
    setLoading(false);
    
    if (isInitial) {
      setTimeout(() => setBooting(false), 400);
    } else if (!bootstrapResult.isLive) {
      setErrorMsg("Sync failed. Using cache.");
      setTimeout(() => setErrorMsg(null), 2000);
    }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  const getTeamShortName = (teamId?: number) => {
    if (!teamId || !data?.teams) return undefined;
    return data.teams.find(t => t.id === teamId)?.short_name;
  };

  return {
    data,
    fixtures,
    news,
    booting,
    loading,
    newsLoading,
    isLive,
    errorMsg,
    setErrorMsg,
    loadData,
    loadNewsData,
    getTeamShortName
  };
};
