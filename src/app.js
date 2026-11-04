// Aplicación web de lista de tareas con endpoints de salud y métricas.
// Práctica 3 - DevOps CI/CD - ITLA 2026
const express = require('express');
const path = require('path');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  const tareas = [];
  const metricas = { solicitudes: 0, errores: 0, inicio: Date.now() };
  let nextId = 1;

  // Middleware de registro (log) de cada solicitud
  app.use((req, res, next) => {
    metricas.solicitudes++;
    const t0 = Date.now();
    res.on('finish', () => {
      if (res.statusCode >= 500) metricas.errores++;
      if (process.env.NODE_ENV !== 'test') {
        console.log(JSON.stringify({
          nivel: 'info',
          metodo: req.method,
          ruta: req.path,
          estado: res.statusCode,
          ms: Date.now() - t0
        }));
      }
    });
    next();
  });

  // Health check
  app.get('/health', (req, res) => res.json({ estado: 'ok', version: '1.0.0' }));

  // Métricas del servidor
  app.get('/metrics', (req, res) => res.json({
    solicitudes: metricas.solicitudes,
    errores: metricas.errores,
    tareas: tareas.length,
    tareasCompletadas: tareas.filter(t => t.completada).length,
    tareasPendientes: tareas.filter(t => !t.completada).length,
    segundosActivo: Math.round((Date.now() - metricas.inicio) / 1000)
  }));

  // GET todas las tareas (con filtro opcional por ?completada=true|false)
  app.get('/api/tareas', (req, res) => {
    if (req.query.completada !== undefined) {
      const filtro = req.query.completada === 'true';
      return res.json(tareas.filter(t => t.completada === filtro));
    }
    res.json(tareas);
  });

  // GET una tarea por ID
  app.get('/api/tareas/:id', (req, res) => {
    const tarea = tareas.find(t => t.id === Number(req.params.id));
    if (!tarea) return res.status(404).json({ error: 'Tarea no encontrada' });
    res.json(tarea);
  });

  // POST crear tarea
  app.post('/api/tareas', (req, res) => {
    const titulo = (req.body && typeof req.body.titulo === 'string') ? req.body.titulo.trim() : '';
    if (!titulo) return res.status(400).json({ error: 'El título es obligatorio' });
    if (titulo.length > 200) return res.status(400).json({ error: 'El título no puede superar los 200 caracteres' });
    const tarea = { id: nextId++, titulo, completada: false, creadaEn: new Date().toISOString() };
    tareas.push(tarea);
    res.status(201).json(tarea);
  });

  // PATCH alternar estado completada de una tarea
  app.patch('/api/tareas/:id', (req, res) => {
    const tarea = tareas.find(t => t.id === Number(req.params.id));
    if (!tarea) return res.status(404).json({ error: 'Tarea no encontrada' });
    tarea.completada = !tarea.completada;
    tarea.actualizadaEn = new Date().toISOString();
    res.json(tarea);
  });

  // DELETE eliminar una tarea por ID
  app.delete('/api/tareas/:id', (req, res) => {
    const idx = tareas.findIndex(t => t.id === Number(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Tarea no encontrada' });
    const [eliminada] = tareas.splice(idx, 1);
    res.json({ mensaje: 'Tarea eliminada', tarea: eliminada });
  });

  return app;
}

module.exports = { createApp };
