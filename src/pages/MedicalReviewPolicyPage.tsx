import { PageLayout } from "@/components/layout/PageLayout";
import { Section } from "@/components/layout/Section";
import { SEOHead } from "@/components/seo/SEOHead";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Stethoscope, CheckCircle, Users, FileCheck, RefreshCw, ShieldCheck } from "lucide-react";

const MedicalReviewPolicyPage = () => {
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Medical Review Policy" },
  ];

  const reviewSteps = [
    { step: "1", title: "Content Drafting", desc: "Qualified health writers create content using peer-reviewed sources, UAE health authority (DHA, DoH, MOHAP) guidelines, and clinical evidence." },
    { step: "2", title: "Clinical Review", desc: "A licensed dental professional reviews the content for clinical accuracy, appropriate terminology, and alignment with current best practices in the UAE." },
    { step: "3", title: "Compliance Check", desc: "Content is checked against UAE advertising regulations and health information standards to ensure full regulatory compliance." },
    { step: "4", title: "Publication & Monitoring", desc: "Approved content is published with clear attribution. All medical content is scheduled for periodic review to maintain accuracy." },
  ];

  return (
    <PageLayout>
      <SEOHead
        title="Medical Review Policy - Clinical Content Standards"
        description="Understand how AppointPanda's dental health content is reviewed by licensed professionals to ensure clinical accuracy and compliance with UAE health standards."
        canonical="/medical-review-policy/"
      />

      <section className="bg-gradient-to-b from-background via-primary/5 to-background pt-6 pb-12">
        <div className="container">
          <div className="flex justify-center mb-6">
            <Breadcrumbs items={breadcrumbs} />
          </div>
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
              <Stethoscope className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">Clinical Standards</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">Medical Review Policy</h1>
            <p className="text-lg text-muted-foreground">How we ensure clinical accuracy in all dental health content.</p>
          </div>
        </div>
      </section>

      <Section size="lg">
        <div className="max-w-3xl mx-auto space-y-10">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Our Review Process</h2>
            <p className="text-muted-foreground mb-8">
              Every piece of health-related content on AppointPanda undergoes a rigorous multi-step medical review process to ensure patients receive accurate, trustworthy information.
            </p>

            <div className="space-y-6">
              {reviewSteps.map((step) => (
                <div key={step.step} className="flex gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-primary-foreground font-black text-lg flex items-center justify-center">
                    {step.step}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">{step.title}</h3>
                    <p className="text-muted-foreground text-sm">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <ReviewCard icon={Users} title="Reviewer Qualifications" desc="All medical reviewers are licensed dental professionals with active practice in the UAE, holding valid DHA, DoH, or MOHAP licenses." />
            <ReviewCard icon={ShieldCheck} title="Conflict of Interest" desc="Reviewers must disclose any financial or professional relationships that could influence their review. Content is never influenced by advertisers." />
            <ReviewCard icon={RefreshCw} title="Annual Re-Review" desc="All medical content is re-reviewed at minimum annually, or sooner when new clinical evidence or regulatory changes warrant updates." />
            <ReviewCard icon={FileCheck} title="Transparent Attribution" desc="Each reviewed article displays the reviewer's name, credentials, and review date so patients can verify the information source." />
          </div>

          <div className="bg-muted/50 rounded-2xl p-6 border border-border">
            <h3 className="font-bold text-foreground mb-2">Important Notice</h3>
            <p className="text-sm text-muted-foreground">
              Medical content on AppointPanda is reviewed for general accuracy but does not replace professional dental advice. Individual treatment decisions should always be made in consultation with a qualified dentist who can evaluate your specific situation.
            </p>
          </div>
        </div>
      </Section>
    </PageLayout>
  );
};

function ReviewCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="font-bold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

export default MedicalReviewPolicyPage;
