import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, method, headers, body: requestBody } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid URL' },
        { status: 400 }
      );
    }

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method: method || 'GET',
      headers: {
        ...headers,
        // Remove headers that shouldn't be forwarded
      },
    };

    // Remove problematic headers
    const forbiddenHeaders = ['host', 'connection', 'content-length'];
    if (fetchOptions.headers) {
      for (const header of forbiddenHeaders) {
        delete (fetchOptions.headers as Record<string, string>)[header];
      }
    }

    // Add body for methods that support it
    if (requestBody && method !== 'GET' && method !== 'HEAD') {
      fetchOptions.body = typeof requestBody === 'string'
        ? requestBody
        : JSON.stringify(requestBody);
    }

    // Make the actual request
    const startTime = Date.now();
    const response = await fetch(url, fetchOptions);
    const duration = Date.now() - startTime;

    // Get response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Get response body
    const contentType = response.headers.get('content-type') || '';
    let responseBody: any;

    if (contentType.includes('application/json')) {
      try {
        responseBody = await response.json();
      } catch (error) {
        responseBody = await response.text();
      }
    } else {
      responseBody = await response.text();
    }

    // Return the proxied response
    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      duration,
    });

  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to proxy request',
        details: error.stack,
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
