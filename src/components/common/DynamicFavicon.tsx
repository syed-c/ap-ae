'use client';
import { useDynamicFavicon } from "@/hooks/useDynamicFavicon";

export function DynamicFavicon() {
    if (typeof window === 'undefined') return null;
    useDynamicFavicon();
    return null;
}
