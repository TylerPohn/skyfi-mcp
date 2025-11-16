# SkyFi MCP - Project Overview

## Mission
Build a comprehensive Model Context Protocol (MCP) server that enables AI agents to seamlessly access SkyFi's geospatial data services, positioning SkyFi as the default source for AI-driven geospatial data purchases.

## What We're Building

**SkyFi MCP Server** - A remote MCP server exposing SkyFi's public API as AI-friendly tools, enabling conversational geospatial data ordering, monitoring, and exploration.

**Demo UI** - A Vercel-deployed React/Vite application showcasing industry-specific use cases for the MCP integration.

## Core Capabilities (P0 Must-Haves)

1. **Conversational Data Search** - Iterative exploration of available geospatial datasets with OpenStreetMaps integration
2. **Order Placement with Price Confirmation** - Check feasibility, get pricing, confirm, and place orders conversationally
3. **AOI Monitoring** - Set up area-of-interest monitoring with webhook notifications
4. **Order History** - Access and explore previous orders
5. **Authentication & Payment** - Secure API key management and payment support
6. **MCP Protocol Compliance** - Stateless HTTP + SSE communication, local and remote hosting

## Technical Stack

### Backend (MCP Server)
- Node.js/TypeScript
- MCP SDK (@modelcontextprotocol/sdk)
- Express.js or Fastify
- Zod for validation

### Frontend (Demo UI)
- React 18+ with TypeScript
- Vite build tool
- Tailwind CSS + shadcn/ui
- Leaflet.js or Mapbox for maps
- TanStack Query for API state

### Infrastructure
- P0: Local server support
- P1: Cloud deployment (AWS/GCP/Azure)
- Vercel for demo UI
- GitHub Actions for CI/CD

## Five Core MCP Tools

1. `search_geospatial_data` - Search datasets by location, date range, data types
2. `check_order_feasibility` - Validate order feasibility and get pricing
3. `place_order` - Submit orders with price confirmation
4. `setup_monitoring` - Configure AOI monitoring with webhooks
5. `get_previous_orders` - Retrieve order history

## Integration Targets

- **Claude Code** - Native MCP support
- **LangChain** - Python/JS tool integration
- **AI SDK (Vercel)** - Tool definitions for AI applications

## Success Metrics

- 20% sales increase through AI-driven access
- 15% user base growth
- 500+ downloads and 4.5-star rating for demo agent
- Improved visibility in AI search results

## Key Architectural Decisions

- **Stateless Design** - In-memory caching with optional Redis for distributed sessions
- **Security First** - TLS 1.3, secure credential storage, OWASP compliance
- **Framework Agnostic** - Support multiple AI frameworks via MCP protocol
- **Cloud Ready** - Docker containers, auto-scaling, load balancing (P1)

## Project Structure

```
skyfi-mcp/
├── docs/              # Documentation
│   ├── prd.md        # Product requirements
│   ├── architecture.md # Technical architecture
│   └── project-overview.md # This file
├── stories/          # BMad user stories
├── src/
│   ├── server/       # MCP server implementation
│   ├── tools/        # MCP tool handlers
│   ├── api/          # SkyFi API client
│   └── types/        # TypeScript types
├── frontend/         # React/Vite demo UI
└── tests/            # Test suites
```

## Development Approach

Using **BMad methodology** with three agents:
- **@sm-scrum** - Creates and refines user stories
- **@dev** - Implements features
- **@qa-quality** - Reviews and validates implementations

Stories progress: Draft → Ready for Development → Ready for Review → Done

## Current Phase

**Initialization** - Setting up orchestration, creating first epic of stories for foundational MCP server implementation.
