# Implementation Guide

## Step-by-Step Implementation Plan

This guide provides detailed implementation steps for building the Web-Based IDE. Follow these phases sequentially for a stable, production-ready system.

## Phase 1: MVP (Weeks 1-4)

### Week 1: Project Setup & Foundation

#### Step 1: Initialize Project Structure ✅ COMPLETED

**Objective**: Create the foundational directory structure and initialize npm projects

**Tasks**:
1. Create project directories: ✅ DONE
   ```bash
   cd /Users/alfirusahmad/Desktop/ebase.work/source\ codes/webide
   mkdir -p frontend backend docker
   ```

2. Initialize frontend (React + Vite): ✅ DONE
   ```bash
   npm create vite@latest frontend -- --template react-ts
   cd frontend
   npm install
   ```

3. Initialize backend (Node.js + TypeScript): ✅ DONE
   ```bash
   cd ../backend
   npm init -y
   npm install --save-dev typescript ts-node @types/node nodemon
   npm install hono @hono/node-server dotenv
   npx tsc --init
   ```

4. Set up Git: ✅ DONE
   ```bash
   git init
   ```

**Completion Summary**:
- ✅ Project directory structure created (frontend/, backend/, docker/, scripts/)
- ✅ Root package.json with monorepo orchestration scripts
- ✅ Backend package.json with Hono, PostgreSQL, Redis, JWT dependencies
- ✅ Frontend package.json with React 18, Vite, Monaco Editor, xterm.js
- ✅ TypeScript configurations for both frontend and backend
- ✅ ESLint and Prettier configurations
- ✅ Environment variable templates (.env.example files)
- ✅ Docker configurations (Dockerfile for frontend/backend, docker-compose.yml)
- ✅ Vite configuration with path aliases
- ✅ Basic project structure with route skeletons
- ✅ Auth store and placeholder pages (Login, Register, Dashboard, Editor)
- ✅ Git repository initialized with .gitignore
- ✅ All dependencies installed successfully

## Completed Sections

- **Step 1: Initialize Project Structure** - ✅ Completed

#### Step 2: Implement Authentication System

**Objective**: Build secure JWT-based login system

**Frontend Tasks**:
1. Create auth store (`/frontend/src/store/authStore.ts`):
   ```typescript
   interface AuthState {
     user: User | null;
     token: string | null;
     isLoading: boolean;
     login: (email: string, password: string) => Promise<void>;
     logout: () => void;
     isAuthenticated: () => boolean;
   }
   ```

2. Create login page (`/frontend/src/pages/Login.tsx`):
   - Email and password input fields
   - Form validation
   - Error message display
   - Remember me checkbox (future)
   - Link to signup page (future)

3. Create auth hook (`/frontend/src/hooks/useAuth.ts`):
   - Access auth state globally
   - Handle login/logout mutations
   - Token persistence in localStorage

4. Create protected route component (`/frontend/src/components/ProtectedRoute.tsx`):
   - Redirect to login if not authenticated
   - Display loading state
   - Restore session on app load

**Backend Tasks**:
1. Set up environment variables (`.env`):
   ```
   NODE_ENV=development
   PORT=3001
   DATABASE_URL=postgresql://user:password@localhost:5432/webide
   JWT_SECRET=your_secret_key_here
   ```

2. Create auth routes (`/backend/src/routes/auth.ts`):
   ```typescript
   - POST /api/auth/register (future)
   - POST /api/auth/login (email, password)
   - POST /api/auth/logout
   - GET /api/auth/verify (check token validity)
   ```

3. Implement JWT utilities (`/backend/src/services/AuthService.ts`):
   - Token generation with expiry
   - Token verification middleware
   - Password hashing with bcrypt
   - User lookup in database

4. Create User model and database migration:
   ```sql
   CREATE TABLE users (
     id UUID PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL,
     password_hash VARCHAR(255) NOT NULL,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   ```

**Testing**:
- Test login endpoint with valid/invalid credentials
- Verify JWT token structure
- Test protected route redirect
- Session persistence across page reload

**Deliverables**:
- Functional login page
- JWT authentication endpoints
- Protected routes in frontend
- User database table

### Week 2: Core Editor & File System

#### Step 3: Implement Monaco Editor

**Objective**: Set up professional code editor with syntax highlighting

**Frontend Tasks**:
1. Install Monaco Editor:
   ```bash
   cd frontend
   npm install monaco-editor
   ```

2. Create Editor component (`/frontend/src/components/Editor/Monaco.tsx`):
   - Monaco Editor instance with configuration
   - Theme selection (light/dark/custom)
   - Font size and family settings
   - Tab size and indentation
   - Language detection from file extension
   - Keyboard shortcuts customization

3. Create editor store (`/frontend/src/store/editorStore.ts`):
   ```typescript
   interface EditorState {
     currentFile: string | null;
     unsavedChanges: Map<string, string>;
     editorSettings: {
       fontSize: number;
       fontFamily: string;
       theme: 'light' | 'dark';
       tabSize: number;
       wordWrap: boolean;
     };
     setCurrentFile: (path: string) => void;
     updateContent: (path: string, content: string) => void;
     saveFile: (path: string) => Promise<void>;
     resetUnsavedChanges: () => void;
   }
   ```

4. Create editor hook (`/frontend/src/hooks/useEditor.ts`):
   - Editor instance management
   - Content synchronization
   - Keyboard shortcut handling

**Backend Tasks**:
1. Create file management routes (`/backend/src/routes/files.ts`):
   ```typescript
   - GET /api/files/:projectId/:path (read file)
   - POST /api/files/:projectId/:path (create/update)
   - DELETE /api/files/:projectId/:path (delete)
   - GET /api/directories/:projectId/:path (list directory)
   ```

2. Implement FileManager service (`/backend/src/services/FileManager.ts`):
   - Virtual file system abstraction
   - Path validation (prevent directory traversal)
   - File I/O operations with streams
   - MIME type detection
   - File metadata caching

3. Create File model and migrations:
   ```sql
   CREATE TABLE files (
     id UUID PRIMARY KEY,
     project_id UUID REFERENCES projects(id),
     path VARCHAR(1024) NOT NULL,
     mime_type VARCHAR(100),
     size INTEGER,
     created_at TIMESTAMP,
     updated_at TIMESTAMP,
     UNIQUE(project_id, path)
   );
   ```

**Testing**:
- Syntax highlighting for multiple languages
- Editor responsive to theme changes
- File save/load operations
- Large file handling (>10MB)
- Special character and encoding support

**Deliverables**:
- Monaco Editor integrated in IDE
- File read/write endpoints
- Editor state management
- File browser functionality

#### Step 4: Implement File Explorer

**Objective**: Build intuitive file navigation interface

**Frontend Tasks**:
1. Create FileTree component (`/frontend/src/components/Explorer/FileTree.tsx`):
   - Recursive directory tree rendering
   - Expand/collapse directories
   - File icons by type
   - Drag-and-drop support (future)
   - Right-click context menu

2. Create FileOperations component (`/frontend/src/components/Explorer/FileOperations.tsx`):
   - New file/folder creation dialogs
   - Delete confirmation
   - Rename operations
   - File action buttons

3. Create file explorer hook (`/frontend/src/hooks/useFiles.ts`):
   - File tree state management
   - Directory expansion state
   - File operation mutations

**Testing**:
- Directory tree rendering
- File selection and opening
- New file/folder creation
- File deletion with confirmation
- Large directory trees (>1000 files)

**Deliverables**:
- File explorer UI component
- File browser state management
- File operation handlers

### Week 3: Terminal & Session Management

#### Step 5: Implement Terminal Component

**Objective**: Add integrated terminal with WebSocket communication

**Frontend Tasks**:
1. Install xterm.js:
   ```bash
   cd frontend
   npm install xterm
   ```

2. Create Terminal component (`/frontend/src/components/Terminal/XTerm.tsx`):
   - xterm.js instance initialization
   - WebSocket connection management
   - Terminal sizing and responsive layout
   - Copy/paste functionality
   - Search addon integration

3. Create TerminalManager component (`/frontend/src/components/Terminal/TerminalManager.tsx`):
   - Multi-terminal tab support
   - Terminal switching
   - Tab closing
   - Terminal persistence

4. Create terminal hook (`/frontend/src/hooks/useTerminal.ts`):
   - Terminal instance management
   - Input/output handling
   - Connection state tracking

**Backend Tasks**:
1. Implement WebSocket terminal endpoint (`/backend/src/routes/terminal.ts`):
   ```typescript
   - WS /api/terminal (bidirectional terminal communication)
   ```

2. Create Terminal service (`/backend/src/services/TerminalService.ts`):
   - PTY (pseudo-terminal) management
   - Shell spawning (bash/zsh)
   - Input/output streaming
   - Session persistence
   - Terminal resize handling

3. Database schema for terminal sessions:
   ```sql
   CREATE TABLE terminal_sessions (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     project_id UUID REFERENCES projects(id),
     shell VARCHAR(50),
     created_at TIMESTAMP,
     closed_at TIMESTAMP
   );
   ```

**Libraries to install (backend)**:
```bash
npm install xterm pty.js ws
```

**Testing**:
- Terminal command execution
- Input/output streaming
- Terminal resize handling
- Multiple terminals simultaneously
- Terminal session recovery on reconnect

**Deliverables**:
- Terminal component in IDE
- WebSocket-based terminal endpoint
- Multi-terminal support
- Terminal session persistence

#### Step 6: Implement Session Management

**Objective**: Manage user sessions and project state

**Frontend Tasks**:
1. Create session store (`/frontend/src/store/sessionStore.ts`):
   ```typescript
   interface SessionState {
     currentProject: Project | null;
     openFiles: string[];
     editorLayout: Layout;
     sessionId: string;
     loadSession: () => Promise<void>;
     saveSession: () => Promise<void>;
   }
   ```

2. Create session recovery:
   - Restore open files on page reload
   - Restore editor state (scroll, selection)
   - Restore sidebar visibility

**Backend Tasks**:
1. Create Session routes (`/backend/src/routes/session.ts`):
   ```typescript
   - GET /api/session (get current session)
   - POST /api/session (create new session)
   - PUT /api/session (update session)
   - DELETE /api/session/:id (delete session)
   ```

2. Implement SessionManager service (`/backend/src/services/SessionManager.ts`):
   - Session creation and lifecycle
   - State persistence (editor state, open files)
   - Session timeout handling
   - Multi-device session support

3. Database schema:
   ```sql
   CREATE TABLE sessions (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     project_id UUID REFERENCES projects(id),
     data JSONB,
     created_at TIMESTAMP,
     updated_at TIMESTAMP,
     expires_at TIMESTAMP
   );
   ```

**Testing**:
- Session creation and restoration
- State persistence across reload
- Session timeout and cleanup
- Concurrent session management

**Deliverables**:
- Session management endpoints
- Client-side session persistence
- State recovery on page reload

### Week 4: Basic AI Integration & MVP Launch

#### Step 7: OpenCode SDK Integration (Read-Only)

**Objective**: Integrate OpenCode for AI capabilities (MVP phase - read-only)

**Backend Tasks**:
1. Initialize OpenCode SDK (when available):
   ```bash
   npm install @opencode/sdk
   ```

2. Create OpenCode service (`/backend/src/services/OpenCodeService.ts`):
   - Initialize OpenCode client with API keys
   - Provider configuration (Claude, GPT-4, etc.)
   - Session creation for conversations
   - Tool registration (read-only in MVP)

3. Create AI routes (`/backend/src/routes/ai.ts`):
   ```typescript
   - POST /api/ai/chat (send message to AI)
   - GET /api/ai/models (list available models)
   - GET /api/ai/models/:id/capabilities (model capabilities)
   ```

4. Implement basic chat endpoint:
   ```typescript
   // Request: { message: string, projectId: string, context?: string }
   // Response: { id: string, content: string, model: string }
   ```

**Frontend Tasks**:
1. Create Chat component (`/frontend/src/components/Chat/ChatPanel.tsx`):
   - Message input field
   - Message history display
   - Loading state
   - Error handling
   - Model selector (future)

2. Create chat hook (`/frontend/src/hooks/useChat.ts`):
   - Chat state management
   - Message sending and receiving
   - Conversation context

3. Add chat to sidebar:
   - Chat panel in activity bar
   - Minimize/maximize
   - Clear history button

**Testing**:
- Chat endpoint connectivity
- Message sending and receiving
- Model availability listing
- Error handling

**Deliverables**:
- OpenCode SDK integration (read-only)
- Basic chat interface
- AI model selection capability
- Chat history in sidebar

#### Step 8: Basic Code Execution

**Objective**: Implement simple code execution (MVP)

**Note**: For MVP, we'll use Node.js eval (NOT safe for production). Phase 2 will add Docker.

**Backend Tasks**:
1. Create execution routes (`/backend/src/routes/execution.ts`):
   ```typescript
   - POST /api/execute (run code snippet)
   - POST /api/execute/stop/:id (stop execution)
   ```

2. Create CodeExecutor service (`/backend/src/services/CodeExecutor.ts`):
   - Simple eval-based execution for MVP
   - Output capturing
   - Timeout handling (5 seconds)
   - Basic error handling

3. WebSocket for streaming output:
   ```typescript
   - WS /api/execute/stream/:executionId
   ```

**Frontend Tasks**:
1. Add Run button to editor toolbar
2. Output panel in terminal
3. Execution status indicator

**Security Warning**: This MVP implementation is NOT secure for production. Phase 2 will migrate to Docker containers.

**Testing**:
- Execute JavaScript code
- Output display in terminal
- Timeout enforcement
- Error handling

**Deliverables**:
- Code execution endpoint (MVP - eval based)
- Run button in editor
- Output streaming

#### Step 9: MVP Testing & Deployment

**Objective**: Test MVP features and prepare for deployment

**Testing Tasks**:
1. Integration testing:
   - Login flow
   - File operations
   - Terminal commands
   - Code execution
   - Chat interaction

2. Performance testing:
   - Editor responsiveness
   - File operations latency
   - Terminal latency

3. User acceptance testing:
   - Navigation and UX
   - Feature completeness

**Deployment Tasks**:
1. Create Docker Compose setup (`/docker/docker-compose.yml`):
   ```yaml
   version: '3.8'
   services:
     backend:
       build: ./backend
       ports: ["3001:3001"]
       environment:
         - DATABASE_URL=postgresql://user:password@db:5432/webide
       depends_on:
         - db
     frontend:
       build: ./frontend
       ports: ["3000:80"]
     db:
       image: postgres:15
       environment:
         - POSTGRES_PASSWORD=password
       volumes:
         - pgdata:/var/lib/postgresql/data
   volumes:
     pgdata:
   ```

2. Create backend Dockerfile
3. Create frontend Dockerfile (Node build + Nginx)
4. Set up environment variables
5. Deploy to single server or cloud platform

**Deliverables**:
- Tested MVP application
- Docker deployment configuration
- Deployment documentation
- User guide for MVP features

---

## Phase 2: Production Ready (Weeks 5-8)

### Step 10: Docker-Based Code Execution

**Objective**: Replace eval with safe, containerized execution

**Tasks**:
1. Create execution sandbox images (Node.js, Python, Go, etc.)
2. Implement DockerExecutor service
3. Resource limits (CPU 1 core, Memory 512MB, Timeout 30s)
4. Output streaming with proper cleanup
5. Security policies for file access

### Step 11: Complete LSP Integration

**Objective**: Add language server support for intelligence

**Tasks**:
1. Deploy LSP servers for TypeScript, Python, Go, Rust
2. Implement LSP client in backend
3. Wire LSP diagnostics to editor
4. Implement Go-to-Definition feature
5. Add code formatting and refactoring

### Step 12: Full OpenCode Integration

**Objective**: Enable complete AI agent capabilities

**Tasks**:
1. Tool execution for AI agents
2. Permission request handling
3. Full multi-turn conversations
4. Code generation with file creation
5. Project-wide refactoring

### Step 13: MCP Bridge Implementation

**Objective**: Integrate Model Context Protocol servers

**Tasks**:
1. Implement MCP client
2. Server discovery and registration
3. Tool mapping to backend services
4. code-master-ai-brain-mcp integration (when ready)
5. Custom tool creation framework

---

## Phase 3: Enterprise Features (Weeks 9+)

### Step 14: Real-Time Collaboration

### Step 15: Advanced Permissions & Teams

### Step 16: Kubernetes Deployment

### Step 17: MCP Server Ecosystem

---

## Development Workflow

### Local Development

```bash
# Terminal 1: Backend
cd backend
npm run dev  # runs with nodemon

# Terminal 2: Frontend
cd frontend
npm run dev  # runs Vite dev server

# Terminal 3: Database (if using Docker)
docker-compose up db redis
```

### Environment Setup

Create `.env` files:

**Backend** (`.env`):
```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://webide:password@localhost:5432/webide
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev_secret_key_change_in_production
OPENCODE_API_KEY=your_key_when_ready
```

**Frontend** (`.env.local`):
```
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

### Git Workflow

```bash
# Feature branch
git checkout -b feature/authentication
# ... make changes ...
git add .
git commit -m "feat: implement JWT authentication"
git push origin feature/authentication
# Create pull request

# After review and testing
git checkout main
git pull
git merge feature/authentication
git push
```

### Testing Strategy

- **Unit tests**: Business logic (AuthService, FileManager)
- **Integration tests**: API endpoints
- **E2E tests**: Full user flows (login → edit → execute)
- **Performance tests**: Editor, file operations, terminal

### Documentation

- Update docs/ folder with implementation details
- Document API endpoints (OpenAPI spec)
- Create user guide
- Create deployment guide

## Success Criteria by Phase

### MVP Completion
- [ ] Login system functional
- [ ] Monaco editor working with syntax highlighting
- [ ] File read/write operations
- [ ] Terminal with basic command execution
- [ ] OpenCode chat interface (read-only)
- [ ] Code execution (eval-based)
- [ ] Session persistence
- [ ] Unit tests for core services

### Production Ready
- [ ] Docker-based code execution with proper isolation
- [ ] LSP integration for multiple languages
- [ ] Full OpenCode capabilities with tool execution
- [ ] MCP bridge implementation
- [ ] Comprehensive error handling
- [ ] Performance optimized (editor loads < 2s)
- [ ] Integration tests pass
- [ ] Security audit completed
- [ ] Database backups configured
- [ ] Monitoring and logging setup

### Enterprise Ready
- [ ] Real-time collaboration working
- [ ] Team/organization management
- [ ] Advanced permissions system
- [ ] Kubernetes deployment
- [ ] High availability setup (>99.9% uptime)
- [ ] Custom MCP server framework
- [ ] E2E tests comprehensive
- [ ] Performance at scale (10k concurrent users)
