import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Replace environment variables in a string
 * Supports {{variableName}} syntax
 */
export function replaceEnvVariables(
  text: string,
  variables: Record<string, string>
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return variables[varName] || match;
  });
}

/**
 * Extract all environment variable references from a string
 * Returns array of variable names found
 */
export function extractEnvVariables(text: string): string[] {
  const matches = text.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];
  return matches.map((match) => match.slice(2, -2));
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Pretty print JSON with syntax highlighting
 */
export function prettyPrintJSON(obj: any): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (error) {
    return String(obj);
  }
}

/**
 * Parse JSON safely
 */
export function safeJSONParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

/**
 * Get HTTP method color for UI
 */
export function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: 'text-blue-600 bg-blue-50',
    POST: 'text-green-600 bg-green-50',
    PUT: 'text-orange-600 bg-orange-50',
    PATCH: 'text-yellow-600 bg-yellow-50',
    DELETE: 'text-red-600 bg-red-50',
    HEAD: 'text-gray-600 bg-gray-50',
    OPTIONS: 'text-purple-600 bg-purple-50',
  };
  return colors[method.toUpperCase()] || 'text-gray-600 bg-gray-50';
}

/**
 * Get status code color for UI
 */
export function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return 'text-green-600';
  if (status >= 300 && status < 400) return 'text-blue-600';
  if (status >= 400 && status < 500) return 'text-orange-600';
  if (status >= 500) return 'text-red-600';
  return 'text-gray-600';
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
