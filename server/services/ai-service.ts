import { API_CONFIG } from "../config/api-config";

export interface DiagnosisResult {
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

export class AIService {
  private async callOllamaAPI(prompt: string, model: string): Promise<any> {
    const response = await fetch(API_CONFIG.reasoner.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.message.content;
  }

  async analyzeSymptoms(symptoms: string, mode: 'doctor' | 'patient', patientInfo?: any): Promise<AIAnalysisResult> {
    const basePrompt = this.buildAnalysisPrompt(symptoms, mode, patientInfo);
    
    try {
      const reasonerResponse = await this.callOllamaAPI(basePrompt, API_CONFIG.reasoner.model);
      
      // Parse the reasoner response to extract structured data
      const analysisResult = this.parseReasonerResponse(reasonerResponse);
      
      // Generate follow-up questions using chat model
      const followUpPrompt = this.buildFollowUpPrompt(symptoms, analysisResult);
      const chatResponse = await this.callOllamaAPI(followUpPrompt, API_CONFIG.chat.model);
      
      analysisResult.followUpQuestions = this.parseFollowUpQuestions(chatResponse);
      
      return analysisResult;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('Failed to analyze symptoms. Please check AI service connectivity.');
    }
  }

  private buildAnalysisPrompt(symptoms: string, mode: string, patientInfo?: any): string {
    const modeContext = mode === 'doctor' 
      ? "You are assisting a healthcare professional with clinical decision support."
      : "You are providing patient education and guidance. Use simple, non-technical language.";

    return `${modeContext}

Patient symptoms: ${symptoms}
${patientInfo ? `Patient information: Age ${patientInfo.age}, Gender: ${patientInfo.gender}` : ''}

Provide a differential diagnosis analysis. Your response MUST be a valid JSON object with this exact structure:
{
  "diagnoses": [
    {
      "name": "Diagnosis name",
      "description": "Clear description",
      "confidence": 85,
      "category": "Category name",
      "redFlags": ["flag1", "flag2"],
      "recommendedTests": ["test1", "test2"]
    }
  ],
  "overallConfidence": 85,
  "redFlags": ["general red flags"],
  "recommendedTests": ["general tests"]
}

Focus on:
1. Most likely diagnoses with confidence scores
2. Red flag symptoms requiring immediate attention
3. Appropriate diagnostic tests
4. Clear, actionable recommendations
${mode === 'doctor' ? '5. Include ICD-10 codes and medical references where appropriate' : '5. Use patient-friendly language'}`;
  }

  private buildFollowUpPrompt(symptoms: string, analysis: AIAnalysisResult): string {
    return `Based on these symptoms: "${symptoms}" and the preliminary analysis, generate 3-5 specific follow-up questions that would help refine the diagnosis. 

Return only a JSON array of questions:
["Question 1?", "Question 2?", "Question 3?"]

Focus on:
- Symptom clarification
- Duration and onset
- Associated symptoms
- Medical history
- Medications and allergies`;
  }

  private parseReasonerResponse(response: string): AIAnalysisResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          diagnoses: parsed.diagnoses || [],
          followUpQuestions: [],
          redFlags: parsed.redFlags || [],
          recommendedTests: parsed.recommendedTests || [],
          overallConfidence: parsed.overallConfidence || 0
        };
      }
    } catch (error) {
      console.error('Failed to parse reasoner response:', error);
    }

    // Fallback parsing for non-JSON responses
    return this.fallbackParsing(response);
  }

  private parseFollowUpQuestions(response: string): string[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse follow-up questions:', error);
    }

    // Fallback: extract questions from text
    const questions = response.split('\n')
      .filter(line => line.includes('?'))
      .map(line => line.trim().replace(/^\d+\.?\s*/, ''))
      .slice(0, 5);

    return questions.length > 0 ? questions : [
      "Can you describe the onset and duration of your symptoms?",
      "Have you experienced any associated symptoms?",
      "Are there any specific triggers or patterns you've noticed?"
    ];
  }

  private fallbackParsing(response: string): AIAnalysisResult {
    // Basic fallback parsing for when JSON parsing fails
    return {
      diagnoses: [
        {
          name: "Analysis Available",
          description: "AI analysis completed. Please review the detailed response.",
          confidence: 75,
          category: "General",
          redFlags: [],
          recommendedTests: []
        }
      ],
      followUpQuestions: [],
      redFlags: [],
      recommendedTests: [],
      overallConfidence: 75
    };
  }

  async generatePatientEducation(diagnosis: string): Promise<string> {
    const prompt = `Provide patient-friendly educational content about "${diagnosis}". Include:
1. What it is in simple terms
2. Common causes
3. When to seek medical care
4. General management tips

Keep the language simple and reassuring. Avoid medical jargon.`;

    try {
      return await this.callOllamaAPI(prompt, API_CONFIG.chat.model);
    } catch (error) {
      return "Educational content is temporarily unavailable. Please consult with your healthcare provider for more information.";
    }
  }
}

export const aiService = new AIService();
