
export interface Reference {
  id: string;
  date: string; // ISO Date string YYYY-MM-DD
  text: string;
  rawText?: string;
}

export interface Member {
  id: string; // Unique ID (normalized name)
  name: string;
  company: string;
  sector: string;
  phone: string;
  createdAt: string;
  references: Reference[];
}

export interface Guest {
  id: string;
  name: string;
  company: string;
  sector: string;
  phone: string;
  invitedByMemberId: string;
  invitedByMemberName: string;
  visitDate: string;
  userId: string;
}

// The raw structure returned by Gemini
export interface ExtractedEntry {
  rowNumber: number;
  name: string;
  company: string;
  sector: string;
  phone: string;
  handwrittenRequest: string;
  isGuest?: boolean;
  invitedByName?: string;
}

export interface ProcessedSheetResult {
  date: string;
  entries: ExtractedEntry[];
}

export type ProcessingStatus = 'idle' | 'processing' | 'review' | 'success' | 'error';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  isApproved: boolean;
}
