# System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEBIDE SYSTEM ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────┐      ┌──────────────────────────┐ │
│  │     FRONTEND LAYER       │      │    BACKEND LAYER         │ │
│  ├──────────────────────────┤      ├──────────────────────────┤ │
│  │                          │      │                          │ │
│  │  Monaco Editor Component │      │  Hono HTTP Server        │ │
│  │  File Explorer UI        │      │  ├─ Auth Routes         │ │
│  │  Terminal (xterm.js)     │◄────►│  ├─ File Routes         │ │
│  │  Chat/AI Panel           │ REST │  ├─ Session Routes      │ │
│  │  Sidebar & Workbench     │ HTTP │  ├─ Execution Routes    │ │
│  │  Settings & Themes       │ WS   │  └─ MCP Bridge Routes   │ │
│  │                          │      │                          │ │
│  │  React 18 + TypeScript   │      │  Service Layer:          │ │
│  │  Zustand Store           │      │  ├─ FileManager         │ │
│  │  TanStack Query          │      │  ├─ SessionManager      │ │
│  │  Vite Build              │      │  ├─ AuthService         │ │
│  │                          │      │  ├─ CodeExecutor        │ │
│  └──────────────────────────┘      │  ├─ LSPManager          │ │
│         │                          │  ├─ MCPBridge           │ │
│         │                          │  └─ OpenCodeAgent       │ │
│         │                          │                          │ │
│         │                          └─────────┬────────────────┘ │
│         │                                    │                   │
│         │         ┌──────────────────────────┼────────────────┐ │
│         │         │                          │                │ │
│         │    ┌────▼─────┐  ┌───────────┐ ┌──▼──────────┐      │ │
│         │    │PostgreSQL│  │File System│ │Docker       │      │ │
│         │    │ Database │  │Local/S3   │ │Containers   │      │ │
│         │    │          │  │           │ │             │      │ │
│         │    │Users     │  │Projects   │ │Code Exec    │      │ │
│         │    │Sessions  │  │Files      │ │Sandbox      │      │ │
│         │    │Projects  │  │Metadata   │ │             │      │ │
│         │    └──────────┘  └───────────┘ └─────────────┘      │ │
│         │         │              │              │               │ │
│         └─────────┴──────────────┴──────────────┘               │ │
│                    Storage & Execution Layer                    │ │
│                                                                   │
│  ┌──────────────────────────┬──────────────────────────────┐   │
│  │   AI & EXTENSION LAYER   │   SUPPORT SERVICES           │   │
│  ├──────────────────────────┼──────────────────────────────┤   │
│  │                          │                              │   │
│  │  OpenCode SDK            │  LSP Servers                 │   │
│  │  ├─ Multi-model agent    │  ├─ TypeScript/JavaScript   │   │
│  │  ├─ Tool execution       │  ├─ Python                  │   │
│  │  ├─ Session management   │  ├─ Go                      │   │
│  │  └─ Provider routing     │  └─ Other languages         │   │
│  │                          │                              │   │
│  │  MCP Bridge              │  Redis Cache                 │   │
│  │  ├─ Client impl.         │  ├─ Session cache           │   │
│  │  ├─ Server discovery     │  ├─ File metadata           │   │
│  │  ├─ Tool mapping         │  └─ Rate limiting           │   │
│  │  └─ code-master-ai-brain │                              │   │
│  │                          │  External APIs              │   │
│  │  Logging & Monitoring    │  ├─ LLM providers (Claude)  │   │
│  │  ├─ Winston/Pino         │  ├─ Search services         │   │
│  │  ├─ Prometheus metrics   │  └─ Documentation APIs      │   │
│  │  └─ Error tracking       │                              │   │
│  │                          │                              │   │
│  └──────────────────────────┴──────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### Frontend Architecture

#### Editor Component (`/src/components/Editor/`)
- **Monaco.tsx**: Monaco Editor instance configuration
  - Language detection
  - Theme management
  - Keyboard shortcuts
  - Extensions

- **EditorActions.tsx**: Editor toolbar and command palette
  - Save/Export actions
  - Format/Lint commands
  - Git integration (future)

- **EditorSettings.tsx**: Editor preferences UI
  - Font size, family, theme
  - Tab size, EOL character
  - Word wrap, minimap settings

#### Terminal Component (`/src/components/Terminal/`)
- **XTerm.tsx**: xterm.js wrapper with WebSocket connection
  - Output streaming
  - Input handling
  - ANSI color support

- **TerminalManager.tsx**: Multi-terminal support
  - Tab management
  - Session persistence
  - Process lifecycle

#### File Explorer (`/src/components/Explorer/`)
- **FileTree.tsx**: Recursive directory tree view
  - Drag-and-drop support
  - Context menu operations
  - Git status indicators

- **FileSearch.tsx**: Project-wide file search
  - Regex support
  - Results highlighting

- **FileOperations.tsx**: CRUD operations
  - Create/Delete/Rename files
  - Directory management

#### Chat/AI Panel (`/src/components/Chat/`)
- **ChatPanel.tsx**: Main chat interface
  - Message history
  - Code block rendering
  - Markdown support

- **MessageThread.tsx**: Conversation management
  - Multi-turn context
  - Message editing
  - Copy/Share actions

- **CodeCompletion.tsx**: In-editor AI suggestions
  - Hover suggestions
  - Completion popup
  - Acceptance/rejection

#### Layout Components (`/src/components/Layout/`)
- **Workbench.tsx**: Main layout orchestration
  - Panel resizing (Mosaic/Splitpane)
  - Activity bar navigation
  - Maximize/minimize panels

- **Statusbar.tsx**: Bottom status information
  - Cursor position
  - File encoding
  - Selection stats
  - Language mode

#### Sidebar (`/src/components/Sidebar/`)
- **ActivityBar.tsx**: Vertical activity bar
  - Explorer (file browsing)
  - Search (global search)
  - Chat (AI assistant)
  - Debug (debugging tools)
  - Extensions (future)

- **SidebarPanel.tsx**: Active panel content
  - Dynamic content based on activity

### Backend Architecture

#### HTTP Server (`server.ts`)
```typescript
Hono server with routes:
├─ POST /api/auth/login (JWT generation)
├─ POST /api/auth/logout
├─ GET /api/auth/verify
├─ GET /api/files/* (read file)
├─ POST /api/files/* (create/update file)
├─ DELETE /api/files/* (delete file)
├─ GET /api/directories/* (list directory)
├─ POST /api/execute (run code)
├─ WS /api/terminal (WebSocket for terminal)
├─ WS /api/chat (WebSocket for AI chat)
└─ /api/mcp/* (MCP bridge routes)
```

#### Service Layer

**FileManager.ts**
- Virtual file system abstraction
- File I/O operations
- Directory traversal with security checks
- File watching and change detection
- Metadata indexing for fast search

**SessionManager.ts**
- User session lifecycle
- Session persistence (PostgreSQL)
- Session timeout handling
- Multi-session per user support

**AuthService.ts**
- JWT token generation/validation
- Password hashing (bcrypt)
- OAuth integration hooks (future)
- Permission verification

**CodeExecutor.ts**
- Docker container spawning
- Resource limit enforcement
- Output streaming to WebSocket
- Timeout and signal handling
- Error capture and reporting

**LSPManager.ts**
- Language server process management
- Multiple server instances (per language)
- RPC bridge to LSP protocol
- Diagnostic aggregation
- Feature capability mapping

**MCPBridge.ts**
- MCP client implementation
- Server discovery and registration
- Tool/resource routing
- Request/response handling
- Error handling and logging

**OpenCodeAgent.ts**
- OpenCode SDK initialization
- Model selection and routing
- Tool execution delegation
- Session context management
- Permission request handling

#### Models / Database Schema

**User**
```
- id (UUID)
- email (unique)
- passwordHash (bcrypt)
- createdAt
- lastLogin
- settings (JSON: theme, preferences)
```

**Project**
```
- id (UUID)
- userId (FK)
- name
- description
- createdAt
- updatedAt
- metadata (JSON)
```

**Session**
```
- id (UUID)
- userId (FK)
- token (JWT)
- expiresAt
- createdAt
- lastActivity
- metadata (IP, user-agent)
```

**FileMetadata**
```
- id (UUID)
- projectId (FK)
- path
- mimeType
- size
- lastModified
- indexed (for search)
```

### AI & Extension Layer

#### OpenCode Integration
- **Multi-model routing**: Automatically select best model (Claude, GPT-4, Gemini)
- **Tool execution**: Bridge between agent requests and backend services
- **Session management**: Maintain conversation context
- **Permission framework**: User consent for operations

#### MCP Protocol Bridge
- **Client implementation**: Initiate MCP connections to servers
- **Tool registry**: Map available tools from MCP servers
- **Request routing**: Forward tool calls to appropriate servers
- **code-master-ai-brain-mcp**: Custom MCP server for personalized brain models

#### LSP Integration
- **Multi-language support**: Manage servers for each language
- **Feature exposure**: Expose editor features (go-to-def, rename, etc.)
- **Diagnostic streaming**: Real-time error/warning display
- **Symbol resolution**: Code navigation and search

### Storage Layer

#### PostgreSQL
- User accounts and authentication
- Project and file metadata
- Session management
- Audit logs
- Configuration storage

#### File System
- Actual code files and project structure
- User workspace isolation via path permissions
- Option to scale to S3/cloud storage

#### Redis Cache
- Session caching for fast lookup
- File metadata cache
- Rate limiting counters
- Real-time connection tracking

#### Docker Containers
- Isolated execution environments
- Resource limits (CPU, memory)
- Network isolation
- Automatic cleanup

## Data Flow

### User Authentication Flow
```
1. User submits credentials to /api/auth/login
2. AuthService validates email/password
3. JWT token generated with user ID
4. Token stored in secure cookie + returned to client
5. Client includes token in Authorization header
6. Backend middleware verifies token on each request
```

### Code Execution Flow
```
1. User submits code via POST /api/execute
2. CodeExecutor creates Docker container
3. Container mounts code files + runs process
4. Output streamed via WebSocket to terminal
5. Process completion triggers cleanup
6. Execution metadata logged to database
```

### AI Chat Flow
```
1. User sends message via WebSocket /api/chat
2. Message stored in conversation history
3. OpenCodeAgent receives context:
   - User message
   - Current file content
   - Recent chat history
   - Project structure
4. Agent routes to appropriate LLM model
5. LLM response processed for tool calls
6. Tool execution delegated to backend
7. Results aggregated and sent to user
8. Full interaction logged for personalization
```

### File Operations Flow
```
1. User creates/edits file via /api/files/*
2. FileManager validates path (security)
3. File written to disk
4. File metadata updated in database
5. File watchers detect change
6. LSP servers notified of change
7. Diagnostics re-run if applicable
8. Change events broadcast to other clients (future)
```

## Security Architecture

### Authentication & Authorization
- JWT-based stateless authentication
- Role-based access control (RBAC)
- Per-project permission system
- API key management for programmatic access

### Code Isolation
- Docker container-based execution
- Filesystem read/write restrictions
- Network isolation
- Resource quotas (CPU, memory, time)

### Input Validation
- Schema validation on all API inputs
- Path traversal prevention
- Code injection prevention
- Rate limiting on all endpoints

### Data Protection
- Encrypted password storage (bcrypt)
- HTTPS/TLS enforcement
- Session timeout handling
- Secure cookie flags (httpOnly, secure)

## Scalability Considerations

### Horizontal Scaling
- Stateless backend services
- Database connection pooling
- Redis for distributed sessions
- Load balancer for multiple instances

### Vertical Scaling
- Efficient file I/O with streaming
- Lazy loading of directory trees
- Pagination for large result sets
- Incremental LSP updates

### Resource Management
- Docker container limits
- File size limits for uploads
- Request timeout policies
- Memory-efficient caching strategies

## Extension Points

### Custom MCP Servers
```
Users can deploy custom MCP servers that:
- Integrate with external tools/APIs
- Provide domain-specific code intelligence
- Execute custom validation rules
- Access personalized code patterns
```

### Language Server Integration
```
New languages can be added by:
- Deploying LSP server instance
- Registering language ID mapping
- Configuring file associations
- Setting feature capabilities
```

### Plugin System (Future)
```
Frontend extensions can:
- Add new sidebar panels
- Extend editor functionality
- Create custom commands
- Integrate with external services
```

## Performance Optimization

### Frontend
- Code splitting with Vite
- Lazy loading for heavy components
- Virtual scrolling for large file lists
- WebSocket for low-latency communication

### Backend
- Database query optimization with indexes
- File metadata caching in Redis
- Streaming responses for large files
- Connection pooling for databases

### Network
- Compression (gzip) for responses
- Incremental updates instead of full syncs
- Efficient WebSocket message framing
- CDN for static assets (future)

## Monitoring & Observability

### Logging
- Structured logging (JSON format)
- Log levels: debug, info, warning, error
- Log aggregation for debugging
- Audit trail for security

### Metrics
- User session counts
- API endpoint latency
- Error rates per endpoint
- AI agent usage statistics
- Docker container metrics

### Tracing
- Distributed tracing for requests
- Performance bottleneck identification
- Cross-service request tracking
- User experience monitoring

## Disaster Recovery

### Backup Strategy
- PostgreSQL automated backups
- File system snapshots
- Transaction logs for point-in-time recovery
- Geo-redundant storage (future)

### Failover
- Database replication (future)
- Multiple backend instances
- Load balancer health checks
- Graceful degradation

### Data Integrity
- Transaction support for critical operations
- Consistency checks on database
- File integrity verification
- Automated repair mechanisms (future)
