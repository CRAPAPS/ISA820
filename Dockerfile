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

# Supplied at build time from .env.local via docker-compose build args — NOT
# hardcoded. The publishable key is browser-safe by design (it ships in the client
# bundle and can only read, per the RLS lockdown in migration 005), but baking it
# into the image meant it lived in git history and every rotation required a code
# change. Now rotation is an .env.local edit and a rebuild.
#
# Build with:  docker compose --env-file .env.local build
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Fail loudly rather than shipping an image that silently cannot reach Supabase.
RUN test -n "$NEXT_PUBLIC_SUPABASE_URL" || (echo "BUILD ARG NEXT_PUBLIC_SUPABASE_URL is empty — did you pass --env-file .env.local?" && exit 1)
RUN test -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" || (echo "BUILD ARG NEXT_PUBLIC_SUPABASE_ANON_KEY is empty — did you pass --env-file .env.local?" && exit 1)

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

# Also required at RUNTIME, not just at build.
# Next inlines NEXT_PUBLIC_* into the bundles during `npm run build`, which is why
# the builder stage above sets them. But src/server/manuscript-context.ts reads
# them server-side inside the route handler, and this runner stage is a fresh
# image that inherits nothing from the builder. If inlining ever misses that read,
# the Supabase fetch silently returns [] and every analysis degrades to the
# "no manuscript rows" branch — the exact failure the grounding layer exists to
# prevent, and it would look like a model problem rather than a config one.
#
# ARG must be redeclared: build args do not cross stage boundaries.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

CMD ["node", "server.js"]
