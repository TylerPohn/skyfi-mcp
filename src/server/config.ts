/**
 * Server configuration
 * Loads and validates environment variables and configuration
 */

import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

/**
 * Configuration schema
 */
const configSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  serverName: z.string().default('skyfi-mcp-server'),
  version: z.string().default('0.1.0'),
  port: z.number().int().positive().default(3000),
  host: z.string().default('0.0.0.0'),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  skyfiApiKey: z.string().optional(),
  skyfiApiBaseUrl: z.string().url().default('https://api.skyfi.com/v1'),
});

/**
 * Configuration type
 */
export type Config = z.infer<typeof configSchema>;

/**
 * Load and validate configuration
 */
function loadConfig(): Config {
  const rawConfig = {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    serverName: process.env.SERVER_NAME ?? 'skyfi-mcp-server',
    version: process.env.npm_package_version ?? '0.1.0',
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    host: process.env.HOST ?? '0.0.0.0',
    logLevel: process.env.LOG_LEVEL ?? 'info',
    skyfiApiKey: process.env.SKYFI_API_KEY,
    skyfiApiBaseUrl: process.env.SKYFI_API_BASE_URL ?? 'https://api.skyfi.com/v1',
  };

  return configSchema.parse(rawConfig);
}

/**
 * Application configuration
 */
export const config = loadConfig();
