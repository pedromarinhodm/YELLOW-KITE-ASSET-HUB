
-- Add status column to employees table
ALTER TABLE public.employees ADD COLUMN status text NOT NULL DEFAULT 'Ativo';

-- Update existing employees to 'Ativo'
UPDATE public.employees SET status = 'Ativo' WHERE status IS NULL;
