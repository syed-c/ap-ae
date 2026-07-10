"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { orientation?: "horizontal" | "vertical"; decorative?: boolean }
>(({ className, orientation = "horizontal", decorative, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "shrink-0 bg-[#E5E7EB]",
      orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
      className,
    )}
    {...props}
  />
))
Separator.displayName = "Separator"

export { Separator }
