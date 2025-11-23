FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runner

ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/README.md ./README.md
COPY --from=builder /usr/src/app/LICENSE ./LICENSE
COPY --from=builder /usr/src/app/logo.svg ./logo.svg

EXPOSE 8080

CMD ["node", "--experimental-specifier-resolution=node", "--enable-source-maps", "dist/index.js"]


