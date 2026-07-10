"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-[#111827] group-[.toaster]:border-[#E5E7EB] group-[.toaster]:shadow-[0_4px_6px_rgba(0,0,0,0.04),0_10px_15px_rgba(0,0,0,0.06)]",
          description: "group-[.toast]:text-[#6B7280]",
          actionButton:
            "group-[.toast]:bg-[#F59E0B] group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-[#F3F4F6] group-[.toast]:text-[#6B7280]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
