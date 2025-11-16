/**
 * Server Integration Tests
 * End-to-end tests for the complete MCP server
 */

import { createServer, Server as HTTPServer } from 'http';
import request from 'supertest';
import { MCPServerManager } from '../../src/server/mcp-server';
import { config } from '../../src/server/config';

describe('Server Integration Tests', () => {
  let serverManager: MCPServerManager;
  let httpServer: HTTPServer;
  const testPort = 3001; // Use different port for testing

  beforeAll((done) => {
    serverManager = new MCPServerManager();
    const transport = serverManager.getTransport();
    httpServer = createServer(transport.getApp());

    httpServer.listen(testPort, () => {
      done();
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
    await serverManager.shutdown();
  });

  describe('Complete MCP Workflow', () => {
    it('should complete full MCP initialization and tool listing workflow', async () => {
      // Step 1: Check server health
      const healthResponse = await request(httpServer).get('/health');

      expect(healthResponse.status).toBe(200);
      expect(healthResponse.body.status).toBe('healthy');

      // Step 2: Initialize MCP connection
      const initResponse = await request(httpServer)
        .post('/mcp')
        .send({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '1.0.0',
            clientInfo: {
              name: 'integration-test-client',
              version: '1.0.0',
            },
          },
        });

      expect(initResponse.status).toBe(200);
      expect(initResponse.body.result.protocolVersion).toBeDefined();
      expect(initResponse.body.result.serverInfo).toBeDefined();

      // Step 3: List available tools
      const listResponse = await request(httpServer).post('/mcp').send({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
      });

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.result.tools).toBeInstanceOf(Array);

      // Step 4: Ping server
      const pingResponse = await request(httpServer).post('/mcp').send({
        jsonrpc: '2.0',
        id: 3,
        method: 'ping',
      });

      expect(pingResponse.status).toBe(200);
      expect(pingResponse.body.result.status).toBe('pong');
    });
  });

  describe('SSE Connection Lifecycle', () => {
    it('should establish and maintain SSE connection', (done) => {
      const req = request(httpServer).get('/sse');

      let connectedEventReceived = false;
      let pingEventReceived = false;

      req.on('data', (chunk) => {
        const data = chunk.toString();

        if (data.includes('event: connected')) {
          connectedEventReceived = true;
        }

        if (data.includes('event: ping')) {
          pingEventReceived = true;
        }

        // Complete test after receiving both events
        if (connectedEventReceived) {
          expect(connectedEventReceived).toBe(true);
          req.abort();
          done();
        }
      });

      req.on('error', (error: Error & { code?: string }) => {
        // Abort error is expected when we close the connection
        if (error.code !== 'ECONNRESET') {
          done(error);
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(httpServer)
        .post('/mcp')
        .send('invalid json')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });

    it('should handle missing method', async () => {
      const response = await request(httpServer).post('/mcp').send({
        jsonrpc: '2.0',
        id: 1,
      });

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });

    it('should handle invalid method', async () => {
      const response = await request(httpServer).post('/mcp').send({
        jsonrpc: '2.0',
        id: 1,
        method: 'invalid/method',
      });

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe(-32601); // METHOD_NOT_FOUND
    });
  });

  describe('CORS and Headers', () => {
    it('should include proper CORS headers', async () => {
      const response = await request(httpServer).get('/health');

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    it('should handle preflight OPTIONS request', async () => {
      const response = await request(httpServer)
        .options('/mcp')
        .set('Origin', 'http://example.com')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.status).toBe(200);
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent requests', async () => {
      // Initialize first
      await request(httpServer)
        .post('/mcp')
        .send({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '1.0.0',
          },
        });

      // Send multiple concurrent requests
      const requests = Array.from({ length: 10 }, (_, i) =>
        request(httpServer)
          .post('/mcp')
          .send({
            jsonrpc: '2.0',
            id: i + 2,
            method: 'ping',
          }),
      );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.result.status).toBe('pong');
      });
    });
  });

  describe('Request ID Tracking', () => {
    it('should preserve request ID in responses', async () => {
      const testIds = ['test-id-1', 'test-id-2', 123, 456];

      for (const testId of testIds) {
        const response = await request(httpServer).post('/mcp').send({
          jsonrpc: '2.0',
          id: testId,
          method: 'ping',
        });

        expect(response.body.id).toBe(testId);
      }
    });
  });
});
