import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

// Re-export database types
export type {
  OpenAPISpec,
  Collection,
  Endpoint,
  Visualization,
  RequestHistory,
  Environment,
  AuthConfig,
} from '@/lib/db';

// OpenAPI Types
export type OpenAPIDocument = OpenAPIV3.Document | OpenAPIV3_1.Document;
export type OpenAPIOperation = OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject;
export type OpenAPIParameter = OpenAPIV3.ParameterObject | OpenAPIV3_1.ParameterObject;
export type OpenAPIRequestBody = OpenAPIV3.RequestBodyObject | OpenAPIV3_1.RequestBodyObject;
export type OpenAPIResponse = OpenAPIV3.ResponseObject | OpenAPIV3_1.ResponseObject;

// HTTP Methods
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

// Request Configuration
export interface RequestConfig {
  url: string;
  method: HTTPMethod;
  headers?: Record<string, string>;
  params?: Record<string, string>; // Query parameters
  body?: any;
  auth?: {
    type: 'none' | 'apiKey' | 'bearer' | 'basic';
    config: Record<string, string>;
  };
}

// Response Data
export interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  duration: number;
}

// Visualization State
export interface VisualizationState {
  isGenerating: boolean;
  error?: string;
  componentCode?: string;
  lastGenerated?: Date;
}

// Tab Types
export type ResponseTab = 'visualization' | 'data' | 'headers';

// UI State
export interface UIState {
  activeTab: ResponseTab;
  sidebarCollapsed: boolean;
  selectedEndpointId?: number;
  selectedCollectionId?: number;
}

// Environment Variable Substitution
export interface VariableContext {
  [key: string]: string;
}

// Parse Result
export interface ParseResult {
  success: boolean;
  error?: string;
  spec?: OpenAPIDocument;
  endpoints?: ParsedEndpoint[];
}

export interface ParsedEndpoint {
  method: HTTPMethod;
  path: string;
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: OpenAPIParameter[];
  requestBody?: OpenAPIRequestBody;
  responses?: Record<string, OpenAPIResponse>;
  security?: any[];
}
