# CloudBase 云托管 / 任意容器平台：Next.js 自定义 Node 服务（dist/server.js）
FROM node:20-bookworm-slim AS base

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# 项目强制 pnpm（package.json preinstall: only-allow pnpm）
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

COPY package.json pnpm-lock.yaml .npmrc ./

# 构建需要 devDependencies（TypeScript、tsup、Tailwind 等）
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

ENV NODE_ENV=production
ENV COZE_PROJECT_ENV=PROD
# 云托管默认健康检查探测 80（见文档 Readiness probe）；与控制台「容器端口」须一致
# 本地仍可用 scripts/start.sh（默认 5000）；Docker 内用 80 避免与探针端口不一致
ENV PORT=80
ENV HOSTNAME=0.0.0.0

EXPOSE 80

CMD ["node", "dist/server.js"]
