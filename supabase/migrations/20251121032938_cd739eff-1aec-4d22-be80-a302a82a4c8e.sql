-- Remove public read access from orthodontic_usage_logs
-- This table contains medical activity data and should only be accessible internally
DROP POLICY IF EXISTS "Allow public read" ON public.orthodontic_usage_logs;

-- Keep the insert policy so the app can continue logging events
-- Public read is removed to protect patient privacy