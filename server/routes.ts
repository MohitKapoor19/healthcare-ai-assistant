import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiService } from "./services/ai-service";
import { insertConsultationSessionSchema, insertConversationEntrySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Create new consultation session
  app.post("/api/sessions", async (req, res) => {
    try {
      const sessionData = insertConsultationSessionSchema.parse(req.body);
      const session = await storage.createSession(sessionData);
      res.json(session);
    } catch (error) {
      res.status(400).json({ error: "Invalid session data" });
    }
  });

  // Get session by ID
  app.get("/api/sessions/:sessionId", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve session" });
    }
  });

  // Update session
  app.patch("/api/sessions/:sessionId", async (req, res) => {
    try {
      const updates = req.body;
      const session = await storage.updateSession(req.params.sessionId, updates);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to update session" });
    }
  });

  // Generate follow-up questions based on initial symptoms
  app.post("/api/generate-questions", async (req, res) => {
    try {
      const { symptoms, mode, sessionId, patientInfo } = req.body;
      
      if (!symptoms || !mode || !sessionId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Add user message to conversation
      await storage.addConversationEntry({
        sessionId,
        type: 'user',
        message: symptoms
      });

      // Generate follow-up questions
      const questions = await aiService.generateFollowUpQuestions(symptoms, mode, patientInfo);

      // Update session with initial symptoms
      await storage.updateSession(sessionId, {
        symptoms,
        patientInfo: mode === 'doctor' ? patientInfo : undefined
      });

      // Add AI response to conversation
      await storage.addConversationEntry({
        sessionId,
        type: 'ai',
        message: 'Generated follow-up questions to gather more details'
      });

      res.json({ questions });
    } catch (error) {
      console.error('Question generation error:', error);
      res.status(500).json({ error: "Failed to generate follow-up questions. Please check AI service connectivity." });
    }
  });

  // Analyze symptoms with additional information from follow-up questions
  app.post("/api/analyze", async (req, res) => {
    try {
      const { symptoms, mode, sessionId, patientInfo, followUpAnswers } = req.body;
      
      if (!symptoms || !mode || !sessionId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Combine initial symptoms with follow-up answers for comprehensive analysis
      const comprehensiveSymptoms = followUpAnswers 
        ? `${symptoms}\n\nAdditional Information:\n${followUpAnswers.map((qa: any) => `Q: ${qa.question}\nA: ${qa.answer}`).join('\n\n')}`
        : symptoms;

      // Add follow-up information to conversation if provided
      if (followUpAnswers && followUpAnswers.length > 0) {
        await storage.addConversationEntry({
          sessionId,
          type: 'user',
          message: `Follow-up responses: ${followUpAnswers.map((qa: any) => `${qa.question}: ${qa.answer}`).join('; ')}`
        });
      }

      // Perform comprehensive AI analysis
      const analysis = await aiService.analyzeSymptoms(comprehensiveSymptoms, mode, patientInfo);

      // Update session with analysis
      await storage.updateSession(sessionId, {
        symptoms: comprehensiveSymptoms,
        aiAnalysis: analysis
      });

      // Add AI response to conversation
      await storage.addConversationEntry({
        sessionId,
        type: 'ai',
        message: 'Provided comprehensive differential diagnoses and recommendations'
      });

      // Store individual diagnoses
      for (const diagnosis of analysis.diagnoses) {
        await storage.createDiagnosis({
          sessionId,
          name: diagnosis.name,
          description: diagnosis.description,
          confidence: diagnosis.confidence,
          category: diagnosis.category,
          redFlags: diagnosis.redFlags,
          recommendedTests: diagnosis.recommendedTests
        });
      }

      res.json(analysis);
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ error: "Failed to analyze symptoms. Please check AI service connectivity." });
    }
  });

  // Get conversation history
  app.get("/api/sessions/:sessionId/conversation", async (req, res) => {
    try {
      const history = await storage.getConversationHistory(req.params.sessionId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve conversation history" });
    }
  });

  // Get diagnoses for session
  app.get("/api/sessions/:sessionId/diagnoses", async (req, res) => {
    try {
      const diagnoses = await storage.getDiagnosesBySession(req.params.sessionId);
      res.json(diagnoses);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve diagnoses" });
    }
  });

  // Export session data
  app.get("/api/sessions/:sessionId/export", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.sessionId);
      const diagnoses = await storage.getDiagnosesBySession(req.params.sessionId);
      const conversation = await storage.getConversationHistory(req.params.sessionId);

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const exportData = {
        session,
        diagnoses,
        conversation,
        exportedAt: new Date().toISOString()
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="consultation-${session.sessionId}.json"`);
      res.json(exportData);
    } catch (error) {
      res.status(500).json({ error: "Failed to export session data" });
    }
  });

  // Generate patient education content
  app.post("/api/education", async (req, res) => {
    try {
      const { diagnosis } = req.body;
      if (!diagnosis) {
        return res.status(400).json({ error: "Diagnosis required" });
      }

      const content = await aiService.generatePatientEducation(diagnosis);
      res.json({ content });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate educational content" });
    }
  });

  // Health check for AI models
  app.get("/api/health", async (req, res) => {
    try {
      // Test actual Groq API connectivity
      const modelStatus = await aiService.checkApiHealth();
      
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        models: modelStatus,
        providers: {
          groq: {
            reasoner: "DeepSeek R1 Distill Llama 70B",
            chat: "Llama 3.3 70B Versatile"
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
        models: {
          reasoner: "disconnected",
          chat: "disconnected"
        }
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
