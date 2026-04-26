# =============================================================================
# Stage 1: Dependencies
# =============================================================================
FROM node:22-alpine AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

ENV SHARP_IGNORE_GLOBAL_LIBVIPS=1
RUN npm ci --include=dev


# =============================================================================
# Stage 2: Builder
# =============================================================================
FROM node:22-alpine AS builder

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Dummy DATABASE_URL satisfies prisma.config.ts at generate time (no DB connection made)
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Stub all secrets so API route modules don't crash during static page collection.
# These are NEVER baked into the final image — Next.js only reads them while
# bundling. Real values come from .env / docker-compose at runtime.
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" \
    NEXTAUTH_SECRET="stub" \
    NEXTAUTH_URL="http://localhost:3000" \
    GOOGLE_CLIENT_ID="stub" \
    GOOGLE_CLIENT_SECRET="stub" \
    RAZORPAY_KEY_ID="stub" \
    RAZORPAY_KEY_SECRET="stub" \
    NEXT_PUBLIC_RAZORPAY_KEY_ID="stub" \
    REDIS_HOST="localhost" \
    REDIS_PORT="6379" \
    npm run build


# =============================================================================
# Stage 3: Runner (minimal production image)
# =============================================================================
FROM node:22-alpine AS runner

RUN apk add --no-cache libc6-compat tini

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV SHARP_IGNORE_GLOBAL_LIBVIPS=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/app/generated ./app/generated
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/sharp ./node_modules/sharp

RUN mkdir -p ./public/uploads/images ./data \
    && chown -R nextjs:nodejs ./public/uploads ./data

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]

# =============================================================================
# Stage 4: Migrator (has full node_modules + prisma CLI)
# =============================================================================
FROM node:22-alpine AS migrator

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/app/generated ./app/generated

CMD ["node_modules/.bin/prisma", "migrate", "deploy"]