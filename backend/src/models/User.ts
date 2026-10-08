import { Schema, model } from 'mongoose';

export type House = 'Kadannamanna' | 'Ayiranazhi' | 'Aripra' | 'Mankada';
export type MembershipStatus = 'Pending' | 'Approved' | 'Rejected';

export const DEFAULT_PRIVACY_SETTINGS: Record<string, 'family' | 'private'> = {
  email: 'private',
  phone: 'private',
  countryCode: 'private',
  dateOfBirth: 'private',
  gender: 'private',
  address: 'private',
  notes: 'private',
  linkedin: 'private',
  instagram: 'private',
  facebook: 'private',
  marriageDate: 'private',
  deathDate: 'private',
  firstName: 'family',
  lastName: 'family',
  profilePicture: 'family',
  house: 'family',
  occupation: 'family',
  generation: 'family',
  isAlive: 'family',
  fatherId: 'family',
  motherId: 'family',
  spouseId: 'family',
  children: 'family',
};

export interface IUser {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode?: string;
  password: string;
  role: 'user' | 'admin';
  isSuperUser?: boolean;
  membershipStatus?: MembershipStatus;
  privacySettings?: Record<string, 'family' | 'private'>;
  membershipReviewedBy?: string;
  membershipReviewedAt?: Date;
  membershipRejectionReason?: string;
  adminChangedBy?: string;
  adminChangedAt?: Date;
  familyId: string;
  house: House;
  profilePicture?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  isActive: boolean;
  
  // Family tree relationships
  fatherId?: string; // Reference to father's user ID
  motherId?: string; // Reference to mother's user ID
  spouseId?: string; // Reference to spouse's user ID
  children?: string[]; // Array of children's user IDs
  generation?: number; // Generation level (1 for oldest ancestors, increasing for descendants)
  isAlive?: boolean; // Whether the person is alive
  
  // Additional family info
  marriageDate?: Date;
  deathDate?: Date;
  occupation?: string;
  address?: string;
  notes?: string;
  
  // Social media links
  linkedin?: string;
  instagram?: string;
  facebook?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: false,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    countryCode: {
      type: String,
      default: '+91',
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isSuperUser: {
      type: Boolean,
      default: false,
    },
    membershipStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Approved',
      index: true,
    },
    privacySettings: {
      type: Schema.Types.Mixed,
      default: () => ({ ...DEFAULT_PRIVACY_SETTINGS }),
    },
    membershipReviewedBy: { type: String },
    membershipReviewedAt: { type: Date },
    membershipRejectionReason: { type: String, trim: true, maxlength: 500 },
    adminChangedBy: { type: String },
    adminChangedAt: { type: Date },
    familyId: {
      type: String,
      required: true,
      index: true,
    },
    house: {
      type: String,
      enum: ['Kadannamanna', 'Ayiranazhi', 'Aripra', 'Mankada'],
      required: true,
    },
    profilePicture: {
      type: String,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    
    // Family tree relationships
    fatherId: {
      type: String,
      index: true,
    },
    motherId: {
      type: String,
      index: true,
    },
    spouseId: {
      type: String,
      index: true,
    },
    children: {
      type: [String],
      default: [],
    },
    generation: {
      type: Number,
      default: 1,
      index: true,
    },
    isAlive: {
      type: Boolean,
      default: true,
    },
    
    // Additional family info
    marriageDate: {
      type: Date,
    },
    deathDate: {
      type: Date,
    },
    occupation: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    linkedin: {
      type: String,
      trim: true,
    },
    instagram: {
      type: String,
      trim: true,
    },
    facebook: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Index for fast lookups
userSchema.index({ role: 1 });
userSchema.index({ house: 1 });
userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: 'string' } } }
);
userSchema.index({ familyId: 1, generation: 1 });

export const User = model<IUser>('User', userSchema);
