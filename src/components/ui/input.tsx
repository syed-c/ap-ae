import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-[8px] border border-[#1E1E1E] bg-[#161616] px-3 py-2 text-[15px] text-white ring-offset-[#0A0A0A] transition-all duration-200",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-white",
          "placeholder:text-[#62626B]",
          "hover:border-[rgba(45,156,132,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D9C84] focus-visible:ring-offset-2 focus-visible:border-[#2D9C84]",
          "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
export { Input };
