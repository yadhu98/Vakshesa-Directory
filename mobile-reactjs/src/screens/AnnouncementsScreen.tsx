import React, { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react';
import { Plus, X, Edit2, Trash2, Link as LinkIcon } from 'feather-icons-react';
import AppHeader from '../components/AppHeader';
import { announcementService, isAdminUser, userService } from '../services/api';

type TaggedUser = { _id: string; firstName: string; lastName: string; [key: string]: any };
type Announcement = { _id: string; title?: string; content: string; url?: string; linkPreview?: { title: string; description: string; thumbnailUrl?: string }; images: { name: string; mimeType: string; data: string }[]; taggedUsers?: TaggedUser[]; taggedUserIds?: string[]; authorName: string; publishedAt: string; updatedAt: string };
const panel: React.CSSProperties = { background: '#fff', border: '1px solid #e5e5e5', borderRadius: 14, padding: 16, marginBottom: 14 };
const button: React.CSSProperties = { border: 0, borderRadius: 8, padding: '10px 14px', fontWeight: 600, cursor: 'pointer' };

const AnnouncementsScreen: React.FC = () => {
  const admin = isAdminUser();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [keptImages, setKeptImages] = useState<Announcement['images']>([]);
  const [tagged, setTagged] = useState<TaggedUser[]>([]);
  const [search, setSearch] = useState('');
  const [matches, setMatches] = useState<TaggedUser[]>([]);
  const [saving, setSaving] = useState(false);
  const [lightbox, setLightbox] = useState('');
  const [profileMember, setProfileMember] = useState<TaggedUser | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const response = await announcementService.list(); setItems(response.data?.announcements || []); }
    catch (err: any) { setError(err?.response?.data?.message || 'Could not load announcements'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!admin || search.trim().length < 2) { setMatches([]); return; }
    let live = true;
    userService.searchUsers(search, 30).then(res => { if (live) setMatches((res.data?.results || []).map((u: any) => ({ _id: u._id || u.id, firstName: u.firstName, lastName: u.lastName })).filter((u: TaggedUser) => u._id)); }).catch(() => { if (live) setMatches([]); });
    return () => { live = false; };
  }, [admin, search]);

  const openCreate = () => { setEditing(null); setTitle(''); setContent(''); setUrl(''); setImages([]); setKeptImages([]); setTagged([]); setError(''); setFormVisible(true); };
  const openEdit = (item: Announcement) => { setEditing(item); setTitle(item.title || ''); setContent(item.content || ''); setUrl(item.url || ''); setImages([]); setKeptImages(item.images || []); setTagged(item.taggedUsers || []); setError(''); setFormVisible(true); };
  const chooseImages = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    if (selected.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) { setError('Choose JPG, PNG, or WEBP images'); event.target.value = ''; return; }
    if (selected.some(file => file.size > 5 * 1024 * 1024)) { setError('Each image must be 5 MB or smaller'); event.target.value = ''; return; }
    if (selected.length + keptImages.length + images.length > 8) { setError('You can attach up to 8 images'); event.target.value = ''; return; }
    setImages(previous => [...previous, ...selected]); event.target.value = '';
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError('');
    const form = new FormData(); form.append('title', title); form.append('content', content); form.append('url', url);
    form.append('taggedUserIds', JSON.stringify(tagged.map(user => user._id)));
    form.append('existingImageIndexes', JSON.stringify(keptImages.map(image => editing?.images.findIndex(original => original.data === image.data)).filter((index): index is number => index !== undefined && index >= 0)));
    images.forEach(file => form.append('images', file));
    try {
      await announcementService.save(form, editing?._id);
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      setEditing(null); setFormVisible(false); await load();
      document.getElementById('root')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
    catch (err: any) { setError(err?.response?.data?.message || 'Could not save announcement'); }
    finally { setSaving(false); }
  };
  const remove = async (item: Announcement) => {
    if (!window.confirm('Delete this announcement? This cannot be undone.')) return;
    try { await announcementService.remove(item._id); setItems(current => current.filter(entry => entry._id !== item._id)); }
    catch (err: any) { setError(err?.response?.data?.message || 'Could not delete announcement'); }
  };
  const openTaggedProfile = async (user: TaggedUser) => {
    setProfileMember(user); setProfileLoading(true); setProfileError('');
    try {
      const response = await userService.getUserProfile(user._id);
      setProfileMember(response.data?.user || response.data);
    } catch (err: any) {
      setProfileError(err?.response?.data?.message || 'Could not load this profile');
    } finally { setProfileLoading(false); }
  };

  return <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: 76 }}>
    <AppHeader title="Announcements" />
    <main style={{ maxWidth: 650, margin: '0 auto', padding: 16 }}>
      {admin && !editing && <button style={{ ...button, width: '100%', background: '#111', color: '#fff', marginBottom: 16 }} onClick={openCreate}><Plus size={17} style={{ verticalAlign: 'middle', marginRight: 6 }} />Create Announcement</button>}
      {error && <div role="alert" style={{ ...panel, color: '#b42318' }}>{error}</div>}
      {admin && formVisible && <form onSubmit={submit} style={panel}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2 style={{ fontSize: 18, margin: 0 }}>{editing ? 'Edit announcement' : 'Create announcement'}</h2><button type="button" aria-label="Close" onClick={() => { setFormVisible(false); setEditing(null); }} style={{ ...button, background: 'transparent' }}><X size={20} /></button></div>
        <label style={{ display: 'block', marginTop: 14, fontSize: 13 }}>Title (optional)<input value={title} onChange={e => setTitle(e.target.value)} maxLength={160} style={inputStyle} /></label>
        <label style={{ display: 'block', marginTop: 12, fontSize: 13 }}>Announcement text<textarea value={content} onChange={e => setContent(e.target.value)} rows={5} maxLength={10000} placeholder="Write in English, മലയാളം, or both" style={{ ...inputStyle, resize: 'vertical' }} /></label>
        <label style={{ display: 'block', marginTop: 12, fontSize: 13 }}>Link<input value={url} onChange={e => setUrl(e.target.value)} type="url" placeholder="https://example.com" style={inputStyle} /></label>
        <label style={{ display: 'block', marginTop: 12, fontSize: 13 }}>Images (JPG, PNG, WEBP; up to 5 MB each)<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={chooseImages} style={{ display: 'block', marginTop: 7 }} /></label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>{keptImages.map((image, index) => <div key={image.data} style={{ position: 'relative' }}><img src={image.data} alt={image.name} style={thumbStyle} /><button type="button" onClick={() => setKeptImages(current => current.filter((_, i) => i !== index))} style={removePill} aria-label="Remove attached image"><X size={15} /></button></div>)}{images.map((image, index) => <div key={`${image.name}-${index}`} style={{ position: 'relative' }}><span style={{ ...thumbStyle, display: 'grid', placeItems: 'center', background: '#eee', fontSize: 11 }}>{image.name}</span><button type="button" onClick={() => setImages(current => current.filter((_, i) => i !== index))} style={removePill} aria-label="Remove selected image"><X size={15} /></button></div>)}</div>
        <label style={{ display: 'block', marginTop: 12, fontSize: 13 }}>Tag family members<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name" style={inputStyle} /></label>
        {matches.length > 0 && <div style={{ border: '1px solid #ddd', borderRadius: 8, maxHeight: 130, overflow: 'auto' }}>{matches.filter(match => !tagged.some(user => user._id === match._id)).map(user => <button type="button" key={user._id} onClick={() => { setTagged(old => [...old, user]); setSearch(''); setMatches([]); }} style={{ ...button, display: 'block', width: '100%', textAlign: 'left', background: '#fff', borderRadius: 0 }}>{user.firstName} {user.lastName}</button>)}</div>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>{tagged.map(user => <span key={user._id} style={{ background: '#eee', borderRadius: 18, padding: '5px 9px', fontSize: 12 }}>{user.firstName} {user.lastName} <button type="button" aria-label={`Remove ${user.firstName}`} onClick={() => setTagged(old => old.filter(entry => entry._id !== user._id))} style={{ border: 0, background: 'transparent', cursor: 'pointer' }}>×</button></span>)}</div>
        <button disabled={saving} type="submit" style={{ ...button, marginTop: 16, background: '#111', color: '#fff', width: '100%', opacity: saving ? .6 : 1 }}>{saving ? 'Saving…' : editing ? 'Save / Update' : 'Publish announcement'}</button>
      </form>}
      {loading ? <div style={{ ...panel, textAlign: 'center', color: '#666' }}>Loading announcements…</div> : items.length === 0 ? <div style={{ ...panel, textAlign: 'center', color: '#666' }}>No announcements yet.</div> : items.map(item => <article key={item._id} style={panel}>
        {admin && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><button aria-label="Edit announcement" onClick={() => openEdit(item)} style={{ ...button, background: '#f3f3f3', padding: 8 }}><Edit2 size={16} /></button><button aria-label="Delete announcement" onClick={() => remove(item)} style={{ ...button, background: '#fff0f0', color: '#a22', padding: 8 }}><Trash2 size={16} /></button></div>}
        {item.title && <h2 style={{ margin: '4px 0 8px', fontSize: 19 }}>{item.title}</h2>}
        <div style={{ color: '#666', fontSize: 12, marginBottom: 12 }}>{item.authorName} · {new Date(item.publishedAt).toLocaleString()}</div>
        {item.content && <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55, margin: '0 0 12px' }}>{item.content}</p>}
        {!!item.images?.length && <div style={{ display: 'grid', gridTemplateColumns: item.images.length === 1 ? '1fr' : 'repeat(2, 1fr)', gap: 6, marginBottom: 12 }}>{item.images.map((image, index) => <button key={`${index}-${image.name}`} onClick={() => setLightbox(image.data)} style={{ padding: 0, border: 0, background: 'transparent', cursor: 'zoom-in' }}><img src={image.data} alt={image.name || 'Announcement attachment'} style={{ width: '100%', maxHeight: 340, objectFit: 'cover', borderRadius: 8 }} /></button>)}</div>}
        {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', border: '1px solid #e4e4e4', borderRadius: 9, color: '#164e86', textDecoration: 'none', overflow: 'hidden' }}>{item.linkPreview?.thumbnailUrl && <img src={item.linkPreview.thumbnailUrl} alt="Video preview" style={{ display: 'block', width: '100%', maxHeight: 320, objectFit: 'cover', background: '#111' }} />}<div style={{ padding: 12, overflowWrap: 'anywhere' }}><div style={{ fontWeight: 600 }}>{item.linkPreview?.title || <><LinkIcon size={16} style={{ verticalAlign: 'middle', marginRight: 7 }} />{new URL(item.url).hostname}</>}</div>{item.linkPreview?.description && <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>{item.linkPreview.description}</div>}<div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{item.url}</div></div></a>}
        {!!item.taggedUsers?.length && <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 12, color: '#555', fontSize: 13 }}><span>Tagged:</span>{item.taggedUsers.map(user => <button key={user._id} type="button" onClick={() => openTaggedProfile(user)} style={{ border: 0, padding: 0, background: 'transparent', color: '#164e86', textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}>{user.firstName} {user.lastName}</button>)}</div>}
      </article>)}
    </main>
    {lightbox && <button aria-label="Close image" onClick={() => setLightbox('')} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,.88)', border: 0, display: 'grid', placeItems: 'center', cursor: 'zoom-out' }}><img src={lightbox} alt="Expanded announcement" style={{ maxWidth: '95vw', maxHeight: '92vh', objectFit: 'contain' }} /></button>}
    {profileMember && <div role="presentation" onClick={() => { setProfileMember(null); setProfileError(''); }} style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <section role="dialog" aria-modal="true" aria-label={`${profileMember.firstName} ${profileMember.lastName} profile`} onClick={event => event.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 380, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 4px 24px rgba(0,0,0,.2)', padding: 24, position: 'relative' }}>
        <button type="button" aria-label="Close profile" onClick={() => { setProfileMember(null); setProfileError(''); }} style={{ position: 'absolute', right: 12, top: 12, border: 0, borderRadius: 18, width: 34, height: 34, background: '#f2f2f2', cursor: 'pointer', fontSize: 20 }}>×</button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0 18px', textAlign: 'center' }}>
          {profileMember.profilePicture ? <img src={profileMember.profilePicture} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', marginBottom: 12 }} /> : <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#111', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 700, marginBottom: 12 }}>{profileMember.firstName?.[0]}{profileMember.lastName?.[0]}</div>}
          <strong style={{ fontSize: 20, color: '#111' }}>{profileMember.firstName} {profileMember.lastName}</strong>
          {profileMember.email && <span style={{ fontSize: 14, color: '#666', marginTop: 4 }}>{profileMember.email}</span>}
          <span style={{ fontSize: 13, color: '#999', marginTop: 6 }}>{profileMember.role ? `${profileMember.role[0].toUpperCase()}${profileMember.role.slice(1)}` : 'Member'}</span>
        </div>
        {profileLoading ? <p style={{ textAlign: 'center', color: '#666' }}>Loading profile…</p> : profileError ? <p role="alert" style={{ color: '#b42318', textAlign: 'center' }}>{profileError}</p> : <>
          <div style={{ display: 'grid', gap: 8, borderTop: '1px solid #eee', paddingTop: 14, color: '#333', fontSize: 14 }}>
            {profileMember.phone && <div>📞 {profileMember.phone}</div>}{profileMember.house && <div>🏠 {profileMember.house}</div>}{profileMember.gender && <div>👤 {profileMember.gender[0].toUpperCase()}{profileMember.gender.slice(1)}</div>}{profileMember.occupation && <div>💼 {profileMember.occupation}</div>}{profileMember.address && <div>📍 {profileMember.address}</div>}
          </div>
          {(profileMember.linkedin || profileMember.instagram || profileMember.facebook) && <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 14, paddingTop: 12, borderTop: '1px solid #eee' }}>{profileMember.linkedin && <a href={profileMember.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>}{profileMember.instagram && <a href={profileMember.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>}{profileMember.facebook && <a href={profileMember.facebook} target="_blank" rel="noopener noreferrer">Facebook</a>}</div>}
        </>}
      </section>
    </div>}
  </div>;
};

const inputStyle: React.CSSProperties = { display: 'block', boxSizing: 'border-box', width: '100%', marginTop: 6, padding: '10px 11px', border: '1px solid #ccc', borderRadius: 8, font: 'inherit', fontSize: 16 };
const thumbStyle: React.CSSProperties = { width: 76, height: 66, objectFit: 'cover', borderRadius: 6 };
const removePill: React.CSSProperties = { position: 'absolute', top: -6, right: -6, border: 0, background: '#222', color: '#fff', borderRadius: 12, width: 22, height: 22, display: 'grid', placeItems: 'center', cursor: 'pointer' };

export default AnnouncementsScreen;
