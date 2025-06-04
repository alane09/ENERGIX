import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ValidationWarningsProps {
  warnings: string[];
  onDismiss?: () => void;
}

export function ValidationWarnings({ warnings, onDismiss }: ValidationWarningsProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible || warnings.length === 0) {
    return null;
  }

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <Alert className="mb-4 border-yellow-500 bg-yellow-50">
      <AlertTitle className="text-yellow-800 flex items-center justify-between">
        <span>Regression Analysis Warnings</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-yellow-800 hover:text-yellow-900 hover:bg-yellow-100"
        >
          Dismiss
        </Button>
      </AlertTitle>
      <AlertDescription className="mt-2 text-yellow-700">
        <ul className="list-disc pl-4 space-y-1">
          {warnings.map((warning, index) => (
            <li key={index}>{warning}</li>
          ))}
        </ul>
        <p className="mt-2 text-sm">
          These warnings may affect the reliability of the regression analysis.
          Please review the data and results carefully.
        </p>
      </AlertDescription>
    </Alert>
  );
}
