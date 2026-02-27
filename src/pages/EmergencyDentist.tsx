'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Zap, Phone, MapPin, Clock, AlertTriangle, 
  Navigation, Search, CheckCircle, Star, Shield,
  Heart, Thermometer, ArrowRight, Stethoscope,
  Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageLayout } from '@/components/layout/PageLayout';
import { Section } from '@/components/layout/Section';
import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { useSeoPageContent } from '@/hooks/useSeoPageContent';
import { format } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

export default function EmergencyDentistFinder() {
  const { data: seoContent } = useSeoPageContent("emergency-dentist");
  const [stateId, setStateId] = useState('');
  const [cityId, setCityId] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [currentTime] = useState(new Date());

  const currentDay = currentTime.getDay();
  const currentHour = currentTime.getHours();
  const isWeekend = currentDay === 0 || currentDay === 6;
  const isAfterHours = currentHour < 8 || currentHour >= 18;

  const { data: states } = useQuery({
    queryKey: ['emergency-states'],
    queryFn: async () => {
      const { data } = await supabase.from('states').select('id, name, abbreviation').eq('is_active', true).order('name');
      return data || [];
    },
  });

  const { data: cities } = useQuery({
    queryKey: ['emergency-cities', stateId],
    queryFn: async () => {
      let q = supabase.from('cities').select('id, name, slug').eq('is_active', true).order('name');
      if (stateId) q = q.eq('state_id', stateId);
      const { data } = await q.limit(200);
      return data || [];
    },
  });

  const { data: clinics, isLoading } = useQuery({
    queryKey: ['emergency-clinics', stateId, cityId],
    queryFn: async () => {
      let query = supabase
        .from('clinics')
        .select(`
          id, name, slug, address, phone, rating, review_count, city_id,
          cities(name, states(abbreviation)),
          clinic_hours(day_of_week, open_time, close_time, is_closed)
        `)
        .eq('is_active', true)
        .not('phone', 'is', null);

      if (cityId) {
        query = query.eq('city_id', cityId);
      } else if (stateId) {
        query = query.eq('cities.state_id', stateId);
      }

      const { data } = await query.limit(30);

      return (data || []).map((clinic: any) => {
        const todayHours = clinic.clinic_hours?.find((h: any) => h.day_of_week === currentDay);
        let isOpenNow = false;

        if (todayHours && !todayHours.is_closed && todayHours.open_time && todayHours.close_time) {
          const openHour = parseInt(todayHours.open_time.split(':')[0]);
          const closeHour = parseInt(todayHours.close_time.split(':')[0]);
          isOpenNow = currentHour >= openHour && currentHour < closeHour;
        }

        const hasEmergencyHours = clinic.clinic_hours?.some((h: any) => {
          if (h.is_closed) return false;
          const closeHour = parseInt((h.close_time || '17:00').split(':')[0]);
          return closeHour >= 20;
        });

        return {
          ...clinic,
          cityName: clinic.cities?.name || '',
          stateAbbr: clinic.cities?.states?.abbreviation || '',
          is_open_now: isOpenNow,
          emergency_hours: hasEmergencyHours ? 'Extended hours available' : undefined,
        };
      }).sort((a: any, b: any) => {
        if (a.is_open_now && !b.is_open_now) return -1;
        if (!a.is_open_now && b.is_open_now) return 1;
        return (b.rating || 0) - (a.rating || 0);
      });
    },
    enabled: searchTriggered,
  });

  const openClinics = clinics?.filter((c: any) => c.is_open_now) || [];
  const closedClinics = clinics?.filter((c: any) => !c.is_open_now) || [];

  const filteredCities = citySearch
    ? cities?.filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase()))
    : cities;

  const handleSearch = () => {
    setSearchTriggered(true);
  };

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Emergency Dentist" },
  ];

  return (
    <PageLayout>
      <SEOHead
        title={seoContent?.meta_title || "Emergency Dentist Near Me | 24/7 Dental Care | AppointPanda"}
        description={seoContent?.meta_description || "Find emergency dentists open now near you. Get immediate dental care for toothaches, broken teeth, and dental emergencies."}
        canonical="/emergency-dentist/"
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-destructive/5 via-background to-background pt-6 pb-12">
        <div className="container relative z-10 px-4">
          <div className="flex justify-center mb-4">
            <Breadcrumbs items={breadcrumbs} />
          </div>
          
          <div className="max-w-3xl mx-auto text-center">
            <motion.div {...fadeUp} className="inline-flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-full px-4 py-2 mb-4">
              <Zap className="h-4 w-4 text-destructive" />
              <span className="text-xs font-semibold text-destructive">Urgent Dental Care</span>
            </motion.div>
            
            <motion.h1 {...fadeUp} transition={{ delay: 0.1 }} className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
              Emergency <span className="text-destructive">Dentist</span> Finder
            </motion.h1>
            
            <motion.p {...fadeUp} transition={{ delay: 0.2 }} className="text-base md:text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Find dentists open now for urgent dental care across the UAE. Select your location to see available clinics immediately.
            </motion.p>

            <motion.div {...fadeUp} transition={{ delay: 0.25 }} className="flex items-center justify-center gap-4">
              <Badge variant="outline" className="text-sm rounded-full px-4 py-1.5">
                <Clock className="h-3 w-3 mr-1" />
                {format(currentTime, 'EEEE, h:mm a')}
              </Badge>
              {(isWeekend || isAfterHours) && (
                <Badge className="bg-gold/20 text-gold border-gold/30 rounded-full px-4 py-1.5">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {isWeekend ? 'Weekend Hours' : 'After Hours'}
                </Badge>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <Section size="sm">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fadeUp} className="bg-card border border-border rounded-2xl p-6 shadow-card">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Emirate</Label>
                <Select value={stateId} onValueChange={(v) => { setStateId(v); setCityId(''); setSearchTriggered(false); }}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select emirate" />
                  </SelectTrigger>
                  <SelectContent>
                    {states?.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">City</Label>
                <Select value={cityId} onValueChange={(v) => { setCityId(v); setSearchTriggered(false); }}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 pb-2">
                      <Input placeholder="Search cities..." value={citySearch} onChange={e => setCitySearch(e.target.value)} className="h-8" />
                    </div>
                    {filteredCities?.slice(0, 50).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold invisible">Search</Label>
                <Button className="w-full h-11 rounded-xl font-semibold" onClick={handleSearch} disabled={!stateId}>
                  <Search className="h-4 w-4 mr-2" />
                  Find Now
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Results */}
      {searchTriggered && (
        <Section size="md">
          <div className="max-w-4xl mx-auto space-y-8">
            {openClinics.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald" />
                  Open Now ({openClinics.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {openClinics.map((clinic: any) => (
                    <ClinicCard key={clinic.id} clinic={clinic} isOpen />
                  ))}
                </div>
              </div>
            )}

            {closedClinics.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  Available Tomorrow ({closedClinics.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {closedClinics.slice(0, 8).map((clinic: any) => (
                    <ClinicCard key={clinic.id} clinic={clinic} isOpen={false} />
                  ))}
                </div>
              </div>
            )}

            {!isLoading && clinics?.length === 0 && (
              <Card className="rounded-2xl">
                <CardContent className="py-12 text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-display text-lg font-bold mb-2">No clinics found</h3>
                  <p className="text-muted-foreground mb-4">Try a nearby city or broader emirate search.</p>
                  <Button variant="outline" className="rounded-xl" asChild>
                    <Link to="/search">Browse All Dentists</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </Section>
      )}

      {/* What Constitutes Emergency */}
      <Section size="lg" className="bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              What is a <span className="text-destructive">Dental Emergency?</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm">Know when to seek immediate care and what to do while waiting.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div {...fadeUp} className="bg-card border border-destructive/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <h3 className="font-display text-lg font-bold">Seek Immediate Care For</h3>
              </div>
              <ul className="space-y-3">
                {['Severe toothache or dental pain', 'Knocked-out tooth (keep it moist!)', 'Broken or cracked tooth', 'Dental abscess or swelling', 'Uncontrolled bleeding after extraction', 'Jaw injury or dislocation'].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold">First Aid While Waiting</h3>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {[
                  'Rinse with warm salt water to clean the area',
                  'Apply cold compress to reduce swelling',
                  'Take over-the-counter pain relievers (ibuprofen)',
                  'Keep knocked-out tooth in milk or saline',
                  "Don't apply aspirin directly to gums",
                  'Avoid hot or cold food and drinks'
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Stethoscope className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* Emergency Cost Guide */}
      <Section size="lg">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              Emergency Dental <span className="text-primary">Cost Guide</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm">Estimated costs for common emergency dental procedures in the UAE.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { procedure: "Emergency Exam + X-Ray", cost: "200 – 500 AED", icon: Search },
              { procedure: "Tooth Extraction", cost: "300 – 1,500 AED", icon: Stethoscope },
              { procedure: "Root Canal (Emergency)", cost: "1,500 – 4,000 AED", icon: Thermometer },
              { procedure: "Dental Crown (Temporary)", cost: "500 – 1,200 AED", icon: Shield },
              { procedure: "Abscess Drainage", cost: "400 – 1,000 AED", icon: Heart },
              { procedure: "Broken Tooth Repair", cost: "500 – 2,500 AED", icon: Building2 },
            ].map((item, i) => (
              <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.05 }} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-display text-sm font-bold">{item.procedure}</h3>
                </div>
                <p className="text-lg font-bold text-primary">{item.cost}</p>
              </motion.div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">* Prices are estimated ranges. Final costs depend on clinic and treatment complexity.</p>
        </div>
      </Section>

      {/* Tips for Prevention */}
      <Section size="lg" className="bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              How to <span className="text-primary">Prevent</span> Dental Emergencies
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Regular Checkups", desc: "Visit your dentist every 6 months for cleanings and early detection of problems before they become emergencies.", icon: Clock },
              { title: "Wear Protection", desc: "Use a mouthguard during sports activities. Custom-fitted guards from your dentist offer the best protection.", icon: Shield },
              { title: "Good Oral Hygiene", desc: "Brush twice daily, floss regularly, and use fluoride mouthwash to prevent cavities and gum disease.", icon: Heart },
            ].map((item, i) => (
              <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.1 }} className="bg-card border border-border rounded-2xl p-6 text-center">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-base font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* FAQ Section */}
      <Section size="lg">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-8">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Emergency Dental <span className="text-primary">FAQs</span>
            </h2>
          </motion.div>
          
          <Accordion type="single" collapsible className="space-y-3">
            {[
              { q: "How much does an emergency dental visit cost in UAE?", a: "Emergency visits typically cost 200–500 AED for exam and X-rays. Procedures like root canals or extractions cost more. Many insurance plans cover emergency dental care." },
              { q: "Should I go to the ER or an emergency dentist?", a: "ERs can help with pain and prescribe antibiotics but usually can't perform dental procedures. An emergency dentist is the better and more cost-effective choice for dental issues." },
              { q: "What should I do with a knocked-out tooth?", a: "Handle the tooth by the crown (not the root). Rinse gently without scrubbing. Try to place it back in the socket. If you can't, keep it in milk or saline. See a dentist within 30 minutes for the best chance of saving it." },
              { q: "Are emergency dentists more expensive?", a: "Emergency appointments may carry a small surcharge (50-150 AED). However, delaying treatment often leads to more complex and costly procedures." },
              { q: "Can I get emergency dental care on weekends in UAE?", a: "Yes, many dental clinics in Dubai, Sharjah, and Abu Dhabi offer weekend and extended hours. Use our finder above to locate clinics open now." },
              { q: "Does dental insurance cover emergencies?", a: "Most dental insurance plans in UAE cover emergency treatments. Check with your provider for coverage details. We list clinics that accept major insurance providers." },
            ].map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-card border border-border rounded-2xl px-5 data-[state=open]:border-primary/30"
              >
                <AccordionTrigger className="text-left font-bold hover:no-underline py-4 text-sm md:text-base">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 text-sm leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* CTA Section */}
      <Section size="md" className="bg-primary/5 border-t border-primary/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
            Need a Regular <span className="text-primary">Dental Checkup?</span>
          </h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto text-sm">
            Prevent emergencies with regular dental visits. Find a dentist near you for routine care.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" className="rounded-xl font-semibold" asChild>
              <Link to="/search">Find a Dentist <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-xl font-semibold" asChild>
              <Link to="/services">Browse Services</Link>
            </Button>
          </div>
        </div>
      </Section>
    </PageLayout>
  );
}

function ClinicCard({ clinic, isOpen }: { clinic: any; isOpen: boolean }) {
  return (
    <Card className={`rounded-2xl transition-all hover:shadow-md ${isOpen ? 'border-emerald/30' : ''}`}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-display font-bold">{clinic.name}</h3>
            <p className="text-sm text-muted-foreground">{clinic.address}</p>
            <p className="text-sm text-muted-foreground">{clinic.cityName}, {clinic.stateAbbr}</p>
          </div>
          {isOpen ? (
            <Badge className="bg-emerald/20 text-emerald border-emerald/30 rounded-full">Open Now</Badge>
          ) : (
            <Badge variant="outline" className="rounded-full">Closed</Badge>
          )}
        </div>

        {clinic.rating && (
          <div className="flex items-center gap-1 mb-3">
            <Star className="h-4 w-4 fill-gold text-gold" />
            <span className="font-medium">{clinic.rating.toFixed(1)}</span>
            {clinic.review_count && (
              <span className="text-sm text-muted-foreground">({clinic.review_count} reviews)</span>
            )}
          </div>
        )}

        {clinic.emergency_hours && (
          <Badge variant="outline" className="mb-3 text-xs rounded-full">{clinic.emergency_hours}</Badge>
        )}

        <div className="flex gap-2 mt-4">
          {clinic.phone && (
            <Button size="sm" variant="outline" className="rounded-xl" asChild>
              <a href={`tel:${clinic.phone}`}>
                <Phone className="h-4 w-4 mr-1" /> Call
              </a>
            </Button>
          )}
          <Button size="sm" className="rounded-xl" asChild>
            <Link to={`/clinic/${clinic.slug || clinic.id}`}>
              <Navigation className="h-4 w-4 mr-1" /> View Profile
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
