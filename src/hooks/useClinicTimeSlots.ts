import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';

export interface TimeSlot {
  value: string;
  label: string;
  available: boolean;
}

interface ClinicHoursRow {
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

const DEFAULT_OPEN = '09:00';
const DEFAULT_CLOSE = '18:00';
const DEFAULT_SLOT_DURATION = 30;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function useClinicTimeSlots(clinicId?: string | null, selectedDate?: Date | null) {
  return useQuery({
    queryKey: ['clinic-time-slots', clinicId, selectedDate?.toISOString()],
    queryFn: async (): Promise<TimeSlot[]> => {
      if (!clinicId || !selectedDate) return [];

      const dayOfWeek = selectedDate.getDay();

      // Fetch clinic hours for this day
      const { data: hoursData } = await supabase
        .from('clinic_hours')
        .select('open_time, close_time, is_closed')
        .eq('clinic_id', clinicId)
        .eq('day_of_week', dayOfWeek)
        .maybeSingle();

      // Fetch slot duration from dentist settings
      const { data: settingsData } = await supabase
        .from('dentist_settings')
        .select('slot_duration_minutes')
        .eq('clinic_id', clinicId)
        .maybeSingle();

      if (hoursData?.is_closed) return [];

      const openTime = hoursData?.open_time || DEFAULT_OPEN;
      const closeTime = hoursData?.close_time || DEFAULT_CLOSE;
      const slotDuration = (settingsData as any)?.slot_duration_minutes || DEFAULT_SLOT_DURATION;

      // Generate time slots
      const [openH, openM] = openTime.split(':').map(Number);
      const [closeH, closeM] = closeTime.split(':').map(Number);
      const openMinutes = openH * 60 + openM;
      const closeMinutes = closeH * 60 + closeM;

      const slots: TimeSlot[] = [];
      for (let m = openMinutes; m + slotDuration <= closeMinutes; m += slotDuration) {
        const h = Math.floor(m / 60);
        const min = m % 60;
        const timeStr = `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        const ampm = h < 12 ? 'AM' : 'PM';
        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        const endM = m + slotDuration;
        const endH = Math.floor(endM / 60);
        const endMin = endM % 60;
        const endAmpm = endH < 12 ? 'AM' : 'PM';
        const endH12 = endH === 0 ? 12 : endH > 12 ? endH - 12 : endH;
        const label = `${h12}:${min.toString().padStart(2, '0')} ${ampm} - ${endH12}:${endMin.toString().padStart(2, '0')} ${endAmpm}`;
        slots.push({ value: timeStr, label, available: true });
      }

      return slots;
    },
    enabled: !!clinicId && !!selectedDate,
    staleTime: 60 * 1000,
  });
}
