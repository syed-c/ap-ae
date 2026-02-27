import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { parseMarkdownToHtml, stripMarkdown } from "@/lib/utils/parseMarkdown";

interface PageIntroSectionProps {
  title: string | null;
  content: string | null;
  isLoading?: boolean;
  className?: string;
}

/**
 * PageIntroSection - CMS-powered intro content section
 * Displays H2 heading and paragraph content from page_content table
 * Used on location pages (City, State, ServiceLocation) after hero
 */
export const PageIntroSection = ({
  title,
  content,
  isLoading = false,
  className = "",
}: PageIntroSectionProps) => {
  // IMPORTANT: Always render section structure for SEO crawlers
  // Even when loading, provide semantic HTML structure
  
  if (isLoading) {
    return (
      <section 
        className={`py-8 md:py-10 bg-muted/30 border-y border-border ${className}`}
        aria-busy="true"
      >
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="hidden md:flex shrink-0 h-10 w-10 rounded-xl bg-muted animate-pulse" />
                <div className="flex-1 space-y-3 animate-pulse">
                  <div className="h-6 w-2/3 bg-muted rounded-lg" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-muted rounded" />
                    <div className="h-4 w-5/6 bg-muted rounded" />
                    <div className="h-4 w-4/5 bg-muted rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // If no title AND no content, render minimal fallback for SEO structure
  if (!title && !content) {
    return null;
  }

  return (
    <section className={`py-8 md:py-10 bg-muted/30 border-y border-border ${className}`}>
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="hidden md:flex shrink-0 h-10 w-10 rounded-xl bg-primary/10 items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              
              <div className="flex-1 space-y-3">
                {title && (
                  <h2 
                    className="text-lg md:text-xl lg:text-2xl font-bold text-foreground"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {stripMarkdown(title)}
                  </h2>
                )}
                
                {content && (
                  <div 
                    className="text-sm md:text-base text-muted-foreground leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(content) }}
                  />
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PageIntroSection;
