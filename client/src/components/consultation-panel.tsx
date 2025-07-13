import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Eraser, Clock, ChevronDown, TriangleAlert, BookOpen, TestTube } from "lucide-react";
import type { AppMode, PatientInfo, AIAnalysisResult } from "../types/medical";

interface ConsultationPanelProps {
  mode: AppMode;
  patientInfo: PatientInfo;
  symptoms: string;
  analysis?: AIAnalysisResult;
  isAnalyzing: boolean;
  onPatientInfoChange: (info: PatientInfo) => void;
  onSymptomsChange: (symptoms: string) => void;
  onAnalyze: () => void;
  onClear: () => void;
  onFollowUpQuestionClick: (question: string) => void;
}

export function ConsultationPanel({
  mode,
  patientInfo,
  symptoms,
  analysis,
  isAnalyzing,
  onPatientInfoChange,
  onSymptomsChange,
  onAnalyze,
  onClear,
  onFollowUpQuestionClick
}: ConsultationPanelProps) {
  const [expandedDiagnosis, setExpandedDiagnosis] = useState<number | null>(null);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-100 text-green-800";
    if (confidence >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return "High";
    if (confidence >= 60) return "Medium";
    return "Low";
  };

  return (
    <div className="space-y-6">
      {/* Patient Information Card (Doctor Mode) */}
      {mode === 'doctor' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Patient Information</CardTitle>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
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

      {/* Symptom Input */}
      <Card>
        <CardHeader>
          <CardTitle>Symptom Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="symptoms" className="text-sm font-medium text-gray-700">
                Describe the primary symptoms and concerns
              </Label>
              <Textarea
                id="symptoms"
                className="mt-2 resize-none"
                rows={4}
                placeholder="Please describe your symptoms, when they started, severity, and any relevant details..."
                value={symptoms}
                onChange={(e) => onSymptomsChange(e.target.value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={onAnalyze} 
                  disabled={!symptoms.trim() || isAnalyzing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  {isAnalyzing ? "Analyzing..." : "Analyze with AI"}
                </Button>
                <Button variant="outline" onClick={onClear}>
                  <Eraser className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                <span>Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Results */}
      {analysis && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>AI Analysis Results</CardTitle>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Brain className="w-4 h-4 text-blue-600" />
                <span>DeepSeek Reasoner</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Differential Diagnoses</h3>
              
              {analysis.diagnoses.map((diagnosis, index) => (
                <Card 
                  key={index} 
                  className={`border transition-colors duration-200 hover:border-blue-300 ${
                    diagnosis.confidence < 30 ? 'border-red-200 bg-red-50' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className={`font-medium ${
                        diagnosis.confidence < 30 ? 'text-red-700' : 'text-gray-900'
                      }`}>
                        {diagnosis.name}
                        {diagnosis.confidence < 30 && " (Requires Immediate Attention)"}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <Badge className={getConfidenceColor(diagnosis.confidence)}>
                          {diagnosis.confidence}% Confidence
                        </Badge>
                        {diagnosis.confidence < 30 && (
                          <TriangleAlert className="w-4 h-4 text-red-600" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedDiagnosis(expandedDiagnosis === index ? null : index)}
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${
                            expandedDiagnosis === index ? 'rotate-180' : ''
                          }`} />
                        </Button>
                      </div>
                    </div>
                    <p className={`text-sm mb-3 ${
                      diagnosis.confidence < 30 ? 'text-red-700' : 'text-gray-600'
                    }`}>
                      {diagnosis.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                        {diagnosis.category}
                      </Badge>
                      {diagnosis.redFlags.length > 0 && (
                        <Badge variant="destructive" className="bg-red-100 text-red-700">
                          Red Flags: {diagnosis.redFlags.length}
                        </Badge>
                      )}
                    </div>
                    
                    {expandedDiagnosis === index && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        {diagnosis.redFlags.length > 0 && (
                          <div className="mb-3">
                            <h5 className="text-sm font-medium text-red-700 mb-2">Red Flags:</h5>
                            <ul className="text-sm text-red-600 space-y-1">
                              {diagnosis.redFlags.map((flag, flagIndex) => (
                                <li key={flagIndex} className="flex items-start space-x-2">
                                  <span className="text-red-600">•</span>
                                  <span>{flag}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {diagnosis.recommendedTests.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Recommended Tests:</h5>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {diagnosis.recommendedTests.map((test, testIndex) => (
                                <li key={testIndex} className="flex items-start space-x-2">
                                  <TestTube className="w-3 h-3 mt-1 text-blue-600" />
                                  <span>{test}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Follow-up Questions */}
            {analysis.followUpQuestions.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">AI Follow-up Questions</h3>
                <div className="space-y-2">
                  {analysis.followUpQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start text-left p-3 bg-blue-50 hover:bg-blue-100 text-gray-700 h-auto whitespace-normal"
                      onClick={() => onFollowUpQuestionClick(question)}
                    >
                      <BookOpen className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>{question}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Clinical Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recommended Tests */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <TestTube className="w-4 h-4 text-blue-600 mr-2" />
                  Recommended Tests
                </h3>
                <div className="space-y-2">
                  {analysis.recommendedTests.map((test, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">{test}</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Recommended
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Red Flags */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <TriangleAlert className="w-4 h-4 text-red-600 mr-2" />
                  Red Flags Detected
                </h3>
                <div className="space-y-2">
                  {analysis.redFlags.map((flag, index) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-red-700">{flag}</p>
                          <p className="text-xs text-red-600">Requires immediate attention</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
