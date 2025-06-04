"use client";

import { AlertTriangle } from "lucide-react";

interface DashboardTabContentProps {
  title: string;
  showContent: boolean;
  noDataMessage: string;
  children: React.ReactNode;
}

export default function DashboardTabContent({
  title,
  showContent,
  noDataMessage,
  children,
}: DashboardTabContentProps) {
  return (
    <>
      {!showContent ? (
        <div className="flex h-[300px] w-full flex-col items-center justify-center gap-4">
          <div className="flex items-center justify-center rounded-full bg-warning/10 p-3">
            <AlertTriangle className="h-6 w-6 text-warning" />
          </div>
          <p className="text-muted-foreground">{noDataMessage}</p>
        </div>
      ) : (
        <>
          <h3 className="text-xl font-medium">{title}</h3>
          {children}
        </>
      )}
    </>
  );
}
