'use client';

import { useState, useEffect } from 'react';
import EmptyState from '@/components/EmptyState';
import ImportSpecDialog from '@/components/ImportSpecDialog';
import Sidebar from '@/components/Sidebar';
import RequestBuilder from '@/components/RequestBuilder';
import ResponseViewer from '@/components/ResponseViewer';
import SettingsMenu from '@/components/SettingsMenu';
import { useCollections } from '@/hooks/useCollections';
import type { Endpoint, ResponseData } from '@/types';

export default function Home() {
  const { collections } = useCollections();
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  const [response, setResponse] = useState<ResponseData | null>(null);

  const hasCollections = collections.length > 0;

  const handleEndpointSelect = (endpoint: Endpoint) => {
    setSelectedEndpoint(endpoint);
    setResponse(null); // Clear previous response
  };

  const handleResponse = (newResponse: ResponseData) => {
    setResponse(newResponse);
  };

  const handleImportSuccess = () => {
    // Collections will auto-refresh via the hook
  };

  // Show empty state if no collections
  if (!hasCollections) {
    return (
      <>
        <EmptyState onImportClick={() => setShowImportDialog(true)} />
        <ImportSpecDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          onSuccess={handleImportSuccess}
        />
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <h1 className="text-xl font-bold text-gray-900">API Visualizer</h1>
        <SettingsMenu />
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          selectedEndpointId={selectedEndpoint?.id}
          onEndpointSelect={handleEndpointSelect}
          onImportClick={() => setShowImportDialog(true)}
        />

        {/* Main Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedEndpoint ? (
            <>
              {/* Request Builder - Top Half */}
              <div className="h-1/2 border-b border-gray-200 overflow-hidden">
                <RequestBuilder
                  endpoint={selectedEndpoint}
                  onResponse={handleResponse}
                />
              </div>

              {/* Response Viewer - Bottom Half */}
              <div className="h-1/2 overflow-hidden">
                {response ? (
                  <ResponseViewer response={response} endpoint={selectedEndpoint} />
                ) : (
                  <div className="h-full flex items-center justify-center bg-white">
                    <div className="text-center text-gray-500">
                      <p className="text-lg mb-2">No response yet</p>
                      <p className="text-sm">Click "Send" to make a request</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center bg-white">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">No endpoint selected</p>
                <p className="text-sm">Select an endpoint from the sidebar to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Import Dialog */}
      <ImportSpecDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}
