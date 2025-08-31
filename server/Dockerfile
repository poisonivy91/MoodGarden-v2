# --------------------------
# Stage 1: Build React app
# --------------------------
FROM node:18 AS build

WORKDIR /app

# Copy client files
COPY ../client ./client

WORKDIR /app/client

RUN npm install
RUN npm run build

# --------------------------
# Stage 2: Run Express server
# --------------------------
FROM node:18

WORKDIR /app

# Copy server package.json first for caching
COPY package*.json ./

RUN npm install

# Copy server source
COPY . .

# Copy React build output into server's /public folder
COPY --from=build /app/client/dist ./public

# Expose port
EXPOSE 8080

# Start server
CMD ["node", "index.js"]

