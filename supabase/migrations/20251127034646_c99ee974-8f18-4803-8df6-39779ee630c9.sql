-- Create app_role enum first
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create function to check roles (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

-- Policy for users to read their own roles
CREATE POLICY "Users can read their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy for admins to manage all roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Now create orthodontic usage logs table
CREATE TABLE IF NOT EXISTS public.orthodontic_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  session_id TEXT NOT NULL,
  metadata JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orthodontic_usage_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert logs (for tracking)
CREATE POLICY "Allow anyone to insert usage logs"
ON public.orthodontic_usage_logs
FOR INSERT
TO public
WITH CHECK (true);

-- Create policy for admins to read all logs
CREATE POLICY "Allow admins to read all logs"
ON public.orthodontic_usage_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_usage_logs_session ON public.orthodontic_usage_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.orthodontic_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);