# ──────────────────────────────────────────
# Stage 1: Build
# ──────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# NEXT_PUBLIC_* vars are inlined at build time by Next.js
ARG NEXT_PUBLIC_API_URL=http://wedi-animal-care.ahlabs.my.id
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/frontend ./apps/frontend

RUN npm install
RUN npm run build --workspace @vet/shared
RUN cd apps/frontend && npx next build

# Archive node_modules as tar for fast Docker layer transfer
RUN tar cf /tmp/node_modules.tar node_modules --exclude='node_modules/.cache'

# ──────────────────────────────────────────
# Stage 2: Production image
# ──────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy root package.json & workspace manifests
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/frontend/package.json ./apps/frontend/package.json

# Extract node_modules from tar (fast single-layer transfer)
COPY --from=builder /tmp/node_modules.tar /tmp/node_modules.tar
RUN tar xf /tmp/node_modules.tar -C /app && \
    rm /tmp/node_modules.tar && \
    chown -R nextjs:nodejs /app/node_modules

# Frontend built artifacts
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/next.config.js ./next.config.js

USER nextjs

EXPOSE 3002

CMD ["./node_modules/.bin/next", "start", "-p", "3002"]
