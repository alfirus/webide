# Technology Stack

## Overview

The WebIDE technology stack is carefully selected to provide professional-grade development capabilities while maintaining scalability, performance, and extensibility.

## Frontend Stack

### Core Framework

**React 18 + TypeScript**
- **Why**: Industry standard with massive ecosystem
- **Version**: 18.x (with concurrent rendering)
- **Benefits**:
  - Component-based UI architecture
  - Virtual DOM for efficient rendering
  - Strong TypeScript integration
  - Extensive community libraries
- **Key Libraries**:
  - `react@18.x` - UI framework
  - `react-dom@18.x` - DOM rendering
  - `typescript` - Type safety

### State Management

**Zustand**
- **Why**: Lightweight, unopinionated, TypeScript-first
- **Use cases**:
  - Editor state (current file, unsaved changes)
  - Terminal state (active terminal, output)
  - UI state (sidebar visibility, theme)
  - User preferences (language, font size)
- **Alternative considered**: Redux (too verbose for this use case)

**TanStack Query (React Query)**
- **Why**: Industry-standard server state management
- **Use cases**:
  - File listing and metadata
  - User session data
  - API response caching
  - Automatic refetching and invalidation
  - Optimistic updates for file operations
- **Benefits**:
  - Synchronization with server state
  - Built-in caching and background refetching
  - Request deduplication
  - Devtools for debugging

### Code Editor

**Monaco Editor**
- **Why**: Battle-tested, feature-complete, used by VS Code
- **Version**: Latest (`monaco-editor@latest`)
- **Features included**:
  - Syntax highlighting (100+ languages)
  - Code folding and regions
  - Multicursor editing
  - Search and replace with regex
  - IntelliSense (with LSP integration)
  - Accessibility features (ARIA, screen readers)
  - Minimap and breadcrumbs
  - Customizable themes
  - Keyboard shortcuts
  - Performance optimized for large files
- **Integration**:
  - LSP protocol for language features
  - Custom providers for code completion
  - Diagnostic markers for errors/warnings
  - Command palette integration
  - Settings synchronization

### Terminal Component

**xterm.js**
- **Why**: Full-featured, standards-compliant terminal emulator
- **Version**: Latest (`xterm@latest`)
- **Features**:
  - ANSI color support
  - Web worker for heavy computation
  - Addon system (search, fit, web links, etc.)
  - Bell sound and Unicode support
  - Customizable fonts and themes
  - Efficient rendering algorithm
- **Configuration**:
  - WebSocket connection to backend
  - UTF-8 encoding
  - 24-bit true color support
  - Bell enabled for alerts

### UI Component Library

**shadcn/ui + Tailwind CSS**
- **Why**: Modern, customizable, accessible components
- **Stack**:
  - `@radix-ui/*` - Unstyled, accessible components
  - `class-variance-authority` - Component styling utility
  - `tailwindcss@latest` - Utility-first CSS
  - `tailwindcss-animate` - Animation utilities
- **Components needed**:
  - Buttons, dropdowns, menus
  - Dialogs, modals, popovers
  - Tabs, accordions
  - Input fields, textareas
  - Sliders, switches
  - Toast notifications
  - Command palette (cmdk)
  - Data tables (React Table)

### Real-time Communication

**WebSocket API (Native)**
- **Why**: Built into modern browsers, no external dependency overhead
- **Use cases**:
  - Terminal input/output streaming
  - AI chat messages
  - File change notifications
  - Collaborative editing (future)
  - Live code execution output
- **Implementation**:
  - Native WebSocket API (no Socket.io overhead)
  - Automatic reconnection logic
  - Message queuing during disconnection
  - Ping/pong for keep-alive

### Build Tool

**Vite**
- **Why**: Modern, fast build tool with excellent DX
- **Version**: Latest (`vite@latest`)
- **Features used**:
  - HMR (Hot Module Replacement) for development
  - Code splitting for lazy loading
  - Tree shaking for optimized bundles
  - CSS preprocessing (SCSS/PostCSS)
  - Asset optimization
  - Source maps for debugging
- **Configuration**:
  ```typescript
  export default defineConfig({
    plugins: [react(), tsconfigPaths()],
    build: {
      target: 'ES2020',
      minify: 'terser',
      sourcemap: true,
      outDir: 'dist',
    },
    server: {
      proxy: {
        '/api': 'http://localhost:3001'
      }
    }
  })
  ```

### Development Dependencies

```json
{
  "devDependencies": {
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x",
    "@typescript-eslint/eslint-plugin": "^6.x",
    "@typescript-eslint/parser": "^6.x",
    "eslint": "^8.x",
    "eslint-config-prettier": "^9.x",
    "eslint-plugin-react": "^7.x",
    "prettier": "^3.x",
    "typescript": "^5.x",
    "vite": "^5.x"
  }
}
```

## Backend Stack

### Runtime & Framework

**Node.js 20+ LTS**
- **Why**: Stable, widely supported, proven in production
- **Benefits**:
  - Event-driven, non-blocking I/O
  - NPM ecosystem (millions of packages)
  - Strong TypeScript support
  - Good performance for I/O-heavy tasks
  - Easy deployment and tooling

**Hono**
- **Why**: Lightweight, OpenCode compatible, excellent TypeScript support
- **Version**: Latest (`hono@latest`)
- **Why Hono over Express**:
  - Lighter weight (perfect for serverless)
  - Better TypeScript support
  - Built-in middleware ecosystem
  - Used by OpenCode SDK
  - RPC capabilities for type-safe client-server
- **Features used**:
  - Middleware system (auth, logging, error handling)
  - Router for REST API
  - WebSocket handler
  - Parameter validation
  - CORS handling
  - Static file serving

### Database

**PostgreSQL**
- **Why**: Reliable, feature-rich, ACID-compliant
- **Version**: 14+ (or managed service like AWS RDS, Azure Database)
- **Use cases**:
  - User accounts and authentication
  - Project and workspace metadata
  - Session management
  - Audit logs
  - Configuration storage
- **Libraries**:
  - `pg` - Native PostgreSQL driver
  - Or `prisma` - ORM for type safety
  - `node-pg-migrate` - Migration tool

**Redis**
- **Why**: High-performance cache and session store
- **Version**: 7.x
- **Use cases**:
  - Session caching (JWT validation)
  - File metadata cache
  - Rate limiting counters
  - WebSocket connection tracking
  - Ephemeral data storage
- **Library**: `redis` - Official Redis client for Node.js

### File Management

**Local Filesystem (Phase 1)**
- User projects stored in `/workspaces/{userId}/{projectId}/`
- Efficient streaming for large files
- File watching with `chokidar` for change detection

**Cloud Storage (Phase 2)**
- AWS S3, Azure Blob Storage, or Google Cloud Storage
- Client: `@aws-sdk/client-s3`, `@azure/storage-blob`, etc.
- Benefits: Scalability, durability, CDN integration

### Code Execution

**Docker + Docker SDK**
- **Why**: Secure, isolated execution environment
- **Library**: `dockerode` - Docker API client for Node.js
- **Capabilities**:
  - Container creation and management
  - Resource limit enforcement (CPU, memory)
  - Network isolation
  - Volume mounting for file access
  - Stream-based I/O for output
  - Automatic cleanup and garbage collection

**Pre-built Docker Images**
- Node.js runtime image (with npm)
- Python runtime image (with pip)
- Go, Rust, Java runtimes (as needed)
- Base image: Alpine Linux (minimal, ~5MB)

### Language Server Protocol

**Multiple LSP Servers**
- TypeScript/JavaScript: `typescript-language-server`
- Python: `pylsp` or `jedi-language-server`
- Go: `gopls`
- Rust: `rust-analyzer`
- General: `vscode-langservers-extracted` (JSON, CSS, HTML)

**LSP Client Library**: `vscode-languageclient` or similar

### AI Integration

**OpenCode SDK**
- **Package**: `@opencode/sdk` (install when available)
- **Features**:
  - Multi-model routing
  - Tool execution
  - Session management
  - Permission handling
  - MCP integration

### MCP Protocol

**MCP Implementation**
- TypeScript SDK: `@modelcontextprotocol/sdk`
- Features:
  - Client and server implementation
  - Tool definitions and execution
  - Resource management
  - Sampling and prompts
  - Standard error handling

### Utilities & Middleware

**Authentication & Security**
- `jsonwebtoken` - JWT generation and verification
- `bcrypt` - Password hashing
- `helmet` - Security headers
- `cors` - CORS middleware
- `dotenv` - Environment variable management

**Validation & Data**
- `zod` - Schema validation
- `joi` - Data validation (alternative)
- JSON Schema validation for API specs

**Logging & Monitoring**
- `pino` - Fast JSON logger
- Or `winston` - Flexible logging
- `pino-pretty` - Pretty-print logs in development
- Structured logging for production

**Error Handling**
- Custom error classes
- Global error handler middleware
- Sentry integration (optional)

**File Processing**
- `chokidar` - File system watcher
- `ignore` - Gitignore pattern matching
- `mime-types` - MIME type detection
- `tar` - Archive creation (backups)

### Development Tools

```json
{
  "devDependencies": {
    "@types/node": "^20.x",
    "@typescript-eslint/eslint-plugin": "^6.x",
    "@typescript-eslint/parser": "^6.x",
    "eslint": "^8.x",
    "nodemon": "^3.x",
    "prettier": "^3.x",
    "tsx": "^4.x",
    "typescript": "^5.x"
  }
}
```

## Infrastructure & Deployment

### Containerization

**Docker**
- Dockerfile for backend service
- Dockerfile for frontend (Node build + nginx)
- Multi-stage builds for optimization
- Health checks and signal handling

**Docker Compose** (Development)
- Backend service (Node.js)
- PostgreSQL database
- Redis cache
- Frontend dev server (optional)
- Volume mounts for development

### Container Registry

**Docker Hub or Cloud Registry**
- Store built images
- Version tagging strategy
- Automated builds on commit (CI/CD)

### Orchestration Options

**Phase 1 - Single Server**: Docker Compose on single VPS
**Phase 2 - Scale**: Kubernetes cluster
- Container orchestration
- Auto-scaling based on metrics
- Rolling updates
- Self-healing

**Cloud Platforms**:
- AWS: ECS + RDS + ElastiCache
- Google Cloud: GKE + Cloud SQL + Memorystore
- Azure: AKS + Database for PostgreSQL + Azure Cache for Redis

### Networking

**Load Balancer**
- Distribute traffic across backend instances
- SSL/TLS termination
- Health checks

**API Gateway** (Optional)
- Rate limiting
- Request validation
- Authentication
- Monitoring

### Monitoring & Logging

**Prometheus** - Metrics collection
- Node.js application metrics
- PostgreSQL metrics
- Redis metrics
- Custom business metrics

**ELK Stack or Datadog**
- Centralized logging
- Log aggregation and search
- Alerts on errors
- Performance monitoring

### CI/CD Pipeline

**GitHub Actions** (if using GitHub)
- Lint and test on PR
- Build Docker images
- Push to registry
- Deploy to staging/production

## Summary: Tech Stack Overview

| Layer | Component | Technology | Why |
|-------|-----------|-----------|-----|
| **Frontend** | Framework | React 18 + TypeScript | Industry standard, large ecosystem |
| | Editor | Monaco Editor | VS Code quality, feature-complete |
| | Terminal | xterm.js | Full-featured terminal emulation |
| | State | Zustand + TanStack Query | Lightweight, performant, DX |
| | UI Components | shadcn/ui + Tailwind | Modern, accessible, customizable |
| | Real-time | Native WebSocket | No dependency, built-in support |
| | Build | Vite | Fast, modern, excellent HMR |
| **Backend** | Runtime | Node.js 20+ | Event-driven, non-blocking I/O |
| | Framework | Hono | Lightweight, OpenCode compatible |
| | Database | PostgreSQL | ACID, reliable, feature-rich |
| | Cache | Redis | High-performance, session store |
| | Execution | Docker | Safe, isolated code execution |
| | LSP | Multiple servers | Language-specific intelligence |
| | AI | OpenCode SDK | Multi-model agent orchestration |
| | MCP | @modelcontextprotocol/sdk | Standard tool integration protocol |
| **DevOps** | Containers | Docker + Compose | Development and deployment |
| | Orchestration | Kubernetes (Phase 2+) | Production scaling |
| | Logging | Pino + ELK/Datadog | Structured, centralized logging |
| | Monitoring | Prometheus | Metrics and alerting |

## Installation Commands

### Frontend
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install react-router-dom zustand @tanstack/react-query
npm install monaco-editor xterm
npm install -D tailwindcss postcss autoprefixer
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react
```

### Backend
```bash
mkdir backend && cd backend
npm init -y
npm install hono @hono/node-server dotenv
npm install pg redis zod
npm install jsonwebtoken bcrypt helmet cors
npm install pino pino-pretty
npm install dockerode chokidar mime-types
npm install -D typescript @types/node ts-node nodemon
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

## Version Lock Strategy

- Use exact versions for critical dependencies (e.g., `hono@0.x.y`)
- Use semver ranges for flexible dependencies (e.g., `^6.x`)
- Lock file (`package-lock.json` or `yarn.lock`) committed to version control
- Monthly dependency update reviews
- Automated security scanning (Dependabot)
