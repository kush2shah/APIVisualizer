'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, Plus, FileText } from 'lucide-react';
import { useCollections } from '@/hooks/useCollections';
import { useEndpoints } from '@/hooks/useEndpoints';
import { getMethodColor } from '@/lib/utils';
import type { Collection, Endpoint } from '@/types';

interface SidebarProps {
  selectedEndpointId?: number | null;
  onEndpointSelect: (endpoint: Endpoint) => void;
  onImportClick: () => void;
}

export default function Sidebar({
  selectedEndpointId,
  onEndpointSelect,
  onImportClick,
}: SidebarProps) {
  const { collections } = useCollections();
  const { endpoints } = useEndpoints();
  const [expandedCollections, setExpandedCollections] = useState<Set<number>>(new Set());

  const toggleCollection = (collectionId: number) => {
    setExpandedCollections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(collectionId)) {
        newSet.delete(collectionId);
      } else {
        newSet.add(collectionId);
      }
      return newSet;
    });
  };

  const getEndpointsForCollection = (collectionId: number) => {
    return endpoints.filter((e) => e.collectionId === collectionId);
  };

  return (
    <div className="w-80 h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Collections</h2>
          <button
            onClick={onImportClick}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            title="Import OpenAPI Spec"
          >
            <Plus className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Collections List */}
      <div className="flex-1 overflow-y-auto">
        {collections.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No collections yet
          </div>
        ) : (
          <div className="py-2">
            {collections.map((collection) => (
              <CollectionItem
                key={collection.id}
                collection={collection}
                endpoints={getEndpointsForCollection(collection.id!)}
                expanded={expandedCollections.has(collection.id!)}
                onToggle={() => toggleCollection(collection.id!)}
                selectedEndpointId={selectedEndpointId}
                onEndpointSelect={onEndpointSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface CollectionItemProps {
  collection: Collection;
  endpoints: Endpoint[];
  expanded: boolean;
  onToggle: () => void;
  selectedEndpointId?: number | null;
  onEndpointSelect: (endpoint: Endpoint) => void;
}

function CollectionItem({
  collection,
  endpoints,
  expanded,
  onToggle,
  selectedEndpointId,
  onEndpointSelect,
}: CollectionItemProps) {
  return (
    <div>
      {/* Collection Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
        )}
        <Folder className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <span className="text-sm font-medium text-gray-900 truncate">
          {collection.name}
        </span>
        <span className="ml-auto text-xs text-gray-500">
          {endpoints.length}
        </span>
      </button>

      {/* Endpoints */}
      {expanded && (
        <div className="ml-6">
          {endpoints.length === 0 ? (
            <div className="px-4 py-2 text-xs text-gray-500">No endpoints</div>
          ) : (
            endpoints.map((endpoint) => (
              <button
                key={endpoint.id}
                onClick={() => onEndpointSelect(endpoint)}
                className={`w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                  selectedEndpointId === endpoint.id ? 'bg-blue-50' : ''
                }`}
              >
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${getMethodColor(
                    endpoint.method
                  )}`}
                >
                  {endpoint.method}
                </span>
                <span className="text-sm text-gray-700 truncate flex-1">
                  {endpoint.path}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
