import { PageLayout } from "@/components/layout/PageLayout";
import { Section } from "@/components/layout/Section";
import { SEOHead } from "@/components/seo/SEOHead";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { StructuredData } from "@/components/seo/StructuredData";
import { BadgeCheck, Shield, FileCheck, Search, Clock, AlertTriangle, Building2, UserCheck } from "lucide-react";

const VerificationPolicyPage = () => {
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Verification Policy" },
  ];

  const verificationLevels = [
    {
      level: "Basic Listing",
      badge: "Listed",
      color: "bg-muted text-muted-foreground",
      items: ["Clinic name and contact info published", "Appears in directory search results", "No verification of ownership"],
    },
    {
      level: "Claimed Profile",
      badge: "Claimed",
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      items: ["Ownership verified via email or phone OTP", "Clinic can manage their profile info", "Can respond to patient reviews"],
    },
    {
      level: "Verified Practice",
      badge: "✓ Verified",
      color: "bg-primary/10 text-primary",
      items: ["DHA / DoH / MOHAP license verified", "Practice address confirmed", "Priority ranking in search results", "Verified badge displayed on profile"],
    },
  ];

  const faqs = [
    { question: "How long does verification take?", answer: "The verification process typically takes 2-5 business days after submitting all required documents." },
    { question: "What documents are needed?", answer: "We require a valid DHA, DoH, or MOHAP license, trade license, and proof of address for the practice location." },
    { question: "Does verification cost anything?", answer: "Basic verification is included with our plans. The verification process itself is free of charge." },
    { question: "How often is verification renewed?", answer: "Verification status is reviewed annually or when license renewal is due, whichever comes first." },
  ];

  return (
    <PageLayout>
      <SEOHead
        title="Verification Policy - How We Verify Dental Practices"
        description="Learn how AppointPanda verifies dental clinics and dentists in the UAE. Our multi-step process ensures patients connect with legitimate, licensed professionals."
        canonical="/verification-policy/"
      />
      <StructuredData type="faq" questions={faqs} />

      <section className="bg-gradient-to-b from-background via-primary/5 to-background pt-6 pb-12">
        <div className="container">
          <div className="flex justify-center mb-6">
            <Breadcrumbs items={breadcrumbs} />
          </div>
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
              <BadgeCheck className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">Trust & Safety</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">Verification Policy</h1>
            <p className="text-lg text-muted-foreground">How we verify dental practices to protect patient trust across the UAE.</p>
          </div>
        </div>
      </section>

      <Section size="lg">
        <div className="max-w-3xl mx-auto space-y-12">
          {/* Verification Levels */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Verification Levels</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {verificationLevels.map((level) => (
                <div key={level.level} className="bg-card border border-border rounded-2xl p-5 flex flex-col">
                  <span className={`inline-block self-start text-xs font-bold px-3 py-1 rounded-full mb-3 ${level.color}`}>
                    {level.badge}
                  </span>
                  <h3 className="font-bold text-foreground mb-3">{level.level}</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {level.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <FileCheck className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Process */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Our Verification Process</h2>
            <div className="space-y-4">
              {[
                { icon: Search, title: "Document Submission", desc: "Clinic submits DHA/DoH/MOHAP license, trade license, and practice documentation." },
                { icon: UserCheck, title: "Identity Verification", desc: "We verify the submitter's identity and authority to represent the practice." },
                { icon: Building2, title: "Practice Confirmation", desc: "Physical address and practice details are confirmed through official records." },
                { icon: Shield, title: "Badge Awarded", desc: "Upon successful verification, the practice receives the Verified badge visible to patients." },
              ].map((step, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ongoing Monitoring */}
          <div className="bg-muted/50 rounded-2xl p-6 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-foreground">Ongoing Monitoring</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Verification is not a one-time event. We continuously monitor verified practices for:
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• License expiration and renewal status</li>
              <li>• Patient complaint patterns</li>
              <li>• Regulatory actions from DHA, DoH, or MOHAP</li>
              <li>• Profile accuracy and information currency</li>
            </ul>
          </div>

          {/* Reporting */}
          <div className="flex gap-4 items-start">
            <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-1">Report a Concern</h3>
              <p className="text-sm text-muted-foreground">
                If you believe a listed practice is unlicensed or misrepresenting their credentials, please report it to{" "}
                <a href="mailto:trust@appointpanda.ae" className="text-primary hover:underline">trust@appointpanda.ae</a>.
                All reports are investigated within 48 hours.
              </p>
            </div>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4">
                  <h3 className="font-bold text-foreground mb-1">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </PageLayout>
  );
};

export default VerificationPolicyPage;
