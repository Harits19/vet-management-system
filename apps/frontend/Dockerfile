# ──────────────────────────────────────────
# Stage 1: Build
# ──────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Copy root config
COPY package.json tsconfig.base.json ./

# Copy shared package
COPY packages/shared ./packages/shared

# Copy frontend
COPY apps/frontend ./apps/frontend

# Install deps & build shared + frontend
RUN npm install
RUN npm run build --workspace @vet/shared
RUN cd apps/frontend && npx next build

# ──────────────────────────────────────────
# Stage 2: Serve via Node
# ──────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

COPY --from=builder /app/apps/frontend/.next ./.next
COPY --from=builder /app/apps/frontend/package.json ./package.json
COPY --from=builder /app/apps/frontend/next.config.js ./next.config.js
COPY --from=builder /app/apps/frontend/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3002

CMD ["npx", "next", "start", "-p", "3002"]
