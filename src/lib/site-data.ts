export interface EmiratesData {
  slug: string;
  name: string;
  clinics: number;
  tagline: string;
  areas: string[];
}

export interface SpecialtyData {
  slug: string;
  name: string;
  icon: string;
  count: number;
  description: string;
}

export interface InsurerData {
  name: string;
  slug: string;
  clinics: number;
  notes: string;
}

export interface ClinicData {
  slug: string;
  name: string;
  location: string;
  area: string;
  emirate: string;
  rating: number;
  reviews: number;
  tags: string[];
  price: string;
  priceRange: string;
  image: number;
  insurance: string[];
  hours: string;
  open: string;
  phone: string;
  about: string;
  doctors: { name: string; specialty: string; }[];
  treatments: { name: string; price: string; }[];
}

export interface NavLinkData {
  label: string;
  href?: string;
  dropdown?: boolean;
  children?: { label: string; href: string; }[];
}

export const SITE_NAME = 'AppointPanda';
export const SITE_DOMAIN = 'appointpanda.ae';
export const SITE_TAGLINE = "The UAE's leading directory for premium dental care.";

export const PHONE_NUMBER = '800-APANDA (272632)';
export const PHONE_HREF = '+971800272632';

export const emirates: EmiratesData[] = [
  { slug: 'dubai', name: 'Dubai', clinics: 612, tagline: 'World-class dentistry in the city of gold', areas: ['Dubai Marina', 'Downtown Dubai', 'JBR', 'JLT', 'Business Bay', 'Al Barsha', 'Deira', 'Jumeirah', 'Palm Jumeirah', 'Mirdif', 'Dubai Hills', 'Arabian Ranches'] },
  { slug: 'abu-dhabi', name: 'Abu Dhabi', clinics: 341, tagline: 'Premium dental care, capital excellence', areas: ['Al Reem Island', 'Yas Island', 'Saadiyat Island', 'Khalifa City', 'Al Raha Beach', 'Corniche', 'Al Bateen', 'Mohamed Bin Zayed City'] },
  { slug: 'sharjah', name: 'Sharjah', clinics: 128, tagline: 'Quality dentistry close to home', areas: ['Al Majaz', 'Al Nahda', 'Al Qasimia', 'University City', 'Al Khan', 'Al Taawun'] },
  { slug: 'ajman', name: 'Ajman', clinics: 44, tagline: 'Growing smiles across the coast', areas: ['Ajman Downtown', 'Al Jurf', 'Al Rashidiya', 'Al Mowaihat', 'Al Zorah'] },
  { slug: 'ras-al-khaimah', name: 'Ras Al Khaimah', clinics: 62, tagline: 'Northern Emirates trusted care', areas: ['RAK City', 'Al Hamra', 'Al Marjan Island', 'Al Nakheel', 'Khatt'] },
  { slug: 'fujairah', name: 'Fujairah', clinics: 51, tagline: 'East coast dental excellence', areas: ['Fujairah City', 'Dibba', 'Al Aqah', 'Al Bidiya', 'Murbah'] },
  { slug: 'umm-al-quwain', name: 'Umm Al Quwain', clinics: 22, tagline: 'Personalised care, warm welcomes', areas: ['UAQ Downtown', 'Al Salam', 'Al Raas', 'Al Bateen'] },
];

export const specialties: SpecialtyData[] = [
  { slug: 'general-dentistry', name: 'General Dentistry', icon: 'Stethoscope', count: 486, description: 'Routine check-ups, fillings, cleanings, and preventive care for patients of all ages.' },
  { slug: 'cosmetic-dentistry', name: 'Cosmetic Dentistry', icon: 'Sparkles', count: 203, description: 'Transform your smile with veneers, bonding, and advanced aesthetic procedures.' },
  { slug: 'dental-implants', name: 'Dental Implants', icon: 'Syringe', count: 167, description: 'Permanent tooth replacement solutions using premium implant systems.' },
  { slug: 'orthodontics', name: 'Orthodontics', icon: 'ArrowLeftRight', count: 154, description: 'Braces and clear aligners including Invisalign for perfectly aligned teeth.' },
  { slug: 'pediatric-dentistry', name: 'Pediatric Dentistry', icon: 'Baby', count: 98, description: 'Child-friendly dental care in a warm, reassuring environment.' },
  { slug: 'endodontics', name: 'Endodontics', icon: 'Search', count: 76, description: 'Root canal therapy and treatment for dental pulp conditions.' },
  { slug: 'periodontics', name: 'Periodontics', icon: 'Activity', count: 71, description: 'Gum disease treatment, scaling, and periodontal maintenance.' },
  { slug: 'oral-surgery', name: 'Oral Surgery', icon: 'Scissors', count: 88, description: 'Wisdom tooth extraction, jaw surgery, and oral pathology.' },
  { slug: 'prosthodontics', name: 'Prosthodontics', icon: 'Palette', count: 63, description: 'Crowns, bridges, dentures, and full-mouth rehabilitation.' },
  { slug: 'teeth-whitening', name: 'Teeth Whitening', icon: 'Sun', count: 112, description: 'Professional whitening treatments for a brighter, confident smile.' },
  { slug: 'veneers', name: 'Veneers', icon: 'Gem', count: 145, description: 'Ultra-thin porcelain shells crafted to perfect your smile.' },
  { slug: 'emergency-dentistry', name: 'Emergency Dentistry', icon: 'Ambulance', count: 89, description: 'Immediate care for dental emergencies, available 24/7.' },
];

export const insurers: InsurerData[] = [
  { name: 'Daman', slug: 'daman', clinics: 512, notes: 'National Health Insurance Company — extensive PPO network.' },
  { name: 'AXA Gulf', slug: 'axa-gulf', clinics: 398, notes: 'Global coverage with strong UAE partnership network.' },
  { name: 'Bupa Global', slug: 'bupa-global', clinics: 287, notes: 'International health insurance with dental add-ons.' },
  { name: 'Cigna', slug: 'cigna', clinics: 334, notes: 'Worldwide dental coverage with direct billing.' },
  { name: 'Allianz Care', slug: 'allianz-care', clinics: 256, notes: 'Comprehensive dental plans for individuals and groups.' },
  { name: 'MetLife', slug: 'metlife', clinics: 198, notes: 'Dental insurance with large provider network.' },
  { name: 'Neuron', slug: 'neuron', clinics: 178, notes: 'UAE-focused insurer with competitive dental packages.' },
  { name: 'NAS', slug: 'nas', clinics: 212, notes: 'National Health Insurance — Abu Dhabi based.' },
  { name: 'Oman Insurance', slug: 'oman-insurance', clinics: 167, notes: 'Regional provider with dental coverage options.' },
  { name: 'Aetna', slug: 'aetna', clinics: 223, notes: 'Global health insurance with dental network access.' },
];

export const clinics: ClinicData[] = [
  {
    slug: 'pearl-dental-studio', name: 'Pearl Dental Studio', location: 'Dubai Marina', area: 'Dubai Marina', emirate: 'dubai',
    rating: 4.8, reviews: 892, tags: ['Cosmetic', 'Implants', 'Whitening'], price: '249', priceRange: 'AED 199 – 499',
    image: 1, insurance: ['Daman', 'AXA Gulf', 'Bupa Global', 'Cigna'], hours: 'Open · closes 22:00', open: 'Open now',
    phone: '+971 4 555 1234', about: 'Pearl Dental Studio combines cutting-edge technology with an artistic touch. Our Marina practice features a dedicated cosmetic suite, CBCT imaging, and a calming lounge designed to ease dental anxiety.',
    doctors: [{ name: 'Dr. Amira Al Hashimi', specialty: 'Cosmetic Dentistry' }, { name: 'Dr. Karim Nassar', specialty: 'Implantology' }],
    treatments: [{ name: 'Professional Whitening', price: 'AED 899' }, { name: 'Porcelain Veneer', price: 'AED 1,499' }, { name: 'Dental Implant', price: 'AED 4,500' }],
  },
  {
    slug: 'skyline-orthodontics', name: 'Skyline Orthodontics', location: 'Downtown Dubai', area: 'Downtown Dubai', emirate: 'dubai',
    rating: 4.7, reviews: 654, tags: ['Orthodontics', 'Invisalign', 'Pediatric'], price: '299', priceRange: 'AED 299 – 899',
    image: 2, insurance: ['Daman', 'Cigna', 'Allianz Care', 'MetLife'], hours: 'Open · closes 21:00', open: 'Open now',
    phone: '+971 4 555 2345', about: 'Dubai\'s premier orthodontic practice specialising in Invisalign and early intervention. Our downtown clinic offers digital smile design, 3D scanning, and a dedicated children\'s play area.',
    doctors: [{ name: 'Dr. Layla Mansour', specialty: 'Orthodontics' }, { name: 'Dr. Samir Khoury', specialty: 'Pediatric Dentistry' }],
    treatments: [{ name: 'Invisalign (Full)', price: 'AED 12,000' }, { name: 'Metal Braces', price: 'AED 6,500' }, { name: 'Retainer Set', price: 'AED 850' }],
  },
  {
    slug: 'elite-oral-care', name: 'Elite Oral Care', location: 'Abu Dhabi Corniche', area: 'Corniche', emirate: 'abu-dhabi',
    rating: 4.9, reviews: 1123, tags: ['General', 'Root Canal', 'Prosthodontics'], price: '199', priceRange: 'AED 199 – 599',
    image: 3, insurance: ['Daman', 'NAS', 'Neuron', 'AXA Gulf'], hours: 'Open · closes 20:00', open: 'Open now',
    phone: '+971 2 555 3456', about: 'Abu Dhabi\'s most trusted general practice with a focus on restorative excellence. Our Corniche clinic offers panoramic X-ray, digital impressions, and sedation dentistry options.',
    doctors: [{ name: 'Dr. Omar Rashed', specialty: 'General Dentistry' }, { name: 'Dr. Sara Al Nuaimi', specialty: 'Endodontics' }],
    treatments: [{ name: 'Composite Filling', price: 'AED 350' }, { name: 'Root Canal', price: 'AED 1,200' }, { name: 'Crown (Zirconia)', price: 'AED 1,800' }],
  },
  {
    slug: 'emirates-smile-clinic', name: 'Emirates Smile Clinic', location: 'JBR, Dubai', area: 'JBR', emirate: 'dubai',
    rating: 4.6, reviews: 445, tags: ['Veneers', 'Cosmetic', 'Whitening'], price: '399', priceRange: 'AED 399 – 899',
    image: 4, insurance: ['Bupa Global', 'Cigna', 'Allianz Care', 'Aetna'], hours: 'Open · closes 23:00', open: 'Open now',
    phone: '+971 4 555 4567', about: 'The JBR destination for transformative smile makeovers. Our beachfront clinic offers Hollywood-style veneers, power whitening, and digital smile design consultations.',
    doctors: [{ name: 'Dr. Jasmine Farah', specialty: 'Cosmetic Dentistry' }, { name: 'Dr. Tariq Haddad', specialty: 'Prosthodontics' }],
    treatments: [{ name: 'Composite Veneer', price: 'AED 650' }, { name: 'Porcelain Veneer', price: 'AED 1,499' }, { name: 'Zoom Whitening', price: 'AED 950' }],
  },
  {
    slug: 'al-noor-dental', name: 'Al Noor Dental', location: 'Al Majaz, Sharjah', area: 'Al Majaz', emirate: 'sharjah',
    rating: 4.7, reviews: 678, tags: ['General', 'Pediatric', 'Orthodontics'], price: '149', priceRange: 'AED 149 – 399',
    image: 5, insurance: ['Daman', 'AXA Gulf', 'NAS'], hours: 'Open · closes 21:00', open: 'Open now',
    phone: '+971 6 555 5678', about: 'Sharjah\'s family-favourite dental practice offering comprehensive care under one roof. Our Majaz clinic features separate paediatric wing, panoramic imaging, and flexible payment plans.',
    doctors: [{ name: 'Dr. Fatima Al Qasimi', specialty: 'Pediatric Dentistry' }, { name: 'Dr. Hassan Nour', specialty: 'General Dentistry' }],
    treatments: [{ name: 'Check-up & Cleaning', price: 'AED 149' }, { name: 'Fissure Sealant', price: 'AED 95' }, { name: 'Extraction', price: 'AED 250' }],
  },
  {
    slug: 'bayside-dental', name: 'Bayside Dental', location: 'Yas Island, Abu Dhabi', area: 'Yas Island', emirate: 'abu-dhabi',
    rating: 4.8, reviews: 523, tags: ['Cosmetic', 'Implants', 'Whitening'], price: '349', priceRange: 'AED 349 – 999',
    image: 6, insurance: ['Daman', 'Aetna', 'Cigna', 'Neuron'], hours: 'Open · closes 22:00', open: 'Open now',
    phone: '+971 2 555 6789', about: 'Waterfront dentistry on Yas Island with state-of-the-art implant centre. Our clinic offers CT-guided implant surgery, in-house lab, and a dedicated recovery lounge.',
    doctors: [{ name: 'Dr. Ahmad Saleh', specialty: 'Implantology' }, { name: 'Dr. Lena Weber', specialty: 'Periodontics' }],
    treatments: [{ name: 'Dental Implant', price: 'AED 4,200' }, { name: 'Bone Graft', price: 'AED 1,500' }, { name: 'All-on-4', price: 'AED 18,000' }],
  },
  {
    slug: 'palm-dental-lounge', name: 'Palm Dental Lounge', location: 'Palm Jumeirah', area: 'Palm Jumeirah', emirate: 'dubai',
    rating: 4.9, reviews: 334, tags: ['Cosmetic', 'Veneers', 'Luxury'], price: '499', priceRange: 'AED 499 – 1,499',
    image: 1, insurance: ['Bupa Global', 'Allianz Care', 'Aetna'], hours: 'Open · closes 20:00', open: 'Open now',
    phone: '+971 4 555 7890', about: 'Bespoke luxury dentistry on the Palm. Our boutique clinic offers private suites, sedation options, and premium materials — designed for the discerning patient.',
    doctors: [{ name: 'Dr. Nadia Cherif', specialty: 'Prosthodontics' }, { name: 'Dr. Philippe Durand', specialty: 'Cosmetic Dentistry' }],
    treatments: [{ name: 'Smile Makeover', price: 'AED 8,500' }, { name: 'Lumineers', price: 'AED 2,500' }, { name: 'Teeth Whitening', price: 'AED 1,200' }],
  },
  {
    slug: 'oasis-family-dental', name: 'Oasis Family Dental', location: 'Al Ain', area: 'Al Ain', emirate: 'abu-dhabi',
    rating: 4.7, reviews: 412, tags: ['Family', 'Pediatric', 'General'], price: '129', priceRange: 'AED 129 – 299',
    image: 2, insurance: ['Daman', 'NAS', 'Oman Insurance'], hours: 'Open · closes 20:00', open: 'Open now',
    phone: '+971 3 555 8901', about: 'Al Ain\'s most beloved family practice with four generations of patients. We offer gentle care for every age, from toddlers to grandparents, at accessible rates.',
    doctors: [{ name: 'Dr. Mohammed Al Ameri', specialty: 'General Dentistry' }, { name: 'Dr. Aisha Al Darmaki', specialty: 'Pediatric Dentistry' }],
    treatments: [{ name: 'Kids Check-up', price: 'AED 99' }, { name: 'Adult Cleaning', price: 'AED 149' }, { name: 'Filling (White)', price: 'AED 250' }],
  },
  {
    slug: 'meydan-dental-loft', name: 'Meydan Dental Loft', location: 'Meydan, Dubai', area: 'Meydan', emirate: 'dubai',
    rating: 4.8, reviews: 267, tags: ['Orthodontics', 'Invisalign', 'Sports'], price: '299', priceRange: 'AED 299 – 799',
    image: 3, insurance: ['AXA Gulf', 'Cigna', 'MetLife', 'Neuron'], hours: 'Open · closes 21:00', open: 'Open now',
    phone: '+971 4 555 9012', about: 'A modern orthodontic loft in Meydan with extended hours for professionals. Specialising in accelerated orthodontics and sports mouthguards for Dubai\'s active community.',
    doctors: [{ name: 'Dr. Rami El-Sayed', specialty: 'Orthodontics' }, { name: 'Dr. Chris Baker', specialty: 'Sports Dentistry' }],
    treatments: [{ name: 'Accelerated Braces', price: 'AED 8,000' }, { name: 'Sports Mouthguard', price: 'AED 350' }, { name: 'Invisalign Lite', price: 'AED 8,500' }],
  },
  {
    slug: 'corniche-kids-dentistry', name: 'Corniche Kids Dentistry', location: 'Abu Dhabi Corniche', area: 'Corniche', emirate: 'abu-dhabi',
    rating: 4.9, reviews: 189, tags: ['Pediatric', 'Kids', 'Sedation'], price: '199', priceRange: 'AED 199 – 499',
    image: 4, insurance: ['Daman', 'AXA Gulf', 'NAS', 'Oman Insurance'], hours: 'Open · closes 19:00', open: 'Open now',
    phone: '+971 2 555 0123', about: 'Dedicated exclusively to children\'s dentistry, our Corniche clinic turns dental visits into adventures. Treasure chest rewards, ceiling TVs, and the gentlest hands in Abu Dhabi.',
    doctors: [{ name: 'Dr. Noura Al Mazrouei', specialty: 'Pediatric Dentistry' }, { name: 'Dr. Sarah Khalil', specialty: 'Child Psychology' }],
    treatments: [{ name: 'First Visit Exam', price: 'AED 99' }, { name: 'Fluoride Treatment', price: 'AED 75' }, { name: 'Pulpotomy', price: 'AED 350' }],
  },
  {
    slug: 'rak-dental-center', name: 'RAK Dental Center', location: 'RAK City', area: 'RAK City', emirate: 'ras-al-khaimah',
    rating: 4.6, reviews: 378, tags: ['General', 'Implants', 'Emergency'], price: '149', priceRange: 'AED 149 – 399',
    image: 5, insurance: ['Daman', 'AXA Gulf', 'Oman Insurance'], hours: 'Open · closes 22:00', open: 'Open now',
    phone: '+971 7 555 1234', about: 'Ras Al Khaimah\'s comprehensive dental centre with emergency services available daily until 10 PM. We serve the entire Northern Emirates with quality, accessible care.',
    doctors: [{ name: 'Dr. Abdullah Al Shehhi', specialty: 'General Dentistry' }, { name: 'Dr. Maya Bou Khalil', specialty: 'Endodontics' }],
    treatments: [{ name: 'Emergency Exam', price: 'AED 199' }, { name: 'Tooth Extraction', price: 'AED 200' }, { name: 'Temporary Filling', price: 'AED 100' }],
  },
  {
    slug: 'fujairah-family-dental', name: 'Fujairah Family Dental', location: 'Fujairah City', area: 'Fujairah City', emirate: 'fujairah',
    rating: 4.7, reviews: 223, tags: ['Family', 'General', 'Orthodontics'], price: '139', priceRange: 'AED 139 – 349',
    image: 6, insurance: ['Daman', 'NAS', 'Oman Insurance'], hours: 'Open · closes 20:00', open: 'Open now',
    phone: '+971 9 555 2345', about: 'The east coast\'s complete family dental solution with panoramic imaging, in-house lab, and Saturday appointments. We bring quality dentistry closer to Fujairah families.',
    doctors: [{ name: 'Dr. Khaled Al Balushi', specialty: 'General Dentistry' }, { name: 'Dr. Lina Shams', specialty: 'Orthodontics' }],
    treatments: [{ name: 'Full Check-up', price: 'AED 139' }, { name: 'Cleaning & Polish', price: 'AED 149' }, { name: 'Braces (Metal)', price: 'AED 5,000' }],
  },
];

export const navLinks: NavLinkData[] = [
  { label: 'Find Clinics', href: '/find-clinics' },
  {
    label: 'Specialties', dropdown: true, children: specialties.slice(0, 8).map(s => ({
      label: s.name, href: `/specialties/${s.slug}`,
    })),
  },
  {
    label: 'Emirates', dropdown: true, children: emirates.map(e => ({
      label: e.name, href: `/${e.slug}/`,
    })),
  },
  { label: 'Insurance', href: '/insurance' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'For Clinics', href: '/for-clinics' },
  { label: 'Blog', href: '/blog' },
];

export const popularSearches = ['Implants', 'Invisalign', 'Veneers', 'Whitening', 'Kids Dentistry', 'Root Canal', 'Emergency'];

export const testimonials = [
  { quote: "I was nervous about my root canal, but Dr. Amira made it completely painless. The clinic is beautiful and the staff are wonderful.", name: 'Sarah M.', emirate: 'Dubai', treatment: 'Root Canal' },
  { quote: "Found the perfect orthodontist for my son through AppointPanda. The profiles are detailed and the reviews are genuine. Highly recommend.", name: 'Ahmed Al T.', emirate: 'Abu Dhabi', treatment: 'Invisalign' },
  { quote: "Saved over AED 1,200 on my veneers compared to my previous clinic. The price transparency is a game-changer.", name: 'Layla R.', emirate: 'Sharjah', treatment: 'Veneers' },
  { quote: "Needed an emergency dentist on a Friday night. AppointPanda connected me with a clinic open until 11 PM within minutes.", name: 'James K.', emirate: 'Dubai', treatment: 'Emergency' },
  { quote: "The insurance matching feature is incredible. My plan covered 80% of the cost — I had no idea until I used the site.", name: 'Mona S.', emirate: 'Abu Dhabi', treatment: 'Check-up' },
  { quote: "Found a brilliant paediatric dentist for my 4-year-old. The clinic profile had all the info we needed — even photos of the play area.", name: 'Omar H.', emirate: 'Dubai', treatment: 'Pediatric' },
];

export const blogPosts = [
  { slug: 'choosing-right-dentist-uae', title: 'How to choose the right dentist in the UAE', category: 'Guides', excerpt: 'From regulatory licensing to insurance panels — our complete guide to finding your perfect dentist in the Emirates.', readingTime: '5 min', image: 1 },
  { slug: 'cost-of-dental-implants-uae', title: 'The real cost of dental implants in the UAE (2026)', category: 'Cost & Finance', excerpt: 'We surveyed 87 clinics across all 7 emirates to bring you transparent implant pricing. The results may surprise you.', readingTime: '7 min', image: 2 },
  { slug: 'invisalign-vs-braces-pros-cons', title: 'Invisalign vs. braces: pros, cons, and costs in the UAE', category: 'Orthodontics', excerpt: 'Clear aligners or traditional braces? We break down the differences to help you make an informed decision.', readingTime: '6 min', image: 3 },
];

export const faqs = [
  { q: 'Are the clinics on AppointPanda verified?', a: 'Yes. Every clinic listed on AppointPanda has been verified against UAE regulatory licensing databases. We also verify insurance panel participation and patient reviews for authenticity.' },
  { q: 'How accurate are the prices shown?', a: 'Prices are provided directly by clinics and updated monthly. While most clinics honour these prices, we recommend confirming at the time of booking. Starred prices (★) are guaranteed for AppointPanda bookings.' },
  { q: 'Does my insurance cover treatment?', a: 'Each clinic profile lists accepted insurance plans. Many clinics offer direct billing. Use our insurance filter to find clinics that accept your provider.' },
  { q: 'Can I cancel or reschedule my appointment?', a: 'Cancellation policies vary by clinic. Most require 24 hours\' notice. You can cancel or reschedule directly through your AppointPanda dashboard.' },
  { q: 'What if I need emergency treatment?', a: 'Call our 24/7 hotline at 800-APANDA. We\'ll connect you with an open clinic near you. Many clinics in our network keep emergency slots available daily.' },
  { q: 'Is the site available in Arabic?', a: 'Yes. You can switch to Arabic using the toggle in the top bar. Our interface and clinic listings are fully bilingual.' },
];

export function getClinicBySlug(slug: string): ClinicData | undefined {
  return clinics.find(c => c.slug === slug);
}

export function getSpecialtyBySlug(slug: string): SpecialtyData | undefined {
  return specialties.find(s => s.slug === slug);
}

export function getEmirateBySlug(slug: string): EmiratesData | undefined {
  return emirates.find(e => e.slug === slug);
}

export function getClinicsByEmirate(slug: string): ClinicData[] {
  return clinics.filter(c => c.emirate === slug);
}

export function getClinicsBySpecialty(specialtySlug: string): ClinicData[] {
  const specialty = specialties.find(s => s.slug === specialtySlug);
  if (!specialty) return [];
  const name = specialty.name.toLowerCase().replace('dentistry', '').replace('orthodontics', 'orthodontic').trim();
  return clinics.filter(c => c.tags.some(t => t.toLowerCase().includes(name)));
}

export function getClinicsByInsurance(insurerSlug: string): ClinicData[] {
  const insurer = insurers.find(i => i.slug === insurerSlug);
  if (!insurer) return [];
  return clinics.filter(c => c.insurance.includes(insurer.name));
}
