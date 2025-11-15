/**
 * SkyFi MCP Server
 * Main entry point for the Model Context Protocol server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config } from './server/config.js';
import { logger } from './server/logger.js';

/**
 * Main server initialization
 */
async function main() {
  logger.info('Starting SkyFi MCP Server...');

  const server = new Server(
    {
      name: 'skyfi-mcp-server',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // Server initialization will be implemented in subsequent stories
  logger.info('SkyFi MCP Server initialized', {
    name: config.serverName,
    version: config.version,
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('SkyFi MCP Server connected and ready');
}

main().catch((error: unknown) => {
  logger.error('Fatal error starting server', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
