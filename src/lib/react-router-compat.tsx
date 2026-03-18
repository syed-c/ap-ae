import { useParams, useSearchParams, usePathname, useRouter } from 'next/navigation';
import NextLink from "next/link";
import type { LinkProps as NextLinkProps } from "next/link";

const Link = (props: NextLinkProps) => <NextLink {...props} />;

export { useParams, useSearchParams, usePathname, useRouter, Link };
