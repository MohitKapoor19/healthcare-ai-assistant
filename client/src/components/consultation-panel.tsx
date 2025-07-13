import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Eraser, Clock, TriangleAlert, TestTube, User } from "lucide-react";
import type { AppMode, PatientInfo, FlowState, FollowUpQA } from "../types/medical";

interface ConsultationPanelProps {
  mode: AppMode;
  patientInfo: PatientInfo;
  flowState: FlowState;
  isAnalyzing: boolean;
  onPatientInfoChange: (info: PatientInfo) => void;
  onStartFlow: (symptoms: string) => void;
  onAnswerQuestions: (answers: FollowUpQA[]) => void;
  onSkipQuestions: () => void;
  onClear: () => void;
  onFollowUpQuestionClick: (question: string) => void;
}

export function ConsultationPanel({
  mode,
  patientInfo,
  flowState,
  isAnalyzing,
  onPatientInfoChange,
  onStartFlow,
  onAnswerQuestions,
  onSkipQuestions,
  onClear,
  onFollowUpQuestionClick
}: ConsultationPanelProps) {
  const [expandedDiagnosis, setExpandedDiagnosis] = useState<number | null>(null);
  const [tempSymptoms, setTempSymptoms] = useState("");
  const [followUpAnswers, setFollowUpAnswers] = useState<FollowUpQA[]>([]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    if (confidence >= 60) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
    return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return "High";
    if (confidence >= 60) return "Medium";
    return "Low";
  };

  // Initialize follow-up answers when questions are available
  if (flowState.followUpQuestions.length > 0 && followUpAnswers.length === 0) {
    setFollowUpAnswers(flowState.followUpQuestions.map(q => ({ question: q, answer: '' })));
  }

  const handleStartAnalysis = () => {
    if (!tempSymptoms.trim()) return;
    onStartFlow(tempSymptoms);
  };

  const handleAnswerChange = (index: number, answer: string) => {
    const newAnswers = [...followUpAnswers];
    newAnswers[index] = { ...newAnswers[index], answer };
    setFollowUpAnswers(newAnswers);
  };

  const handleSubmitAnswers = () => {
    onAnswerQuestions(followUpAnswers);
  };

  const renderStepContent = () => {
    switch (flowState.step) {
      case 'symptoms':
        return (
          <Card className="consultation-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Symptom Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="symptoms">Describe symptoms in detail</Label>
                <Textarea
                  id="symptoms"
                  placeholder={mode === 'doctor' 
                    ? "Enter patient's presenting symptoms, including onset, duration, severity, and associated factors..."
                    : "Please describe your symptoms, including when they started, how severe they are, and anything that makes them better or worse..."}
                  value={tempSymptoms}
                  onChange={(e) => setTempSymptoms(e.target.value)}
                  className="mt-2 min-h-[120px]"
                  disabled={isAnalyzing}
                />
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={onClear} disabled={isAnalyzing}>
                  <Eraser className="mr-2 h-4 w-4" />
                  Clear
                </Button>
                <Button 
                  onClick={handleStartAnalysis} 
                  disabled={!tempSymptoms.trim() || isAnalyzing}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Brain className="mr-2 h-4 w-4" />
                  Start Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'questions':
        return (
          <Card className="consultation-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Follow-up Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Please answer these questions to help provide a more accurate diagnosis:
              </p>
              {flowState.followUpQuestions.map((question, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`question-${index}`}>{question}</Label>
                  <Textarea
                    id={`question-${index}`}
                    placeholder="Enter your response..."
                    value={followUpAnswers[index]?.answer || ''}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    className="min-h-[80px]"
                    disabled={isAnalyzing}
                  />
                </div>
              ))}
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onSkipQuestions} disabled={isAnalyzing}>
                  Skip Questions
                </Button>
                <Button 
                  onClick={handleSubmitAnswers} 
                  disabled={isAnalyzing}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Brain className="mr-2 h-4 w-4" />
                  Generate Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'complete':
        return flowState.analysis ? (
          <div className="space-y-6">
            {/* Analysis Results */}
            <Card className="consultation-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Diagnostic Analysis
                  <Badge className="ml-auto bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    Confidence: {flowState.analysis.overallConfidence}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {flowState.analysis.diagnoses.map((diagnosis, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{diagnosis.name}</h3>
                        <Badge className={getConfidenceColor(diagnosis.confidence)}>
                          {getConfidenceBadge(diagnosis.confidence)} ({diagnosis.confidence}%)
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{diagnosis.description}</p>
                      <div className="text-xs text-muted-foreground">
                        Category: {diagnosis.category}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Red Flags */}
            {flowState.analysis.redFlags.length > 0 && (
              <Card className="border-red-200 dark:border-red-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <TriangleAlert className="h-5 w-5" />
                    Red Flags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {flowState.analysis.redFlags.map((flag, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <TriangleAlert className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Recommended Tests */}
            {flowState.analysis.recommendedTests.length > 0 && (
              <Card className="consultation-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="h-5 w-5 text-primary" />
                    Recommended Tests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {flowState.analysis.recommendedTests.map((test, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <TestTube className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{test}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={onClear}>
                <Eraser className="mr-2 h-4 w-4" />
                New Consultation
              </Button>
            </div>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Patient Information Card (Doctor Mode) */}
      {mode === 'doctor' && (
        <Card className="consultation-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Patient Information
              </CardTitle>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                Active Session
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="patientId">Patient ID</Label>
                <Input 
                  id="patientId" 
                  value={patientInfo.id || "PT-2024-001"} 
                  readOnly 
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={patientInfo.age || ""}
                  onChange={(e) => onPatientInfoChange({ ...patientInfo, age: parseInt(e.target.value) || undefined })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={patientInfo.gender || ""}
                  onValueChange={(value) => onPatientInfoChange({ ...patientInfo, gender: value as any })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Content */}
      {renderStepContent()}

      {/* Progress Indicator */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                flowState.step === 'symptoms' ? 'bg-primary text-primary-foreground' : 
                ['questions', 'complete'].includes(flowState.step) ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                1
              </div>
              <div className="w-12 h-0.5 bg-muted"></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                flowState.step === 'questions' ? 'bg-primary text-primary-foreground' : 
                flowState.step === 'complete' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                2
              </div>
              <div className="w-12 h-0.5 bg-muted"></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                flowState.step === 'complete' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                3
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {flowState.step === 'symptoms' && 'Enter Symptoms'}
              {flowState.step === 'questions' && 'Answer Questions'}
              {flowState.step === 'complete' && 'Analysis Complete'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}