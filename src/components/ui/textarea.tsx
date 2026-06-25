import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[100px] w-full rounded-[8px] border border-[#1E1E1E] bg-[#161616] px-3 py-3 text-sm text-white leading-relaxed",
        "ring-offset-[#0A0A0A] transition-all duration-200",
        "placeholder:text-[#62626B]",
        "hover:border-[rgba(45,156,132,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D9C84] focus-visible:ring-offset-2 focus-visible:border-[#2D9C84]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
export { Textarea };
