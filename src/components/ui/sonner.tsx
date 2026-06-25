'use client';
import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "dark" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-[#161616] group-[.toaster]:text-white group-[.toaster]:border-[#2D9C84]/30 group-[.toaster]:shadow-[0_4px_16px_rgba(0,0,0,0.5)]",
          description: "group-[.toast]:text-[#62626B]",
          actionButton: "group-[.toast]:bg-[#2D9C84] group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-[#1E1E1E] group-[.toast]:text-[#62626B]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
