/**
 * @file Contains content for files common to all project templates.
 */

const faviconBase64Content = 'AAABAAEAEBAQAAEABAAoAQAAFgAAACgAAAAQAAAAIAAAAAEABAAAAAAAgAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAA/4QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

const nextConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = nextConfig;
`;

const postcssConfigContent = `module.exports = {
  plugins: [],
};
`;

const tsConfigContent = `{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@/convex/*": ["./convex/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`;

const gitignoreContent = `# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# Convex
.convex
convex/.convex
convex/dev.db*
`;

const dockerComposeContent = `version: '3.8'

services:
  gateway:
    image: traefik:v3.0
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
    ports:
      - "80:80"
      - "8080:8080"
    depends_on:
      - app-service
      - redis-cache

  app-service:
    build: .
    deploy:
      replicas: 3
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis-cache:6379
      - EVENT_BUS_BROKER=eventbus:9092
    depends_on:
      - redis-cache
      - eventbus

  redis-cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  eventbus:
    image: vectorized/redpanda:latest
    ports:
      - "9092:9092"
`;

const circuitBreakerContent = `/**
 * @file Distributed Circuit Breaker & Resilient Dispatcher
 */

export class DistributedCircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private nextAttempt = Date.now();

  constructor(private name: string, private failureThreshold = 3, private recoveryTimeMs = 5000) {}

  async execute<T>(action: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() > this.nextAttempt) {
        this.state = 'HALF_OPEN';
      } else {
        return fallback();
      }
    }

    try {
      const result = await action();
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failureCount = 0;
      }
      return result;
    } catch (err) {
      this.failureCount++;
      if (this.failureCount >= this.failureThreshold) {
        this.state = 'OPEN';
        this.nextAttempt = Date.now() + this.recoveryTimeMs;
      }
      return fallback();
    }
  }
}
`;

export const commonFiles = {
    'src/app/favicon.ico': { base64: faviconBase64Content },
    'next.config.js': nextConfigContent,
    'tsconfig.json': tsConfigContent,
    'postcss.config.js': postcssConfigContent,
    '.gitignore': gitignoreContent,
    'docker-compose.yml': dockerComposeContent,
    'src/lib/circuitBreaker.ts': circuitBreakerContent,
};

