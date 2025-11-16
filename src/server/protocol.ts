/**
 * MCP Protocol Handler
 * Handles parsing and validation of MCP protocol messages
 */

import { z } from 'zod';
import { logger } from './logger.js';

/**
 * MCP Message Types
 */
export enum MCPMessageType {
  INITIALIZE = 'initialize',
  TOOLS_LIST = 'tools/list',
  TOOLS_CALL = 'tools/call',
  PING = 'ping',
}

/**
 * Base MCP request schema
 */
export const baseRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]),
  method: z.string(),
  params: z.record(z.unknown()).optional(),
});

export type BaseRequest = z.infer<typeof baseRequestSchema>;

/**
 * Initialize request schema
 */
export const initializeRequestSchema = baseRequestSchema.extend({
  method: z.literal('initialize'),
  params: z.object({
    protocolVersion: z.string(),
    capabilities: z.record(z.unknown()).optional(),
    clientInfo: z
      .object({
        name: z.string(),
        version: z.string(),
      })
      .optional(),
  }),
});

export type InitializeRequest = z.infer<typeof initializeRequestSchema>;

/**
 * Tools list request schema
 */
export const toolsListRequestSchema = baseRequestSchema.extend({
  method: z.literal('tools/list'),
  params: z.object({}).optional(),
});

export type ToolsListRequest = z.infer<typeof toolsListRequestSchema>;

/**
 * Tools call request schema
 */
export const toolsCallRequestSchema = baseRequestSchema.extend({
  method: z.literal('tools/call'),
  params: z.object({
    name: z.string(),
    arguments: z.record(z.unknown()).optional(),
  }),
});

export type ToolsCallRequest = z.infer<typeof toolsCallRequestSchema>;

/**
 * Base MCP response schema
 */
export const baseResponseSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]),
  result: z.unknown().optional(),
  error: z
    .object({
      code: z.number(),
      message: z.string(),
      data: z.unknown().optional(),
    })
    .optional(),
});

export type BaseResponse = z.infer<typeof baseResponseSchema>;

/**
 * MCP Error Codes
 */
export enum MCPErrorCode {
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,
}

/**
 * Protocol Handler Class
 */
export class ProtocolHandler {
  /**
   * Parse incoming MCP message
   */
  parseMessage(message: string): BaseRequest {
    try {
      const parsed = JSON.parse(message) as unknown;
      return baseRequestSchema.parse(parsed);
    } catch (error) {
      logger.error('Failed to parse MCP message', { error, message });
      throw this.createError(MCPErrorCode.PARSE_ERROR, 'Failed to parse JSON-RPC message', error);
    }
  }

  /**
   * Validate request against specific schema
   */
  validateRequest<T>(request: BaseRequest, schema: z.ZodSchema<T>): T {
    try {
      return schema.parse(request);
    } catch (error) {
      logger.error('Request validation failed', { error, request });
      throw this.createError(MCPErrorCode.INVALID_REQUEST, 'Invalid request format', error);
    }
  }

  /**
   * Create success response
   */
  createSuccessResponse(id: string | number, result: unknown): BaseResponse {
    return {
      jsonrpc: '2.0',
      id,
      result,
    };
  }

  /**
   * Create error response
   */
  createErrorResponse(
    id: string | number | null,
    code: MCPErrorCode,
    message: string,
    data?: unknown,
  ): BaseResponse {
    return {
      jsonrpc: '2.0',
      id: id ?? 0,
      error: {
        code,
        message,
        data,
      },
    };
  }

  /**
   * Create error object
   */
  private createError(code: MCPErrorCode, message: string, data?: unknown): Error {
    const error = new Error(message);
    (error as Error & { code: number; data?: unknown }).code = code;
    (error as Error & { code: number; data?: unknown }).data = data;
    return error;
  }

  /**
   * Format response as JSON string
   */
  formatResponse(response: BaseResponse): string {
    return JSON.stringify(response);
  }
}
