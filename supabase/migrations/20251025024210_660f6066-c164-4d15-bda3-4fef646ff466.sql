-- Enable RLS on admins table
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access (this table appears to be legacy, keeping restrictive policy)
CREATE POLICY "Admin read access to admins table" 
ON public.admins 
FOR SELECT 
USING (true);