-- Create profit_margins table
CREATE TABLE public.profit_margins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  copies_min INTEGER NOT NULL,
  copies_max INTEGER NOT NULL,
  margin_percentage_1 NUMERIC NOT NULL,
  margin_percentage_2 NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profit_margins ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin full access to profit margins" 
ON public.profit_margins 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create policy for read access
CREATE POLICY "Allow read access to profit margins" 
ON public.profit_margins 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_profit_margins_updated_at
BEFORE UPDATE ON public.profit_margins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();