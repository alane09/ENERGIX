"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center text-center gap-6">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              Une erreur est survenue
            </h2>
            <p className="text-muted-foreground">
              {error.message || "Impossible de charger les données de régression"}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={reset}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </Button>
        </div>
      </Card>
    </div>
  );
}
