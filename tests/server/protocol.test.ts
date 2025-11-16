/**
 * Protocol Handler Tests
 * Unit tests for MCP protocol message parsing and validation
 */

import {
  ProtocolHandler,
  MCPErrorCode,
  initializeRequestSchema,
  toolsListRequestSchema,
  toolsCallRequestSchema,
} from '../../src/server/protocol';

describe('ProtocolHandler', () => {
  let handler: ProtocolHandler;

  beforeEach(() => {
    handler = new ProtocolHandler();
  });

  describe('parseMessage', () => {
    it('should parse valid JSON-RPC message', () => {
      const message = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'test',
      });

      const result = handler.parseMessage(message);

      expect(result).toEqual({
        jsonrpc: '2.0',
        id: 1,
        method: 'test',
      });
    });

    it('should throw PARSE_ERROR for invalid JSON', () => {
      const message = 'invalid json';

      expect(() => handler.parseMessage(message)).toThrow();
    });

    it('should throw error for missing required fields', () => {
      const message = JSON.stringify({
        jsonrpc: '2.0',
      });

      expect(() => handler.parseMessage(message)).toThrow();
    });

    it('should accept string or number id', () => {
      const messageWithStringId = JSON.stringify({
        jsonrpc: '2.0',
        id: 'test-id',
        method: 'test',
      });

      const messageWithNumberId = JSON.stringify({
        jsonrpc: '2.0',
        id: 123,
        method: 'test',
      });

      expect(handler.parseMessage(messageWithStringId).id).toBe('test-id');
      expect(handler.parseMessage(messageWithNumberId).id).toBe(123);
    });
  });

  describe('validateRequest', () => {
    it('should validate initialize request', () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '1.0.0',
          capabilities: {},
          clientInfo: {
            name: 'test-client',
            version: '1.0.0',
          },
        },
      };

      const result = handler.validateRequest(request, initializeRequestSchema);

      expect(result.method).toBe('initialize');
      expect(result.params.protocolVersion).toBe('1.0.0');
    });

    it('should validate tools/list request', () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'tools/list',
      };

      const result = handler.validateRequest(request, toolsListRequestSchema);

      expect(result.method).toBe('tools/list');
    });

    it('should validate tools/call request', () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'tools/call',
        params: {
          name: 'test-tool',
          arguments: {
            arg1: 'value1',
          },
        },
      };

      const result = handler.validateRequest(request, toolsCallRequestSchema);

      expect(result.method).toBe('tools/call');
      expect(result.params.name).toBe('test-tool');
    });

    it('should throw INVALID_REQUEST for invalid request', () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'invalid',
      };

      expect(() => handler.validateRequest(request, initializeRequestSchema)).toThrow();
    });
  });

  describe('createSuccessResponse', () => {
    it('should create valid success response', () => {
      const response = handler.createSuccessResponse(1, {
        data: 'test',
      });

      expect(response).toEqual({
        jsonrpc: '2.0',
        id: 1,
        result: {
          data: 'test',
        },
      });
    });

    it('should handle string id', () => {
      const response = handler.createSuccessResponse('test-id', {
        data: 'test',
      });

      expect(response.id).toBe('test-id');
    });
  });

  describe('createErrorResponse', () => {
    it('should create valid error response', () => {
      const response = handler.createErrorResponse(
        1,
        MCPErrorCode.INVALID_REQUEST,
        'Invalid request',
      );

      expect(response).toEqual({
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: MCPErrorCode.INVALID_REQUEST,
          message: 'Invalid request',
        },
      });
    });

    it('should include error data if provided', () => {
      const response = handler.createErrorResponse(
        1,
        MCPErrorCode.INTERNAL_ERROR,
        'Internal error',
        { details: 'error details' },
      );

      expect(response.error?.data).toEqual({ details: 'error details' });
    });

    it('should handle null id', () => {
      const response = handler.createErrorResponse(null, MCPErrorCode.PARSE_ERROR, 'Parse error');

      expect(response.id).toBe(0);
    });
  });

  describe('formatResponse', () => {
    it('should format response as JSON string', () => {
      const response = {
        jsonrpc: '2.0' as const,
        id: 1,
        result: { data: 'test' },
      };

      const formatted = handler.formatResponse(response);

      expect(formatted).toBe(JSON.stringify(response));
      expect(JSON.parse(formatted)).toEqual(response);
    });
  });
});
