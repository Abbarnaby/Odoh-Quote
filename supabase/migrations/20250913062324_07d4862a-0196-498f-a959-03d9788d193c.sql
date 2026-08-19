-- Create admin users table
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (admin only access)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only
CREATE POLICY "Admin users can manage their own data" 
ON public.admin_users 
FOR ALL 
USING (true);

-- Create paper costs table
CREATE TABLE public.paper_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paper_type TEXT NOT NULL,
  size TEXT NOT NULL,
  cost_per_page DECIMAL(10,5) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(paper_type, size)
);

ALTER TABLE public.paper_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Paper costs are publicly readable" ON public.paper_costs FOR SELECT USING (true);
CREATE POLICY "Admins can manage paper costs" ON public.paper_costs FOR ALL USING (true);

-- Create toner costs table
CREATE TABLE public.toner_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  color_type TEXT NOT NULL,
  size TEXT NOT NULL,
  cost_per_page DECIMAL(10,5) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(color_type, size)
);

ALTER TABLE public.toner_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Toner costs are publicly readable" ON public.toner_costs FOR SELECT USING (true);
CREATE POLICY "Admins can manage toner costs" ON public.toner_costs FOR ALL USING (true);

-- Create cover costs table
CREATE TABLE public.cover_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cover_type TEXT NOT NULL,
  size TEXT NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cover_type, size)
);

ALTER TABLE public.cover_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cover costs are publicly readable" ON public.cover_costs FOR SELECT USING (true);
CREATE POLICY "Admins can manage cover costs" ON public.cover_costs FOR ALL USING (true);

-- Create finishing costs table
CREATE TABLE public.finishing_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_range_min INTEGER NOT NULL,
  page_range_max INTEGER,
  cost DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.finishing_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Finishing costs are publicly readable" ON public.finishing_costs FOR SELECT USING (true);
CREATE POLICY "Admins can manage finishing costs" ON public.finishing_costs FOR ALL USING (true);

-- Create packaging costs table
CREATE TABLE public.packaging_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  size TEXT NOT NULL UNIQUE,
  cost DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.packaging_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Packaging costs are publicly readable" ON public.packaging_costs FOR SELECT USING (true);
CREATE POLICY "Admins can manage packaging costs" ON public.packaging_costs FOR ALL USING (true);

-- Create BHR settings table
CREATE TABLE public.bhr_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rate_per_hour DECIMAL(10,2) NOT NULL DEFAULT 3000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bhr_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "BHR settings are publicly readable" ON public.bhr_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage BHR settings" ON public.bhr_settings FOR ALL USING (true);

-- Create additional services table
CREATE TABLE public.additional_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name TEXT NOT NULL UNIQUE,
  cost DECIMAL(10,2) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.additional_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Additional services are publicly readable" ON public.additional_services FOR SELECT USING (true);
CREATE POLICY "Admins can manage additional services" ON public.additional_services FOR ALL USING (true);

-- Create profit margins table
CREATE TABLE public.profit_margins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  copies_min INTEGER NOT NULL,
  copies_max INTEGER,
  margin_percentage_1 DECIMAL(5,2) NOT NULL,
  margin_percentage_2 DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profit_margins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profit margins are publicly readable" ON public.profit_margins FOR SELECT USING (true);
CREATE POLICY "Admins can manage profit margins" ON public.profit_margins FOR ALL USING (true);

-- Insert default admin user (password: admin123)
INSERT INTO public.admin_users (username, password_hash) VALUES 
('admin', '$2b$10$K7GX8qU5lF3vOx8QG2QbXOqVc5pGhH9z1nB4jF8aW7xE2Nv6M5tSi');

-- Insert default paper costs
INSERT INTO public.paper_costs (paper_type, size, cost_per_page) VALUES 
('Cream 100gsm', 'A6', 1.84375),
('Cream 100gsm', 'A5', 3.6875),
('Cream 100gsm', '6x9', 7.375),
('Cream 100gsm', '7x10', 7.375),
('Cream 100gsm', 'A4', 7.375),
('Cream 100gsm', 'A3', 14.75),
('Cream 80gsm', 'A6', 1.75),
('Cream 80gsm', 'A5', 3.5),
('Cream 80gsm', '6x9', 7),
('Cream 80gsm', '7x10', 7),
('Cream 80gsm', 'A4', 7),
('Cream 80gsm', 'A3', 14),
('Cream 70gsm', 'A6', 1.625),
('Cream 70gsm', 'A5', 3.25),
('Cream 70gsm', '6x9', 6.5),
('Cream 70gsm', '7x10', 6.5),
('Cream 70gsm', 'A4', 6.5),
('Cream 70gsm', 'A3', 13),
('White 80gsm', 'A6', 1.40625),
('White 80gsm', 'A5', 2.8125),
('White 80gsm', '6x9', 5.625),
('White 80gsm', '7x10', 5.625),
('White 80gsm', 'A4', 5.625),
('White 80gsm', 'A3', 11.25),
('White 70gsm', 'A6', 1.09375),
('White 70gsm', 'A5', 2.1875),
('White 70gsm', '6x9', 4.375),
('White 70gsm', '7x10', 4.375),
('White 70gsm', 'A4', 4.375),
('White 70gsm', 'A3', 8.75),
('Gloss 135gsm', 'A1', 130),
('Gloss 135gsm', 'A2', 70),
('Gloss 135gsm', 'A3', 32.5),
('Gloss 135gsm', '6x9', 16.25),
('Gloss 135gsm', '7x10', 16.25),
('Gloss 135gsm', 'A4', 16.25),
('Gloss 135gsm', 'A5', 8.125),
('Gloss 135gsm', 'A6', 4.0625),
('Gloss 115gsm', 'A1', 110),
('Gloss 115gsm', 'A2', 60),
('Gloss 115gsm', 'A3', 30),
('Gloss 115gsm', '6x9', 15),
('Gloss 115gsm', '7x10', 15),
('Gloss 115gsm', 'A4', 15),
('Gloss 115gsm', 'A5', 7.5),
('Gloss 115gsm', 'A6', 3.75);

-- Insert default toner costs
INSERT INTO public.toner_costs (color_type, size, cost_per_page) VALUES 
('B/W', 'A6', 0.5),
('B/W', 'A5', 1),
('B/W', '6x9', 2),
('B/W', '7x10', 2),
('B/W', 'A4', 2),
('B/W', 'A3', 4),
('Colour', 'A6', 2.5),
('Colour', 'A5', 5),
('Colour', '6x9', 10),
('Colour', '7x10', 10),
('Colour', 'A4', 10),
('Colour', 'A3', 20);

-- Insert default cover costs
INSERT INTO public.cover_costs (cover_type, size, cost) VALUES 
('Soft', 'A6', 100),
('Soft', 'A5', 165),
('Soft', '6x9', 310),
('Soft', 'A4', 350),
('Soft', 'A3', 500),
('Hard Cover (Casebound)', 'A6', 250),
('Hard Cover (Casebound)', 'A5', 500),
('Hard Cover (Casebound)', '6x9', 800),
('Hard Cover (Casebound)', 'A4', 1000),
('Hard Cover (Casebound)', 'A3', 2000),
('Folded Cover (300gsm)', 'A5', 330),
('Casebound with Folded Gloss Cover', 'A5', 700),
('Special Finishing (Hard/Folded)', 'All', 300);

-- Insert default finishing costs
INSERT INTO public.finishing_costs (page_range_min, page_range_max, cost) VALUES 
(50, 140, 70),
(150, 320, 120),
(350, NULL, 300);

-- Insert default packaging costs
INSERT INTO public.packaging_costs (size, cost) VALUES 
('A6', 7),
('A5', 14),
('6x9', 15),
('A4', 25),
('A3', 50);

-- Insert default BHR settings
INSERT INTO public.bhr_settings (rate_per_hour) VALUES (3000);

-- Insert default additional services
INSERT INTO public.additional_services (service_name, cost, is_default) VALUES 
('Design', 10000, true),
('ISBN', 8000, true);

-- Insert default profit margins
INSERT INTO public.profit_margins (copies_min, copies_max, margin_percentage_1, margin_percentage_2) VALUES 
(50, 100, 100, 90),
(250, 500, 80, 60),
(1000, 2000, 55, 45),
(5000, 10000, 40, 30);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON public.admin_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_paper_costs_updated_at BEFORE UPDATE ON public.paper_costs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_toner_costs_updated_at BEFORE UPDATE ON public.toner_costs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cover_costs_updated_at BEFORE UPDATE ON public.cover_costs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_finishing_costs_updated_at BEFORE UPDATE ON public.finishing_costs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_packaging_costs_updated_at BEFORE UPDATE ON public.packaging_costs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bhr_settings_updated_at BEFORE UPDATE ON public.bhr_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_additional_services_updated_at BEFORE UPDATE ON public.additional_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profit_margins_updated_at BEFORE UPDATE ON public.profit_margins FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();