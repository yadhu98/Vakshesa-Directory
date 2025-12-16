export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  familyId: string;
  isActive: boolean;
}

export interface Family {
  id: string;
  name: string;
  description?: string;
  members: string[];
  headOfFamily?: string;
}

export interface Point {
  id: string;
  userId: string;
  stallId: string;
  points: number;
  awardedAt: Date;
}

export interface Stall {
  id: string;
  name: string;
  type: 'food' | 'game' | 'shopping' | 'activity' | 'other';
  shopkeeperId: string;
  pointsPerTransaction: number;
}

export interface Sale {
  id: string;
  stallId: string;
  userId: string;
  amount: number;
  createdAt: Date;
}

export interface Event {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isPhase2Active: boolean;
  phase2StartDate?: Date;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  totalPoints: number;
  profilePicture?: string;
}
