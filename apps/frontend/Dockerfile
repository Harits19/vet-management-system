# ──────────────────────────────────────────
# Stage 1: Build
# ──────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Root config
COPY package.json tsconfig.base.json ./

# Shared package
COPY packages/shared ./packages/shared

# Frontend source
COPY apps/frontend ./apps/frontend

# Install ALL deps for build
RUN npm install
RUN npm run build --workspace @vet/shared
RUN cd apps/frontend && npx next build

# ──────────────────────────────────────────
# Stage 2: Production image
# ──────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built artifacts
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next ./.next
COPY --from=builder /app/apps/frontend/package.json ./package.json
COPY --from=builder /app/apps/frontend/next.config.js ./next.config.js

# Install ONLY production deps (fast, small)
RUN npm install --omit=dev && \
    npm cache clean --force

USER nextjs

EXPOSE 3002

CMD ["npx", "next", "start", "-p", "3002"]
