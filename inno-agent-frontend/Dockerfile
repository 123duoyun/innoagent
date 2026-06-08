# syntax=docker/dockerfile:1
# ---- Build Stage ----
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.30.2 --activate
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY inno-agent-frontend/package.json inno-agent-frontend/
RUN pnpm config set registry https://registry.npmmirror.com && pnpm install --frozen-lockfile
COPY inno-agent-frontend/ inno-agent-frontend/
RUN pnpm --filter inno-agent-frontend build

# ---- Production Stage ----
FROM nginx:alpine
COPY --from=builder /app/inno-agent-frontend/dist /usr/share/nginx/html
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 3001;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
EXPOSE 3001
