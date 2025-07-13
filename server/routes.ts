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

  // Analyze symptoms with AI
  app.post("/api/analyze", async (req, res) => {
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

      // Perform AI analysis
      const analysis = await aiService.analyzeSymptoms(symptoms, mode, patientInfo);

      // Update session with analysis
      await storage.updateSession(sessionId, {
        symptoms,
        aiAnalysis: analysis
      });

      // Add AI response to conversation
      await storage.addConversationEntry({
        sessionId,
        type: 'ai',
        message: 'Provided differential diagnoses and recommendations'
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
            chat: "Qwen3 32B"
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
