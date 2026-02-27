/**
 * ConversationalQABlock - AI-crawl optimized Q&A section
 * 
 * Designed for LLM discovery (ChatGPT, Gemini, Perplexity).
 * Uses semantic HTML with clear question/answer structure that
 * AI agents can parse without needing JavaScript rendering.
 */
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MessageCircleQuestion, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QAItem {
  question: string;
  answer: string;
  /** Optional: conversational follow-up that AI agents can chain */
  followUp?: string;
}

interface ConversationalQABlockProps {
  title?: string;
  subtitle?: string;
  items: QAItem[];
  /** Context label for AI crawlers (e.g., "dental-implants-dubai") */
  contextLabel?: string;
  className?: string;
  /** Render as open accordion items for better crawlability */
  defaultOpen?: boolean;
}

export function ConversationalQABlock({
  title = "Common Questions",
  subtitle,
  items,
  contextLabel,
  className,
  defaultOpen = false,
}: ConversationalQABlockProps) {
  if (!items.length) return null;

  return (
    <section
      className={cn("py-8", className)}
      aria-label={title}
      data-ai-context={contextLabel}
      itemScope
      itemType="https://schema.org/FAQPage"
    >
      <div className="flex items-center gap-2 mb-2">
        <MessageCircleQuestion className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      </div>
      {subtitle && (
        <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>
      )}

      <Accordion
        type="multiple"
        defaultValue={defaultOpen ? items.map((_, i) => `qa-${i}`) : undefined}
        className="space-y-2"
      >
        {items.map((item, index) => (
          <AccordionItem
            key={index}
            value={`qa-${index}`}
            className="border rounded-xl px-4 bg-card"
            itemScope
            itemProp="mainEntity"
            itemType="https://schema.org/Question"
          >
            <AccordionTrigger className="text-left text-sm font-medium hover:no-underline py-3">
              <span itemProp="name">{item.question}</span>
            </AccordionTrigger>
            <AccordionContent
              itemScope
              itemProp="acceptedAnswer"
              itemType="https://schema.org/Answer"
            >
              <div className="pb-3 space-y-2">
                <p
                  className="text-sm text-muted-foreground leading-relaxed"
                  itemProp="text"
                >
                  {item.answer}
                </p>
                {item.followUp && (
                  <div className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <Bot className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground italic">
                      {item.followUp}
                    </p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
