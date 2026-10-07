FROM node:20-slim

# Install native compilation dependencies for better-sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package definitions
COPY package*.json ./

# Install dependencies needed for server runtime (including better-sqlite3)
RUN npm install --omit=dev

# Copy backend server files
COPY server ./server

EXPOSE 3001

ENV PORT=3001 \
    NODE_ENV=production

CMD ["node", "server/index.js"]
