/**
 * MCP Server Core
 * Initializes and manages the MCP server with HTTP/SSE transport
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { logger } from './logger.js';
import { config } from './config.js';
import { HTTPTransport } from './transport.js';
import {
  ProtocolHandler,
  BaseRequest,
  initializeRequestSchema,
  toolsListRequestSchema,
  toolsCallRequestSchema,
  MCPErrorCode,
} from './protocol.js';

/**
 * MCP Server Manager
 */
export class MCPServerManager {
  private server: Server;
  private transport: HTTPTransport;
  private protocolHandler: ProtocolHandler;
  private initialized: boolean = false;

  constructor() {
    this.protocolHandler = new ProtocolHandler();
    this.transport = new HTTPTransport();

    // Initialize MCP Server with capabilities
    this.server = new Server(
      {
        name: config.serverName,
        version: config.version,
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupHandlers();
  }

  /**
   * Setup MCP request handlers
   */
  private setupHandlers(): void {
    // Set request handler for HTTP transport
    this.transport.setRequestHandler((request: BaseRequest) => {
      return Promise.resolve(this.handleRequest(request));
    });
  }

  /**
   * Handle incoming MCP request
   */
  private handleRequest(request: BaseRequest): unknown {
    const method = request.method;

    logger.debug('Handling MCP request', {
      method,
      id: request.id,
    });

    try {
      switch (method) {
        case 'initialize':
          return this.handleInitialize(request);

        case 'tools/list':
          return this.handleToolsList(request);

        case 'tools/call':
          return this.handleToolsCall(request);

        case 'ping':
          return this.handlePing();

        default:
          throw this.createMethodNotFoundError(method);
      }
    } catch (error) {
      logger.error('Request handling failed', {
        method,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Handle initialize request
   */
  private handleInitialize(request: BaseRequest): unknown {
    const validatedRequest = this.protocolHandler.validateRequest(request, initializeRequestSchema);

    logger.info('Client initializing', {
      protocolVersion: validatedRequest.params.protocolVersion,
      clientInfo: validatedRequest.params.clientInfo,
    });

    this.initialized = true;

    return {
      protocolVersion: '1.0.0',
      serverInfo: {
        name: config.serverName,
        version: config.version,
      },
      capabilities: {
        tools: {},
      },
    };
  }

  /**
   * Handle tools/list request
   */
  private handleToolsList(request: BaseRequest): unknown {
    this.ensureInitialized();

    this.protocolHandler.validateRequest(request, toolsListRequestSchema);

    logger.debug('Listing available tools');

    // Tools will be registered in subsequent stories
    return {
      tools: [],
    };
  }

  /**
   * Handle tools/call request
   */
  private handleToolsCall(request: BaseRequest): unknown {
    this.ensureInitialized();

    const validatedRequest = this.protocolHandler.validateRequest(request, toolsCallRequestSchema);

    logger.info('Tool call requested', {
      toolName: validatedRequest.params.name,
    });

    // Tool implementations will be added in subsequent stories
    throw this.createMethodNotFoundError(`Tool not found: ${validatedRequest.params.name}`);
  }

  /**
   * Handle ping request
   */
  private handlePing(): unknown {
    return {
      status: 'pong',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Ensure server is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw this.createError(
        MCPErrorCode.INVALID_REQUEST,
        'Server not initialized. Call initialize first.',
      );
    }
  }

  /**
   * Create method not found error
   */
  private createMethodNotFoundError(method: string): Error {
    return this.createError(MCPErrorCode.METHOD_NOT_FOUND, `Method not found: ${method}`);
  }

  /**
   * Create error with code
   */
  private createError(code: MCPErrorCode, message: string): Error {
    const error = new Error(message);
    (error as Error & { code: number }).code = code;
    return error;
  }

  /**
   * Get HTTP transport instance
   */
  getTransport(): HTTPTransport {
    return this.transport;
  }

  /**
   * Get MCP server instance
   */
  getServer(): Server {
    return this.server;
  }

  /**
   * Check if server is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Shutdown server gracefully
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down MCP server...');
    await this.server.close();
    logger.info('MCP server shutdown complete');
  }
}
