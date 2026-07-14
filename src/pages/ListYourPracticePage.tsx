'use client';
import React, { useState } from "react";
import { SEOHead } from "@/components/seo/SEOHead";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { buildGmbAuthCallbackUrl, setGmbFlowFlag } from '@/lib/gmbAuth';
import { PageLayout } from "@/components/layout/PageLayout";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useStates } from "@/hooks/useLocations";
import { useTreatments } from "@/hooks/useTreatments";
import { SmartCitySearch } from "@/components/geo/SmartCitySearch";
import { PromotionBanner } from "@/components/subscription/PromotionBanner";
import { z } from "zod";
import {
  Building2,
  User,
  MapPin,
  Phone,
  Mail,
  Globe,
  CheckCircle,
  ArrowRight,
  Shield,
  TrendingUp,
  Star,
  BadgeCheck,
  Loader2,
  Stethoscope,
  Percent,
} from "lucide-react";

// UAE Phone formatting helper
const formatUAEPhone = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  // Handle +971 prefix
  if (cleaned.startsWith('971')) {
    const rest = cleaned.slice(3);
    if (rest.length <= 2) return `+971 ${rest}`;
    return `+971 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5, 9)}`;
  }
  if (cleaned.length <= 2) return cleaned;
  return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 9)}`.trim();
};

const formSchema = z.object({
  clinicName: z.string().trim().min(2, "Clinic name must be at least 2 characters").max(100, "Clinic name must be less than 100 characters"),
  dentistName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().min(9, "Please enter a valid UAE phone number").max(20, "Phone number must be less than 20 characters"),
  password: z.string()
    .trim()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  streetAddress: z.string().trim().max(500, "Address must be less than 500 characters").optional(),
  website: z.string().trim().url("Invalid website URL").max(255, "Website must be less than 255 characters").optional().or(z.literal("")),
  description: z.string().trim().max(2000, "Description must be less than 2000 characters").optional(),
});

interface ServiceCheckboxProps {
  treatment: { id?: string; name: string; [key: string]: unknown };
  isSelected: boolean;
  onToggle: (id: string, checked: boolean) => void;
  index: number;
}

const ServiceCheckbox = React.memo<ServiceCheckboxProps>(({ treatment, isSelected, onToggle, index }) => {
  // Use id, treatment_id, or index as fallback key
  const treatmentKey = treatment.id || (treatment as any).treatment_id || `treatment-${index}`;
  
  return (
    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={(e) => onToggle(treatmentKey, e.target.checked)}
        className="w-5 h-5 rounded border-border text-primary focus:ring-primary cursor-pointer"
      />
      <span className="text-sm font-medium">{treatment.name}</span>
    </label>
  );
});
ServiceCheckbox.displayName = 'ServiceCheckbox';

const ListYourPracticePage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { data: treatments = [] } = useTreatments();

  const [listingMethod, setListingMethod] = useState<'gmb' | 'manual' | null>(null);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{
    stateId: string;
    cityId: string;
    stateName: string;
    cityName: string;
    isNewCity?: boolean;
  } | null>(null);
  const [formData, setFormData] = useState({
    clinicName: "",
    dentistName: "",
    email: user?.email || "",
    phone: "",
    password: "",
    streetAddress: "",
    website: "",
    description: "",
    agreeTerms: false,
  });

  // GMB Sign-in handler
  const handleGoogleSignIn = async () => {
    setIsConnectingGoogle(true);
    try {
      setGmbFlowFlag('listing', true);
      const redirectTo = buildGmbAuthCallbackUrl('listing=true');

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'openid email profile https://www.googleapis.com/auth/business.manage',
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        setGmbFlowFlag('listing', false);
        throw error;
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect with Google",
        variant: "destructive",
      });
      setIsConnectingGoogle(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Format phone number for UAE
    if (name === 'phone') {
      const formatted = formatUAEPhone(value);
      setFormData(prev => ({ ...prev, phone: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => {
      const newServices = prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId];
      return newServices;
    });
  };

  const handleCheckboxChange = (serviceId: string, isChecked: boolean) => {
    setSelectedServices(prev => {
      const newServices = isChecked
        ? [...prev, serviceId]
        : prev.filter(id => id !== serviceId);
      return newServices;
    });
  };

  const validateStep = (currentStep: number) => {
    const stepFields: Record<number, string[]> = {
      1: ["clinicName", "dentistName"],
      2: ["email", "phone"],
      3: ["password"],
    };

    // For step 1, also validate location
    if (currentStep === 1 && !selectedLocation) {
      setErrors(prev => ({ ...prev, location: "Please select a city" }));
      return false;
    }

    const fieldsToValidate = stepFields[currentStep];
    const partialData: Record<string, any> = {};
    fieldsToValidate.forEach(field => {
      partialData[field] = (formData as any)[field];
    });

    try {
      const partialSchema = z.object(
        Object.fromEntries(
          fieldsToValidate.map(field => [field, (formSchema.shape as any)[field]])
        )
      );
      partialSchema.parse(partialData);
      setErrors(prev => ({ ...prev, location: "" }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 3) as 1 | 2 | 3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.agreeTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the terms and conditions.",
        variant: "destructive",
      });
      return;
    }

    try {
      formSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        toast({
          title: "Validation Error",
          description: "Please check the form for errors.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Build service IDs - use the same logic as the checkbox key
      const serviceIdsToSave = selectedServices.map(serviceId => {
        // Find the treatment by its key
        const treatment = treatments.find((t: any) => {
          const key = t.id || (t as any).treatment_id || `treatment-${treatments.indexOf(t)}`;
          return key === serviceId;
        });
        return treatment?.id || serviceId;
      });
      
      const selectedServiceNames = treatments
        .filter((t: any) => selectedServices.includes(t.id))
        .map((t: any) => t.name);

      // Create user account with their password (account will be activated on approval)
      let userId: string | null = null;
      try {
        const userResult = await supabase.functions.invoke('create-listing-user', {
          body: {
            email: formData.email,
            password: formData.password,
            dentistName: formData.dentistName,
            phone: formData.phone,
          },
        });
        
        if (userResult?.data?.success) {
          userId = userResult.data.userId;
        } else if (userResult?.error) {
          console.error('Failed to create user account:', userResult.error);
          // Continue anyway - lead will be saved for manual processing
        }
      } catch (userError) {
        console.error('Error creating user account:', userError);
        // Continue anyway - lead will be saved for manual processing
      }

      // Create lead for follow-up
      const { error } = await supabase.from("leads").insert({
        patient_name: formData.dentistName,
        patient_email: formData.email,
        patient_phone: formData.phone,
        message: JSON.stringify({
          type: 'practice_listing',
          clinicName: formData.clinicName,
          dentistName: formData.dentistName,
          password: formData.password,
          userId: userId, // Store userId if created
          state: selectedLocation?.stateName || '',
          stateId: selectedLocation?.stateId || '',
          city: selectedLocation?.cityName || '',
          cityId: selectedLocation?.cityId || '',
          isNewCity: selectedLocation?.isNewCity || false,
          streetAddress: formData.streetAddress,
          website: formData.website,
          services: selectedServiceNames,
          serviceIds: serviceIdsToSave, // Use properly extracted UUIDs
          description: formData.description,
        }),
        source: "list-your-practice",
        status: "new",
      });

      if (error) throw error;

      // Send confirmation email to dentist
      try {
        await supabase.functions.invoke('send-listing-confirmation', {
          body: {
            email: formData.email,
            clinicName: formData.clinicName,
            dentistName: formData.dentistName,
            phone: formData.phone,
          },
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email to dentist:', emailError);
      }

      // Notify admin about new listing request
      try {
        await supabase.functions.invoke('notify-admin-new-listing', {
          body: {
            leadId: null, // Will be set by the function if needed
            clinicName: formData.clinicName,
            dentistName: formData.dentistName,
            email: formData.email,
            phone: formData.phone,
            city: selectedLocation?.cityName || '',
            state: selectedLocation?.stateName || '',
            services: selectedServiceNames,
            website: formData.website,
            description: formData.description,
          },
        });
      } catch (adminNotifyError) {
        console.error('Failed to notify admin:', adminNotifyError);
      }

      toast({
        title: "Submission Received!",
        description: "Our team will review your listing and contact you within 24-48 hours.",
      });

      router.push("/list-your-practice/success/");
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your listing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    { icon: Shield, title: "Free Listing", description: "List your practice for free and reach thousands of patients" },
    { icon: BadgeCheck, title: "Get Verified", description: "Verify your profile to stand out and build trust" },
    { icon: TrendingUp, title: "Grow Your Practice", description: "Attract new patients actively searching for dental care" },
    { icon: Star, title: "Build Reputation", description: "Collect reviews and showcase your expertise" },
  ];

  return (
    <PageLayout>
      <SEOHead
        title="List Your Dental Practice | Join AppointPanda Directory"
        description="List your dental practice for free on AppointPanda. Reach thousands of patients, get verified, collect reviews, and grow your practice with our dental directory."
        canonical="/list-your-practice/"
        keywords={['list dental practice', 'dental directory listing', 'dentist marketing', 'dental practice growth']}
      />
      {/* Compact Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-teal/5 border-b">
        <div className="container py-12 md:py-16">
          <div className="max-w-2xl mx-auto text-center">
            {/* Promotion Banner */}
            <div className="mb-6">
              <PromotionBanner variant="inline" />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              <Building2 className="h-4 w-4" />
              For Dental Professionals
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
              List Your <span className="text-primary">Practice</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Join the UAE's leading dental directory. Connect with patients actively searching for dental care in your area.
            </p>
          </div>
        </div>
      </div>

      <Section size="lg">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Form - 3 columns */}
            <div className="lg:col-span-3">
              <div className="card-modern p-6 md:p-8">
                {/* Method Selection */}
                {!listingMethod && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="font-display text-2xl font-bold mb-2">How would you like to list?</h2>
                      <p className="text-muted-foreground">Choose the fastest way to get started</p>
                    </div>

                    {/* GMB Option */}
                    <Card
                      className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-teal/5 cursor-pointer hover:border-primary/50 transition-all"
                      onClick={handleGoogleSignIn}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="h-14 w-14 rounded-2xl bg-white shadow-md flex items-center justify-center flex-shrink-0">
                            {isConnectingGoogle ? (
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            ) : (
                              <img
                                src="https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png"
                                alt="Google"
                                className="h-8 w-8"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg">Continue with Google</h3>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-teal/20 text-teal font-medium">Recommended</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              Import your business info, photos, and reviews from Google Business Profile
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <span className="text-xs px-2 py-1 rounded-full bg-muted">Auto-fill</span>
                              <span className="text-xs px-2 py-1 rounded-full bg-muted">Sync reviews</span>
                              <span className="text-xs px-2 py-1 rounded-full bg-muted">Verified</span>
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-3 text-muted-foreground">Or</span>
                      </div>
                    </div>

                    {/* Manual Option */}
                    <Card
                      className="border border-border cursor-pointer hover:border-primary/30 transition-all"
                      onClick={() => setListingMethod('manual')}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-7 w-7 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1">Fill Out Manually</h3>
                            <p className="text-sm text-muted-foreground">
                              Enter your practice details manually. Connect Google later.
                            </p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>

                    <p className="text-xs text-center text-muted-foreground">
                      By continuing, you agree to our <Link href="/terms/" className="text-primary hover:underline">Terms</Link> and <Link href="/privacy/" className="text-primary hover:underline">Privacy Policy</Link>
                    </p>
                  </div>
                )}

                {/* Manual Form */}
                {listingMethod === 'manual' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setListingMethod(null)}
                      className="text-sm text-muted-foreground hover:text-foreground mb-6"
                    >
                      ← Back to options
                    </button>

                    {/* Progress */}
                    <div className="flex items-center gap-2 mb-8">
                      {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-2 flex-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            }`}>
                            {step > s ? <CheckCircle className="h-5 w-5" /> : s}
                          </div>
                          {s < 3 && (
                            <div className={`h-1 flex-1 rounded-full ${step > s ? "bg-primary" : "bg-muted"}`} />
                          )}
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleSubmit}>
                      {/* Step 1: Basic Info */}
                      {step === 1 && (
                        <div className="space-y-6">
                          <div>
                            <h2 className="font-display text-2xl font-bold">Practice Information</h2>
                            <p className="text-muted-foreground">Tell us about your practice</p>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="clinicName" className="font-bold">Clinic Name *</Label>
                              <div className="relative mt-2">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                  id="clinicName"
                                  name="clinicName"
                                  placeholder="Enter clinic name"
                                  value={formData.clinicName}
                                  onChange={handleChange}
                                  className={`pl-12 h-12 rounded-xl ${errors.clinicName ? "border-destructive" : ""}`}
                                />
                              </div>
                              {errors.clinicName && <p className="text-sm text-destructive mt-1">{errors.clinicName}</p>}
                            </div>

                            <div>
                              <Label htmlFor="dentistName" className="font-bold">Your Name *</Label>
                              <div className="relative mt-2">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                  id="dentistName"
                                  name="dentistName"
                                  placeholder="Dr. First Last"
                                  value={formData.dentistName}
                                  onChange={handleChange}
                                  className={`pl-12 h-12 rounded-xl ${errors.dentistName ? "border-destructive" : ""}`}
                                />
                              </div>
                              {errors.dentistName && <p className="text-sm text-destructive mt-1">{errors.dentistName}</p>}
                            </div>

                            {/* Smart City Search - replaces state/city dropdowns */}
                            <SmartCitySearch
                              value={selectedLocation}
                              onChange={(location) => {
                                setSelectedLocation(location);
                                if (errors.location) setErrors(prev => ({ ...prev, location: '' }));
                              }}
                              error={errors.location}
                              placeholder="Type area name, e.g. 'Deira, Dubai'"
                            />

                            <div>
                              <Label htmlFor="streetAddress" className="font-bold">Street Address (Optional)</Label>
                              <div className="relative mt-2">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                  id="streetAddress"
                                  name="streetAddress"
                                  placeholder="Building 5, Al Maktoum Road"
                                  value={formData.streetAddress}
                                  onChange={handleChange}
                                  className="pl-12 h-12 rounded-xl"
                                />
                              </div>
                            </div>
                          </div>

                          <Button type="button" onClick={handleNext} className="w-full rounded-xl font-bold">
                            Continue
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {/* Step 2: Contact Info */}
                      {step === 2 && (
                        <div className="space-y-6">
                          <div>
                            <h2 className="font-display text-2xl font-bold">Contact Information</h2>
                            <p className="text-muted-foreground">How can patients reach you?</p>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="email" className="font-bold">Business Email *</Label>
                              <div className="relative mt-2">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                  id="email"
                                  name="email"
                                  type="email"
                                  placeholder="clinic@example.com"
                                  value={formData.email}
                                  onChange={handleChange}
                                  className={`pl-12 h-12 rounded-xl ${errors.email ? "border-destructive" : ""}`}
                                />
                              </div>
                              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                            </div>

                            <div>
                              <Label htmlFor="phone" className="font-bold">Phone Number *</Label>
                              <div className="relative mt-2">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                  id="phone"
                                  name="phone"
                                  type="tel"
                                  placeholder="+971 50 123 4567"
                                  value={formData.phone}
                                  onChange={handleChange}
                                  className={`pl-12 h-12 rounded-xl ${errors.phone ? "border-destructive" : ""}`}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">UAE format: +971 XX XXX XXXX</p>
                              {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
                            </div>

                            <div>
                              <Label htmlFor="website" className="font-bold">Website (Optional)</Label>
                              <div className="relative mt-2">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                  id="website"
                                  name="website"
                                  type="url"
                                  placeholder="https://www.yourclinic.com"
                                  value={formData.website}
                                  onChange={handleChange}
                                  className="pl-12 h-12 rounded-xl"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-xl font-bold">
                              Back
                            </Button>
                            <Button type="button" onClick={handleNext} className="flex-1 rounded-xl font-bold">
                              Continue
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Step 3: Services & Submit */}
                      {step === 3 && (
                        <div className="space-y-6">
                          <div>
                            <h2 className="font-display text-2xl font-bold">Account Setup</h2>
                            <p className="text-muted-foreground">Set up your login credentials</p>
                          </div>

                          <div className="space-y-4">
                            {/* Password Field */}
                            <div>
                              <Label htmlFor="password" className="font-bold">Create Password *</Label>
                              <div className="relative mt-2">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                </div>
                                <Input
                                  id="password"
                                  name="password"
                                  type="password"
                                  placeholder="Create a strong password"
                                  value={formData.password}
                                  onChange={handleChange}
                                  className={`pl-12 h-12 rounded-xl ${errors.password ? "border-destructive" : ""}`}
                                />
                              </div>
                              {errors.password ? (
                                <p className="text-sm text-destructive mt-1">{errors.password}</p>
                              ) : (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Min 8 characters with uppercase, lowercase, and number
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="border-t pt-6">
                            <h2 className="font-display text-xl font-bold mb-2">Services Offered</h2>
                            <p className="text-muted-foreground text-sm mb-4">Select the services you provide</p>
                          </div>

                          <div className="space-y-4">
                            {/* Services Grid - Using native checkboxes */}
                            <div>
                              <Label className="font-bold flex items-center gap-2 mb-3">
                                <Stethoscope className="h-4 w-4" />
                                Select Your Services
                              </Label>
                              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
                                {treatments.map((treatment: any, index: number) => {
                                  const treatmentKey = treatment.id || (treatment as any).treatment_id || `treatment-${index}`;
                                  return (
                                    <ServiceCheckbox
                                      key={treatmentKey}
                                      treatment={treatment}
                                      index={index}
                                      isSelected={selectedServices.includes(treatmentKey)}
                                      onToggle={(id, checked) => handleCheckboxChange(id, checked)}
                                    />
                                  );
                                })}
                              </div>
                              {selectedServices.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} selected
                                </p>
                              )}
                            </div>

                            <div>
                              <Label htmlFor="description" className="font-bold">About Your Practice (Optional)</Label>
                              <Textarea
                                id="description"
                                name="description"
                                placeholder="Tell patients about your clinic, experience, and what makes you unique..."
                                value={formData.description}
                                onChange={handleChange}
                                className="mt-2 rounded-xl min-h-[100px]"
                              />
                            </div>

                            <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                              <Checkbox
                                id="agreeTerms"
                                checked={formData.agreeTerms}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreeTerms: checked === true }))}
                              />
                              <Label htmlFor="agreeTerms" className="text-sm leading-relaxed cursor-pointer">
                                I agree to the <Link href="/terms/" className="text-primary hover:underline">Terms & Conditions</Link> and <Link href="/privacy/" className="text-primary hover:underline">Privacy Policy</Link>. I confirm that I am authorized to list this practice.
                              </Label>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1 rounded-xl font-bold">
                              Back
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl font-bold">
                              {isSubmitting ? "Submitting..." : "Submit Listing"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </form>
                  </>
                )}
              </div>
            </div>

            {/* Benefits - 2 columns */}
            <div className="lg:col-span-2">
              <h2 className="font-display text-xl font-bold mb-4">Why List With Us?</h2>
              <div className="space-y-3">
                {benefits.map((benefit, i) => (
                  <div key={i} className="card-modern p-4 flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{benefit.title}</h3>
                      <p className="text-xs text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-muted/50">
                <h3 className="font-bold text-sm mb-2">Already have a profile?</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  If your clinic is already listed, claim and verify it instead.
                </p>
                <Button asChild variant="outline" size="sm" className="rounded-xl font-bold w-full">
                  <Link href="/claim-profile/">
                    Claim Existing Profile
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </PageLayout>
  );
};

export default ListYourPracticePage;
