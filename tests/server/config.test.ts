/**
 * Tests for server configuration
 */

import { config } from '../../src/server/config';

describe('Server Config', () => {
  it('should load configuration with defaults', () => {
    expect(config).toBeDefined();
    expect(config.serverName).toBe('skyfi-mcp-server');
    expect(config.version).toBeDefined();
  });

  it('should have required configuration fields', () => {
    expect(config.nodeEnv).toBeDefined();
    expect(config.logLevel).toBeDefined();
    expect(config.skyfiApiBaseUrl).toBeDefined();
  });

  it('should have valid log level', () => {
    expect(['debug', 'info', 'warn', 'error']).toContain(config.logLevel);
  });
});
