# Deploy DRAGON_WEB en Vercel (Frontend + Backend Serverless)

Monorepo: `FRONTEND` (Vite + React) y `BACKEND` (Express + MongoDB nativo).
En producción ambos corren en el mismo proyecto Vercel: el frontend como static-build y el backend como serverless function.

## 1. MongoDB Atlas

1. Crear cluster en [MongoDB Atlas](https://cloud.mongodb.com) (M0 gratuito alcanza para desarrollo).
2. **Database Access**: crear usuario con `Read and write to any database`, copiar usuario/contraseña.
3. **Network Access**: `Add IP Address` → `Allow Access From Anywhere` → `0.0.0.0/0` (requerido para serverless; Vercel no tiene IP fija).
4. **Connect** → `Drivers` → copiar `URL_MONGO_DB`, ej:
   ```
   mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. La base por defecto es `Perfume_web` (configurable con `DB_NAME`).

## 2. Vercel — Importar Proyecto

### Opción A: Monorepo completo (recomendada, un solo proyecto)

1. Subir el repo a GitHub/GitLab/Bitbucket.
2. Vercel → **Add New → Project** → Import del repo.
3. **Framework Preset**: Vite (detecta `FRONTEND`). Si pregunta `Root Directory`, dejar en `.` (raíz) — `vercel.json` en la raíz ya configura ambos builds:
   ```json
   {
     "builds": [
       { "src": "FRONTEND/package.json", "use": "@vercel/static-build", "config": { "distDir": "dist" } },
       { "src": "BACKEND/serve.js", "use": "@vercel/node" }
     ],
     "rewrites": [
       { "source": "/api/(.*)", "destination": "BACKEND/serve.js" },
       { "source": "/(.*)", "destination": "FRONTEND/dist/$1" }
     ]
   }
   ```
   También existen `api/index.js` y `api/solicitudes.js` como entry points alternativos si Vercel prioriza `api/`.
4. **Environment Variables** (Project → Settings → Environment Variables):
   | Variable | Valor | Env |
   |---|---|---|
   | `URL_MONGO_DB` | `mongodb+srv://...` de Atlas | Production, Preview, Development |
   | `DB_NAME` | `Perfume_web` (opcional) | Production, Preview, Development |
   | `VITE_API_URL` | *(vacío)* — dejar sin valor para que frontend use mismo origen `/api` | Production, Preview |
   | `VITE_API_URL` | `http://localhost:4000` solo para `vercel dev` local | Development |
5. **Deploy** → esperar build.

### Opción B: Backend standalone (fallback)

Si el monorepo no es detectado, desplegar solo `BACKEND`:
- Root Directory: `BACKEND`
- `BACKEND/vercel.json` ya incluye:
  ```json
  { "version": 2, "builds": [{ "src": "serve.js", "use": "@vercel/node" }], "routes": [{ "src": "/(.*)", "dest": "serve.js" }] }
  ```
- Agregar mismas env vars `URL_MONGO_DB`, `DB_NAME`.
- Frontend desplegar aparte (otro proyecto Vercel con Root `FRONTEND` y `VITE_API_URL=https://<backend>.vercel.app`).

## 3. Desarrollo local (sin cambios)

```bash
# Terminal 1 — backend
cd BACKEND
npm install
# crear BACKEND/.env con URL_MONGO_DB y DB_NAME
node serve.js
# → Servidor escuchando en el puerto 4000

# Terminal 2 — frontend
cd FRONTEND
npm install
# opcional: copiar .env.example a .env
npm run dev
# → http://localhost:5173 (VITE_API_URL=http://localhost:4000)
```

`BACKEND/Config/db.js` usa cache `global._mongoClient` / `global._mongoDb` para reusar conexión en serverless sin romper local. `BACKEND/serve.js` solo hace `app.listen` cuando `require.main === module`, y además exporta `app` para Vercel.

`FRONTEND/src/utils/api.js` usa:
```js
export const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:4000');
```
En `PROD` con `VITE_API_URL` vacío → `API_BASE=''`, entonces `fetch('/api/solicitudes')` va al mismo origen (serverless).

## 4. Probar

```bash
# Health
curl https://tu-proyecto.vercel.app/
# → {"ok":true,"service":"luciano_web"}

# POST
curl -X POST https://tu-proyecto.vercel.app/api/solicitudes \
  -H "Content-Type: application/json" \
  -d '{"tipo":"pase","pais":"Argentina","metodoPago":"Mercado Pago Argentina","numero_wasap":"+541112345678","nota_adicional":"test"}'

# GET con filtros
curl "https://tu-proyecto.vercel.app/api/solicitudes?pais=Argentina&tipo=pase"
curl https://tu-proyecto.vercel.app/api/solicitudes/<id>
```

## 5. Notas Vercel serverless

- **Cold start**: la primera request tras inactividad tarda ~1–3s (carga función + conexión Mongo). Siguientes requests reutilizan `global._mongoClient` y son rápidas. Índices se crean en `Conexion_Mongodb()` solo la primera vez.
- **Concurrencia**: cada instancia serverless mantiene su propio `global` cache; picos concurrentes pueden abrir varias conexiones. Atlas M0 permite ~500 conexiones; no hay riesgo en este proyecto.
- **CORS**: `cors({ origin: true, credentials: true })` permite cualquier origen (necesario porque frontend y backend comparten dominio en Vercel). Si se separa en dos proyectos, restringir a `origin: 'https://<frontend>.vercel.app'`.
- **Logs**: Vercel → Project → Logs → Runtime Logs para ver `CONEXION CON MONGODB EXITOSA` o errores.
- **Env vars**: cambiar `URL_MONGO_DB` requiere **Redeploy** (no basta con guardar).
- **Vercel CLI local**: `npm i -g vercel && vercel dev` simula rewrites y functions localmente (leerá `vercel.json`).
