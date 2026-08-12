FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json drizzle.config.ts ./
COPY drizzle ./drizzle
COPY src ./src

RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start"]
