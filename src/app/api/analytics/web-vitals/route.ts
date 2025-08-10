import { NextRequest, NextResponse } from 'next/server';

interface WebVitalMetric {
  metric: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  url: string;
  timestamp: number;
}

export async function POST(request: NextRequest) {
  try {
    const data: WebVitalMetric = await request.json();
    
    // Validate the incoming data
    if (!data.metric || typeof data.value !== 'number' || !data.id) {
      return NextResponse.json(
        { error: 'Invalid metric data' },
        { status: 400 }
      );
    }

    // In production, you would typically:
    // 1. Store in a database (MongoDB, PostgreSQL, etc.)
    // 2. Send to analytics service (Google Analytics, Mixpanel, etc.)
    // 3. Send to monitoring service (DataDog, New Relic, etc.)
    
    // For now, we'll log the metrics
    console.log('Web Vital Metric Received:', {
      metric: data.metric,
      value: data.value,
      rating: data.rating,
      url: data.url,
      timestamp: new Date(data.timestamp).toISOString()
    });

    // Example: Store in database (uncomment when you have a database setup)
    /*
    await db.webVitals.create({
      data: {
        metric: data.metric,
        value: data.value,
        rating: data.rating,
        delta: data.delta,
        metricId: data.id,
        url: data.url,
        timestamp: new Date(data.timestamp),
        userAgent: request.headers.get('user-agent') || '',
        ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown'
      }
    });
    */

    // Example: Send to external analytics service
    /*
    if (process.env.ANALYTICS_WEBHOOK_URL) {
      await fetch(process.env.ANALYTICS_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ANALYTICS_API_KEY}`
        },
        body: JSON.stringify({
          ...data,
          userAgent: request.headers.get('user-agent'),
          ip: request.ip || request.headers.get('x-forwarded-for')
        })
      });
    }
    */

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing web vitals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}