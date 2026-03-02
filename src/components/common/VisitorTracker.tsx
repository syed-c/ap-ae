'use client';
import { useVisitorTracking } from "@/hooks/useVisitorTracking";

export function VisitorTracker() {
    if (typeof window === 'undefined') return null;
    useVisitorTracking();
    return null;
}
