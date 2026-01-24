import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import type { Endpoint } from '@/types';

export function useEndpoints(collectionId?: number) {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEndpoints = async () => {
    try {
      setLoading(true);
      let data: Endpoint[];

      if (collectionId !== undefined) {
        data = await db.endpoints.where('collectionId').equals(collectionId).toArray();
      } else {
        data = await db.endpoints.toArray();
      }

      setEndpoints(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load endpoints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEndpoints();
  }, [collectionId]);

  const createEndpoint = async (endpoint: Omit<Endpoint, 'id' | 'createdAt'>): Promise<number> => {
    try {
      const id = await db.endpoints.add({
        ...endpoint,
        createdAt: new Date(),
      });
      await loadEndpoints();
      return id;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create endpoint');
    }
  };

  const updateEndpoint = async (
    id: number,
    updates: Partial<Omit<Endpoint, 'id' | 'createdAt'>>
  ): Promise<void> => {
    try {
      await db.endpoints.update(id, updates);
      await loadEndpoints();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update endpoint');
    }
  };

  const deleteEndpoint = async (id: number): Promise<void> => {
    try {
      // Delete all visualizations for this endpoint
      await db.visualizations.where('endpointId').equals(id).delete();

      // Delete all history for this endpoint
      await db.history.where('endpointId').equals(id).delete();

      // Delete the endpoint itself
      await db.endpoints.delete(id);
      await loadEndpoints();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete endpoint');
    }
  };

  return {
    endpoints,
    loading,
    error,
    createEndpoint,
    updateEndpoint,
    deleteEndpoint,
    refresh: loadEndpoints,
  };
}
