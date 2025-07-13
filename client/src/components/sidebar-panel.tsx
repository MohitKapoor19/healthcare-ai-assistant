import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, User, Bot, Server, BriefcaseMedical, Heart, Pill, Circle } from "lucide-react";
import { api } from "../lib/api";
import type { ConversationEntry } from "../types/medical";

interface SidebarPanelProps {
  sessionId: string;
  sessionDuration: string;
  queriesUsed: number;
  overallConfidence: number;
  onExport: () => void;
}

export function SidebarPanel({ 
  sessionId, 
  sessionDuration, 
  queriesUsed, 
  overallConfidence, 
  onExport 
}: SidebarPanelProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch conversation history
  const { data: conversationHistory = [] } = useQuery<ConversationEntry[]>({
    queryKey: ['/api/sessions', sessionId, 'conversation'],
    enabled: !!sessionId,
  });

  // Fetch health status
  const { data: healthData } = useQuery({
    queryKey: ['/api/health'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Session Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Session Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Session Duration</span>
              <span className="text-sm font-medium">{sessionDuration}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">AI Queries Used</span>
              <span className="text-sm font-medium">{queriesUsed}/50</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Confidence Score</span>
              <span className={`text-sm font-medium ${getConfidenceColor(overallConfidence)}`}>
                {overallConfidence}%
              </span>
            </div>
            
            <div className="pt-3 border-t border-gray-200">
              <Button 
                onClick={onExport} 
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Clinical Notes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversation History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conversation History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {conversationHistory.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No conversation history yet
                </p>
              ) : (
                conversationHistory.map((entry, index) => (
                  <div key={entry.id || index} className="text-sm">
                    <div className="flex items-start space-x-2 mb-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        entry.type === 'user' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        {entry.type === 'user' ? (
                          <User className="w-3 h-3 text-blue-600" />
                        ) : (
                          <Bot className="w-3 h-3 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-700 leading-relaxed break-words">
                          {entry.message.length > 100 
                            ? `${entry.message.substring(0, 100)}...` 
                            : entry.message
                          }
                        </p>
                        <span className="text-xs text-gray-500">
                          {entry.timestamp 
                            ? formatTime(new Date(entry.timestamp))
                            : formatTime(currentTime)
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Educational Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Educational Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button
              variant="ghost"
              className="w-full justify-start p-3 bg-blue-50 hover:bg-blue-100 h-auto"
            >
              <BriefcaseMedical className="w-4 h-4 text-blue-600 mr-3 flex-shrink-0" />
              <div className="text-left">
                <h4 className="text-sm font-medium text-gray-900">Understanding Migraines</h4>
                <p className="text-xs text-gray-600">Learn about migraine triggers and management</p>
              </div>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start p-3 bg-blue-50 hover:bg-blue-100 h-auto"
            >
              <Heart className="w-4 h-4 text-blue-600 mr-3 flex-shrink-0" />
              <div className="text-left">
                <h4 className="text-sm font-medium text-gray-900">When to Seek Emergency Care</h4>
                <p className="text-xs text-gray-600">Red flag symptoms that require immediate attention</p>
              </div>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start p-3 bg-blue-50 hover:bg-blue-100 h-auto"
            >
              <Pill className="w-4 h-4 text-blue-600 mr-3 flex-shrink-0" />
              <div className="text-left">
                <h4 className="text-sm font-medium text-gray-900">Headache Management</h4>
                <p className="text-xs text-gray-600">Lifestyle and medication options</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Model Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI Model Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Circle className={`w-2 h-2 ${
                  healthData?.models?.reasoner === 'connected' ? 'text-green-500' : 'text-red-500'
                } fill-current`} />
                <span className="text-sm text-gray-700">DeepSeek Reasoner</span>
              </div>
              <Badge variant="secondary" className={
                healthData?.models?.reasoner === 'connected' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }>
                {healthData?.models?.reasoner || 'Unknown'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Circle className={`w-2 h-2 ${
                  healthData?.models?.chat === 'connected' ? 'text-green-500' : 'text-red-500'
                } fill-current`} />
                <span className="text-sm text-gray-700">DeepSeek Chat</span>
              </div>
              <Badge variant="secondary" className={
                healthData?.models?.chat === 'connected' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }>
                {healthData?.models?.chat || 'Unknown'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Server className="w-3 h-3 text-blue-600" />
                <span className="text-sm text-gray-700">Ollama Server</span>
              </div>
              <span className="text-xs text-gray-500">localhost:11434</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
