"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface CustomProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
  variant?: "default" | "emerald" | "cyan" | "amber" | "rose" | "dynamic";
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  CustomProgressProps
>(({ className, value = 0, variant = "dynamic", indicatorClassName, ...props }, ref) => {
  const safeValue = Math.min(100, Math.max(0, value || 0));

  const getDynamicGradient = (val: number) => {
    if (val >= 90) return "bg-gradient-to-r from-red-600 to-rose-500";
    if (val >= 75) return "bg-gradient-to-r from-amber-600 to-yellow-500";
    return "bg-gradient-to-r from-emerald-600 to-teal-400";
  };

  const getVariantClass = () => {
    switch (variant) {
      case "emerald":
        return "bg-gradient-to-r from-emerald-600 to-teal-400";
      case "cyan":
        return "bg-gradient-to-r from-cyan-600 to-blue-400";
      case "amber":
        return "bg-gradient-to-r from-amber-600 to-yellow-400";
      case "rose":
        return "bg-gradient-to-r from-rose-600 to-red-400";
      case "dynamic":
      default:
        return getDynamicGradient(safeValue);
    }
  };

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-slate-800/80 border border-slate-700/50",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 transition-all duration-500 ease-out",
          getVariantClass(),
          indicatorClassName
        )}
        style={{ transform: `translateX(-${100 - safeValue}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
