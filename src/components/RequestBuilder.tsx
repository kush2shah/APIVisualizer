'use client';

import React, { useState, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { buildURL, getExampleRequestBody, extractPathParams } from '@/lib/openapi-parser';
import { replaceEnvVariables } from '@/lib/utils';
import { makeRequest } from '@/lib/api';
import { useEnvironments } from '@/hooks/useEnvironments';
import { db } from '@/lib/db';
import type { Endpoint, ResponseData } from '@/types';

interface RequestBuilderProps {
  endpoint: Endpoint;
  onResponse: (response: ResponseData) => void;
}

export default function RequestBuilder({ endpoint, onResponse }: RequestBuilderProps) {
  const { activeEnvironment } = useEnvironments();
  const [url, setUrl] = useState('');
  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const [headers, setHeaders] = useState<Record<string, string>>({
    'Content-Type': 'application/json',
  });
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize form when endpoint changes
  useEffect(() => {
    initializeForm();
  }, [endpoint.id]);

  const initializeForm = () => {
    // Set base URL from environment or empty
    const baseUrl = activeEnvironment?.variables.baseUrl || 'https://api.example.com';
    setUrl(baseUrl);

    // Initialize path parameters
    const pathParamNames = extractPathParams(endpoint.path);
    const initialPathParams: Record<string, string> = {};
    pathParamNames.forEach((name) => {
      initialPathParams[name] = '';
    });
    setPathParams(initialPathParams);

    // Initialize query parameters from spec
    const queryParamValues: Record<string, string> = {};
    if (endpoint.parameters) {
      endpoint.parameters
        .filter((p: any) => p.in === 'query')
        .forEach((p: any) => {
          queryParamValues[p.name] = p.schema?.default || '';
        });
    }
    setQueryParams(queryParamValues);

    // Initialize request body
    if (endpoint.requestBody) {
      const example = getExampleRequestBody(endpoint.requestBody);
      if (example) {
        setBody(JSON.stringify(example, null, 2));
      } else {
        setBody('{}');
      }
    } else {
      setBody('');
    }
  };

  const handleSend = async () => {
    setLoading(true);

    try {
      // Build final URL with env variable substitution
      const envVars = activeEnvironment?.variables || {};
      const baseUrl = replaceEnvVariables(url, envVars);
      const finalUrl = buildURL(endpoint.path, baseUrl, pathParams, queryParams);

      // Prepare request
      const startTime = Date.now();
      const response = await makeRequest({
        url: finalUrl,
        method: endpoint.method,
        headers,
        body: body && endpoint.method !== 'GET' ? body : undefined,
      });

      // Save to history
      if (endpoint.id) {
        await db.history.add({
          endpointId: endpoint.id,
          environmentId: activeEnvironment?.id,
          request: {
            url: finalUrl,
            method: endpoint.method,
            headers,
            body,
            params: queryParams,
          },
          response: {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            body: JSON.stringify(response.body),
            duration: response.duration,
          },
          createdAt: new Date(),
        });

        // Cleanup old history
        await db.cleanupHistory(endpoint.id);
      }

      onResponse(response);
    } catch (error: any) {
      // Handle error
      console.error('Request failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const pathParamNames = extractPathParams(endpoint.path);
  const queryParamSpec = endpoint.parameters?.filter((p: any) => p.in === 'query') || [];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-3 py-1.5 rounded bg-blue-50 text-blue-600">
            {endpoint.method}
          </span>
          <h2 className="text-lg font-semibold text-gray-900 flex-1">
            {endpoint.path}
          </h2>
          <button
            onClick={handleSend}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
        {endpoint.description && (
          <p className="mt-2 text-sm text-gray-600">{endpoint.description}</p>
        )}
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Base URL */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Base URL</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://api.example.com"
          />
          <p className="text-xs text-gray-500">
            Supports environment variables like {`{{baseUrl}}`}
          </p>
        </div>

        {/* Path Parameters */}
        {pathParamNames.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Path Parameters</label>
            {pathParamNames.map((paramName) => {
              const paramSpec = endpoint.parameters?.find(
                (p: any) => p.in === 'path' && p.name === paramName
              );
              return (
                <div key={paramName} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">{paramName}</label>
                    {paramSpec?.required && (
                      <span className="text-xs text-red-500">*</span>
                    )}
                  </div>
                  {paramSpec?.description && (
                    <p className="text-xs text-gray-500">{paramSpec.description}</p>
                  )}
                  <input
                    type="text"
                    value={pathParams[paramName] || ''}
                    onChange={(e) =>
                      setPathParams({ ...pathParams, [paramName]: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Enter ${paramName}`}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Query Parameters */}
        {queryParamSpec.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Query Parameters</label>
            {queryParamSpec.map((param: any) => (
              <div key={param.name} className="space-y-1">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">{param.name}</label>
                  {param.required && <span className="text-xs text-red-500">*</span>}
                </div>
                {param.description && (
                  <p className="text-xs text-gray-500">{param.description}</p>
                )}
                <input
                  type="text"
                  value={queryParams[param.name] || ''}
                  onChange={(e) =>
                    setQueryParams({ ...queryParams, [param.name]: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={param.schema?.default || `Enter ${param.name}`}
                />
              </div>
            ))}
          </div>
        )}

        {/* Request Body */}
        {endpoint.requestBody && endpoint.method !== 'GET' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Request Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="{}"
            />
          </div>
        )}

        {/* Headers */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Headers</label>
          <textarea
            value={JSON.stringify(headers, null, 2)}
            onChange={(e) => {
              try {
                setHeaders(JSON.parse(e.target.value));
              } catch (err) {
                // Invalid JSON, ignore
              }
            }}
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>
    </div>
  );
}
