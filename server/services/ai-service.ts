import Groq from "groq-sdk";

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
  private groqReasoner: Groq;
  private groqChat: Groq;

  constructor() {
    this.groqReasoner = new Groq({ 
      apiKey: process.env.GROQ_API_KEY_REASONER 
    });
    this.groqChat = new Groq({ 
      apiKey: process.env.GROQ_API_KEY_CHAT 
    });
  }

  private async callGroqAPI(prompt: string, useReasoner: boolean = true): Promise<string> {
    try {
      const groqClient = useReasoner ? this.groqReasoner : this.groqChat;
      const model = useReasoner ? "deepseek-r1-distill-llama-70b" : "llama-3.3-70b-versatile";

      const completion = await groqClient.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        model: model,
        temperature: 0.3,
        max_tokens: 2000,
        top_p: 0.9,
      });

      return completion.choices[0]?.message?.content || "";
    } catch (error) {
      console.error('Groq API Error:', error);
      throw error;
    }
  }

  async generateFollowUpQuestions(symptoms: string, mode: 'doctor' | 'patient', patientInfo?: any): Promise<string[]> {
    const prompt = this.buildFollowUpQuestionsPrompt(symptoms, mode, patientInfo);
    
    try {
      // Use chat model for generating follow-up questions
      const response = await this.callGroqAPI(prompt, false);
      return this.parseFollowUpQuestions(response);
    } catch (error) {
      console.error('Groq Follow-up Questions Error:', error);
      // Fallback to demo questions
      return this.generateDemoFollowUpQuestions(symptoms, mode);
    }
  }

  async analyzeSymptoms(symptoms: string, mode: 'doctor' | 'patient', patientInfo?: any): Promise<AIAnalysisResult> {
    const basePrompt = this.buildAnalysisPrompt(symptoms, mode, patientInfo);
    
    try {
      // Use DeepSeek R1 Distill Llama 70B for medical reasoning
      const reasonerResponse = await this.callGroqAPI(basePrompt, true);
      
      // Parse the reasoner response to extract structured data
      const analysisResult = this.parseReasonerResponse(reasonerResponse);
      
      return analysisResult;
    } catch (error) {
      console.error('Groq AI Service Error:', error);
      // Fallback to demo mode when Groq API is not available
      return this.generateDemoAnalysis(symptoms, mode, patientInfo);
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

  private buildFollowUpQuestionsPrompt(symptoms: string, mode: string, patientInfo?: any): string {
    const modeContext = mode === 'doctor' 
      ? "You are assisting a healthcare professional with patient assessment."
      : "You are helping a patient provide detailed health information. Use simple, clear language.";

    return `${modeContext}

Based on these initial symptoms: "${symptoms}"
${patientInfo ? `Patient information: Age ${patientInfo.age}, Gender: ${patientInfo.gender}` : ''}

Generate 4-6 specific follow-up questions that would help gather essential information for a comprehensive medical assessment.

Return ONLY a JSON array of questions:
["Question 1?", "Question 2?", "Question 3?"]

${mode === 'doctor' ? `Focus on:
- Symptom timing, onset, and progression
- Associated symptoms and triggers
- Past medical history and family history
- Current medications and allergies
- Physical examination findings if relevant` : `Focus on:
- When the symptoms started and how they've changed
- What makes symptoms better or worse
- Any other symptoms you might have
- Medications you're currently taking
- Any similar problems in the past`}

Keep questions clear, specific, and directly relevant to the symptoms described.`;
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

  private generateDemoAnalysis(symptoms: string, mode: 'doctor' | 'patient', patientInfo?: any): AIAnalysisResult {
    // Intelligent demo analysis based on symptoms
    const symptomLower = symptoms.toLowerCase();
    
    // Common symptom patterns and their likely diagnoses
    const patterns = [
      {
        keywords: ['fever', 'joint pain', 'muscle ache'],
        diagnoses: [
          { name: 'Dengue Fever', confidence: 72, category: 'Viral Infection' },
          { name: 'Chikungunya', confidence: 20, category: 'Viral Infection' },
          { name: 'Viral Fever', confidence: 8, category: 'Viral Infection' }
        ],
        questions: [
          'How long has the fever lasted?',
          'Any recent travel to tropical areas?',
          'Any skin rashes or bleeding?',
          'Has there been sore throat or cough?'
        ],
        redFlags: ['Check for bleeding gums', 'Monitor platelet count'],
        tests: ['CBC with platelet count', 'Dengue NS1 antigen', 'Liver function tests']
      },
      {
        keywords: ['headache', 'migraine', 'head pain'],
        diagnoses: [
          { name: 'Tension Headache', confidence: 65, category: 'Neurological' },
          { name: 'Migraine', confidence: 25, category: 'Neurological' },
          { name: 'Cluster Headache', confidence: 10, category: 'Neurological' }
        ],
        questions: [
          'Where exactly is the pain located?',
          'Is the pain throbbing or constant?',
          'Any visual changes or nausea?',
          'What triggers seem to make it worse?'
        ],
        redFlags: ['Sudden severe headache', 'Neck stiffness', 'Vision changes'],
        tests: ['Neurological examination', 'Blood pressure check', 'CT scan if severe']
      },
      {
        keywords: ['chest pain', 'breathing', 'shortness of breath'],
        diagnoses: [
          { name: 'Anxiety', confidence: 45, category: 'Psychological' },
          { name: 'Acid Reflux', confidence: 30, category: 'Gastrointestinal' },
          { name: 'Costochondritis', confidence: 25, category: 'Musculoskeletal' }
        ],
        questions: [
          'Is the pain sharp or burning?',
          'Does it worsen with deep breathing?',
          'Any recent stress or anxiety?',
          'Does it relate to eating or lying down?'
        ],
        redFlags: ['Severe crushing chest pain', 'Pain radiating to arm/jaw', 'Severe shortness of breath'],
        tests: ['ECG', 'Chest X-ray', 'Stress test if indicated']
      }
    ];

    // Find best matching pattern
    let bestMatch = patterns[0];
    let maxMatches = 0;

    for (const pattern of patterns) {
      const matches = pattern.keywords.filter(keyword => symptomLower.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = pattern;
      }
    }

    // Generate mode-specific questions
    const modeSpecificQuestions = mode === 'doctor' 
      ? bestMatch.questions.concat([
          'What are the vital signs?',
          'Any relevant medical history?',
          'Current medications?'
        ])
      : bestMatch.questions.concat([
          'How would you rate the pain from 1-10?',
          'Does anything make it better or worse?',
          'Are you taking any medications?'
        ]);

    // Create comprehensive analysis
    const diagnoses = bestMatch.diagnoses.map(d => ({
      ...d,
      description: this.generateDiagnosisDescription(d.name, mode),
      redFlags: mode === 'doctor' ? bestMatch.redFlags : bestMatch.redFlags.map(flag => `⚠️ ${flag}`),
      recommendedTests: bestMatch.tests
    }));

    const overallConfidence = Math.round(
      diagnoses.reduce((sum, d) => sum + d.confidence, 0) / diagnoses.length
    );

    return {
      diagnoses,
      followUpQuestions: modeSpecificQuestions.slice(0, 5),
      redFlags: bestMatch.redFlags,
      recommendedTests: bestMatch.tests,
      overallConfidence
    };
  }

  private generateDiagnosisDescription(name: string, mode: 'doctor' | 'patient'): string {
    const descriptions: Record<string, { doctor: string; patient: string }> = {
      'Dengue Fever': {
        doctor: 'Mosquito-borne viral infection. Monitor for hemorrhagic complications and plasma leakage.',
        patient: 'A viral infection spread by mosquitoes. Usually gets better with rest and fluids, but needs monitoring.'
      },
      'Chikungunya': {
        doctor: 'Alphavirus infection with characteristic joint involvement. Chronic arthralgia may persist.',
        patient: 'A viral infection that causes fever and joint pain. Joint pain may last several weeks.'
      },
      'Tension Headache': {
        doctor: 'Primary headache disorder. Often stress-related with bilateral distribution.',
        patient: 'Common type of headache often caused by stress, tension, or muscle strain in the head and neck.'
      },
      'Migraine': {
        doctor: 'Neurological disorder with recurrent episodes. Consider prophylaxis if frequent.',
        patient: 'A type of headache that can be very painful and may come with nausea or sensitivity to light.'
      }
    };

    return descriptions[name]?.[mode] || `${mode === 'doctor' ? 'Clinical condition requiring evaluation.' : 'Medical condition that should be evaluated by a healthcare provider.'}`;
  }

  private generateDemoFollowUpQuestions(symptoms: string, mode: 'doctor' | 'patient'): string[] {
    const symptomLower = symptoms.toLowerCase();
    
    // General questions that apply to most symptoms
    const generalQuestions = mode === 'doctor' ? [
      "When did the symptoms first appear and how have they progressed?",
      "What is the severity of symptoms on a scale of 1-10?",
      "Are there any associated symptoms or warning signs?",
      "What is the patient's relevant medical and family history?",
      "What medications is the patient currently taking?",
      "Have any treatments been attempted and what were the results?"
    ] : [
      "When did you first notice these symptoms?",
      "How would you rate the severity from 1-10?",
      "Have you noticed any other symptoms along with this?",
      "Do you have any ongoing health conditions?",
      "What medications are you currently taking?",
      "Have you tried anything to relieve the symptoms?"
    ];
    
    // Symptom-specific questions
    if (symptomLower.includes('fever') || symptomLower.includes('temperature')) {
      return mode === 'doctor' ? [
        "What is the documented temperature range and pattern?",
        "Any associated symptoms like rigors, sweats, or rash?",
        "Recent travel history or exposure to infectious diseases?",
        "Any localizing symptoms suggesting source of infection?"
      ] : [
        "How high has your temperature been?",
        "Are you experiencing chills or sweating?",
        "Have you traveled anywhere recently?",
        "Do you have any pain or discomfort anywhere specific?"
      ];
    }
    
    if (symptomLower.includes('pain') || symptomLower.includes('ache')) {
      return mode === 'doctor' ? [
        "Can you describe the character, location, and radiation of pain?",
        "What are the aggravating and relieving factors?",
        "Is there any temporal pattern to the pain?",
        "Any associated neurological symptoms?"
      ] : [
        "Where exactly do you feel the pain?",
        "What does the pain feel like (sharp, dull, burning)?",
        "Does anything make the pain better or worse?",
        "Have you noticed any numbness or tingling?"
      ];
    }
    
    if (symptomLower.includes('headache') || symptomLower.includes('head')) {
      return mode === 'doctor' ? [
        "What is the location, quality, and severity of the headache?",
        "Any associated neurological symptoms or aura?",
        "Is there photophobia, phonophobia, or nausea?",
        "Any recent head trauma or medication changes?"
      ] : [
        "Where in your head do you feel the pain?",
        "Do you feel sick to your stomach or sensitive to light?",
        "Have you hit your head recently?",
        "Are you taking any new medications?"
      ];
    }
    
    // Return first 5 questions, falling back to general if no specific match
    return generalQuestions.slice(0, 5);
  }

  async generatePatientEducation(diagnosis: string): Promise<string> {
    const prompt = `Provide patient-friendly educational content about "${diagnosis}". Include:
1. What it is in simple terms
2. Common causes
3. When to seek medical care
4. General management tips

Keep the language simple and reassuring. Avoid medical jargon.`;

    try {
      return await this.callGroqAPI(prompt, false); // Use chat model for education
    } catch (error) {
      return "Educational content is temporarily unavailable. Please consult with your healthcare provider for more information.";
    }
  }

  async checkApiHealth(): Promise<{ reasoner: string; chat: string }> {
    const testPrompt = "Hello, respond with 'OK' if you can process this message.";
    
    try {
      const reasonerTest = await this.callGroqAPI(testPrompt, true);
      const chatTest = await this.callGroqAPI(testPrompt, false);
      
      return {
        reasoner: reasonerTest.toLowerCase().includes('ok') ? 'connected' : 'responding',
        chat: chatTest.toLowerCase().includes('ok') ? 'connected' : 'responding'
      };
    } catch (error) {
      console.error('API Health Check Error:', error);
      return {
        reasoner: 'disconnected',
        chat: 'disconnected'
      };
    }
  }
}

export const aiService = new AIService();
