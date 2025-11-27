-- Create table for tracking orthodontic analyzer usage
CREATE TABLE public.orthodontic_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  event_type TEXT NOT NULL CHECK (event_type IN ('upload', 'analysis_start', 'analysis_success', 'analysis_error')),
  session_id TEXT,
  error_message TEXT,
  metadata JSONB
);

-- Enable Row Level Security
ALTER TABLE public.orthodontic_usage_logs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert logs (since this is public usage tracking)
CREATE POLICY "Allow public insert" 
ON public.orthodontic_usage_logs 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to read logs (for analytics dashboard)
CREATE POLICY "Allow public read" 
ON public.orthodontic_usage_logs 
FOR SELECT 
USING (true);

-- Create index for faster queries by date
CREATE INDEX idx_orthodontic_logs_created_at ON public.orthodontic_usage_logs(created_at DESC);

-- Create index for event type filtering
CREATE INDEX idx_orthodontic_logs_event_type ON public.orthodontic_usage_logs(event_type);