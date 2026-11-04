# 🚀 Práctica 3 — Pipeline CI/CD con GitHub Actions

**Electiva 1: Introducción a DevOps · ITLA 2026**

[![CI/CD Pipeline](https://github.com/TU_USUARIO/practica3-cicd-itla/actions/workflows/ci.yml/badge.svg)](https://github.com/TU_USUARIO/practica3-cicd-itla/actions/workflows/ci.yml)

---

## 📋 Descripción

Aplicación web de lista de tareas construida con **Node.js / Express** que implementa un pipeline **CI/CD** completo usando **GitHub Actions**. El pipeline automatiza la validación, pruebas con cobertura, build de Docker y despliegue en **GitHub Pages** — todo gratuito, sin necesidad de Azure ni servicios de pago.

| Componente | Archivo(s) | Función |
|---|---|---|
| API REST | `src/app.js`, `src/server.js` | CRUD de tareas + `/health` y `/metrics` |
| Frontend | `public/index.html` | UI desplegada en GitHub Pages |
| Pruebas | `tests/app.test.js` | 17 pruebas con Jest + Supertest |
| Contenedor | `Dockerfile` | Imagen Alpine con healthcheck |
| Pipeline | `.github/workflows/ci.yml` | Lint → Pruebas → Docker → Deploy |

---

## 🏗️ Estructura del proyecto

```
practica3-cicd-itla/
├── .github/
│   └── workflows/
│       └── ci.yml          # Workflow de GitHub Actions
├── public/
│   └── index.html          # Frontend estático (GitHub Pages)
├── src/
│   ├── app.js              # Lógica de la aplicación (Express)
│   └── server.js           # Punto de entrada del servidor
├── tests/
│   └── app.test.js         # Suite de pruebas (Jest + Supertest)
├── .dockerignore
├── .gitignore
├── Dockerfile
├── package.json
└── README.md
```

---

## ⚙️ Requisitos

- **Node.js 20+** — [descargar aquí](https://nodejs.org/)
- **Git** — [descargar aquí](https://git-scm.com/)
- **Cuenta de GitHub** (gratuita) con repositorio **público**
- **Docker Desktop** _(opcional, solo para probar el contenedor localmente)_

---

## 🚀 Ejecutar localmente

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/practica3-cicd-itla.git
cd practica3-cicd-itla

# 2. Instalar dependencias
npm install

# 3. Ejecutar pruebas con cobertura
npm test

# 4. Iniciar el servidor
npm start
# → http://localhost:3000
```

### Endpoints disponibles

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Estado del servidor |
| `GET` | `/metrics` | Métricas de uso |
| `GET` | `/api/tareas` | Listar todas las tareas |
| `GET` | `/api/tareas?completada=true\|false` | Filtrar por estado |
| `GET` | `/api/tareas/:id` | Obtener tarea por ID |
| `POST` | `/api/tareas` | Crear nueva tarea `{ "titulo": "..." }` |
| `PATCH` | `/api/tareas/:id` | Alternar estado completada |
| `DELETE` | `/api/tareas/:id` | Eliminar tarea |

### Probar con Docker

```bash
# Construir la imagen
docker build -t practica3-cicd .

# Ejecutar el contenedor
docker run -p 3000:3000 practica3-cicd

# Verificar health
curl http://localhost:3000/health
```

---

## 🔄 Pipeline CI/CD — Explicación de cada etapa

El pipeline se define en [`.github/workflows/ci.yml`](.github/workflows/ci.yml) y se activa automáticamente en cada `push` y `pull_request` a la rama `main`.

```
Push / PR a main
      │
      ▼
┌─────────────────────┐
│  Etapa 1: build-test│
│  ─────────────────  │
│  1. Checkout código  │
│  2. Setup Node 20    │
│  3. npm ci           │
│  4. Lint (--check)   │
│  5. Jest + cobertura │
│  6. Build Docker img │
│  7. Health check     │
└──────────┬──────────┘
           │  (solo push a main)
           ▼
┌─────────────────────┐
│  Etapa 2: deploy    │
│  ─────────────────  │
│  1. Configure Pages  │
│  2. Upload artifact  │
│  3. Deploy Pages     │
└─────────────────────┘
           │
           ▼
     🌐 GitHub Pages
```

### Descripción detallada de cada paso

**Etapa 1 — `build-test` (Build y Pruebas)**

| Paso | Qué hace | Por qué importa |
|---|---|---|
| `actions/checkout@v4` | Descarga el código del repositorio | Necesario para acceder a los archivos |
| `actions/setup-node@v4` | Instala Node.js 20 con caché de npm | Garantiza el entorno correcto y acelera builds |
| `npm ci` | Instala dependencias de forma limpia desde `package-lock.json` | Reproducibilidad: siempre la misma versión |
| `npm run lint` | Verifica la sintaxis de los archivos JS | Detecta errores de sintaxis antes de ejecutar |
| `npm run test:ci` | Ejecuta las 17 pruebas y genera reporte de cobertura | Valida que el código funciona correctamente |
| `upload-artifact` | Guarda el reporte de cobertura HTML por 7 días | Permite revisar qué líneas fueron probadas |
| `docker build` | Construye la imagen de producción | Verifica que la imagen se construye sin errores |
| Health check Docker | Levanta el contenedor y llama a `/health` | Confirma que la imagen funciona en producción |

**Etapa 2 — `deploy` (Despliegue a GitHub Pages)**

> Solo se ejecuta cuando hay un `push` exitoso a `main` (no en PRs).

| Paso | Qué hace |
|---|---|
| `configure-pages@v5` | Habilita y configura el entorno de GitHub Pages |
| `upload-pages-artifact@v3` | Empaqueta la carpeta `public/` como artefacto de Pages |
| `deploy-pages@v4` | Publica el artefacto en la URL de GitHub Pages |

---

## 📊 Cobertura de código

El pipeline falla si la cobertura cae por debajo de los umbrales configurados en `package.json`:

| Métrica | Umbral mínimo |
|---|---|
| Líneas | 80% |
| Funciones | 80% |
| Branches | 70% |
| Statements | 80% |

Para ver el reporte de cobertura localmente después de ejecutar `npm test`, abre `coverage/lcov-report/index.html`.

---

## 🧪 Suite de pruebas

El archivo [`tests/app.test.js`](tests/app.test.js) contiene **17 pruebas** organizadas en categorías:

**Pruebas base (plantilla):**
- `GET /health` responde ok
- `POST /api/tareas` crea una tarea
- `POST /api/tareas` sin título devuelve 400
- `PATCH /api/tareas/:id` alterna completada
- `PATCH` de tarea inexistente devuelve 404
- `GET /metrics` cuenta solicitudes y tareas

**Pruebas nuevas (Práctica 3):**
- `DELETE /api/tareas/:id` elimina correctamente
- `DELETE` con ID inexistente devuelve 404
- `POST` rechaza título vacío con espacios
- `POST` rechaza título mayor a 200 caracteres
- `POST` acepta título de exactamente 200 caracteres
- `GET /api/tareas/:id` retorna tarea específica
- `GET /api/tareas/:id` con ID inexistente devuelve 404
- `GET /api/tareas?completada=true` filtra tareas completadas
- `GET /api/tareas?completada=false` filtra tareas pendientes
- `PATCH` doble alterna completada de vuelta a false
- `GET /metrics` incluye conteo de completadas y pendientes
- `POST` con body vacío devuelve 400
- IDs son únicos aunque se eliminen tareas

---

## 🐛 Demostración de pipeline en rojo y verde

La práctica incluye demostrar una prueba fallida y su corrección:

**Para poner el pipeline en rojo** (prueba deliberadamente fallida):
```js
// En tests/app.test.js — añadir temporalmente:
test('PRUEBA FALLIDA INTENCIONAL', async () => {
  expect(1).toBe(2); // Esto siempre falla
});
```

**Para volver al verde:** eliminar la prueba fallida y hacer `git push`.

---

## 📤 Subir a GitHub y activar el pipeline

```bash
# 1. Crear repositorio PÚBLICO en GitHub (sin README)

# 2. En la carpeta del proyecto:
git init
git add .
git commit -m "feat: Práctica 3 - Pipeline CI/CD completo"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/practica3-cicd-itla.git
git push -u origin main

# 3. En GitHub: Settings → Pages → Source: GitHub Actions

# 4. Pestaña Actions: ver el workflow CI/CD ejecutándose
```

---

## 🤝 Guía de contribución

1. Crea una rama desde `main`:
   ```bash
   git checkout -b feature/nombre-de-tu-feature
   ```
2. Realiza tus cambios y asegúrate de que las pruebas pasan:
   ```bash
   npm test
   ```
3. Haz commit con un mensaje descriptivo:
   ```bash
   git commit -m "feat: descripción del cambio"
   ```
4. Abre un Pull Request a `main` — el pipeline se ejecutará automáticamente.
5. Solo cuando el pipeline esté **verde** ✅ se puede hacer merge.

### Convención de commits

| Prefijo | Uso |
|---|---|
| `feat:` | Nueva funcionalidad |
| `fix:` | Corrección de bug |
| `test:` | Agregar o modificar pruebas |
| `docs:` | Cambios en documentación |
| `ci:` | Cambios en el pipeline |
| `refactor:` | Refactorización sin cambio funcional |

---

## 📦 Instrucciones de despliegue

### GitHub Pages (automático via pipeline)
El despliegue ocurre automáticamente al hacer `push` a `main` si el pipeline pasa. La URL será:
```
https://TU_USUARIO.github.io/practica3-cicd-itla/
```

### Despliegue manual con Docker
```bash
# Construir
docker build -t practica3-cicd:latest .

# Ejecutar en producción
docker run -d \
  --name practica3 \
  -p 3000:3000 \
  --restart unless-stopped \
  practica3-cicd:latest

# Ver logs
docker logs -f practica3

# Detener
docker stop practica3 && docker rm practica3
```

---

## 📝 Informe de implementación

### Decisiones técnicas

| Decisión | Alternativa considerada | Por qué se eligió |
|---|---|---|
| GitHub Actions | Jenkins, GitLab CI | Gratuito para repos públicos, integrado con GitHub |
| Jest + Supertest | Mocha + Chai | Configuración mínima, cobertura integrada |
| Node 20 Alpine | Node 18, Debian | Imagen más pequeña (~50MB vs ~200MB), LTS actual |
| GitHub Pages | Netlify, Vercel | Gratuito, integrado con GitHub, sin cuenta adicional |

### Lecciones aprendidas

- **`npm ci` vs `npm install`**: `npm ci` es más rápido y reproducible en CI porque usa exactamente `package-lock.json`.
- **Caché de dependencias**: usar `cache: npm` en `actions/setup-node` reduce el tiempo de build ~40%.
- **Separar entornos**: `NODE_ENV: test` desactiva los logs en las pruebas, haciéndolas más limpias.
- **Concurrency**: la clave `concurrency` evita múltiples despliegues simultáneos que podrían colisionar.
- **Healthcheck en Docker**: permite que orquestadores como Kubernetes detecten si el contenedor está listo.

### Métricas del pipeline

| Métrica | Valor aproximado |
|---|---|
| Tiempo total del pipeline | ~2-3 minutos |
| Tiempo de `npm ci` (con caché) | ~15 segundos |
| Tiempo de pruebas | ~5 segundos |
| Tiempo de build Docker | ~30 segundos |
| Cobertura de código | >90% |

---

## 👨‍💻 Autor

**[Tu Nombre]** · ITLA 2026 · Electiva 1: Introducción a DevOps

---

*Práctica 3 completada: Pipeline CI/CD básico con GitHub Actions*
