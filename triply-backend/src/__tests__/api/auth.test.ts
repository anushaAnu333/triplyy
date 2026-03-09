import request from 'supertest';
import app from '../../app';

describe('Auth API', () => {
  test('POST /api/v1/auth/login with empty body returns 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({})
      .expect(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/v1/auth/login with invalid email returns 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: 'somepass' })
      .expect(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/v1/auth/login with valid shape but wrong credentials returns 401 or 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'wrong@example.com', password: 'wrongpassword' });
    expect([400, 401]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/v1/auth/register with empty body returns 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({})
      .expect(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/v1/auth/register with short password returns 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'short',
        confirmPassword: 'short',
      })
      .expect(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/v1/auth/forgot-password with invalid email returns 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'not-an-email' })
      .expect(400);
    expect(res.body.success).toBe(false);
  });
});
