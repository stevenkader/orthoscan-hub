-- Remove unrestricted public insert from orthodontic_usage_logs
-- Only the backend edge function should be able to insert logs using service role
DROP POLICY IF EXISTS "Allow public insert" ON public.orthodontic_usage_logs;

-- The edge function will use service role key to insert logs, bypassing RLS
-- This prevents malicious users from flooding the database with fake analytics