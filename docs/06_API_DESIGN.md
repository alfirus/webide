# API Design and Specifications

## Overview

This document defines all API endpoints, WebSocket protocols, and data contracts for the WebIDE backend.

## API Base URL

```
Development: http://localhost:3001/api
Production: https://webide.example.com/api
WebSocket: ws://localhost:3001/api (ws:// or wss:// for secure)
```

## Authentication

### JWT Token Structure

All protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

JWT Payload:
```json
{
  "sub": "user-id-uuid",
  "email": "user@example.com",
  "iat": 1672531200,
  "exp": 1672617600,
  "type": "access"
}
```

### Token Refresh

Tokens expire after 24 hours. Implement refresh token flow:

```
POST /api/auth/refresh
Body: { "refreshToken": "<refresh_token>" }
Response: { "accessToken": "<new_access_token>" }
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "meta": {
    "timestamp": "2024-01-29T10:30:00Z",
    "version": "v1"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "AUTH_FAILED",
    "message": "Invalid credentials",
    "details": { /* additional info */ }
  },
  "meta": {
    "timestamp": "2024-01-29T10:30:00Z",
    "version": "v1",
    "requestId": "req-12345"
  }
}
```

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `SUCCESS` | 200 | Request succeeded |
| `CREATED` | 201 | Resource created |
| `BAD_REQUEST` | 400 | Invalid request parameters |
| `AUTH_FAILED` | 401 | Authentication failed |
| `AUTH_REQUIRED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Access denied |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `UNPROCESSABLE` | 422 | Validation failed |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |
| `NOT_IMPLEMENTED` | 501 | Not implemented |
| `SERVICE_UNAVAILABLE` | 503 | Service unavailable |

---

## Authentication Endpoints

### Register User

```
POST /api/auth/register

Request:
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}

Response (201):
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-29T10:30:00Z"
  }
}

Error (409 - Email exists):
{
  "success": false,
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "Email already registered"
  }
}

Error (422 - Validation):
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "details": {
      "password": "Password must be at least 12 characters"
    }
  }
}
```

### Login

```
POST /api/auth/login

Request:
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response (200):
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 86400
  }
}

Error (401):
{
  "success": false,
  "error": {
    "code": "AUTH_FAILED",
    "message": "Invalid email or password"
  }
}
```

### Logout

```
POST /api/auth/logout
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": { "message": "Logged out successfully" }
}
```

### Verify Token

```
GET /api/auth/verify
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "id": "user-uuid",
      "email": "user@example.com"
    }
  }
}

Error (401):
{
  "success": false,
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Token is invalid or expired"
  }
}
```

### Refresh Token

```
POST /api/auth/refresh

Request:
{
  "refreshToken": "eyJhbGc..."
}

Response (200):
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "expiresIn": 86400
  }
}
```

---

## Project Endpoints

### List Projects

```
GET /api/projects
Authorization: Bearer <token>

Query Parameters:
- page: number (default: 1)
- limit: number (default: 20)
- sort: 'name' | 'updated' | 'created' (default: 'updated')

Response (200):
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "project-uuid",
        "name": "My Project",
        "description": "Description",
        "createdAt": "2024-01-29T10:30:00Z",
        "updatedAt": "2024-01-29T10:30:00Z",
        "owner": "user-uuid",
        "fileCount": 45,
        "language": "typescript"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5
    }
  }
}
```

### Get Project

```
GET /api/projects/:projectId
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "id": "project-uuid",
    "name": "My Project",
    "description": "Description",
    "createdAt": "2024-01-29T10:30:00Z",
    "updatedAt": "2024-01-29T10:30:00Z",
    "owner": "user-uuid",
    "members": [ /* list of members */ ],
    "settings": { /* project settings */ }
  }
}
```

### Create Project

```
POST /api/projects
Authorization: Bearer <token>

Request:
{
  "name": "My New Project",
  "description": "Project description",
  "template": "empty" | "typescript" | "react" | "python"
}

Response (201):
{
  "success": true,
  "data": {
    "id": "project-uuid",
    "name": "My New Project",
    "description": "Project description",
    "createdAt": "2024-01-29T10:30:00Z",
    "owner": "user-uuid"
  }
}
```

### Update Project

```
PUT /api/projects/:projectId
Authorization: Bearer <token>

Request:
{
  "name": "Updated Name",
  "description": "Updated description"
}

Response (200):
{
  "success": true,
  "data": { /* updated project */ }
}
```

### Delete Project

```
DELETE /api/projects/:projectId
Authorization: Bearer <token>

Response (204): No content
```

---

## File Endpoints

### List Directory

```
GET /api/files/:projectId/*
Authorization: Bearer <token>

Query Parameters:
- path: string (current directory path)

Response (200):
{
  "success": true,
  "data": {
    "path": "/src",
    "files": [
      {
        "name": "index.ts",
        "type": "file",
        "size": 1024,
        "modified": "2024-01-29T10:30:00Z",
        "path": "/src/index.ts"
      },
      {
        "name": "components",
        "type": "directory",
        "modified": "2024-01-29T10:30:00Z",
        "path": "/src/components"
      }
    ]
  }
}
```

### Read File

```
GET /api/files/:projectId/*
Authorization: Bearer <token>

Query Parameters:
- path: string (file path)

Response (200):
{
  "success": true,
  "data": {
    "name": "index.ts",
    "path": "/src/index.ts",
    "content": "export const app = new Express();",
    "size": 34,
    "modified": "2024-01-29T10:30:00Z",
    "encoding": "utf-8",
    "mimeType": "text/typescript"
  }
}

Headers (for large files):
- Content-Length: 1048576
- Content-Type: application/octet-stream

Response (206 - Range request):
Supports partial file downloads with Range header
```

### Create/Update File

```
POST /api/files/:projectId/*
Authorization: Bearer <token>

Request:
{
  "path": "/src/index.ts",
  "content": "export const app = new Express();",
  "encoding": "utf-8"
}

Response (201 or 200):
{
  "success": true,
  "data": {
    "path": "/src/index.ts",
    "size": 34,
    "modified": "2024-01-29T10:30:00Z"
  }
}
```

### Create Directory

```
POST /api/directories/:projectId/*
Authorization: Bearer <token>

Request:
{
  "path": "/src/components"
}

Response (201):
{
  "success": true,
  "data": {
    "path": "/src/components",
    "type": "directory"
  }
}
```

### Delete File/Directory

```
DELETE /api/files/:projectId/*
Authorization: Bearer <token>

Query Parameters:
- path: string (file or directory path)
- force: boolean (force delete non-empty directories)

Response (200):
{
  "success": true,
  "data": {
    "message": "File deleted successfully"
  }
}
```

### Rename File

```
PATCH /api/files/:projectId/*
Authorization: Bearer <token>

Request:
{
  "path": "/src/old-name.ts",
  "newPath": "/src/new-name.ts"
}

Response (200):
{
  "success": true,
  "data": {
    "oldPath": "/src/old-name.ts",
    "newPath": "/src/new-name.ts"
  }
}
```

### Search Files

```
GET /api/files/:projectId/search
Authorization: Bearer <token>

Query Parameters:
- q: string (search query)
- pattern: string (glob pattern, optional)
- includeContent: boolean (search file contents)

Response (200):
{
  "success": true,
  "data": {
    "results": [
      {
        "path": "/src/components/Button.tsx",
        "name": "Button.tsx",
        "relevance": 0.95,
        "matches": ["export", "Button"]
      }
    ],
    "count": 1
  }
}
```

---

## Execution Endpoints

### Execute Code

```
POST /api/execute
Authorization: Bearer <token>

Request:
{
  "projectId": "project-uuid",
  "code": "console.log('Hello');",
  "language": "javascript",
  "timeout": 5000
}

Response (200):
{
  "success": true,
  "data": {
    "executionId": "exec-uuid",
    "status": "running",
    "createdAt": "2024-01-29T10:30:00Z"
  }
}

WebSocket for output:
WS /api/execute/stream/:executionId
```

### Get Execution Status

```
GET /api/execute/:executionId
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "executionId": "exec-uuid",
    "status": "completed",
    "output": "Hello\n",
    "exitCode": 0,
    "duration": 234,
    "startedAt": "2024-01-29T10:30:00Z",
    "completedAt": "2024-01-29T10:30:00.234Z"
  }
}
```

### Stop Execution

```
POST /api/execute/:executionId/stop
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "message": "Execution stopped"
  }
}
```

### Execution History

```
GET /api/execute/history/:projectId
Authorization: Bearer <token>

Query Parameters:
- limit: number (default: 20)
- offset: number (default: 0)

Response (200):
{
  "success": true,
  "data": {
    "executions": [
      {
        "executionId": "exec-uuid",
        "language": "javascript",
        "status": "completed",
        "exitCode": 0,
        "duration": 234,
        "createdAt": "2024-01-29T10:30:00Z"
      }
    ]
  }
}
```

---

## Session Endpoints

### Get Current Session

```
GET /api/session
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "id": "session-uuid",
    "userId": "user-uuid",
    "projectId": "project-uuid",
    "openFiles": ["/src/index.ts", "/src/config.ts"],
    "activeFile": "/src/index.ts",
    "cursorPosition": { "line": 10, "column": 5 },
    "scrollPosition": { "line": 0 },
    "editorSettings": { /* settings */ },
    "createdAt": "2024-01-29T10:30:00Z",
    "lastActivity": "2024-01-29T10:35:00Z"
  }
}
```

### Create Session

```
POST /api/session
Authorization: Bearer <token>

Request:
{
  "projectId": "project-uuid"
}

Response (201):
{
  "success": true,
  "data": {
    "id": "session-uuid",
    "userId": "user-uuid",
    "projectId": "project-uuid",
    "createdAt": "2024-01-29T10:30:00Z"
  }
}
```

### Update Session

```
PUT /api/session/:sessionId
Authorization: Bearer <token>

Request:
{
  "activeFile": "/src/config.ts",
  "cursorPosition": { "line": 15, "column": 10 },
  "openFiles": ["/src/index.ts", "/src/config.ts", "/src/utils.ts"]
}

Response (200):
{
  "success": true,
  "data": { /* updated session */ }
}
```

### Delete Session

```
DELETE /api/session/:sessionId
Authorization: Bearer <token>

Response (204): No content
```

---

## Terminal WebSocket Endpoint

### Connect to Terminal

```
WS /api/terminal
Authorization: Bearer <token> (in query: ?token=<token>)

Connection Parameters:
{
  "projectId": "project-uuid",
  "shell": "bash" | "zsh" | "sh" (optional, default: /bin/sh)
  "columns": 120,
  "rows": 30
}

Server Messages (JSON):
{
  "type": "output",
  "data": "command output text",
  "timestamp": "2024-01-29T10:30:00Z"
}

{
  "type": "connected",
  "terminalId": "term-uuid"
}

{
  "type": "resize",
  "columns": 120,
  "rows": 30
}

Client Messages (JSON):
{
  "type": "input",
  "data": "ls -la\n"
}

{
  "type": "resize",
  "columns": 120,
  "rows": 30
}

{
  "type": "close"
}
```

---

## AI Chat WebSocket Endpoint

### Connect to Chat

```
WS /api/chat
Authorization: Bearer <token> (in query: ?token=<token>)

Connection Parameters:
{
  "projectId": "project-uuid",
  "sessionId": "session-uuid"
}

Server Messages (JSON):
{
  "type": "connected",
  "chatId": "chat-uuid"
}

{
  "type": "message",
  "id": "msg-uuid",
  "content": "AI response text",
  "role": "assistant",
  "model": "claude-3-sonnet",
  "timestamp": "2024-01-29T10:30:00Z"
}

{
  "type": "code_block",
  "language": "typescript",
  "code": "export const app = new Express();"
}

{
  "type": "thinking",
  "content": "Internal reasoning..."
}

{
  "type": "error",
  "error": "Error message",
  "code": "ERROR_CODE"
}

Client Messages (JSON):
{
  "type": "message",
  "content": "How do I fix this error?",
  "context": {
    "file": "/src/index.ts",
    "selectedText": "console.log()"
  },
  "model": "claude-3-sonnet"
}

{
  "type": "close"
}
```

---

## LSP Endpoints

### Initialize Language Server

```
POST /api/lsp/initialize
Authorization: Bearer <token>

Request:
{
  "projectId": "project-uuid",
  "language": "typescript"
}

Response (200):
{
  "success": true,
  "data": {
    "capabilities": {
      "completionProvider": { /* LSP capabilities */ },
      "definitionProvider": true,
      "hoverProvider": true,
      "diagnosticProvider": true
    }
  }
}
```

### Get Completions

```
POST /api/lsp/completions
Authorization: Bearer <token>

Request:
{
  "projectId": "project-uuid",
  "file": "/src/index.ts",
  "line": 10,
  "column": 5
}

Response (200):
{
  "success": true,
  "data": {
    "items": [
      {
        "label": "function",
        "kind": "keyword",
        "detail": "function declaration",
        "sortText": "1"
      }
    ]
  }
}
```

### Get Hover Information

```
POST /api/lsp/hover
Authorization: Bearer <token>

Request:
{
  "projectId": "project-uuid",
  "file": "/src/index.ts",
  "line": 10,
  "column": 5
}

Response (200):
{
  "success": true,
  "data": {
    "content": "Function definition",
    "range": { "start": { "line": 10, "column": 5 }, "end": { "line": 10, "column": 13 } }
  }
}
```

---

## MCP Integration Endpoints

### List MCP Servers

```
GET /api/mcp/servers
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "servers": [
      {
        "id": "server-uuid",
        "name": "code-master-ai-brain",
        "version": "1.0.0",
        "status": "connected",
        "tools": [
          {
            "name": "analyze_code",
            "description": "Analyze code for patterns"
          }
        ]
      }
    ]
  }
}
```

### Execute MCP Tool

```
POST /api/mcp/tools/:serverId/:toolName
Authorization: Bearer <token>

Request:
{
  "params": {
    "code": "function example() { return 42; }",
    "language": "javascript"
  }
}

Response (200):
{
  "success": true,
  "data": {
    "result": { /* tool execution result */ }
  }
}
```

---

## Rate Limiting

All endpoints are rate limited:

```
Header: X-RateLimit-Limit: 100
Header: X-RateLimit-Remaining: 95
Header: X-RateLimit-Reset: 1672531200

Limits:
- Authentication endpoints: 5 requests per minute
- API endpoints: 100 requests per minute
- WebSocket connections: 10 connections per user
- File upload: 100MB per hour
- Code execution: 50 executions per hour
```

---

## Pagination

List endpoints support pagination:

```
Query Parameters:
- page: number (default: 1, starts at 1)
- limit: number (default: 20, max: 100)
- offset: number (alternative to page)
- sort: string (field name with optional +/- prefix for direction)
- search: string (search query for relevant endpoints)

Response:
{
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Request/Response Headers

### Standard Headers

**Request**:
```
Content-Type: application/json
Authorization: Bearer <token>
Accept: application/json
Accept-Encoding: gzip, deflate
User-Agent: WebIDE-Client/1.0
```

**Response**:
```
Content-Type: application/json; charset=utf-8
Content-Encoding: gzip
X-Request-Id: req-12345
X-Response-Time: 234ms
Cache-Control: no-cache, no-store, must-revalidate
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

---

## Deprecation Policy

Deprecated endpoints will be marked with:

```
Deprecated: true
Sunset: <date>
Link: <alternative endpoint>
Warning: 299 - "Deprecated. Use /api/v2/... instead"
```

Deprecated endpoints will continue to work for 3 months after deprecation notice, after which they will be removed.

---

## API Versioning

Current API Version: `v1`

Future versions will use path versioning:
- `/api/v1/...` - Current version
- `/api/v2/...` - Future version

Version can also be specified via header:
```
Accept: application/vnd.webide.v1+json
```

---

## OpenAPI/Swagger Documentation

Full OpenAPI specification available at:
```
GET /api/docs/openapi.json
GET /api/docs/swagger (UI)
```

See Swagger UI at: `http://localhost:3001/api/docs`
