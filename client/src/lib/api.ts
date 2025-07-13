import { apiRequest } from "./queryClient";
import type { ConsultationSession, AIAnalysisResult, ConversationEntry, DiagnosisResult } from "../types/medical";

export const api = {
  // Session management
  createSession: async (sessionData: Partial<ConsultationSession>): Promise<ConsultationSession> => {
    const response = await apiRequest("POST", "/api/sessions", sessionData);
    return response.json();
  },

  getSession: async (sessionId: string): Promise<ConsultationSession> => {
    const response = await apiRequest("GET", `/api/sessions/${sessionId}`);
    return response.json();
  },

  updateSession: async (sessionId: string, updates: Partial<ConsultationSession>): Promise<ConsultationSession> => {
    const response = await apiRequest("PATCH", `/api/sessions/${sessionId}`, updates);
    return response.json();
  },

  // AI Analysis
  analyzeSymptoms: async (data: {
    symptoms: string;
    mode: 'doctor' | 'patient';
    sessionId: string;
    patientInfo?: any;
  }): Promise<AIAnalysisResult> => {
    const response = await apiRequest("POST", "/api/analyze", data);
    return response.json();
  },

  // Conversation
  getConversationHistory: async (sessionId: string): Promise<ConversationEntry[]> => {
    const response = await apiRequest("GET", `/api/sessions/${sessionId}/conversation`);
    return response.json();
  },

  // Diagnoses
  getDiagnoses: async (sessionId: string): Promise<DiagnosisResult[]> => {
    const response = await apiRequest("GET", `/api/sessions/${sessionId}/diagnoses`);
    return response.json();
  },

  // Export
  exportSession: async (sessionId: string): Promise<Blob> => {
    const response = await apiRequest("GET", `/api/sessions/${sessionId}/export`);
    return response.blob();
  },

  // Education
  getEducationContent: async (diagnosis: string): Promise<{ content: string }> => {
    const response = await apiRequest("POST", "/api/education", { diagnosis });
    return response.json();
  },

  // Health check
  checkHealth: async (): Promise<{ status: string; models: any }> => {
    const response = await apiRequest("GET", "/api/health");
    return response.json();
  }
};
