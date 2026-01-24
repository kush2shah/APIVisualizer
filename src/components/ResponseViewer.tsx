'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VisualizationRenderer from './VisualizationRenderer';
import { db } from '@/lib/db';
import { generateVisualization } from '@/lib/api';
import type { ResponseData, Endpoint } from '@/types';
import { Loader2, AlertCircle } from 'lucide-react';

interface ResponseViewerProps {
  response: ResponseData;
  endpoint: Endpoint;
}

export default function ResponseViewer({ response, endpoint }: ResponseViewerProps) {
  const [activeTab, setActiveTab] = useState<string>('visualization');
  const [visualizationCode, setVisualizationCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cached visualization or generate new one
  useEffect(() => {
    loadOrGenerateVisualization();
  }, [endpoint.id, response]);

  const loadOrGenerateVisualization = async () => {
    if (!endpoint.id) return;

    try {
      setIsGenerating(true);
      setError(null);

      // Check if we have a cached visualization
      const cached = await db.getVisualizationForEndpoint(endpoint.id);

      if (cached?.componentCode) {
        setVisualizationCode(cached.componentCode);
      } else {
        // Generate new visualization
        await generateNewVisualization();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load visualization');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateNewVisualization = async () => {
    if (!endpoint.id) return;

    try {
      setIsGenerating(true);
      setError(null);

      const result = await generateVisualization(
        {
          method: endpoint.method,
          path: endpoint.path,
          description: endpoint.description || endpoint.summary,
        },
        response.body
      );

      setVisualizationCode(result.componentCode);

      // Cache the visualization
      await db.visualizations.add({
        endpointId: endpoint.id,
        componentCode: result.componentCode,
        prompt: result.prompt,
        model: result.model,
        responseStructure: JSON.stringify(response.body),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to generate visualization');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!endpoint.id) return;

    // Delete old visualization
    const existing = await db.getVisualizationForEndpoint(endpoint.id);
    if (existing?.id) {
      await db.visualizations.delete(existing.id);
    }

    // Generate new one
    await generateNewVisualization();
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start border-b rounded-none bg-gray-50 p-0">
          <TabsTrigger
            value="visualization"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
          >
            Visualization
          </TabsTrigger>
          <TabsTrigger
            value="data"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
          >
            Raw Data
          </TabsTrigger>
          <TabsTrigger
            value="headers"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
          >
            Headers
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          {/* Visualization Tab */}
          <TabsContent value="visualization" className="h-full m-0">
            {isGenerating && !visualizationCode && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600">Generating visualization with AI...</p>
                </div>
              </div>
            )}

            {error && !visualizationCode && (
              <div className="h-full flex items-center justify-center p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-900 mb-1">
                        Visualization Error
                      </h3>
                      <p className="text-sm text-red-700">{error}</p>
                      <button
                        onClick={handleRegenerate}
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {visualizationCode && !error && (
              <VisualizationRenderer
                code={visualizationCode}
                data={response.body}
                onRegenerate={handleRegenerate}
                isRegenerating={isGenerating}
              />
            )}
          </TabsContent>

          {/* Raw Data Tab */}
          <TabsContent value="data" className="h-full m-0 overflow-auto">
            <div className="p-6">
              <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto">
                <code className="text-sm font-mono">
                  {JSON.stringify(response.body, null, 2)}
                </code>
              </pre>
            </div>
          </TabsContent>

          {/* Headers Tab */}
          <TabsContent value="headers" className="h-full m-0 overflow-auto">
            <div className="p-6">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Header
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(response.headers).map(([key, value]) => (
                      <tr key={key} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {key}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                          {value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
