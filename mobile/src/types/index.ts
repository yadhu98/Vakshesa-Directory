export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  familyId: string;
  profilePicture?: string;
}

export interface Family {
  id: string;
  name: string;
  members: string[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  totalPoints: number;
  profilePicture?: string;
}

export interface UserPoints {
  userId: string;
  totalPoints: number;
}
