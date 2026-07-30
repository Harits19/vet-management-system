# ──────────────────────────────────────────
# Stage 1: Shared package build
# ──────────────────────────────────────────
FROM node:22-alpine AS shared-builder
WORKDIR /app

COPY package.json tsconfig.base.json ./
COPY packages/shared ./packages/shared

RUN npm install
RUN npm run build --workspace @vet/shared

# ──────────────────────────────────────────
# Stage 2: Backend build
# ──────────────────────────────────────────
FROM node:22-alpine AS backend-builder
WORKDIR /app

COPY package.json tsconfig.base.json ./
COPY --from=shared-builder /app/packages/shared ./packages/shared
COPY --from=shared-builder /app/node_modules ./node_modules
COPY apps/backend ./apps/backend

# Build backend
RUN npm run build --workspace @vet/backend || true

# ──────────────────────────────────────────
# Stage 3: Production image (small)
# ──────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

# Copy built artifacts
COPY --from=shared-builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=shared-builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=backend-builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=backend-builder /app/apps/backend/package.json ./apps/backend/package.json

# Symlink shared package for runtime resolution
RUN mkdir -p /app/node_modules/@vet && \
    ln -sf /app/packages/shared/dist /app/node_modules/@vet/shared

# Install ONLY production deps (small & fast)
COPY --from=backend-builder /app/apps/backend/package.json ./apps/backend/package.json
WORKDIR /app/apps/backend
RUN npm install --omit=dev && \
    npm cache clean --force

WORKDIR /app

EXPOSE 3001

CMD ["node", "apps/backend/dist/index.js"]
