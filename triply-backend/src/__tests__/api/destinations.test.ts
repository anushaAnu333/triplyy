import request from 'supertest';
import app from '../../app';

describe('Destinations API', () => {
  test('GET /api/v1/destinations returns 200 and has data array', async () => {
    const res = await request(app)
      .get('/api/v1/destinations')
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/v1/destinations?search=dubai returns 200', async () => {
    const res = await request(app)
      .get('/api/v1/destinations')
      .query({ search: 'dubai' })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/v1/destinations/:slug with valid slug returns 200 or 404', async () => {
    const res = await request(app).get('/api/v1/destinations/dubai-luxe-escape');
    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name');
      expect(res.body.data).toHaveProperty('slug');
    }
  });

  test('GET /api/v1/destinations/non-existent-slug-xyz returns 404', async () => {
    const res = await request(app)
      .get('/api/v1/destinations/non-existent-slug-xyz')
      .expect(404);
    expect(res.body.success).toBe(false);
  });
});
