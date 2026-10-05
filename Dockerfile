# Multi-stage build for B.Tech Study Hub
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and client package configs
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd client && npm install

# Copy application source code
COPY . .

# Build the client production assets
RUN cd client && npm run build

# Production runtime stage
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

# Copy built server and client files
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/study_hub.db ./study_hub.db
COPY --from=builder /app/study-materials ./study-materials

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "server/index.js"]
