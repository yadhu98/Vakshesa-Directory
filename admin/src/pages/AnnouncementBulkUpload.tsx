import React, { ChangeEvent, useState } from 'react';
import { Download, FileSpreadsheet, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Layout } from '@components/Layout';
import axiosInstance from '@services/api';

type ImportRow = {
  rowNumber: number;
  title: string;
  content: string;
  eventDate?: string;
  eventStartTime?: string;
  eventEndTime?: string;
  url?: string;
};
type ImportError = { row: number; message: string };

const dateKey = (year: number, month: number, day: number): string | undefined => {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return undefined;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const parseDate = (value: unknown): string | undefined => {
  if (value === '' || value === null || value === undefined) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) return dateKey(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
  if (typeof value === 'number' && Number.isFinite(value)) {
    const parts = XLSX.SSF.parse_date_code(value);
    return parts ? dateKey(parts.y, parts.m, parts.d) : undefined;
  }
  const text = String(value).trim();
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return dateKey(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  const local = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (local) return dateKey(Number(local[3]), Number(local[2]), Number(local[1]));
  return undefined;
};

const parseTime = (value: unknown): string | undefined => {
  if (value === '' || value === null || value === undefined) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) return `${String(value.getUTCHours()).padStart(2, '0')}:${String(value.getUTCMinutes()).padStart(2, '0')}`;
  if (typeof value === 'number' && Number.isFinite(value)) {
    const minutes = Math.round((((value % 1) + 1) % 1) * 1440) % 1440;
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  }
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return undefined;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (minute > 59 || hour > (meridiem ? 12 : 23) || (meridiem && hour < 1)) return undefined;
  if (meridiem) hour = (hour % 12) + (meridiem === 'PM' ? 12 : 0);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const normalizeHeader = (value: unknown) => String(value || '').toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^a-z]/g, '');

const AnnouncementBulkUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ imported: number; events: number } | null>(null);

  const downloadTemplate = () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([[
      'Title', 'Description', 'Date (YYYY-MM-DD, optional)', 'Start Time (HH:MM, optional)', 'End Time (HH:MM, optional)', 'URL (optional)',
    ]]);
    sheet['!cols'] = [{ wch: 28 }, { wch: 46 }, { wch: 24 }, { wch: 26 }, { wch: 24 }, { wch: 42 }];
    XLSX.utils.book_append_sheet(workbook, sheet, 'Announcements');
    const instructions = XLSX.utils.aoa_to_sheet([
      ['Column', 'Required', 'Instructions', 'Example'],
      ['Title', 'Yes', 'Announcement or event title; maximum 160 characters.', 'Family Reunion'],
      ['Description', 'Yes unless URL is provided', 'Supports English, Malayalam, or mixed text; maximum 10,000 characters.', 'കുടുംബ സംഗമം'],
      ['Date', 'No', 'Enter an Excel date or YYYY-MM-DD. A date adds the post to Calendar.', '2026-12-25'],
      ['Start Time', 'No', 'Use HH:MM (24-hour) or an Excel time. Requires a Date.', '10:30'],
      ['End Time', 'No', 'Use HH:MM (24-hour) or an Excel time. Requires a Date.', '14:00'],
      ['URL', 'No', 'Use a full http:// or https:// link.', 'https://example.com'],
      [],
      ['Rows with a Date appear as events in Calendar and remain in Announcements. Rows without a Date are regular announcements.'],
      ['Do not rename the column headers in the Announcements sheet. Leave unused cells blank.'],
    ]);
    instructions['!cols'] = [{ wch: 24 }, { wch: 28 }, { wch: 78 }, { wch: 34 }];
    XLSX.utils.book_append_sheet(workbook, instructions, 'Instructions');
    XLSX.writeFile(workbook, 'vakshesa-announcement-events-template.xlsx');
  };

  const validateFile = async (selectedFile: File) => {
    setBusy(true);
    setFile(selectedFile);
    setRows([]);
    setErrors([]);
    setError('');
    setResult(null);
    try {
      if (selectedFile.size > 5 * 1024 * 1024) throw new Error('The file must be 5 MB or smaller.');
      const workbook = XLSX.read(await selectedFile.arrayBuffer(), { type: 'array', cellDates: true });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!firstSheet) throw new Error('The spreadsheet has no worksheet.');
      const matrix = XLSX.utils.sheet_to_json<any[]>(firstSheet, { header: 1, raw: true, defval: '' });
      if (!matrix.length) throw new Error('The first worksheet is empty.');
      const headers = (matrix[0] || []).map(normalizeHeader);
      const findColumn = (aliases: string[]) => headers.findIndex(header => aliases.includes(header));
      const columns = {
        title: findColumn(['title', 'announcementtitle']),
        description: findColumn(['description', 'content', 'announcementtext']),
        date: findColumn(['date', 'eventdate']),
        start: findColumn(['starttime', 'eventstarttime']),
        end: findColumn(['endtime', 'eventendtime']),
        url: findColumn(['url', 'link']),
      };
      if (columns.title < 0 || columns.description < 0) throw new Error('The first worksheet must include Title and Description columns. Use the downloadable template.');

      const nextRows: ImportRow[] = [];
      const nextErrors: ImportError[] = [];
      const sourceRows = matrix.slice(1).map((cells, index) => ({ cells, rowNumber: index + 2 }))
        .filter(({ cells }) => cells.some((value: unknown) => value !== '' && value !== null && value !== undefined));
      if (sourceRows.length > 2000) throw new Error('Upload no more than 2,000 non-empty rows at a time.');
      sourceRows.forEach(({ cells, rowNumber }) => {
        const title = String(cells[columns.title] ?? '').trim();
        const content = String(cells[columns.description] ?? '').trim();
        const dateInput = columns.date >= 0 ? cells[columns.date] ?? '' : '';
        const startInput = columns.start >= 0 ? cells[columns.start] ?? '' : '';
        const endInput = columns.end >= 0 ? cells[columns.end] ?? '' : '';
        const url = String(columns.url >= 0 ? cells[columns.url] ?? '' : '').trim();
        const eventDate = parseDate(dateInput);
        const eventStartTime = parseTime(startInput);
        const eventEndTime = parseTime(endInput);
        const messages: string[] = [];
        if (!title) messages.push('Title is required.');
        if (title.length > 160) messages.push('Title must be 160 characters or fewer.');
        if (!content && !url) messages.push('Description or URL is required.');
        if (content.length > 10000) messages.push('Description must be 10,000 characters or fewer.');
        if (url && !/^https?:\/\//i.test(url)) messages.push('URL must start with http:// or https://.');
        if (url.length > 2048) messages.push('URL must be 2,048 characters or fewer.');
        if (dateInput !== '' && dateInput !== null && dateInput !== undefined && !eventDate) messages.push('Date must be a valid Excel date or YYYY-MM-DD / DD/MM/YYYY.');
        if (startInput !== '' && startInput !== null && startInput !== undefined && !eventStartTime) messages.push('Start Time must be HH:MM or a valid Excel time.');
        if (endInput !== '' && endInput !== null && endInput !== undefined && !eventEndTime) messages.push('End Time must be HH:MM or a valid Excel time.');
        if (!eventDate && (eventStartTime || eventEndTime)) messages.push('A Date is required when a time is entered.');
        if (messages.length) nextErrors.push({ row: rowNumber, message: messages.join(' ') });
        else nextRows.push({ rowNumber, title, content, ...(eventDate ? { eventDate } : {}), ...(eventDate && eventStartTime ? { eventStartTime } : {}), ...(eventDate && eventEndTime ? { eventEndTime } : {}), ...(url ? { url } : {}) });
      });
      if (!sourceRows.length) throw new Error('The worksheet has no announcement rows yet.');
      setRows(nextRows);
      setErrors(nextErrors);
    } catch (e: any) {
      setError(e.message || 'Could not read the spreadsheet.');
    } finally {
      setBusy(false);
    }
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (selected) void validateFile(selected);
    event.target.value = '';
  };

  const publish = async () => {
    if (!file || errors.length || !rows.length) return;
    const events = rows.filter(row => row.eventDate).length;
    if (!window.confirm(`Publish ${rows.length} announcement${rows.length === 1 ? '' : 's'}${events ? `, including ${events} calendar event${events === 1 ? '' : 's'}` : ''}?`)) return;
    setBusy(true);
    setError('');
    let published = 0;
    let publishedEvents = 0;
    try {
      for (const row of rows) {
        const formData = new FormData();
        formData.append('title', row.title);
        formData.append('content', row.content);
        if (row.url) formData.append('url', row.url);
        if (row.eventDate) formData.append('eventDate', row.eventDate);
        if (row.eventStartTime) formData.append('eventStartTime', row.eventStartTime);
        if (row.eventEndTime) formData.append('eventEndTime', row.eventEndTime);
        await axiosInstance.post('/announcements', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        published++;
        if (row.eventDate) publishedEvents++;
      }
      setResult({ imported: published, events: publishedEvents });
    } catch (e: any) {
      if (published) setResult({ imported: published, events: publishedEvents });
      const failedRow = rows[published]?.rowNumber;
      const detail = e.response?.data?.message || 'The server could not publish this row.';
      setError(published
        ? `Published ${published} row${published === 1 ? '' : 's'} before row ${failedRow} failed: ${detail} Select the file again after removing the rows already published.`
        : detail);
    } finally {
      setBusy(false);
    }
  };

  return <Layout>
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Announcements &amp; Calendar</h1>
        <p className="mt-1 text-sm text-gray-600">Publish a year of family announcements or dated calendar events from an Excel file.</p>
      </div>

      <section className="bg-white rounded-lg shadow p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5">
          <div className="flex items-start gap-3"><FileSpreadsheet className="text-green-700 mt-1" size={24} /><div><h2 className="font-semibold">Download the Excel template</h2><p className="text-sm text-gray-600">Includes field instructions and a Malayalam example.</p></div></div>
          <button type="button" className="btn-primary inline-flex items-center justify-center gap-2" onClick={downloadTemplate}><Download size={17} />Download template</button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" htmlFor="announcements-file">Upload your completed spreadsheet</label>
          <input id="announcements-file" type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} disabled={busy} className="block w-full text-sm file:mr-4 file:rounded file:border-0 file:bg-gray-100 file:px-4 file:py-2" />
          <p className="mt-2 text-xs text-gray-500">XLSX, XLS or CSV · up to 5 MB · up to 2,000 rows. Malayalam and mixed English/Malayalam text are supported. Rows with a date are added to Calendar and Announcements.</p>
        </div>

        {error && <div role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {(rows.length > 0 || errors.length > 0) && <div className="space-y-4">
          <div className="flex flex-wrap gap-4 rounded bg-gray-50 p-3 text-sm"><strong>{rows.length} valid rows</strong><span>of {rows.length + errors.length} total</span><span>{rows.filter(row => row.eventDate).length} dated events</span></div>
          {errors.length > 0 && <div role="alert" className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Fix these rows in Excel, then upload again:</strong><ul className="mt-2 list-disc pl-5">{errors.map(item => <li key={`${item.row}-${item.message}`}>Row {item.row}: {item.message}</li>)}</ul></div>}
          <div className="overflow-auto max-h-96 border rounded"><table className="min-w-full text-sm"><thead className="sticky top-0 bg-gray-100"><tr>{['Row', 'Title', 'Description', 'Date', 'Time'].map(label => <th key={label} className="text-left px-3 py-2">{label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.rowNumber} className="border-t"><td className="px-3 py-2">{row.rowNumber}</td><td className="px-3 py-2 font-medium">{row.title}</td><td className="px-3 py-2 max-w-md whitespace-pre-wrap">{row.content || row.url}</td><td className="px-3 py-2">{row.eventDate || 'Announcement'}</td><td className="px-3 py-2">{row.eventStartTime ? `${row.eventStartTime}${row.eventEndTime ? `–${row.eventEndTime}` : ''}` : row.eventDate ? 'All day' : '—'}</td></tr>)}</tbody></table></div>
          <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={publish} disabled={busy || errors.length > 0 || !!result}><Upload size={17} />{busy ? 'Publishing…' : result ? 'Published' : `Publish ${rows.length} rows`}</button>
        </div>}
        {result && <div role="status" className="rounded border border-green-200 bg-green-50 p-4 text-green-800">Published {result.imported} announcements, including {result.events} calendar events.</div>}
      </section>
    </div>
  </Layout>;
};

export default AnnouncementBulkUpload;
