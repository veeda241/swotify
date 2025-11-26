export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  classId?: string; // For students linking to a class
}

export interface Achievement {
  id: string;
  studentId: string;
  title: string;
  date: string;
  score: number;
  maxScore: number;
  type: 'Academic' | 'Behavior' | 'Sport' | 'Art';
  description: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  teacherId: string;
}

export interface Metric {
  name: string;
  score: number;
  max: number;
  description: string;
}

export interface SwotAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface SessionReport {
  id: string;
  date: string;
  transcript: string;
  summary: string;
  metrics: Metric[];
  swot: SwotAnalysis;
  topics: string[];
}

export enum AppView {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD', // Main role-based dashboard
  LIVE_SESSION = 'LIVE_SESSION',
  SESSION_REPORT = 'SESSION_REPORT', // Specific meeting report
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  source: string;
}
