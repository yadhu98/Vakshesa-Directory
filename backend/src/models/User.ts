import { Schema, model } from 'mongoose';

export type House = 'Kadannamanna' | 'Ayiranazhi' | 'Aripra' | 'Mankada';

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
  siblings?: string[]; // Array of siblings' user IDs
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
      unique: true,
      sparse: true,
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
    siblings: {
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
userSchema.index({ familyId: 1, generation: 1 });

export const User = model<IUser>('User', userSchema);
