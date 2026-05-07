# Stage 1: Build the React Frontend
FROM node:20-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
ENV NODE_OPTIONS="--max_old_space_size=4096"
COPY . .
RUN npm run build

# Stage 2: Run the Express Backend
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY --from=build-stage /app/dist ./dist
COPY server ./server
EXPOSE 3001 5173
CMD ["node", "server/index.js"]
