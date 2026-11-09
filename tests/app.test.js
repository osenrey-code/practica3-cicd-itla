const request = require('supertest');
const { createApp } = require('../src/app');

describe('API de tareas', () => {
  let app;
  beforeEach(() => { app = createApp(); });

  // ─── Pruebas base (plantilla) ───────────────────────────────────────────────

  test('GET /health responde ok', async () => {
    const r = await request(app).get('/health');
    expect(r.status).toBe(200);
    expect(r.body.estado).toBe('ok');
  });

  test('POST /api/tareas crea una tarea', async () => {
    const r = await request(app).post('/api/tareas').send({ titulo: 'Configurar pipeline' });
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ id: 1, titulo: 'Configurar pipeline', completada: false });
    expect(r.body.creadaEn).toBeDefined();
  });

  test('POST /api/tareas sin título devuelve 400', async () => {
    const r = await request(app).post('/api/tareas').send({});
    expect(r.status).toBe(400);
  });

  test('PATCH /api/tareas/:id alterna completada', async () => {
    await request(app).post('/api/tareas').send({ titulo: 'Escribir pruebas' });
    const r = await request(app).patch('/api/tareas/1');
    expect(r.body.completada).toBe(true);
    expect(r.body.actualizadaEn).toBeDefined();
  });

  test('PATCH de una tarea inexistente devuelve 404', async () => {
    const r = await request(app).patch('/api/tareas/99');
    expect(r.status).toBe(404);
  });

  test('GET /metrics cuenta solicitudes y tareas', async () => {
    await request(app).post('/api/tareas').send({ titulo: 'Medir' });
    const r = await request(app).get('/metrics');
    expect(r.body.tareas).toBe(1);
    expect(r.body.solicitudes).toBeGreaterThanOrEqual(2);
  });

  // ─── Pruebas nuevas (Práctica 3) ────────────────────────────────────────────

  test('DELETE /api/tareas/:id elimina la tarea correctamente', async () => {
    await request(app).post('/api/tareas').send({ titulo: 'Tarea a eliminar' });
    const r = await request(app).delete('/api/tareas/1');
    expect(r.status).toBe(200);
    expect(r.body.mensaje).toBe('Tarea eliminada');
    expect(r.body.tarea.id).toBe(1);
    // Verificar que ya no existe
    const check = await request(app).get('/api/tareas/1');
    expect(check.status).toBe(404);
  });

  test('DELETE /api/tareas/:id con ID inexistente devuelve 404', async () => {
    const r = await request(app).delete('/api/tareas/999');
    expect(r.status).toBe(404);
    expect(r.body.error).toBe('Tarea no encontrada');
  });

  test('POST /api/tareas rechaza título vacío con espacios', async () => {
    const r = await request(app).post('/api/tareas').send({ titulo: '   ' });
    expect(r.status).toBe(400);
    expect(r.body.error).toBeDefined();
  });

  test('POST /api/tareas rechaza título mayor a 200 caracteres', async () => {
    const tituloLargo = 'A'.repeat(201);
    const r = await request(app).post('/api/tareas').send({ titulo: tituloLargo });
    expect(r.status).toBe(400);
    expect(r.body.error).toMatch(/200/);
  });

  test('POST /api/tareas acepta título de exactamente 200 caracteres', async () => {
    const tituloExacto = 'B'.repeat(200);
    const r = await request(app).post('/api/tareas').send({ titulo: tituloExacto });
    expect(r.status).toBe(201);
    expect(r.body.titulo).toHaveLength(200);
  });

  test('GET /api/tareas/:id retorna una tarea específica', async () => {
    await request(app).post('/api/tareas').send({ titulo: 'Tarea específica' });
    const r = await request(app).get('/api/tareas/1');
    expect(r.status).toBe(200);
    expect(r.body.titulo).toBe('Tarea específica');
  });

  test('GET /api/tareas/:id con ID inexistente devuelve 404', async () => {
    const r = await request(app).get('/api/tareas/999');
    expect(r.status).toBe(404);
  });

  test('GET /api/tareas?completada=true filtra solo tareas completadas', async () => {
    await request(app).post('/api/tareas').send({ titulo: 'Tarea 1' });
    await request(app).post('/api/tareas').send({ titulo: 'Tarea 2' });
    await request(app).patch('/api/tareas/1'); // completar tarea 1
    const r = await request(app).get('/api/tareas?completada=true');
    expect(r.status).toBe(200);
    expect(r.body).toHaveLength(1);
    expect(r.body[0].completada).toBe(true);
  });

  test('GET /api/tareas?completada=false filtra solo tareas pendientes', async () => {
    await request(app).post('/api/tareas').send({ titulo: 'Tarea A' });
    await request(app).post('/api/tareas').send({ titulo: 'Tarea B' });
    await request(app).patch('/api/tareas/1'); // completar tarea A
    const r = await request(app).get('/api/tareas?completada=false');
    expect(r.status).toBe(200);
    expect(r.body).toHaveLength(1);
    expect(r.body[0].completada).toBe(false);
  });

  test('PATCH doble alterna completada de vuelta a false', async () => {
    await request(app).post('/api/tareas').send({ titulo: 'Alternar dos veces' });
    await request(app).patch('/api/tareas/1');
    const r = await request(app).patch('/api/tareas/1');
    expect(r.body.completada).toBe(false);
  });

  test('GET /metrics incluye conteo de tareas completadas y pendientes', async () => {
    await request(app).post('/api/tareas').send({ titulo: 'T1' });
    await request(app).post('/api/tareas').send({ titulo: 'T2' });
    await request(app).patch('/api/tareas/1');
    const r = await request(app).get('/metrics');
    expect(r.body.tareasCompletadas).toBe(1);
    expect(r.body.tareasPendientes).toBe(1);
  });

  test('POST /api/tareas con body vacío devuelve 400', async () => {
    const r = await request(app).post('/api/tareas').send('').set('Content-Type', 'application/json');
    expect(r.status).toBe(400);
  });

  test('IDs son únicos aunque se eliminen tareas', async () => {
    await request(app).post('/api/tareas').send({ titulo: 'Primera' });
    await request(app).post('/api/tareas').send({ titulo: 'Segunda' });
    await request(app).delete('/api/tareas/1');
    const r = await request(app).post('/api/tareas').send({ titulo: 'Tercera' });
    expect(r.body.id).toBe(3); // ID debe seguir siendo 3, no reutilizar 1
  });
});
