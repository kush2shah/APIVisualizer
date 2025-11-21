import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import type { Environment } from '@/types';

export function useEnvironments() {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [activeEnvironment, setActiveEnvironment] = useState<Environment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEnvironments = async () => {
    try {
      setLoading(true);
      const data = await db.environments.toArray();
      setEnvironments(data);

      const active = await db.getActiveEnvironment();
      setActiveEnvironment(active || null);

      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load environments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnvironments();
  }, []);

  const createEnvironment = async (
    name: string,
    variables: Record<string, string> = {},
    setAsActive: boolean = false
  ): Promise<number> => {
    try {
      const id = await db.environments.add({
        name,
        variables,
        isActive: setAsActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (setAsActive) {
        await db.setActiveEnvironment(id);
      }

      await loadEnvironments();
      return id;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create environment');
    }
  };

  const updateEnvironment = async (
    id: number,
    updates: Partial<Omit<Environment, 'id' | 'createdAt'>>
  ): Promise<void> => {
    try {
      await db.environments.update(id, {
        ...updates,
        updatedAt: new Date(),
      });
      await loadEnvironments();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update environment');
    }
  };

  const deleteEnvironment = async (id: number): Promise<void> => {
    try {
      await db.environments.delete(id);
      await loadEnvironments();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete environment');
    }
  };

  const setActive = async (id: number): Promise<void> => {
    try {
      await db.setActiveEnvironment(id);
      await loadEnvironments();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to set active environment');
    }
  };

  return {
    environments,
    activeEnvironment,
    loading,
    error,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    setActive,
    refresh: loadEnvironments,
  };
}
