"use client";

import { AlertTriangle } from "lucide-react";
import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ChartErrorBoundary component to catch and handle errors in chart components
 * This prevents individual chart errors from crashing the entire dashboard
 */
class ChartErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Chart Error:", error, errorInfo);
    // You can log the error to an error reporting service here
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="flex h-[200px] w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Erreur d'affichage du graphique</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {this.state.error?.message || "Une erreur est survenue lors du chargement du graphique"}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChartErrorBoundary;
