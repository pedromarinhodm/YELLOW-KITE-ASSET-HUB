# Backend (Node.js + Express + Supabase)

## 1. Setup

```bash
cd backend
npm install
cp .env.example .env
```

Preencha no `backend/.env`:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (Settings > API no Supabase)

## 2. Rodar

```bash
npm run dev
```

API em `http://localhost:3001`.

## 3. Endpoints

- `GET /api/health`
- `GET /api/employees?includeInactive=true`
- `POST /api/employees`
- `GET /api/equipments?status=available&classification=station`
- `POST /api/equipments`
- `GET /api/allocations?activeOnly=true&employeeId=<uuid>`
- `POST /api/allocations`

## 4. Teste rapido (PowerShell)

```powershell
Invoke-RestMethod -Method Get -Uri http://localhost:3001/api/health
```

## 5. Migracao da Lovable Cloud para Supabase

No `backend/.env`, configure tambem:

- `SOURCE_SUPABASE_URL` (projeto antigo da Lovable Cloud)
- `SOURCE_SUPABASE_ANON_KEY` (ou service role da origem)

Execute:

```bash
npm run migrate:lovable
```

Se quiser limpar o destino antes de importar:

```bash
npm run migrate:lovable -- --truncate
```
