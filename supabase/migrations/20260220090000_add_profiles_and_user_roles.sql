DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'app_role'
      AND n.nspname = 'gestao_patrimonio'
  ) THEN
    CREATE TYPE gestao_patrimonio.app_role AS ENUM ('admin', 'coordinator');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS gestao_patrimonio.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  name TEXT NOT NULL,
  department TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gestao_patrimonio.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role gestao_patrimonio.app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON gestao_patrimonio.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON gestao_patrimonio.user_roles(user_id);

ALTER TABLE gestao_patrimonio.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gestao_patrimonio.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to profiles" ON gestao_patrimonio.profiles;
DROP POLICY IF EXISTS "Allow full access to user_roles" ON gestao_patrimonio.user_roles;

CREATE POLICY "Allow full access to profiles"
  ON gestao_patrimonio.profiles FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow full access to user_roles"
  ON gestao_patrimonio.user_roles FOR ALL
  USING (true)
  WITH CHECK (true);

DROP TRIGGER IF EXISTS update_profiles_updated_at ON gestao_patrimonio.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON gestao_patrimonio.profiles
  FOR EACH ROW EXECUTE FUNCTION gestao_patrimonio.update_updated_at_column();

CREATE OR REPLACE FUNCTION gestao_patrimonio.has_role(_user_id UUID, _role gestao_patrimonio.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = gestao_patrimonio, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM gestao_patrimonio.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION gestao_patrimonio.get_user_department(_user_id UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = gestao_patrimonio, public
AS $$
  SELECT department
  FROM gestao_patrimonio.profiles
  WHERE user_id = _user_id;
$$;
