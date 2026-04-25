// Global Types & Interfaces Definition Layer

export interface UserProfile {
  id: string;
  username: string;
  avatar?: string;
  coins: number;
  isVip: boolean;
}

export interface DramaMeta {
  id: string;
  title: string;
  coverImage: string;
  views: number;
  totalEpisodes: number;
}
