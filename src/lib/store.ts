import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Endpoint,
  Collection,
  Environment,
  ResponseData,
  ResponseTab,
} from '@/types';

interface AppState {
  // UI State
  sidebarCollapsed: boolean;
  activeTab: ResponseTab;
  selectedEndpointId: number | null;
  selectedCollectionId: number | null;

  // Request/Response State
  isLoading: boolean;
  currentRequest: {
    url: string;
    method: string;
    headers: Record<string, string>;
    params: Record<string, string>;
    body: string;
  } | null;
  currentResponse: ResponseData | null;

  // Visualization State
  isGeneratingVisualization: boolean;
  visualizationError: string | null;

  // Active Environment
  activeEnvironmentId: number | null;

  // Actions - UI
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveTab: (tab: ResponseTab) => void;
  setSelectedEndpoint: (endpointId: number | null) => void;
  setSelectedCollection: (collectionId: number | null) => void;

  // Actions - Request/Response
  setIsLoading: (loading: boolean) => void;
  setCurrentRequest: (request: AppState['currentRequest']) => void;
  setCurrentResponse: (response: ResponseData | null) => void;

  // Actions - Visualization
  setIsGeneratingVisualization: (generating: boolean) => void;
  setVisualizationError: (error: string | null) => void;

  // Actions - Environment
  setActiveEnvironment: (environmentId: number | null) => void;

  // Reset functions
  resetRequest: () => void;
  resetResponse: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      sidebarCollapsed: false,
      activeTab: 'visualization',
      selectedEndpointId: null,
      selectedCollectionId: null,
      isLoading: false,
      currentRequest: null,
      currentResponse: null,
      isGeneratingVisualization: false,
      visualizationError: null,
      activeEnvironmentId: null,

      // UI Actions
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedEndpoint: (endpointId) => set({ selectedEndpointId: endpointId }),
      setSelectedCollection: (collectionId) => set({ selectedCollectionId: collectionId }),

      // Request/Response Actions
      setIsLoading: (loading) => set({ isLoading: loading }),
      setCurrentRequest: (request) => set({ currentRequest: request }),
      setCurrentResponse: (response) => set({ currentResponse: response }),

      // Visualization Actions
      setIsGeneratingVisualization: (generating) =>
        set({ isGeneratingVisualization: generating }),
      setVisualizationError: (error) => set({ visualizationError: error }),

      // Environment Actions
      setActiveEnvironment: (environmentId) => set({ activeEnvironmentId: environmentId }),

      // Reset functions
      resetRequest: () =>
        set({
          currentRequest: null,
          isLoading: false,
        }),
      resetResponse: () =>
        set({
          currentResponse: null,
          isGeneratingVisualization: false,
          visualizationError: null,
        }),
    }),
    {
      name: 'api-visualizer-storage',
      partialize: (state) => ({
        // Only persist UI preferences, not request/response data
        sidebarCollapsed: state.sidebarCollapsed,
        activeTab: state.activeTab,
        activeEnvironmentId: state.activeEnvironmentId,
      }),
    }
  )
);
