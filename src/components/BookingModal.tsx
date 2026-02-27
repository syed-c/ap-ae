'use client';
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useAnalytics } from "@/hooks/useAnalytics";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle } from "lucide-react";

// Common dental services for "Not sure" option
const commonDentalServices = [
  "General Checkup & Cleaning",
  "Teeth Whitening",
  "Dental Implants",
  "Veneers",
  "Invisalign / Clear Aligners",
  "Braces / Orthodontics",
  "Root Canal Treatment",
  "Tooth Extraction",
  "Dental Crowns & Bridges",
  "Fillings",
  "Gum Treatment / Periodontics",
  "Pediatric Dentistry",
  "Wisdom Tooth Removal",
  "Smile Makeover",
  "Emergency Dental Care",
  "Dentures",
  "Dental X-Rays",
  "Teeth Grinding / TMJ Treatment",
];

// Sanitize text input to prevent XSS
const sanitizeText = (text: string): string => {
  return text
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

const bookingSchema = z.object({
  patient_name: z.string().min(2, "Name must be at least 2 characters").max(100)
    .transform(sanitizeText),
  patient_phone: z.string().min(9, "Please enter a valid phone number").max(20)
    .regex(/^[\d\s\+\-\(\)]+$/, "Please enter a valid phone number"),
  patient_email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  treatment_id: z.string().min(1, "Please select a service"),
  preferred_date: z.string().min(1, "Please select a preferred date"),
  preferred_time: z.string().min(1, "Please select a preferred time"),
  notes: z.string().max(500).optional()
    .transform((val) => val ? sanitizeText(val) : val),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  profileName: string;
  profileType: 'dentist' | 'clinic';
  clinicId?: string;
}

export function BookingModal({
  open,
  onOpenChange,
  profileId,
  profileName,
  profileType,
  clinicId,
}: BookingModalProps) {
  const { toast } = useToast();
  const { trackAppointmentRequest } = useAnalytics();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showNotSureList, setShowNotSureList] = useState(false);

  // Fetch treatments from database
  const { data: treatments } = useQuery({
    queryKey: ['booking-treatments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('treatments')
        .select('id, name')
        .eq('is_active', true)
        .order('display_order');
      return data || [];
    },
  });

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      patient_name: "",
      patient_phone: "",
      patient_email: "",
      treatment_id: "",
      preferred_date: "",
      preferred_time: "",
      notes: "",
    },
  });

  const selectedTreatment = form.watch('treatment_id');

  useEffect(() => {
    setShowNotSureList(selectedTreatment === 'not_sure');
  }, [selectedTreatment]);

  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);
    try {
      const appointmentData = {
        patient_name: data.patient_name,
        patient_phone: data.patient_phone,
        patient_email: data.patient_email || null,
        treatment_id: data.treatment_id === 'not_sure' ? null : data.treatment_id,
        preferred_date: data.preferred_date,
        preferred_time: data.preferred_time,
        notes: data.notes || null,
        clinic_id: profileType === 'clinic' ? profileId : clinicId || null,
        dentist_id: profileType === 'dentist' ? profileId : null,
        status: 'pending',
        source: 'website',
      };

      const { error } = await supabase
        .from('appointments')
        .insert([appointmentData] as any);

      if (error) throw error;

      // Track appointment request in GA4
      trackAppointmentRequest({
        clinic_id: profileType === 'clinic' ? profileId : clinicId || '',
        clinic_name: profileName,
        dentist_id: profileType === 'dentist' ? profileId : undefined,
        treatment_type: data.treatment_id === 'not_sure' ? 'not_sure' : treatments?.find(t => t.id === data.treatment_id)?.name,
      });

      setIsSuccess(true);
      toast({
        title: "Booking Request Sent!",
        description: "The clinic will contact you to confirm your appointment.",
      });

      setTimeout(() => {
        setIsSuccess(false);
        form.reset();
        onOpenChange(false);
      }, 2000);

    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-data text-xl text-foreground mb-2">Booking Submitted!</h3>
            <p className="text-body text-muted-foreground">
              Your appointment request with {profileName} has been sent. They will contact you shortly.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-data text-2xl">Book Appointment</DialogTitle>
          <DialogDescription className="text-body">
            Request an appointment with <span className="font-semibold text-foreground">{profileName}</span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-4">
            <FormField
              control={form.control}
              name="patient_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-micro">Full Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Your full name" 
                      className="rounded-xl h-12" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="patient_phone"
                render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-micro">Phone Number *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="+971 50 123 4567" 
                        className="rounded-xl h-12" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="patient_email"
                render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-micro">Email (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="you@email.com" 
                        className="rounded-xl h-12" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Service Selection */}
            <FormField
              control={form.control}
              name="treatment_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-micro">Service Required *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl h-12">
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-64 bg-background border border-border">
                      <SelectItem value="not_sure" className="font-bold text-primary">
                        Not sure / Need consultation
                      </SelectItem>
                      {treatments?.map((treatment) => (
                        <SelectItem key={treatment.id} value={treatment.id}>
                          {treatment.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Show common services when "Not sure" is selected */}
            {showNotSureList && (
              <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">Common dental services we offer:</p>
                <div className="flex flex-wrap gap-2">
                  {commonDentalServices.map((service, i) => (
                    <span 
                      key={i} 
                      className="text-xs bg-background px-2.5 py-1 rounded-full border border-border text-muted-foreground"
                    >
                      {service}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Don't worry! The clinic will help you determine the best treatment during your consultation.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="preferred_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-micro">Preferred Date *</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        min={minDate}
                        className="rounded-xl h-12" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferred_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-micro">Preferred Time *</FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        className="rounded-xl h-12" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-micro">Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your dental concern or any specific requests..." 
                      className="rounded-xl resize-none" 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full rounded-xl h-12 font-bold text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Request Appointment"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By booking, you agree to our Terms of Service and Privacy Policy. 
              The clinic will contact you to confirm the appointment.
            </p>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}