import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: 'Valid email is required' },
        { status: 400 }
      );
    }

    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SHEETS_NEWSLETTER_URL;

    if (!GOOGLE_SCRIPT_URL) {
      // Fallback log if URL is not configured yet
      console.log('Subscriber email received (Google Sheet URL not configured yet):', email);
      return NextResponse.json({ message: 'Subscribed successfully' });
    }

    // Forward request to Google Apps Script Web App
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (response.ok) {
      return NextResponse.json({ message: 'Subscribed successfully' });
    } else {
      console.error('Google Sheet Script Error:', await response.text());
      return NextResponse.json(
        { message: 'Failed to record subscription' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Subscription API Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
