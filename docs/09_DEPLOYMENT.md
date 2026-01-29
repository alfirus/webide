# Deployment Guide

## Overview

This guide covers deploying WebIDE to production environments, from containerization to cloud platforms.

## 1. Local Deployment (Development)

### 1.1 Docker Compose Setup

**File: `/docker-compose.yml`**

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: webide-db
    environment:
      POSTGRES_USER: webide
      POSTGRES_PASSWORD: ${DB_PASSWORD:-secure_password_change_me}
      POSTGRES_DB: webide
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/src/migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U webide']
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: webide-cache
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend Service
  backend:
    build:
      context: ./backend
      dockerfile: ../docker/Dockerfile.backend
    container_name: webide-backend
    ports:
      - '3001:3001'
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://webide:${DB_PASSWORD:-secure_password_change_me}@postgres:5432/webide
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET:-dev_secret_key}
      OPENCODE_API_KEY: ${OPENCODE_API_KEY}
      OPENCODE_DEFAULT_MODEL: ${OPENCODE_DEFAULT_MODEL:-claude-3-sonnet}
      CORS_ORIGIN: http://localhost:5173
      LOG_LEVEL: debug
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend/src:/app/src
      - ./backend/node_modules:/app/node_modules
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3001/api/health']
      interval: 10s
      timeout: 5s
      retries: 5

  # Frontend Service
  frontend:
    build:
      context: ./frontend
      dockerfile: ../docker/Dockerfile.frontend
      target: development
    container_name: webide-frontend
    ports:
      - '5173:5173'
    environment:
      VITE_API_URL: http://localhost:3001
      VITE_WS_URL: ws://localhost:3001
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/node_modules:/app/node_modules
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:

networks:
  default:
    name: webide-network
```

### 1.2 Running Locally

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Clean up volumes
docker-compose down -v

# Rebuild images after code changes
docker-compose build
docker-compose up -d
```

---

## 2. Docker Images

### 2.1 Backend Dockerfile

**File: `/docker/Dockerfile.backend`**

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source
COPY src ./src
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Install dumb-init (signal handling)
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S app && \
    adduser -S app -u 1001

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist

# Set permissions
RUN chown -R app:app /app

# Switch to non-root user
USER app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals
ENTRYPOINT ["/sbin/dumb-init", "--"]

# Start application
CMD ["node", "dist/server.js"]

EXPOSE 3001
```

### 2.2 Frontend Dockerfile

**File: `/docker/Dockerfile.frontend`**

```dockerfile
# Development stage
FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build application
RUN npm run build

# Production stage (Nginx)
FROM nginx:alpine AS production

# Copy built files to Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/api/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 2.3 Nginx Configuration

**File: `/docker/nginx.conf`**

```nginx
server {
  listen 80;
  server_name _;

  # Security headers
  add_header X-Frame-Options "DENY" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;

  # Gzip compression
  gzip on;
  gzip_types text/plain text/css text/javascript application/json;
  gzip_vary on;
  gzip_min_length 1000;

  root /usr/share/nginx/html;
  index index.html;

  # API proxy
  location /api/ {
    proxy_pass http://backend:3001/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;
  }

  # SPA routing
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Deny access to sensitive files
  location ~ /\. {
    deny all;
  }
}
```

---

## 3. Single Server Deployment

### 3.1 VPS Setup

**Requirements**:
- Ubuntu 22.04 LTS
- 4 CPU cores
- 8GB RAM
- 50GB SSD
- Public IP address

**Initial Setup**:
```bash
# Connect to server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create app directory
mkdir -p /opt/webide
cd /opt/webide

# Clone repository
git clone <your-repo-url> .

# Create .env file
cp .env.example .env
# Edit .env with production values
nano .env
```

### 3.2 SSL/TLS Certificate

**Using Let's Encrypt**:
```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Generate certificate
certbot certonly --standalone \
  -d your-domain.com \
  -d www.your-domain.com

# Update Nginx configuration
nano docker/nginx.conf
```

**Updated Nginx Config**:
```nginx
server {
  listen 80;
  server_name your-domain.com;
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name your-domain.com;

  ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

  # ... rest of configuration
}
```

### 3.3 Deployment Script

**File: `/scripts/deploy.sh`**

```bash
#!/bin/bash

set -e

echo "Starting WebIDE deployment..."

# Pull latest code
git pull origin main

# Update environment file
read -p "Is .env file up to date? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Proceeding with deployment..."
else
  nano .env
fi

# Build images
echo "Building Docker images..."
docker-compose build --no-cache

# Stop old containers
echo "Stopping old containers..."
docker-compose down

# Start new containers
echo "Starting new containers..."
docker-compose up -d

# Run migrations
echo "Running database migrations..."
docker-compose exec -T backend npm run migrate

# Check health
echo "Checking service health..."
sleep 10
docker-compose ps

echo "Deployment complete!"
```

---

## 4. Kubernetes Deployment

### 4.1 Kubernetes Manifests

**File: `/k8s/namespace.yaml`**

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: webide
```

**File: `/k8s/postgres.yaml`**

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: webide
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi

---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: webide
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_USER
          value: webide
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
        - name: POSTGRES_DB
          value: webide
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes:
        - ReadWriteOnce
      resources:
        requests:
          storage: 50Gi
```

**File: `/k8s/redis.yaml`**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: webide
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"

---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: webide
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
  type: ClusterIP
```

**File: `/k8s/backend.yaml`**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: webide
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: your-registry/webide-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: production
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: connection-string
        - name: REDIS_URL
          value: redis://redis:6379
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        - name: OPENCODE_API_KEY
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: opencode-api-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: webide
spec:
  selector:
    app: backend
  ports:
  - port: 80
    targetPort: 3001
  type: LoadBalancer
```

### 4.2 Kubernetes Deployment Commands

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create secrets
kubectl create secret generic db-credentials \
  --from-literal=password=your_secure_password \
  --from-literal=connection-string=postgresql://webide:password@postgres:5432/webide \
  -n webide

kubectl create secret generic app-secrets \
  --from-literal=jwt-secret=your_jwt_secret \
  --from-literal=opencode-api-key=your_opencode_key \
  -n webide

# Deploy services
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml

# Check status
kubectl get pods -n webide
kubectl get services -n webide

# View logs
kubectl logs -f deployment/backend -n webide
```

---

## 5. Cloud Platform Deployment

### 5.1 AWS ECS Deployment

**Task Definition** (`webide-task-definition.json`):
```json
{
  "family": "webide",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "YOUR_ECR_REGISTRY/webide-backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:webide/db-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/webide",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### 5.2 Azure Container Instances

```bash
# Create resource group
az group create \
  --name webide \
  --location eastus

# Create container registry
az acr create \
  --resource-group webide \
  --name webideregistry \
  --sku Basic

# Deploy container
az container create \
  --resource-group webide \
  --name webide-app \
  --image webideregistry.azurecr.io/webide-backend:latest \
  --cpu 2 \
  --memory 4 \
  --port 3001 \
  --environment-variables \
    NODE_ENV=production
```

---

## 6. Monitoring & Logging

### 6.1 Prometheus Monitoring

**File: `/docker/prometheus.yml`**

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:9121']
```

### 6.2 ELK Stack Setup

```yaml
# docker-compose addition
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
  environment:
    - discovery.type=single-node
  ports:
    - "9200:9200"

kibana:
  image: docker.elastic.co/kibana/kibana:8.0.0
  ports:
    - "5601:5601"

logstash:
  image: docker.elastic.co/logstash/logstash:8.0.0
  volumes:
    - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
  ports:
    - "5000:5000"
```

---

## 7. Backup & Recovery

### 7.1 Database Backups

```bash
#!/bin/bash
# backup-db.sh

BACKUP_DIR="/backups/webide"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker-compose exec -T postgres pg_dump \
  -U webide webide | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Upload to S3
aws s3 cp $BACKUP_DIR/db_$DATE.sql.gz \
  s3://your-bucket/backups/

# Keep only last 30 days
find $BACKUP_DIR -mtime +30 -delete
```

### 7.2 Restore from Backup

```bash
# Restore database
gunzip < /backups/webide/db_YYYYMMDD_HHMMSS.sql.gz | \
  docker-compose exec -T postgres psql -U webide webide
```

---

## 8. CI/CD Pipeline

### 8.1 GitHub Actions

**File: `.github/workflows/deploy.yml`**

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test
      - run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/setup-buildx-action@v2
      - uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: ghcr.io/username/webide-backend:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/webide
            git pull origin main
            docker-compose pull
            docker-compose up -d
```

---

## 9. Health Checks & Alerts

### 9.1 Health Endpoint

```typescript
// backend/src/routes/health.ts
router.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})
```

### 9.2 Monitoring Alerts

**PagerDuty Integration**:
```bash
# Alert on service down
if ! curl -f http://localhost:3001/api/health; then
  curl -X POST https://events.pagerduty.com/v2/enqueue \
    -H 'Content-Type: application/json' \
    -d @- << EOF
{
  "routing_key": "$PAGERDUTY_KEY",
  "event_action": "trigger",
  "payload": {
    "summary": "WebIDE backend service down",
    "severity": "critical",
    "source": "monitoring"
  }
}
EOF
fi
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Code review approved
- [ ] Security audit completed
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] SSL certificates valid
- [ ] Backups created

### Deployment
- [ ] Pull latest code
- [ ] Build Docker images
- [ ] Run database migrations
- [ ] Start containers
- [ ] Verify health checks
- [ ] Run smoke tests
- [ ] Monitor logs for errors

### Post-Deployment
- [ ] Monitor application metrics
- [ ] Check error logs
- [ ] Verify database connectivity
- [ ] Test user workflows
- [ ] Document deployment
- [ ] Notify stakeholders
- [ ] Schedule post-mortem if issues

---

See [08_SECURITY.md](08_SECURITY.md) for security hardening steps during deployment.
