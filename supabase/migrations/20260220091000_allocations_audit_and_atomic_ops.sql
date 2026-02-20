ALTER TABLE gestao_patrimonio.allocations
  ADD COLUMN IF NOT EXISTS performed_by UUID,
  ADD COLUMN IF NOT EXISTS performed_by_name TEXT,
  ADD COLUMN IF NOT EXISTS returned_by UUID,
  ADD COLUMN IF NOT EXISTS returned_by_name TEXT,
  ADD COLUMN IF NOT EXISTS movement_type TEXT;

ALTER TABLE gestao_patrimonio.allocations DROP CONSTRAINT IF EXISTS allocations_employee_id_fkey;
ALTER TABLE gestao_patrimonio.allocations DROP CONSTRAINT IF EXISTS allocations_equipment_id_fkey;

ALTER TABLE gestao_patrimonio.allocations
  ADD CONSTRAINT allocations_employee_id_fkey
  FOREIGN KEY (employee_id) REFERENCES gestao_patrimonio.employees(id) ON DELETE RESTRICT;

ALTER TABLE gestao_patrimonio.allocations
  ADD CONSTRAINT allocations_equipment_id_fkey
  FOREIGN KEY (equipment_id) REFERENCES gestao_patrimonio.equipments(id) ON DELETE RESTRICT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_allocations_active_equipment
  ON gestao_patrimonio.allocations (equipment_id)
  WHERE returned_at IS NULL;

CREATE OR REPLACE FUNCTION gestao_patrimonio.allocate_equipments_atomic(
  _employee_id UUID,
  _equipment_ids UUID[],
  _allocated_at TIMESTAMPTZ DEFAULT now(),
  _notes TEXT DEFAULT NULL,
  _return_deadline TIMESTAMPTZ DEFAULT NULL,
  _performed_by UUID DEFAULT NULL,
  _performed_by_name TEXT DEFAULT NULL,
  _movement_type TEXT DEFAULT 'kit'
)
RETURNS SETOF gestao_patrimonio.allocations
LANGUAGE plpgsql
AS $$
DECLARE
  _missing_count INTEGER;
  _unavailable_count INTEGER;
BEGIN
  IF _employee_id IS NULL THEN
    RAISE EXCEPTION 'employee_id e obrigatorio';
  END IF;

  IF _equipment_ids IS NULL OR array_length(_equipment_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Ao menos um equipamento deve ser informado';
  END IF;

  SELECT COUNT(*)
  INTO _missing_count
  FROM unnest(_equipment_ids) AS req_id
  LEFT JOIN gestao_patrimonio.equipments e ON e.id = req_id
  WHERE e.id IS NULL;

  IF _missing_count > 0 THEN
    RAISE EXCEPTION 'Um ou mais equipamentos nao existem';
  END IF;

  SELECT COUNT(*)
  INTO _unavailable_count
  FROM gestao_patrimonio.equipments e
  WHERE e.id = ANY(_equipment_ids)
    AND e.status <> 'available';

  IF _unavailable_count > 0 THEN
    RAISE EXCEPTION 'Um ou mais equipamentos nao estao disponiveis';
  END IF;

  RETURN QUERY
  WITH inserted AS (
    INSERT INTO gestao_patrimonio.allocations (
      employee_id,
      equipment_id,
      allocated_at,
      type,
      notes,
      return_deadline,
      performed_by,
      performed_by_name,
      movement_type
    )
    SELECT
      _employee_id,
      req_id,
      COALESCE(_allocated_at, now()),
      'onboarding',
      _notes,
      _return_deadline,
      _performed_by,
      _performed_by_name,
      COALESCE(NULLIF(_movement_type, ''), 'kit')
    FROM unnest(_equipment_ids) AS req_id
    RETURNING *
  ), updated AS (
    UPDATE gestao_patrimonio.equipments e
    SET status = 'allocated'
    WHERE e.id IN (SELECT equipment_id FROM inserted)
    RETURNING e.id
  )
  SELECT i.* FROM inserted i;
END;
$$;

CREATE OR REPLACE FUNCTION gestao_patrimonio.deallocate_allocations_atomic(
  _allocation_ids UUID[],
  _returned_at TIMESTAMPTZ DEFAULT now(),
  _notes_by_allocation JSONB DEFAULT '{}'::jsonb,
  _destinations_by_allocation JSONB DEFAULT '{}'::jsonb,
  _returned_by UUID DEFAULT NULL,
  _returned_by_name TEXT DEFAULT NULL
)
RETURNS SETOF gestao_patrimonio.allocations
LANGUAGE plpgsql
AS $$
DECLARE
  _active_count INTEGER;
  _requested_count INTEGER;
  _invalid_destination_count INTEGER;
BEGIN
  IF _allocation_ids IS NULL OR array_length(_allocation_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Ao menos uma alocacao deve ser informada';
  END IF;

  _requested_count := array_length(_allocation_ids, 1);

  SELECT COUNT(*)
  INTO _active_count
  FROM gestao_patrimonio.allocations a
  WHERE a.id = ANY(_allocation_ids)
    AND a.returned_at IS NULL;

  IF _active_count <> _requested_count THEN
    RAISE EXCEPTION 'Uma ou mais alocacoes ja foram devolvidas ou nao existem';
  END IF;

  SELECT COUNT(*)
  INTO _invalid_destination_count
  FROM unnest(_allocation_ids) AS alloc_id
  WHERE COALESCE(_destinations_by_allocation ->> alloc_id::text, 'available') NOT IN ('available', 'maintenance');

  IF _invalid_destination_count > 0 THEN
    RAISE EXCEPTION 'Destino invalido informado para devolucao';
  END IF;

  RETURN QUERY
  WITH updated_allocations AS (
    UPDATE gestao_patrimonio.allocations a
    SET
      returned_at = COALESCE(_returned_at, now()),
      type = 'offboarding',
      notes = COALESCE(_notes_by_allocation ->> a.id::text, a.notes),
      returned_by = _returned_by,
      returned_by_name = _returned_by_name
    WHERE a.id = ANY(_allocation_ids)
      AND a.returned_at IS NULL
    RETURNING *
  ), updated_equipments AS (
    UPDATE gestao_patrimonio.equipments e
    SET status = CASE
      WHEN COALESCE(_destinations_by_allocation ->> ua.id::text, 'available') = 'maintenance' THEN 'maintenance'
      ELSE 'available'
    END
    FROM updated_allocations ua
    WHERE e.id = ua.equipment_id
    RETURNING e.id
  )
  SELECT ua.* FROM updated_allocations ua;
END;
$$;

CREATE OR REPLACE FUNCTION gestao_patrimonio.prevent_allocations_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Exclusao de alocacoes e bloqueada para preservar rastreabilidade.';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_allocations_delete ON gestao_patrimonio.allocations;
CREATE TRIGGER trg_prevent_allocations_delete
  BEFORE DELETE ON gestao_patrimonio.allocations
  FOR EACH ROW
  EXECUTE FUNCTION gestao_patrimonio.prevent_allocations_delete();
