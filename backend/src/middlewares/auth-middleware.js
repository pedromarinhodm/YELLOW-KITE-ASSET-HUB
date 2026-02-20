import { supabaseAdmin } from "../config/supabase.js";

function normalizeDepartment(value) {
  if (!value) return "";
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function forbidden(message = "Acesso negado") {
  const err = new Error(message);
  err.status = 403;
  return err;
}

function unauthorized(message = "Nao autenticado") {
  const err = new Error(message);
  err.status = 401;
  return err;
}

function notFound(message = "Registro nao encontrado") {
  const err = new Error(message);
  err.status = 404;
  return err;
}

export async function requireAuth(req, _res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw unauthorized("Token JWT ausente ou invalido");
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user) {
      throw unauthorized("Falha ao validar token JWT");
    }

    const userId = authData.user.id;
    const [roleRes, profileRes] = await Promise.all([
      supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).limit(1).maybeSingle(),
      supabaseAdmin.from("profiles").select("name, department").eq("user_id", userId).maybeSingle(),
    ]);

    if (roleRes.error) throw roleRes.error;
    if (profileRes.error) throw profileRes.error;
    if (!roleRes.data?.role) throw forbidden("Usuario sem papel de acesso configurado");

    req.auth = {
      userId,
      email: authData.user.email || null,
      role: roleRes.data.role,
      name: profileRes.data?.name || authData.user.email || null,
      department: profileRes.data?.department || null,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.auth) return next(unauthorized());
    if (!roles.includes(req.auth.role)) return next(forbidden("Perfil sem permissao para esta operacao"));
    next();
  };
}

export function isAdmin(auth) {
  return auth?.role === "admin";
}

export function isCoordinator(auth) {
  return auth?.role === "coordinator";
}

export async function ensureEmployeeDepartmentAccess(auth, employeeId) {
  if (isAdmin(auth)) return;
  if (!employeeId) throw forbidden("employee_id obrigatorio");

  const { data, error } = await supabaseAdmin.from("employees").select("id, department").eq("id", employeeId).maybeSingle();
  if (error) throw error;
  if (!data) throw notFound("Colaborador nao encontrado");

  if (!auth.department || normalizeDepartment(data.department) !== normalizeDepartment(auth.department)) {
    throw forbidden("Coordenador so pode acessar colaboradores do proprio departamento");
  }
}

export async function ensureAllocationDepartmentAccess(auth, allocationId) {
  if (isAdmin(auth)) return;
  if (!allocationId) throw forbidden("allocation_id obrigatorio");

  const { data, error } = await supabaseAdmin
    .from("allocations")
    .select("id, employee_id, employees(department)")
    .eq("id", allocationId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw notFound("Alocacao nao encontrada");

  const allocationDepartment = data.employees?.department || null;
  if (!auth.department || normalizeDepartment(allocationDepartment) !== normalizeDepartment(auth.department)) {
    throw forbidden("Coordenador so pode acessar alocacoes do proprio departamento");
  }
}

export async function ensureAllocationsDepartmentAccess(auth, allocationIds) {
  if (isAdmin(auth)) return;
  if (!Array.isArray(allocationIds) || allocationIds.length === 0) {
    throw forbidden("allocation_ids obrigatorio");
  }

  const { data, error } = await supabaseAdmin
    .from("allocations")
    .select("id, employees(department)")
    .in("id", allocationIds);

  if (error) throw error;
  const rows = data || [];
  if (rows.length !== allocationIds.length) throw notFound("Uma ou mais alocacoes nao encontradas");

  const invalid = rows.some(
    (row) => !auth.department || normalizeDepartment(row.employees?.department) !== normalizeDepartment(auth.department)
  );
  if (invalid) {
    throw forbidden("Coordenador so pode acessar alocacoes do proprio departamento");
  }
}
