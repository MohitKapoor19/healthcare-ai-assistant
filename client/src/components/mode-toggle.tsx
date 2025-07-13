import { Button } from "@/components/ui/button";
import { UserCheck, Users } from "lucide-react";
import type { AppMode } from "../types/medical";

interface ModeToggleProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1">
      <Button
        variant={mode === 'doctor' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('doctor')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
          mode === 'doctor' 
            ? 'bg-blue-600 text-white hover:bg-blue-700' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        <UserCheck className="w-4 h-4 mr-2" />
        Doctor Mode
      </Button>
      <Button
        variant={mode === 'patient' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('patient')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
          mode === 'patient' 
            ? 'bg-blue-600 text-white hover:bg-blue-700' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        <Users className="w-4 h-4 mr-2" />
        Patient Mode
      </Button>
    </div>
  );
}
