// Desktop-optimized meta tags - longer, more detailed for desktop SERP display
// Desktop shows ~155-160 chars vs mobile ~120 chars, so we can use longer descriptions

export function getDesktopTitle(title: string, pageType: string): string {
  const year = "2026";
  
  const desktopTitles: Record<string, string> = {
    state: `Best Dentists in {{state}}, UAE (${year}) — Book Online Today | AppointPanda`,
    city: `Best Dentists in {{city}}, {{state}} (${year}) — Compare 200+ Clinics | AppointPanda`,
    service: `{{service}} in UAE (${year}) — Find Top-Rated Dentists & Specialists | AppointPanda`,
    "service-location": `{{service}} in {{city}}, {{state}} (${year}) — Find Verified Dentists Near You | AppointPanda`,
    clinic: `{{clinic}} - Top-Rated Dental Clinic in {{city}}, {{state}} (${year}) | AppointPanda`,
    dentist: `{{dentist}} - Dentist in {{city}} (${year}) — Book Appointment | AppointPanda`,
  };
  
  return desktopTitles[pageType] || title;
}

export function getDesktopDescription(description: string, pageType: string): string {
  const desktopDescriptions: Record<string, string> = {
    state: `Compare 6,600+ verified DHA-licensed dentists across {{state}}, UAE. Read 50,000+ real patient reviews, see transparent AED pricing for all treatments including implants, veneers, invisalign. Book appointments instantly with top-rated dental professionals. Your perfect smile starts here.`,
    
    city: `Find the best dentists in {{city}}, {{state}}. Compare 200+ verified dental clinics with 4.9+ star ratings. Read real patient reviews, check AED prices for implants, braces, whitening, and more. Book your appointment online in minutes. Free consultation available.`,
    
    service: `Get {{service}} treatment in UAE. Compare 200+ verified specialists across Dubai, Abu Dhabi, Sharjah. Read patient reviews, see transparent AED pricing, check dentist credentials (BDS, MDS, DHA-licensed). Book your appointment instantly. Most clinics offer free consultation.`,
    
    "service-location": `Need {{service}} in {{city}}? Compare 50+ verified specialists near you. Read patient reviews, check ratings (4.9+ stars), see transparent AED pricing. Book your appointment in minutes. All dentists are DHA/DOH-licensed. Free consultation available.`,
    
    clinic: `Book an appointment at {{clinic}} — one of the top-rated dental clinics in {{city}}, {{state}}. Our 500+ verified patient reviews show 4.9+ star satisfaction. We offer transparent AED pricing, modern equipment, and DHA-licensed dentists. Book your visit online in 30 seconds.`,
    
    dentist: `Book an appointment with {{dentist}} — a highly rated dentist in {{city}}, {{state}}. With 100+ verified patient reviews and 4.9+ stars, specializing in modern dental techniques. DHA-licensed. Book your appointment instantly.`,
  };
  
  return desktopDescriptions[pageType] || description;
}

// Format placeholders with actual values
export function formatDesktopMeta(template: string, values: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}