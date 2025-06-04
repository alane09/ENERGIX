'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { BarChart3, Cloud, DollarSign, Droplets, Fuel, MapPin, Package, icons } from "lucide-react";
import { MetricDefinition } from "../types";
import { formatVehicleValue } from "../Vehicle";

interface MetricCardProps {
  metric: MetricDefinition & { value: number };
  className?: string;
  isLoading?: boolean;
}

const ICON_MAP: Record<string, any> = {
  'droplet': Droplets,
  'map-pin': MapPin,
  'package': Package,
  'cloud': Cloud,
  'dollar-sign': DollarSign,
  'fuel': Fuel,
  'bar-chart': BarChart3
};

export function MetricCard({ metric, className, isLoading }: MetricCardProps) {
  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-6">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-16" />
        </CardContent>
      </Card>
    );
  }

  const Icon = ICON_MAP[metric.icon] || icons[metric.icon as keyof typeof icons] || Package;
  const formattedValue = formatVehicleValue(metric.value, metric.id);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className={cn(
            "overflow-hidden transition-all hover:shadow-md",
            className
          )}>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{metric.tabTitle}</span>
              </div>
              
              <div className="space-y-1">
                <div className="text-2xl font-bold tracking-tight">
                  {formattedValue}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metric.title}
                </p>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent>
          <p>{metric.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
