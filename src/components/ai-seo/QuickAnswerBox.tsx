/**
 * QuickAnswerBox - Featured snippet-style answer box
 * 
 * Provides a concise, AI-extractable answer at the top of content
 * sections. Optimized for position-zero SERP features and AI citation.
 */
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAnswerBoxProps {
  /** The question being answered */
  question: string;
  /** Concise answer (1-3 sentences max) */
  answer: string;
  /** Optional bullet points for structured data */
  highlights?: string[];
  className?: string;
}

export function QuickAnswerBox({
  question,
  answer,
  highlights,
  className,
}: QuickAnswerBoxProps) {
  return (
    <Card
      className={cn(
        "border-primary/20 bg-primary/5",
        className
      )}
      data-ai-context="quick-answer"
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{question}</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {answer}
        </p>
        {highlights?.length ? (
          <ul className="space-y-1 mt-2">
            {highlights.map((h, i) => (
              <li
                key={i}
                className="text-xs text-muted-foreground flex items-start gap-2"
              >
                <span className="text-primary mt-0.5">•</span>
                {h}
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
