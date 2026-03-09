import request from 'supertest';
import app from '../../app';

describe('API Health', () => {
  test('GET /api/v1/health returns 200 and success', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/running/i);
  });

  test('GET / returns welcome message', async () => {
    const res = await request(app)
      .get('/')
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/TRIPLY|welcome/i);
  });
});
