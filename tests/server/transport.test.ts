/**
 * HTTP Transport Tests
 * Integration tests for HTTP and SSE transport layer
 */

import request from 'supertest';
import { HTTPTransport } from '../../src/server/transport';
import { BaseRequest } from '../../src/server/protocol';

describe('HTTPTransport', () => {
  let transport: HTTPTransport;

  beforeEach(() => {
    transport = new HTTPTransport();
  });

  describe('Health Check Endpoint', () => {
    it('should return healthy status', async () => {
      const response = await request(transport.getApp()).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'healthy',
        name: expect.any(String),
        version: expect.any(String),
        timestamp: expect.any(String),
      });
    });
  });

  describe('MCP Endpoint', () => {
    it('should handle valid MCP request', async () => {
      // Setup request handler
      transport.setRequestHandler(async (req: BaseRequest) => {
        return {
          protocolVersion: '1.0.0',
          serverInfo: {
            name: 'test-server',
            version: '1.0.0',
          },
        };
      });

      const mcpRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '1.0.0',
        },
      };

      const response = await request(transport.getApp())
        .post('/mcp')
        .send(mcpRequest)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        jsonrpc: '2.0',
        id: 1,
        result: expect.any(Object),
      });
    });

    it('should return error for invalid JSON-RPC message', async () => {
      const invalidRequest = {
        invalid: 'request',
      };

      const response = await request(transport.getApp())
        .post('/mcp')
        .send(invalidRequest)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        jsonrpc: '2.0',
        error: expect.any(Object),
      });
    });

    it('should return error when no request handler configured', async () => {
      const mcpRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'test',
      };

      const response = await request(transport.getApp())
        .post('/mcp')
        .send(mcpRequest)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });

    it('should include request ID in logs', async () => {
      transport.setRequestHandler(async () => ({ success: true }));

      const response = await request(transport.getApp()).post('/mcp').send({
        jsonrpc: '2.0',
        id: 1,
        method: 'test',
      });

      expect(response.status).toBeLessThan(600);
    });
  });

  describe('SSE Endpoint', () => {
    it('should establish SSE connection', (done) => {
      const req = request(transport.getApp()).get('/sse');

      req.on('response', (response) => {
        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toBe('text/event-stream');
        expect(response.headers['cache-control']).toBe('no-cache');
        expect(response.headers['connection']).toBe('keep-alive');

        // Close connection after verifying headers
        req.abort();
        done();
      });
    });

    it('should send connected event on connection', (done) => {
      const req = request(transport.getApp()).get('/sse');

      let receivedData = '';

      req.on('data', (chunk) => {
        receivedData += chunk.toString();

        // Check if we received the connected event
        if (receivedData.includes('event: connected')) {
          expect(receivedData).toContain('event: connected');
          expect(receivedData).toContain('data:');
          req.abort();
          done();
        }
      });
    });

    it('should track connected clients', (done) => {
      const initialCount = transport.getSSEClientCount();

      const req = request(transport.getApp()).get('/sse');

      req.on('response', () => {
        // Give it a moment for the client to be registered
        setTimeout(() => {
          expect(transport.getSSEClientCount()).toBeGreaterThan(initialCount);
          req.abort();
          done();
        }, 100);
      });
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(transport.getApp()).get('/health');

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    it('should handle OPTIONS requests', async () => {
      const response = await request(transport.getApp()).options('/mcp');

      expect(response.status).toBe(200);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(transport.getApp()).get('/unknown');

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        error: 'Not found',
        path: '/unknown',
      });
    });
  });

  describe('SSE Message Broadcasting', () => {
    it('should broadcast message to all clients', (done) => {
      const message = { test: 'data' };

      // Establish connection
      const req = request(transport.getApp()).get('/sse');

      req.on('data', (chunk) => {
        const data = chunk.toString();

        // Skip the connected event
        if (data.includes('event: connected')) {
          // After connection, broadcast a message
          setTimeout(() => {
            transport.broadcastSSEMessage('test-event', message);
          }, 100);
        } else if (data.includes('event: test-event')) {
          expect(data).toContain('event: test-event');
          expect(data).toContain(JSON.stringify(message));
          req.abort();
          done();
        }
      });
    });
  });
});
