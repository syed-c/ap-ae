import Link from "next/link";
import { PageLayout } from "@/components/layout/PageLayout";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";
import { PageHero } from "@/components/layout/PageHero";
import {
  Search,
  UserCheck,
  Calendar,
  Star,
  ArrowRight,
  CheckCircle,
  Building2,
  TrendingUp,
  Shield,
  Phone,
  Users
} from "lucide-react";

const HowItWorksPage = () => {
  const patientSteps = [
    {
      step: 1,
      icon: Search,
      title: "Search",
      description: "Enter your location and the type of dental service you need. Browse through verified dental professionals in your area.",
      color: "from-primary/20 to-teal/10"
    },
    {
      step: 2,
      icon: UserCheck,
      title: "Compare",
      description: "Review dentist profiles, check qualifications, read patient reviews, and compare ratings to find your perfect match.",
      color: "from-purple/20 to-indigo-500/10"
    },
    {
      step: 3,
      icon: Calendar,
      title: "Book",
      description: "Request an appointment directly through the platform. The clinic will contact you to confirm your booking.",
      color: "from-gold/20 to-amber-500/10"
    },
    {
      step: 4,
      icon: Star,
      title: "Review",
      description: "After your visit, share your experience to help other patients make informed decisions.",
      color: "from-coral/20 to-pink/10"
    },
  ];

  const dentistSteps = [
    {
      step: 1,
      icon: Building2,
      title: "Create Profile",
      description: "List your practice for free or claim an existing profile. Add your services, qualifications, and photos."
    },
    {
      step: 2,
      icon: Shield,
      title: "Get Verified",
      description: "Complete our verification process to earn the verified badge and boost your visibility in search results."
    },
    {
      step: 3,
      icon: Phone,
      title: "Receive Inquiries",
      description: "Get appointment requests directly from patients searching for dental care in your area."
    },
    {
      step: 4,
      icon: TrendingUp,
      title: "Grow Your Practice",
      description: "Build your reputation with patient reviews and attract more patients to your clinic."
    },
  ];

  const patientBenefits = [
    "Access to verified dental professionals",
    "Real patient reviews and ratings",
    "Easy online appointment requests",
    "Compare clinics and prices",
    "Find specialists for any treatment",
    "100% free to use"
  ];

  const dentistBenefits = [
    "Free basic listing",
    "Reach thousands of patients",
    "Verified badge for trust",
    "Higher search visibility",
    "Manage reviews and reputation",
    "Analytics and insights"
  ];

  return (
    <PageLayout>
      <SEOHead
        title="How It Works | Find Dentists or List Your Practice"
        description="Learn how AppointPanda works. Patients can search, compare, and book dental appointments. Dentists can list their practice and reach more patients."
        canonical="/how-it-works/"
        keywords={['how to find dentist', 'book dental appointment', 'list dental practice', 'dental directory']}
      />

      <PageHero
        badge="How It Works"
        title="Finding dental care made"
        highlight="simple"
        description="From search to booking, here's how AppointPanda helps you find the right dentist in just a few steps."
      />

      {/* For Patients */}
      <Section size="lg">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-primary">For Patients</span>
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-2">
            Find Your Perfect <span className="text-primary">Dentist</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {patientSteps.map((item, i) => (
            <div key={i} className="relative">
              <div className="card-modern p-6 text-center h-full card-hover">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-xl mx-auto mb-4 shadow-glow">
                  {item.step}
                </div>
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-4`}>
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              {i < patientSteps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-border" />
              )}
            </div>
          ))}
        </div>

        <div className="card-modern p-8 bg-gradient-to-br from-primary/5 via-transparent to-teal/5 border-primary/20">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="font-display text-2xl font-bold mb-4">Patient Benefits</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {patientBenefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center md:text-right">
              <Button asChild size="lg" className="rounded-2xl font-bold shadow-glow">
                <Link href="/search/">
                  Find a Dentist
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* For Dentists */}
      <Section variant="dark" size="lg">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-primary">For Dentists</span>
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-2 text-dark-section-foreground">
            Grow Your <span className="text-primary">Practice</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {dentistSteps.map((item, i) => (
            <div key={i} className="relative">
              <div className="bg-card/10 backdrop-blur-sm border border-white/10 rounded-3xl p-6 text-center h-full hover:bg-card/20 transition-colors">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-xl mx-auto mb-4 shadow-glow">
                  {item.step}
                </div>
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold mb-2 text-white">{item.title}</h3>
                <p className="text-sm text-white/70">{item.description}</p>
              </div>
              {i < dentistSteps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-white/20" />
              )}
            </div>
          ))}
        </div>

        <div className="bg-card/10 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="font-display text-2xl font-bold mb-4 text-white">Dentist Benefits</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {dentistBenefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/90">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center md:text-right space-y-3">
              <Button asChild size="lg" className="rounded-2xl font-bold shadow-glow">
                <Link href="/list-your-practice/">
                  List Your Practice
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <p className="text-white/60 text-sm">
                Already listed? <Link href="/claim-profile/" className="text-primary hover:underline">Claim your profile</Link>
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section variant="primary" size="md">
        <div className="text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Join thousands of patients and dentists already using AppointPanda.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" variant="secondary" className="rounded-2xl font-bold">
              <Link href="/search/">Find a Dentist</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-2xl font-bold border-white/40 text-white bg-white/10 hover:bg-white/20">
              <Link href="/list-your-practice/">List Your Practice</Link>
            </Button>
          </div>
        </div>
      </Section>
    </PageLayout>
  );
};

export default HowItWorksPage;
