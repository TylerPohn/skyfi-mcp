# SkyFi MCP Server

A Model Context Protocol (MCP) server implementation that enables AI agents to interact with SkyFi's geospatial data services seamlessly.

## Overview

The SkyFi MCP Server provides a standardized interface for AI agents to:

- Explore and search geospatial satellite imagery data
- Place orders with price confirmation workflows
- Set up area-of-interest (AOI) monitoring with webhooks
- Access previous orders and task history
- Integrate with various AI frameworks (Claude Code, LangChain, AI SDK)

## Features

- **Conversational Workflows**: Natural language interaction for complex geospatial tasks
- **Price Confirmation**: Multi-step order placement with transparent pricing
- **AOI Monitoring**: Automated notifications for new data in areas of interest
- **Multi-Framework Support**: Works with Claude Code, LangChain, Vercel AI SDK, and more
- **Type-Safe**: Built with TypeScript 5+ with strict mode enabled
- **Production-Ready**: Comprehensive logging, error handling, and testing

## Prerequisites

- Node.js 18.0.0 or higher
- npm or pnpm package manager
- SkyFi API key ([Get one here](https://www.skyfi.com))

## Installation

### Local Setup

1. Clone the repository:
```bash
git clone https://github.com/skyfi/skyfi-mcp-server.git
cd skyfi-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env and add your SKYFI_API_KEY
```

4. Build the project:
```bash
npm run build
```

5. Start the server:
```bash
npm start
```

### Development Mode

Run the server in development mode with hot-reload:

```bash
npm run dev
```

## Configuration

The server can be configured using environment variables. Copy `.env.example` to `.env` and configure:

```env
# Required
SKYFI_API_KEY=your_api_key_here

# Optional
NODE_ENV=development
LOG_LEVEL=info
SKYFI_API_BASE_URL=https://api.skyfi.com/v1
```

## Usage

### With Claude Code

Configure Claude Code to use the SkyFi MCP server by adding to your MCP configuration:

```json
{
  "mcpServers": {
    "skyfi": {
      "url": "http://localhost:3000",
      "apiKey": "${SKYFI_API_KEY}"
    }
  }
}
```

### With LangChain

```python
from skyfi_mcp_client import SkyFiMCPClient

client = SkyFiMCPClient(server_url="http://localhost:3000")
```

### With AI SDK (Vercel)

```typescript
import { SkyFiMCPClient } from '@skyfi/mcp-client';

const client = new SkyFiMCPClient({
  serverUrl: 'http://localhost:3000'
});
```

## Available Tools

The MCP server exposes the following tools:

- `search_geospatial_data`: Search for satellite imagery and geospatial data
- `check_order_feasibility`: Verify order feasibility and get pricing
- `place_order`: Place an order for geospatial data
- `setup_monitoring`: Configure AOI monitoring with webhooks
- `get_previous_orders`: Retrieve order history

See [API Documentation](./docs/api-reference.md) for detailed tool specifications.

## Development

### Project Structure

```
skyfi-mcp/
├── src/
│   ├── server/          # Server configuration and setup
│   ├── tools/           # MCP tool handlers
│   ├── api/             # SkyFi API client
│   ├── types/           # TypeScript type definitions
│   └── index.ts         # Main entry point
├── tests/               # Test files
├── docs/                # Documentation
└── dist/                # Compiled output
```

### Available Scripts

- `npm run dev` - Start development server with hot-reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Run TypeScript type checking

### Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Generate coverage report:

```bash
npm run test:coverage
```

### Code Quality

This project uses:

- **TypeScript** with strict mode for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Husky** for pre-commit hooks
- **Jest** for testing

Code quality checks run automatically on commit via pre-commit hooks.

## Architecture

See [Architecture Documentation](./docs/architecture.md) for detailed system design, component architecture, and integration patterns.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`npm test && npm run lint`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- Documentation: [https://docs.skyfi.com/mcp](https://docs.skyfi.com/mcp)
- Issues: [GitHub Issues](https://github.com/skyfi/skyfi-mcp-server/issues)
- Email: support@skyfi.com

## Acknowledgments

- Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)
- Powered by [SkyFi's Geospatial Data Platform](https://www.skyfi.com)

---

**Status**: This project is in active development. See [Project Roadmap](./docs/prd.md) for upcoming features.
