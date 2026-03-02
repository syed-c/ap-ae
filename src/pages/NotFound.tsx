'use client';
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";
import Link from "next/link";

const NotFound = () => {
  const router = useRouter();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", router.pathname);

    // CRITICAL: Set noindex for 404 pages to prevent soft 404 issues in GSC
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'robots');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'noindex, nofollow');

    // Update title for 404
    document.title = 'Page Not Found | AppointPanda';

    return;
  }, [router.pathname, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/30">
      <div className="text-center px-4 max-w-md">
        {/* 404 Visual */}
        <div className="mb-6">
          <span className="text-8xl font-black bg-gradient-to-r from-primary to-teal bg-clip-text text-transparent">
            404
          </span>
        </div>

        <h1 className="mb-3 text-2xl font-bold text-foreground">
          Page Not Found
        </h1>

        <p className="mb-6 text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default" className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Go to Homepage
            </Link>
          </Button>

          <Button asChild variant="outline" className="gap-2">
            <Link href="/search/">
              <Search className="h-4 w-4" />
              Find a Dentist
            </Link>
          </Button>

          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="mt-8 pt-6 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-3">Browse by Emirate:</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/dubai/" className="text-xs text-primary hover:underline">Dubai</Link>
            <span className="text-muted-foreground/30">•</span>
            <Link href="/abu-dhabi/" className="text-xs text-primary hover:underline">Abu Dhabi</Link>
            <span className="text-muted-foreground/30">•</span>
            <Link href="/sharjah/" className="text-xs text-primary hover:underline">Sharjah</Link>
            <span className="text-muted-foreground/30">•</span>
            <Link href="/ajman/" className="text-xs text-primary hover:underline">Ajman</Link>
            <span className="text-muted-foreground/30">•</span>
            <Link href="/ras-al-khaimah/" className="text-xs text-primary hover:underline">Ras Al Khaimah</Link>
            <span className="text-muted-foreground/30">•</span>
            <Link href="/fujairah/" className="text-xs text-primary hover:underline">Fujairah</Link>
            <span className="text-muted-foreground/30">•</span>
            <Link href="/umm-al-quwain/" className="text-xs text-primary hover:underline">Umm Al Quwain</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
