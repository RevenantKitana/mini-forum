# syntax=docker/dockerfile:1

# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

COPY . .

# Build args for Vite env variables (baked into bundle at compile time)
ARG VITE_API_URL=http://localhost:5000/api/v1
ARG VITE_USE_MOCK_API=false
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_USE_MOCK_API=$VITE_USE_MOCK_API

RUN npm run build

# ─── Stage 2: Production (nginx:alpine ~25 MB) ────────────────────────────────
FROM nginx:1.27-alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# Remove default nginx welcome page
RUN rm -f /usr/share/nginx/html/50x.html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
