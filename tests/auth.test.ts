import request from 'supertest';
import app from '../src/app';
import { getDb } from '../src/config/database';

const TEST_USER = {
  email: 'test@example.com',
  password: 'password123',
};

describe('Auth Endpoints', () => {
  beforeEach(async () => {
    const db = await getDb();
    await db.exec('DELETE FROM tasks');
    await db.exec('DELETE FROM users');
    await db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users', 'tasks')");
  });

  describe('POST /api/auth/register', () => {
    it('debería registrar un nuevo usuario', async () => {
      const res = await request(app).post('/api/auth/register').send(TEST_USER);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toEqual({
        id: expect.any(Number),
        email: TEST_USER.email,
      });
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('debería rechazar email duplicado con 409', async () => {
      await request(app).post('/api/auth/register').send(TEST_USER);

      const res = await request(app).post('/api/auth/register').send(TEST_USER);

      expect(res.statusCode).toBe(409);
      expect(res.body.message).toBe('El email ya está registrado');
    });

    it('debería rechazar email inválido', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'no-es-email', password: 'password123' });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('debería rechazar contraseña débil', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'weak@example.com', password: '123' });

      expect(res.statusCode).toBe(400);
    });

    it('debería rechazar body vacío', async () => {
      const res = await request(app).post('/api/auth/register').send({});
      expect(res.statusCode).toBe(400);
    });

    it('no debería permitir inyección SQL en email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: "test@example.com'; DROP TABLE users; --",
          password: 'password123',
        });

      expect(res.statusCode).toBe(400);

      const db = await getDb();
      const row = await db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
      );
      expect(row).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(TEST_USER);
    });

    it('debería loguear con credenciales correctas', async () => {
      const res = await request(app).post('/api/auth/login').send(TEST_USER);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');
      expect(res.body.user.email).toBe(TEST_USER.email);
    });

    it('debería rechazar contraseña incorrecta', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_USER.email, password: 'wrongpass' });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Credenciales inválidas');
    });

    it('debería rechazar email no registrado con mensaje genérico', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'noexiste@example.com', password: 'password123' });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Credenciales inválidas');
    });

    it('no debería filtrar si el email existe o no', async () => {
      const resExistente = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_USER.email, password: 'wrongpass' });

      const resInexistente = await request(app)
        .post('/api/auth/login')
        .send({ email: 'noexiste@example.com', password: 'password123' });

      expect(resExistente.statusCode).toBe(resInexistente.statusCode);
      expect(resExistente.body.message).toBe(resInexistente.body.message);
    });
  });
});