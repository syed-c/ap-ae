import { Link } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useSeoPageContent } from "@/hooks/useSeoPageContent";
import { useRealCounts } from "@/hooks/useRealCounts";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MessageSquare, ArrowRight, Search, Building2, HelpCircle, Users, Shield, Phone } from "lucide-react";

const FAQPage = () => {
  const { data: siteSettings } = useSiteSettings();
  const { data: counts } = useRealCounts();
  const { data: seoContent } = useSeoPageContent("faq");
  const supportEmail = siteSettings?.contactDetails?.support_email || 'support@appointpanda.ae';
  const supportPhone = siteSettings?.contactDetails?.support_phone || '+971 4 123 4567';

  const categories = [
    {
      icon: Users,
      title: "For Patients",
      color: "from-primary/20 to-teal/10",
      faqs: [
        {
          q: "How do I find a DHA-licensed dentist in Dubai?",
          a: "Use our search feature to filter by emirate, area, or treatment type. All dentists on AppointPanda are licensed by DHA (Dubai), DOH (Abu Dhabi), or MOHAP. Dentists with the 'Verified' badge have completed our additional credential verification."
        },
        {
          q: "What is the average cost of dental treatment in Dubai (AED)?",
          a: "Costs vary by treatment and clinic: teeth whitening starts from AED 500, dental implants from AED 3,000, Invisalign from AED 8,000, veneers from AED 800 per tooth, and root canal from AED 1,000. Prices differ by area — clinics in DIFC or Jumeirah may charge more than those in Deira or Karama. Always confirm pricing at your consultation."
        },
        {
          q: "Are there English-speaking dentists in Dubai?",
          a: "Absolutely. The UAE has a highly diverse medical workforce. Most dentists speak English fluently, and many also speak Arabic, Hindi, Urdu, Tagalog, and other languages common in the UAE's expat community."
        },
        {
          q: "Do dentists in UAE accept insurance?",
          a: "Yes, most clinics accept major UAE insurance providers including Daman Health, AXA Gulf, Oman Insurance (Sukoon), Cigna, MetLife, ADNIC, Noor Takaful, and Dubai Insurance Company. Use our insurance filter to find clinics that accept your specific plan."
        },
        {
          q: "Can I book same-day emergency dental appointments in Dubai?",
          a: "Yes, many clinics on AppointPanda offer same-day emergency appointments. Search for 'Emergency Dental Care' and filter by your area. Clinics in Dubai, Abu Dhabi, and Sharjah typically have extended hours for emergencies."
        },
        {
          q: "Are dental treatments covered under my employment visa insurance?",
          a: "Most UAE employment visa insurance plans include basic dental coverage (check-ups, cleaning, extractions). Coverage for cosmetic procedures varies by plan. Check with your insurer or use our insurance filter to find clinics that accept your specific provider."
        },
        {
          q: "Is AppointPanda free for patients?",
          a: "Yes, AppointPanda is completely free for patients. You can search for dentists, read reviews, compare AED pricing, and request appointments without any charges."
        },
      ]
    },
    {
      icon: Building2,
      title: "For Dentists & Clinics",
      color: "from-gold/20 to-amber-500/10",
      faqs: [
        {
          q: "How do I list my clinic on AppointPanda?",
          a: "Visit our 'List Your Practice' page and fill out the registration form with your DHA/DOH/MOHAP license number. Our team will verify your credentials and contact you within 24-48 hours. Basic listings are free."
        },
        {
          q: "What are the benefits of a verified profile?",
          a: "Verified profiles receive a DHA/DOH verification badge, higher search ranking, priority placement in results, access to analytics dashboard, the ability to respond to reviews, and increased visibility to the UAE's large expat community."
        },
        {
          q: "How do I claim an existing clinic profile?",
          a: "If your clinic is already listed, visit our 'Claim Profile' page. Search for your clinic, verify ownership through email or phone OTP, and gain control of your profile to update information, add AED pricing, and respond to patient reviews."
        },
        {
          q: "Can I manage multiple clinic locations?",
          a: "Yes, you can manage multiple clinic locations across different emirates under one account. Each location will have its own profile page, and you can manage them all from a single dashboard."
        },
        {
          q: "How do I display pricing in AED on my profile?",
          a: "Once your profile is claimed or created, you can add treatment prices in AED through your dashboard. Price ranges are displayed to patients, helping them make informed decisions before booking."
        },
      ]
    },
    {
      icon: HelpCircle,
      title: "UAE Dental Care",
      color: "from-purple/20 to-indigo-500/10",
      faqs: [
        {
          q: "What is the difference between DHA and DOH licensed dentists?",
          a: "DHA (Dubai Health Authority) licenses and regulates healthcare practitioners in Dubai. DOH (Department of Health) does the same for Abu Dhabi. MOHAP (Ministry of Health and Prevention) covers the remaining 5 emirates — Sharjah, Ajman, Ras Al Khaimah, Fujairah, and Umm Al Quwain. All maintain rigorous standards."
        },
        {
          q: "What areas does AppointPanda cover?",
          a: "AppointPanda covers dental practices across all 7 UAE Emirates — Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah, and Umm Al Quwain. Within Dubai alone, we cover areas including Jumeirah, Marina, Downtown, Deira, Bur Dubai, JLT, DIFC, Business Bay, Mirdif, Al Barsha, Karama, and Satwa."
        },
        {
          q: "Are dental clinics in UAE JCI accredited?",
          a: "Many top clinics in the UAE hold JCI (Joint Commission International) accreditation, the gold standard for healthcare quality. Look for the JCI badge on clinic profiles or filter for accredited clinics in your search."
        },
        {
          q: "Is dental tourism popular in the UAE?",
          a: "Yes, the UAE — especially Dubai — is a growing dental tourism destination. Many clinics offer dental tourism packages that include consultation, treatment, and follow-up care at competitive AED rates compared to Western countries."
        },
        {
          q: "How do I report incorrect information?",
          a: `If you find incorrect information on any listing, please contact us at ${supportEmail}. We take data accuracy seriously and will investigate and correct any errors promptly.`
        },
      ]
    }
  ];

  return (
    <PageLayout>
      <SEOHead
        title={seoContent?.meta_title || "FAQ | Dental Care Questions in Dubai & UAE | AppointPanda"}
        description={seoContent?.meta_description || "Find answers about DHA-licensed dentists, dental costs in AED, UAE insurance coverage, and booking appointments in Dubai, Abu Dhabi & Sharjah."}
        canonical="/faq/"
        keywords={['dental FAQ UAE', 'dentist dubai questions', 'DHA licensed dentist', 'dental cost AED', 'UAE dental insurance']}
      />

      {/* Dark Hero Section */}
      <section className="relative bg-dark-section text-dark-section-foreground overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.1),transparent_50%)]" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
        
        <div className="container relative py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <HelpCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">Help Center</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black mb-6" style={{ fontFamily: "'Varela Round', 'Quicksand', sans-serif" }}>
              Frequently Asked{" "}
              <span className="text-primary">Questions</span>
            </h1>
            
            <p className="text-lg text-dark-section-foreground/70 max-w-xl mx-auto mb-8">
              Find answers about dental care in the UAE — from DHA licensing to AED costs and insurance coverage.
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <Building2 className="h-4 w-4 text-primary" />
                <span>{counts?.clinics?.toLocaleString() || "6,600+"}+ Practices</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <Shield className="h-4 w-4 text-gold" />
                <span>DHA & DOH Verified</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <Users className="h-4 w-4 text-coral" />
                <span>Free for Patients</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Sections */}
      <Section size="lg">
        <div className="max-w-4xl mx-auto space-y-12">
          {categories.map((category, catIndex) => (
            <div key={catIndex} className="card-modern p-6 md:p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                  <category.icon className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-2xl font-black" style={{ fontFamily: "'Varela Round', 'Quicksand', sans-serif" }}>{category.title}</h2>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                {category.faqs.map((faq, faqIndex) => (
                  <AccordionItem key={faqIndex} value={`${catIndex}-${faqIndex}`} className="border-border/50">
                    <AccordionTrigger className="text-left font-bold hover:text-primary py-5">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </Section>

      {/* Still Have Questions CTA */}
      <Section variant="muted" size="lg">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black mb-4" style={{ fontFamily: "'Varela Round', 'Quicksand', sans-serif" }}>
            Still Have Questions?
          </h2>
          <p className="text-muted-foreground mb-8">
            Can't find what you're looking for? Our UAE-based support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="rounded-2xl font-bold">
              <Link to="/contact">
                Contact Support
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-2xl font-bold">
              <a href={`tel:${supportPhone.replace(/[^\d+]/g, '')}`}>
                <Phone className="mr-2 h-5 w-5" />
                Call Us
              </a>
            </Button>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section variant="dark" size="md">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4 text-dark-section-foreground" style={{ fontFamily: "'Varela Round', 'Quicksand', sans-serif" }}>
            Ready to find your dentist in UAE?
          </h2>
          <p className="text-dark-section-foreground/70 mb-8 max-w-xl mx-auto">
            Join thousands of patients across Dubai, Abu Dhabi & Sharjah who've found their perfect dental care provider through AppointPanda.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="rounded-2xl font-bold shadow-glow">
              <Link to="/search">
                <Search className="mr-2 h-5 w-5" />
                Find a Dentist
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-2xl font-bold border-white/40 text-white bg-white/10 hover:bg-white/20">
              <Link to="/list-your-practice">List Your Practice</Link>
            </Button>
          </div>
        </div>
      </Section>
    </PageLayout>
  );
};

export default FAQPage;
