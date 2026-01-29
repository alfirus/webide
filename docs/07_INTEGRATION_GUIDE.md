# Integration Guide

## Overview

This document provides detailed guidance on integrating the three key components:
1. **OpenCode SDK** - Multi-model AI agent framework
2. **Model Context Protocol (MCP)** - Standard tool integration
3. **Language Server Protocol (LSP)** - Code intelligence

## 1. OpenCode SDK Integration

### 1.1 What is OpenCode?

OpenCode is a sophisticated open-source AI coding agent framework that:
- Supports multiple LLM providers (Claude, GPT-4, Gemini, etc.)
- Provides a unified tool execution environment
- Implements the MCP protocol for extensibility
- Offers session management and context awareness
- Includes a comprehensive SDK for JavaScript/TypeScript

### 1.2 Installation

```bash
# When OpenCode becomes available via npm
npm install @opencode/sdk
npm install @types/opencode-sdk --save-dev
```

### 1.3 Backend Integration

**File: `/backend/src/services/OpenCodeAgent.ts`**

```typescript
import { OpencodeClient } from '@opencode/sdk'
import { config } from '../config'

interface ConversationContext {
  projectId: string
  userId: string
  currentFile?: string
  selectedText?: string
  projectStructure?: string
  recentFiles?: string[]
}

export class OpenCodeAgent {
  private client: OpencodeClient
  private models: Map<string, string> = new Map([
    ['claude-3-opus', 'claude-3-opus-20240229'],
    ['claude-3-sonnet', 'claude-3-5-sonnet-20241022'],
    ['gpt-4', 'gpt-4-turbo'],
    ['gpt-4o', 'gpt-4o'],
    ['gemini-pro', 'gemini-pro'],
  ])

  constructor() {
    this.client = new OpencodeClient({
      apiKey: config.OPENCODE_API_KEY,
      defaultModel: config.OPENCODE_DEFAULT_MODEL || 'claude-3-sonnet',
    })
  }

  /**
   * Send a message to the OpenCode agent with project context
   */
  async chat(
    message: string,
    context: ConversationContext,
    model?: string
  ): Promise<{
    id: string
    content: string
    model: string
    toolCalls?: ToolCall[]
  }> {
    const selectedModel = model || config.OPENCODE_DEFAULT_MODEL

    // Build system prompt with context
    const systemPrompt = this.buildSystemPrompt(context)

    // Build conversation messages
    const messages = [
      {
        role: 'user' as const,
        content: message,
      },
    ]

    try {
      // Create conversation session with context
      const session = await this.client.createSession({
        model: selectedModel,
        systemPrompt,
        context: {
          projectId: context.projectId,
          userId: context.userId,
          currentFile: context.currentFile,
        },
      })

      // Send message and get response
      const response = await session.send(messages)

      // Process tool calls if any
      const toolCalls = this.extractToolCalls(response)

      return {
        id: response.id,
        content: response.content,
        model: selectedModel,
        toolCalls,
      }
    } catch (error) {
      throw new Error(`OpenCode agent error: ${error.message}`)
    }
  }

  /**
   * Stream responses for real-time updates
   */
  async *chatStream(
    message: string,
    context: ConversationContext,
    model?: string
  ): AsyncGenerator<string> {
    const selectedModel = model || config.OPENCODE_DEFAULT_MODEL
    const systemPrompt = this.buildSystemPrompt(context)

    const session = await this.client.createSession({
      model: selectedModel,
      systemPrompt,
    })

    // Stream message chunks
    for await (const chunk of session.stream(message)) {
      yield chunk.delta || ''
    }
  }

  /**
   * Build context-aware system prompt
   */
  private buildSystemPrompt(context: ConversationContext): string {
    const parts = [
      'You are an expert programming assistant integrated into a web-based IDE.',
      'Your goal is to help users write, debug, and improve their code.',
    ]

    if (context.currentFile) {
      parts.push(`Current file being edited: ${context.currentFile}`)
    }

    if (context.selectedText) {
      parts.push(`Selected code:\n\`\`\`\n${context.selectedText}\n\`\`\``)
    }

    if (context.projectStructure) {
      parts.push(`Project structure:\n${context.projectStructure}`)
    }

    if (context.recentFiles?.length) {
      parts.push(
        `Recently modified files: ${context.recentFiles.join(', ')}`
      )
    }

    parts.push(
      'When suggesting code changes, provide the complete implementation.'
    )
    parts.push('Format code blocks with proper language identifiers.')
    parts.push('Explain your reasoning and suggestions clearly.')

    return parts.join('\n\n')
  }

  /**
   * Extract tool calls from response
   */
  private extractToolCalls(response: any): ToolCall[] {
    // Implementation depends on OpenCode response structure
    return response.toolCalls || []
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<string[]> {
    return Array.from(this.models.keys())
  }

  /**
   * Get model capabilities
   */
  async getModelCapabilities(model: string): Promise<ModelCapabilities> {
    return {
      maxTokens: 4096,
      supportsStreaming: true,
      supportsTools: true,
      supportsImages: model.includes('vision'),
      supportsContext: true,
    }
  }
}

interface ToolCall {
  id: string
  toolName: string
  params: Record<string, any>
}

interface ModelCapabilities {
  maxTokens: number
  supportsStreaming: boolean
  supportsTools: boolean
  supportsImages: boolean
  supportsContext: boolean
}
```

### 1.4 API Endpoints

**File: `/backend/src/routes/ai.ts`**

```typescript
import { Hono } from 'hono'
import { verify } from '../middleware/auth'
import { OpenCodeAgent } from '../services/OpenCodeAgent'

const router = new Hono()
const agent = new OpenCodeAgent()

// POST /api/ai/chat
router.post('/chat', verify, async (c) => {
  const { message, projectId, context, model } = await c.req.json()

  try {
    const response = await agent.chat(message, {
      projectId,
      userId: c.get('user').id,
      currentFile: context?.currentFile,
      selectedText: context?.selectedText,
    }, model)

    return c.json({
      success: true,
      data: response,
    })
  } catch (error) {
    return c.json({
      success: false,
      error: { message: error.message },
    }, 500)
  }
})

// GET /api/ai/models
router.get('/models', verify, async (c) => {
  try {
    const models = await agent.getAvailableModels()
    return c.json({
      success: true,
      data: { models },
    })
  } catch (error) {
    return c.json({
      success: false,
      error: { message: error.message },
    }, 500)
  }
})

// GET /api/ai/models/:id/capabilities
router.get('/models/:id/capabilities', verify, async (c) => {
  try {
    const capabilities = await agent.getModelCapabilities(c.param('id'))
    return c.json({
      success: true,
      data: capabilities,
    })
  } catch (error) {
    return c.json({
      success: false,
      error: { message: error.message },
    }, 500)
  }
})

export default router
```

### 1.5 Frontend Integration

**File: `/frontend/src/hooks/useChat.ts`**

```typescript
import { useState, useCallback } from 'react'
import { create } from 'zustand'
import { api } from '../services/api'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  model?: string
  timestamp: Date
}

interface ChatStore {
  messages: Message[]
  isLoading: boolean
  selectedModel: string
  sendMessage: (message: string, context?: any) => Promise<void>
  setSelectedModel: (model: string) => Promise<void>
  clearHistory: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isLoading: false,
  selectedModel: 'claude-3-sonnet',

  sendMessage: async (message: string, context?: any) => {
    set({ isLoading: true })

    try {
      // Add user message to history
      const userMsg: Message = {
        id: Date.now().toString(),
        content: message,
        role: 'user',
        timestamp: new Date(),
      }

      set((state) => ({
        messages: [...state.messages, userMsg],
      }))

      // Send to backend
      const response = await api.post('/ai/chat', {
        message,
        context,
        model: (useSelector((state) => state.selectedModel))(),
      })

      // Add assistant response
      const assistantMsg: Message = {
        id: response.data.id,
        content: response.data.content,
        role: 'assistant',
        model: response.data.model,
        timestamp: new Date(),
      }

      set((state) => ({
        messages: [...state.messages, assistantMsg],
        isLoading: false,
      }))
    } catch (error) {
      console.error('Chat error:', error)
      set({ isLoading: false })
      throw error
    }
  },

  setSelectedModel: async (model: string) => {
    // Verify model is available
    const response = await api.get(`/ai/models/${model}/capabilities`)
    if (response.success) {
      set({ selectedModel: model })
    }
  },

  clearHistory: () => {
    set({ messages: [] })
  },
}))

export const useChat = () => {
  const store = useChatStore()
  return store
}
```

---

## 2. Model Context Protocol (MCP) Integration

### 2.1 What is MCP?

MCP is an open protocol (hosted by Linux Foundation) that:
- Standardizes how AI agents interact with external tools and services
- Provides a client-server architecture with JSON-RPC messaging
- Defines tools, resources, and prompts as extensions
- Enables seamless integration of custom capabilities

### 2.2 MCP Architecture in WebIDE

```
┌─────────────────┐
│  WebIDE Backend │
│  (MCP Client)   │
└────────┬────────┘
         │ JSON-RPC over stdio/HTTP
┌────────▼────────────────────────────┐
│      MCP Servers (can be N)         │
├────────────────────────────────────┤
│  code-master-ai-brain-mcp           │
│  (Custom AI brain for personalization)
│                                     │
│  Tools:                             │
│  - analyzeCode()                    │
│  - suggestRefactoring()             │
│  - predictBugs()                    │
│  - generateTests()                  │
└────────────────────────────────────┘
```

### 2.3 Backend Implementation

**File: `/backend/src/services/MCPBridge.ts`**

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { Tool, TextContent, ToolUseBlock } from '@modelcontextprotocol/sdk/types.js'

interface MCPServer {
  id: string
  name: string
  path: string // Path to executable
  transport?: StdioClientTransport
  client?: Client
  tools: Tool[]
  isConnected: boolean
}

export class MCPBridge {
  private servers: Map<string, MCPServer> = new Map()
  private toolCache: Map<string, ToolMetadata> = new Map()

  /**
   * Register and connect to an MCP server
   */
  async registerServer(
    id: string,
    name: string,
    executablePath: string
  ): Promise<void> {
    try {
      // Create transport using stdio (server must be an executable)
      const transport = new StdioClientTransport({
        command: executablePath,
        args: [],
      })

      // Create MCP client
      const client = new Client({
        name: 'webide-agent',
        version: '1.0.0',
      })

      // Connect to server
      await client.connect(transport)

      // Get available tools from server
      const tools = await client.listTools()

      // Store server info
      const server: MCPServer = {
        id,
        name,
        path: executablePath,
        transport,
        client,
        tools: tools.tools,
        isConnected: true,
      }

      this.servers.set(id, server)

      // Cache tools for quick lookup
      tools.tools.forEach((tool) => {
        this.toolCache.set(tool.name, {
          serverId: id,
          tool,
        })
      })

      console.log(`MCP Server registered: ${name} (${id})`)
    } catch (error) {
      console.error(`Failed to register MCP server ${name}:`, error)
      throw error
    }
  }

  /**
   * Execute a tool from an MCP server
   */
  async executeTool(
    toolName: string,
    params: Record<string, any>
  ): Promise<string> {
    const metadata = this.toolCache.get(toolName)

    if (!metadata) {
      throw new Error(`Tool not found: ${toolName}`)
    }

    const server = this.servers.get(metadata.serverId)
    if (!server || !server.client) {
      throw new Error(`MCP server not connected: ${metadata.serverId}`)
    }

    try {
      // Call tool through MCP
      const result = await server.client.callTool({
        name: toolName,
        arguments: params,
      })

      // Extract text content from result
      const textContent = result.content.find(
        (c) => c.type === 'text'
      ) as TextContent

      return textContent?.text || JSON.stringify(result.content)
    } catch (error) {
      throw new Error(`Tool execution failed: ${error.message}`)
    }
  }

  /**
   * Get all available tools across servers
   */
  async getAllTools(): Promise<ToolMetadata[]> {
    return Array.from(this.toolCache.values())
  }

  /**
   * Get tools from specific server
   */
  getServerTools(serverId: string): Tool[] {
    const server = this.servers.get(serverId)
    return server?.tools || []
  }

  /**
   * Disconnect from all servers
   */
  async disconnectAll(): Promise<void> {
    for (const [id, server] of this.servers.entries()) {
      if (server.client) {
        await server.client.close()
        server.isConnected = false
      }
    }
    this.servers.clear()
    this.toolCache.clear()
  }

  /**
   * Health check for servers
   */
  async healthCheck(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {}

    for (const [id, server] of this.servers.entries()) {
      try {
        // Try to list tools to verify connection
        await server.client?.listTools()
        health[id] = true
      } catch {
        health[id] = false
        server.isConnected = false
      }
    }

    return health
  }
}

interface ToolMetadata {
  serverId: string
  tool: Tool
}
```

### 2.4 code-master-ai-brain-mcp Integration

**File: `/backend/src/services/CodeMasterBrainMCP.ts`**

```typescript
import { MCPBridge } from './MCPBridge'
import { FileManager } from './FileManager'

/**
 * Integration with code-master-ai-brain-mcp
 * This MCP server provides personalized AI brain capabilities
 */
export class CodeMasterBrainMCP {
  private bridge: MCPBridge
  private fileManager: FileManager
  private serverId = 'code-master-ai-brain'

  constructor(bridge: MCPBridge, fileManager: FileManager) {
    this.bridge = bridge
    this.fileManager = fileManager
  }

  /**
   * Initialize and register the code-master-ai-brain MCP server
   */
  async initialize(executablePath: string): Promise<void> {
    try {
      await this.bridge.registerServer(
        this.serverId,
        'Code Master AI Brain',
        executablePath
      )
      console.log('Code Master AI Brain MCP initialized')
    } catch (error) {
      console.error('Failed to initialize Code Master AI Brain:', error)
      throw error
    }
  }

  /**
   * Analyze code for patterns and improvements
   */
  async analyzeCode(projectId: string, filePath: string): Promise<any> {
    const content = await this.fileManager.readFile(projectId, filePath)

    return this.bridge.executeTool('analyzeCode', {
      code: content,
      language: this.detectLanguage(filePath),
      filePath,
    })
  }

  /**
   * Get refactoring suggestions
   */
  async suggestRefactoring(projectId: string, filePath: string): Promise<any> {
    const content = await this.fileManager.readFile(projectId, filePath)

    return this.bridge.executeTool('suggestRefactoring', {
      code: content,
      language: this.detectLanguage(filePath),
      filePath,
    })
  }

  /**
   * Predict potential bugs
   */
  async predictBugs(projectId: string, filePath: string): Promise<any> {
    const content = await this.fileManager.readFile(projectId, filePath)

    return this.bridge.executeTool('predictBugs', {
      code: content,
      language: this.detectLanguage(filePath),
    })
  }

  /**
   * Generate test cases
   */
  async generateTests(projectId: string, filePath: string): Promise<any> {
    const content = await this.fileManager.readFile(projectId, filePath)

    return this.bridge.executeTool('generateTests', {
      code: content,
      language: this.detectLanguage(filePath),
      filePath,
    })
  }

  /**
   * Get personalized coding recommendations
   */
  async getRecommendations(userId: string, projectId: string): Promise<any> {
    return this.bridge.executeTool('getRecommendations', {
      userId,
      projectId,
    })
  }

  private detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase()

    const languages: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      go: 'go',
      rs: 'rust',
      java: 'java',
      cs: 'csharp',
      cpp: 'cpp',
      c: 'c',
    }

    return languages[ext!] || 'unknown'
  }
}
```

### 2.5 MCP API Routes

**File: `/backend/src/routes/mcp.ts`**

```typescript
import { Hono } from 'hono'
import { verify } from '../middleware/auth'
import { mcpBridge } from '../services/index'

const router = new Hono()

// GET /api/mcp/servers
router.get('/servers', verify, async (c) => {
  try {
    const tools = await mcpBridge.getAllTools()
    const health = await mcpBridge.healthCheck()

    return c.json({
      success: true,
      data: {
        servers: Array.from(mcpBridge['servers'].values()).map((s) => ({
          id: s.id,
          name: s.name,
          status: s.isConnected ? 'connected' : 'disconnected',
          health: health[s.id],
          toolCount: s.tools.length,
        })),
        tools,
      },
    })
  } catch (error) {
    return c.json(
      {
        success: false,
        error: { message: error.message },
      },
      500
    )
  }
})

// POST /api/mcp/tools/:toolName
router.post('/tools/:toolName', verify, async (c) => {
  try {
    const toolName = c.param('toolName')
    const params = await c.req.json()

    const result = await mcpBridge.executeTool(toolName, params)

    return c.json({
      success: true,
      data: { result },
    })
  } catch (error) {
    return c.json(
      {
        success: false,
        error: { message: error.message },
      },
      500
    )
  }
})

export default router
```

---

## 3. Language Server Protocol (LSP) Integration

### 3.1 What is LSP?

LSP is a standardized protocol that enables:
- Language-agnostic code intelligence
- Real-time diagnostics (errors, warnings)
- Code completion and suggestions
- Go-to-definition and find references
- Symbol renaming and refactoring
- Code formatting

### 3.2 Backend LSP Manager

**File: `/backend/src/services/LSPManager.ts`**

```typescript
import { spawn, ChildProcess } from 'child_process'
import {
  createConnection,
  ProposedFeatures,
  TextDocuments,
  TextDocument,
  Connection,
} from 'vscode-languageserver'

interface LanguageServerConfig {
  language: string
  command: string
  args: string[]
  initializationOptions?: Record<string, any>
}

export class LSPManager {
  private servers: Map<string, LSPServerInstance> = new Map()
  private configs: Map<string, LanguageServerConfig> = new Map([
    [
      'typescript',
      {
        language: 'typescript',
        command: 'typescript-language-server',
        args: ['--stdio'],
      },
    ],
    [
      'python',
      {
        language: 'python',
        command: 'pylsp',
        args: [],
      },
    ],
    [
      'go',
      {
        language: 'go',
        command: 'gopls',
        args: [],
      },
    ],
  ])

  /**
   * Initialize language server for a project/language
   */
  async initializeServer(
    projectId: string,
    language: string
  ): Promise<LSPServerInstance> {
    const serverId = `${projectId}:${language}`

    // Check if already initialized
    if (this.servers.has(serverId)) {
      return this.servers.get(serverId)!
    }

    const config = this.configs.get(language)
    if (!config) {
      throw new Error(`LSP not configured for language: ${language}`)
    }

    try {
      const process = spawn(config.command, config.args)
      const connection = createConnection(
        ProposedFeatures.all,
        process.stdin,
        process.stdout
      )

      // Initialize the server
      await new Promise((resolve, reject) => {
        connection.onInitialize(() => {
          resolve(null)
          return {
            capabilities: {
              textDocumentSync: 1,
              completionProvider: { resolveProvider: true },
              hoverProvider: true,
              definitionProvider: true,
              referencesProvider: true,
              renameProvider: true,
              formattingProvider: true,
            },
          }
        })

        connection.onError((error) => reject(error))

        connection.listen()
      })

      const instance: LSPServerInstance = {
        id: serverId,
        language,
        connection,
        process,
        documents: new TextDocuments(TextDocument),
        isInitialized: true,
      }

      this.servers.set(serverId, instance)
      console.log(`LSP server initialized for ${language}`)

      return instance
    } catch (error) {
      throw new Error(`Failed to initialize LSP for ${language}: ${error}`)
    }
  }

  /**
   * Get completions at cursor position
   */
  async getCompletions(
    projectId: string,
    language: string,
    filePath: string,
    line: number,
    column: number
  ): Promise<any[]> {
    const server = await this.initializeServer(projectId, language)

    return new Promise((resolve, reject) => {
      server.connection.sendRequest('textDocument/completion', {
        textDocument: { uri: `file://${filePath}` },
        position: { line, character: column },
      }).then(resolve).catch(reject)
    })
  }

  /**
   * Get hover information
   */
  async getHover(
    projectId: string,
    language: string,
    filePath: string,
    line: number,
    column: number
  ): Promise<any> {
    const server = await this.initializeServer(projectId, language)

    return new Promise((resolve, reject) => {
      server.connection.sendRequest('textDocument/hover', {
        textDocument: { uri: `file://${filePath}` },
        position: { line, character: column },
      }).then(resolve).catch(reject)
    })
  }

  /**
   * Format document
   */
  async formatDocument(
    projectId: string,
    language: string,
    filePath: string
  ): Promise<any[]> {
    const server = await this.initializeServer(projectId, language)

    return new Promise((resolve, reject) => {
      server.connection.sendRequest('textDocument/formatting', {
        textDocument: { uri: `file://${filePath}` },
        options: {
          tabSize: 2,
          insertSpaces: true,
        },
      }).then(resolve).catch(reject)
    })
  }

  /**
   * Close all servers
   */
  async closeAll(): Promise<void> {
    for (const [, instance] of this.servers.entries()) {
      instance.connection.dispose()
      instance.process.kill()
    }
    this.servers.clear()
  }
}

interface LSPServerInstance {
  id: string
  language: string
  connection: Connection
  process: ChildProcess
  documents: TextDocuments<TextDocument>
  isInitialized: boolean
}
```

### 3.3 LSP Integration Routes

**File: `/backend/src/routes/lsp.ts`**

```typescript
import { Hono } from 'hono'
import { verify } from '../middleware/auth'
import { lspManager } from '../services/index'

const router = new Hono()

// POST /api/lsp/completions
router.post('/completions', verify, async (c) => {
  const { projectId, language, file, line, column } = await c.req.json()

  try {
    const completions = await lspManager.getCompletions(
      projectId,
      language,
      file,
      line,
      column
    )

    return c.json({
      success: true,
      data: { items: completions },
    })
  } catch (error) {
    return c.json(
      {
        success: false,
        error: { message: error.message },
      },
      500
    )
  }
})

// POST /api/lsp/hover
router.post('/hover', verify, async (c) => {
  const { projectId, language, file, line, column } = await c.req.json()

  try {
    const hover = await lspManager.getHover(projectId, language, file, line, column)

    return c.json({
      success: true,
      data: hover,
    })
  } catch (error) {
    return c.json(
      {
        success: false,
        error: { message: error.message },
      },
      500
    )
  }
})

// POST /api/lsp/format
router.post('/format', verify, async (c) => {
  const { projectId, language, file } = await c.req.json()

  try {
    const edits = await lspManager.formatDocument(projectId, language, file)

    return c.json({
      success: true,
      data: { edits },
    })
  } catch (error) {
    return c.json(
      {
        success: false,
        error: { message: error.message },
      },
      500
    )
  }
})

export default router
```

---

## 4. Integration Workflow

### 4.1 Request Flow with All Components

```
User Input (Chat)
    ↓
Frontend ChatPanel sends message to /api/ai/chat
    ↓
Backend OpenCodeAgent receives request
    ↓
OpenCode SDK processes with context (current file, project, etc.)
    ↓
OpenCode may call tools → MCP Bridge routes to appropriate servers
    ├─ code-master-ai-brain-mcp (analysis, patterns, recommendations)
    ├─ Custom MCP servers (domain-specific tools)
    └─ Tool results → OpenCode for context
    ↓
OpenCode generates response with possible file changes/suggestions
    ↓
Response → Frontend Chat UI
    ↓
If code generation: User can apply changes to editor
    ↓
Filefs → LSP servers notified of changes
    ↓
LSP provides diagnostics, completions, etc.
```

### 4.2 Configuration File

**File: `/backend/src/config.ts`**

```typescript
import dotenv from 'dotenv'

dotenv.config()

export const config = {
  // OpenCode Configuration
  OPENCODE_API_KEY: process.env.OPENCODE_API_KEY || '',
  OPENCODE_DEFAULT_MODEL: process.env.OPENCODE_DEFAULT_MODEL || 'claude-3-sonnet',

  // MCP Configuration
  MCP_SERVERS: [
    {
      id: 'code-master-ai-brain',
      name: 'Code Master AI Brain',
      path: process.env.CODE_MASTER_MCP_PATH || './bin/code-master-mcp',
    },
  ],

  // LSP Configuration
  LSP_SERVERS: {
    typescript: 'typescript-language-server',
    python: 'pylsp',
    go: 'gopls',
  },

  // Other config...
}
```

### 4.3 Service Initialization

**File: `/backend/src/services/index.ts`**

```typescript
import { OpenCodeAgent } from './OpenCodeAgent'
import { MCPBridge } from './MCPBridge'
import { CodeMasterBrainMCP } from './CodeMasterBrainMCP'
import { LSPManager } from './LSPManager'
import { FileManager } from './FileManager'
import { config } from '../config'

// Initialize services
const openCodeAgent = new OpenCodeAgent()
const mcpBridge = new MCPBridge()
const fileManager = new FileManager()
const codeMasterBrain = new CodeMasterBrainMCP(mcpBridge, fileManager)
const lspManager = new LSPManager()

// Register MCP servers on startup
async function initializeServices() {
  try {
    // Register code-master-ai-brain MCP
    for (const server of config.MCP_SERVERS) {
      await mcpBridge.registerServer(server.id, server.name, server.path)
    }

    console.log('All integration services initialized')
  } catch (error) {
    console.error('Service initialization error:', error)
    process.exit(1)
  }
}

export {
  openCodeAgent,
  mcpBridge,
  codeMasterBrain,
  lspManager,
  fileManager,
  initializeServices,
}
```

---

## 5. Development and Testing

### 5.1 Testing OpenCode Integration

```bash
# Test OpenCode chat endpoint
curl -X POST http://localhost:3001/api/ai/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I optimize this function?",
    "projectId": "proj-123",
    "context": {
      "currentFile": "/src/utils.ts",
      "selectedText": "function sum(arr) { ... }"
    },
    "model": "claude-3-sonnet"
  }'
```

### 5.2 Testing MCP Tool Execution

```bash
# Execute MCP tool
curl -X POST http://localhost:3001/api/mcp/tools/analyzeCode \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function test() { return 42; }",
    "language": "javascript"
  }'
```

### 5.3 Testing LSP Features

```bash
# Get code completions
curl -X POST http://localhost:3001/api/lsp/completions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj-123",
    "language": "typescript",
    "file": "/src/index.ts",
    "line": 10,
    "column": 5
  }'
```

---

## 6. Troubleshooting

### Issue: OpenCode API Key Not Working

```typescript
// Check configuration
console.log('OpenCode API Key:', config.OPENCODE_API_KEY ? 'SET' : 'MISSING')

// Verify token
const testResponse = await openCodeAgent.getAvailableModels()
```

### Issue: MCP Server Connection Failed

```typescript
// Check executable path
ls -la /path/to/code-master-mcp

// Test MCP registration
await mcpBridge.registerServer(...)
const health = await mcpBridge.healthCheck()
```

### Issue: LSP Not Providing Completions

```bash
# Verify LSP is installed
which typescript-language-server
which pylsp

# Check LSP logs
DEBUG=* npm run dev
```

---

## 7. Next Steps

1. **Phase 1**: Basic OpenCode chat integration (read-only)
2. **Phase 2**: Add tool execution through MCP bridge
3. **Phase 3**: Integrate code-master-ai-brain-mcp (when available)
4. **Phase 4**: Full LSP integration for all languages
5. **Phase 5**: Advanced features (collaborative AI, shared brain models)
