/**
 * AIDiscoveryMeta - Invisible structured data for AI search engines
 * 
 * Adds Speakable schema, enhanced FAQ JSON-LD, and conversational
 * context that AI agents like ChatGPT/Gemini/Perplexity use to
 * surface content in AI-generated answers.
 */
import { Helmet } from "react-helmet-async";

interface AIDiscoveryMetaProps {
  /** Page title for speakable content */
  pageTitle: string;
  /** Short conversational summary (1-2 sentences) that AI can quote */
  aiSummary: string;
  /** CSS selectors for speakable content sections */
  speakableSections?: string[];
  /** Key facts as simple strings for AI extraction */
  keyFacts?: string[];
  /** Entity type: clinic, treatment, location */
  entityType: "clinic" | "treatment" | "location" | "dentist";
  /** Geographic scope */
  location?: {
    city?: string;
    area?: string;
    country?: string;
  };
  /** FAQ items to embed as JSON-LD (supplements visual Q&A) */
  faqs?: Array<{ question: string; answer: string }>;
  /** Page URL path */
  url: string;
}

const BASE_URL = "https://www.appointpanda.ae";

export function AIDiscoveryMeta({
  pageTitle,
  aiSummary,
  speakableSections = ["[data-ai-context]", "h1", "h2"],
  keyFacts,
  entityType,
  location,
  faqs,
  url,
}: AIDiscoveryMetaProps) {
  const schemas: object[] = [];

  // Speakable schema for voice assistants and AI agents
  schemas.push({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: pageTitle,
    description: aiSummary,
    url: `${BASE_URL}${url}`,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: speakableSections,
    },
    ...(location?.country && {
      spatialCoverage: {
        "@type": "Place",
        name: [location.area, location.city, location.country]
          .filter(Boolean)
          .join(", "),
      },
    }),
  });

  // NOTE: FAQ schema is NOT emitted here to avoid duplicate FAQPage schemas.
  // The StructuredData component handles FAQ schema rendering on pages.
  // Duplicating it here causes Google Search Console "duplicate field FAQ" errors.

  // HowTo schema for treatment pages
  if (entityType === "treatment" && keyFacts?.length) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: `How to find the best ${pageTitle} in the UAE`,
      description: aiSummary,
      step: keyFacts.map((fact, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        text: fact,
      })),
    });
  }

  return (
    <Helmet>
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
      {/* AI-friendly meta tags */}
      <meta name="ai-summary" content={aiSummary} />
      {keyFacts?.length && (
        <meta name="ai-key-facts" content={keyFacts.join(" | ")} />
      )}
    </Helmet>
  );
}
