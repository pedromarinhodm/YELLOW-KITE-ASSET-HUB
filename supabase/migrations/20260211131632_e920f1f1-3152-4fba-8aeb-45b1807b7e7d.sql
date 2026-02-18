
-- Add status column to employees table
ALTER TABLE gestao_patrimonio.employees ADD COLUMN status text NOT NULL DEFAULT 'Ativo';

-- Update existing employees to 'Ativo'
UPDATE gestao_patrimonio.employees SET status = 'Ativo' WHERE status IS NULL;

