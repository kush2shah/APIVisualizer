import SwaggerParser from '@apidevtools/swagger-parser';
import yaml from 'js-yaml';
import type { OpenAPIDocument, ParsedEndpoint, HTTPMethod } from '@/types';
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

export interface ParseResult {
  success: boolean;
  error?: string;
  spec?: OpenAPIDocument;
  endpoints?: ParsedEndpoint[];
  info?: {
    title: string;
    version: string;
    description?: string;
    servers?: string[];
  };
}

/**
 * Parse OpenAPI spec from YAML or JSON string
 */
export async function parseOpenAPISpec(content: string, format: 'yaml' | 'json'): Promise<ParseResult> {
  try {
    // Parse the content based on format
    let parsedContent: any;
    if (format === 'yaml') {
      parsedContent = yaml.load(content);
    } else {
      parsedContent = JSON.parse(content);
    }

    // Validate and dereference the spec
    const spec = await SwaggerParser.validate(parsedContent as any);

    // Extract endpoints
    const endpoints = extractEndpoints(spec as OpenAPIDocument);

    // Extract basic info
    const info = extractInfo(spec as OpenAPIDocument);

    return {
      success: true,
      spec: spec as OpenAPIDocument,
      endpoints,
      info,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to parse OpenAPI spec',
    };
  }
}

/**
 * Extract all endpoints from an OpenAPI spec
 */
function extractEndpoints(spec: OpenAPIDocument): ParsedEndpoint[] {
  const endpoints: ParsedEndpoint[] = [];

  if (!spec.paths) {
    return endpoints;
  }

  // Iterate through all paths
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    if (!pathItem) continue;

    // HTTP methods to check
    const methods: HTTPMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

    for (const method of methods) {
      const operation = pathItem[method.toLowerCase() as keyof typeof pathItem];

      if (operation && typeof operation === 'object' && 'responses' in operation) {
        const op = operation as OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject;

        endpoints.push({
          method,
          path,
          operationId: op.operationId,
          summary: op.summary,
          description: op.description,
          tags: op.tags,
          parameters: op.parameters as any[],
          requestBody: op.requestBody as any,
          responses: op.responses as any,
          security: op.security,
        });
      }
    }
  }

  return endpoints;
}

/**
 * Extract basic info from OpenAPI spec
 */
function extractInfo(spec: OpenAPIDocument): {
  title: string;
  version: string;
  description?: string;
  servers?: string[];
} {
  const servers = spec.servers?.map(s =>
    typeof s === 'object' && 'url' in s ? s.url : ''
  ).filter(Boolean);

  return {
    title: spec.info?.title || 'Untitled API',
    version: spec.info?.version || '1.0.0',
    description: spec.info?.description,
    servers,
  };
}

/**
 * Detect if content is YAML or JSON
 */
export function detectFormat(content: string): 'yaml' | 'json' {
  const trimmed = content.trim();

  // Check if it starts with { or [, likely JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return 'json';
  }

  // Otherwise assume YAML
  return 'yaml';
}

/**
 * Get example request body from OpenAPI schema
 */
export function getExampleRequestBody(requestBody: any): any {
  if (!requestBody) return null;

  try {
    const content = requestBody.content;
    if (!content) return null;

    // Try to get JSON example
    const jsonContent = content['application/json'];
    if (!jsonContent) return null;

    // Check for explicit example
    if (jsonContent.example) {
      return jsonContent.example;
    }

    // Check for examples (OpenAPI 3.1)
    if (jsonContent.examples) {
      const firstExample = Object.values(jsonContent.examples)[0] as any;
      if (firstExample?.value) {
        return firstExample.value;
      }
    }

    // Try to generate from schema
    if (jsonContent.schema) {
      return generateExampleFromSchema(jsonContent.schema);
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Get example response from OpenAPI schema
 */
export function getExampleResponse(responses: any, statusCode: string = '200'): any {
  if (!responses || !responses[statusCode]) return null;

  try {
    const response = responses[statusCode];
    const content = response.content;
    if (!content) return null;

    // Try to get JSON example
    const jsonContent = content['application/json'];
    if (!jsonContent) return null;

    // Check for explicit example
    if (jsonContent.example) {
      return jsonContent.example;
    }

    // Check for examples (OpenAPI 3.1)
    if (jsonContent.examples) {
      const firstExample = Object.values(jsonContent.examples)[0] as any;
      if (firstExample?.value) {
        return firstExample.value;
      }
    }

    // Try to generate from schema
    if (jsonContent.schema) {
      return generateExampleFromSchema(jsonContent.schema);
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Generate example data from JSON schema
 */
function generateExampleFromSchema(schema: any): any {
  if (!schema) return null;

  // Handle $ref (shouldn't happen after dereferencing, but just in case)
  if (schema.$ref) return null;

  // Use example if provided
  if (schema.example !== undefined) {
    return schema.example;
  }

  switch (schema.type) {
    case 'object':
      const obj: any = {};
      if (schema.properties) {
        for (const [key, prop] of Object.entries(schema.properties)) {
          obj[key] = generateExampleFromSchema(prop);
        }
      }
      return obj;

    case 'array':
      if (schema.items) {
        return [generateExampleFromSchema(schema.items)];
      }
      return [];

    case 'string':
      if (schema.format === 'date-time') return new Date().toISOString();
      if (schema.format === 'date') return new Date().toISOString().split('T')[0];
      if (schema.format === 'email') return 'user@example.com';
      if (schema.format === 'uri') return 'https://example.com';
      if (schema.enum) return schema.enum[0];
      return 'string';

    case 'number':
    case 'integer':
      if (schema.enum) return schema.enum[0];
      return schema.minimum || 0;

    case 'boolean':
      return true;

    default:
      return null;
  }
}

/**
 * Extract path parameters from a path string
 * E.g., "/users/{userId}/posts/{postId}" => ["userId", "postId"]
 */
export function extractPathParams(path: string): string[] {
  const matches = path.match(/\{([^}]+)\}/g);
  if (!matches) return [];
  return matches.map(m => m.slice(1, -1));
}

/**
 * Build full URL from path and base URL
 */
export function buildURL(
  path: string,
  baseUrl: string,
  pathParams?: Record<string, string>,
  queryParams?: Record<string, string>
): string {
  let url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  let finalPath = path;

  // Replace path parameters
  if (pathParams) {
    for (const [key, value] of Object.entries(pathParams)) {
      finalPath = finalPath.replace(`{${key}}`, encodeURIComponent(value));
    }
  }

  url += finalPath;

  // Add query parameters
  if (queryParams && Object.keys(queryParams).length > 0) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, value);
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += '?' + queryString;
    }
  }

  return url;
}
