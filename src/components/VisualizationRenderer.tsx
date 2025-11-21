'use client';

import React, { useState } from 'react';
import { LiveProvider, LiveError, LivePreview } from 'react-live';
import * as Recharts from 'recharts';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface VisualizationRendererProps {
  code: string;
  data: any;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export default function VisualizationRenderer({
  code,
  data,
  onRegenerate,
  isRegenerating = false,
}: VisualizationRendererProps) {
  const [showCode, setShowCode] = useState(false);

  // Scope for react-live - includes all Recharts components
  const scope = {
    React,
    ...Recharts,
  };

  // Transform the code to inject the data prop
  const transformedCode = transformCode(code, data);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">AI-Generated Visualization</h3>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Regenerate visualization"
            >
              <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
              {isRegenerating ? 'Regenerating...' : 'Regenerate'}
            </button>
          )}
        </div>
        <button
          onClick={() => setShowCode(!showCode)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {showCode ? 'Hide Code' : 'Show Code'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <LiveProvider code={transformedCode} scope={scope} noInline={false}>
          <div className="h-full">
            {/* Preview */}
            {!showCode && (
              <div className="p-6">
                <LivePreview />
              </div>
            )}

            {/* Code View */}
            {showCode && (
              <div className="p-4">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <code className="text-sm font-mono">{code}</code>
                </pre>
              </div>
            )}

            {/* Error Display */}
            <div className="px-6">
              <LiveError
                className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4"
                style={{
                  color: '#dc2626',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                }}
              />
            </div>
          </div>
        </LiveProvider>
      </div>
    </div>
  );
}

/**
 * Transform the code to make it work with react-live
 * - Remove export default
 * - Remove import statements (we provide them via scope)
 * - Wrap in an immediately invoked component
 */
function transformCode(code: string, data: any): string {
  let transformed = code;

  // Remove import statements
  transformed = transformed.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');

  // Remove export default
  transformed = transformed.replace(/export\s+default\s+/g, '');

  // Find the function/component name
  const functionMatch = transformed.match(/function\s+(\w+)/);
  const componentName = functionMatch ? functionMatch[1] : 'Visualization';

  // If it's a named function, add a render call
  if (functionMatch) {
    transformed += `\n\n<${componentName} data={${JSON.stringify(data)}} />`;
  }

  return transformed;
}
