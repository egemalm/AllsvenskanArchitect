
import { BootstrapData, Player, Team, Fixture } from '../types';

const API_BASE = 'https://fantasy.allsvenskan.se/api';
const BOOTSTRAP_URL = `${API_BASE}/bootstrap-static/`;
const FIXTURES_URL = `${API_BASE}/fixtures/`;
const CACHE_KEY = 'allsvenskan_architect_data_v3';

// Expanded Proxy Pool for better reliability
const PROXIES = [
  'https://api.allorigins.win/get?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://thingproxy.freeboard.io/fetch/'
];

// Generic swarm fetcher
async function fetchWithSwarm(url: string): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500);

  const fetchFromProxy = async (proxyBase: string) => {
    const targetUrl = `${url}?t=${Date.now()}`;
    const response = await fetch(`${proxyBase}${encodeURIComponent(targetUrl)}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) throw new Error(`Proxy ${proxyBase} failed`);

    let rawData;
    if (proxyBase.includes('allorigins')) {
      const wrapper = await response.json();
      rawData = JSON.parse(wrapper.contents);
    } else {
      rawData = await response.json();
    }
    return rawData;
  };

  return new Promise((resolve, reject) => {
    let rejectedCount = 0;
    PROXIES.forEach(proxy => {
      fetchFromProxy(proxy)
        .then(data => resolve(data))
        .catch(() => {
          rejectedCount++;
          if (rejectedCount === PROXIES.length) reject(new Error("Swarm Failed"));
        });
    });
  }).finally(() => {
    clearTimeout(timeoutId);
    controller.abort();
  });
}

export async function fetchFixtures(): Promise<Fixture[]> {
  try {
    const data = await fetchWithSwarm(FIXTURES_URL);
    if (Array.isArray(data)) {
      return data.map((f: any) => ({
        id: f.id,
        event: f.event,
        team_h: f.team_h,
        team_a: f.team_a,
        team_h_score: f.team_h_score,
        team_a_score: f.team_a_score,
        team_h_difficulty: f.team_h_difficulty,
        team_a_difficulty: f.team_a_difficulty,
        kickoff_time: f.kickoff_time,
        finished: f.finished,
        started: f.started
      }));
    }
    return [];
  } catch (e) {
    console.warn("Architect: Failed to fetch fixtures", e);
    return [];
  }
}

export async function fetchBootstrapData(): Promise<{ data: BootstrapData; isLive: boolean; isCached?: boolean }> {
  // 1. Immediate Cache Retrieval
  const cached = localStorage.getItem(CACHE_KEY);
  let cachedData: BootstrapData | null = null;
  if (cached) {
    try {
      cachedData = JSON.parse(cached);
      console.log("Architect: Initialized from Cache");
    } catch (e) {
      localStorage.removeItem(CACHE_KEY);
    }
  }

  // 2. The Proxy Swarm
  try {
    const rawData: any = await fetchWithSwarm(BOOTSTRAP_URL);

    if (rawData && rawData.elements && rawData.teams) {
      // 3. ATOMIC PRUNING & FILTERING
      
      // Step A: Filter Teams (Remove Unavailable/Superettan teams)
      const rawTeams = rawData.teams.map((t: any) => ({ 
          id: t.id, 
          name: t.name, 
          short_name: t.short_name,
          position: t.position,
          points: t.points,
          played: t.played,
          win: t.win,
          draw: t.draw,
          loss: t.loss,
          goal_difference: t.goal_difference,
          strength: t.strength,
          unavailable: t.unavailable
      }));

      const activeTeams = rawTeams.filter((t: Team) => !t.unavailable);
      
      if (activeTeams.length !== 16) {
        console.warn(`Architect Data Warning: Expected 16 active teams, found ${activeTeams.length}. Please verify API source.`);
      }

      const activeTeamIds = new Set(activeTeams.map((t: Team) => t.id));

      // Step B: Filter Elements (Only include players from active teams)
      const elements = rawData.elements
        .filter((p: any) => activeTeamIds.has(p.team))
        .map((p: any) => ({
          id: p.id,
          first_name: p.first_name,
          second_name: p.second_name,
          web_name: p.web_name,
          team: p.team,
          element_type: p.element_type,
          now_cost: Number(p.now_cost),
          ep_next: p.ep_next || "0.0",
          total_points: Number(p.total_points),
          selected_by_percent: p.selected_by_percent,
          status: p.status,
          news: p.news,
          chance_of_playing_next_round: p.chance_of_playing_next_round,
          form: p.form,
          points_per_game: p.points_per_game,
          minutes: p.minutes,
          goals_scored: p.goals_scored,
          assists: p.assists,
          key_passes: p.key_passes,
          clearances_blocks_interceptions: p.clearances_blocks_interceptions,
          attacking_bonus: p.attacking_bonus,
          defending_bonus: p.defending_bonus,
          yellow_cards: p.yellow_cards,
          red_cards: p.red_cards
        }));

      const prunedData: BootstrapData = {
        elements,
        teams: activeTeams,
        element_types: [],
        events: rawData.events
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(prunedData));
      return { data: prunedData, isLive: true };
    }
  } catch (err) {
    console.warn('Architect: Network swarm timed out or failed. Using secondary logic.');
  }

  // 4. Recovery Path
  if (cachedData) {
    return { data: cachedData, isLive: false, isCached: true };
  }
  
  return { data: getRealFallbackData(), isLive: false };
}

function getRealFallbackData(): BootstrapData {
  return { elements: [], teams: [], element_types: [] };
}