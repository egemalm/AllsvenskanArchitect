
export enum ElementType {
  GK = 1,
  DEF = 2,
  MID = 3,
  FWD = 4
}

export interface Player {
  id: number;
  first_name: string;
  second_name: string;
  web_name: string;
  team: number;
  element_type: ElementType;
  now_cost: number;
  ep_next: string;
  total_points: number;
  selected_by_percent: string;
  // Advanced stats fields
  status: string;
  news: string;
  chance_of_playing_next_round: number | null;
  form: string;
  points_per_game: string;
  minutes: number;
  goals_scored: number;
  assists: number;
  key_passes: number;
  clearances_blocks_interceptions: number;
  attacking_bonus: number;
  defending_bonus: number;
  yellow_cards: number;
  red_cards: number;
}

export interface Team {
  id: number;
  name: string;
  short_name: string;
  position: number;
  points: number;
  played: number;
  win: number;
  draw: number;
  loss: number;
  goal_difference: number;
  strength: number;
  unavailable: boolean;
}

export interface Fixture {
  id: number;
  event: number | null; // Gameweek
  team_h: number;
  team_a: number;
  team_h_score: number | null;
  team_a_score: number | null;
  team_h_difficulty: number;
  team_a_difficulty: number;
  kickoff_time: string | null;
  finished: boolean;
  started: boolean;
}

export interface BootstrapData {
  elements: Player[];
  teams: Team[];
  element_types: any[];
  events?: any[]; // For gameweek info
}

export interface SquadSlot {
  id: string; // Internal unique ID for the slot
  type: ElementType;
  isStarter: boolean;
  player: Player | null;
}

export interface SquadState {
  slots: SquadSlot[];
  bank: number;
}

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet: string;
  source: string;
  guid: string;
}
