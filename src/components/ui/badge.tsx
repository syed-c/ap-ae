import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex min-h-5 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2D9C84] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#2D9C84] text-white",
        secondary: "border-[#1E1E1E] bg-[#161616] text-[#62626B]",
        destructive: "border-transparent bg-[#EF4444] text-white",
        outline: "border-[#2D9C84] bg-transparent text-white",
        success: "border-transparent bg-[rgba(34,197,94,0.1)] text-[#22C55E]",
        warning: "border-transparent bg-[rgba(250,204,21,0.1)] text-[#FACC15]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
