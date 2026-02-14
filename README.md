# Yellow Kite Asset Hub

Projeto organizado em duas camadas:

- `frontend/`: React + Vite
- `backend/`: Node.js + Express + Supabase
- `supabase/`: migrations e edge functions

## Estrutura

```text
.
|-- backend/
|-- frontend/
|-- supabase/
`-- INICIAR.BAT
```

## Como rodar

### Opcao 1: inicializacao automatica (Windows)

Execute `INICIAR.BAT` na raiz.

### Opcao 2: manual

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## URLs padrao

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:3001`

