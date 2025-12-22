export interface InviteToken {
  _id?: string;
  token: string;
  createdBy: string;
  createdByName: string;
  email?: string; // Optional: if invite is for specific email
  used: boolean;
  usedBy?: string;
  usedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
}
