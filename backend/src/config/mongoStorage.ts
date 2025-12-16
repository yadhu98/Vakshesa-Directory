import mongoose, { Model, Document } from 'mongoose';
import { User } from '../models/User';
import { Family } from '../models/Family';
import { FamilyNode } from '../models/FamilyNode';
import { Event } from '../models/Event';
import { Stall } from '../models/Stall';
import { Point } from '../models/Point';
import { Sale } from '../models/Sale';
import { TokenModel } from '../models/Token';
import { CarnivalStall } from '../models/CarnivalStall';
import { StallParticipation } from '../models/StallParticipation';
import { AdminCode } from '../models/AdminCode';
import { Transaction } from '../models/Transaction';
import { StallVisit } from '../models/StallVisit';

// Storage interface to match in-memory storage
interface StorageRecord {
  _id?: string;
  [key: string]: any;
}

class MongoDBStorage {
  private models: { [key: string]: Model<any> } = {};

  constructor() {
    // Map collection names to Mongoose models
    this.models = {
      users: User as any,
      families: Family as any,
      familynodes: FamilyNode as any,
      events: Event as any,
      stalls: Stall as any,
      points: Point as any,
      sales: Sale as any,
      tokens: TokenModel as any,
      carnivalstalls: CarnivalStall as any,
      stallparticipations: StallParticipation as any,
      admincodes: AdminCode as any,
      transactions: Transaction as any,
      stallvisits: StallVisit as any,
      // For collections without models, we'll create them dynamically
    };
  }

  private getModel(collection: string): Model<any> {
    const collectionLower = collection.toLowerCase();
    
    // Return existing model if available
    if (this.models[collectionLower]) {
      return this.models[collectionLower];
    }

    // Create a dynamic schema for unmapped collections
    const schema = new mongoose.Schema({}, { strict: false, timestamps: true });
    const model = mongoose.model(collection, schema);
    this.models[collectionLower] = model;
    return model;
  }

  createId(): string {
    return new mongoose.Types.ObjectId().toString();
  }

  async find(collection: string, filter: any = {}): Promise<StorageRecord[]> {
    try {
      const model = this.getModel(collection);
      const results = await model.find(filter).lean();
      return results.map((doc: any) => ({
        ...doc,
        _id: doc._id?.toString() || doc._id,
      }));
    } catch (error) {
      console.error(`Error finding in ${collection}:`, error);
      return [];
    }
  }

  async findOne(collection: string, filter: any): Promise<StorageRecord | null> {
    try {
      const model = this.getModel(collection);
      const result: any = await model.findOne(filter).lean();
      if (!result) return null;
      return {
        ...result,
        _id: result._id?.toString() || result._id,
      };
    } catch (error) {
      console.error(`Error finding one in ${collection}:`, error);
      return null;
    }
  }

  async findById(collection: string, id: string): Promise<StorageRecord | null> {
    try {
      const model = this.getModel(collection);
      const result: any = await model.findById(id).lean();
      if (!result) return null;
      return {
        ...result,
        _id: result._id?.toString() || result._id,
      };
    } catch (error) {
      console.error(`Error finding by ID in ${collection}:`, error);
      return null;
    }
  }

  async create(collection: string, data: any): Promise<StorageRecord> {
    try {
      const model = this.getModel(collection);
      // Remove _id if provided - let MongoDB generate it
      const { _id, ...dataWithoutId } = data;
      const doc = new model(dataWithoutId);
      const saved = await doc.save();
      const result = saved.toObject();
      return {
        ...result,
        _id: result._id?.toString() || result._id,
      };
    } catch (error) {
      console.error(`Error creating in ${collection}:`, error);
      throw error;
    }
  }

  async updateOne(collection: string, filter: any, update: any): Promise<StorageRecord | null> {
    try {
      const model = this.getModel(collection);
      const result: any = await model.findOneAndUpdate(
        filter,
        { $set: { ...update, updatedAt: new Date() } },
        { new: true, runValidators: false }
      ).lean();
      if (!result) return null;
      return {
        ...result,
        _id: result._id?.toString() || result._id,
      };
    } catch (error) {
      console.error(`Error updating one in ${collection}:`, error);
      return null;
    }
  }

  async update(collection: string, id: string, update: any): Promise<StorageRecord | null> {
    try {
      const model = this.getModel(collection);
      const result: any = await model.findByIdAndUpdate(
        id,
        { $set: { ...update, updatedAt: new Date() } },
        { new: true, runValidators: false }
      ).lean();
      if (!result) return null;
      return {
        ...result,
        _id: result._id?.toString() || result._id,
      };
    } catch (error) {
      console.error(`Error updating in ${collection}:`, error);
      return null;
    }
  }

  async deleteOne(collection: string, filter: any): Promise<boolean> {
    try {
      const model = this.getModel(collection);
      const result = await model.deleteOne(filter);
      return result.deletedCount > 0;
    } catch (error) {
      console.error(`Error deleting one in ${collection}:`, error);
      return false;
    }
  }

  async deleteMany(collection: string, filter: any): Promise<{ deletedCount: number }> {
    try {
      const model = this.getModel(collection);
      const result = await model.deleteMany(filter);
      return { deletedCount: result.deletedCount || 0 };
    } catch (error) {
      console.error(`Error deleting many in ${collection}:`, error);
      return { deletedCount: 0 };
    }
  }

  async aggregate(collection: string, pipeline: any[]): Promise<any[]> {
    try {
      const model = this.getModel(collection);
      const results = await model.aggregate(pipeline);
      return results.map((doc: any) => ({
        ...doc,
        _id: doc._id?.toString() || doc._id,
      }));
    } catch (error) {
      console.error(`Error aggregating in ${collection}:`, error);
      return [];
    }
  }

  async clear(): Promise<void> {
    try {
      // Clear all collections (use with caution!)
      if (mongoose.connection.db) {
        const collections = await mongoose.connection.db.collections();
        for (const collection of collections) {
          await collection.deleteMany({});
        }
        console.log('✅ All collections cleared');
      }
    } catch (error) {
      console.error('❌ Error clearing collections:', error);
    }
  }
}

export const mongoDb = new MongoDBStorage();
