
-- Create the clinic-assets storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('clinic-assets', 'clinic-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to clinic assets
CREATE POLICY "Public read access for clinic assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'clinic-assets');

-- Allow service role (edge functions) to upload
CREATE POLICY "Service role can upload clinic assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'clinic-assets');

-- Allow service role to update clinic assets
CREATE POLICY "Service role can update clinic assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'clinic-assets');

-- Add missing synced_at column to google_reviews
ALTER TABLE public.google_reviews ADD COLUMN IF NOT EXISTS synced_at timestamptz DEFAULT now();

-- Also store the photos JSON array and total_reviews/average_rating on clinics 
-- (rating and review_count columns already exist, just ensure photos is populated)
