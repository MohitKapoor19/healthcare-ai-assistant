import { Loader2, Brain } from "lucide-react";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export function LoadingOverlay({ isVisible, message = "AI Analysis in Progress" }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-sm mx-4 text-center">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            <Brain className="h-6 w-6 text-blue-800 absolute top-3 left-3" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{message}</h3>
        <p className="text-sm text-gray-600">
          DeepSeek is analyzing the symptoms and generating recommendations...
        </p>
      </div>
    </div>
  );
}
