-- 1. BASE TABLES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  employee_id TEXT UNIQUE, 
  preferred_module TEXT,
  role TEXT DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.allowed_users (
  email TEXT PRIMARY KEY,
  role TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id TEXT PRIMARY KEY, 
  name TEXT NOT NULL,
  category TEXT,
  quantity INTEGER DEFAULT 0,
  description TEXT,
  qr_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.spare_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  quantity INTEGER DEFAULT 0,
  description TEXT,
  qr_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('add', 'edit', 'delete', 'scan')),
  item_id TEXT NOT NULL,
  module TEXT NOT NULL CHECK (module IN ('inventory', 'spare')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.stock_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id TEXT NOT NULL,
  module TEXT NOT NULL CHECK (module IN ('inventory', 'spare')),
  action TEXT NOT NULL CHECK (action IN ('add', 'remove', 'update', 'scan', 'delete', 'remark')),
  quantity INTEGER DEFAULT 0,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  remarks TEXT
);

CREATE TABLE IF NOT EXISTS public.low_stock_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id TEXT NOT NULL,
  module TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  threshold INTEGER DEFAULT 5,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. DYNAMIC ID GENERATION (IM & SM Prefixes)
CREATE OR REPLACE FUNCTION generate_inventory_id() 
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  max_id TEXT;
  numeric_part INTEGER;
BEGIN
  SELECT id INTO max_id FROM public.inventory_items ORDER BY CAST(SUBSTRING(id FROM 3) AS INTEGER) DESC LIMIT 1;
  IF max_id IS NULL THEN new_id := 'IM0001';
  ELSE
    numeric_part := CAST(SUBSTRING(max_id FROM 3) AS INTEGER) + 1;
    new_id := 'IM' || LPAD(numeric_part::text, 4, '0');
  END IF;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_spare_id() 
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  max_id TEXT;
  numeric_part INTEGER;
BEGIN
  SELECT id INTO max_id FROM public.spare_items ORDER BY CAST(SUBSTRING(id FROM 3) AS INTEGER) DESC LIMIT 1;
  IF max_id IS NULL THEN new_id := 'SM0001';
  ELSE
    numeric_part := CAST(SUBSTRING(max_id FROM 3) AS INTEGER) + 1;
    new_id := 'SM' || LPAD(numeric_part::text, 4, '0');
  END IF;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- 3. PERSONNEL REGISTRY TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  assigned_role TEXT;
BEGIN
  -- Check whitelist for priority role allocation
  SELECT role INTO assigned_role FROM public.allowed_users WHERE email = new.email;
  
  IF assigned_role IS NULL THEN
    assigned_role := COALESCE(new.raw_user_meta_data->>'role', 'staff');
  END IF;

  INSERT INTO public.profiles (id, email, name, employee_id, preferred_module, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', COALESCE(new.raw_user_meta_data->>'full_name', 'Murugappa Personnel')),
    COALESCE(new.raw_user_meta_data->>'employee_id', 'MUR-NEW'), -- Intercepted by App.tsx logic for profile completion
    new.raw_user_meta_data->>'preferred_module',
    assigned_role
  ) ON CONFLICT (id) DO UPDATE SET email = excluded.email;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger binding
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. LOW STOCK ALERT TRIGGER
CREATE OR REPLACE FUNCTION public.check_low_stock()
RETURNS TRIGGER AS $$
DECLARE
  threshold_qty INTEGER := 5;
BEGIN
  IF NEW.quantity < OLD.quantity AND NEW.quantity <= threshold_qty THEN
    INSERT INTO public.low_stock_alerts (item_id, module, item_name, quantity, threshold)
    SELECT NEW.id, TG_ARGV[0], NEW.name, NEW.quantity, threshold_qty
    WHERE NOT EXISTS (
      SELECT 1 FROM public.low_stock_alerts 
      WHERE item_id = NEW.id AND resolved = false
    );
    UPDATE public.low_stock_alerts SET quantity = NEW.quantity, resolved = false
    WHERE item_id = NEW.id AND resolved = false;
  END IF;
  IF NEW.quantity > threshold_qty THEN
    UPDATE public.low_stock_alerts SET resolved = true
    WHERE item_id = NEW.id AND resolved = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS inventory_low_stock_check ON public.inventory_items;
CREATE TRIGGER inventory_low_stock_check AFTER UPDATE OF quantity ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.check_low_stock('inventory');

DROP TRIGGER IF EXISTS spare_low_stock_check ON public.spare_items;
CREATE TRIGGER spare_low_stock_check AFTER UPDATE OF quantity ON public.spare_items FOR EACH ROW EXECUTE FUNCTION public.check_low_stock('spare');

-- 5. ADMIN AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 6. RLS LOGIC & POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allowed_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spare_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.low_stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Profiles are readable by everyone" ON public.profiles;
CREATE POLICY "Profiles are readable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Inventory & Spares Policies
DROP POLICY IF EXISTS "Auth access inventory" ON public.inventory_items;
CREATE POLICY "Auth access inventory" ON public.inventory_items FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Auth access spares" ON public.spare_items;
CREATE POLICY "Auth access spares" ON public.spare_items FOR ALL TO authenticated USING (true);

-- Allowed Users Policies
DROP POLICY IF EXISTS "Auth access allowed_users" ON public.allowed_users;
CREATE POLICY "Auth access allowed_users" ON public.allowed_users FOR ALL TO authenticated USING (true);

-- Activity Logs & Transactions Policies
DROP POLICY IF EXISTS "Auth access activity_logs" ON public.activity_logs;
CREATE POLICY "Auth access activity_logs" ON public.activity_logs FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Auth access stock_transactions" ON public.stock_transactions;
CREATE POLICY "Auth access stock_transactions" ON public.stock_transactions FOR ALL TO authenticated USING (true);

-- Low Stock Alerts Policies
DROP POLICY IF EXISTS "Auth access low_stock_alerts" ON public.low_stock_alerts;
CREATE POLICY "Auth access low_stock_alerts" ON public.low_stock_alerts FOR ALL TO authenticated USING (true);

-- Admin Audit Logs Policies
DROP POLICY IF EXISTS "Auth access admin_audit_logs" ON public.admin_audit_logs;
CREATE POLICY "Auth access admin_audit_logs" ON public.admin_audit_logs FOR ALL TO authenticated USING (true);
