import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import type { Collection } from '@/types';

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const data = await db.collections.toArray();
      setCollections(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  const createCollection = async (
    name: string,
    parentId?: number,
    color?: string,
    icon?: string
  ): Promise<number> => {
    try {
      const id = await db.collections.add({
        name,
        parentId,
        color,
        icon,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await loadCollections();
      return id;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create collection');
    }
  };

  const updateCollection = async (
    id: number,
    updates: Partial<Omit<Collection, 'id' | 'createdAt'>>
  ): Promise<void> => {
    try {
      await db.collections.update(id, {
        ...updates,
        updatedAt: new Date(),
      });
      await loadCollections();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update collection');
    }
  };

  const deleteCollection = async (id: number): Promise<void> => {
    try {
      // Delete all child collections
      const children = await db.collections.where('parentId').equals(id).toArray();
      for (const child of children) {
        if (child.id) {
          await deleteCollection(child.id);
        }
      }

      // Delete all endpoints in this collection
      await db.endpoints.where('collectionId').equals(id).delete();

      // Delete the collection itself
      await db.collections.delete(id);
      await loadCollections();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete collection');
    }
  };

  return {
    collections,
    loading,
    error,
    createCollection,
    updateCollection,
    deleteCollection,
    refresh: loadCollections,
  };
}
