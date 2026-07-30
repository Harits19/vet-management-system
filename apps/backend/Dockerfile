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

RUN npm run build --workspace @vet/backend || true

# ──────────────────────────────────────────
# Stage 3: Production image
# ──────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

# Root package.json (defines workspaces so @vet/shared resolves locally)
COPY --from=backend-builder /app/package.json ./package.json

# Shared package
COPY --from=shared-builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=shared-builder /app/packages/shared/package.json ./packages/shared/package.json

# Backend
COPY --from=backend-builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=backend-builder /app/apps/backend/package.json ./apps/backend/package.json

# Symlink @vet/shared so npm workspace resolution works
RUN mkdir -p node_modules/@vet && \
    ln -sf /app/packages/shared/dist node_modules/@vet/shared

# Install production deps from root (resolves workspace deps locally)
RUN npm install --omit=dev --workspace @vet/backend && \
    npm cache clean --force

EXPOSE 3001

CMD ["node", "apps/backend/dist/index.js"]
