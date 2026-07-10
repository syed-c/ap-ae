'use client';
import Link from "next/link";
import Head from "next/head";
import { PageLayout } from "@/components/layout/PageLayout";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail, Clock, ArrowRight, Phone } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const BASE_URL = 'https://www.appointpanda.ae';

const ListYourPracticeSuccessPage = () => {
  const { data: siteSettings } = useSiteSettings();
  const supportEmail = siteSettings?.contactDetails?.support_email || 'support@AppointPanda.ae';

  return (
    <PageLayout>
      <Head>
        <title>Submission Received | AppointPanda</title>
        <meta name="description" content="Your practice listing request has been received. Our team will review and verify your details within 24-48 hours." />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href={`${BASE_URL}/list-your-practice/success/`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/list-your-practice/success/`} />
        <meta property="og:image" content={`${BASE_URL}/og-image.png`} />
        <meta property="og:site_name" content="AppointPanda" />
        <meta property="og:locale" content="en_AE" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`${BASE_URL}/list-your-practice/success/`} />
        <meta name="twitter:title" content="Submission Received | AppointPanda" />
        <meta name="twitter:description" content="Your practice listing request has been received. Our team will review and verify your details within 24-48 hours." />
        <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />
        <link rel="alternate" hrefLang="en-AE" href={`${BASE_URL}/list-your-practice/success/`} />
        <link rel="alternate" hrefLang="x-default" href={`${BASE_URL}/list-your-practice/success/`} />
        <link rel="sitemap" type="application/xml" href={`${BASE_URL}/sitemap.xml`} />
      </Head>
      <Section size="lg" className="pt-32">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="h-12 w-12 text-primary" />
          </div>

          {/* Heading */}
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Submission <span className="text-gradient">Received!</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8">
            Thank you for listing your practice with us. We're excited to have you on board!
          </p>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="card-modern p-6 text-left">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">Check Your Email</h3>
              <p className="text-sm text-muted-foreground">
                We've sent a confirmation email with details about your submission and next steps.
              </p>
            </div>

            <div className="card-modern p-6 text-left">
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-gold" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">What's Next?</h3>
              <p className="text-sm text-muted-foreground">
                Our team will review your listing within 24-48 hours and reach out to complete the verification process.
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="card-modern p-6 mb-8">
            <h3 className="font-display font-bold text-lg mb-4 text-left">Verification Timeline</h3>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                  1
                </div>
                <div className="text-left">
                  <p className="font-bold">Submission Received</p>
                  <p className="text-sm text-muted-foreground">Your listing request is now in our queue</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-sm shrink-0">
                  2
                </div>
                <div className="text-left">
                  <p className="font-bold">Team Review</p>
                  <p className="text-sm text-muted-foreground">We'll verify your practice details (24-48 hours)</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-sm shrink-0">
                  3
                </div>
                <div className="text-left">
                  <p className="font-bold">Account Setup</p>
                  <p className="text-sm text-muted-foreground">You'll receive login credentials to manage your profile</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-sm shrink-0">
                  4
                </div>
                <div className="text-left">
                  <p className="font-bold">Go Live</p>
                  <p className="text-sm text-muted-foreground">Your profile will be visible to thousands of patients</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="rounded-xl font-bold">
              <Link href="/">
                Back to Home
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-xl font-bold">
              <Link href="/contact">
                <Phone className="mr-2 h-4 w-4" />
                Contact Support
              </Link>
            </Button>
          </div>

          {/* Contact Info */}
          <p className="text-sm text-muted-foreground mt-8">
            Questions? Email us at <a href={`mailto:${supportEmail}`} className="text-primary hover:underline">{supportEmail}</a>
          </p>
        </div>
      </Section>
    </PageLayout>
  );
};

export default ListYourPracticeSuccessPage;
