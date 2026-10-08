import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { db } from '../config/storage';
import https from 'https';

type LinkPreview = { title: string; description: string; thumbnailUrl?: string };

const youtubeVideoId = (value: string): string | null => {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'youtu.be') return parsed.pathname.split('/').filter(Boolean)[0] || null;
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      return parsed.searchParams.get('v') || parsed.pathname.match(/^\/(?:shorts|embed|live)\/([^/?]+)/)?.[1] || null;
    }
  } catch {}
  return null;
};

const getYoutubePreview = async (url?: string): Promise<LinkPreview | undefined> => {
  if (!url) return undefined;
  const videoId = youtubeVideoId(url);
  if (!videoId || !/^[\w-]{6,20}$/.test(videoId)) return undefined;
  const fallback: LinkPreview = { title: 'YouTube video', description: 'Watch this video on YouTube', thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` };
  const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
  return new Promise(resolve => {
    const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`;
    const request = https.get(endpoint, { headers: { 'User-Agent': 'VakshesaDirectory/1.0' } }, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { body += chunk; if (body.length > 64 * 1024) request.destroy(); });
      response.on('end', () => {
        try {
          if (response.statusCode !== 200) { resolve(fallback); return; }
          const data = JSON.parse(body);
          resolve({ title: String(data.title || fallback.title), description: data.author_name ? `${data.author_name} on YouTube` : fallback.description, thumbnailUrl: String(data.thumbnail_url || fallback.thumbnailUrl) });
        } catch { resolve(fallback); }
      });
    });
    request.setTimeout(2500, () => request.destroy());
    request.on('error', () => resolve(fallback));
  });
};
const cleanUrl = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  try {
    const parsed = new URL(value.trim());
    if (!['http:', 'https:'].includes(parsed.protocol)) return undefined;
    return parsed.toString();
  } catch { return undefined; }
};

const list = async (req: AuthRequest, res: Response): Promise<void> => {
  const items = await db.find('announcements', { familyId: req.user?.familyId, isPublished: true });
  items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const enriched = await Promise.all(items.map(async item => {
    const tags = await Promise.all((item.taggedUserIds || []).map((id: string) => db.findById('users', id)));
    return { ...item, linkPreview: item.linkPreview || await getYoutubePreview(item.url), taggedUsers: tags.filter((u: any) => u && u.familyId === req.user?.familyId && u.isActive !== false && u.membershipStatus === 'Approved').map((u: any) => ({ _id: u._id, firstName: u.firstName, lastName: u.lastName })) };
  }));
  res.json({ announcements: enriched });
};

const save = async (req: AuthRequest, res: Response, existing?: any): Promise<void> => {
  const title = String(req.body.title || '').trim();
  const content = String(req.body.content || '').trim();
  const urlInput = String(req.body.url || '').trim();
  const eventDateInput = String(req.body.eventDate || '').trim();
  const eventStartTimeInput = String(req.body.eventStartTime || '').trim();
  const eventEndTimeInput = String(req.body.eventEndTime || '').trim();
  const url = cleanUrl(urlInput);
  if (urlInput && !url) { res.status(400).json({ message: 'Enter a valid http or https URL' }); return; }
  const eventDate = eventDateInput || undefined;
  const isValidEventDate = !!eventDate && /^\d{4}-\d{2}-\d{2}$/.test(eventDate) && !Number.isNaN(Date.parse(`${eventDate}T00:00:00.000Z`)) && new Date(`${eventDate}T00:00:00.000Z`).toISOString().slice(0, 10) === eventDate;
  if (eventDate && !isValidEventDate) { res.status(400).json({ message: 'Choose a valid event date' }); return; }
  const validTime = (value: string) => !value || /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
  if (!validTime(eventStartTimeInput) || !validTime(eventEndTimeInput)) { res.status(400).json({ message: 'Enter a valid event time' }); return; }
  let currentImages: any[] = [];
  if (existing) {
    let imageIndexes: number[];
    try {
      const parsedIndexes = JSON.parse(req.body.existingImageIndexes || '[]');
      if (!Array.isArray(parsedIndexes)) throw new Error('Image indexes must be an array');
      imageIndexes = [...new Set<number>(parsedIndexes.map(Number).filter((index: number) => Number.isInteger(index) && index >= 0))];
    } catch { res.status(400).json({ message: 'Invalid image selection' }); return; }
    const prior = Array.isArray(existing.images) ? existing.images : [];
    currentImages = imageIndexes.map(index => prior[index]).filter((image: any) => image && typeof image.data === 'string');
  }
  const uploadedFiles = (req.files || []) as Express.Multer.File[];
  const imageBytes = uploadedFiles.reduce((total, file) => total + file.size, currentImages.reduce((sum, image) => sum + Math.floor(String(image.data).length * 0.75), 0));
  if (imageBytes > 10 * 1024 * 1024) { res.status(400).json({ message: 'The combined image size must be 10 MB or smaller' }); return; }
  const addedImages = uploadedFiles.map(file => ({ name: file.originalname, mimeType: file.mimetype, data: `data:${file.mimetype};base64,${file.buffer.toString('base64')}` }));
  const images = [...currentImages, ...addedImages];
  if (!content && !images.length && !url) { res.status(400).json({ message: 'Add content, an image, or a link before publishing' }); return; }
  let taggedUserIds: string[] = [];
  try { taggedUserIds = Array.from(new Set<string>((JSON.parse(req.body.taggedUserIds || '[]') as unknown[]).map(id => String(id)))); } catch { res.status(400).json({ message: 'Invalid tagged users' }); return; }
  for (const id of taggedUserIds) {
    const user = await db.findById('users', id);
    if (!user || user.familyId !== req.user?.familyId || user.isActive === false || user.membershipStatus !== 'Approved') { res.status(400).json({ message: 'Tagged users must be active members of your family group' }); return; }
  }
  const author = await db.findById('users', String(req.user?.id));
  const linkPreview = await getYoutubePreview(url);
  const fields = { title, content, url, linkPreview, images, taggedUserIds, eventDate: eventDate || null, eventStartTime: eventDate ? eventStartTimeInput || null : null, eventEndTime: eventDate ? eventEndTimeInput || null : null, ...(existing ? {} : { familyId: req.user?.familyId, authorId: req.user?.id, authorName: `${author?.firstName || ''} ${author?.lastName || ''}`.trim(), publishedAt: new Date(), isPublished: true }) };
  const record = existing
    ? await db.updateOne('announcements', { _id: String(existing._id) }, fields)
    : await db.create('announcements', fields);
  res.status(existing ? 200 : 201).json({ announcement: record });
};

const create = async (req: AuthRequest, res: Response): Promise<void> => { await save(req, res); };
const update = async (req: AuthRequest, res: Response): Promise<void> => {
  const item = await db.findById('announcements', String(req.params.id));
  if (!item || item.familyId !== req.user?.familyId) { res.status(404).json({ message: 'Announcement not found' }); return; }
  await save(req, res, item);
};
const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  const item = await db.findById('announcements', String(req.params.id));
  if (!item || item.familyId !== req.user?.familyId) { res.status(404).json({ message: 'Announcement not found' }); return; }
  await db.deleteOne('announcements', { _id: String(item._id) });
  res.json({ message: 'Announcement deleted' });
};

export { list, create, update, remove };
