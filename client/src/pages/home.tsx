import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Stethoscope, Circle, Menu, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { ModeToggle } from "../components/mode-toggle";
import { ThemeToggle } from "../components/theme-toggle";
import { ConsultationPanel } from "../components/consultation-panel";
import { SidebarPanel } from "../components/sidebar-panel";
import { LoadingOverlay } from "../components/loading-overlay";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { api } from "../lib/api";
import type { AppMode, PatientInfo, AIAnalysisResult, ConsultationSession, FlowState, FollowUpQA } from "../types/medical";

export default function Home() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<AppMode>('doctor');
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({});
  const [flowState, setFlowState] = useState<FlowState>({
    step: 'symptoms',
    symptoms: '',
    followUpQuestions: [],
    followUpAnswers: [],
    analysis: undefined
  });
  const [sessionStartTime] = useState(new Date());
  const [queriesUsed, setQueriesUsed] = useState(0);
  const [sessionDuration, setSessionDuration] = useState("00:00");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Generate follow-up questions mutation
  const generateQuestionsMutation = useMutation({
    mutationFn: (data: { symptoms: string; mode: AppMode; sessionId: string; patientInfo?: PatientInfo }) =>
      api.generateFollowUpQuestions(data),
    onSuccess: (result) => {
      setFlowState(prev => ({
        ...prev,
        step: 'questions',
        followUpQuestions: result.questions
      }));
      setQueriesUsed(prev => prev + 1);
      toast({
        title: "Follow-up Questions Ready",
        description: "Please answer the questions to get a comprehensive analysis.",
      });
    },
    onError: (error) => {
      toast({
        title: "Question Generation Failed",
        description: "Failed to generate follow-up questions. Please check AI service connectivity.",
        variant: "destructive",
      });
    },
  });

  // Analyze symptoms mutation (with follow-up answers)
  const analyzeMutation = useMutation({
    mutationFn: (data: { 
      symptoms: string; 
      mode: AppMode; 
      sessionId: string; 
      patientInfo?: PatientInfo;
      followUpAnswers?: FollowUpQA[];
    }) => api.analyzeSymptoms(data),
    onSuccess: (result) => {
      setFlowState(prev => ({
        ...prev,
        step: 'complete',
        analysis: result
      }));
      setQueriesUsed(prev => prev + 1);
      toast({
        title: "Analysis Complete",
        description: "AI has successfully analyzed the symptoms with comprehensive details.",
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
    // Reset flow when switching modes
    setFlowState({
      step: 'symptoms',
      symptoms: '',
      followUpQuestions: [],
      followUpAnswers: [],
      analysis: undefined
    });
  };

  const handleStartFlow = (symptoms: string) => {
    if (!symptoms.trim()) {
      toast({
        title: "No Symptoms",
        description: "Please enter symptoms before starting analysis.",
        variant: "destructive",
      });
      return;
    }

    setFlowState(prev => ({ ...prev, symptoms }));

    generateQuestionsMutation.mutate({
      symptoms,
      mode,
      sessionId,
      patientInfo: mode === 'doctor' ? patientInfo : undefined,
    });
  };

  const handleAnswerQuestions = (answers: FollowUpQA[]) => {
    setFlowState(prev => ({ ...prev, followUpAnswers: answers }));

    analyzeMutation.mutate({
      symptoms: flowState.symptoms,
      mode,
      sessionId,
      patientInfo: mode === 'doctor' ? patientInfo : undefined,
      followUpAnswers: answers,
    });
  };

  const handleSkipQuestions = () => {
    // Proceed directly to analysis without follow-up answers
    analyzeMutation.mutate({
      symptoms: flowState.symptoms,
      mode,
      sessionId,
      patientInfo: mode === 'doctor' ? patientInfo : undefined,
    });
  };

  const handleClear = () => {
    setFlowState({
      step: 'symptoms',
      symptoms: '',
      followUpQuestions: [],
      followUpAnswers: [],
      analysis: undefined
    });
  };

  const handleFollowUpQuestionClick = (question: string) => {
    setFlowState(prev => ({ 
      ...prev, 
      symptoms: question,
      step: 'symptoms'
    }));
  };

  const handleExport = () => {
    exportMutation.mutate();
  };

  const isConnected = healthData?.models?.reasoner === 'connected' && healthData?.models?.chat === 'connected';

  // Mobile Sidebar Component
  const MobileSidebar = () => (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 p-0">
        <div className="h-full">
          <SidebarPanel
            sessionId={sessionId}
            sessionDuration={sessionDuration}
            queriesUsed={queriesUsed}
            overallConfidence={flowState.analysis?.overallConfidence || 0}
            onExport={() => {
              handleExport();
              setSidebarOpen(false);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full max-w-none px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="p-2 gradient-primary rounded-xl shadow-lg flex-shrink-0">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block min-w-0">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent whitespace-nowrap">
                  AI Diagnostic Copilot
                </h1>
                <p className="text-sm text-muted-foreground whitespace-nowrap">Intelligent Medical Analysis Assistant</p>
              </div>
              <div className="block sm:hidden min-w-0">
                <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  AI Diagnostic
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:flex items-center space-x-2">
                <Circle className={`h-2 w-2 ${isConnected ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'}`} />
                <span className="text-sm text-muted-foreground">
                  {isConnected ? 'AI Connected' : 'AI Disconnected'}
                </span>
              </div>
              <ModeToggle mode={mode} onModeChange={handleModeChange} />
              <ThemeToggle />
              {isMobile && <MobileSidebar />}
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Main Content */}
      <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Main Consultation Panel */}
          <div className="lg:col-span-3 xl:col-span-2">
            <ConsultationPanel
              mode={mode}
              patientInfo={patientInfo}
              flowState={flowState}
              isAnalyzing={analyzeMutation.isPending || generateQuestionsMutation.isPending}
              onPatientInfoChange={setPatientInfo}
              onStartFlow={handleStartFlow}
              onAnswerQuestions={handleAnswerQuestions}
              onSkipQuestions={handleSkipQuestions}
              onClear={handleClear}
              onFollowUpQuestionClick={handleFollowUpQuestionClick}
            />
          </div>

          {/* Desktop Sidebar - Hidden on Mobile */}
          <div className="hidden lg:block lg:col-span-1 xl:col-span-1">
            <SidebarPanel
              sessionId={sessionId}
              sessionDuration={sessionDuration}
              queriesUsed={queriesUsed}
              overallConfidence={flowState.analysis?.overallConfidence || 0}
              onExport={handleExport}
            />
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      <LoadingOverlay 
        isVisible={analyzeMutation.isPending || generateQuestionsMutation.isPending}
        message={generateQuestionsMutation.isPending ? "Generating Follow-up Questions" : "AI Analysis in Progress"}
      />
    </div>
  );
}
