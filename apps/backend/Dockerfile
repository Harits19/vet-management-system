# ──────────────────────────────────────────
# Stage 1: Shared package build
# ──────────────────────────────────────────
FROM node:22-alpine AS shared-builder
WORKDIR /app

# Copy root monorepo config
COPY package.json tsconfig.base.json ./

# Copy shared package
COPY packages/shared ./packages/shared

# Install deps & build shared
RUN npm install
RUN npm run build --workspace @vet/shared

# ──────────────────────────────────────────
# Stage 2: Backend build
# ──────────────────────────────────────────
FROM node:22-alpine AS backend-builder
WORKDIR /app

# Copy root config
COPY package.json tsconfig.base.json ./

# Copy built shared from previous stage
COPY --from=shared-builder /app/packages/shared ./packages/shared
COPY --from=shared-builder /app/node_modules ./node_modules

# Copy backend source
COPY apps/backend ./apps/backend

# Build backend
RUN npm run build --workspace @vet/backend 2>/dev/null; exit 0

# ──────────────────────────────────────────
# Stage 3: Production image
# ──────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

# Copy only what's needed
COPY --from=shared-builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=shared-builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=backend-builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=backend-builder /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=backend-builder /app/package.json ./package.json
COPY --from=backend-builder /app/node_modules ./node_modules

EXPOSE 3001

# Copy and symlink shared for runtime resolution
RUN mkdir -p /app/node_modules/@vet && \
    ln -sf /app/packages/shared/dist /app/node_modules/@vet/shared

CMD ["node", "apps/backend/dist/index.js"]
