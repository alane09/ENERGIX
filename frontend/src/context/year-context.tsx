"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface YearContextType {
  year: string;
  setYear: (year: string) => void;
}

const YearContext = createContext<YearContextType | undefined>(undefined);

export function YearProvider({ children }: { children: ReactNode }) {
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());

  return (
    <YearContext.Provider value={{ year, setYear }}>
      {children}
    </YearContext.Provider>
  );
}

export function useYear() {
  const context = useContext(YearContext);
  if (context === undefined) {
    throw new Error("useYear must be used within a YearProvider");
  }
  return context;
}
