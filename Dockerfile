# ===== 构建阶段 =====
FROM node:20-alpine AS builder
WORKDIR /app

# 先复制 package.json 安装依赖（利用 Docker 缓存）
COPY package.json package-lock.json ./
RUN npm ci

# 复制源码并构建
COPY . .
RUN npm run build

# ===== 运行阶段 =====
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# 复制构建产物
COPY --from=builder /app/dist ./

# Nginx 配置（SPA 路由 fallback + 模型缓存）
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
