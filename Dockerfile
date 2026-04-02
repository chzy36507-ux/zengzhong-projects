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
# 云托管一般注入 PORT；未设置时与本地脚本一致用 5000
ENV PORT=5000
ENV HOSTNAME=0.0.0.0

EXPOSE 5000

CMD ["node", "dist/server.js"]
