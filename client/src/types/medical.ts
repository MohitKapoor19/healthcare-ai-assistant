export interface PatientInfo {
  id?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
}

export interface DiagnosisResult {
  id?: number;
  name: string;
  description: string;
  confidence: number;
  category: string;
  redFlags: string[];
  recommendedTests: string[];
}

export interface AIAnalysisResult {
  diagnoses: DiagnosisResult[];
  followUpQuestions: string[];
  redFlags: string[];
  recommendedTests: string[];
  overallConfidence: number;
}

export interface ConversationEntry {
  id?: number;
  type: 'user' | 'ai';
  message: string;
  timestamp?: Date;
}

export interface ConsultationSession {
  id?: number;
  sessionId: string;
  mode: 'doctor' | 'patient';
  patientInfo?: PatientInfo;
  symptoms?: string;
  aiAnalysis?: AIAnalysisResult;
  conversationHistory?: ConversationEntry[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type AppMode = 'doctor' | 'patient';
