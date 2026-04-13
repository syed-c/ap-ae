'use client';
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  Search,
  MessageSquare
} from "lucide-react";

interface RelatedQuestion {
  question: string;
  answer?: string;
  slug?: string;
}

interface QuickAnswerProps {
  treatmentName: string;
  locationName: string;
  quickAnswer?: string;
  relatedQuestions?: RelatedQuestion[];
  stateSlug?: string;
  citySlug?: string;
  serviceSlug?: string;
}

export const QuickAnswer = ({
  treatmentName,
  locationName,
  quickAnswer,
  relatedQuestions = [],
  stateSlug,
  citySlug,
  serviceSlug,
}: QuickAnswerProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);

  // Default quick answer if not provided
  const defaultAnswer = `${treatmentName} in ${locationName} is provided by DHA-licensed dental professionals. This treatment addresses specific dental needs with prices ranging based on complexity. Book a consultation to get personalized advice and accurate pricing for your case.`;
  
  const displayAnswer = quickAnswer || defaultAnswer;

  // Sample related questions if not provided
  const defaultRelatedQuestions: RelatedQuestion[] = [
    { 
      question: `How much does ${treatmentName} cost in ${locationName}?`,
      answer: "Costs vary by clinic and case complexity. Prices typically range from AED 5,000 to AED 25,000 depending on the specific treatment type. Book a consultation for an accurate quote."
    },
    { 
      question: `How long does ${treatmentName} take?`,
      answer: "Treatment duration depends on your specific case. Some treatments can be completed in one visit, while others may take several months. Your dentist will provide a timeline during consultation."
    },
    { 
      question: `Is ${treatmentName} painful?`,
      answer: "Modern dentistry uses effective numbing techniques to ensure comfort during procedures. Some treatments may cause mild discomfort afterward, which is usually manageable with over-the-counter pain relief."
    },
    { 
      question: `What is the best clinic for ${treatmentName} in ${locationName}?`,
      answer: "We list verified clinics with patient reviews and ratings. Look for DHA-licensed practitioners with high ratings and positive reviews. Compare options using our directory."
    },
  ];

  const questions = relatedQuestions && relatedQuestions.length > 0 ? relatedQuestions : defaultRelatedQuestions;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/10 border border-amber-200 dark:border-amber-800 rounded-3xl overflow-hidden shadow-lg shadow-amber-500/10"
    >
      {/* Header - AI Summary */}
      <div 
        className="p-4 md:p-5 cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground">
                  Quick Answer
                </h3>
                <span className="text-xs bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full">
                  AI Overview
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                {displayAnswer.substring(0, 120)}...
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">
              {questions.length} related questions
            </span>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t border-amber-200 dark:border-amber-800"
          >
            <div className="p-4 md:p-5 space-y-4">
              {/* Full Answer */}
              <div className="bg-white/60 dark:bg-black/20 rounded-xl p-4">
                <h4 className="font-semibold text-sm text-foreground mb-2">
                  Summary
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {displayAnswer}
                </p>
              </div>

              {/* Related Questions - Accordion Style */}
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Related Questions
                </h4>
                <div className="space-y-2">
                  {questions.map((q, idx) => (
                    <div 
                      key={idx}
                      className="rounded-xl border border-amber-200 dark:border-amber-800 overflow-hidden"
                    >
                      <button
                        onClick={() => setSelectedQuestion(selectedQuestion === idx ? null : idx)}
                        className="w-full p-3 text-left flex items-center justify-between hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors"
                      >
                        <span className="text-sm font-medium text-foreground pr-4">
                          {q.question}
                        </span>
                        {selectedQuestion === idx ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                      </button>
                      <AnimatePresence>
                        {selectedQuestion === idx && q.answer && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-3 pb-3"
                          >
                            <p className="text-sm text-muted-foreground pl-2 border-l-2 border-amber-300">
                              {q.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              {/* Search Box */}
              <div className="pt-2">
                <a 
                  href={`/search?q=${encodeURIComponent(treatmentName)}`}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Search className="h-4 w-4" />
                  Search for more information about {treatmentName.toLowerCase()}
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default QuickAnswer;