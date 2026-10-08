import { Schema, model } from 'mongoose';

export interface IAnnouncement {
  familyId: string;
  title?: string;
  content: string;
  url?: string;
  linkPreview?: { title: string; description: string; thumbnailUrl?: string };
  images: { name: string; mimeType: string; data: string }[];
  taggedUserIds: string[];
  authorId: string;
  authorName: string;
  publishedAt: Date;
  updatedAt: Date;
  isPublished: boolean;
}

const announcementSchema = new Schema<IAnnouncement>({
  familyId: { type: String, required: true, index: true },
  title: { type: String, trim: true, maxlength: 160 },
  content: { type: String, trim: true, maxlength: 10000, default: '' },
  url: { type: String, trim: true, maxlength: 2048 },
  linkPreview: {
    title: { type: String, trim: true, maxlength: 500 },
    description: { type: String, trim: true, maxlength: 1000 },
    thumbnailUrl: { type: String, trim: true, maxlength: 2048 },
  },
  images: [{ name: String, mimeType: String, data: String }],
  taggedUserIds: [{ type: String }],
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  publishedAt: { type: Date, required: true, default: Date.now, index: true },
  isPublished: { type: Boolean, default: true, index: true },
}, { timestamps: true });

announcementSchema.index({ familyId: 1, isPublished: 1, publishedAt: -1 });
export const Announcement = model<IAnnouncement>('Announcement', announcementSchema);
