# =============================================================================
# TechTregu — Multi-stage Dockerfile
#
# Targets:
#   base        – Development with nodemon + Vite hot-reload (default)
#   build       – CI / builds the client bundle
#   production  – Optimized for deployment (production deps only)
# =============================================================================

# ---- Base Stage (development) -----------------------------------------------
FROM node:20-alpine AS base

WORKDIR /app

# Copy dependency manifests first for better layer caching
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install ALL dependencies (including devDependencies such as nodemon)
RUN npm run install-all

# Copy the rest of the source
COPY . .

EXPOSE 5000

# Default: run client (Vite) + server (nodemon) concurrently with hot-reload
CMD ["npm", "run", "dev"]


# ---- Build Stage (CI / client bundle) ---------------------------------------
FROM base AS build

# Build the client for production
RUN npm run build --prefix client


# ---- Production Stage --------------------------------------------------------
FROM node:20-alpine AS production

WORKDIR /app

# Copy root package.json for the npm start script
COPY package*.json ./

# Copy server dependency manifest
COPY server/package*.json ./server/

# Install only production dependencies
RUN npm ci --production --prefix server

# Copy server source code
COPY server/ ./server/

# Copy pre-built client from the build stage
COPY --from=build /app/client/dist ./client/dist

EXPOSE 5000

# Start the production Node server
CMD ["npm", "start"]
