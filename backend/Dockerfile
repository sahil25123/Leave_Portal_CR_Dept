FROM node:22-bookworm-slim AS build

WORKDIR /app

ARG DATABASE_URL=mysql://leave_portal_user:change-me@mysql:3306/leave_portal
ENV DATABASE_URL=${DATABASE_URL}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run prisma:generate

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app /app

EXPOSE 5000

CMD ["node", "index.js"]