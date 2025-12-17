-- Contact Form Submissions Table
-- Run this migration in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  topic VARCHAR(50) NOT NULL,
  message TEXT NOT NULL CHECK (char_length(message) <= 500),
  ip_address VARCHAR(45), -- IPv4 or IPv6
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying by status and date
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status_created
  ON contact_submissions(status, created_at DESC);

-- Index for rate limiting by IP
CREATE INDEX IF NOT EXISTS idx_contact_submissions_ip_created
  ON contact_submissions(ip_address, created_at DESC);

-- Index for rate limiting by email
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email_created
  ON contact_submissions(email, created_at DESC);

-- Enable Row Level Security
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read contact submissions
CREATE POLICY "Admins can view contact submissions"
  ON contact_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Anyone can insert (needed for public contact form)
CREATE POLICY "Anyone can submit contact form"
  ON contact_submissions
  FOR INSERT
  WITH CHECK (true);

-- Policy: Admins can update status
CREATE POLICY "Admins can update contact submissions"
  ON contact_submissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

COMMENT ON TABLE contact_submissions IS 'Stores contact form submissions from the public contact page';
COMMENT ON COLUMN contact_submissions.email IS 'Email address of the person submitting the form';
COMMENT ON COLUMN contact_submissions.topic IS 'Subject/topic of the message';
COMMENT ON COLUMN contact_submissions.message IS 'The actual message content (max 500 chars)';
COMMENT ON COLUMN contact_submissions.ip_address IS 'IP address for rate limiting purposes';
COMMENT ON COLUMN contact_submissions.status IS 'Status of the submission: pending, read, or resolved';
