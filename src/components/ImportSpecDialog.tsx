'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Upload, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { parseOpenAPISpec, detectFormat } from '@/lib/openapi-parser';
import { db } from '@/lib/db';

interface ImportSpecDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (specId: number) => void;
}

export default function ImportSpecDialog({
  open,
  onOpenChange,
  onSuccess,
}: ImportSpecDialogProps) {
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);

      // Read file content
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setContent(text);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!content) {
      setError('Please select a file or paste content');
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingStep('Parsing OpenAPI specification...');

    try {
      // Detect format
      const format = detectFormat(content);

      // Parse the spec
      const result = await parseOpenAPISpec(content, format);

      if (!result.success || !result.spec || !result.endpoints || !result.info) {
        throw new Error(result.error || 'Failed to parse OpenAPI spec');
      }

      setLoadingStep(`Found ${result.endpoints.length} endpoints. Saving to database...`);

      // Save to database
      const specId = await db.specs.add({
        name: result.info.title,
        content: JSON.stringify(result.spec),
        format,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create a collection for this spec
      const collectionId = await db.collections.add({
        name: result.info.title,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setLoadingStep('Creating endpoint collection...');

      // Save all endpoints
      for (const endpoint of result.endpoints) {
        await db.endpoints.add({
          specId,
          collectionId,
          method: endpoint.method,
          path: endpoint.path,
          operationId: endpoint.operationId,
          summary: endpoint.summary,
          description: endpoint.description,
          tags: endpoint.tags,
          parameters: endpoint.parameters,
          requestBody: endpoint.requestBody,
          responses: endpoint.responses,
          security: endpoint.security,
          createdAt: new Date(),
        });
      }

      setLoadingStep('Import complete!');
      setSuccess(true);

      // Close dialog after a brief delay
      setTimeout(() => {
        onOpenChange(false);
        onSuccess?.(specId);
        resetForm();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to import spec');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const resetForm = () => {
    setContent('');
    setFile(null);
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl dark:bg-gray-900 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">Import OpenAPI Spec</DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            Upload an OpenAPI/Swagger specification file (YAML or JSON) to automatically
            generate endpoint collections.
          </DialogDescription>
        </DialogHeader>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/98 dark:bg-gray-900/98 z-50 flex items-center justify-center rounded-lg backdrop-blur-sm">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600 dark:text-blue-400" />
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Processing...</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{loadingStep}</p>
            </div>
          </div>
        )}

        <div className="space-y-4 py-4">
          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium dark:text-gray-200">Upload File</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
              <input
                type="file"
                accept=".json,.yaml,.yml"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                disabled={loading}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {file ? file.name : 'Click to upload or drag and drop'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  OpenAPI 3.0/3.1, Swagger 2.0 (JSON or YAML)
                </span>
              </label>
            </div>
          </div>

          {/* Or Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or paste content</span>
            </div>
          </div>

          {/* Text Area */}
          <div className="space-y-2">
            <label className="text-sm font-medium dark:text-gray-200">Paste Spec Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your OpenAPI spec here..."
              className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-md text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-700 dark:text-green-300">
                Successfully imported OpenAPI spec!
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading || !content || success}
            className="px-4 py-2 text-sm font-medium bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Importing...' : 'Import Spec'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
