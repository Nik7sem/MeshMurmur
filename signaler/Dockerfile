FROM oven/bun:1

WORKDIR /app
COPY bun.lock package.json ./
RUN bun install --production --frozen-lockfile

COPY . .

CMD ["bun", "monitor.ts"]