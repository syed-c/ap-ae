-- Add author credentials and LinkedIn to blog_authors table
-- This enables E-E-A-T signals for blog content

ALTER TABLE public.blog_authors 
ADD COLUMN IF NOT EXISTS credentials TEXT,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS dha_license TEXT,
ADD COLUMN IF NOT EXISTS years_experience INTEGER;

-- Update existing authors with sample data (for demo purposes)
-- In production, these should be real values
UPDATE public.blog_authors 
SET 
  title = 'Chief Dental Editor',
  credentials = 'BDS, MDS (Oral Surgery)',
  years_experience = 12
WHERE name = 'AppointPanda Team' AND title IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_blog_authors_is_active ON blog_authors(is_active);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);