FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Next.js evaluates database-backed route configuration during the build. Render
# injects the real DATABASE_URL at runtime, so use safe build-only placeholders.
ENV DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/build APP_SECRET=build-only-secret
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
# Apply the schema, then start. The app seeds the demo society on first run against an empty database.
CMD ["sh", "-c", "npm run db:push && npm run start"]
