import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Stethoscope, Circle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ModeToggle } from "../components/mode-toggle";
import { ConsultationPanel } from "../components/consultation-panel";
import { SidebarPanel } from "../components/sidebar-panel";
import { LoadingOverlay } from "../components/loading-overlay";
import { api } from "../lib/api";
import type { AppMode, PatientInfo, AIAnalysisResult, ConsultationSession } from "../types/medical";

export default function Home() {
  const { toast } = useToast();
  const [mode, setMode] = useState<AppMode>('doctor');
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({});
  const [symptoms, setSymptoms] = useState("");
  const [analysis, setAnalysis] = useState<AIAnalysisResult | undefined>();
  const [sessionStartTime] = useState(new Date());
  const [queriesUsed, setQueriesUsed] = useState(0);
  const [sessionDuration, setSessionDuration] = useState("00:00");

  // Update session duration every second
  useEffect(() => {
    const updateDuration = () => {
      const now = new Date();
      const diff = now.getTime() - sessionStartTime.getTime();
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setSessionDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateDuration();
    const timer = setInterval(updateDuration, 1000);
    return () => clearInterval(timer);
  }, [sessionStartTime]);

  // Create session on mount
  useEffect(() => {
    createSessionMutation.mutate({
      sessionId,
      mode,
      patientInfo,
    });
  }, []);

  // Health check query
  const { data: healthData } = useQuery({
    queryKey: ['/api/health'],
    refetchInterval: 30000,
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: api.createSession,
    onError: (error) => {
      toast({
        title: "Session Error",
        description: "Failed to create consultation session.",
        variant: "destructive",
      });
    },
  });

  // Analyze symptoms mutation
  const analyzeMutation = useMutation({
    mutationFn: (data: { symptoms: string; mode: AppMode; sessionId: string; patientInfo?: PatientInfo }) =>
      api.analyzeSymptoms(data),
    onSuccess: (result) => {
      setAnalysis(result);
      setQueriesUsed(prev => prev + 1);
      toast({
        title: "Analysis Complete",
        description: "AI has successfully analyzed the symptoms.",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze symptoms. Please check AI service connectivity.",
        variant: "destructive",
      });
    },
  });

  // Export session mutation
  const exportMutation = useMutation({
    mutationFn: () => api.exportSession(sessionId),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `consultation-${sessionId}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "Clinical notes have been exported successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to export session data.",
        variant: "destructive",
      });
    },
  });

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    // Clear analysis when switching modes
    setAnalysis(undefined);
  };

  const handleAnalyze = () => {
    if (!symptoms.trim()) {
      toast({
        title: "No Symptoms",
        description: "Please enter symptoms before analyzing.",
        variant: "destructive",
      });
      return;
    }

    analyzeMutation.mutate({
      symptoms,
      mode,
      sessionId,
      patientInfo: mode === 'doctor' ? patientInfo : undefined,
    });
  };

  const handleClear = () => {
    setSymptoms("");
    setAnalysis(undefined);
  };

  const handleFollowUpQuestionClick = (question: string) => {
    setSymptoms(question);
  };

  const handleExport = () => {
    exportMutation.mutate();
  };

  const isConnected = healthData?.models?.reasoner === 'connected' && healthData?.models?.chat === 'connected';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Stethoscope className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">AI Diagnostic Copilot</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <ModeToggle mode={mode} onModeChange={handleModeChange} />
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Circle className={`w-2 h-2 ${isConnected ? 'text-green-500' : 'text-red-500'} fill-current`} />
                <span>{isConnected ? 'AI Models Connected' : 'AI Models Disconnected'}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Consultation Panel */}
          <div className="lg:col-span-2">
            <ConsultationPanel
              mode={mode}
              patientInfo={patientInfo}
              symptoms={symptoms}
              analysis={analysis}
              isAnalyzing={analyzeMutation.isPending}
              onPatientInfoChange={setPatientInfo}
              onSymptomsChange={setSymptoms}
              onAnalyze={handleAnalyze}
              onClear={handleClear}
              onFollowUpQuestionClick={handleFollowUpQuestionClick}
            />
          </div>

          {/* Sidebar */}
          <div>
            <SidebarPanel
              sessionId={sessionId}
              sessionDuration={sessionDuration}
              queriesUsed={queriesUsed}
              overallConfidence={analysis?.overallConfidence || 0}
              onExport={handleExport}
            />
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      <LoadingOverlay 
        isVisible={analyzeMutation.isPending}
        message="AI Analysis in Progress"
      />
    </div>
  );
}
