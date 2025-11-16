/**
 * SkyFi MCP Server
 * Main entry point for the Model Context Protocol server
 */

import { createServer } from 'http';
import { config } from './server/config.js';
import { logger } from './server/logger.js';
import { MCPServerManager } from './server/mcp-server.js';

/**
 * Main server initialization
 */
function main() {
  logger.info('Starting SkyFi MCP Server...', {
    name: config.serverName,
    version: config.version,
    port: config.port,
    host: config.host,
  });

  // Create MCP server manager
  const mcpServer = new MCPServerManager();
  const transport = mcpServer.getTransport();

  // Create HTTP server
  const httpServer = createServer(transport.getApp());

  // Start listening
  httpServer.listen(config.port, config.host, () => {
    logger.info('SkyFi MCP Server started successfully', {
      port: config.port,
      host: config.host,
      endpoints: {
        health: `http://${config.host}:${config.port}/health`,
        mcp: `http://${config.host}:${config.port}/mcp`,
        sse: `http://${config.host}:${config.port}/sse`,
      },
    });
  });

  // Cleanup inactive SSE clients every 5 minutes
  setInterval(
    () => {
      transport.cleanupInactiveClients(30);
    },
    5 * 60 * 1000,
  );

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);

    httpServer.close(() => {
      logger.info('HTTP server closed');
    });

    await mcpServer.shutdown();
    process.exit(0);
  };

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
}

try {
  main();
} catch (error: unknown) {
  logger.error('Fatal error starting server', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  process.exit(1);
}
