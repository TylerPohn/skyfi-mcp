/**
 * MCP Server Tests
 * Unit tests for MCP server manager
 */

import request from 'supertest';
import { MCPServerManager } from '../../src/server/mcp-server';

describe('MCPServerManager', () => {
  let serverManager: MCPServerManager;

  beforeEach(() => {
    serverManager = new MCPServerManager();
  });

  afterEach(async () => {
    await serverManager.shutdown();
  });

  describe('Initialization', () => {
    it('should create server instance', () => {
      expect(serverManager).toBeDefined();
      expect(serverManager.getServer()).toBeDefined();
      expect(serverManager.getTransport()).toBeDefined();
    });

    it('should not be initialized on creation', () => {
      expect(serverManager.isInitialized()).toBe(false);
    });
  });

  describe('Initialize Request', () => {
    it('should handle initialize request', async () => {
      const transport = serverManager.getTransport();

      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '1.0.0',
          clientInfo: {
            name: 'test-client',
            version: '1.0.0',
          },
        },
      };

      const response = await request(transport.getApp()).post('/mcp').send(initRequest);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: expect.any(String),
          serverInfo: {
            name: expect.any(String),
            version: expect.any(String),
          },
          capabilities: expect.any(Object),
        },
      });

      expect(serverManager.isInitialized()).toBe(true);
    });

    it('should validate initialize request params', async () => {
      const transport = serverManager.getTransport();

      const invalidRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          // Missing protocolVersion
        },
      };

      const response = await request(transport.getApp()).post('/mcp').send(invalidRequest);

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Ping Request', () => {
    it('should handle ping request', async () => {
      const transport = serverManager.getTransport();

      const pingRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'ping',
      };

      const response = await request(transport.getApp()).post('/mcp').send(pingRequest);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        jsonrpc: '2.0',
        id: 1,
        result: {
          status: 'pong',
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe('Tools List Request', () => {
    it('should require initialization before listing tools', async () => {
      const transport = serverManager.getTransport();

      const listRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      };

      const response = await request(transport.getApp()).post('/mcp').send(listRequest);

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('not initialized');
    });

    it('should list tools after initialization', async () => {
      const transport = serverManager.getTransport();

      // First initialize
      await request(transport.getApp())
        .post('/mcp')
        .send({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '1.0.0',
          },
        });

      // Then list tools
      const listRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
      };

      const response = await request(transport.getApp()).post('/mcp').send(listRequest);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        jsonrpc: '2.0',
        id: 2,
        result: {
          tools: expect.any(Array),
        },
      });
    });
  });

  describe('Tools Call Request', () => {
    it('should require initialization before calling tools', async () => {
      const transport = serverManager.getTransport();

      const callRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'test-tool',
          arguments: {},
        },
      };

      const response = await request(transport.getApp()).post('/mcp').send(callRequest);

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('not initialized');
    });

    it('should return error for unknown tool', async () => {
      const transport = serverManager.getTransport();

      // First initialize
      await request(transport.getApp())
        .post('/mcp')
        .send({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '1.0.0',
          },
        });

      // Then call unknown tool
      const callRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'unknown-tool',
          arguments: {},
        },
      };

      const response = await request(transport.getApp()).post('/mcp').send(callRequest);

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Unknown Method', () => {
    it('should return METHOD_NOT_FOUND for unknown method', async () => {
      const transport = serverManager.getTransport();

      const unknownRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'unknown/method',
      };

      const response = await request(transport.getApp()).post('/mcp').send(unknownRequest);

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe(-32601); // METHOD_NOT_FOUND
    });
  });

  describe('Shutdown', () => {
    it('should shutdown gracefully', async () => {
      await expect(serverManager.shutdown()).resolves.not.toThrow();
    });
  });
});
