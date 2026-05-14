export interface EA {
  id: string;
  name: string;
  type: string;
  category: string;
  price: number;
  profit: string;
  winrate: string;
  drawdown: string;
  pairs?: string;
  icon?: string;
  profileEmoji?: string;
  emojis?: string[];
  description: string;
  badge?: string;
  images?: string[];
  file_url?: string;
  fileUrl?: string;
  videoUrl?: string;
  status: 'active' | 'hidden';
  rating?: string;
  reviews?: number;
  version?: string;
  downloads?: number;
}

export interface Indicator {
  id: string;
  name: string;
  type: string;
  category?: string;
  price: number;
  icon?: string;
  profileEmoji?: string;
  description: string;
  features?: string[];
  images?: string[];
  file_url?: string;
  fileUrl?: string;
  videoUrl?: string;
  status: 'active' | 'hidden';
  profit?: string;
  winrate?: string;
  drawdown?: string;
  reviews?: number;
  version?: string;
  downloads?: number;
}
