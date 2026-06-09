FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --silent
COPY src/ ./src/
COPY index.html ./
COPY vite.config.* ./

ARG VITE_API_URL=http://localhost:5000
ARG VITE_GEMINI_API_KEY=""
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY
RUN npm run build


FROM node:20-alpine AS production
WORKDIR /app
RUN apk add --no-cache curl

COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --omit=dev --silent
COPY backend/ ./

COPY --from=frontend-builder /app/dist ../frontend/dist

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
