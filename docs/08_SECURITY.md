# Security Guide

## Overview

This document outlines security best practices, threat models, and implementation guidelines for the WebIDE application.

## 1. Authentication & Authorization

### 1.1 Password Security

**Requirements**:
- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Implementation**:
```typescript
// backend/src/utils/validation.ts
export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
```

**Password Hashing**:
```typescript
import bcrypt from 'bcrypt'

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12 // Increased iterations
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
```

### 1.2 JWT Token Management

**Token Structure**:
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "iat": 1672531200,
  "exp": 1672617600,
  "type": "access",
  "scope": ["read:projects", "write:projects", "execute:code"]
}
```

**Token Best Practices**:
1. **Short Expiration**: Access tokens expire in 24 hours
2. **Refresh Tokens**: Separate refresh tokens with 30-day expiration
3. **Secure Storage**: Store refresh tokens in secure HTTP-only cookies
4. **Token Rotation**: Issue new tokens on refresh, invalidate old ones
5. **Revocation**: Maintain blacklist of revoked tokens in Redis

**Implementation**:
```typescript
// backend/src/utils/jwt.ts
import jwt from 'jsonwebtoken'
import { config } from '../config'

export function generateAccessToken(userId: string, email: string): string {
  return jwt.sign(
    {
      sub: userId,
      email,
      type: 'access',
    },
    config.JWT_SECRET,
    {
      expiresIn: '24h',
      algorithm: 'HS256',
    }
  )
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    {
      sub: userId,
      type: 'refresh',
    },
    config.JWT_REFRESH_SECRET,
    {
      expiresIn: '30d',
      algorithm: 'HS256',
    }
  )
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, config.JWT_SECRET)
  } catch (error) {
    throw new Error('Invalid token')
  }
}

export function revokeToken(token: string): void {
  // Add token to blacklist in Redis with expiration
  const decoded = jwt.decode(token) as any
  const expiresIn = decoded.exp - Math.floor(Date.now() / 1000)
  redis.setex(`blacklist:${token}`, expiresIn, '1')
}
```

### 1.3 OAuth2 Integration (Future)

Support for third-party authentication:
- GitHub OAuth
- Google OAuth
- Microsoft OAuth

```typescript
// backend/src/services/OAuthService.ts
export class OAuthService {
  async handleGitHubCallback(code: string): Promise<{ user, token }> {
    // Exchange code for access token
    // Get user info from GitHub
    // Create/update user in database
    // Issue WebIDE JWT token
  }
}
```

---

## 2. Code Execution Security

### 2.1 Sandbox Architecture

**Critical**: Never execute untrusted code directly in the main process.

**Implementation**:
1. **Docker Container Isolation**
   - Separate container per execution
   - Resource limits (CPU, memory, disk)
   - Network isolation
   - Read-only file system (except for code)

2. **Security Policies**
   ```dockerfile
   # Dockerfile for execution sandbox
   FROM node:20-alpine
   
   # Run as non-root user
   RUN addgroup -g 1001 -S app && \
       adduser -S app -u 1001
   
   USER app
   
   # Set resource limits
   # CPU: 1 core
   # Memory: 512MB
   # Disk: 100MB
   
   # Disable network access
   # Only allow stdout/stderr output
   ```

3. **Execution Timeout**
   ```typescript
   // backend/src/services/CodeExecutor.ts
   const EXECUTION_TIMEOUT = 30000 // 30 seconds
   
   async function executeCode(
     code: string,
     language: string
   ): Promise<ExecutionResult> {
     const container = await docker.createContainer({
       Image: `execution-${language}:latest`,
       Cmd: ['node', '-e', code],
       HostConfig: {
         Memory: 512 * 1024 * 1024, // 512MB
         MemorySwap: 512 * 1024 * 1024,
         CpuQuota: 100000, // 1 core
         CpuPeriod: 100000,
         ReadonlyRootfs: false,
         NetworkMode: 'none', // No network
       },
     })
     
     // Execute with timeout
     const result = await Promise.race([
       container.attach(...),
       timeout(EXECUTION_TIMEOUT),
     ])
     
     await container.remove()
     return result
   }
   ```

### 2.2 Output Validation

**Prevent Information Disclosure**:
```typescript
function sanitizeOutput(output: string): string {
  // Remove sensitive information
  return output
    .replace(/\/home\/[^\s]+/g, '/home/***')
    .replace(/\/root\/[^\s]+/g, '/root/***')
    .replace(/password\s*=\s*[^\n]+/gi, 'password=***')
    .replace(/token\s*=\s*[^\n]+/gi, 'token=***')
    .replace(/api[_-]?key\s*=\s*[^\n]+/gi, 'api_key=***')
}
```

### 2.3 Resource Quotas

**Enforce Limits**:
```typescript
interface ExecutionLimits {
  timeout: number // milliseconds
  memory: number // bytes
  cpu: number // cores
  diskSpace: number // bytes
  fileDescriptors: number
  processes: number
}

const DEFAULT_LIMITS: ExecutionLimits = {
  timeout: 30000, // 30 seconds
  memory: 512 * 1024 * 1024, // 512MB
  cpu: 1, // 1 core
  diskSpace: 100 * 1024 * 1024, // 100MB
  fileDescriptors: 256,
  processes: 10,
}
```

---

## 3. Data Protection

### 3.1 Encryption at Rest

**Database Encryption**:
```typescript
// Use encrypted connection
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require&ssl=true
```

**Sensitive Field Encryption**:
```typescript
// backend/src/utils/encryption.ts
import crypto from 'crypto'

const algorithm = 'aes-256-gcm'
const key = crypto.scryptSync(config.ENCRYPTION_KEY, 'salt', 32)

export function encryptField(plaintext: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`
}

export function decryptField(encrypted: string): string {
  const [iv, encryptedText, authTag] = encrypted.split(':')
  
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(iv, 'hex')
  )
  decipher.setAuthTag(Buffer.from(authTag, 'hex'))
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
```

### 3.2 Encryption in Transit

**HTTPS/TLS**:
```typescript
// Enforce HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((c, next) => {
    if (c.req.header('x-forwarded-proto') !== 'https') {
      return c.redirect(`https://${c.req.header('host')}${c.req.path}`)
    }
    return next()
  })
}
```

**HSTS Header**:
```typescript
app.use((c, next) => {
  c.header('strict-transport-security', 'max-age=31536000; includeSubDomains')
  return next()
})
```

**TLS Configuration**:
```typescript
// Use TLS 1.3
const options = {
  key: fs.readFileSync('/path/to/key.pem'),
  cert: fs.readFileSync('/path/to/cert.pem'),
  minVersion: 'TLSv1.3' as any,
}
```

### 3.3 File Access Control

**Path Validation**:
```typescript
// backend/src/services/FileManager.ts
export class FileManager {
  private basePath: string

  async readFile(projectId: string, filePath: string): Promise<string> {
    // Validate path to prevent directory traversal
    const fullPath = path.join(this.basePath, projectId, filePath)
    const realPath = path.resolve(fullPath)
    const basePath = path.resolve(this.basePath)

    if (!realPath.startsWith(basePath)) {
      throw new Error('Invalid file path')
    }

    // Check file permissions
    const stat = await fs.promises.stat(realPath)
    if (!stat.isFile()) {
      throw new Error('Not a file')
    }

    return fs.promises.readFile(realPath, 'utf-8')
  }
}
```

---

## 4. API Security

### 4.1 Input Validation

**Schema Validation**:
```typescript
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(12).max(128),
})

export async function login(c: Context) {
  const body = await c.req.json()
  const result = loginSchema.safeParse(body)

  if (!result.success) {
    return c.json(
      {
        success: false,
        error: { details: result.error.flatten() },
      },
      400
    )
  }

  // Process valid input
}
```

### 4.2 Rate Limiting

**Implementation**:
```typescript
import rateLimit from 'hono-rate-limiter'
import RedisStore from 'rate-limit-redis'

const limiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate-limit:',
  }),
})

// Different limits for different endpoints
app.post('/api/auth/login', rateLimit({ windowMs: 60000, max: 5 }), login)
app.post('/api/auth/register', rateLimit({ windowMs: 60000, max: 3 }), register)
app.get('/api/files/*', rateLimit({ windowMs: 60000, max: 100 }), readFile)
app.post('/api/execute', rateLimit({ windowMs: 3600000, max: 50 }), execute)
```

### 4.3 CORS Configuration

**Strict CORS**:
```typescript
import cors from '@hono/cors'

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 3600,
  })
)
```

### 4.4 CSRF Protection

**Token-Based CSRF**:
```typescript
import csrf from 'hono-csrf'

app.use(csrf())

// Include in form/AJAX requests
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content
fetch('/api/files', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
  },
})
```

---

## 5. Content Security Policy

**CSP Headers**:
```typescript
app.use((c, next) => {
  c.header('content-security-policy', [
    "default-src 'self'",
    "script-src 'self' 'nonce-{random}'",
    "style-src 'self' 'nonce-{random}'",
    "img-src 'self' data: https:",
    "connect-src 'self' wss: https:",
    "font-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '))
  return next()
})
```

---

## 6. Error Handling

**Don't Expose Internal Details**:
```typescript
// ❌ Bad
throw new Error(`Database connection failed: ${error.message}`)

// ✅ Good
logger.error('Database connection failed', { error })
throw new Error('An error occurred. Please try again later.')
```

**Proper Error Responses**:
```typescript
export async function errorHandler(c: Context, error: Error) {
  // Log full error
  logger.error('Request error', {
    path: c.req.path,
    method: c.req.method,
    error: error.message,
    stack: error.stack,
  })

  // Return generic message to client
  return c.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred processing your request',
      },
    },
    500
  )
}
```

---

## 7. Dependency Security

### 7.1 Vulnerability Scanning

**Automated Scanning**:
```bash
# npm audit
npm audit

# Fix vulnerabilities
npm audit fix
npm audit fix --force
```

**Dependabot Configuration** (`.github/dependabot.yml`):
```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: '/backend'
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
    reviewers:
      - '@security-team'

  - package-ecosystem: npm
    directory: '/frontend'
    schedule:
      interval: weekly
```

### 7.2 Version Pinning

```json
{
  "dependencies": {
    "hono": "0.0.13",
    "pg": "8.10.0",
    "bcrypt": "5.1.1"
  }
}
```

---

## 8. Logging & Monitoring

### 8.1 Security Logging

**Log Security Events**:
```typescript
// backend/src/utils/securityLogger.ts
interface SecurityEvent {
  type: string // 'login', 'failed_login', 'unauthorized_access', etc.
  userId?: string
  ip: string
  userAgent: string
  resource?: string
  action?: string
  result: 'success' | 'failure'
  details?: Record<string, any>
}

export function logSecurityEvent(event: SecurityEvent) {
  logger.info('SECURITY_EVENT', {
    ...event,
    timestamp: new Date().toISOString(),
  })

  // Also send to security monitoring service
  if (event.result === 'failure') {
    alertSecurityTeam(event)
  }
}
```

**Usage**:
```typescript
logSecurityEvent({
  type: 'unauthorized_access',
  userId: 'user-123',
  ip: c.req.header('x-forwarded-for'),
  userAgent: c.req.header('user-agent'),
  resource: '/api/files/proj-456/sensitive.env',
  action: 'read',
  result: 'failure',
})
```

### 8.2 Anomaly Detection

```typescript
// Detect suspicious activity
interface SuspiciousActivity {
  multipleFailedLogins: boolean
  bruteForceAttempt: boolean
  unusualAccess: boolean
}

async function detectAnomalies(userId: string): Promise<SuspiciousActivity> {
  const recentEvents = await logger.query({
    userId,
    timeRange: '10m',
  })

  const failedLogins = recentEvents.filter((e) => e.type === 'failed_login').length

  return {
    multipleFailedLogins: failedLogins > 5,
    bruteForceAttempt: failedLogins > 10,
    unusualAccess: await checkUnusualAccess(userId),
  }
}
```

---

## 9. Threat Model

### 9.1 Attack Vectors

| Threat | Mitigation |
|--------|-----------|
| SQL Injection | Parameterized queries, ORM |
| XSS | Input sanitization, CSP, output encoding |
| CSRF | CSRF tokens, SameSite cookies |
| Brute Force | Rate limiting, account lockout |
| DDoS | Rate limiting, WAF, CDN |
| Code Execution | Container sandbox, resource limits |
| Data Breach | Encryption at rest/transit, access control |
| Session Hijacking | Secure cookies, short token expiration |
| Privilege Escalation | RBAC, ownership checks |
| Information Disclosure | Error handling, secure logging |

---

## 10. Compliance & Audit

### 10.1 Compliance Standards

- **GDPR**: User data privacy and deletion
- **SOC 2**: Security controls and monitoring
- **OWASP Top 10**: Common vulnerabilities
- **CWE**: Common Weakness Enumeration

### 10.2 Audit Trail

```typescript
// Track all sensitive operations
interface AuditLog {
  timestamp: Date
  userId: string
  action: string
  resource: string
  changes: {
    before: any
    after: any
  }
  result: 'success' | 'failure'
  ip: string
}

export async function logAudit(log: AuditLog) {
  await db.auditLogs.insert(log)
}
```

### 10.3 Data Retention

```typescript
// Auto-delete old audit logs
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
await db.auditLogs.delete({
  timestamp: { $lt: thirtyDaysAgo },
})
```

---

## 11. Security Checklist

### Development
- [ ] Use environment variables for secrets
- [ ] Validate all user inputs
- [ ] Never log sensitive data
- [ ] Use parameterized queries
- [ ] Enable HTTPS/TLS
- [ ] Implement rate limiting
- [ ] Use security headers
- [ ] Implement CSRF protection

### Deployment
- [ ] Update dependencies
- [ ] Run security audit
- [ ] Configure firewall
- [ ] Set up monitoring
- [ ] Enable logging
- [ ] Backup database
- [ ] Test disaster recovery
- [ ] Review access controls

### Maintenance
- [ ] Regular security updates
- [ ] Monthly vulnerability scans
- [ ] Audit access logs
- [ ] Rotate secrets
- [ ] Update security policies
- [ ] Security training

---

## 12. Incident Response

### 12.1 Breach Response Plan

1. **Immediate Actions** (first hour)
   - Isolate affected systems
   - Preserve logs
   - Notify security team
   - Disable compromised accounts

2. **Investigation** (first 24 hours)
   - Determine breach scope
   - Identify affected users/data
   - Find root cause
   - Notify stakeholders

3. **Remediation** (ongoing)
   - Patch vulnerabilities
   - Reset credentials
   - Notify affected users
   - Update security

4. **Post-Incident**
   - Document lessons learned
   - Update processes
   - Provide transparency report
   - Improve defenses

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Hono Security](https://hono.dev/guides/security)
- [Docker Security](https://docs.docker.com/engine/security/)
