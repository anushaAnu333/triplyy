import request from 'supertest';
import app from '../../app';

describe('Affiliates API', () => {
  test('GET /api/v1/affiliates/validate/:code with invalid code returns 404', async () => {
    const res = await request(app)
      .get('/api/v1/affiliates/validate/INVALIDCODE123')
      .expect(404);
    expect(res.body.success).toBe(false);
  });
});
