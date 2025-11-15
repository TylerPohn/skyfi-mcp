# Contributing to SkyFi MCP Server

Thank you for your interest in contributing to the SkyFi MCP Server! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or pnpm
- Git
- A SkyFi API key for testing

### Setup Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/skyfi-mcp-server.git
   cd skyfi-mcp-server
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   # Add your SKYFI_API_KEY
   ```

5. Run tests to verify setup:
   ```bash
   npm test
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names following these patterns:

- `feature/description` - For new features
- `fix/description` - For bug fixes
- `docs/description` - For documentation updates
- `refactor/description` - For code refactoring
- `test/description` - For adding or updating tests

### Making Changes

1. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the code style guidelines

3. Write or update tests for your changes

4. Run the test suite and linting:
   ```bash
   npm test
   npm run lint
   npm run typecheck
   ```

5. Commit your changes with clear, descriptive messages:
   ```bash
   git commit -m "Add feature: description of what was added"
   ```

### Commit Message Guidelines

Write clear, concise commit messages that explain:

- **What** changed
- **Why** it changed (if not obvious)

Format:
```
<type>: <short description>

<optional longer description>
<optional footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat: add monitoring setup tool handler

Implements the setup_monitoring tool for configuring AOI monitoring
with webhook notifications.

Closes #123
```

```
fix: handle API timeout errors gracefully

Adds retry logic and better error messages for timeout scenarios.
```

## Code Style

### TypeScript Guidelines

- Use TypeScript strict mode (already configured)
- Prefer `interface` over `type` for object types
- Use explicit return types for functions
- Avoid `any` - use `unknown` if type is truly unknown
- Use async/await over Promise chains

### Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `order-handler.ts`)
- **Classes**: `PascalCase` (e.g., `OrderHandler`)
- **Functions/Variables**: `camelCase` (e.g., `handleOrder`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`)
- **Interfaces**: `PascalCase` (e.g., `OrderRequest`)

### Code Organization

- One class/interface per file (generally)
- Group related functionality in directories
- Keep functions small and focused
- Write self-documenting code with clear variable names
- Add comments for complex logic, not obvious code

### Formatting

Code formatting is handled automatically by Prettier. Run:

```bash
npm run format
```

Pre-commit hooks will also format your code automatically.

## Testing

### Writing Tests

- Write tests for all new features and bug fixes
- Place tests in the `tests/` directory, mirroring the source structure
- Name test files with `.test.ts` suffix
- Use descriptive test names that explain what is being tested

Example:
```typescript
describe('OrderHandler', () => {
  describe('placeOrder', () => {
    it('should place order when price is confirmed', async () => {
      // Test implementation
    });

    it('should reject order when price does not match', async () => {
      // Test implementation
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Test Coverage

We aim for high test coverage (>80%). Check coverage reports after running tests.

## Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Document complex algorithms or business logic
- Keep comments up-to-date with code changes

Example:
```typescript
/**
 * Places an order for geospatial data
 * @param orderDetails - Details of the order to place
 * @param confirmedPrice - Price confirmed by the user
 * @returns Order confirmation with ID and status
 * @throws {PriceMismatchError} If confirmed price doesn't match calculated price
 */
async function placeOrder(
  orderDetails: OrderDetails,
  confirmedPrice: number
): Promise<OrderConfirmation> {
  // Implementation
}
```

### README and Docs

- Update README.md if adding new features or changing setup
- Add or update docs in `docs/` directory for significant changes
- Include examples for new functionality

## Pull Request Process

### Before Submitting

1. Ensure all tests pass
2. Ensure linting passes
3. Update documentation if needed
4. Rebase on latest `main` if necessary

### Submitting a Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Open a Pull Request on GitHub

3. Fill out the PR template with:
   - Clear description of changes
   - Related issue numbers
   - Testing performed
   - Screenshots (if UI changes)

4. Request review from maintainers

### PR Review Process

- Maintainers will review your PR
- Address any feedback or requested changes
- Once approved, maintainers will merge your PR

### After Merge

- Delete your feature branch
- Pull latest changes from `main`

## Issue Reporting

### Bug Reports

Include:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node version, OS, etc.)
- Error messages or logs

### Feature Requests

Include:
- Clear description of the feature
- Use case and motivation
- Proposed implementation (if any)
- Examples or mockups (if applicable)

## Project Structure

```
skyfi-mcp-server/
├── src/
│   ├── server/          # Server configuration and core
│   ├── tools/           # MCP tool implementations
│   ├── api/             # SkyFi API client
│   ├── types/           # TypeScript type definitions
│   └── index.ts         # Main entry point
├── tests/               # Test files
├── docs/                # Documentation
├── .github/             # GitHub workflows and templates
└── dist/                # Compiled output (gitignored)
```

## Questions?

If you have questions about contributing:

- Check existing issues and discussions
- Open a new issue for discussion
- Reach out to maintainers

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing to SkyFi MCP Server!
