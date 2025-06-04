'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import DashboardClient from './components/DashboardClient';

export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Set mounted state to ensure client-side rendering
  useEffect(() => {
    setIsMounted(true);
    // Add a small delay to simulate loading and prevent flickering
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // If not mounted yet, show nothing to prevent hydration errors
  if (!isMounted) return null;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <p></p>
      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DashboardClient />
      )}
    </div>
  );
}
