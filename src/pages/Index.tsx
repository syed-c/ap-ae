import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  TimerReset,
  ChevronDown,
} from 'lucide-react'

import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { DirectoryHero } from '@/components/marketplace/DirectoryHero'
import { AutoScrollCarousel } from '@/components/AutoScrollCarousel'
import { Button } from '@/components/ui/button'
import { ACTIVE_STATES } from '@/lib/constants/activeStates'

interface RealCounts {
  clinics: number
  states: number
  cities: number
  dentists: number
  treatments: number
}

interface Profile {
  id: string
  name: string
  slug: string
  type: 'dentist' | 'clinic'
  specialty?: string
  location?: string
  rating: number
  reviewCount: number
  image?: string
  isVerified: boolean
}

interface State {
  id: string
  name: string
  slug: string
  abbreviation: string
}

interface Treatment {
  id: string
  name: string
  slug: string
}

interface IndexPageProps {
  seoDataProp?: {
    title: string
    description: string
  }
  realCountsProp?: RealCounts | null
  topProfilesProp?: Profile[]
  statesWithClinicsProp?: State[]
  featuredTreatmentsProp?: Treatment[]
}

const howItWorks = [
  {
    icon: Search,
    title: 'Search by location & service',
    description: 'Start with the emirate, city, treatment, or insurance provider that matters to you.',
  },
  {
    icon: Star,
    title: 'Compare trust signals',
    description: 'Review specialties, ratings, pricing, and verified credentials before choosing.',
  },
  {
    icon: CalendarDays,
    title: 'Book with confidence',
    description: 'Move from discovery to appointment in a seamless, transparent flow.',
  },
]

const faqs = [
  {
    question: 'How do I find a dentist near me in Dubai or Abu Dhabi?',
    answer:
      'Use the search panel to choose an emirate, area, and treatment. AppointPanda routes you to the most relevant service or location page.',
  },
  {
    question: 'Are the listings verified?',
    answer:
      'Yes. The platform is built around verification-first discovery, with DHA, DOH, and related trust signals highlighted across the patient journey.',
  },
  {
    question: 'Can I search with insurance in mind?',
    answer:
      'Yes. The homepage search includes insurance as part of the main discovery workflow so patients can narrow options earlier.',
  },
]

function formatCount(value: number | undefined): string {
  if (!value) return '0'
  return value.toLocaleString()
}

export default function Index({
  realCountsProp,
  topProfilesProp = [],
  statesWithClinicsProp = [],
  featuredTreatmentsProp = [],
}: IndexPageProps) {
  const [openFaq, setOpenFaq] = useState<string | null>(null)

  const featuredProfiles = topProfilesProp.map((profile) => ({
    name: profile.name,
    specialty: profile.specialty || 'Dental Professional',
    location: profile.location || 'UAE',
    rating: profile.rating,
    image:
      profile.image ||
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
    slug: profile.slug,
    type: profile.type,
  }))

  const visibleStates =
    statesWithClinicsProp.length > 0
      ? statesWithClinicsProp
      : ACTIVE_STATES.map((state) => ({
          id: state.slug,
          name: state.name,
          slug: state.slug,
          abbreviation: state.abbr,
        }))

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        {/* Hero Section */}
        <DirectoryHero
          badge="UAE's Trusted Dental Directory"
          title="Find the perfect dentist for your needs"
          highlight="Search, compare, and book with confidence"
          description="Browse verified dental professionals across all 7 Emirates. Compare trust signals, check insurance coverage, and book appointments — all in one place."
          stats={[
            { label: 'Dentists', value: formatCount(realCountsProp?.dentists || 500) + '+', icon: <Stethoscope className="h-4 w-4" /> },
            { label: 'Clinics', value: formatCount(realCountsProp?.clinics || 200) + '+', icon: <Building2 className="h-4 w-4" /> },
            { label: 'Cities', value: formatCount(realCountsProp?.cities || 50) + '+', icon: <MapPin className="h-4 w-4" /> },
            { label: 'Treatments', value: formatCount(realCountsProp?.treatments || 30) + '+', icon: <BadgeCheck className="h-4 w-4" /> },
          ]}
        />

        {/* How It Works */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-[#2D9C84] opacity-[0.03] rounded-full blur-[100px]" />
          </div>
          <div className="relative container px-4 md:px-6">
            <div className="max-w-2xl mx-auto text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#2D9C84] bg-[rgba(45,156,132,0.1)] border border-[rgba(45,156,132,0.2)] rounded-full">
                How It Works
              </span>
              <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
                Three steps to better dental care
              </h2>
              <p className="mt-3 text-[#62626B] text-sm md:text-base max-w-lg mx-auto">
                From discovery to appointment in minutes, not days.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3 max-w-5xl mx-auto">
              {howItWorks.map((step, index) => (
                <div
                  key={step.title}
                  className="group relative bg-[rgba(22,22,22,0.85)] backdrop-blur-xl border border-[rgba(45,156,132,0.15)] rounded-2xl p-7 transition-all duration-300 hover:border-[rgba(45,156,132,0.4)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4 mb-5">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[rgba(45,156,132,0.2)] to-[rgba(45,156,132,0.05)] border border-[rgba(45,156,132,0.2)]">
                      <step.icon className="h-5 w-5 text-[#2D9C84]" />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#2D9C84]/60">
                      Step 0{index + 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white font-display">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#62626B]">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Browse Emirates */}
        <section className="relative py-20 md:py-28 border-t border-[rgba(45,156,132,0.08)] overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -bottom-48 right-1/4 w-[500px] h-[500px] bg-[#FACC15] opacity-[0.02] rounded-full blur-[120px]" />
          </div>
          <div className="relative container px-4 md:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#2D9C84] bg-[rgba(45,156,132,0.1)] border border-[rgba(45,156,132,0.2)] rounded-full">
                  Browse Locations
                </span>
                <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
                  Explore the UAE by emirate
                </h2>
              </div>
              <Link href="/search/" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[#2D9C84] hover:text-[#3AB89E] transition-colors">
                View all locations
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {visibleStates.map((state) => (
                <Link
                  key={state.slug}
                  href={`/${state.slug}/`}
                  className="group flex items-center gap-4 bg-[rgba(22,22,22,0.85)] backdrop-blur-xl border border-[rgba(45,156,132,0.12)] rounded-xl px-5 py-4 transition-all duration-300 hover:border-[rgba(45,156,132,0.35)] hover:bg-[rgba(22,22,22,0.95)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[rgba(45,156,132,0.15)] to-[rgba(45,156,132,0.05)] border border-[rgba(45,156,132,0.15)] text-xs font-bold text-[#2D9C84]">
                    {state.abbreviation}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{state.name}</h3>
                    <p className="text-xs text-[#62626B] mt-0.5">Dental clinics & specialists</p>
                  </div>
                  <div className="shrink-0 text-[#62626B] transition-colors group-hover:text-[#2D9C84]">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Treatments */}
        {featuredTreatmentsProp.length > 0 && (
          <section className="relative py-20 md:py-28 border-t border-[rgba(45,156,132,0.08)] overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-[#2D9C84] opacity-[0.03] rounded-full blur-[100px]" />
            </div>
            <div className="relative container px-4 md:px-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#2D9C84] bg-[rgba(45,156,132,0.1)] border border-[rgba(45,156,132,0.2)] rounded-full">
                    Popular Services
                  </span>
                  <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
                    Start from a treatment
                  </h2>
                </div>
                <Link href="/services/" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[#2D9C84] hover:text-[#3AB89E] transition-colors">
                  View all services
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {featuredTreatmentsProp.map((treatment) => (
                  <Link
                    key={treatment.id}
                    href={`/services/${treatment.slug}/`}
                    className="group flex items-center justify-between bg-[rgba(22,22,22,0.85)] backdrop-blur-xl border border-[rgba(45,156,132,0.12)] rounded-xl px-5 py-4 transition-all duration-300 hover:border-[rgba(45,156,132,0.35)] hover:bg-[rgba(22,22,22,0.95)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(45,156,132,0.1)] border border-[rgba(45,156,132,0.15)]">
                        <Stethoscope className="h-4 w-4 text-[#2D9C84]" />
                      </div>
                      <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">{treatment.name}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#62626B] transition-colors group-hover:text-[#2D9C84]" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Featured Profiles */}
        {featuredProfiles.length > 0 && (
          <section className="relative py-20 md:py-28 border-t border-[rgba(45,156,132,0.08)] overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -left-48 top-1/2 w-[500px] h-[500px] bg-[#2D9C84] opacity-[0.03] rounded-full blur-[120px]" />
            </div>
            <div className="relative container px-4 md:px-6">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#2D9C84] bg-[rgba(45,156,132,0.1)] border border-[rgba(45,156,132,0.2)] rounded-full">
                  Featured Profiles
                </span>
                <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
                  Top-rated dental professionals
                </h2>
              </div>

              <div className="mt-10">
                <AutoScrollCarousel doctors={featuredProfiles} autoScrollSpeed={24} />
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="relative py-20 md:py-28 border-t border-[rgba(45,156,132,0.08)] overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-[#FACC15] opacity-[0.02] rounded-full blur-[100px]" />
          </div>
          <div className="relative container px-4 md:px-6">
            <div className="max-w-2xl mx-auto text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#2D9C84] bg-[rgba(45,156,132,0.1)] border border-[rgba(45,156,132,0.2)] rounded-full">
                FAQ
              </span>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
                Questions? We've got answers
              </h2>
            </div>

            <div className="mt-10 max-w-3xl mx-auto space-y-3">
              {faqs.map((faq) => (
                <div
                  key={faq.question}
                  className="bg-[rgba(22,22,22,0.85)] backdrop-blur-xl border border-[rgba(45,156,132,0.12)] rounded-xl transition-all duration-300 hover:border-[rgba(45,156,132,0.25)]"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === faq.question ? null : faq.question)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <h3 className="text-sm font-bold text-white">{faq.question}</h3>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-[#62626B] transition-transform duration-300 ${
                        openFaq === faq.question ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openFaq === faq.question ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="px-6 pb-5 text-sm leading-relaxed text-[#62626B]">{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-20 md:py-28 border-t border-[rgba(45,156,132,0.08)] overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-48 -right-48 w-[600px] h-[600px] bg-[#2D9C84] opacity-[0.06] rounded-full blur-[140px]" />
            <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] bg-[#FACC15] opacity-[0.03] rounded-full blur-[120px]" />
          </div>
          <div className="relative container px-4 md:px-6">
            <div className="max-w-3xl mx-auto bg-[rgba(22,22,22,0.92)] backdrop-blur-2xl border border-[rgba(45,156,132,0.2)] rounded-3xl p-8 md:p-12 lg:p-14 text-center shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#2D9C84] bg-[rgba(45,156,132,0.1)] border border-[rgba(45,156,132,0.2)] rounded-full">
                Ready to find your dentist?
              </span>
              <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
                Start your search today
              </h2>
              <p className="mt-3 max-w-xl mx-auto text-sm leading-relaxed text-[#62626B]">
                Browse verified dental professionals, compare trust signals, and book with confidence — all in one place.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 justify-center">
                <Button size="lg" variant="default" asChild>
                  <Link href="/search/">
                    Search the Directory
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/list-your-practice/">For Dentists</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
