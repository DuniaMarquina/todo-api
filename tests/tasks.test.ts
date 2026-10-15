import request from 'supertest';
import app from '../src/app';
import { getDb } from '../src/config/database';

const TEST_USER = {
  email: 'taskuser@example.com',
  password: 'password123',
};

const OTHER_USER = {
  email: 'other@example.com',
  password: 'password123',
};

let authToken: string;
let otherToken: string;
let userId: number;

beforeAll(async () => {
  const db = await getDb();
  await db.exec('DELETE FROM tasks');
  await db.exec('DELETE FROM users');
  await db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users', 'tasks')");

  const res = await request(app).post('/api/auth/register').send(TEST_USER);
  expect(res.statusCode).toBe(201);
  authToken = res.body.token;
  userId = res.body.user.id;
  expect(authToken).toBeDefined();

  const res2 = await request(app).post('/api/auth/register').send(OTHER_USER);
  otherToken = res2.body.token;
});

beforeEach(async () => {
  const db = await getDb();
  await db.exec('DELETE FROM tasks');
});

describe('Task Endpoints', () => {
  describe('POST /api/tasks', () => {
    it('debería crear una tarea con todos los campos', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Mi primera tarea', description: 'Descripción opcional' });

      expect(res.statusCode).toBe(201);
      expect(res.body).toMatchObject({
        id: expect.any(Number),
        userId,
        title: 'Mi primera tarea',
        description: 'Descripción opcional',
        completed: false,
      });
    });

    it('debería crear una tarea sin descripción', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Sin descripción' });

      expect(res.statusCode).toBe(201);
      expect(res.body.description).toBeNull();
    });

    it('debería rechazar título vacío', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: '' });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('debería rechazar título demasiado largo', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'a'.repeat(500) });

      expect(res.statusCode).toBe(400);
    });

    it('debería rechazar sin token', async () => {
      const res = await request(app).post('/api/tasks').send({ title: 'Tarea' });
      expect(res.statusCode).toBe(401);
    });

    it('debería rechazar token inválido', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', 'Bearer token-falso')
        .send({ title: 'Tarea' });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/tasks', () => {
    it('debería devolver array vacío si no hay tareas', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('debería listar solo las tareas del usuario autenticado', async () => {
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Tarea 1' });

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Tarea 2' });

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Tarea de otro' });

      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body.every((t: { userId: number }) => t.userId === userId)).toBe(true);
    });

    it('debería devolver las tareas ordenadas por created_at DESC', async () => {
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Primera' });

      await new Promise((r) => setTimeout(r, 10));

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Segunda' });

      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.body[0].title).toBe('Segunda');
      expect(res.body[1].title).toBe('Primera');
    });

    it('debería rechazar acceso sin token', async () => {
      const res = await request(app).get('/api/tasks');
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Token no proporcionado');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    let taskId: number;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Original', description: 'Desc original' });
      taskId = res.body.id;
    });

    it('debería actualizar el título', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Actualizado' });

      expect(res.statusCode).toBe(200);

      const check = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);
      expect(check.body[0].title).toBe('Actualizado');
    });

    it('debería marcar como completada', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ completed: true });

      expect(res.statusCode).toBe(200);

      const check = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);
      expect(check.body[0].completed).toBe(true);
    });

    it('debería devolver 404 si la tarea no existe', async () => {
      const res = await request(app)
        .put('/api/tasks/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'X' });

      expect(res.statusCode).toBe(404);
    });

    it('no debería permitir actualizar tarea de otro usuario', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Hackeada' });

      expect(res.statusCode).toBe(404);

      const check = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);
      expect(check.body[0].title).toBe('Original');
    });

    it('debería rechazar body vacío', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
    });

    it('debería rechazar id no numérico', async () => {
      const res = await request(app)
        .put('/api/tasks/abc')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'X' });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('debería eliminar tarea propia', async () => {
      const createRes = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Tarea a eliminar' });

      const taskId = createRes.body.id;

      const deleteRes = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteRes.statusCode).toBe(204);

      const check = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);
      expect(check.body).toHaveLength(0);
    });

    it('debería devolver 404 si la tarea no existe', async () => {
      const res = await request(app)
        .delete('/api/tasks/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(404);
    });

    it('no debería permitir eliminar tarea de otro usuario', async () => {
      const createRes = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Protegida' });

      const taskId = createRes.body.id;

      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.statusCode).toBe(404);

      const check = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);
      expect(check.body).toHaveLength(1);
    });
  });
});