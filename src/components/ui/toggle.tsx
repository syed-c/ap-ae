import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-[8px] text-sm font-medium ring-offset-[#0A0A0A] transition-colors hover:bg-[rgba(45,156,132,0.08)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D9C84] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-[#2D9C84]/20 data-[state=on]:text-[#2D9C84]",
  {
    variants: {
      variant: {
        default: "bg-transparent text-[#62626B]",
        outline: "border border-[#1E1E1E] bg-transparent hover:bg-[rgba(45,156,132,0.08)] hover:text-white",
      },
      size: {
        default: "h-10 px-3",
        sm: "h-9 px-2.5",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root ref={ref} className={cn(toggleVariants({ variant, size, className }))} {...props} />
));
Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };
