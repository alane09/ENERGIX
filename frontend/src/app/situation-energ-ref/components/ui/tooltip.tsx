"use client";

import {
    TooltipContent,
    Tooltip as TooltipPrimitive,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ReactNode } from "react";

interface CustomTooltipProps {
  children: ReactNode;
  content: string;
}

export function Tooltip({ children, content }: CustomTooltipProps) {
  return (
    <TooltipProvider>
      <TooltipPrimitive>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent>
          <p>{content}</p>
        </TooltipContent>
      </TooltipPrimitive>
    </TooltipProvider>
  );
}
