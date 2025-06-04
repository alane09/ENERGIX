"use client";

import { useContext } from "react";
import { YearContext, YearContextType } from "../context/year-context";

export function useYear(): YearContextType {
  const context = useContext(YearContext);

  if (!context) {
    throw new Error("useYear must be used within a YearProvider");
  }

  return context;
}
