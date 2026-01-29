# Setup and Project Structure

## Project Structure Overview

```
webide/
├── docs/                          # Documentation
│   ├── 01_PROJECT_OVERVIEW.md
│   ├── 02_ARCHITECTURE.md
│   ├── 03_TECHNOLOGY_STACK.md
│   ├── 04_IMPLEMENTATION_GUIDE.md
│   ├── 05_SETUP_AND_STRUCTURE.md  (this file)
│   ├── 06_API_DESIGN.md
│   ├── 07_INTEGRATION_GUIDE.md
│   ├── 08_SECURITY.md
│   └── 09_DEPLOYMENT.md
│
├── frontend/                      # React + TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Editor/
│   │   │   │   ├── Monaco.tsx
│   │   │   │   ├── EditorActions.tsx
│   │   │   │   ├── EditorSettings.tsx
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── Terminal/
│   │   │   │   ├── XTerm.tsx
│   │   │   │   ├── TerminalManager.tsx
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── Explorer/
│   │   │   │   ├── FileTree.tsx
│   │   │   │   ├── FileSearch.tsx
│   │   │   │   ├── FileOperations.tsx
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── Chat/
│   │   │   │   ├── ChatPanel.tsx
│   │   │   │   ├── MessageThread.tsx
│   │   │   │   ├── CodeCompletion.tsx
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── Sidebar/
│   │   │   │   ├── ActivityBar.tsx
│   │   │   │   ├── SidebarPanel.tsx
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── Layout/
│   │   │   │   ├── Workbench.tsx
│   │   │   │   ├── Statusbar.tsx
│   │   │   │   ├── Panel.tsx
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── Auth/
│   │   │       ├── LoginForm.tsx
│   │   │       ├── ProtectedRoute.tsx
│   │   │       └── index.ts
│   │   │
│   │   ├── hooks/
│   │   │   ├── useEditor.ts
│   │   │   ├── useTerminal.ts
│   │   │   ├── useFiles.ts
│   │   │   ├── useAuth.ts
│   │   │   ├── useSession.ts
│   │   │   ├── useChat.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── store/
│   │   │   ├── authStore.ts       # Zustand auth state
│   │   │   ├── editorStore.ts     # Editor state
│   │   │   ├── terminalStore.ts   # Terminal state
│   │   │   ├── sessionStore.ts    # Session state
│   │   │   ├── chatStore.ts       # Chat/AI state
│   │   │   └── index.ts
│   │   │
│   │   ├── services/
│   │   │   ├── api.ts             # HTTP client
│   │   │   ├── websocket.ts       # WebSocket manager
│   │   │   ├── fileService.ts     # File operations
│   │   │   ├── authService.ts     # Auth service
│   │   │   └── index.ts
│   │   │
│   │   ├── types/
│   │   │   ├── index.ts           # Type definitions
│   │   │   ├── api.ts
│   │   │   ├── editor.ts
│   │   │   └── user.ts
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── IDE.tsx
│   │   │   ├── NotFound.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── constants.ts
│   │   │   ├── helpers.ts
│   │   │   ├── validators.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   ├── variables.css
│   │   │   └── tailwind.css
│   │   │
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   │
│   ├── public/
│   │   ├── favicon.ico
│   │   └── themes/                # Editor themes
│   │       ├── light.json
│   │       ├── dark.json
│   │       └── custom.json
│   │
│   ├── .env.example
│   ├── .eslintrc.json
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── .prettierrc
│   └── README.md
│
├── backend/                       # Node.js + Hono backend
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts           # Authentication endpoints
│   │   │   ├── files.ts          # File operations endpoints
│   │   │   ├── session.ts        # Session endpoints
│   │   │   ├── execution.ts      # Code execution endpoints
│   │   │   ├── terminal.ts       # Terminal WebSocket endpoint
│   │   │   ├── chat.ts           # AI chat endpoints
│   │   │   ├── lsp.ts            # LSP endpoints
│   │   │   ├── mcp.ts            # MCP endpoints
│   │   │   └── index.ts          # Route aggregation
│   │   │
│   │   ├── services/
│   │   │   ├── AuthService.ts    # Auth logic
│   │   │   ├── FileManager.ts    # File operations
│   │   │   ├── SessionManager.ts # Session management
│   │   │   ├── CodeExecutor.ts   # Code execution
│   │   │   ├── TerminalService.ts # Terminal/PTY
│   │   │   ├── LSPManager.ts     # Language servers
│   │   │   ├── MCPBridge.ts      # MCP integration
│   │   │   ├── OpenCodeAgent.ts  # OpenCode integration
│   │   │   ├── DatabaseService.ts # DB connections
│   │   │   └── CacheService.ts   # Redis operations
│   │   │
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Project.ts
│   │   │   ├── Session.ts
│   │   │   ├── FileMetadata.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.ts           # JWT verification
│   │   │   ├── errorHandler.ts   # Global error handling
│   │   │   ├── logger.ts         # Request logging
│   │   │   ├── cors.ts           # CORS configuration
│   │   │   ├── validation.ts     # Input validation
│   │   │   └── index.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── jwt.ts            # JWT utilities
│   │   │   ├── hash.ts           # Password hashing
│   │   │   ├── validators.ts     # Validation helpers
│   │   │   ├── logger.ts         # Logging setup
│   │   │   ├── constants.ts      # Constants
│   │   │   └── index.ts
│   │   │
│   │   ├── types/
│   │   │   ├── index.ts          # Type definitions
│   │   │   ├── api.ts
│   │   │   ├── database.ts
│   │   │   └── errors.ts
│   │   │
│   │   ├── migrations/
│   │   │   ├── 001_create_users.sql
│   │   │   ├── 002_create_projects.sql
│   │   │   ├── 003_create_sessions.sql
│   │   │   ├── 004_create_files.sql
│   │   │   └── index.ts          # Migration runner
│   │   │
│   │   ├── server.ts             # Main server entry point
│   │   └── config.ts             # Configuration
│   │
│   ├── .env.example
│   ├── .eslintrc.json
│   ├── package.json
│   ├── tsconfig.json
│   ├── .prettierrc
│   ├── README.md
│   └── docker.d.ts               # Docker type definitions
│
├── docker/                        # Docker configuration
│   ├── Dockerfile.backend         # Backend image
│   ├── Dockerfile.frontend        # Frontend image
│   ├── docker-compose.yml         # Compose orchestration
│   ├── docker-compose.prod.yml    # Production compose
│   └── .dockerignore
│
├── .github/                       # GitHub workflows
│   └── workflows/
│       ├── test.yml              # CI tests
│       ├── build.yml             # Build pipeline
│       └── deploy.yml            # Deployment pipeline
│
├── scripts/                       # Utility scripts
│   ├── setup.sh                  # Initial setup
│   ├── migrate.sh                # Database migrations
│   ├── seed.sh                   # Seed test data
│   └── clean.sh                  # Cleanup
│
├── .gitignore
├── .prettierrc
├── .editorconfig
├── README.md
├── LICENSE
└── package.json                   # Root package.json
```

## Environment Setup

### Prerequisites

- **Node.js**: 20.x LTS or newer
  ```bash
  node --version  # Should be v20.x or higher
  ```

- **npm**: 10.x or newer
  ```bash
  npm --version
  ```

- **PostgreSQL**: 14+ (local or cloud)
  ```bash
  psql --version
  ```

- **Redis**: 7.x (local or cloud)
  ```bash
  redis-cli --version
  ```

- **Git**: 2.x or newer
  ```bash
  git --version
  ```

- **Docker**: (optional, for local container development)
  ```bash
  docker --version
  docker-compose --version
  ```

### Installation

#### 1. Clone Repository
```bash
cd /Users/alfirusahmad/Desktop/ebase.work/source\ codes/webide
git clone <repository-url> .
```

#### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
# DATABASE_URL=postgresql://user:password@localhost:5432/webide
# REDIS_URL=redis://localhost:6379
# JWT_SECRET=your_secret_key_here

# Run database migrations
npm run migrate

# Seed test data (optional)
npm run seed

# Start development server
npm run dev
# Server runs on http://localhost:3001
```

#### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local
# VITE_API_URL=http://localhost:3001
# VITE_WS_URL=ws://localhost:3001

# Start development server
npm run dev
# Frontend runs on http://localhost:5173
```

### Database Setup

#### PostgreSQL

```bash
# Create database
createdb webide

# Create user (optional)
createuser webide_user
psql -U postgres -d webide -c "ALTER USER webide_user WITH PASSWORD 'password';"

# Run migrations
cd backend
npm run migrate

# Verify
psql -U webide_user -d webide -c "SELECT * FROM information_schema.tables WHERE table_schema = 'public';"
```

#### Redis

```bash
# Start Redis (if using Docker)
docker run -d -p 6379:6379 redis:7-alpine

# Or using Homebrew on macOS
brew install redis
brew services start redis

# Verify
redis-cli ping
# Response: PONG
```

### Docker Compose Setup (Alternative)

```bash
# Navigate to project root
cd /Users/alfirusahmad/Desktop/ebase.work/source\ codes/webide

# Start all services
docker-compose up -d

# Verify services
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Access
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# PostgreSQL: localhost:5432
# Redis: localhost:6379

# Stop services
docker-compose down

# Clean up volumes (WARNING: deletes data)
docker-compose down -v
```

## Development Scripts

### Frontend Scripts

```bash
cd frontend

# Start development server with HMR
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code with Prettier
npm run format

# Run type checking
npm run type-check
```

### Backend Scripts

```bash
cd backend

# Start development server with auto-reload
npm run dev

# Start production server
npm run start

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Database migrations
npm run migrate
npm run migrate:rollback
npm run migrate:create (name)

# Seed database
npm run seed

# Type checking
npm run type-check

# Build TypeScript
npm run build
```

### Root Scripts

```bash
cd /Users/alfirusahmad/Desktop/ebase.work/source\ codes/webide

# Install all dependencies
npm run install:all

# Start full stack (requires separate terminals or use pm2)
npm run dev

# Run tests all
npm run test

# Format entire project
npm run format

# Lint entire project
npm run lint
```

## Configuration Files

### Backend Configuration

**`backend/tsconfig.json`**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**`backend/.env.example`**:
```env
# Environment
NODE_ENV=development

# Server
PORT=3001
HOST=localhost

# Database
DATABASE_URL=postgresql://webide_user:password@localhost:5432/webide
DATABASE_POOL_SIZE=10

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRATION=24h

# OpenCode (when ready)
OPENCODE_API_KEY=
OPENCODE_DEFAULT_MODEL=claude

# Logging
LOG_LEVEL=info

# Security
CORS_ORIGIN=http://localhost:5173
CORS_CREDENTIALS=true

# File Upload
MAX_FILE_SIZE=100000000

# Code Execution
EXECUTION_TIMEOUT=30000
EXECUTION_MEMORY_LIMIT=512M
```

### Frontend Configuration

**`frontend/vite.config.ts`**:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  build: {
    target: 'ES2020',
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser'
  }
})
```

**`frontend/.env.example`**:
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
VITE_APP_NAME=WebIDE
VITE_APP_VERSION=0.1.0
```

### Tailwind Configuration

**`frontend/tailwind.config.js`**:
```javascript
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        editor: {
          bg: '#1e1e1e',
          fg: '#d4d4d4',
          border: '#3e3e42',
        },
        activity: {
          bg: '#252526',
          fg: '#cccccc',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

## Common Development Tasks

### Adding a New Component

1. Create component file: `frontend/src/components/MyComponent/MyComponent.tsx`
2. Create styles (inline or separate CSS module)
3. Export from index: `frontend/src/components/MyComponent/index.ts`
4. Import and use in parent component

### Adding a New API Endpoint

1. Create route file: `backend/src/routes/myfeature.ts`
2. Define handler with types
3. Add middleware (auth, validation)
4. Register route in `backend/src/server.ts`
5. Create service layer: `backend/src/services/MyFeatureService.ts`
6. Add tests in `backend/__tests__/routes/myfeature.test.ts`

### Adding Database Schema

1. Create migration: `backend/src/migrations/XXX_create_table.sql`
2. Run migration: `npm run migrate`
3. Create TypeScript model: `backend/src/models/MyModel.ts`
4. Create service methods for CRUD operations

### Adding Environment Variable

1. Add to `.env.example` with description
2. Add to appropriate `.env` file(s)
3. Add type definition in `backend/src/config.ts` or `frontend/src/utils/constants.ts`
4. Use in code via `process.env.VAR_NAME` or `import.meta.env.VITE_VAR_NAME`

## Debugging

### Backend Debugging

**VSCode Debugger**:
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Backend",
      "program": "${workspaceFolder}/backend/src/server.ts",
      "preLaunchTask": "npm: run dev (backend)",
      "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"]
    }
  ]
}
```

**Console Logging**:
```typescript
import { logger } from './utils/logger'

logger.info('Message', { userId: '123', action: 'login' })
logger.error('Error occurred', { error, context })
logger.debug('Debug info', { data })
```

### Frontend Debugging

**React DevTools Browser Extension**:
- Install "React Developer Tools" extension
- Inspect components, state, and props

**Console Logging**:
```typescript
console.log('Component mounted', { props })
console.table(data)
console.trace('Stack trace')
```

**Zustand DevTools**:
```typescript
import { devtools } from 'zustand/middleware'

export const useStore = create(
  devtools((set) => ({
    // store definition
  }))
)
```

## Performance Optimization Tips

### Frontend
- Use React.memo for expensive components
- Lazy load components with React.lazy + Suspense
- Optimize images and assets
- Use virtual scrolling for large lists
- Profile with Chrome DevTools Performance tab

### Backend
- Use database indexes on frequently queried columns
- Cache responses with Redis
- Implement pagination for large datasets
- Use connection pooling
- Profile with clinic.js or Node.js profiler

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use different port
PORT=3002 npm run dev
```

### Database Connection Error
```bash
# Check PostgreSQL is running
pg_isready

# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
npm install
```

### CORS Errors
- Check CORS_ORIGIN in backend .env
- Ensure frontend URL matches
- Verify credentials flag in requests

### WebSocket Connection Failed
- Check WS_URL configuration
- Verify server is running
- Check firewall/proxy settings
- Inspect browser console for detailed error

## Next Steps

1. Follow [IMPLEMENTATION_GUIDE.md](04_IMPLEMENTATION_GUIDE.md) for step-by-step development
2. Review [ARCHITECTURE.md](02_ARCHITECTURE.md) for system design details
3. Check [API_DESIGN.md](06_API_DESIGN.md) for endpoint specifications
4. Read [SECURITY.md](08_SECURITY.md) for security best practices
5. See [DEPLOYMENT.md](09_DEPLOYMENT.md) for production deployment
