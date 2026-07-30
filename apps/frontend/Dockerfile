# ──────────────────────────────────────────
# Stage 1: Build
# ──────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/frontend ./apps/frontend

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

# Root package.json (defines workspaces so @vet/shared resolves locally)
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Shared package dist for runtime
COPY --from=builder --chown=nextjs:nodejs /app/packages/shared ./packages/shared

# Frontend built artifacts
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/package.json ./apps/frontend/package.json
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/next.config.js ./next.config.js

# Symlink @vet/shared so npm workspace resolution works
RUN mkdir -p node_modules/@vet && \
    ln -sf /app/packages/shared/dist node_modules/@vet/shared

# Install production deps (workspace-aware via root package.json)
RUN npm install --omit=dev --workspace @vet/frontend && \
    npm cache clean --force

USER nextjs

EXPOSE 3002

CMD ["npx", "next", "start", "-p", "3002"]
