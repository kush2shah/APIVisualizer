import type { RequestConfig, ResponseData } from '@/types';

/**
 * Make an API request through our CORS proxy
 */
export async function makeRequest(config: RequestConfig): Promise<ResponseData> {
  try {
    const response = await fetch('/api/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: config.url,
        method: config.method,
        headers: buildHeaders(config),
        body: config.body,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to make request');
  }
}

/**
 * Generate visualization using Claude AI
 */
export async function generateVisualization(
  endpoint: any,
  responseData: any
): Promise<{ componentCode: string; prompt: string; model: string }> {
  try {
    const response = await fetch('/api/generate-viz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint,
        responseData,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate visualization');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to generate visualization');
  }
}

/**
 * Build headers from request config including auth
 */
function buildHeaders(config: RequestConfig): Record<string, string> {
  const headers: Record<string, string> = {
    ...config.headers,
  };

  // Add authentication headers
  if (config.auth) {
    switch (config.auth.type) {
      case 'bearer':
        if (config.auth.config.token) {
          headers['Authorization'] = `Bearer ${config.auth.config.token}`;
        }
        break;

      case 'apiKey':
        if (config.auth.config.key && config.auth.config.value) {
          if (config.auth.config.addTo === 'header') {
            headers[config.auth.config.key] = config.auth.config.value;
          }
          // Query params are handled separately in buildURL
        }
        break;

      case 'basic':
        if (config.auth.config.username && config.auth.config.password) {
          const credentials = btoa(
            `${config.auth.config.username}:${config.auth.config.password}`
          );
          headers['Authorization'] = `Basic ${credentials}`;
        }
        break;
    }
  }

  return headers;
}
