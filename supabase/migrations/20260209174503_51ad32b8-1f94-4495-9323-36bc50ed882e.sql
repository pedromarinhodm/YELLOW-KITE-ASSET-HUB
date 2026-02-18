CREATE SCHEMA IF NOT EXISTS gestao_patrimonio;

-- Create equipments table
CREATE TABLE gestao_patrimonio.equipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  classification TEXT NOT NULL,
  serial_number TEXT UNIQUE NOT NULL,
  purchase_value DECIMAL(10,2) NOT NULL,
  purchase_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create employees table
CREATE TABLE gestao_patrimonio.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create allocations table
CREATE TABLE gestao_patrimonio.allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES gestao_patrimonio.employees(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES gestao_patrimonio.equipments(id) ON DELETE CASCADE,
  allocated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  returned_at TIMESTAMPTZ,
  notes TEXT,
  type TEXT NOT NULL,
  term_signed BOOLEAN DEFAULT false,
  term_signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE gestao_patrimonio.equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE gestao_patrimonio.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE gestao_patrimonio.allocations ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (no auth required for this internal tool)
CREATE POLICY "Allow full access to equipments" ON gestao_patrimonio.equipments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to employees" ON gestao_patrimonio.employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to allocations" ON gestao_patrimonio.allocations FOR ALL USING (true) WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION gestao_patrimonio.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = gestao_patrimonio;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_equipments_updated_at
  BEFORE UPDATE ON gestao_patrimonio.equipments
  FOR EACH ROW EXECUTE FUNCTION gestao_patrimonio.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON gestao_patrimonio.employees
  FOR EACH ROW EXECUTE FUNCTION gestao_patrimonio.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_equipments_status ON gestao_patrimonio.equipments(status);
CREATE INDEX idx_equipments_category ON gestao_patrimonio.equipments(category);
CREATE INDEX idx_equipments_classification ON gestao_patrimonio.equipments(classification);
CREATE INDEX idx_employees_department ON gestao_patrimonio.employees(department);
CREATE INDEX idx_allocations_employee_id ON gestao_patrimonio.allocations(employee_id);
CREATE INDEX idx_allocations_equipment_id ON gestao_patrimonio.allocations(equipment_id);

