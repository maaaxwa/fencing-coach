// Update API_BASE to your machine's local IP address when testing on a real device (e.g. http://192.168.1.100:3000)
export const API_BASE = 'http://localhost:3000';

export function getMediaUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

export interface ClassNote {
  id: string;
  content: string;
  sessionDate: string;
  analysis: string | null;
  createdAt: string;
}

export interface NoteAnalysis {
  techniques: string[];
  drills: string[];
  corrections: string[];
  keyInsights: string[];
  areasToImprove: string[];
}

export interface Video {
  id: string;
  filename: string;
  boutDate: string;
  fencerDescription: string | null;
  analysis: string | null;
  thumbnailPath: string | null;
  createdAt: string;
}

export interface VideoAnalysis {
  footwork: string;
  bladeWork: string;
  posture: string;
  speedAndTiming: string;
  tacticalDecisions: string;
  overallScore: number;
  topSuggestions: string[];
}

export interface CoachingReport {
  id: string;
  content: string;
  createdAt: string;
}

export interface CoachingReportContent {
  executiveSummary: string;
  strengths: string[];
  weaknesses: string[];
  patterns: string[];
  priorityDrills: string[];
  shortTermGoals: string[];
  longTermGoals: string[];
  overallAssessment: string;
}

export interface Profile {
  id: string;
  name: string;
  weapon: string;
  experienceYears: number;
  experienceMonths: number;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// Profile
export function getProfile(): Promise<Profile> {
  return request<Profile>('/api/profile');
}

export function saveProfile(data: Partial<Profile>): Promise<Profile> {
  return request<Profile>('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// Notes
export function getNotes(): Promise<ClassNote[]> {
  return request<ClassNote[]>('/api/notes');
}

export function getNote(id: string): Promise<ClassNote> {
  return request<ClassNote>(`/api/notes/${id}`);
}

export function createNote(data: { content: string; sessionDate: string }): Promise<ClassNote> {
  return request<ClassNote>('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function deleteNote(id: string): Promise<void> {
  return request<void>(`/api/notes/${id}`, { method: 'DELETE' });
}

export function analyzeNote(id: string): Promise<{ analysis: NoteAnalysis; note: ClassNote }> {
  return request<{ analysis: NoteAnalysis; note: ClassNote }>(`/api/notes/${id}/analyze`, {
    method: 'POST',
  });
}

// Videos
export function getVideos(): Promise<Video[]> {
  return request<Video[]>('/api/videos');
}

export function getVideo(id: string): Promise<Video> {
  return request<Video>(`/api/videos/${id}`);
}

export async function uploadVideo(data: {
  uri: string;
  boutDate: string;
  fencerDescription: string;
}): Promise<Video> {
  const formData = new FormData();
  const filename = data.uri.split('/').pop() ?? 'video.mp4';
  formData.append('video', {
    uri: data.uri,
    name: filename,
    type: 'video/mp4',
  } as unknown as Blob);
  formData.append('boutDate', data.boutDate);
  formData.append('fencerDescription', data.fencerDescription);

  const res = await fetch(`${API_BASE}/api/videos`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload error ${res.status}: ${text}`);
  }
  return res.json() as Promise<Video>;
}

export function deleteVideo(id: string): Promise<void> {
  return request<void>(`/api/videos/${id}`, { method: 'DELETE' });
}

export function analyzeVideo(id: string): Promise<{ analysis: VideoAnalysis; video: Video }> {
  return request<{ analysis: VideoAnalysis; video: Video }>(`/api/videos/${id}/analyze`, {
    method: 'POST',
  });
}

// Reports
export function getReports(): Promise<CoachingReport[]> {
  return request<CoachingReport[]>('/api/reports');
}

export function generateReport(): Promise<CoachingReport> {
  return request<CoachingReport>('/api/reports/generate', { method: 'POST' });
}
