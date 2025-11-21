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

    try {
      // Detect format
      const format = detectFormat(content);

      // Parse the spec
      const result = await parseOpenAPISpec(content, format);

      if (!result.success || !result.spec || !result.endpoints || !result.info) {
        throw new Error(result.error || 'Failed to parse OpenAPI spec');
      }

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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import OpenAPI Spec</DialogTitle>
          <DialogDescription>
            Upload an OpenAPI/Swagger specification file (YAML or JSON) to automatically
            generate endpoint collections.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Upload File</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
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
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {file ? file.name : 'Click to upload or drag and drop'}
                </span>
                <span className="text-xs text-gray-500">
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
            <label className="text-sm font-medium">Paste Spec Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your OpenAPI spec here..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-700">
                Successfully imported OpenAPI spec!
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading || !content || success}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Importing...' : 'Import Spec'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
