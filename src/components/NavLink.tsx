import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { withTrailingSlash } from "@/lib/url/withTrailingSlash";

interface NavLinkCompatProps {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
  to: string;
  href?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, to, href, ...props }, ref) => {
    const normalizedTo = to || href;

    const normalizedHref =
      typeof normalizedTo === 'string'
        ? withTrailingSlash(normalizedTo)
        : normalizedTo;

    return (
      <Link
        ref={ref}
        href={normalizedHref}
        className={cn(className)}
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
