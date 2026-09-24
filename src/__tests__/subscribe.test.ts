import { POST } from '@/app/api/subscribe/route';

describe('Newsletter Subscribe API Route', () => {
  it('should return 400 when invalid email is provided', async () => {
    const req = new Request('http://localhost/api/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid-email' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toBe('Valid email is required');
  });

  it('should process valid email format', async () => {
    const req = new Request('http://localhost/api/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
