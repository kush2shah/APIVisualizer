'use client';

import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Settings, Trash2, Database } from 'lucide-react';
import { db } from '@/lib/db';

export default function SettingsMenu() {
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearAllData = async () => {
    setIsClearing(true);
    try {
      // Clear all tables
      await db.specs.clear();
      await db.collections.clear();
      await db.endpoints.clear();
      await db.visualizations.clear();
      await db.history.clear();
      await db.environments.clear();
      await db.authConfigs.clear();

      // Close dialog
      setShowClearDialog(false);

      // Reload page to reset state
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear data:', error);
      alert('Failed to clear data. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleExportData = async () => {
    try {
      const data = {
        specs: await db.specs.toArray(),
        collections: await db.collections.toArray(),
        endpoints: await db.endpoints.toArray(),
        visualizations: await db.visualizations.toArray(),
        environments: await db.environments.toArray(),
        authConfigs: await db.authConfigs.toArray(),
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `api-visualizer-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Settings</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleExportData}>
            <Database className="w-4 h-4 mr-2" />
            Export Data
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowClearDialog(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All Data
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirm Clear Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Data?</DialogTitle>
            <DialogDescription>
              This will permanently delete all collections, endpoints, visualizations, and
              settings. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> All your imported OpenAPI specs, request history, and
              cached visualizations will be deleted.
            </p>
          </div>

          <DialogFooter>
            <button
              onClick={() => setShowClearDialog(false)}
              disabled={isClearing}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleClearAllData}
              disabled={isClearing}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {isClearing ? 'Clearing...' : 'Clear All Data'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
