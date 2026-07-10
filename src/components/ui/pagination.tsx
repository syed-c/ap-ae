"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const PaginationContent = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("flex flex-row items-center gap-1", className)} {...props} />
  ),
)
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => <li ref={ref} className={cn("", className)} {...props} />,
)
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & React.ComponentPropsWithoutRef<"button">

const PaginationLink = React.forwardRef<HTMLButtonElement, PaginationLinkProps>(
  ({ className, isActive, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-[8px] text-sm font-medium transition-all duration-200 h-9 w-9",
        isActive ? "bg-[#F59E0B] text-white" : "text-[#6B7280] hover:text-[#111827] hover:bg-[rgba(245,158,11,0.06)]",
        className,
      )}
      aria-current={isActive ? "page" : undefined}
      {...props}
    />
  ),
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = React.forwardRef<HTMLButtonElement, PaginationLinkProps>(
  ({ className, ...props }, ref) => (
    <PaginationLink ref={ref} className={cn("gap-1 pl-2.5 w-auto", className)} {...props}>
      <span className="h-4 w-4">&lsaquo;</span>
      <span className="hidden sm:inline">Previous</span>
    </PaginationLink>
  ),
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = React.forwardRef<HTMLButtonElement, PaginationLinkProps>(
  ({ className, ...props }, ref) => (
    <PaginationLink ref={ref} className={cn("gap-1 pr-2.5 w-auto", className)} {...props}>
      <span className="hidden sm:inline">Next</span>
      <span className="h-4 w-4">&rsaquo;</span>
    </PaginationLink>
  ),
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({ className, ...props }: React.ComponentPropsWithoutRef<"span">) => (
  <span className={cn("flex h-9 w-9 items-center justify-center text-[#6B7280]", className)} {...props}>
    ...
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
}
