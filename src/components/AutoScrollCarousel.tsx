'use client';

import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DoctorCard } from "@/components/DoctorCard";
import { Link } from "react-router-dom";

interface Doctor {
  name: string;
  specialty: string;
  location: string;
  rating: number;
  image: string;
  slug?: string;
  type?: 'dentist' | 'clinic';
}

interface AutoScrollCarouselProps {
  doctors: Doctor[];
  autoScrollSpeed?: number; // pixels per second
}

export function AutoScrollCarousel({ doctors, autoScrollSpeed = 30 }: AutoScrollCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>();

  // Auto-scroll effect
  useEffect(() => {
    if (!scrollRef.current || doctors.length === 0) return;

    const container = scrollRef.current;
    
    const animate = (currentTime: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = currentTime;
      }
      
      if (!isPaused) {
        const deltaTime = (currentTime - lastTimeRef.current) / 1000; // Convert to seconds
        const scrollAmount = autoScrollSpeed * deltaTime;
        
        container.scrollLeft += scrollAmount;
        
        // Reset to beginning when reaching the end (seamless loop)
        if (container.scrollLeft >= container.scrollWidth - container.clientWidth - 10) {
          container.scrollLeft = 0;
        }
      }
      
      lastTimeRef.current = currentTime;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPaused, autoScrollSpeed, doctors.length]);

  // Pause on hover
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 280;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative">
      {/* Carousel with auto-scroll */}
      <div
        ref={scrollRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 -mx-1 px-1"
        style={{ scrollBehavior: 'auto' }}
      >
        {/* Duplicate items for seamless loop */}
        {[...doctors, ...doctors].map((doctor, index) => (
          <div
            key={`${doctor.name}-${index}`}
            className="animate-fade-in shrink-0"
            style={{ animationDelay: `${(index % doctors.length) * 0.08}s` }}
          >
            <DoctorCard {...doctor} variant="homepage" />
          </div>
        ))}
        
        {/* End card - View all */}
        <Link 
          to="/search"
          className="shrink-0 min-w-[200px] max-w-[200px] rounded-2xl bg-card/10 border border-card/20 flex flex-col items-center justify-center p-4 hover:bg-card/20 transition-colors group"
        >
          <div className="text-center">
            <div className="text-label text-card/80 mb-1 text-xs uppercase tracking-wide font-bold">Explore All</div>
            <div className="text-data text-xl text-card mb-3 font-black">{doctors.length}+</div>
            <p className="text-xs text-card/70 mb-3">Top Rated</p>
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
              <ArrowRight className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation controls */}
      <div className="absolute -top-16 right-0 flex items-center gap-2">
        <Link to="/search" className="text-interface text-card/80 hover:text-primary transition-colors flex items-center gap-1 mr-4">
          VIEW ALL
          <ArrowRight className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-1 border-l border-card/20 pl-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPaused(!isPaused)}
            className="h-8 w-8 rounded-lg bg-transparent border border-card/30 text-card/70 hover:bg-card/10 hover:text-card"
            title={isPaused ? "Resume auto-scroll" : "Pause auto-scroll"}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll("left")}
            className="h-8 w-8 rounded-lg bg-transparent border border-card/30 text-card/70 hover:bg-card/10 hover:text-card"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll("right")}
            className="h-8 w-8 rounded-lg bg-transparent border border-card/30 text-card/70 hover:bg-card/10 hover:text-card"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
