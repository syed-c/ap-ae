import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D9C84] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#2D9C84] text-white hover:bg-[#3AB89E] shadow-[0_4px_16px_rgba(0,0,0,0.3)] inset-shadow-[0_1px_0_rgba(255,255,255,0.1)] hover:-translate-y-[1px]",
        destructive: "bg-[#EF4444] text-white hover:bg-[#DC2626]",
        outline: "border border-[#2D9C84] bg-transparent text-white hover:bg-[rgba(45,156,132,0.08)] hover:border-[#3AB89E]",
        secondary: "bg-[#FACC15] text-[#0A0A0A] hover:bg-[#FCD34D] font-extrabold shadow-[0_4px_12px_rgba(250,204,21,0.2)]",
        ghost: "text-white hover:bg-[rgba(45,156,132,0.08)]",
        link: "text-[#2D9C84] underline-offset-4 hover:underline",
        gold: "bg-gradient-to-b from-[#FACC15] to-[#D4A810] text-[#0A0A0A] font-extrabold shadow-[0_4px_12px_rgba(250,204,21,0.2)] inset-shadow-[0_1px_0_rgba(255,255,255,0.25)] hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(250,204,21,0.3)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-6 text-[15px]",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
