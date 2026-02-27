import { PageLayout } from "@/components/layout/PageLayout";
import { Section } from "@/components/layout/Section";
import { SEOHead } from "@/components/seo/SEOHead";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Shield, FileCheck, Users, AlertTriangle, RefreshCw, BookOpen } from "lucide-react";

const EditorialPolicyPage = () => {
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Editorial Policy" },
  ];

  return (
    <PageLayout>
      <SEOHead
        title="Editorial Policy - How We Create & Review Content"
        description="Learn about AppointPanda's editorial standards, fact-checking process, and commitment to accurate, evidence-based dental health information for UAE patients."
        canonical="/editorial-policy/"
      />

      <section className="bg-gradient-to-b from-background via-primary/5 to-background pt-6 pb-12">
        <div className="container">
          <div className="flex justify-center mb-6">
            <Breadcrumbs items={breadcrumbs} />
          </div>
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">Our Standards</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">Editorial Policy</h1>
            <p className="text-lg text-muted-foreground">How we ensure accurate, trustworthy dental health content for UAE patients.</p>
          </div>
        </div>
      </section>

      <Section size="lg">
        <div className="max-w-3xl mx-auto space-y-10">
          <PolicySection
            icon={Shield}
            title="Our Commitment to Accuracy"
            content="All content published on AppointPanda is created, reviewed, and maintained to the highest editorial standards. Our goal is to provide UAE residents with accurate, evidence-based dental health information that helps them make informed decisions about their oral care."
          />
          <PolicySection
            icon={FileCheck}
            title="Content Creation Process"
            content="Every piece of content goes through a multi-step review process: (1) Research by qualified writers using peer-reviewed sources and UAE health authority guidelines (DHA, DoH, MOHAP). (2) Fact-checking against current clinical evidence. (3) Review by dental professionals for clinical accuracy. (4) Final editorial review for clarity, completeness, and compliance."
          />
          <PolicySection
            icon={Users}
            title="Expert Contributors"
            content="Our content is informed by licensed dental professionals practicing in the UAE. Contributors include general dentists, specialists, and dental hygienists who ensure our information reflects current best practices and UAE-specific standards. All expert contributors disclose any conflicts of interest."
          />
          <PolicySection
            icon={AlertTriangle}
            title="Corrections & Updates"
            content="We take accuracy seriously. If you identify an error or outdated information, please contact us at editorial@appointpanda.ae. Corrections are made promptly and transparently. Significant corrections are noted at the top of the affected content."
          />
          <PolicySection
            icon={RefreshCw}
            title="Regular Content Reviews"
            content="All clinical and health-related content is reviewed at least annually to ensure it remains current with the latest dental research and UAE regulatory standards. Each article displays its last review date for transparency."
          />

          <div className="bg-muted/50 rounded-2xl p-6 border border-border">
            <h3 className="font-bold text-foreground mb-2">Disclaimer</h3>
            <p className="text-sm text-muted-foreground">
              Content on AppointPanda is for informational purposes only and does not constitute medical advice. Always consult a qualified dental professional for diagnosis and treatment. Pricing information displayed is estimated and subject to change — final costs require an in-person consultation.
            </p>
          </div>
        </div>
      </Section>
    </PageLayout>
  );
};

function PolicySection({ icon: Icon, title, content }: { icon: any; title: string; content: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mt-1">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground mb-2">{title}</h2>
        <p className="text-muted-foreground leading-relaxed">{content}</p>
      </div>
    </div>
  );
}

export default EditorialPolicyPage;
