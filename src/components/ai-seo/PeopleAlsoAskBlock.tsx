/**
 * PeopleAlsoAskBlock - Mimics Google's "People Also Ask" pattern
 * 
 * Optimized for AI crawlers to extract conversational Q&A pairs.
 * Each answer is structured as a concise, citable paragraph.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PAAItem {
  question: string;
  answer: string;
  /** Source attribution (e.g., "DHA Guidelines 2024") */
  source?: string;
}

interface PeopleAlsoAskBlockProps {
  items: PAAItem[];
  title?: string;
  className?: string;
}

export function PeopleAlsoAskBlock({
  items,
  title = "People Also Ask",
  className,
}: PeopleAlsoAskBlockProps) {
  if (!items.length) return null;

  return (
    <Card className={cn("border bg-card", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <HelpCircle className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Accordion type="single" collapsible className="space-y-1">
          {items.map((item, i) => (
            <AccordionItem
              key={i}
              value={`paa-${i}`}
              className="border-b last:border-b-0"
            >
              <AccordionTrigger className="text-sm font-medium text-left hover:no-underline py-3">
                {item.question}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground leading-relaxed pb-2">
                  {item.answer}
                </p>
                {item.source && (
                  <p className="text-xs text-muted-foreground/60 italic">
                    Source: {item.source}
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
