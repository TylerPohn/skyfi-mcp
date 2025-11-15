/**
 * Type definitions for SkyFi MCP Server
 */

/**
 * Geospatial location coordinates
 */
export interface Location {
  latitude: number;
  longitude: number;
  radius_km?: number;
}

/**
 * Date range for data searches
 */
export interface DateRange {
  start: string;
  end: string;
}

/**
 * Area of Interest definition
 */
export interface AreaOfInterest {
  type: 'circle' | 'polygon' | 'bbox';
  coordinates: number[] | number[][];
  crs?: string;
}

/**
 * Dataset metadata
 */
export interface Dataset {
  id: string;
  name: string;
  type: string;
  provider: string;
  resolution: string;
  captureDate: string;
  cloudCoverage?: number;
  metadata: Record<string, unknown>;
}

/**
 * Order details
 */
export interface Order {
  id: string;
  datasetId: string;
  areaOfInterest: AreaOfInterest;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  price: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Tool execution result
 */
export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
