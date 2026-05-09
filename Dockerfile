# ISA820 - Bible Research Platform
# Production Dockerfile for KVM Deployment

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and config
COPY package*.json ./
COPY tsconfig.json ./
COPY next.config.ts ./
COPY postcss.config.mjs ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src
COPY public ./public

# Build the application
# Env vars are passed at runtime — do NOT bake .env.local into the image
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone server output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
