# Build the application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_BASE44_USERNAME
ARG VITE_BASE44_PASSWORD
ARG VITE_BASE44_API_URL=https://appforge.fun

ENV VITE_BASE44_USERNAME=$VITE_BASE44_USERNAME
ENV VITE_BASE44_PASSWORD=$VITE_BASE44_PASSWORD
ENV VITE_BASE44_API_URL=$VITE_BASE44_API_URL

# Build the app
RUN npm run build

# Production image
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
