-- Allow ZIP uploads while keeping a strict 10MB cap.
-- This targets the documents bucket used for customer uploads.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  TRUE,
  10485760,
  ARRAY['application/pdf', 'text/html', 'application/zip', 'application/x-zip-compressed']
)
ON CONFLICT (id) DO UPDATE
SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
