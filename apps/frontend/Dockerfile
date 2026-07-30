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

EXPOSE 3002

# Copy everything from the builder
# (node_modules already has all deps including next)
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/frontend/.next ./.next
COPY --from=builder /app/apps/frontend/package.json ./apps/frontend/package.json
COPY --from=builder /app/apps/frontend/next.config.js ./next.config.js

CMD ["./node_modules/.bin/next", "start", "-p", "3002"]
