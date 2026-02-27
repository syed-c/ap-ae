
-- Add gender column to dentists for filtering
ALTER TABLE public.dentists ADD COLUMN IF NOT EXISTS gender text;
