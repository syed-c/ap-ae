/**
 * Generates contextual Q&A content for AI search optimization.
 * Pre-computed, no API calls — pure template-based generation
 * using UAE dental context for AI crawlers.
 */
import type { QAItem } from "@/components/ai-seo/ConversationalQABlock";

// Clinic-specific Q&A
export function generateClinicQA(clinic: {
  name: string;
  city?: string;
  area?: string;
  rating?: number;
  reviewCount?: number;
  treatments?: string[];
}): QAItem[] {
  const location = [clinic.area, clinic.city].filter(Boolean).join(", ");
  const items: QAItem[] = [];

  items.push({
    question: `Is ${clinic.name} a good dental clinic?`,
    answer: clinic.rating
      ? `${clinic.name}${location ? ` in ${location}` : ""} has a rating of ${clinic.rating}/5 based on ${clinic.reviewCount || 0} patient reviews. Patients can book appointments online through AppointPanda to experience their services firsthand.`
      : `${clinic.name}${location ? ` is located in ${location}` : ""} and accepts online bookings through AppointPanda. Check recent patient reviews on the clinic's profile for the latest feedback.`,
    followUp: "You can compare this clinic with others in the area using our search filters.",
  });

  if (location) {
    items.push({
      question: `Where is ${clinic.name} located?`,
      answer: `${clinic.name} is located in ${location}, UAE. The clinic is accessible for patients in surrounding areas and accepts walk-in and online appointments.`,
    });
  }

  items.push({
    question: `How do I book an appointment at ${clinic.name}?`,
    answer: `You can book an appointment at ${clinic.name} online through AppointPanda. Select your preferred date and time, choose your treatment, and receive instant confirmation. No phone calls needed.`,
    followUp: "Most clinics confirm appointments within 2 hours during business hours.",
  });

  if (clinic.treatments?.length) {
    const topTreatments = clinic.treatments.slice(0, 5).join(", ");
    items.push({
      question: `What dental services does ${clinic.name} offer?`,
      answer: `${clinic.name} offers a range of dental services including ${topTreatments}. All treatments are performed by DHA/MOHAP-licensed dental professionals in the UAE.`,
    });
  }

  items.push({
    question: `Does ${clinic.name} accept dental insurance?`,
    answer: `Many dental clinics in the UAE accept major insurance providers. Check ${clinic.name}'s profile on AppointPanda for their current list of accepted insurance plans, or contact the clinic directly for verification.`,
  });

  return items;
}

// City/location-specific Q&A
export function generateCityQA(city: {
  name: string;
  stateName?: string;
  clinicCount?: number;
}): QAItem[] {
  return [
    {
      question: `How many dental clinics are in ${city.name}?`,
      answer: city.clinicCount
        ? `There are ${city.clinicCount}+ dental clinics listed in ${city.name} on AppointPanda. Each clinic is verified and features patient reviews, pricing information, and online booking.`
        : `${city.name} has numerous dental clinics listed on AppointPanda with verified profiles, patient reviews, and online booking capabilities.`,
      followUp: "Filter by treatment type, insurance, or rating to find your ideal clinic.",
    },
    {
      question: `What is the best dental clinic in ${city.name}?`,
      answer: `The best dental clinic in ${city.name} depends on your specific needs. AppointPanda ranks clinics based on patient reviews, verification status, and service quality. Use our filters to find clinics specializing in your required treatment.`,
    },
    {
      question: `How much does a dentist visit cost in ${city.name}?`,
      answer: `Dental consultation fees in ${city.name} typically range from AED 100 to AED 350 depending on the clinic and type of consultation. Specialized treatments have different pricing — check individual clinic profiles on AppointPanda for transparent AED pricing.`,
      followUp: "Most clinics offer free initial consultations for cosmetic procedures.",
    },
    {
      question: `Are dentists in ${city.name} DHA licensed?`,
      answer: `All dental practitioners in the UAE must be licensed by the relevant health authority — DHA (Dubai Health Authority) for Dubai, DOH for Abu Dhabi, or MOHAP for other emirates. AppointPanda verifies clinic credentials as part of our listing process.`,
    },
    {
      question: `Can I book a same-day dental appointment in ${city.name}?`,
      answer: `Yes, many dental clinics in ${city.name} accept same-day appointments through AppointPanda. Use the "Available Today" filter to find clinics with immediate availability for consultations or emergency dental care.`,
    },
  ];
}

// Treatment-specific Q&A
export function generateTreatmentQA(treatment: {
  name: string;
  city?: string;
}): QAItem[] {
  const locationSuffix = treatment.city ? ` in ${treatment.city}` : " in the UAE";

  return [
    {
      question: `How much does ${treatment.name} cost${locationSuffix}?`,
      answer: `${treatment.name} costs${locationSuffix} vary by clinic and complexity. AppointPanda shows transparent AED pricing for each clinic so you can compare costs before booking. Most clinics offer payment plans for extensive treatments.`,
      followUp: "Compare prices across multiple clinics to find the best value.",
    },
    {
      question: `Is ${treatment.name} painful?`,
      answer: `Modern ${treatment.name.toLowerCase()} procedures use advanced anesthesia and pain management techniques. Most patients report minimal discomfort. Discuss pain management options with your dentist during the consultation — you can book one through AppointPanda.`,
    },
    {
      question: `How long does ${treatment.name} take?`,
      answer: `The duration of ${treatment.name.toLowerCase()} depends on the complexity and your individual case. Your dentist will provide a treatment timeline during the initial consultation. Book a consultation through AppointPanda to get a personalized assessment.`,
    },
    {
      question: `Where can I get ${treatment.name}${locationSuffix}?`,
      answer: `AppointPanda lists verified dental clinics offering ${treatment.name.toLowerCase()}${locationSuffix}. Each clinic profile includes patient reviews, pricing, and online booking. Filter by rating, location, or insurance to find the right provider.`,
    },
    {
      question: `Does insurance cover ${treatment.name}${locationSuffix}?`,
      answer: `Insurance coverage for ${treatment.name.toLowerCase()} varies by provider and plan. Most UAE dental insurance plans cover basic treatments, while cosmetic procedures may have limited coverage. Check with your insurance provider or ask the clinic directly through AppointPanda.`,
    },
  ];
}
