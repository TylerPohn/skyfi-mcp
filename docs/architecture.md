# SkyFi MCP Architecture Document

## 1. Executive Summary

The SkyFi MCP (Model Context Protocol) is a remote server implementation that enables AI agents to seamlessly interact with SkyFi's geospatial data services. This document outlines the technical architecture, component design, and integration patterns for the system.

## 2. System Overview

### 2.1 Purpose
Enable autonomous AI agents to:
- Explore and search geospatial data
- Place orders with price confirmation
- Set up area-of-interest (AOI) monitoring
- Access previous orders and task history
- Integrate with various AI frameworks (ADK, LangChain, AI SDK)

### 2.2 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI Agent Layer                               │
│  (Claude Code, LangChain Apps, AI SDK Applications)             │
└─────────────────────┬───────────────────────────────────────────┘
                      │ MCP Protocol
┌─────────────────────▼───────────────────────────────────────────┐
│                  SkyFi MCP Server                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Tool Handler │  │ Auth Manager │  │ State Manager│          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│  ┌──────▼──────────────────▼──────────────────▼───────┐          │
│  │            Core API Gateway                        │          │
│  └──────┬─────────────────────────────────────────────┘          │
└─────────┼──────────────────────────────────────────────┘
          │ HTTPS/REST
┌─────────▼──────────────────────────────────────────────┐
│                  SkyFi Public API                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │ Data Search│  │   Orders   │  │ Monitoring │       │
│  └────────────┘  └────────────┘  └────────────┘       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              Demo UI (Vercel Deployed)                           │
│         VITE/React Industry-Specific Use Cases                   │
└─────────────────────────────────────────────────────────────────┘
```

## 3. Component Architecture

### 3.1 MCP Server Core

**Responsibilities:**
- Implement MCP protocol specification
- Handle tool registration and discovery
- Manage stateless HTTP + SSE communication
- Route requests to appropriate handlers

**Key Components:**
- **Protocol Handler**: Manages MCP message parsing and response formatting
- **Tool Registry**: Maintains catalog of available tools and their schemas
- **Transport Layer**: Handles HTTP requests and Server-Sent Events (SSE)

**Technology:**
- Node.js/TypeScript runtime
- MCP SDK (@modelcontextprotocol/sdk)
- Express.js or similar for HTTP server

### 3.2 Tool Handlers

Each tool implements a specific capability:

#### 3.2.1 Data Search Tool
- **Purpose**: Enable iterative geospatial data exploration
- **Integration**: OpenStreetMaps for location context
- **Inputs**: Search parameters (coordinates, area, data types)
- **Outputs**: Available datasets with metadata

#### 3.2.2 Order Management Tool
- **Purpose**: Handle order placement with price confirmation
- **Features**:
  - Feasibility checking
  - Price calculation and confirmation
  - Order submission
  - Order history retrieval
- **Workflow**: Check feasibility → Get pricing → Confirm → Place order

#### 3.2.3 Monitoring Setup Tool
- **Purpose**: Configure AOI monitoring and notifications
- **Features**:
  - AOI definition
  - Webhook configuration
  - Notification preferences
  - Monitoring status checks

#### 3.2.4 Task Exploration Tool
- **Purpose**: Enable users to explore task feasibility and pricing
- **Outputs**: Available tasks, estimated costs, timeline estimates

### 3.3 Authentication & Authorization

**Authentication Flow:**
```
1. User provides API credentials (API key or OAuth token)
2. Credentials stored securely:
   - P0: Local environment variables or config file
   - P1: Cloud-based credential management (AWS Secrets Manager, etc.)
3. MCP server includes credentials in SkyFi API requests
4. Multi-user support (P1): Separate credential management per user
```

**Security Measures:**
- TLS/SSL for all communications
- API key rotation support
- Rate limiting per user/session
- Secure credential storage (encrypted at rest)

### 3.4 State Management

**Approach**: Stateless design with optional session caching

**Session Context:**
- Previous search results (for iterative exploration)
- Order draft state (before confirmation)
- User preferences and settings

**Storage Options:**
- P0: In-memory cache with TTL
- P1: Redis/DynamoDB for distributed sessions

### 3.5 Integration Layer

**SkyFi Public API Client:**
- RESTful API wrapper
- Request/response mapping
- Error handling and retry logic
- API versioning support

**OpenStreetMaps Integration:**
- Location geocoding
- Map visualization data
- Coordinate system conversion

**AI Framework Integrations:**
- **Claude Code**: Native MCP support
- **LangChain**: Tool integration via MCP adapter
- **AI SDK (Vercel)**: Custom tool definitions

## 4. Technology Stack

### 4.1 Backend (MCP Server)
- **Runtime**: Node.js 18+ / TypeScript 5+
- **Framework**: Express.js or Fastify
- **MCP SDK**: @modelcontextprotocol/sdk
- **API Client**: Axios or Fetch API
- **Validation**: Zod or Yup for schema validation

### 4.2 Frontend (Demo UI)
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **UI Library**: Tailwind CSS + shadcn/ui or Material-UI
- **State Management**: React Context API or Zustand
- **Maps**: Leaflet.js or Mapbox GL JS
- **API Client**: TanStack Query (React Query)

### 4.3 Infrastructure
- **Hosting**:
  - P0: Local server support
  - P1: Cloud deployment (AWS, GCP, or Azure)
- **Demo UI**: Vercel
- **Monitoring**: DataDog, New Relic, or CloudWatch
- **Logging**: Winston or Pino

### 4.4 Development & CI/CD
- **Version Control**: Git/GitHub
- **Package Manager**: npm or pnpm
- **Testing**: Jest, Vitest, Playwright
- **CI/CD**: GitHub Actions
- **Code Quality**: ESLint, Prettier, TypeScript strict mode

## 5. API Design

### 5.1 MCP Tools Specification

#### Tool: `search_geospatial_data`
```typescript
{
  name: "search_geospatial_data",
  description: "Search for available geospatial data in a specific area",
  inputSchema: {
    type: "object",
    properties: {
      location: {
        type: "object",
        properties: {
          latitude: { type: "number" },
          longitude: { type: "number" },
          radius_km: { type: "number" }
        }
      },
      data_types: {
        type: "array",
        items: { type: "string" }
      },
      date_range: {
        type: "object",
        properties: {
          start: { type: "string", format: "date" },
          end: { type: "string", format: "date" }
        }
      }
    },
    required: ["location"]
  }
}
```

#### Tool: `check_order_feasibility`
```typescript
{
  name: "check_order_feasibility",
  description: "Check if a data order is feasible and get pricing",
  inputSchema: {
    type: "object",
    properties: {
      dataset_id: { type: "string" },
      area_of_interest: { type: "object" },
      delivery_options: { type: "object" }
    },
    required: ["dataset_id", "area_of_interest"]
  }
}
```

#### Tool: `place_order`
```typescript
{
  name: "place_order",
  description: "Place an order for geospatial data (requires price confirmation)",
  inputSchema: {
    type: "object",
    properties: {
      order_details: { type: "object" },
      price_confirmation: { type: "number" },
      payment_method: { type: "string" }
    },
    required: ["order_details", "price_confirmation"]
  }
}
```

#### Tool: `setup_monitoring`
```typescript
{
  name: "setup_monitoring",
  description: "Set up monitoring for an area of interest with webhook notifications",
  inputSchema: {
    type: "object",
    properties: {
      area_of_interest: { type: "object" },
      monitoring_criteria: { type: "object" },
      webhook_url: { type: "string", format: "uri" },
      notification_preferences: { type: "object" }
    },
    required: ["area_of_interest", "webhook_url"]
  }
}
```

#### Tool: `get_previous_orders`
```typescript
{
  name: "get_previous_orders",
  description: "Retrieve user's previous orders and their status",
  inputSchema: {
    type: "object",
    properties: {
      limit: { type: "number", default: 10 },
      offset: { type: "number", default: 0 },
      status_filter: {
        type: "array",
        items: { type: "string" }
      }
    }
  }
}
```

### 5.2 SkyFi Public API Integration

**Base URL**: `https://api.skyfi.com/v1` (example)

**Key Endpoints:**
- `GET /datasets/search`: Search available datasets
- `POST /orders/feasibility`: Check order feasibility
- `POST /orders`: Create new order
- `GET /orders`: List user orders
- `GET /orders/{id}`: Get order details
- `POST /monitoring`: Create monitoring setup
- `GET /monitoring`: List monitoring configurations

## 6. Data Flow

### 6.1 Conversational Order Placement Flow

```
1. User asks AI: "I need satellite imagery of San Francisco from last week"
2. AI agent calls: search_geospatial_data(location: SF, date_range: last_week)
3. MCP server → SkyFi API /datasets/search
4. Results returned to AI agent
5. AI presents options to user
6. User selects dataset
7. AI calls: check_order_feasibility(dataset_id, aoi)
8. MCP server → SkyFi API /orders/feasibility
9. Price and feasibility returned
10. AI confirms price with user
11. User approves
12. AI calls: place_order(details, confirmed_price, payment_method)
13. MCP server → SkyFi API /orders (POST)
14. Order confirmation returned
15. AI notifies user of successful order
```

### 6.2 Monitoring Setup Flow

```
1. User: "Monitor this area for new imagery"
2. AI defines AOI from conversation context
3. AI calls: setup_monitoring(aoi, criteria, webhook_url)
4. MCP server validates webhook URL
5. MCP server → SkyFi API /monitoring (POST)
6. Monitoring ID and confirmation returned
7. When new data available:
   a. SkyFi API → Webhook URL (POST notification)
   b. User's system receives notification
   c. User informed via preferred channel
```

## 7. Security Architecture

### 7.1 Authentication & Authorization
- **API Key Management**: Secure storage and rotation
- **OAuth 2.0 Support**: For enterprise customers
- **Multi-tenant Isolation**: Separate credentials per user (P1)
- **Rate Limiting**: Per-user request throttling

### 7.2 Data Security
- **Encryption in Transit**: TLS 1.3 for all API communications
- **Encryption at Rest**: For stored credentials (P1)
- **PII Protection**: Minimal data retention, compliance with GDPR/CCPA
- **Audit Logging**: All order placements and configuration changes

### 7.3 Input Validation
- **Schema Validation**: All inputs validated against JSON schemas
- **Sanitization**: XSS and injection prevention
- **Rate Limiting**: DDoS protection

## 8. Deployment Architecture

### 8.1 Local Deployment (P0)

```
User's Machine
├── MCP Server (localhost:3000)
│   ├── Config file with API credentials
│   └── Local state/cache
└── AI Agent (Claude Code, local LangChain app)
    └── Connects to localhost:3000
```

**Setup:**
```bash
npm install -g skyfi-mcp-server
skyfi-mcp configure --api-key YOUR_API_KEY
skyfi-mcp start --port 3000
```

### 8.2 Cloud Deployment (P1)

```
┌─────────────────────────────────────────────┐
│         Load Balancer (AWS ALB)             │
└───────────────┬─────────────────────────────┘
                │
        ┌───────▼────────┐
        │  Auto Scaling  │
        │     Group      │
        └───────┬────────┘
                │
    ┌───────────┴───────────┐
    │                       │
┌───▼────┐            ┌────▼───┐
│  MCP   │            │  MCP   │
│ Server │            │ Server │
│   1    │            │   2    │
└───┬────┘            └────┬───┘
    │                      │
    └──────────┬───────────┘
               │
    ┌──────────▼──────────┐
    │   Shared Services   │
    ├─────────────────────┤
    │ Redis (Sessions)    │
    │ Secrets Manager     │
    │ CloudWatch Logs     │
    └─────────────────────┘
```

**Infrastructure as Code:**
- Terraform or AWS CDK for provisioning
- Docker containers for MCP server
- Kubernetes or ECS for orchestration

### 8.3 Demo UI Deployment

**Vercel Configuration:**
```javascript
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_MCP_SERVER_URL": "@mcp-server-url"
  }
}
```

**Features:**
- Continuous deployment from main branch
- Environment-specific configurations
- CDN distribution for static assets
- Analytics integration

## 9. Integration Patterns

### 9.1 Claude Code Integration

```json
// claude_code_config.json
{
  "mcpServers": {
    "skyfi": {
      "url": "http://localhost:3000",
      "apiKey": "${SKYFI_API_KEY}"
    }
  }
}
```

### 9.2 LangChain Integration

```python
from langchain.tools import Tool
from skyfi_mcp_client import SkyFiMCPClient

client = SkyFiMCPClient(server_url="http://localhost:3000")

tools = [
    Tool(
        name="search_geospatial_data",
        func=client.search_geospatial_data,
        description="Search for geospatial data"
    ),
    # ... other tools
]
```

### 9.3 AI SDK Integration

```typescript
import { tool } from 'ai';
import { SkyFiMCPClient } from '@skyfi/mcp-client';

const client = new SkyFiMCPClient({ serverUrl: 'http://localhost:3000' });

export const searchDataTool = tool({
  description: 'Search for geospatial data',
  parameters: z.object({
    location: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
  }),
  execute: async ({ location }) => client.searchGeospatialData(location),
});
```

## 10. Performance & Scalability

### 10.1 Performance Requirements
- **Response Time**: < 500ms for tool invocations (excluding SkyFi API time)
- **Throughput**: Support 100 concurrent requests per server instance
- **Availability**: 99.9% uptime for cloud deployment

### 10.2 Caching Strategy
- **Search Results**: Cache for 5 minutes
- **Pricing Data**: Cache for 1 hour
- **Order History**: Cache for 15 minutes
- **CDN**: Static assets cached at edge

### 10.3 Scalability Approach
- Horizontal scaling via load balancer
- Stateless server design for easy replication
- Database connection pooling
- Async processing for long-running tasks

## 11. Monitoring & Observability

### 11.1 Metrics
- **Request Metrics**: Request count, latency, error rate
- **Business Metrics**: Orders placed, searches performed, monitoring setups
- **System Metrics**: CPU, memory, disk usage
- **API Metrics**: SkyFi API response times, error rates

### 11.2 Logging
- **Structured Logging**: JSON format with correlation IDs
- **Log Levels**: DEBUG, INFO, WARN, ERROR
- **Retention**: 30 days for application logs, 90 days for audit logs

### 11.3 Alerting
- **Error Rate**: Alert if > 5% error rate
- **Latency**: Alert if p95 > 2 seconds
- **Availability**: Alert if uptime < 99%

## 12. Documentation & Developer Experience

### 12.1 Documentation Structure
```
docs/
├── getting-started.md
├── installation.md
├── configuration.md
├── api-reference.md
├── examples/
│   ├── claude-code.md
│   ├── langchain.md
│   └── ai-sdk.md
├── architecture.md (this document)
└── contributing.md
```

### 12.2 Demo Applications
- **Industry Use Case**: Real estate property analysis demo
- **Research Use Case**: Environmental monitoring demo
- **Enterprise Use Case**: Infrastructure planning demo

### 12.3 SDK/Client Libraries
- **JavaScript/TypeScript**: `@skyfi/mcp-client`
- **Python**: `skyfi-mcp-client`
- **Examples**: Comprehensive examples for each framework

## 13. Testing Strategy

### 13.1 Unit Tests
- Tool handlers
- API client
- Validation logic
- Authentication/authorization

### 13.2 Integration Tests
- MCP protocol compliance
- SkyFi API integration
- End-to-end tool workflows

### 13.3 E2E Tests
- Complete order placement flow
- Monitoring setup flow
- Multi-framework integration tests

### 13.4 Performance Tests
- Load testing with Artillery or k6
- Stress testing for concurrent requests
- API response time benchmarks

## 14. Compliance & Privacy

### 14.1 Data Protection
- **GDPR Compliance**: Data minimization, right to deletion
- **CCPA Compliance**: User data transparency and control
- **Data Retention**: Minimal retention policy

### 14.2 Security Standards
- **OWASP Top 10**: Protection against common vulnerabilities
- **SOC 2**: Compliance for enterprise customers (P1)
- **ISO 27001**: Information security management (P2)

## 15. Future Enhancements

### 15.1 Roadmap
- **Advanced AI Capabilities**: Multi-modal data analysis
- **Collaborative Features**: Shared workspaces for teams
- **Enhanced Analytics**: Usage insights and recommendations
- **Mobile Support**: Native mobile SDKs

### 15.2 Technical Debt Considerations
- Regular dependency updates
- Performance optimization based on metrics
- Code refactoring for maintainability
- Documentation updates

## 16. Appendices

### 16.1 Glossary
- **MCP**: Model Context Protocol - A standard for AI agent tool integration
- **AOI**: Area of Interest - Geographic region for monitoring or data requests
- **SSE**: Server-Sent Events - HTTP streaming protocol
- **Geospatial Data**: Data with geographic coordinates

### 16.2 References
- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [SkyFi Public API Documentation](https://docs.skyfi.com/api)
- [OpenStreetMap API](https://wiki.openstreetmap.org/wiki/API)

### 16.3 Version History
- **v1.0** - Initial architecture document
