"use client";

import { createContext, ReactNode, useState } from "react";

export interface YearContextType {
  year: string;
  setYear: (year: string) => void;
}

export const YearContext = createContext<YearContextType>({
  year: new Date().getFullYear().toString(),
  setYear: () => {},
});

export function YearProvider({ children }: { children: ReactNode }) {
  const [year, setYear] = useState(new Date().getFullYear().toString());

  return (
    <YearContext.Provider value={{ year, setYear }}>
      {children}
    </YearContext.Provider>
  );
}
