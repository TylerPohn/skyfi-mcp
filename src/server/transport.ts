/**
 * HTTP and SSE Transport Layer
 * Handles HTTP requests and Server-Sent Events for MCP communication
 */

import express, { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logger } from './logger.js';
import { config } from './config.js';
import { ProtocolHandler, BaseRequest, MCPErrorCode } from './protocol.js';

/**
 * SSE Client Connection
 */
interface SSEClient {
  id: string;
  response: Response;
  lastActivity: Date;
}

/**
 * HTTP/SSE Transport Layer
 */
export class HTTPTransport {
  private app: express.Application;
  private protocolHandler: ProtocolHandler;
  private sseClients: Map<string, SSEClient>;
  private requestHandler?: (request: BaseRequest) => Promise<unknown>;

  constructor() {
    this.app = express();
    this.protocolHandler = new ProtocolHandler();
    this.sseClients = new Map();
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Set the request handler for MCP requests
   */
  setRequestHandler(handler: (request: BaseRequest) => Promise<unknown>) {
    this.requestHandler = handler;
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Parse JSON bodies
    this.app.use(express.json());

    // Request logging middleware
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      const requestId = randomUUID();
      req.headers['x-request-id'] = requestId;

      logger.info('Incoming request', {
        requestId,
        method: req.method,
        path: req.path,
        ip: req.ip,
      });

      next();
    });

    // CORS middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }

      next();
    });
  }

  /**
   * Setup HTTP routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        name: config.serverName,
        version: config.version,
        timestamp: new Date().toISOString(),
      });
    });

    // MCP message endpoint
    this.app.post('/mcp', (req: Request, res: Response) => {
      void (async () => {
        const requestId = req.headers['x-request-id'] as string;

        try {
          // Validate request body
          if (!req.body) {
            throw new Error('Request body is required');
          }

          // Parse and validate MCP request
          const mcpRequest = this.protocolHandler.parseMessage(JSON.stringify(req.body));

          logger.debug('Processing MCP request', {
            requestId,
            method: mcpRequest.method,
          });

          // Handle the request
          if (!this.requestHandler) {
            throw new Error('Request handler not configured');
          }

          const result = await this.requestHandler(mcpRequest);

          // Create success response
          const response = this.protocolHandler.createSuccessResponse(mcpRequest.id, result);

          logger.debug('MCP request successful', {
            requestId,
            method: mcpRequest.method,
          });

          res.json(response);
        } catch (error) {
          logger.error('MCP request failed', {
            requestId,
            error: error instanceof Error ? error.message : String(error),
          });

          // Determine error code and message
          let errorCode = MCPErrorCode.INTERNAL_ERROR;
          let errorMessage = 'Internal server error';

          if (error instanceof Error) {
            errorMessage = error.message;
            if ('code' in error && typeof error.code === 'number') {
              errorCode = error.code;
            }
          }

          let requestId: string | number | null = null;
          if (req.body && typeof req.body === 'object' && 'id' in req.body) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            requestId = req.body.id as unknown as string | number;
          }
          const errorResponse = this.protocolHandler.createErrorResponse(
            requestId,
            errorCode,
            errorMessage,
            error instanceof Error ? error.stack : undefined,
          );

          res.status(500).json(errorResponse);
        }
      })();
    });

    // SSE endpoint for streaming
    this.app.get('/sse', (req: Request, res: Response) => {
      const clientId = randomUUID();

      // Set SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      // Store client connection
      const client: SSEClient = {
        id: clientId,
        response: res,
        lastActivity: new Date(),
      };
      this.sseClients.set(clientId, client);

      logger.info('SSE client connected', { clientId });

      // Send initial connection event
      this.sendSSEMessage(clientId, 'connected', {
        clientId,
        timestamp: new Date().toISOString(),
      });

      // Handle client disconnect
      req.on('close', () => {
        this.sseClients.delete(clientId);
        logger.info('SSE client disconnected', { clientId });
      });

      // Keep-alive ping every 30 seconds
      const keepAliveInterval = setInterval(() => {
        if (!this.sseClients.has(clientId)) {
          clearInterval(keepAliveInterval);
          return;
        }

        this.sendSSEMessage(clientId, 'ping', {
          timestamp: new Date().toISOString(),
        });
      }, 30000);
    });

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not found',
        path: req.path,
      });
    });

    // Error handling middleware
    this.app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
      logger.error('Express error handler', {
        error: err.message,
        stack: err.stack,
        path: req.path,
      });

      res.status(500).json({
        error: 'Internal server error',
        message: err.message,
      });
    });
  }

  /**
   * Send SSE message to a specific client
   */
  sendSSEMessage(clientId: string, event: string, data: unknown): boolean {
    const client = this.sseClients.get(clientId);
    if (!client) {
      return false;
    }

    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    client.response.write(message);
    client.lastActivity = new Date();

    return true;
  }

  /**
   * Broadcast SSE message to all clients
   */
  broadcastSSEMessage(event: string, data: unknown): void {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

    this.sseClients.forEach((client) => {
      client.response.write(message);
      client.lastActivity = new Date();
    });

    logger.debug('SSE broadcast sent', {
      event,
      clientCount: this.sseClients.size,
    });
  }

  /**
   * Get Express app instance
   */
  getApp(): express.Application {
    return this.app;
  }

  /**
   * Get connected SSE clients count
   */
  getSSEClientCount(): number {
    return this.sseClients.size;
  }

  /**
   * Clean up inactive SSE clients
   */
  cleanupInactiveClients(maxInactiveMinutes: number = 30): void {
    const now = new Date();
    const removedClients: string[] = [];

    this.sseClients.forEach((client, clientId) => {
      const inactiveMinutes = (now.getTime() - client.lastActivity.getTime()) / 1000 / 60;

      if (inactiveMinutes > maxInactiveMinutes) {
        client.response.end();
        this.sseClients.delete(clientId);
        removedClients.push(clientId);
      }
    });

    if (removedClients.length > 0) {
      logger.info('Cleaned up inactive SSE clients', {
        count: removedClients.length,
        clientIds: removedClients,
      });
    }
  }
}
