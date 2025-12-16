// In-memory storage for development - easily replaceable with MongoDB
interface StorageRecord {
  _id: string;
  [key: string]: any;
}

class InMemoryStorage {
  private collections: { [key: string]: Map<string, StorageRecord> } = {};

  constructor() {
    this.collections = {
      users: new Map(),
      families: new Map(),
      familynodes: new Map(),
      events: new Map(),
      stalls: new Map(),
      points: new Map(),
      sales: new Map(),
      admincodes: new Map(),
      tokens: new Map(),
      transactions: new Map(),
      stallvisits: new Map(),
    };
  }

  createId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  async find(collection: string, filter: any): Promise<StorageRecord[]> {
    const col = this.collections[collection.toLowerCase()] || new Map();
    const results: StorageRecord[] = [];

    for (const [, doc] of col) {
      let matches = true;
      for (const [key, value] of Object.entries(filter)) {
        if (doc[key] !== value) {
          matches = false;
          break;
        }
      }
      if (matches) results.push(doc);
    }
    return results;
  }

  async findOne(collection: string, filter: any): Promise<StorageRecord | null> {
    const results = await this.find(collection, filter);
    return results.length > 0 ? results[0] : null;
  }

  async findById(collection: string, id: string): Promise<StorageRecord | null> {
    const col = this.collections[collection.toLowerCase()];
    return col ? col.get(id) || null : null;
  }

  async create(collection: string, data: any): Promise<StorageRecord> {
    const id = this.createId();
    const doc: StorageRecord = {
      _id: id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const col = this.collections[collection.toLowerCase()] || new Map();
    col.set(id, doc);
    this.collections[collection.toLowerCase()] = col;
    return doc;
  }

  async updateOne(collection: string, filter: any, update: any): Promise<StorageRecord | null> {
    const col = this.collections[collection.toLowerCase()] || new Map();
    for (const [id, doc] of col) {
      let matches = true;
      for (const [key, value] of Object.entries(filter)) {
        if (doc[key] !== value) {
          matches = false;
          break;
        }
      }
      if (matches) {
        const updated = { ...doc, ...update, updatedAt: new Date() };
        col.set(id, updated);
        return updated;
      }
    }
    return null;
  }

  async update(collection: string, id: string, update: any): Promise<StorageRecord | null> {
    const col = this.collections[collection.toLowerCase()];
    if (!col) return null;
    
    const doc = col.get(id);
    if (!doc) return null;
    
    const updated = { ...doc, ...update, updatedAt: new Date() };
    col.set(id, updated);
    return updated;
  }

  async deleteOne(collection: string, filter: any): Promise<boolean> {
    const col = this.collections[collection.toLowerCase()] || new Map();
    for (const [id, doc] of col) {
      let matches = true;
      for (const [key, value] of Object.entries(filter)) {
        if (doc[key] !== value) {
          matches = false;
          break;
        }
      }
      if (matches) {
        col.delete(id);
        return true;
      }
    }
    return false;
  }

  async deleteMany(collection: string, filter: any): Promise<{ deletedCount: number }> {
    const col = this.collections[collection.toLowerCase()] || new Map();
    let deletedCount = 0;
    const idsToDelete: string[] = [];

    for (const [id, doc] of col) {
      let matches = true;
      for (const [key, value] of Object.entries(filter)) {
        // Handle $ne operator
        if (typeof value === 'object' && value !== null && '$ne' in value) {
          if (doc[key] === value.$ne) {
            matches = false;
            break;
          }
        } else {
          if (doc[key] !== value) {
            matches = false;
            break;
          }
        }
      }
      if (matches) {
        idsToDelete.push(id);
      }
    }

    for (const id of idsToDelete) {
      col.delete(id);
      deletedCount++;
    }

    return { deletedCount };
  }

  async aggregate(collection: string, pipeline: any[]): Promise<any[]> {
    let col = this.collections[collection.toLowerCase()] || new Map();
    let results = Array.from(col.values());

    for (const stage of pipeline) {
      if (stage.$match) {
        results = results.filter((doc) => {
          for (const [key, value] of Object.entries(stage.$match)) {
            if (doc[key] !== value) return false;
          }
          return true;
        });
      } else if (stage.$group) {
        const grouped: any = {};
        for (const doc of results) {
          const key = stage.$group._id ? JSON.stringify(doc[stage.$group._id]) : 'all';
          if (!grouped[key]) {
            const { _id, ...docWithoutId } = doc;
            grouped[key] = { _id: stage.$group._id ? doc[stage.$group._id] : null, ...docWithoutId };
          }
          for (const [field, expr] of Object.entries(stage.$group)) {
            if (field !== '_id' && typeof expr === 'object') {
              const exprObj = expr as any;
              if (exprObj.$sum) {
                grouped[key][field] = (grouped[key][field] || 0) + doc[exprObj.$sum];
              }
            }
          }
        }
        results = Object.values(grouped);
      } else if (stage.$sort) {
        results.sort((a, b) => {
          for (const [field, order] of Object.entries(stage.$sort)) {
            if (a[field] < b[field]) return order as number;
            if (a[field] > b[field]) return -(order as number);
          }
          return 0;
        });
      } else if (stage.$limit) {
        results = results.slice(0, stage.$limit);
      }
    }

    return results;
  }

  async clear(): Promise<void> {
    for (const col of Object.keys(this.collections)) {
      this.collections[col].clear();
    }
  }
}

export const inMemoryDb = new InMemoryStorage();

// Export the appropriate storage based on environment variable
import { mongoDb } from './mongoStorage';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const storageMode = process.env.STORAGE_MODE || 'memory';
export const db = storageMode === 'mongodb' ? mongoDb : inMemoryDb;

console.log(`📦 Storage mode: ${storageMode === 'mongodb' ? 'MongoDB' : 'In-Memory'}`);
