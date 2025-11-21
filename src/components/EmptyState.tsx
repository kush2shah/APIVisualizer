'use client';

import React from 'react';
import { FileJson, Zap, BarChart3 } from 'lucide-react';

interface EmptyStateProps {
  onImportClick: () => void;
}

export default function EmptyState({ onImportClick }: EmptyStateProps) {
  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-2xl mx-auto p-8 text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <BarChart3 className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Welcome to API Visualizer
        </h1>

        {/* Description */}
        <p className="text-lg text-gray-600 mb-8">
          Transform your API responses into beautiful, AI-powered visualizations.
          Import an OpenAPI spec to get started.
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <FileJson className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Import OpenAPI</h3>
            <p className="text-sm text-gray-600">
              Upload your OpenAPI/Swagger spec and automatically generate endpoint collections
            </p>
          </div>

          <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <Zap className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Test APIs</h3>
            <p className="text-sm text-gray-600">
              Make requests with smart forms that understand your API schema
            </p>
          </div>

          <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <BarChart3 className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">AI Visualizations</h3>
            <p className="text-sm text-gray-600">
              Claude AI automatically creates charts and tables from your API responses
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onImportClick}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
        >
          Import OpenAPI Spec
        </button>

        {/* Help Text */}
        <p className="mt-6 text-sm text-gray-500">
          Don't have a spec?{' '}
          <button className="text-blue-600 hover:underline">
            Try an example
          </button>
        </p>
      </div>
    </div>
  );
}
